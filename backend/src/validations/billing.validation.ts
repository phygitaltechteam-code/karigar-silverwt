import {z} from 'zod';

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);
const num = z.coerce.number().finite();
const optText = z.preprocess(emptyToUndefined, z.string().trim().max(255).optional());

const billItemSchema = z.object({
    itemId: z.string({required_error: 'Item is required'}).uuid('Select an item for every row'),
    sizeId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    purity: num.min(0).max(100),
    grossWeight: num.positive('Gross weight must be greater than 0'),
    srp: z.preprocess(emptyToUndefined, num.default(0)),
    fineWeight: z.preprocess(emptyToUndefined, num.default(0)),
    laborRate: z.preprocess(emptyToUndefined, num.default(0)),
    laborType: z.preprocess(emptyToUndefined, z.enum(['GRAM', 'AMOUNT']).default('GRAM')),
    design: optText,
    stamp: optText,
    productCode: optText,
});

const advanceRowSchema = z.object({
    item: z.preprocess(emptyToUndefined, z.string().trim().max(100).default('')),
    purity: z.preprocess(emptyToUndefined, num.min(0).max(100).default(0)),
    grossWt: z.preprocess(emptyToUndefined, num.min(0).default(0)),
    fineWt: z.preprocess(emptyToUndefined, num.min(0).default(0)),
});

const billSchema = z.object({
    clientId: z.string({required_error: 'Client is required'}).uuid('Select a client'),
    receiptDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    items: z.array(billItemSchema).min(1, 'Add at least one item'),
    customerWeight: z.preprocess(emptyToUndefined, num.min(0).default(0)),
    advanceItems: z.array(advanceRowSchema).max(50).default([]),
    remainingWeight: z.preprocess(emptyToUndefined, num.default(0)),
    dueBalance: z.preprocess(emptyToUndefined, num.optional()),
    totalBill: z.preprocess(emptyToUndefined, num.optional()),
    totalWeight: z.preprocess(emptyToUndefined, num.default(0)),
    type: z.enum(['DRAFT', 'BILL']).default('BILL'),
});

const checkStockSchema = z.object({
    itemId: z.string().uuid(),
    sizeId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    purity: num,
    customerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
});

const idSchema = z.string().uuid('Invalid bill id');

export type BillInput = z.infer<typeof billSchema>;
export type CheckStockInput = z.infer<typeof checkStockSchema>;

export default {billSchema, checkStockSchema, idSchema};
