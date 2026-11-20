import {z} from 'zod';

const clientSchema = z.object({
    fullName: z.string().min(1, 'Name is required'),
    phoneNumber: z.string().min(10, 'Phone number is required'),
    address: z.string().optional(),
    openingBalance: z.number().optional().default(0),
});
const payDue = z.object({
    amount: z.number(),
    itemId: z.string().uuid().optional(),
    sizeId: z.string().uuid().optional(),
    purity: z.number().optional(),
    remark: z.string().optional(),
});
const updateScheme = clientSchema.partial();
export const idSchema = z.string();
export default {
    clientSchema: clientSchema,
    updateScheme: updateScheme,
    clientIdSchema: idSchema,
    payDue,
};
