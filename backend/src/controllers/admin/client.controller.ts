import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {clientService} from '@services/admin/index';
import {clientValidation} from '@validations/index';

import {ApiResponse, catchAsync} from '@utils/index';

const createClient = catchAsync(async (req: Request, res: Response) => {
    const data = clientValidation.clientSchema.parse(req.body);
    const result = await clientService.create(req.user.adminId || '', data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, result, 'Client created successfully'),
    );
});

const getAllClients = catchAsync(async (req: Request, res: Response) => {
    const result = await clientService.getAll(req.user.adminId || '');
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Clients fetched successfully'),
    );
});

const getClientById = catchAsync(async (req: Request, res: Response) => {
    const id = clientValidation.clientIdSchema.parse(req.params.id);
    const result = await clientService.getById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Client fetched successfully'),
    );
});

const updateClient = catchAsync(async (req: Request, res: Response) => {
    // console.log(req.body);
    const id = clientValidation.clientIdSchema.parse(req.params.id);
    const data = clientValidation.updateScheme.parse(req.body);
    const result = await clientService.update(req.user.adminId || '', id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Client updated successfully'),
    );
});
const payDue = catchAsync(async (req: Request, res: Response) => {
    const id = clientValidation.clientIdSchema.parse(req.params.id);
    const data = clientValidation.payDue.parse(req.body);
    const result = await clientService.paydue(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Client paydue successfully'),
    );
});
const deleteClient = catchAsync(async (req: Request, res: Response) => {
    const id = clientValidation.clientIdSchema.parse(req.params.id);
    const result = await clientService.remove(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Client deleted successfully'),
    );
});
const clientHistory = catchAsync(async (req: Request, res: Response) => {
    const id = clientValidation.clientIdSchema.parse(req.params.id);
    const result = await clientService.getClientHistory(id);
    // console.log(result);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Client fetched successfully'),
    );
});
export default {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    payDue,
    deleteClient,
    clientHistory,
};
