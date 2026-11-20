import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {designService} from '@services/admin/index';
import {designValidation} from '@validations/index';
import {ApiResponse, catchAsync} from '@utils/index';

const create = catchAsync(async (req: Request, res: Response) => {
    const adminId = designValidation.idSchema.parse(req.user?.adminId);
    const data = designValidation.createSchema.parse(req.body);
    const design = await designService.createDesign(adminId, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, design, 'Design created successfully'),
    );
});

const update = catchAsync(async (req: Request, res: Response) => {
    const adminId = designValidation.idSchema.parse(req.user?.adminId);
    const id = designValidation.idSchema.parse(req.params.id);
    const data = designValidation.updateSchema.parse(req.body);
    const design = await designService.updateDesign(adminId, id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, design, 'Design updated successfully'),
    );
});

const getAll = catchAsync(async (req: Request, res: Response) => {
    const adminId = designValidation.idSchema.parse(req.user?.adminId);
    const {process} = designValidation.listQuerySchema.parse(req.query);
    const designs = await designService.getAll(adminId, process);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, designs, 'Designs fetched successfully'),
    );
});

const getById = catchAsync(async (req: Request, res: Response) => {
    const adminId = designValidation.idSchema.parse(req.user?.adminId);
    const id = designValidation.idSchema.parse(req.params.id);
    const design = await designService.getById(adminId, id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, design, 'Design fetched successfully'),
    );
});

const remove = catchAsync(async (req: Request, res: Response) => {
    const adminId = designValidation.idSchema.parse(req.user?.adminId);
    const id = designValidation.idSchema.parse(req.params.id);
    const design = await designService.deleteDesign(adminId, id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, design, 'Design removed successfully'),
    );
});

export default {
    create,
    update,
    getAll,
    getById,
    remove,
};
