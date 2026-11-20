import {Prisma, ReceiptType} from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '@client';
import {ApiError} from '@utils/index';
import {FINE_ITEM_NAME} from '@utils/calculations';
import type {BillInput, CheckStockInput} from '@validations/billing.validation';

/**
 * Billing, ported from the original billing service:
 *  - DRAFT: bill and its items are saved; stock and balances are not touched.
 *  - BILL (completed): every item is deducted from stock (must be available),
 *    a "Sale" line is written to client history, the customer's metal (advance)
 *    is added to fine silver stock, and the client's balance moves to the bill's
 *    Remaining Balance.
 *  - Edit reverses the old completed bill and applies the new one; delete reverses it.
 * Changes from the original: GOLD -> SILVER (fine metal of this app); the client
 * balance moves by (remaining - due) so it ends at the Remaining Balance shown on the
 * bill; delete/edit restore every item (the original restored only GOLD items).
 */

type Tx = Prisma.TransactionClient;
const EPS = 0.0005;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const receiptInclude = {
    client: true,
    receiptItems: {include: {item: true, size: true}},
} satisfies Prisma.receiptInclude;

/**
 * Stock rows for an item/purity (and size, when the bill row has one). Billing has no size,
 * so without a size every size row of that item/purity matches; the no-size row comes first.
 * SILVER at 100% also matches the fine row (no purity).
 */
const findStocks = async (
    tx: Tx | typeof prisma,
    adminId: string,
    itemId: string,
    sizeId: string | null,
    purity: number,
    productCode?: string | null,
) => {
    const rows = await tx.stock.findMany({
        where: {adminId, itemId, ...(sizeId ? {sizeId} : {})},
        include: {item: true},
        orderBy: {createdAt: 'asc'},
    });
    const matches = rows.filter(
        (r) => (r.purity !== null && Math.abs(r.purity - purity) < 0.001) || (r.purity === null && Math.abs(purity - 100) < 0.001),
    );
    // Order: the scanned product's own row (PRD-xxxxxxxx = start of its id), then loose stock,
    // then the no-size row before size rows
    const code = String(productCode || '').trim().toLowerCase().replace(/^prd-/, '');
    const rank = (r: (typeof matches)[number]) =>
        (code.length >= 8 && r.id.toLowerCase().startsWith(code) ? 0 : 4) +
        (r.kind === 'LOOSE' ? 0 : 2) +
        Number(r.sizeId !== null);
    return matches.sort((a, b) => rank(a) - rank(b));
};

/** Move a client's balance (and `due`, when that field is in use) by delta */
const adjustClientBalance = async (tx: Tx, clientId: string, delta: number) => {
    const c = await tx.client.findUniqueOrThrow({where: {id: clientId}});
    await tx.client.update({
        where: {id: clientId},
        data: {
            openingBalance: {increment: delta},
            ...(c.due !== null ? {due: {increment: delta}} : {}),
        },
    });
};

class BillingService {
    async checkStock(adminId: string, data: CheckStockInput) {
        const stocks = await findStocks(prisma, adminId, data.itemId, data.sizeId ?? null, data.purity);
        // Last wastage (grams) charged to this client for the same item/purity
        const lastItem = data.customerId
            ? await prisma.receiptItem.findFirst({
                  where: {
                      receipt: {adminId, clientID: data.customerId},
                      itemID: data.itemId,
                      purity: data.purity,
                  },
                  orderBy: {createdAt: 'desc'},
                  select: {srp: true},
              })
            : null;
        return {weight: round3(stocks.reduce((sum, r) => sum + r.weight, 0)), srp: round3(lastItem?.srp ?? 0)};
    }

    private async nextBillNumber(tx: Tx, adminId: string) {
        const last = await tx.receipt.findFirst({
            where: {adminId},
            orderBy: {billNumber: 'desc'},
            select: {billNumber: true},
        });
        const n = last?.billNumber.match(/^BILL(\d+)$/i);
        return `BILL${String(n ? parseInt(n[1], 10) + 1 : 1).padStart(5, '0')}`;
    }

    private async fineSilverStock(tx: Tx, adminId: string) {
        let item = await tx.item.findFirst({where: {adminId, name: FINE_ITEM_NAME}});
        if (!item) item = await tx.item.create({data: {adminId, name: FINE_ITEM_NAME}});
        const stock = await tx.stock.findFirst({
            where: {adminId, itemId: item.id, sizeId: null, purity: null},
        });
        return {item, stock};
    }

    /** Completed bill: stock out, customer metal in, client balance to remaining */
    private async applyBill(
        tx: Tx,
        adminId: string,
        receiptId: string,
        billNumber: string,
        data: BillInput,
        currentDue: number,
    ) {
        for (const item of data.items) {
            const stocks = await findStocks(tx, adminId, item.itemId, item.sizeId ?? null, item.purity, item.productCode);
            const available = stocks.reduce((sum, r) => sum + r.weight, 0);
            if (available + EPS < item.grossWeight) {
                const name = stocks[0]?.item.name || (await tx.item.findUnique({where: {id: item.itemId}}))?.name;
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Insufficient stock for ${name || 'item'} at ${item.purity}%: available ${round3(available)} G, needed ${round3(item.grossWeight)} G`,
                );
            }
            // Take the weight from the matching rows in order (no-size row first)
            let left = item.grossWeight;
            for (const stock of stocks) {
                if (left <= EPS) break;
                const take = Math.min(left, stock.weight);
                if (take <= 0) continue;
                await tx.stock.update({where: {id: stock.id}, data: {weight: {decrement: take}}});
                await tx.stockHistory.create({
                    data: {
                        adminId,
                        itemId: item.itemId,
                        sizeId: stock.sizeId,
                        purity: item.purity,
                        remark: 'Outward',
                        weight: take,
                    },
                });
                left -= take;
            }
            if (left > EPS) {
                // Rounding leftover: take it from the first row
                await tx.stock.update({where: {id: stocks[0].id}, data: {weight: {decrement: left}}});
            }
            await tx.clientHistory.create({
                data: {
                    clientId: data.clientId,
                    billNumber,
                    itemId: item.itemId,
                    sizeId: item.sizeId ?? null,
                    purity: item.purity,
                    remark: 'Sale',
                    weight: item.grossWeight,
                    receiptId,
                },
            });
        }

        if (data.customerWeight > 0) {
            const {item, stock} = await this.fineSilverStock(tx, adminId);
            if (stock) {
                await tx.stock.update({where: {id: stock.id}, data: {weight: {increment: data.customerWeight}}});
            } else {
                await tx.stock.create({data: {adminId, itemId: item.id, weight: data.customerWeight}});
            }
            await tx.stockHistory.create({
                data: {adminId, itemId: item.id, sizeId: null, purity: null, remark: 'Received', weight: data.customerWeight},
            });
            await tx.clientHistory.create({
                data: {
                    clientId: data.clientId,
                    billNumber,
                    itemId: item.id,
                    remark: 'Received',
                    weight: data.customerWeight,
                    receiptId,
                },
            });
        }

        // Client balance ends at the bill's Remaining Balance (= fine + due - advance)
        const due = data.dueBalance ?? currentDue;
        const balanceDelta = round3(data.remainingWeight - due);
        await adjustClientBalance(tx, data.clientId, balanceDelta);
        return balanceDelta;
    }

    /** Undo a completed bill (stock back, customer metal out, balance back, history removed) */
    private async revertBill(tx: Tx, adminId: string, receipt: Prisma.receiptGetPayload<{include: typeof receiptInclude}>) {
        for (const item of receipt.receiptItems) {
            const [stock] = await findStocks(tx, adminId, item.itemID, item.sizeID, item.purity, item.productCode);
            if (stock) {
                await tx.stock.update({where: {id: stock.id}, data: {weight: {increment: item.grossWeight}}});
            } else {
                await tx.stock.create({
                    data: {
                        adminId,
                        itemId: item.itemID,
                        sizeId: item.sizeID,
                        purity: item.purity,
                        weight: item.grossWeight,
                        design: item.design,
                        stamp: item.stamp,
                    },
                });
            }
            await tx.stockHistory.create({
                data: {
                    adminId,
                    itemId: item.itemID,
                    sizeId: stock?.sizeId ?? item.sizeID,
                    purity: item.purity,
                    remark: 'Inward',
                    weight: item.grossWeight,
                },
            });
        }
        if (receipt.customerWeight > 0) {
            const {item, stock} = await this.fineSilverStock(tx, adminId);
            if (stock) {
                await tx.stock.update({where: {id: stock.id}, data: {weight: {decrement: receipt.customerWeight}}});
            }
            await tx.stockHistory.create({
                data: {adminId, itemId: item.id, sizeId: null, purity: null, remark: 'Given', weight: receipt.customerWeight},
            });
        }
        await adjustClientBalance(tx, receipt.clientID, -receipt.balanceDelta);
        await tx.clientHistory.deleteMany({where: {receiptId: receipt.id}});
    }

    private itemRows(data: BillInput) {
        return data.items.map((i) => ({
            itemID: i.itemId,
            sizeID: i.sizeId ?? null,
            purity: i.purity,
            grossWeight: i.grossWeight,
            srp: i.srp,
            fineWeight: i.fineWeight,
            laborRate: i.laborRate,
            laborType: i.laborType,
            design: i.design,
            stamp: i.stamp,
            productCode: i.productCode,
        }));
    }

    private async ownClient(adminId: string, clientId: string) {
        const client = await prisma.client.findFirst({where: {id: clientId, adminId}});
        if (!client) throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
        return client;
    }

    async create(adminId: string, data: BillInput) {
        const client = await this.ownClient(adminId, data.clientId);
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                return await prisma.$transaction(async (tx) => {
                    const billNumber = await this.nextBillNumber(tx, adminId);
                    const receipt = await tx.receipt.create({
                        data: {
                            adminId,
                            clientID: data.clientId,
                            billNumber,
                            receiptDate: data.receiptDate ?? new Date(),
                            type: data.type as ReceiptType,
                            totalWeight: data.totalWeight,
                            customerWeight: data.customerWeight,
                    advanceItems: data.advanceItems.filter((r) => r.grossWt > 0 || r.fineWt > 0),
                            remainingWeight: data.remainingWeight,
                            dueBalance: data.dueBalance,
                            totalBill: data.totalBill,
                            receiptItems: {create: this.itemRows(data)},
                        },
                    });
                    if (data.type === 'BILL') {
                        const balanceDelta = await this.applyBill(
                            tx,
                            adminId,
                            receipt.id,
                            billNumber,
                            data,
                            client.openingBalance,
                        );
                        await tx.receipt.update({where: {id: receipt.id}, data: {balanceDelta}});
                    }
                    return tx.receipt.findUniqueOrThrow({where: {id: receipt.id}, include: receiptInclude});
                });
            } catch (err) {
                // Two bills saved at the same moment got the same number: try the next one
                if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
                throw err;
            }
        }
        throw new ApiError(httpStatus.CONFLICT, 'Could not generate a bill number, please try again');
    }

    async getAll(adminId: string) {
        return prisma.receipt.findMany({where: {adminId}, include: receiptInclude, orderBy: {createdAt: 'desc'}});
    }

    async getById(adminId: string, id: string) {
        const receipt = await prisma.receipt.findFirst({where: {id, adminId}, include: receiptInclude});
        if (!receipt) throw new ApiError(httpStatus.NOT_FOUND, 'Bill not found');
        return receipt;
    }

    async update(adminId: string, id: string, data: BillInput) {
        const existing = await this.getById(adminId, id);
        await this.ownClient(adminId, data.clientId);
        return prisma.$transaction(async (tx) => {
            if (existing.type === 'BILL') await this.revertBill(tx, adminId, existing);
            await tx.receiptItem.deleteMany({where: {receiptID: id}});
            await tx.receipt.update({
                where: {id},
                data: {
                    clientID: data.clientId,
                    receiptDate: data.receiptDate ?? existing.receiptDate,
                    type: data.type as ReceiptType,
                    totalWeight: data.totalWeight,
                    customerWeight: data.customerWeight,
                    advanceItems: data.advanceItems.filter((r) => r.grossWt > 0 || r.fineWt > 0),
                    remainingWeight: data.remainingWeight,
                    dueBalance: data.dueBalance,
                    totalBill: data.totalBill,
                    balanceDelta: 0,
                    receiptItems: {create: this.itemRows(data)},
                },
            });
            if (data.type === 'BILL') {
                // Balance after reverting the old bill is the client's current due
                const client = await tx.client.findUniqueOrThrow({where: {id: data.clientId}});
                const balanceDelta = await this.applyBill(tx, adminId, id, existing.billNumber, data, client.openingBalance);
                await tx.receipt.update({where: {id}, data: {balanceDelta}});
            }
            return tx.receipt.findUniqueOrThrow({where: {id}, include: receiptInclude});
        });
    }

    async remove(adminId: string, id: string) {
        const existing = await this.getById(adminId, id);
        return prisma.$transaction(async (tx) => {
            if (existing.type === 'BILL') await this.revertBill(tx, adminId, existing);
            await tx.receipt.delete({where: {id}});
            return {id};
        });
    }
}

export default new BillingService();
