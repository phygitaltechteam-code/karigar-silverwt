import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {billingService} from '@services/admin/index';
import billingValidation from '@validations/billing.validation';
import {ApiResponse, catchAsync} from '@utils/index';

const v = billingValidation;
const adminOf = (req: Request) => v.idSchema.parse(req.user?.adminId);
const ok = (res: Response, data: unknown, message: string, status: number = httpStatus.OK) =>
    res.status(status).json(new ApiResponse(status, data, message));

const checkStock = catchAsync(async (req: Request, res: Response) => {
    const data = v.checkStockSchema.parse(req.body);
    ok(res, await billingService.checkStock(adminOf(req), data), 'Stock checked');
});

const create = catchAsync(async (req: Request, res: Response) => {
    const data = v.billSchema.parse(req.body);
    const bill = await billingService.create(adminOf(req), data);
    ok(res, bill, data.type === 'DRAFT' ? 'Draft saved' : 'Bill saved', httpStatus.CREATED);
});

const getAll = catchAsync(async (req: Request, res: Response) => {
    ok(res, await billingService.getAll(adminOf(req)), 'Bills fetched');
});

const getById = catchAsync(async (req: Request, res: Response) => {
    ok(res, await billingService.getById(adminOf(req), v.idSchema.parse(req.params.id)), 'Bill fetched');
});

const update = catchAsync(async (req: Request, res: Response) => {
    const data = v.billSchema.parse(req.body);
    const bill = await billingService.update(adminOf(req), v.idSchema.parse(req.params.id), data);
    ok(res, bill, 'Bill updated');
});

const remove = catchAsync(async (req: Request, res: Response) => {
    ok(res, await billingService.remove(adminOf(req), v.idSchema.parse(req.params.id)), 'Bill deleted');
});

export default {checkStock, create, getAll, getById, update, remove};
