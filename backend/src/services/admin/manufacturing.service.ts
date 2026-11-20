import {
    Prisma,
    ProcessEntry,
    ProcessEntryStatus,
    ProcessStage,
    ProcessStockCard,
} from '@prisma/client';
import httpStatus from 'http-status';
import {z} from 'zod';
import prisma from '@client';
import {ApiError} from '@utils/index';
import manufacturingValidation from '@validations/manufacturing.validation';

type GalaiReceiveInput = z.infer<typeof manufacturingValidation.galaiReceiveSchema>;
type UpdateEntryInput = z.infer<typeof manufacturingValidation.updateEntrySchema>;
type CompleteEntryInput = z.infer<typeof manufacturingValidation.completeEntrySchema>;
type DispatchInput = z.infer<typeof manufacturingValidation.dispatchSchema>;
type FinishedToStockInput = z.infer<typeof manufacturingValidation.finishedToStockSchema>;
type DispatchRow = NonNullable<DispatchInput['rows']>[number];
type Tx = Prisma.TransactionClient;

// Galai takes silver from the SILVER item, by purity.
// The default SILVER row has no purity: that is fine silver (100%).
export const FINE_SILVER_PURITY = 100;
const silverStockWhere = (adminId: string, purity?: number): Prisma.StockWhereInput => ({
    adminId,
    item: {name: {equals: 'SILVER', mode: 'insensitive'}},
    weight: {gt: EPSILON},
    ...(purity === undefined
        ? {}
        : Math.abs(purity - FINE_SILVER_PURITY) < 0.001
          ? {OR: [{purity: FINE_SILVER_PURITY}, {purity: null}]}
          : {purity}),
});

// Weights are grams with 3 decimals; ignore floating-point dust below that
const EPSILON = 0.0005;
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const fineOf = (gross: number, purity: number) => round3((gross * purity) / 100);

/** GALAI -> "Galai" (the label the UI uses for sourceProcess) */
export const stageLabel = (stage: ProcessStage) =>
    stage.charAt(0) + stage.slice(1).toLowerCase();

type StockUsage = {stockId: string; itemId: string; sizeId: string | null; weight: number};

const asObject = (val: Prisma.JsonValue | null | undefined): Record<string, unknown> =>
    val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : {};

/** Flatten an entry for the UI: stage-specific details first, real columns win */
export const toEntryDto = (entry: ProcessEntry) => ({
    ...asObject(entry.details),
    ...entry,
    processLabel: stageLabel(entry.process),
    isCompleted: entry.status === ProcessEntryStatus.COMPLETED,
});

export const toCardDto = (card: ProcessStockCard) => ({
    ...asObject(card.details),
    ...card,
    Stamp: card.stamp,
    processLabel: stageLabel(card.process),
});

class ManufacturingService {
    // ------------------------------------------------------------------ stock

    /** SILVER stock available for Galai, summed per purity (no purity = 100%) */
    async getAvailableStock(adminId: string) {
        const groups = await prisma.stock.groupBy({
            by: ['purity'],
            where: silverStockWhere(adminId),
            _sum: {weight: true},
        });
        const byPurity = new Map<number, number>();
        for (const g of groups) {
            const p = g.purity ?? FINE_SILVER_PURITY;
            byPurity.set(p, round3((byPurity.get(p) ?? 0) + (g._sum.weight ?? 0)));
        }
        if (!byPurity.has(FINE_SILVER_PURITY)) byPurity.set(FINE_SILVER_PURITY, 0);
        return [...byPurity.entries()]
            .map(([purity, weight]) => ({purity, weight}))
            .sort((a, b) => b.purity - a.purity);
    }

    /** Take `weight` grams of `purity` from Stock, oldest rows first */
    private async takeFromStock(
        tx: Tx,
        adminId: string,
        purity: number,
        weight: number,
        remark: string,
    ): Promise<StockUsage[]> {
        const rows = await tx.stock.findMany({
            where: silverStockWhere(adminId, purity),
            orderBy: {createdAt: 'asc'},
        });
        const available = round3(rows.reduce((sum, r) => sum + r.weight, 0));
        if (weight > available + EPSILON) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Not enough silver at ${purity}% in stock: available ${available} g, requested ${round3(weight)} g`,
            );
        }

        const usage: StockUsage[] = [];
        let remaining = weight;
        for (const row of rows) {
            if (remaining <= EPSILON) break;
            const take = round3(Math.min(row.weight, remaining));
            // Guarded decrement so two simultaneous requests cannot overdraw a row
            const updated = await tx.stock.updateMany({
                where: {id: row.id, weight: {gte: take - EPSILON}},
                data: {weight: {decrement: take}},
            });
            if (updated.count === 0) {
                throw new ApiError(httpStatus.CONFLICT, 'Stock changed, please try again');
            }
            await tx.stockHistory.create({
                data: {
                    adminId,
                    itemId: row.itemId,
                    sizeId: row.sizeId,
                    purity,
                    remark,
                    weight: -take,
                },
            });
            usage.push({stockId: row.id, itemId: row.itemId, sizeId: row.sizeId, weight: take});
            remaining = round3(remaining - take);
        }
        return usage;
    }

    private async returnToStock(tx: Tx, adminId: string, usage: StockUsage[], purity: number, remark: string) {
        for (const u of usage) {
            await tx.stock.update({where: {id: u.stockId}, data: {weight: {increment: u.weight}}});
            await tx.stockHistory.create({
                data: {adminId, itemId: u.itemId, sizeId: u.sizeId, purity, remark, weight: u.weight},
            });
        }
    }

    // ------------------------------------------------------------------ galai

    async galaiReceive(adminId: string, data: GalaiReceiveInput) {
        const totalReceived = round3(data.items.reduce((s, i) => s + i.weight, 0));
        const totalFine = round3(data.items.reduce((s, i) => s + (i.weight * i.purity) / 100, 0));
        const avgPurity = totalReceived > 0 ? round3((totalFine / totalReceived) * 100) : 0;

        const purity = data.meltingPurity || data.targetPurity || avgPurity;
        const grossWt = round3(data.meltingWeight || data.targetWeight || totalReceived);

        return prisma.$transaction(async (tx) => {
            const stockUsage: (StockUsage & {purity: number})[] = [];
            for (const item of data.items) {
                const used = await this.takeFromStock(tx, adminId, item.purity, item.weight, 'Galai');
                stockUsage.push(...used.map((u) => ({...u, purity: item.purity})));
            }

            const entry = await tx.processEntry.create({
                data: {
                    adminId,
                    process: ProcessStage.GALAI,
                    particular: data.particular || `Galai ${purity}%`,
                    stamp: data.stamp,
                    purity,
                    grossWt,
                    expectedFine: fineOf(grossWt, purity),
                    sourceProcess: 'Stock',
                    details: {
                        items: data.items,
                        totalReceivedWeight: totalReceived,
                        totalFineWeight: totalFine,
                        avgPurity,
                        targetPurity: data.targetPurity ?? null,
                        targetWeight: data.targetWeight ?? null,
                        bronze: data.bronze ?? null,
                        meltingPurity: data.meltingPurity ?? null,
                        meltingWeight: data.meltingWeight ?? null,
                        meltingScrap: data.scrapWeight ?? null,
                        meltingLoss: data.loss ?? null,
                        stockUsage,
                    } as Prisma.InputJsonValue,
                },
            });
            return toEntryDto(entry);
        });
    }

    // ---------------------------------------------------------------- entries

    async listEntries(adminId: string, process: ProcessStage, status?: ProcessEntryStatus) {
        const entries = await prisma.processEntry.findMany({
            where: {adminId, process, ...(status ? {status} : {})},
            orderBy: {createdAt: 'desc'},
        });
        return entries.map(toEntryDto);
    }

    async history(adminId: string, process: ProcessStage) {
        const entries = await prisma.processEntry.findMany({
            where: {adminId, process, status: ProcessEntryStatus.COMPLETED},
            orderBy: {completedAt: 'desc'},
        });
        return entries.map(toEntryDto);
    }

    private async getOwnedEntry(tx: Tx, adminId: string, process: ProcessStage, id: string) {
        const entry = await tx.processEntry.findFirst({where: {id, adminId, process}});
        if (!entry) throw new ApiError(httpStatus.NOT_FOUND, `${stageLabel(process)} entry not found`);
        return entry;
    }

    private async assertKarigar(tx: Tx, adminId: string, karigarId?: string) {
        if (!karigarId) return;
        const k = await tx.karigar.findFirst({where: {id: karigarId, adminId}});
        if (!k) throw new ApiError(httpStatus.BAD_REQUEST, 'Karigar not found');
    }

    private mergeDetails(entry: ProcessEntry, extra?: Record<string, unknown>) {
        if (!extra) return undefined;
        return {...asObject(entry.details), ...extra} as Prisma.InputJsonValue;
    }

    async updateEntry(adminId: string, process: ProcessStage, id: string, data: UpdateEntryInput) {
        return prisma.$transaction(async (tx) => {
            const entry = await this.getOwnedEntry(tx, adminId, process, id);
            if (entry.status !== ProcessEntryStatus.PENDING) {
                throw new ApiError(httpStatus.CONFLICT, 'Completed entries cannot be edited');
            }
            await this.assertKarigar(tx, adminId, data.karigarId);
            const {details, ...fields} = data;
            const updated = await tx.processEntry.update({
                where: {id},
                data: {...fields, details: this.mergeDetails(entry, details)},
            });
            return toEntryDto(updated);
        });
    }

    /** Finish a pending entry and put its output on a stock card for the next stage */
    async completeEntry(adminId: string, process: ProcessStage, id: string, data: CompleteEntryInput) {
        return prisma.$transaction(async (tx) => {
            const entry = await this.getOwnedEntry(tx, adminId, process, id);
            // Guarded status change so a double click cannot create two cards
            const claimed = await tx.processEntry.updateMany({
                where: {id, status: ProcessEntryStatus.PENDING},
                data: {status: ProcessEntryStatus.COMPLETED, completedAt: new Date()},
            });
            if (claimed.count === 0) {
                throw new ApiError(httpStatus.CONFLICT, 'This entry is already completed');
            }
            await this.assertKarigar(tx, adminId, data.karigarId);

            const {details, card: cardInput, ...fields} = data;
            const updated = await tx.processEntry.update({
                where: {id},
                data: {...fields, details: this.mergeDetails(entry, details)},
            });

            const cardWeight = round3(
                cardInput?.weight ?? updated.fineWeight ?? updated.expectedFine ?? 0,
            );
            let card: ProcessStockCard | null = null;
            if (cardWeight > EPSILON) {
                const extra = asObject(entry.details);
                card = await tx.processStockCard.create({
                    data: {
                        adminId,
                        process,
                        purity: cardInput?.purity ?? updated.purity,
                        stamp: cardInput?.stamp ?? updated.stamp ?? null,
                        design: cardInput?.design ?? (extra.design as string | undefined),
                        size: cardInput?.size ?? (extra.size as string | undefined),
                        qty: cardInput?.qty ?? (extra.qty != null ? String(extra.qty) : undefined),
                        totalWeight: cardWeight,
                        availableWeight: cardWeight,
                        sourceEntryId: id,
                        details: cardInput?.details as Prisma.InputJsonValue | undefined,
                    },
                });
            }
            return {entry: toEntryDto(updated), card: card ? toCardDto(card) : null};
        });
    }

    /** Undo a pending entry: give back the stock or card weight it consumed */
    async revertEntry(adminId: string, process: ProcessStage, id: string) {
        return prisma.$transaction(async (tx) => {
            const entry = await this.getOwnedEntry(tx, adminId, process, id);
            if (entry.status !== ProcessEntryStatus.PENDING) {
                throw new ApiError(httpStatus.CONFLICT, 'Only pending entries can be reverted');
            }
            const extra = asObject(entry.details);

            const usage = Array.isArray(extra.stockUsage)
                ? (extra.stockUsage as (StockUsage & {purity: number})[])
                : [];
            for (const u of usage) {
                await this.returnToStock(tx, adminId, [u], u.purity, `${stageLabel(process)} revert`);
            }

            const dispatched = Number(extra.dispatchedWeight ?? 0);
            if (entry.sourceCardId && dispatched > EPSILON) {
                await tx.processStockCard.updateMany({
                    where: {id: entry.sourceCardId, adminId},
                    data: {availableWeight: {increment: dispatched}},
                });
            }

            await tx.processEntry.delete({where: {id}});
            return {id};
        });
    }

    /**
     * Finished goods into Stock (Inward), item = design name.
     * LOOSE (from Vibrator etc.): same item + size + purity adds up on one loose row.
     * PRODUCT (packed): always a new row, so every pack has its own product ID.
     */
    async finishedToStock(adminId: string, data: FinishedToStockInput) {
        const weight = round3(data.weight);
        const kind = data.kind ?? 'LOOSE';
        return prisma.$transaction(async (tx) => {
            let item = await tx.item.findFirst({
                where: {adminId, name: {equals: data.designName, mode: 'insensitive'}},
            });
            if (!item) item = await tx.item.create({data: {adminId, name: data.designName}});

            let sizeId: string | null = null;
            if (data.size) {
                let size = await tx.size.findFirst({
                    where: {adminId, size: {equals: data.size, mode: 'insensitive'}},
                });
                if (!size) size = await tx.size.create({data: {adminId, size: data.size}});
                sizeId = size.id;
            }

            const existing =
                kind === 'LOOSE'
                    ? await tx.stock.findFirst({
                          where: {adminId, itemId: item.id, sizeId, purity: data.purity, kind: 'LOOSE'},
                      })
                    : null;
            const stock = existing
                ? await tx.stock.update({
                      where: {id: existing.id},
                      data: {
                          weight: {increment: weight},
                          ...(data.stamp && !existing.stamp ? {stamp: data.stamp} : {}),
                          ...(data.processTrack?.length && existing.processTrack.length === 0
                              ? {processTrack: data.processTrack}
                              : {}),
                      },
                  })
                : await tx.stock.create({
                      data: {
                          adminId,
                          itemId: item.id,
                          sizeId,
                          purity: data.purity,
                          weight,
                          design: data.designName,
                          stamp: data.stamp ?? null,
                          processTrack: data.processTrack ?? [],
                          kind,
                          packedWeight: kind === 'PRODUCT' ? weight : null,
                      },
                  });

            await tx.stockHistory.create({
                data: {
                    adminId,
                    itemId: item.id,
                    sizeId,
                    purity: data.purity,
                    remark: `INWARD from ${data.sourceProcess || 'Manufacturing'}${kind === 'LOOSE' ? ' (Loose)' : ''}`,
                    weight,
                },
            });
            return {...stock, itemName: item.name};
        });
    }

    /** Give part of a Loose Stock row to Packaging; the rest stays on the loose row */
    async looseToPackaging(adminId: string, data: {stockId: string; weight: number}) {
        const weight = round3(data.weight);
        return prisma.$transaction(async (tx) => {
            const stock = await tx.stock.findFirst({
                where: {id: data.stockId, adminId, kind: 'LOOSE'},
                include: {item: true, size: true},
            });
            if (!stock) throw new ApiError(httpStatus.NOT_FOUND, 'Loose stock not found');
            if (weight > stock.weight + EPSILON) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Only ${round3(stock.weight)} G is available in this loose stock`,
                );
            }
            const updated = await tx.stock.update({
                where: {id: stock.id},
                data: {weight: Math.max(0, round3(stock.weight - weight))},
            });
            await tx.stockHistory.create({
                data: {
                    adminId,
                    itemId: stock.itemId,
                    sizeId: stock.sizeId,
                    purity: stock.purity,
                    remark: 'OUTWARD to Packaging (Loose)',
                    weight,
                },
            });
            return {
                stockId: stock.id,
                remaining: round3(updated.weight),
                weight,
                design: stock.design || stock.item.name,
                stamp: stock.stamp,
                size: stock.size?.size ?? null,
                purity: stock.purity ?? 100,
                processTrack: stock.processTrack,
            };
        });
    }

    /**
     * Pack part of a Loose Stock row in one step: the weight leaves the loose row
     * and becomes a new Product row (its id is the product ID). The rest stays loose.
     */
    async packLoose(adminId: string, data: {stockId: string; weight: number}) {
        const weight = round3(data.weight);
        return prisma.$transaction(async (tx) => {
            const stock = await tx.stock.findFirst({
                where: {id: data.stockId, adminId, kind: 'LOOSE'},
                include: {item: true, size: true},
            });
            if (!stock) throw new ApiError(httpStatus.NOT_FOUND, 'Loose stock not found');
            if (weight > stock.weight + EPSILON) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Only ${round3(stock.weight)} G is available in this loose stock`,
                );
            }
            const updated = await tx.stock.update({
                where: {id: stock.id},
                data: {weight: Math.max(0, round3(stock.weight - weight))},
            });
            const prevTrack = Array.isArray(stock.processTrack) ? (stock.processTrack as string[]) : [];
            const track = [...prevTrack];
            for (const s of ['Loose Stock', 'Packaging']) if (track[track.length - 1] !== s) track.push(s);
            const product = await tx.stock.create({
                data: {
                    adminId,
                    itemId: stock.itemId,
                    sizeId: stock.sizeId,
                    purity: stock.purity,
                    weight,
                    design: stock.design || stock.item.name,
                    stamp: stock.stamp,
                    processTrack: track,
                    kind: 'PRODUCT',
                    packedWeight: weight,
                },
            });
            await tx.stockHistory.create({
                data: {
                    adminId,
                    itemId: stock.itemId,
                    sizeId: stock.sizeId,
                    purity: stock.purity,
                    remark: 'PACKED from Loose Stock',
                    weight,
                },
            });
            return {
                productId: product.id,
                productCode: `PRD-${product.id.slice(0, 8).toUpperCase()}`,
                remaining: round3(updated.weight),
                weight,
                design: product.design,
            };
        });
    }

    /** Scrap recorded on completed manufacturing rows, summed per purity */
    async listScrap(adminId: string) {
        const groups = await prisma.processEntry.groupBy({
            by: ['purity'],
            where: {adminId, status: ProcessEntryStatus.COMPLETED, scrapWeight: {gt: EPSILON}},
            _sum: {scrapWeight: true},
            _count: {_all: true},
        });
        return groups.map((g) => ({
            purity: g.purity,
            weight: round3(g._sum.scrapWeight ?? 0),
            count: g._count._all,
        }));
    }

    // ------------------------------------------------------------------ cards

    async listCards(adminId: string, process: ProcessStage) {
        const cards = await prisma.processStockCard.findMany({
            where: {adminId, process, availableWeight: {gt: EPSILON}},
            orderBy: {createdAt: 'desc'},
        });
        return cards.map(toCardDto);
    }

    /** Send weight from a stage's stock card into the next stage's table */
    async dispatch(adminId: string, data: DispatchInput) {
        return prisma.$transaction(async (tx) => {
            const card = await tx.processStockCard.findFirst({where: {id: data.cardId, adminId}});
            if (!card) throw new ApiError(httpStatus.NOT_FOUND, 'Stock card not found');
            if (card.process === data.toProcess) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot send a card to its own stage');
            }

            const weight = round3(data.weight);
            const taken = await tx.processStockCard.updateMany({
                where: {id: card.id, availableWeight: {gte: weight - EPSILON}},
                data: {availableWeight: {decrement: weight}},
            });
            if (taken.count === 0) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Weight ${weight} g exceeds available ${round3(card.availableWeight)} g`,
                );
            }

            const rows: Partial<DispatchRow>[] = data.rows && data.rows.length > 0 ? data.rows : [{}];
            // If row weights add up to the total, each row owns its share (Bharni);
            // otherwise every row describes the same lot (Cutting size breakdown)
            const rowSum = round3(rows.reduce((sum, r) => sum + (r.weight ?? 0), 0));
            const rowsSplitWeight = rows.length > 1 && Math.abs(rowSum - weight) <= EPSILON;

            const created: ProcessEntry[] = [];
            for (const [idx, r] of rows.entries()) {
                const karigarId = r.karigarId ?? data.karigarId;
                await this.assertKarigar(tx, adminId, karigarId);

                const gross = round3(r.weight ?? weight);
                const dispatchedWeight = rowsSplitWeight ? gross : idx === 0 ? weight : 0;
                created.push(
                    await tx.processEntry.create({
                        data: {
                            adminId,
                            process: data.toProcess,
                            karigarId,
                            karigarName: r.karigarName ?? data.karigarName,
                            rate: r.rate ?? data.rate,
                            particular: r.particular ?? data.particular ?? card.design ?? card.stamp,
                            stamp: r.stamp ?? data.stamp ?? card.stamp,
                            purity: card.purity,
                            grossWt: gross,
                            expectedFine: fineOf(gross, card.purity),
                            sourceProcess: stageLabel(card.process),
                            sourceCardId: card.id,
                            details: {
                                ...(data.details ?? {}),
                                ...(r.details ?? {}),
                                dispatchedWeight,
                            } as Prisma.InputJsonValue,
                        },
                    }),
                );
            }

            const after = await tx.processStockCard.findUniqueOrThrow({where: {id: card.id}});
            return {card: toCardDto(after), entries: created.map(toEntryDto)};
        });
    }
}

export default new ManufacturingService();
