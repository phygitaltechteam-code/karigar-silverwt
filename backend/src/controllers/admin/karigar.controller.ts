import {Request, Response} from 'express';
import catchAsync from '@utils/catchAsync';
import ApiResponse from '@utils/ApiResponse';
import httpStatus from 'http-status';
import {karigarService} from '@services/admin/index';
import karigarValidation from '@validations/karigar.validation';
// import type {CreateKarigarInput, UpdateKarigarInput} from '@validations/karigar.validation';

const createKarigar = catchAsync(async (req: Request, res: Response) => {
    const adminId = karigarValidation.idSchema.parse(req.user?.adminId);
    const data = karigarValidation.createSchema.parse(req.body);

    const karigar = await karigarService.createKarigar(adminId, data);

    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, karigar, 'Karigar created successfully'),
    );
});

const getAllKarigars = catchAsync(async (req: Request, res: Response) => {
    const adminId = karigarValidation.idSchema.parse(req.user?.adminId);

    const karigars = await karigarService.getAllKarigars(adminId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, karigars, 'Karigars fetched successfully'),
    );
});

const getSingleKarigar = catchAsync(async (req: Request, res: Response) => {
    const adminId = karigarValidation.idSchema.parse(req.user?.adminId);
    const id = karigarValidation.idSchema.parse(req.params.id);

    const karigar = await karigarService.getSingleKarigar(adminId, id);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, karigar, 'Karigar fetched successfully'),
    );
});

const updateKarigar = catchAsync(async (req: Request, res: Response) => {
    const adminId = karigarValidation.idSchema.parse(req.user?.adminId);
    const id = karigarValidation.idSchema.parse(req.params.id);
    const data = karigarValidation.updateSchema.parse(req.body);

    const karigar = await karigarService.updateKarigar(adminId, id, data);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, karigar, 'Karigar updated successfully'),
    );
});

const deleteKarigar = catchAsync(async (req: Request, res: Response) => {
    const adminId = karigarValidation.idSchema.parse(req.user?.adminId);
    const id = karigarValidation.idSchema.parse(req.params.id);

    const karigar = await karigarService.deleteKarigar(adminId, id);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, karigar, 'Karigar deleted successfully'),
    );
});

const listPayments = catchAsync(async (req: Request, res: Response) => {
    const adminId = karigarValidation.idSchema.parse(req.user?.adminId);
    const id = karigarValidation.idSchema.parse(req.params.id);
    const payments = await karigarService.listPayments(adminId, id);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, payments, 'Payments fetched'));
});

const addPayment = catchAsync(async (req: Request, res: Response) => {
    const adminId = karigarValidation.idSchema.parse(req.user?.adminId);
    const id = karigarValidation.idSchema.parse(req.params.id);
    const data = karigarValidation.paymentSchema.parse(req.body);
    const payment = await karigarService.addPayment(adminId, id, data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, payment, 'Payment recorded'),
    );
});

export default {
    listPayments,
    addPayment,
    createKarigar,
    getAllKarigars,
    getSingleKarigar,
    updateKarigar,
    deleteKarigar,
};
