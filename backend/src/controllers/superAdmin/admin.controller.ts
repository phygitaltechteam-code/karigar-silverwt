import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {adminService} from '@services/superAdmin/index';
import superAdminValidation from '@validations/superAdmin.validation';
import {ApiResponse, catchAsync} from '@utils/index';

const createAdmin = catchAsync(async (req: Request, res: Response) => {
    const data = superAdminValidation.createAdminSchema.parse(req.body);
    const result = await adminService.create(data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, result, 'Admin created successfully'),
    );
});

const getAllAdmins = catchAsync(async (_req: Request, res: Response) => {
    const result = await adminService.getAll();
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Admins fetched successfully'),
    );
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
    const id = superAdminValidation.adminIdSchema.parse(req.params.id);
    const result = await adminService.getById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Admin fetched successfully'),
    );
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
    const id = superAdminValidation.adminIdSchema.parse(req.params.id);
    const data = superAdminValidation.updateAdminSchema.parse(req.body);
    const result = await adminService.update(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Admin updated successfully'),
    );
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
    const id = superAdminValidation.adminIdSchema.parse(req.params.id);
    const result = await adminService.remove(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Admin deleted successfully'),
    );
});

export default {createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin};
