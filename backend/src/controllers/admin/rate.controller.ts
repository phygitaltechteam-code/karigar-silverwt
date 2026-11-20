/* eslint-disable @typescript-eslint/no-explicit-any */
import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {rateService} from '@services/admin/index';
import {rateValidation} from '@validations/index';
import {ApiResponse, catchAsync} from '@utils/index';

const updateRate = (serviceMethod: string) =>
    catchAsync(async (req: Request, res: Response) => {
        const adminId = rateValidation.idSchema.parse(req.user?.adminId);
        const data = rateValidation.updateSchema.parse(req.body);

        const service = rateService as any;
        const result = await service[serviceMethod](adminId, data);

        res.status(httpStatus.OK).json(
            new ApiResponse(httpStatus.OK, result, 'Rate updated successfully'),
        );
    });

const createRate = (serviceMethod: string) =>
    catchAsync(async (req: Request, res: Response) => {
        const adminId = rateValidation.idSchema.parse(req.user?.adminId);
        const data = rateValidation.createSchema.parse(req.body);

        const service = rateService as any;
        const result = await service[serviceMethod](adminId, data);

        res.status(httpStatus.OK).json(
            new ApiResponse(httpStatus.OK, result, 'Rate added successfully'),
        );
    });

const getRates = catchAsync(async (req: Request, res: Response) => {
    const adminId = rateValidation.idSchema.parse(req.user?.adminId);
    const rates = await rateService.getRates(adminId);

    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, rates, 'Rates fetched successfully'),
    );
});

const getProcessRate = catchAsync(async (req: Request, res: Response) => {
    const adminId = rateValidation.idSchema.parse(req.user?.adminId);
    const result = await rateService.getProcessRate(adminId, req.params.process);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Rate fetched successfully'),
    );
});

const setProcessRate = catchAsync(async (req: Request, res: Response) => {
    const adminId = rateValidation.idSchema.parse(req.user?.adminId);
    const {rate} = rateValidation.createSchema.parse(req.body);
    const result = await rateService.setProcessRate(adminId, req.params.process, rate);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Rate saved successfully'),
    );
});

export default {
    getProcessRate,
    setProcessRate,

    createMeltingRate: createRate('createMeltingRate'),
    updateMeltingRate: updateRate('updateMeltingRate'),

    createCompanyRate: createRate('createCompanyRate'),
    updateCompanyRate: updateRate('updateCompanyRate'),

    createPressRate: createRate('createPressRate'),
    updatePressRate: updateRate('updatePressRate'),

    createSuttRate: createRate('createSuttRate'),
    updateSuttRate: updateRate('updateSuttRate'),

    createBharnaiRate: createRate('createBharnaiRate'),
    updateBharnaiRate: updateRate('updateBharnaiRate'),

    createCuttingRate: createRate('createCuttingRate'),
    updateCuttingRate: updateRate('updateCuttingRate'),

    createWashRate: createRate('createWashRate'),
    updateWashRate: updateRate('updateWashRate'),

    createPolishingRate: createRate('createPolishingRate'),
    updatePolishingRate: updateRate('updatePolishingRate'),

    createVibratorRate: createRate('createVibratorRate'),
    updateVibratorRate: updateRate('updateVibratorRate'),

    createMeenaRate: createRate('createMeenaRate'),
    updateMeenaRate: updateRate('updateMeenaRate'),

    createTassRate: createRate('createTassRate'),
    updateTassRate: updateRate('updateTassRate'),

    getRates,
};
