import {z} from 'zod';

const processEnum = z.enum([
    'MELTING',
    'COMPANY',
    'PRESS',
    'SUTT',
    'BHARNI',
    'CUTTING',
    'WASH',
    'SOLDERING',
    'POLISHING',
    'VIBRATOR',
    'MEENA',
    'TASS',
]);

// Accept any casing from the client ("Melting", "melting", "MELTING")
export const manufacturingProcessSchema = z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
    processEnum,
);

// Empty phone/address from a form means "no value"
const emptyToNull = (val: unknown) =>
    typeof val === 'string' && val.trim() === '' ? null : val;

export const createSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(255),

    process: manufacturingProcessSchema.optional(),

    phone: z.preprocess(
        emptyToNull,
        z
        .string()
        .trim()
        .min(1, 'Phone cannot be empty')
        .max(20, 'Phone must not exceed 20 characters')
        .nullable()
        .optional(),
    ),

    address: z.string().trim().max(500).nullable().optional(),

    openingBalance: z.coerce.number().finite().nullable().optional(),
});

export const updateSchema = z
    .object({
        name: z.string().trim().min(1, 'Name is required').max(255).optional(),

        process: manufacturingProcessSchema.optional(),

        phone: z.preprocess(
            emptyToNull,
            z
            .string()
            .trim()
            .min(1, 'Phone cannot be empty')
            .max(20, 'Phone must not exceed 20 characters')
            .nullable()
            .optional(),
        ),

        address: z.string().trim().max(500).nullable().optional(),

        openingBalance: z.coerce.number().finite().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field is required for update',
    });

export const idSchema = z.string({required_error: 'ID is required'}).trim().uuid('Invalid id');

export type CreateKarigarInput = z.infer<typeof createSchema>;
export type UpdateKarigarInput = z.infer<typeof updateSchema>;
export type ManufacturingProcess = z.infer<typeof processEnum>;

export const paymentSchema = z.object({
    amount: z.coerce.number().finite().positive('Amount must be greater than 0'),
    type: z.enum(['DEBIT', 'CREDIT']).default('DEBIT'),
    account: z.string().trim().max(100).optional(),
    job: z.string().trim().max(200).optional(),
    stage: z.string().trim().max(100).optional(),
    stageId: z.string().trim().max(255).optional(),
    note: z.string().trim().max(500).optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export default {
    paymentSchema,
    createSchema,
    updateSchema,
    idSchema,
    manufacturingProcessSchema,
};
