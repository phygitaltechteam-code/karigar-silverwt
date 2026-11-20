import {FINE_ITEM_NAME} from '@utils/calculations';
import {z} from 'zod';
import prisma from '@client';
import {itemValidation} from '@validations/index';
import ApiError from '@utils/ApiError';
import httpStatus from 'http-status';
export type CreateItemInput = z.infer<typeof itemValidation.itemSchema>;
export type UpdateItemInput = z.infer<typeof itemValidation.updateItemSchema>;
class ItemService {
    async create(adminId: string, data: CreateItemInput) {
        const trimmedName = data.name.trim();
        const existing = await prisma.item.findFirst({
            where: {
                adminId,
                name: {
                    equals: trimmedName,
                    mode: 'insensitive',
                },
            },
        });
        if (existing) {
            throw new Error('Item with this name already exists');
        }

        return await prisma.item.create({
            data: {
                name: trimmedName,
                adminId,
            },
        });
    }
    async getAll(adminId: string) {
        return await prisma.item.findMany({
            where: {
                adminId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async getById(id: string) {
        return await prisma.item.findUnique({
            where: {id},
        });
    }
    async update(id: string, data: UpdateItemInput) {
        const item = await prisma.item.findUnique({
            where: {id},
        });
        if (!item) throw new ApiError(httpStatus.NOT_FOUND, 'Item not found');

        const trimmedName = data.name?.trim();
        if (trimmedName && trimmedName.toLowerCase() !== item.name.toLowerCase()) {
            const existing = await prisma.item.findFirst({
                where: {
                    adminId: item.adminId,
                    name: {
                        equals: trimmedName,
                        mode: 'insensitive',
                    },
                    id: {
                        not: id,
                    },
                },
            });
            if (existing) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Item with this name already exists');
            }
        }

        return await prisma.item.update({
            where: {id},
            data: {
                ...data,
                name: trimmedName || data.name,
            },
        });
    }
    async remove(id: string) {
        const item = await prisma.item.findUnique({where: {id}});
        if (!item) throw new ApiError(httpStatus.NOT_FOUND, 'Item not found');
        if (item.name === FINE_ITEM_NAME) {
            throw new ApiError(httpStatus.BAD_REQUEST, `${FINE_ITEM_NAME} item cannot be deleted`);
        }
        return await prisma.item.delete({
            where: {id},
        });
    }
}
export default new ItemService();
