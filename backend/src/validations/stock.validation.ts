import {type} from '@prisma/client';
import {z} from 'zod';

const stockSchema = z.object({
    itemId: z.string().min(1, 'Item ID is required'),
    // Size is optional (e.g. raw silver has no size)
    sizeId: z.preprocess((v) => (v === '' ? null : v), z.string().min(1).nullable().optional()),
    weight: z.number(),
    purity: z.number(),
    design: z.string().trim().max(255).nullable().optional(),
    stamp: z.string().trim().max(255).nullable().optional(),
});
const updateStockSchema = stockSchema.partial();
const stockIncreemnt = z.object({
    type: z.nativeEnum(type),
    note: z.string().optional(),
    weight: z.number(),
    stockQty: z.number(),
});

const stockReportQuerySchema = z.object({
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    itemId: z.string().optional(),
    sizeId: z.string().optional(),
    purity: z.coerce.number().optional(),
});

export const idSchema = z.string();
export default {
    stockSchema: stockSchema,
    updateStockSchema: updateStockSchema,
    stockIdSchema: idSchema,
    stockIncreemnt,
    stockReportQuerySchema,
};
