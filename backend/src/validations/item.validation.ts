import {z} from 'zod';

const ItemSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});
const updateItemSchema = ItemSchema.partial();

export const idSchema = z.string();
export default {
    itemSchema: ItemSchema,
    updateItemSchema: updateItemSchema,
    itemIdSchema: idSchema,
};
