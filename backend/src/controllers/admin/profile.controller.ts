import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {ProfileService} from '@services/admin/index';
import {adminValidation, licenseKeyValidation} from '@validations/index';

import {ApiResponse, catchAsync} from '@utils/index';

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const adminId = adminValidation.idSchema.parse(req.user.adminId);
    const data = adminValidation.updateAdminProfileSchema.parse(req.body);
    const result = await ProfileService.update(adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Profile updated successfully'),
    );
});

const getProfile = catchAsync(async (req: Request, res: Response) => {
    const adminId = adminValidation.idSchema.parse(req.user.adminId);
    const result = await ProfileService.getById(adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Profile fetched successfully'),
    );
});
const updatePdfHeader = catchAsync(async (req: Request, res: Response) => {
    const adminId = adminValidation.idSchema.parse(req.user.adminId);
    const data = adminValidation.pdfHeader.parse(req.body);
    const result = await ProfileService.updatePdfHeader(adminId, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Profile updated successfully'),
    );
});

const getPdfId = catchAsync(async (req: Request, res: Response) => {
    const adminId = adminValidation.idSchema.parse(req.user.adminId);
    const result = await ProfileService.getPdfId(adminId);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Pdf fetched successfully'),
    );
});

const expandExpiry = catchAsync(async (req: Request, res: Response) => {
    const adminId = adminValidation.idSchema.parse(req.user.adminId);
    const {key} = licenseKeyValidation.useLicenseKeySchema.parse(req.body);
    const result = await ProfileService.expandExpiry(adminId, key);
    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            result,
            'License key applied and expiry date extended successfully',
        ),
    );
});

const checkPassword = catchAsync(async (req: Request, res: Response) => {
    const adminId = adminValidation.idSchema.parse(req.user.adminId);
    const {password} = adminValidation.checkPasswordSchema.parse(req.body);
    const result = await ProfileService.checkpassword(adminId, password);
    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            result,
            result ? 'Password is correct' : 'Password is incorrect',
        ),
    );
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    const adminId = adminValidation.idSchema.parse(req.user.adminId);
    const data = adminValidation.changePasswordSchema.parse(req.body);
    const currentPass = data.currentPassword || data.currentpassword;
    const newPass = data.newPassword || data.newpassword;
    const result = await ProfileService.changePassword(adminId, currentPass, newPass);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Password changed successfully'),
    );
});

type AlertProcess = import('@services/admin/profile.service').AlertProcess;

const upsertAlerts = (process: AlertProcess) =>
    catchAsync(async (req: Request, res: Response) => {
        const adminId = adminValidation.idSchema.parse(req.user.adminId);
        const data = adminValidation.alertsSchema.parse(req.body);
        const result = await ProfileService.upsertProcessAlerts(process, adminId, data);
        res.status(httpStatus.OK).json(
            new ApiResponse(httpStatus.OK, result, `${process} alerts upserted successfully`),
        );
    });

const getAlerts = (process: AlertProcess) =>
    catchAsync(async (req: Request, res: Response) => {
        const adminId = adminValidation.idSchema.parse(req.user.adminId);
        const result = await ProfileService.getProcessAlerts(process, adminId);
        res.status(httpStatus.OK).json(
            new ApiResponse(httpStatus.OK, result, `${process} alerts fetched successfully`),
        );
    });

const deleteAlert = (process: AlertProcess) =>
    catchAsync(async (req: Request, res: Response) => {
        const adminId = adminValidation.idSchema.parse(req.user.adminId);
        const id = adminValidation.idSchema.parse(req.params.id);
        const result = await ProfileService.deleteProcessAlert(process, adminId, id);
        res.status(httpStatus.OK).json(
            new ApiResponse(httpStatus.OK, result, `${process} alert deleted successfully`),
        );
    });

const upsertTarAlerts = upsertAlerts('tar');
const getTarAlerts = getAlerts('tar');
const deleteTarAlert = deleteAlert('tar');

export default {
    updateProfile,
    updatePdfHeader,
    getProfile,
    getPdfId,
    expandExpiry,
    checkPassword,
    changePassword,
    upsertTarAlerts,
    getTarAlerts,
    deleteTarAlert,
    upsertAlerts,
    getAlerts,
    deleteAlert,
};
