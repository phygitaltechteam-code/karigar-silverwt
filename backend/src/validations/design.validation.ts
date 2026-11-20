// import {manufacturingProcess} from '@prisma/client';
// import {z} from 'zod';

// const createSchema = z.object({
//     name: z.string().min(1, 'Name is required').max(255),
//     process: z.nativeEnum(manufacturingProcess),
//     rate: z.number().optional(),
// });

// const updateSchema = createSchema.partial();

// const idSchema = z.string();

// export default {createSchema, updateSchema, idSchema, listQuerySchema};

import {manufacturingProcess} from '@prisma/client';
import {z} from 'zod';

// Accept any casing from the client ("Soldering", "SOLDERING")
const processSchema = z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
    z.nativeEnum(manufacturingProcess),
);

const baseSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(255),
    process: processSchema,
    rate: z.preprocess(
        (val) => (val === '' || val === null ? undefined : val),
        z.coerce.number().nonnegative('Rate cannot be negative').optional(),
    ),
});

const listQuerySchema = z.object({process: processSchema.optional()});

const createSchema = baseSchema.superRefine((data, ctx) => {
    if (data.process !== manufacturingProcess.SOLDERING && data.rate !== undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['rate'],
            message: 'Rate can only be added for the SOLDERING process',
        });
    }
});

const updateSchema = baseSchema.partial().superRefine((data, ctx) => {
    if (
        data.process !== undefined &&
        data.process !== manufacturingProcess.SOLDERING &&
        data.rate !== undefined
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['rate'],
            message: 'Rate can only be added for the SOLDERING process',
        });
    }
});

const idSchema = z.string().uuid();

export default {createSchema, updateSchema, idSchema, listQuerySchema};
