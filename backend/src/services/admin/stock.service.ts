/* eslint-disable no-constant-binary-expression */
import {z} from 'zod';
import prisma from '@client';
import {stockValidation} from '@validations/index';
import ApiError from '@utils/ApiError';
import httpStatus from 'http-status';
// import {Prisma} from '@prisma/client';
import {round3, FINE_ITEM_NAME} from '@utils/calculations';

type CreateStockInput = z.infer<typeof stockValidation.stockSchema>;
type IncrementStockInput = z.infer<typeof stockValidation.stockIncreemnt>;
class StockService {
    async create(adminId: string, data: CreateStockInput) {
        if (data.weight < 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Stock weight cannot be negative');
        }
        const item = await prisma.item.findUnique({
            where: {id: data.itemId},
        });
        // Same item + size + purity must stay one row (the DB unique rule ignores empty size)
        const duplicate = await prisma.stock.findFirst({
            where: {adminId, itemId: data.itemId, sizeId: data.sizeId ?? null, purity: data.purity, kind: 'PRODUCT'},
        });
        if (duplicate) {
            throw new ApiError(
                httpStatus.CONFLICT,
                'Stock for this item, size and purity already exists',
            );
        }
        const stock = await prisma.stock.create({
            data: {
                itemId: data.itemId,
                sizeId: data.sizeId ?? null,
                weight: data.weight,
                purity: data.purity,
                design: data.design || null,
                stamp: data.stamp || null,
                adminId: adminId,
            },
        });
        if (item && item.name === FINE_ITEM_NAME && data.weight !== 0) {
            const totalStock = await prisma.stock.aggregate({
                _sum: {
                    weight: true,
                },
                where: {
                    adminId: adminId,
                    item: {
                        name: FINE_ITEM_NAME,
                    },
                },
            });
            const afterStock = totalStock._sum.weight || 0;
            await prisma.silverHistory.create({
                data: {
                    type: data.weight > 0 ? 'INWARD' : 'OUTWARD',
                    weight: Math.abs(data.weight),
                    adminId: adminId,
                    itemId: stock.itemId,
                    sizeId: stock.sizeId,
                    afterStock: afterStock,
                    note: 'Stock created',
                },
            });
        }
        if (data.weight !== 0) {
            await prisma.stockHistory.create({
                data: {
                    adminId: adminId,
                    itemId: stock.itemId,
                    sizeId: stock.sizeId,
                    purity: stock.purity,
                    remark: data.weight > 0 ? `INWARD` : 'OUTWARD',
                    weight: Math.abs(data.weight),
                    isManual: true,
                },
            });
        }
        return stock;
    }

    async getAll(adminId: string) {
        // Ensure the fine silver item and its 100% stock row exist for this admin.
        // A per-admin lock stops two simultaneous page loads from creating duplicates.
        await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${adminId}))`;
            let fineItem = await tx.item.findFirst({
                where: {adminId, name: FINE_ITEM_NAME},
            });
            if (!fineItem) {
                fineItem = await tx.item.create({data: {name: FINE_ITEM_NAME, adminId}});
            }
            const fineStock = await tx.stock.findFirst({
                where: {adminId, itemId: fineItem.id, sizeId: null, purity: null},
            });
            if (!fineStock) {
                await tx.stock.create({data: {itemId: fineItem.id, weight: 0, adminId}});
            }
        });

        const stocks = await prisma.stock.findMany({
            where: {
                adminId: adminId,
            },
            include: {
                item: true,
                size: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return stocks.map((s) => ({
            ...s,
            weight: round3(s.weight),
        }));
    }

    async getById(id: string) {
        const stock = await prisma.stock.findUnique({
            where: {id},
            include: {
                item: true,
                size: true,
            },
        });
        if (!stock) return null;
        return {
            ...stock,
            weight: round3(stock.weight),
        };
    }

    async update(id: string, data: Partial<CreateStockInput>) {
        const stock = await prisma.stock.findFirst({
            where: {id},
            include: {item: true, size: true},
        });
        if (!stock) throw new Error('Stock not found');

        if (data.weight !== undefined && data.weight < 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Stock weight cannot be negative');
        }

        const updatedStock = await prisma.stock.update({
            where: {id},
            data: {
                ...data,
            },
        });

        if (stock.item.name === FINE_ITEM_NAME && data.weight !== undefined) {
            const diff = data.weight - stock.weight;
            if (diff !== 0) {
                const totalStock = await prisma.stock.aggregate({
                    _sum: {
                        weight: true,
                    },
                    where: {
                        adminId: stock.adminId,
                        item: {
                            name: FINE_ITEM_NAME,
                        },
                    },
                });
                const afterStock = totalStock._sum.weight || 0;
                await prisma.silverHistory.create({
                    data: {
                        type: diff > 0 ? 'INWARD' : 'OUTWARD',
                        weight: Math.abs(diff),
                        adminId: stock.adminId,
                        itemId: stock.itemId,
                        sizeId: stock.sizeId,
                        afterStock: afterStock,
                        note: 'Stock updated',
                    },
                });
            }
        }
        if (data.weight !== undefined) {
            const diff = data.weight - stock.weight;
            if (diff !== 0) {
                await prisma.stockHistory.create({
                    data: {
                        adminId: stock.adminId,
                        itemId: stock.itemId,
                        sizeId: stock.sizeId,
                        purity: stock.purity,
                        remark: diff > 0 ? 'INWARD' : 'OUTWARD',
                        weight: Math.abs(diff),
                    },
                });
            }
        }
        return updatedStock;
    }

    async remove(id: string) {
        const stock = await prisma.stock.findFirst({
            where: {id},
            include: {item: true},
        });
        if (!stock) throw new Error('Stock not found');

        const deletedStock = await prisma.stock.delete({
            where: {id},
        });

        if (stock.item.name === FINE_ITEM_NAME && stock.weight !== 0) {
            const totalStock = await prisma.stock.aggregate({
                _sum: {
                    weight: true,
                },
                where: {
                    adminId: stock.adminId,
                    item: {
                        name: FINE_ITEM_NAME,
                    },
                },
            });
            const afterStock = totalStock._sum.weight || 0;
            await prisma.silverHistory.create({
                data: {
                    type: 'OUTWARD',
                    weight: stock.weight,
                    adminId: stock.adminId,
                    itemId: stock.itemId,
                    sizeId: stock.sizeId,
                    afterStock: afterStock,
                    note: 'Stock deleted',
                },
            });
        }
        if (stock.weight !== 0) {
            await prisma.stockHistory.create({
                data: {
                    adminId: stock.adminId,
                    itemId: stock.itemId,
                    sizeId: stock.sizeId,
                    purity: stock.purity,
                    remark: 'OUTWARD',
                    weight: stock.weight,
                },
            });
        }
        return deletedStock;
    }
    async incrementStock(id: string, data: IncrementStockInput) {
        const stock = await prisma.stock.findFirst({
            where: {id},
            include: {item: true},
        });
        if (!stock) {
            throw new Error('Stock not found');
        }

        if (data.type === 'OUTWARD' && stock.weight < data.stockQty) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `${stock.item.name} stock is not sufficient`,
            );
        }

        const weightChange = data.type === 'INWARD' ? data.stockQty : -data.stockQty;

        const updatedStock = await prisma.stock.update({
            where: {id},
            data: {
                weight: {
                    increment: weightChange,
                },
            },
        });

        const totalStock = await prisma.stock.aggregate({
            _sum: {
                weight: true,
            },
            where: {
                adminId: stock.adminId,
                item: {
                    name: 'SILVER',
                },
            },
        });
        const afterStock = totalStock._sum.weight || 0;

        await prisma.silverHistory.create({
            data: {
                type: data.type,
                weight: data.stockQty,
                adminId: stock.adminId,
                itemId: stock.itemId,
                sizeId: stock.sizeId,
                afterStock: afterStock,
                note:
                    data.note ||
                    (data.type === 'INWARD' ? 'Stock incremented' : 'Stock decremented'),
            },
        });
        // const inward;
        await prisma.stockHistory.create({
            data: {
                adminId: stock.adminId,
                itemId: stock.itemId,
                sizeId: stock.sizeId,
                purity: stock.purity,
                remark:
                    `${data.type} ${data.note}` || (data.type === 'INWARD' ? 'INWARD' : 'OUTWARD'),
                weight: weightChange,
                isManual: true,
            },
        });

        return updatedStock;
    }
    async getStockHistory(id: string) {
        const stock = await prisma.stock.findFirst({
            where: {id},
            include: {item: true, size: true},
        });
        if (!stock) throw new Error('Stock not found');
        const history = await prisma.stockHistory.findMany({
            where: {
                itemId: stock.itemId,
                sizeId: stock.sizeId,
                purity: stock.purity,
            },
            include: {
                item: true,
                size: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return {history};
    }

    /**
     * Dashboard (Real-Time report): stock by item, scrap, Galai work in progress
     * (server-side stage) and client dues. Other stages live in the browser and are
     * added by the page itself.
     */
    async myCurrentStock(adminId: string) {
        const fine = (gross: number, purity: number | null) =>
            round3((gross * (purity ?? 100)) / 100);

        const stocks = await prisma.stock.findMany({
            where: {adminId, weight: {gt: 0.0005}},
            include: {item: true, size: true},
            orderBy: {createdAt: 'asc'},
        });
        const toRow = (s: (typeof stocks)[number]) => ({
            id: s.id,
            name: [
                s.item.name,
                s.design,
                s.size?.size,
                s.purity !== null ? `${s.purity}%` : '100%',
            ]
                .filter(Boolean)
                .join(' · '),
            grossWeight: round3(s.weight),
            fineWeight: fine(s.weight, s.purity),
            purity: s.purity ?? 100,
        });
        const silver = stocks.filter((s) => s.item.name.toUpperCase() === FINE_ITEM_NAME);
        const others = stocks.filter((s) => s.item.name.toUpperCase() !== FINE_ITEM_NAME);

        const scrapGroups = await prisma.processEntry.groupBy({
            by: ['process', 'purity'],
            where: {adminId, status: 'COMPLETED', scrapWeight: {gt: 0.0005}},
            _sum: {scrapWeight: true},
        });

        const [galaiPending, galaiCards] = await Promise.all([
            prisma.processEntry.findMany({where: {adminId, process: 'GALAI', status: 'PENDING'}}),
            prisma.processStockCard.findMany({
                where: {adminId, process: 'GALAI', availableWeight: {gt: 0.0005}},
            }),
        ]);

        const clients = await prisma.client.findMany({where: {adminId}});

        return {
            stocks: {
                gold: silver.map(toRow),
                stock: others.map(toRow),
                scrap: scrapGroups.map((g) => ({
                    id: `scrap-${g.process}-${g.purity}`,
                    name: `${g.process.charAt(0)}${g.process.slice(1).toLowerCase()} Scrap · ${g.purity}%`,
                    grossWeight: round3(g._sum.scrapWeight ?? 0),
                    fineWeight: fine(g._sum.scrapWeight ?? 0, g.purity),
                    purity: g.purity,
                })),
            },
            processes: {
                galai: [
                    ...galaiPending.map((e) => ({
                        id: e.id,
                        name: `${e.particular || 'Galai'} (in process)`,
                        grossWeight: round3(e.grossWt),
                        fineWeight: round3(e.expectedFine),
                        purity: e.purity,
                    })),
                    ...galaiCards.map((c) => ({
                        id: c.id,
                        name: `Galai stock card${c.stamp ? ` · ${c.stamp}` : ''}`,
                        grossWeight: round3(c.availableWeight),
                        fineWeight: fine(c.availableWeight, c.purity),
                        purity: c.purity,
                    })),
                ],
            },
            clientDues: clients
                .map((c) => ({
                    id: c.id,
                    clientName: c.fullName,
                    due: round3(c.due ?? c.openingBalance ?? 0),
                }))
                .filter((c) => c.due > 0),
        };
    }

    /** Loss report: saved manufacturing rows with a loss (server-side stages) */
    async lossReport(adminId: string) {
        const rows = await prisma.processEntry.findMany({
            where: {adminId, status: 'COMPLETED', loss: {gt: 0.0005}},
            orderBy: {completedAt: 'desc'},
        });
        return rows.map((r) => ({
            id: r.id,
            createdAt: (r.completedAt ?? r.updatedAt).toISOString(),
            process: r.process.charAt(0) + r.process.slice(1).toLowerCase(),
            particular: r.particular || r.process,
            purity: r.purity,
            grossWt: round3(r.grossWt),
            loss: round3(r.loss ?? 0),
        }));
    }

    /** Daily report for one date (default today): server-side data for that day */
    async todayReport(adminId: string, dateStr?: string) {
        const day = dateStr ? new Date(dateStr) : new Date();
        if (isNaN(day.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date');
        const from = new Date(day);
        from.setHours(0, 0, 0, 0);
        const to = new Date(day);
        to.setHours(23, 59, 59, 999);
        const inDay = {gte: from, lte: to};
        const label = (p: string) => p.charAt(0) + p.slice(1).toLowerCase();

        const [entries, history, clientHist, bills] = await Promise.all([
            prisma.processEntry.findMany({
                where: {adminId, OR: [{createdAt: inDay}, {completedAt: inDay}]},
                orderBy: {createdAt: 'desc'},
            }),
            prisma.stockHistory.findMany({
                where: {adminId, createdAt: inDay},
                include: {item: true, size: true},
                orderBy: {createdAt: 'desc'},
            }),
            prisma.clientHistory.findMany({
                where: {client: {adminId}, createdAt: inDay, remark: {in: ['Received', 'Settle', 'Advance']}},
                include: {client: true},
                orderBy: {createdAt: 'desc'},
            }),
            prisma.receipt.findMany({
                where: {adminId, createdAt: inDay},
                include: {client: true, receiptItems: {include: {item: true, size: true}}},
                orderBy: {createdAt: 'desc'},
            }),
        ]);

        const processAll = entries.map((e) => ({
            id: e.id,
            name: e.particular || label(e.process),
            processName: label(e.process),
            grossWeight: round3(e.grossWt),
            fineWeight: round3(e.fineWeight ?? e.expectedFine),
            purity: e.purity,
            isCompleted: e.status === 'COMPLETED',
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
            scrap: round3(e.scrapWeight ?? 0),
            loss: round3(e.loss ?? 0),
        }));
        const losses = entries
            .filter((e) => e.status === 'COMPLETED' && (e.loss ?? 0) > 0.0005 && e.completedAt && e.completedAt >= from && e.completedAt <= to)
            .map((e) => ({
                id: e.id,
                particular: e.particular || label(e.process),
                processName: label(e.process),
                purity: e.purity,
                loss: round3(e.loss ?? 0),
                weight: round3(e.grossWt),
                createdAt: (e.completedAt ?? e.updatedAt).toISOString(),
            }));
        const isOut = (h: (typeof history)[number]) => h.weight < 0 || /^outward|given/i.test(h.remark);
        const stockRow = (h: (typeof history)[number]) => ({
            id: h.id,
            name: h.item.name,
            itemName: h.item.name,
            size: h.size?.size,
            grossWeight: round3(Math.abs(h.weight)),
            purity: h.purity,
            fineWeight: round3((Math.abs(h.weight) * (h.purity ?? 100)) / 100),
            remark: h.remark,
            isManual: h.isManual,
            createdAt: h.createdAt.toISOString(),
        });
        const inward = history.filter((h) => !isOut(h)).map(stockRow);
        const outward = history.filter(isOut).map(stockRow);
        const newStock = history.filter((h) => h.isManual && !isOut(h)).map(stockRow);
        const duePaid = clientHist.map((h) => ({
            id: h.id,
            clientName: h.client.fullName,
            duePaid: round3(h.weight),
            purity: h.purity ?? undefined,
            remark: h.remark,
            createdAt: h.createdAt.toISOString(),
        }));
        const billRows = bills.map((b) => ({
            id: b.id,
            billNumber: b.billNumber,
            clientName: b.client.fullName,
            type: b.type,
            totalWeight: round3(b.totalWeight),
            customerWeight: round3(b.customerWeight),
            remainingWeight: round3(b.remainingWeight),
            receiptDate: b.receiptDate?.toISOString(),
            createdAt: b.createdAt.toISOString(),
            itemsCount: b.receiptItems.length,
            items: b.receiptItems.map((i) => ({
                id: i.id,
                itemName: i.item.name,
                size: i.size?.size,
                purity: i.purity,
                weight: round3(i.grossWeight),
                fineWeight: round3(i.fineWeight),
                srp: i.srp,
                laborRate: i.laborRate,
            })),
        }));
        const sum = (a: any[], k: string) => round3(a.reduce((t, x) => t + (Number(x[k]) || 0), 0));

        return {
            date: from.toISOString(),
            summary: {
                totalProcessWeight: sum(processAll, 'grossWeight'),
                totalProcessFineWeight: sum(processAll, 'fineWeight'),
                totalDuePaidWeight: sum(duePaid, 'duePaid'),
                totalLossWeight: sum(losses, 'loss'),
                totalStockInwardWeight: sum(inward, 'grossWeight'),
                totalStockOutwardWeight: sum(outward, 'grossWeight'),
                totalNewStockWeight: sum(newStock, 'grossWeight'),
                totalNewStockFineWeight: sum(newStock, 'fineWeight'),
                totalBillsWeight: sum(billRows, 'totalWeight'),
                totalBillsCustomerWeight: sum(billRows, 'customerWeight'),
                totalBillsRemainingWeight: sum(billRows, 'remainingWeight'),
                counts: {
                    process: processAll.length,
                    clientDuePaid: duePaid.length,
                    loss: losses.length,
                    stockInward: inward.length,
                    stockOutward: outward.length,
                    newStock: newStock.length,
                    bills: billRows.length,
                },
            },
            process: {all: processAll},
            processList: processAll,
            clientDuePaid: duePaid,
            loss: losses,
            stock: {
                totalInwardWeight: sum(inward, 'grossWeight'),
                totalOutwardWeight: sum(outward, 'grossWeight'),
                netWeight: round3(sum(inward, 'grossWeight') - sum(outward, 'grossWeight')),
                inward,
                outward,
            },
            newStock,
            bills: billRows,
        };
    }

    /**
     * Business 360 (stock ledger) for a date range. Works back from today's stock:
     * closing(To) = now - movements after To; opening(From) = closing - movements in range.
     * Fine weight = weight x purity (no purity = 100%).
     */
    async getStockInventoryReport(
        adminId: string,
        query: {fromDate: string; toDate: string},
    ) {
        const from = new Date(query.fromDate);
        const to = new Date(query.toDate);
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date range');
        }
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        const isOut = (remark: string, w: number) => w < 0 || /^outward|given/i.test(remark);
        const signed = (remark: string, w: number) => (isOut(remark, w) ? -Math.abs(w) : Math.abs(w));
        const keyOf = (itemId: string, sizeId: string | null, purity: number | null) =>
            `${itemId}|${sizeId ?? ''}|${purity ?? ''}`;
        const fineOf = (w: number, purity: number | null) => (w * (purity ?? 100)) / 100;

        const [stocks, history, clients, bills, lossRows] = await Promise.all([
            prisma.stock.findMany({where: {adminId}, include: {item: true, size: true}}),
            prisma.stockHistory.findMany({
                where: {adminId, createdAt: {gte: from}},
                include: {item: true, size: true},
                orderBy: {createdAt: 'asc'},
            }),
            prisma.client.findMany({where: {adminId}}),
            prisma.receipt.findMany({
                where: {adminId, createdAt: {gte: from}},
                include: {receiptItems: true},
            }),
            prisma.processEntry.findMany({
                where: {adminId, status: 'COMPLETED', completedAt: {gte: from, lte: to}},
                select: {loss: true},
            }),
        ]);

        // Per stock row: change after To and change within the range
        const after = new Map<string, number>();
        const within = new Map<string, number>();
        for (const h of history) {
            const k = keyOf(h.itemId, h.sizeId, h.purity);
            const bucket = h.createdAt > to ? after : within;
            bucket.set(k, (bucket.get(k) ?? 0) + signed(h.remark, h.weight));
        }
        // SILVER at 100% history is recorded with purity 100 or none: fold both onto the stock row
        const rows = stocks.map((s) => {
            const keys = [keyOf(s.itemId, s.sizeId, s.purity)];
            if (s.item.name.toUpperCase() === FINE_ITEM_NAME && s.purity === null) {
                keys.push(keyOf(s.itemId, s.sizeId, 100));
            }
            const a = keys.reduce((t, k) => t + (after.get(k) ?? 0), 0);
            const w = keys.reduce((t, k) => t + (within.get(k) ?? 0), 0);
            const closing = s.weight - a;
            const opening = closing - w;
            return {
                id: s.id,
                name: [s.item.name, s.design].filter(Boolean).join(' · '),
                isSilver: s.item.name.toUpperCase() === FINE_ITEM_NAME,
                hasSize: !!s.sizeId,
                size: s.size?.size,
                purity: s.purity ?? 100,
                opening: round3(fineOf(opening, s.purity)),
                closing: round3(fineOf(closing, s.purity)),
                difference: round3(fineOf(closing - opening, s.purity)),
            };
        });
        const total = (list: typeof rows, k: 'opening' | 'closing') =>
            round3(list.reduce((t, r) => t + r[k], 0));
        const silver = rows.filter((r) => r.isSilver);
        const raw = rows.filter((r) => !r.isSilver && !r.hasSize);
        const chain = rows.filter((r) => !r.isSilver && r.hasSize);

        // Movements inside the range (fine weight)
        const inRange = history.filter((h) => h.createdAt <= to);
        const movement = (h: (typeof history)[number]) => ({
            id: h.id,
            name: h.item.name,
            sizeName: h.size?.size,
            remark: h.remark,
            fineWeight: round3(fineOf(Math.abs(h.weight), h.purity)),
        });
        const inwards = inRange.filter((h) => !isOut(h.remark, h.weight)).map(movement);
        const outwards = inRange.filter((h) => isOut(h.remark, h.weight)).map(movement);

        // Client dues: completed bills move a client's balance by balanceDelta
        const billDelta = (clientId: string, upto: 'range' | 'after') =>
            bills
                .filter(
                    (b) =>
                        b.clientID === clientId &&
                        b.type === 'BILL' &&
                        (upto === 'after' ? b.createdAt > to : b.createdAt <= to),
                )
                .reduce((t, b) => t + b.balanceDelta, 0);
        const clientRows = clients.map((c) => {
            const now = c.due ?? c.openingBalance ?? 0;
            const closing = now - billDelta(c.id, 'after');
            const opening = closing - billDelta(c.id, 'range');
            return {
                id: c.id,
                name: c.fullName,
                opening: round3(opening),
                closing: round3(closing),
                difference: round3(closing - opening),
            };
        });

        const wastage = round3(
            bills
                .filter((b) => b.type === 'BILL' && b.createdAt <= to)
                .reduce((t, b) => t + b.receiptItems.reduce((u, i) => u + (i.srp || 0), 0), 0),
        );
        const loss = round3(lossRows.reduce((t, r) => t + (r.loss ?? 0), 0));
        const sumOf = (a: {fineWeight: number}[]) => round3(a.reduce((t, x) => t + x.fineWeight, 0));

        return {
            summary: {
                opening: {
                    gold: total(silver, 'opening'),
                    raw: total(raw, 'opening'),
                    openingChain: total(chain, 'opening'),
                    srp: wastage,
                    openingClientDue: round3(clientRows.reduce((t, c) => t + c.opening, 0)),
                    inward: sumOf(inwards),
                },
                closing: {
                    gold: total(silver, 'closing'),
                    raw: total(raw, 'closing'),
                    closingChain: total(chain, 'closing'),
                    closingClientDue: round3(clientRows.reduce((t, c) => t + c.closing, 0)),
                    outward: sumOf(outwards),
                    loss,
                    profitLoss: round3(wastage - loss),
                },
            },
            rawStock: [...silver, ...raw],
            chainStock: chain,
            clients: clientRows,
            stockMovement: {inwards, outwards},
        };
    }

    // async todayReport(adminId: string, dateStr?: string) {
    //     // ============================================================
    //     // HELPERS
    //     // ============================================================

    //     const round = (val: number): number => {
    //         if (!Number.isFinite(val)) {
    //             return 0;
    //         }

    //         return Number(val.toFixed(4));
    //     };

    //     const toFine = (weight: number, purity?: number | null): number => {
    //         const p =
    //             purity !== undefined && purity !== null && Number.isFinite(purity) ? purity : 100;

    //         return round(weight * (p / 100));
    //     };

    //     // ============================================================
    //     // IST DATE RANGE
    //     // ============================================================

    //     const getISTDateString = (date: Date): string => {
    //         return new Intl.DateTimeFormat('en-CA', {
    //             timeZone: 'Asia/Kolkata',
    //             year: 'numeric',
    //             month: '2-digit',
    //             day: '2-digit',
    //         }).format(date);
    //     };

    //     const requestedDate = dateStr ? dateStr.slice(0, 10) : getISTDateString(new Date());

    //     if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    //         throw new Error('Invalid date format. Expected YYYY-MM-DD');
    //     }

    //     /**
    //      * India:
    //      *
    //      * 2026-09-05 00:00:00 IST
    //      * =
    //      * 2026-09-04 18:30:00 UTC
    //      *
    //      * 2026-09-05 23:59:59.999 IST
    //      * =
    //      * 2026-09-05 18:29:59.999 UTC
    //      */

    //     const startOfToday = new Date(`${requestedDate}T00:00:00+05:30`);

    //     const endOfToday = new Date(`${requestedDate}T23:59:59.999+05:30`);

    //     const dateFormatted = requestedDate;

    //     // ============================================================
    //     // TYPES
    //     // ============================================================

    //     type SimpleProcessItem = {
    //         processName: string;
    //         itemName: string;
    //         size: string | null;
    //         purity: number | null;
    //         weight: number;
    //         fineWeight: number;
    //         loss: number;
    //         fineLoss: number;
    //     };

    //     type SimpleLossItem = {
    //         id: string;
    //         processName: string;
    //         type: string;
    //         itemName: string;
    //         size: string | null;
    //         purity: number | null;
    //         loss: number;
    //         fineLoss: number;
    //         weight: number;
    //         fineWeight: number;
    //         particular: string;
    //         createdAt: Date;
    //         updatedAt: Date;
    //     };

    //     type StockReportRow = {
    //         itemName: string;
    //         size: string | null;
    //         purity: number | null;
    //         weight: number;
    //         remark: string | null;
    //         type: 'INWARD' | 'OUTWARD';
    //         createdAt: Date;
    //     };

    //     // ============================================================
    //     // FETCH TODAY'S DATA
    //     //
    //     // IMPORTANT:
    //     // Processes use createdAt only.
    //     //
    //     // This prevents an old process edited today from appearing
    //     // inside Today's Process.
    //     // ============================================================

    //     const [
    //         tars,
    //         boxes,
    //         solderings,
    //         joints,
    //         cuttings,
    //         kundas,
    //         meltings,
    //         todayClientHistory,
    //         todayKarigarHistory,
    //         todayStockHistory,
    //         todayBills,
    //         todayPurchases,
    //     ] = await Promise.all([
    //         // ========================================================
    //         // TAR
    //         // ========================================================

    //         // prisma.tar.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // BOX
    //         // ========================================================

    //         // prisma.box.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     include: {
    //         //         size: true,
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // SOLDERING
    //         // ========================================================

    //         // prisma.soldering.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     include: {
    //         //         item: true,
    //         //         size: true,
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // JOINT
    //         // ========================================================

    //         // prisma.joint.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     include: {
    //         //         item: true,
    //         //         size: true,
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // CUTTING
    //         // ========================================================

    //         // prisma.cutting.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     include: {
    //         //         item: true,
    //         //         size: true,
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // KUNDA
    //         // ========================================================

    //         // prisma.kunda.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     include: {
    //         //         item: true,
    //         //         size: true,
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // MELTING
    //         // ========================================================

    //         // prisma.melting.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // CLIENT DUE PAID TODAY
    //         // ========================================================

    //         // prisma.clientHistory.findMany({
    //         //     where: {
    //         //         client: {
    //         //             adminId,
    //         //         },
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //         NOT: {
    //         //             remark: {
    //         //                 contains: 'Sale',
    //         //                 mode: 'insensitive',
    //         //             },
    //         //         },
    //         //     },
    //         //     include: {
    //         //         client: true,
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // KARIGAR DUE PAID TODAY
    //         // ========================================================

    //         // prisma.karigarHistory.findMany({
    //         //     where: {
    //         //         karigar: {
    //         //             adminId,
    //         //         },
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //         NOT: {
    //         //             remark: {
    //         //                 contains: 'Purchase',
    //         //                 mode: 'insensitive',
    //         //             },
    //         //         },
    //         //     },
    //         //     include: {
    //         //         karigar: true,
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // STOCK HISTORY TODAY
    //         // ========================================================

    //         prisma.stockHistory.findMany({
    //             where: {
    //                 adminId,

    //                 createdAt: {
    //                     gte: startOfToday,
    //                     lte: endOfToday,
    //                 },
    //             },
    //             include: {
    //                 item: true,
    //                 size: true,
    //             },
    //             orderBy: {
    //                 createdAt: 'desc',
    //             },
    //         }),

    //         // ========================================================
    //         // BILLS TODAY
    //         // ========================================================

    //         // prisma.receipt.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     include: {
    //         //         client: true,
    //         //         receiptItems: {
    //         //             include: {
    //         //                 item: true,
    //         //                 size: true,
    //         //             },
    //         //         },
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),

    //         // ========================================================
    //         // PURCHASES TODAY
    //         // ========================================================

    //         // prisma.karigarPurchase.findMany({
    //         //     where: {
    //         //         adminId,
    //         //         createdAt: {
    //         //             gte: startOfToday,
    //         //             lte: endOfToday,
    //         //         },
    //         //     },
    //         //     include: {
    //         //         karigar: true,
    //         //         karigarPurchaseItems: {
    //         //             include: {
    //         //                 item: true,
    //         //                 size: true,
    //         //             },
    //         //         },
    //         //     },
    //         //     orderBy: {
    //         //         createdAt: 'desc',
    //         //     },
    //         // }),
    //     ]);

    //     // ============================================================
    //     // PROCESS ITEM CREATOR
    //     // ============================================================

    //     const createProcessItem = (
    //         processName: string,
    //         itemName: string,
    //         size: string | null | undefined,
    //         purity: number | null | undefined,
    //         weight: number,
    //         fineWeight?: number | null,
    //         loss?: number | null,
    //         fineLoss?: number | null,
    //     ): SimpleProcessItem => {
    //         const pureVal =
    //             purity !== undefined && purity !== null && Number.isFinite(purity) ? purity : null;

    //         const wt = round(weight);

    //         const fw =
    //             fineWeight !== undefined && fineWeight !== null && Number.isFinite(fineWeight)
    //                 ? round(fineWeight)
    //                 : toFine(wt, pureVal);

    //         const lossVal =
    //             loss !== undefined && loss !== null && Number.isFinite(loss) ? round(loss) : 0;

    //         const fl =
    //             fineLoss !== undefined && fineLoss !== null && Number.isFinite(fineLoss)
    //                 ? round(fineLoss)
    //                 : lossVal > 0
    //                   ? toFine(lossVal, pureVal)
    //                   : 0;

    //         return {
    //             processName,
    //             itemName,
    //             size: size || null,
    //             purity: pureVal,
    //             weight: wt,
    //             fineWeight: fw,
    //             loss: lossVal,
    //             fineLoss: fl,
    //         };
    //     };

    //     // ============================================================
    //     // TAR
    //     // ============================================================

    //     const tarRows: SimpleProcessItem[] = [];

    //     let tarGross = 0;
    //     let tarFine = 0;

    //     const tarLossRows: SimpleLossItem[] = [];

    //     let tarLossGross = 0;
    //     let tarLossFine = 0;

    //     for (const t of tars) {
    //         // const wt = Number(t.grosswt ?? t.tar ?? 0);

    //         const lossVal = round(Number(t.loss || 0));

    //         const fl = lossVal > 0 ? toFine(lossVal, t.purity) : 0;

    //         // ----------------------------
    //         // LOSS
    //         // ----------------------------

    //         if (lossVal > 0) {
    //             tarLossGross += lossVal;
    //             tarLossFine += fl;

    //             tarLossRows.push({
    //                 id: t.id,
    //                 processName: 'TAR',
    //                 type: 'Tar',
    //                 itemName: 'TAR',
    //                 size: null,
    //                 purity: t.purity ?? null,
    //                 loss: lossVal,
    //                 fineLoss: fl,
    //                 weight: lossVal,
    //                 fineWeight: fl,
    //                 particular:
    //                     `Tar Loss (Gross Wt: ${t.grosswt || 0}, ` + `Fine: ${Number(t.fine || 0)})`,
    //                 createdAt: t.createdAt,
    //                 updatedAt: t.updatedAt,
    //             });
    //         }

    //         if (round(wt) <= 0) {
    //             continue;
    //         }

    //         const fw = toFine(wt, t.purity);

    //         tarGross += wt;
    //         tarFine += fw;

    //         tarRows.push(createProcessItem('TAR', 'TAR', null, t.purity, wt, fw, lossVal, fl));
    //     }

    //     // ============================================================
    //     // BOX
    //     // ============================================================

    //     const boxRows: SimpleProcessItem[] = [];

    //     let boxGross = 0;
    //     let boxFine = 0;

    //     const boxLossRows: SimpleLossItem[] = [];

    //     let boxLossGross = 0;
    //     let boxLossFine = 0;

    //     for (const b of boxes) {
    //         const wt = Number(b.chainWeight ?? b.tarWeight ?? 0);

    //         const lossVal = round(Number(b.loss || 0));

    //         const fl = lossVal > 0 ? toFine(lossVal, b.purity) : 0;

    //         // ----------------------------
    //         // LOSS
    //         // ----------------------------

    //         if (lossVal > 0) {
    //             boxLossGross += lossVal;
    //             boxLossFine += fl;

    //             boxLossRows.push({
    //                 id: b.id,
    //                 processName: 'BOX',
    //                 type: 'Box',
    //                 itemName: 'BOX',
    //                 size: b.size?.size || null,
    //                 purity: b.purity ?? null,
    //                 loss: lossVal,
    //                 fineLoss: fl,
    //                 weight: lossVal,
    //                 fineWeight: fl,
    //                 particular:
    //                     `Box Loss (Tar Wt: ${b.tarWeight || 0}, ` +
    //                     `Chain Wt: ${b.chainWeight || 0})`,
    //                 createdAt: b.createdAt,
    //                 updatedAt: b.updatedAt,
    //             });
    //         }

    //         if (round(wt) <= 0) {
    //             continue;
    //         }

    //         const fw = toFine(wt, b.purity);

    //         boxGross += wt;
    //         boxFine += fw;

    //         boxRows.push(
    //             createProcessItem('BOX', 'BOX', b.size?.size, b.purity, wt, fw, lossVal, fl),
    //         );
    //     }

    //     // ============================================================
    //     // SOLDERING
    //     // ============================================================

    //     const solderingRows: SimpleProcessItem[] = [];

    //     let solderingGross = 0;
    //     let solderingFine = 0;

    //     for (const s of solderings) {
    //         const wt = Number(s.chainReceived ?? s.chainWeight ?? 0);

    //         if (round(wt) <= 0) {
    //             continue;
    //         }

    //         const fw = toFine(wt, s.purity);

    //         solderingGross += wt;
    //         solderingFine += fw;

    //         solderingRows.push(
    //             createProcessItem(
    //                 'SOLDERING',
    //                 s.item?.name || 'SOLDERING',
    //                 s.size?.size,
    //                 s.purity,
    //                 wt,
    //                 fw,
    //                 0,
    //                 0,
    //             ),
    //         );
    //     }

    //     // ============================================================
    //     // JOINT
    //     // ============================================================

    //     const jointRows: SimpleProcessItem[] = [];

    //     let jointGross = 0;
    //     let jointFine = 0;

    //     for (const j of joints) {
    //         const wt = Number(j.chainReceived ?? j.chainWeight ?? 0);

    //         if (round(wt) <= 0) {
    //             continue;
    //         }

    //         const fw = toFine(wt, j.purity);

    //         jointGross += wt;
    //         jointFine += fw;

    //         jointRows.push(
    //             createProcessItem(
    //                 'JOINT',
    //                 j.item?.name || 'JOINT',
    //                 j.size?.size,
    //                 j.purity,
    //                 wt,
    //                 fw,
    //                 0,
    //                 0,
    //             ),
    //         );
    //     }

    //     // ============================================================
    //     // CUTTING
    //     // ============================================================

    //     const cuttingRows: SimpleProcessItem[] = [];

    //     let cuttingGross = 0;
    //     let cuttingFine = 0;

    //     const cuttingLossRows: SimpleLossItem[] = [];

    //     let cuttingLossGross = 0;
    //     let cuttingLossFine = 0;

    //     for (const c of cuttings) {
    //         const wt = Number(c.chainReceived ?? c.chainWeight ?? 0);

    //         // ----------------------------
    //         // CALCULATE LOSS
    //         // ----------------------------

    //         const rawLoss =
    //             c.loss !== null && c.loss !== undefined && Number.isFinite(Number(c.loss))
    //                 ? Number(c.loss)
    //                 : c.isCompleted && c.chainReceived !== null && c.chainReceived !== undefined
    //                   ? Math.max(
    //                         0,
    //                         Number(c.chainWeight || 0) -
    //                             Number(c.chainReceived || 0) -
    //                             Number(c.scrap || 0),
    //                     )
    //                   : 0;

    //         const lossVal = round(rawLoss);

    //         const fl = lossVal > 0 ? toFine(lossVal, c.purity) : 0;

    //         // ----------------------------
    //         // LOSS ROW
    //         // ----------------------------

    //         if (lossVal > 0) {
    //             cuttingLossGross += lossVal;
    //             cuttingLossFine += fl;

    //             cuttingLossRows.push({
    //                 id: c.id,
    //                 processName: 'CUTTING',
    //                 type: 'Cutting',
    //                 itemName: c.item?.name || 'CUTTING',
    //                 size: c.size?.size || null,
    //                 purity: c.purity ?? null,
    //                 loss: lossVal,
    //                 fineLoss: fl,
    //                 weight: lossVal,
    //                 fineWeight: fl,
    //                 particular:
    //                     `Cutting: ${c.item?.name || ''} ` +
    //                     `(${c.size?.size || ''}) - ` +
    //                     `Wt: ${c.chainWeight || 0}, ` +
    //                     `Rec: ${c.chainReceived || 0}, ` +
    //                     `Scrap: ${c.scrap || 0}`,
    //                 createdAt: c.createdAt,
    //                 updatedAt: c.updatedAt,
    //             });
    //         }

    //         if (round(wt) <= 0) {
    //             continue;
    //         }

    //         const fw = toFine(wt, c.purity);

    //         cuttingGross += wt;
    //         cuttingFine += fw;

    //         cuttingRows.push(
    //             createProcessItem(
    //                 'CUTTING',
    //                 c.item?.name || 'CUTTING',
    //                 c.size?.size,
    //                 c.purity,
    //                 wt,
    //                 fw,
    //                 lossVal,
    //                 fl,
    //             ),
    //         );
    //     }

    //     // ============================================================
    //     // KUNDA
    //     // ============================================================

    //     const kundaRows: SimpleProcessItem[] = [];

    //     let kundaGross = 0;
    //     let kundaFine = 0;

    //     const kundaLossRows: SimpleLossItem[] = [];

    //     let kundaLossGross = 0;
    //     let kundaLossFine = 0;

    //     for (const k of kundas) {
    //         const kundaGiven =
    //             k.kundaGiven !== null && k.kundaGiven !== undefined
    //                 ? Number(k.kundaGiven)
    //                 : Number(k.chainWeight || 0);

    //         // ----------------------------
    //         // CALCULATE LOSS
    //         // ----------------------------

    //         const rawLoss =
    //             k.loss !== null && k.loss !== undefined && Number.isFinite(Number(k.loss))
    //                 ? Number(k.loss)
    //                 : k.isCompleted && k.chainReceived !== null && k.chainReceived !== undefined
    //                   ? Math.max(
    //                         0,
    //                         Number(k.chainWeight || 0) -
    //                             Number(k.chainReceived || 0) -
    //                             Number(k.scrap || 0),
    //                     )
    //                   : 0;

    //         const lossVal = round(rawLoss);

    //         const fl = lossVal > 0 ? toFine(lossVal, k.purity) : 0;

    //         // ----------------------------
    //         // LOSS ROW
    //         // ----------------------------

    //         if (lossVal > 0) {
    //             kundaLossGross += lossVal;
    //             kundaLossFine += fl;

    //             kundaLossRows.push({
    //                 id: k.id,
    //                 processName: 'KUNDA',
    //                 type: 'Kunda',
    //                 itemName: k.item?.name || 'KUNDA',
    //                 size: k.size?.size || null,
    //                 purity: k.purity ?? null,
    //                 loss: lossVal,
    //                 fineLoss: fl,
    //                 weight: lossVal,
    //                 fineWeight: fl,
    //                 particular:
    //                     `Kunda Loss (Chain Wt: ${k.chainWeight || 0}, ` +
    //                     `Received: ${k.chainReceived || 0}, ` +
    //                     `Kunda Given: ${k.kundaGiven || 0})`,
    //                 createdAt: k.createdAt,
    //                 updatedAt: k.updatedAt,
    //             });
    //         }

    //         // ========================================================
    //         // CURRENT BEHAVIOUR:
    //         //
    //         // Kunda Process = Kunda Given - Loss
    //         //
    //         // Example:
    //         // Kunda Given = 2
    //         // Loss        = 0.3
    //         // Process     = 1.7
    //         //
    //         // This matches your current screenshot.
    //         // ========================================================

    //         const wt = Math.max(0, kundaGiven - lossVal);

    //         if (round(wt) <= 0) {
    //             continue;
    //         }

    //         const fw = toFine(wt, k.purity);

    //         kundaGross += wt;
    //         kundaFine += fw;

    //         kundaRows.push(
    //             createProcessItem(
    //                 'KUNDA',
    //                 k.item?.name || 'KUNDA',
    //                 k.size?.size,
    //                 k.purity,
    //                 wt,
    //                 fw,
    //                 lossVal,
    //                 fl,
    //             ),
    //         );
    //     }

    //     // ============================================================
    //     // MELTING
    //     // ============================================================

    //     const meltingRows: SimpleProcessItem[] = [];

    //     let meltingGross = 0;
    //     let meltingFine = 0;

    //     const meltingLossRows: SimpleLossItem[] = [];

    //     let meltingLossGross = 0;
    //     let meltingLossFine = 0;

    //     for (const m of meltings) {
    //         const wt = Number(m.grossWeight || 0);

    //         const lossVal = round(Number(m.loss || 0));

    //         const fl = lossVal > 0 ? toFine(lossVal, m.purity) : 0;

    //         // ----------------------------
    //         // LOSS
    //         // ----------------------------

    //         if (lossVal > 0) {
    //             meltingLossGross += lossVal;
    //             meltingLossFine += fl;

    //             meltingLossRows.push({
    //                 id: m.id,
    //                 processName: 'MELTING',
    //                 type: 'Melting',
    //                 itemName: m.particular || 'MELTING',
    //                 size: null,
    //                 purity: m.purity ?? null,
    //                 loss: lossVal,
    //                 fineLoss: fl,
    //                 weight: lossVal,
    //                 fineWeight: fl,
    //                 particular:
    //                     `Melting: ${m.particular || ''} - ` +
    //                     `Gross Wt: ${m.grossWeight || 0}, ` +
    //                     `Fine Wt: ${m.fineWeight || 0}, ` +
    //                     `Expected: ${m.expected || 0}`,
    //                 createdAt: m.createdAt,
    //                 updatedAt: m.updatedAt,
    //             });
    //         }

    //         if (round(wt) <= 0) {
    //             continue;
    //         }

    //         const fw =
    //             m.fineWeight !== null &&
    //             m.fineWeight !== undefined &&
    //             Number.isFinite(Number(m.fineWeight)) &&
    //             Number(m.fineWeight) > 0
    //                 ? round(Number(m.fineWeight))
    //                 : toFine(wt, m.purity);

    //         meltingGross += wt;
    //         meltingFine += fw;

    //         meltingRows.push(
    //             createProcessItem(
    //                 'MELTING',
    //                 m.particular || 'MELTING',
    //                 null,
    //                 m.purity,
    //                 wt,
    //                 fw,
    //                 lossVal,
    //                 fl,
    //             ),
    //         );
    //     }

    //     // ============================================================
    //     // ALL PROCESS ROWS
    //     // ============================================================

    //     const allProcessRows: SimpleProcessItem[] = [
    //         ...tarRows,
    //         ...boxRows,
    //         ...solderingRows,
    //         ...jointRows,
    //         ...cuttingRows,
    //         ...kundaRows,
    //         ...meltingRows,
    //     ];

    //     const totalProcessGross =
    //         tarGross +
    //         boxGross +
    //         solderingGross +
    //         jointGross +
    //         cuttingGross +
    //         kundaGross +
    //         meltingGross;

    //     const totalProcessFine =
    //         tarFine + boxFine + solderingFine + jointFine + cuttingFine + kundaFine + meltingFine;

    //     const processWise = {
    //         tar: tarRows,
    //         box: boxRows,
    //         soldering: solderingRows,
    //         joint: jointRows,
    //         cutting: cuttingRows,
    //         kunda: kundaRows,
    //         melting: meltingRows,
    //         all: allProcessRows,
    //     };

    //     // ============================================================
    //     // ALL LOSS ROWS
    //     // ============================================================

    //     const allLossRows: SimpleLossItem[] = [
    //         ...tarLossRows,
    //         ...boxLossRows,
    //         ...cuttingLossRows,
    //         ...kundaLossRows,
    //         ...meltingLossRows,
    //     ];

    //     allLossRows.sort(
    //         (a, b) =>
    //             new Date(b.updatedAt || b.createdAt).getTime() -
    //             new Date(a.updatedAt || a.createdAt).getTime(),
    //     );

    //     const totalLossGross =
    //         tarLossGross + boxLossGross + cuttingLossGross + kundaLossGross + meltingLossGross;

    //     const totalLossFine =
    //         tarLossFine + boxLossFine + cuttingLossFine + kundaLossFine + meltingLossFine;

    //     const lossProcessWise = {
    //         tar: tarLossRows,
    //         box: boxLossRows,
    //         cutting: cuttingLossRows,
    //         kunda: kundaLossRows,
    //         melting: meltingLossRows,
    //         all: allLossRows,
    //     };

    //     // ============================================================
    //     // CLIENT DUE PAID
    //     // ============================================================

    //     let totalDuePaidGross = 0;

    //     const clientDuePaidRows = todayClientHistory.map((ch) => {
    //         const wt = Math.abs(round(Number(ch.weight || 0)));

    //         totalDuePaidGross += wt;

    //         return {
    //             clientName: ch.client?.fullName || '',
    //             duePaid: wt,
    //             weight: wt,
    //             remark: ch.remark,
    //             createdAt: ch.createdAt,
    //         };
    //     });

    //     // ============================================================
    //     // KARIGAR DUE PAID
    //     // ============================================================

    //     let totalKarigarDuePaidGross = 0;

    //     const karigarDuePaidRows = todayKarigarHistory.map((kh) => {
    //         const wt = Math.abs(round(Number(kh.weight || 0)));

    //         totalKarigarDuePaidGross += wt;

    //         return {
    //             karigarName: kh.karigar?.fullName || '',
    //             duePaid: wt,
    //             weight: wt,
    //             remark: kh.remark,
    //             createdAt: kh.createdAt,
    //         };
    //     });

    //     // ============================================================
    //     // STOCK INWARD / OUTWARD
    //     // ============================================================

    //     const inwardRows: StockReportRow[] = [];
    //     const outwardRows: StockReportRow[] = [];

    //     let totalInwardWeight = 0;
    //     let totalOutwardWeight = 0;

    //     for (const sh of todayStockHistory) {
    //         if (sh.isManual === false) {
    //             continue;
    //         }
    //         const rawWt = Number(sh.weight || 0);

    //         if (!Number.isFinite(rawWt)) {
    //             continue;
    //         }

    //         if (rawWt === 0) {
    //             continue;
    //         }

    //         /**
    //          * Primary rule:
    //          *
    //          * Negative stock weight = OUTWARD
    //          *
    //          * Fallback:
    //          * remark containing OUTWARD = OUTWARD
    //          */

    //         const isOutward =
    //             rawWt < 0 ||
    //             (typeof sh.remark === 'string' && sh.remark.toUpperCase().includes('OUTWARD'));

    //         const wt = Math.abs(round(rawWt));

    //         if (wt <= 0) {
    //             continue;
    //         }

    //         const row: StockReportRow = {
    //             itemName: sh.item?.name || 'STOCK',
    //             size: sh.size?.size || null,
    //             purity: sh.purity ?? null,
    //             weight: wt,
    //             remark: sh.remark,
    //             type: isOutward ? 'OUTWARD' : 'INWARD',
    //             createdAt: sh.createdAt,
    //         };

    //         if (isOutward) {
    //             totalOutwardWeight += wt;
    //             outwardRows.push(row);
    //         } else {
    //             totalInwardWeight += wt;
    //             inwardRows.push(row);
    //         }
    //     }

    //     // ============================================================
    //     // KARIGAR STOCK INWARD & OUTWARD (Purchases & Advance Gold)
    //     // ============================================================

    //     const karigarInwardRows: StockReportRow[] = [];

    //     for (const p of todayPurchases) {
    //         for (const item of p.karigarPurchaseItems) {
    //             const wt = round(Number(item.grossWeight || 0));
    //             if (wt > 0) {
    //                 const row: StockReportRow = {
    //                     itemName: item.item?.name || 'STOCK',
    //                     size: item.size?.size || null,
    //                     purity: item.purity ?? null,
    //                     weight: wt,
    //                     remark: `Purchase ${p.billNumber}${p.karigar?.fullName ? ` (${p.karigar.fullName})` : ''}`,
    //                     type: 'INWARD',
    //                     createdAt: p.createdAt,
    //                 };
    //                 totalInwardWeight += wt;
    //                 inwardRows.push(row);
    //                 karigarInwardRows.push(row);
    //             }
    //         }

    //         // Karigar advance gold given (OUTWARD)
    //         const advanceGold = round(Number(p.karigarWeight || 0));
    //         if (advanceGold > 0) {
    //             const outRow: StockReportRow = {
    //                 itemName: FINE_ITEM_NAME,
    //                 size: null,
    //                 purity: null,
    //                 weight: advanceGold,
    //                 remark: `${p.billNumber} Karigar Advance Gold (${p.karigar?.fullName || ''})`,
    //                 type: 'OUTWARD',
    //                 createdAt: p.createdAt,
    //             };
    //             totalOutwardWeight += advanceGold;
    //             outwardRows.push(outRow);
    //         }
    //     }

    //     inwardRows.sort(
    //         (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    //     );
    //     outwardRows.sort(
    //         (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    //     );

    //     // ============================================================
    //     // BILLS
    //     // ============================================================

    //     let totalBillsGross = 0;
    //     let totalBillsCustomer = 0;
    //     let totalBillsRemaining = 0;

    //     const billRows = todayBills.map((r) => {
    //         const totWt = round(Number(r.totalWeight || 0));

    //         const custWt = round(Number(r.customerWeight || 0));

    //         const remWt = round(Number(r.remainingWeight || 0));

    //         totalBillsGross += totWt;
    //         totalBillsCustomer += custWt;
    //         totalBillsRemaining += remWt;

    //         const items = r.receiptItems.map((ri) => ({
    //             itemName: ri.item?.name || '',
    //             size: ri.size?.size || null,
    //             purity: ri.purity,
    //             weight: round(Number(ri.grossWeight || 0)),
    //             fineWeight: round(Number(ri.fineWeight || 0)),
    //         }));

    //         return {
    //             billNumber: r.billNumber,

    //             clientName: r.client?.fullName || '',

    //             type: r.type,

    //             totalWeight: totWt,

    //             customerWeight: custWt,

    //             remainingWeight: remWt,

    //             receiptDate: r.receiptDate,

    //             createdAt: r.createdAt,

    //             items,
    //         };
    //     });

    //     // ============================================================
    //     // PURCHASES
    //     // ============================================================

    //     let totalPurchasesGross = 0;
    //     let totalPurchasesKarigar = 0;
    //     let totalPurchasesRemaining = 0;

    //     const purchaseRows = todayPurchases.map((p) => {
    //         const totWt = round(Number(p.totalWeight || 0));

    //         const karWt = round(Number(p.karigarWeight || 0));

    //         const remWt = round(Number(p.remainingWeight || 0));

    //         totalPurchasesGross += totWt;
    //         totalPurchasesKarigar += karWt;
    //         totalPurchasesRemaining += remWt;

    //         const items = p.karigarPurchaseItems.map((pi) => ({
    //             itemName: pi.item?.name || '',
    //             size: pi.size?.size || null,
    //             purity: pi.purity,
    //             weight: round(Number(pi.grossWeight || 0)),
    //             fineWeight: round(Number(pi.fineWeight || 0)),
    //         }));

    //         return {
    //             billNumber: p.billNumber,

    //             karigarName: p.karigar?.fullName || '',

    //             type: p.type,

    //             totalWeight: totWt,

    //             karigarWeight: karWt,

    //             remainingWeight: remWt,

    //             purchaseDate: p.purchaseDate,

    //             createdAt: p.createdAt,

    //             items,
    //         };
    //     });

    //     // ============================================================
    //     // FINAL RESPONSE
    //     // ============================================================

    //     return {
    //         date: dateFormatted,

    //         // ========================================================
    //         // SUMMARY
    //         // ========================================================

    //         summary: {
    //             totalProcessWeight: round(totalProcessGross),

    //             totalProcessFineWeight: round(totalProcessFine),

    //             totalLossWeight: round(totalLossGross),

    //             totalLossFineWeight: round(totalLossFine),

    //             totalDuePaidWeight: round(totalDuePaidGross),

    //             totalKarigarDuePaidWeight: round(totalKarigarDuePaidGross),

    //             totalStockInwardWeight: round(totalInwardWeight),

    //             totalStockOutwardWeight: round(totalOutwardWeight),

    //             totalBillsWeight: round(totalBillsGross),

    //             totalBillsCustomerWeight: round(totalBillsCustomer),

    //             totalBillsRemainingWeight: round(totalBillsRemaining),

    //             totalPurchasesWeight: round(totalPurchasesGross),

    //             totalPurchasesKarigarWeight: round(totalPurchasesKarigar),

    //             totalPurchasesRemainingWeight: round(totalPurchasesRemaining),

    //             counts: {
    //                 process: allProcessRows.length,

    //                 loss: allLossRows.length,

    //                 clientDuePaid: clientDuePaidRows.length,

    //                 karigarDuePaid: karigarDuePaidRows.length,

    //                 stockInward: inwardRows.length,

    //                 stockOutward: outwardRows.length,

    //                 bills: billRows.length,

    //                 purchases: purchaseRows.length,
    //             },

    //             // ====================================================
    //             // PROCESS WISE SUMMARY
    //             // ====================================================

    //             // byProcess: {
    //             //     tar: {
    //             //         totalWeight: round(tarGross),

    //             //         totalFineWeight: round(tarFine),

    //             //         loss: round(tarLossGross),

    //             //         lossFineWeight: round(tarLossFine),

    //             //         count: tarRows.length,
    //             //     },

    //             //     box: {
    //             //         totalWeight: round(boxGross),

    //             //         totalFineWeight: round(boxFine),

    //             //         loss: round(boxLossGross),

    //             //         lossFineWeight: round(boxLossFine),

    //             //         count: boxRows.length,
    //             //     },

    //             //     soldering: {
    //             //         totalWeight: round(solderingGross),

    //             //         totalFineWeight: round(solderingFine),

    //             //         loss: 0,

    //             //         lossFineWeight: 0,

    //             //         count: solderingRows.length,
    //             //     },

    //             //     joint: {
    //             //         totalWeight: round(jointGross),

    //             //         totalFineWeight: round(jointFine),

    //             //         loss: 0,

    //             //         lossFineWeight: 0,

    //             //         count: jointRows.length,
    //             //     },

    //             //     cutting: {
    //             //         totalWeight: round(cuttingGross),

    //             //         totalFineWeight: round(cuttingFine),

    //             //         loss: round(cuttingLossGross),

    //             //         lossFineWeight: round(cuttingLossFine),

    //             //         count: cuttingRows.length,
    //             //     },

    //             //     kunda: {
    //             //         totalWeight: round(kundaGross),

    //             //         totalFineWeight: round(kundaFine),

    //             //         loss: round(kundaLossGross),

    //             //         lossFineWeight: round(kundaLossFine),

    //             //         count: kundaRows.length,
    //             //     },

    //             //     melting: {
    //             //         totalWeight: round(meltingGross),

    //             //         totalFineWeight: round(meltingFine),

    //             //         loss: round(meltingLossGross),

    //             //         lossFineWeight: round(meltingLossFine),

    //             //         count: meltingRows.length,
    //             //     },
    //             // },
    //         },

    //         // ========================================================
    //         // 1. PROCESS
    //         // ========================================================

    //         // process: processWise,

    //         // // processList: allProcessRows,

    //         // // ========================================================
    //         // // 2. LOSS
    //         // // ========================================================

    //         // loss: {
    //         //     totalWeight: round(totalLossGross),

    //         //     totalFineWeight: round(totalLossFine),

    //         //     count: allLossRows.length,

    //         //     // byProcess: {
    //         //     //     tar: {
    //         //     //         totalWeight: round(tarLossGross),

    //         //     //         totalFineWeight: round(tarLossFine),

    //         //     //         count: tarLossRows.length,
    //         //     //     },

    //         //     //     box: {
    //         //     //         totalWeight: round(boxLossGross),

    //         //     //         totalFineWeight: round(boxLossFine),

    //         //     //         count: boxLossRows.length,
    //         //     //     },

    //         //     //     cutting: {
    //         //     //         totalWeight: round(cuttingLossGross),

    //         //     //         totalFineWeight: round(cuttingLossFine),

    //         //     //         count: cuttingLossRows.length,
    //         //     //     },

    //         //     //     kunda: {
    //         //     //         totalWeight: round(kundaLossGross),

    //         //     //         totalFineWeight: round(kundaLossFine),

    //         //     //         count: kundaLossRows.length,
    //         //     //     },

    //         //     //     melting: {
    //         //     //         totalWeight: round(meltingLossGross),

    //         //     //         totalFineWeight: round(meltingLossFine),

    //         //     //         count: meltingLossRows.length,
    //         //     //     },
    //         //     // },

    //         //     process: lossProcessWise,

    //         //     // list: allLossRows,
    //         // },

    //         // lossList: allLossRows,

    //         // // losses: allLossRows,

    //         // ========================================================
    //         // 3. CLIENT DUE & KARIGAR DUE
    //         // ========================================================

    //         clientDue: clientDuePaidRows,

    //         karigarDue: karigarDuePaidRows,

    //         // clientDuePaid: clientDuePaidRows,

    //         // settlement: clientDuePaidRows,

    //         // ========================================================
    //         // 4. STOCK
    //         // ========================================================

    //         stock: {
    //             totalInwardWeight: round(totalInwardWeight),

    //             totalOutwardWeight: round(totalOutwardWeight),

    //             netWeight: round(totalInwardWeight - totalOutwardWeight),

    //             inward: inwardRows,

    //             karigarInward: karigarInwardRows,

    //             outward: outwardRows,
    //         },

    //         // ========================================================
    //         // 5. BILLS & PURCHASES
    //         // ========================================================

    //         bills: billRows,

    //         purchases: purchaseRows,
    //     };
    // }
}

export default new StockService();
