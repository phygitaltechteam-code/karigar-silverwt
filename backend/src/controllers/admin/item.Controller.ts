import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {itemService} from '@services/admin/index';
import {itemValidation} from '@validations/index';

import {ApiResponse, catchAsync} from '@utils/index';

const createItem = catchAsync(async (req: Request, res: Response) => {
    const data = itemValidation.itemSchema.parse(req.body);

    const result1 = await itemService.create(req.user.adminId || '', data);
    // console.log(result1);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, result1, 'Item created successfully'),
    );
});
const getAllItems = catchAsync(async (req: Request, res: Response) => {
    const result = await itemService.getAll(req.user.adminId || '');
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Items fetched successfully'),
    );
});

const getItemById = catchAsync(async (req: Request, res: Response) => {
    const id = itemValidation.itemIdSchema.parse(req.params.id);
    const result = await itemService.getById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Item fetched successfully'),
    );
});
const updateItem = catchAsync(async (req: Request, res: Response) => {
    const id = itemValidation.itemIdSchema.parse(req.params.id);
    const data = itemValidation.updateItemSchema.parse(req.body);

    const result = await itemService.update(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Item updated successfully'),
    );
});

const deleteItem = catchAsync(async (req: Request, res: Response) => {
    const id = itemValidation.itemIdSchema.parse(req.params.id);
    const result = await itemService.remove(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Item deleted successfully'),
    );
});

export default {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem,
};
