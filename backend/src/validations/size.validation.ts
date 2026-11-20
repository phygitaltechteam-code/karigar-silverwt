import {z} from 'zod';

const sizeSchema = z.object({
    size: z.string().min(1, 'Size is required'),
});
const updateSizeSchema = sizeSchema.partial();

export const idSchema = z.string();
export default {
    sizeSchema: sizeSchema,
    updateSizeSchema: updateSizeSchema,
    sizeIdSchema: idSchema,
};
