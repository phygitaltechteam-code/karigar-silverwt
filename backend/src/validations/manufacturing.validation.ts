import {z} from 'zod';
import {ProcessEntryStatus, ProcessStage} from '@prisma/client';

// "galai", "Galai" and "GALAI" all map to ProcessStage.GALAI
const processSchema = z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
    z.nativeEnum(ProcessStage, {
        errorMap: () => ({
            message: `Process must be one of: ${Object.values(ProcessStage).join(', ')}`,
        }),
    }),
);

const emptyToUndefined = (val: unknown) => (val === '' || val === null ? undefined : val);
const weight = z.coerce.number().finite().nonnegative('Weight cannot be negative');
const positiveWeight = z.coerce.number().finite().positive('Weight must be greater than 0');
const purity = z.coerce.number().finite().min(0).max(100, 'Purity cannot exceed 100');
const optWeight = z.preprocess(emptyToUndefined, weight.optional());
const optPurity = z.preprocess(emptyToUndefined, purity.optional());
const optText = z.preprocess(emptyToUndefined, z.coerce.string().trim().max(255).optional());
const optUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());
const details = z.record(z.unknown()).optional();

const idSchema = z.string().uuid('Invalid id');

const listQuerySchema = z.object({
    status: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
        z.nativeEnum(ProcessEntryStatus).optional(),
    ),
});

// "Add Galai": silver taken from Stock by purity, melted to a target purity
const galaiReceiveSchema = z.object({
    items: z
        .array(z.object({purity: purity.positive('Purity is required'), weight: positiveWeight}))
        .min(1, 'Add at least one material row'),
    targetPurity: optPurity,
    targetWeight: optWeight,
    bronze: optWeight,
    meltingPurity: optPurity,
    meltingWeight: optWeight,
    scrapWeight: optWeight,
    loss: z.preprocess(emptyToUndefined, z.coerce.number().finite().optional()),
    stamp: optText,
    particular: optText,
});

const entryFields = {
    particular: optText,
    stamp: optText,
    karigarId: optUuid,
    karigarName: optText,
    rate: optWeight,
    purity: optPurity,
    grossWt: optWeight,
    expectedFine: optWeight,
    fineWeight: optWeight,
    scrapWeight: optWeight,
    loss: z.preprocess(emptyToUndefined, z.coerce.number().finite().optional()),
    details,
};

const updateEntrySchema = z.object(entryFields);

const completeEntrySchema = z.object({
    ...entryFields,
    // Output card for the next stage; defaults to fine weight at the entry's purity
    card: z
        .object({
            weight: optWeight,
            purity: optPurity,
            stamp: optText,
            design: optText,
            size: optText,
            qty: optText,
            details,
        })
        .optional(),
});

const dispatchRowSchema = z.object({
    weight: optWeight,
    karigarId: optUuid,
    karigarName: optText,
    rate: optWeight,
    stamp: optText,
    particular: optText,
    details,
});

const dispatchSchema = z.object({
    cardId: idSchema,
    toProcess: processSchema,
    weight: positiveWeight,
    karigarId: optUuid,
    karigarName: optText,
    rate: optWeight,
    stamp: optText,
    particular: optText,
    details,
    // Bharni (one row per part) and Cutting (size/qty breakdown) send several rows
    rows: z.array(dispatchRowSchema).optional(),
});

// Finished goods sent to Stock: the design name becomes the Stock item
const finishedToStockSchema = z.object({
    designName: z.string().trim().min(1, 'Design is required to add to Stock').max(255),
    size: optText,
    stamp: optText,
    purity: purity,
    weight: positiveWeight,
    sourceProcess: optText,
    processTrack: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    kind: z.enum(['LOOSE', 'PRODUCT']).default('LOOSE'),
});

// Part of a Loose Stock row given to Packaging
const looseToPackagingSchema = z.object({
    stockId: z.string().uuid('Invalid stock'),
    weight: positiveWeight,
});

export default {
    looseToPackagingSchema,
    finishedToStockSchema,
    processSchema,
    idSchema,
    listQuerySchema,
    galaiReceiveSchema,
    updateEntrySchema,
    completeEntrySchema,
    dispatchSchema,
};
