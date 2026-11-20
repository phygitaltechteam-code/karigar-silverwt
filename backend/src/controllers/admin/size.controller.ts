import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {sizeService} from '@services/admin/index';
import {sizeValidation} from '@validations/index';

import {ApiResponse, catchAsync} from '@utils/index';

const createSize = catchAsync(async (req: Request, res: Response) => {
    const data = sizeValidation.sizeSchema.parse(req.body);
    const result = await sizeService.create(req.user.adminId || '', data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, result, 'Size created successfully'),
    );
});

const getAllSizes = catchAsync(async (req: Request, res: Response) => {
    const result = await sizeService.getAll(req.user.adminId || '');
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Sizes fetched successfully'),
    );
});

const getSizeById = catchAsync(async (req: Request, res: Response) => {
    const id = sizeValidation.sizeIdSchema.parse(req.params.id);
    const result = await sizeService.getById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Size fetched successfully'),
    );
});

const updateSize = catchAsync(async (req: Request, res: Response) => {
    const id = sizeValidation.sizeIdSchema.parse(req.params.id);
    const data = sizeValidation.updateSizeSchema.parse(req.body);
    const result = await sizeService.update(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Size updated successfully'),
    );
});

const deleteSize = catchAsync(async (req: Request, res: Response) => {
    const id = sizeValidation.sizeIdSchema.parse(req.params.id);
    const result = await sizeService.remove(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Size deleted successfully'),
    );
});

export default {
    createSize,
    getAllSizes,
    getSizeById,
    updateSize,
    deleteSize,
};
