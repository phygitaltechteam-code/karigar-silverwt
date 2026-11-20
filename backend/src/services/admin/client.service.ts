import {FINE_ITEM_NAME} from '@utils/calculations';
import {z} from 'zod';
import prisma from '@client';
import {clientValidation} from '@validations/index';
import ApiError from '@utils/ApiError';
export type CreateClientInput = z.infer<typeof clientValidation.clientSchema>;
export type UpdateClientInput = z.infer<typeof clientValidation.updateScheme>;
export type due = z.infer<typeof clientValidation.payDue>;

const round3 = <T extends number | null | undefined>(val: T): T => {
    if (val === null || val === undefined) return val;
    return Number(val.toFixed(3)) as T;
};

class clientService {
    async create(adminId: string, data: CreateClientInput) {
        return await prisma.$transaction(async (tx) => {
            const existingClient = await tx.client.findFirst({
                where: {
                    phoneNumber: data.phoneNumber,
                    adminId,
                },
            });

            if (existingClient) {
                throw new ApiError(409, 'Client with this phone number already exists');
            }

            const client = await tx.client.create({
                data: {
                    fullName: data.fullName,
                    phoneNumber: data.phoneNumber,
                    address: data.address,
                    openingBalance: data.openingBalance,
                    adminId,
                },
            });

            await tx.clientHistory.create({
                data: {
                    clientId: client.id,
                    remark: 'Opening Balance',
                    weight: -data.openingBalance,
                },
            });

            return client;
        });
    }

    async getAll(adminId: string) {
        const clients = await prisma.client.findMany({
            where: {
                adminId: adminId,
            },
            include: {
                // receipts: {
                //     select: {
                //         createdAt: true,
                //         billNumber: true,
                //         totalWeight: true,
                //         remainingWeight: true,
                //         type: true,
                //     },
                // },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return clients.map((client) => {
            // const billReceipts = client.receipts.filter((r) => r.type === 'BILL');
            // const fineWeight =
            //     round3(billReceipts.reduce((sum, r) => sum + (r.totalWeight || 0), 0)) || 0;
            // const pending =
            //     round3(
            //         (client.openingBalance || 0) +
            //             billReceipts.reduce((sum, r) => sum + (r.remainingWeight || 0), 0),
            //     ) || 0;

            return {
                ...client,
                // fineWeight,
                // pending,
                // totalBills: client.receipts.length,
                // bills: client.receipts,
            };
        });
    }

    async getById(id: string) {
        const client = await prisma.client.findUnique({
            where: {id},
            // include: {
            //     _count: {
            //         select: {
            //             receipts: true,
            //         },
            //     },
            // },
        });
        if (!client) return null;
        return {
            ...client,
            // totalBills: client._count.receipts,
        };
    }
    async update(adminId: string, id: string, data: UpdateClientInput) {
        const existingClient = await prisma.client.findFirst({
            where: {
                phoneNumber: data.phoneNumber,
                adminId: adminId,
                id: {
                    not: id,
                },
            },
        });

        if (existingClient) {
            throw new ApiError(409, 'Client with this phone number already exists');
        }

        const client = await prisma.client.update({
            where: {
                id,
            },
            data: {
                ...data,
            },
        });

        return client;
    }
    async remove(id: string) {
        return await prisma.client.delete({
            where: {id},
        });
    }
    async paydue(id: string, data: due) {
        // console.log(data);
        const clientExists = await prisma.client.findUnique({
            where: {id},
        });
        if (!clientExists) {
            throw new ApiError(404, 'Client Not Found');
        }

        return await prisma.$transaction(async (tx) => {
            const client = await tx.client.update({
                where: {
                    id: id,
                },
                data: {
                    openingBalance: {
                        increment: data.amount,
                    },
                },
            });

            let targetItemId = data.itemId;
            const targetSizeId = data.sizeId || null;
            const targetPurity = data.purity !== undefined ? data.purity : null;

            if (!targetItemId) {
                const fineItem = await tx.item.findFirst({
                    where: {
                        adminId: client.adminId,
                        name: FINE_ITEM_NAME,
                    },
                });
                if (!fineItem) {
                    throw new ApiError(404, `${FINE_ITEM_NAME} item not found for admin`);
                }
                targetItemId = fineItem.id;
            }

            const stock = await tx.stock.findFirst({
                where: {
                    adminId: client.adminId,
                    itemId: targetItemId,
                    sizeId: targetSizeId,
                    purity: targetPurity,
                },
            });

            if (data.amount > 0) {
                if (!stock || stock.weight < data.amount) {
                    const item = await tx.item.findUnique({where: {id: targetItemId}});
                    throw new ApiError(400, `${item?.name || 'Stock'} is not sufficient`);
                }
            }

            if (stock) {
                await tx.stock.update({
                    where: {id: stock.id},
                    data: {
                        weight: {
                            increment: -data.amount,
                        },
                    },
                });
            } else {
                await tx.stock.create({
                    data: {
                        adminId: client.adminId,
                        itemId: targetItemId,
                        sizeId: targetSizeId,
                        purity: targetPurity,
                        weight: -data.amount,
                    },
                });
            }

            const totalStock = await tx.stock.aggregate({
                _sum: {
                    weight: true,
                },
                where: {
                    adminId: client.adminId,
                    itemId: targetItemId,
                },
            });
            const afterStock = totalStock._sum.weight || 0;

            const isStockInward = data.amount < 0;
            const absoluteWeight = Math.abs(data.amount);

            await tx.silverHistory.create({
                data: {
                    type: isStockInward ? 'INWARD' : 'OUTWARD',
                    weight: absoluteWeight,
                    adminId: client.adminId,
                    clientId: client.id,
                    itemId: targetItemId,
                    sizeId: targetSizeId,
                    afterStock: afterStock,
                    note: `Pay due from client (${data.remark})`,
                },
            });

            await tx.silverHistory.create({
                data: {
                    type: isStockInward ? 'INWARD' : 'OUTWARD',
                    weight: absoluteWeight,
                    adminId: client.adminId,
                    itemId: targetItemId,
                    sizeId: targetSizeId,
                    afterStock: afterStock,
                    note: `Stock updated via paydue (${data.remark})`,
                },
            });

            if (data.amount < 0) {
                const remainingToSettle = absoluteWeight;

                // const receipts = await tx.receipt.findMany({
                //     where: {
                //         clientID: client.id,
                //         remainingWeight: {
                //             gt: 0,
                //         },
                //         type: 'BILL',
                //     },
                //     orderBy: {
                //         createdAt: 'asc',
                //     },
                // });

                // for (const receipt of receipts) {
                //     if (remainingToSettle <= 0.0001) break;

                //     const settledWeight = Math.min(remainingToSettle, receipt.remainingWeight);
                //     remainingToSettle -= settledWeight;

                //     await tx.receipt.update({
                //         where: {id: receipt.id},
                //         data: {
                //             remainingWeight: {
                //                 decrement: settledWeight,
                //             },
                //             customerWeight: {
                //                 increment: settledWeight,
                //             },
                //         },
                //     });

                //     await tx.clientHistory.create({
                //         data: {
                //             clientId: client.id,
                //             billNumber: receipt.billNumber,
                //             itemId: targetItemId,
                //             sizeId: targetSizeId,
                //             purity: targetPurity,
                //             remark: data.remark || 'Settle',
                //             weight: settledWeight,
                //             receiptId: receipt.id,
                //         },
                //     });
                // }

                if (remainingToSettle > 0.0001) {
                    await tx.clientHistory.create({
                        data: {
                            clientId: client.id,
                            itemId: targetItemId,
                            sizeId: targetSizeId,
                            purity: targetPurity,
                            remark: data.remark || 'Settle',
                            weight: remainingToSettle,
                        },
                    });
                }
            } else {
                await tx.clientHistory.create({
                    data: {
                        clientId: client.id,
                        itemId: targetItemId,
                        sizeId: targetSizeId,
                        purity: targetPurity,
                        remark: data.remark || 'Settle',
                        weight: -data.amount,
                    },
                });
            }

            let stockRemark = data.remark || (data.amount < 0 ? 'Received' : 'Given');
            if (stockRemark === 'Settle') {
                stockRemark = 'Received';
            }

            await tx.stockHistory.create({
                data: {
                    adminId: client.adminId,
                    itemId: targetItemId,
                    sizeId: targetSizeId,
                    purity: targetPurity,
                    remark: stockRemark,
                    weight: -data.amount,
                },
            });

            return client;
        });
    }
    async getClientHistory(id: string) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [client, history] = await Promise.all([
            prisma.client.findUnique({
                where: {id},
                // include: {
                //     receipts: {
                //         where: {
                //             type: 'BILL',
                //         },
                //         select: {
                //             totalWeight: true,
                //             remainingWeight: true,
                //         },
                //     },
                // },
            }),
            prisma.clientHistory.findMany({
                where: {
                    clientId: id,
                },
                include: {
                    item: true,
                    size: true,
                    // receipt table does not exist yet
                    // receipt: {
                    //     include: {
                    //         receiptItems: {
                    //             include: {
                    //                 item: true,
                    //                 size: true,
                    //             },
                    //         },
                    //     },
                    // },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
        ]);

        // const fineWeight = client?.receipts.reduce((sum, r) => sum + (r.totalWeight || 0), 0) || 0;
        // const pending =
        //     (client?.openingBalance || 0) +
        //     (client?.receipts.reduce((sum, r) => sum + (r.remainingWeight || 0), 0) || 0);

        return history.map((item) => {
            // const receiptData =
            // item.receipt && item.receipt.type === 'BILL'
            //     ? {
            //           ...item.receipt,
            //           totalWeight: round3(item.receipt.totalWeight),
            //           customerWeight: round3(item.receipt.customerWeight),
            //           remainingWeight: round3(item.receipt.remainingWeight),
            //           dueBalance: round3(item.receipt.dueBalance),
            //           totalBill: round3(item.receipt.totalBill),
            //           paid: round3(item.receipt.customerWeight),
            //           pending: round3(item.receipt.remainingWeight),
            //           receiptItems: item.receipt.receiptItems.map((ri) => ({
            //               ...ri,
            //               grossWeight: round3(ri.grossWeight),
            //               fineWeight: round3(ri.fineWeight),
            //           })),
            //       }
            //     : null;

            return {
                ...item,
                weight: round3(item.weight),
                // fineWeight,
                // pending,
                // receipt: receiptData,
            };
        });
    }
}

export default new clientService();
