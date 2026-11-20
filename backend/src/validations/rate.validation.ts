import {z} from 'zod';

const createSchema = z.object({
    rate: z.coerce.number().nonnegative('Rate cannot be negative'),
});

const updateSchema = z.object({
    rate: z.coerce.number().nonnegative('Rate cannot be negative').optional(),
});

const idSchema = z.string().uuid();

export default {createSchema, updateSchema, idSchema};
