import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {stockService} from '@services/admin/index';
import {stockValidation} from '@validations/index';

import {ApiResponse, catchAsync} from '@utils/index';

const createStock = catchAsync(async (req: Request, res: Response) => {
    const data = stockValidation.stockSchema.parse(req.body);
    const result = await stockService.create(req.user.adminId || '', data);
    res.status(httpStatus.CREATED).json(
        new ApiResponse(httpStatus.CREATED, result, 'Stock created successfully'),
    );
});

const getAllStocks = catchAsync(async (req: Request, res: Response) => {
    const result = await stockService.getAll(req.user.adminId || '');
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Stocks fetched successfully'),
    );
});

const getStockById = catchAsync(async (req: Request, res: Response) => {
    const id = stockValidation.stockIdSchema.parse(req.params.id);
    const result = await stockService.getById(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Stock fetched successfully'),
    );
});

const updateStock = catchAsync(async (req: Request, res: Response) => {
    const id = stockValidation.stockIdSchema.parse(req.params.id);
    const data = stockValidation.updateStockSchema.parse(req.body);
    const result = await stockService.update(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Stock updated successfully'),
    );
});

const deleteStock = catchAsync(async (req: Request, res: Response) => {
    const id = stockValidation.stockIdSchema.parse(req.params.id);
    const result = await stockService.remove(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Stock deleted successfully'),
    );
});
const incrementStock = catchAsync(async (req: Request, res: Response) => {
    const id = stockValidation.stockIdSchema.parse(req.params.id);
    const data = stockValidation.stockIncreemnt.parse(req.body);
    const result = await stockService.incrementStock(id, data);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Stock incremented successfully'),
    );
});
const getStockHistory = catchAsync(async (req: Request, res: Response) => {
    const id = stockValidation.stockIdSchema.parse(req.params.id);
    const result = await stockService.getStockHistory(id);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Stock history fetched successfully'),
    );
});

const getLossReport = catchAsync(async (req: Request, res: Response) => {
    const result = await stockService.lossReport(req.user.adminId || '');
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Loss report fetched successfully'),
    );
});

const getStockInventoryReport = catchAsync(async (req: Request, res: Response) => {
    const rawData = Object.keys(req.query).length > 0 ? req.query : req.body;
    const query = stockValidation.stockReportQuerySchema.parse(rawData);
    const result = await stockService.getStockInventoryReport(req.user.adminId || '', query);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Stock inventory report fetched successfully'),
    );
});

const getMyCurrentStock = catchAsync(async (req: Request, res: Response) => {
    const result = await stockService.myCurrentStock(req.user.adminId || '');
    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            result,
            'Current stock and process details fetched successfully',
        ),
    );
});

const getTodayReport = catchAsync(async (req: Request, res: Response) => {
    const date = req.query.date as string | undefined;
    const result = await stockService.todayReport(req.user.adminId || '', date);
    res.status(httpStatus.OK).json(
        new ApiResponse(httpStatus.OK, result, 'Today report fetched successfully'),
    );
});

export default {
    createStock,
    getAllStocks,
    getStockById,
    updateStock,
    incrementStock,
    deleteStock,
    getStockHistory,
    getLossReport,
    getStockInventoryReport,
    getMyCurrentStock,
    getTodayReport,
};
