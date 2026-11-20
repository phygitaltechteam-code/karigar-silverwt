import {Request, Response} from 'express';
import httpStatus from 'http-status';
import {manufacturingService} from '@services/admin/index';
import manufacturingValidation from '@validations/manufacturing.validation';
import {ApiResponse, catchAsync} from '@utils/index';

const v = manufacturingValidation;
const adminOf = (req: Request) => v.idSchema.parse(req.user?.adminId);
const processOf = (req: Request) => v.processSchema.parse(req.params.process);

const ok = (res: Response, data: unknown, message: string, status: number = httpStatus.OK) =>
    res.status(status).json(new ApiResponse(status, data, message));

const getAvailableStock = catchAsync(async (req: Request, res: Response) => {
    ok(res, await manufacturingService.getAvailableStock(adminOf(req)), 'Available stock fetched');
});

const galaiReceive = catchAsync(async (req: Request, res: Response) => {
    const data = v.galaiReceiveSchema.parse(req.body);
    const entry = await manufacturingService.galaiReceive(adminOf(req), data);
    ok(res, entry, 'Galai entry created', httpStatus.CREATED);
});

const listEntries = catchAsync(async (req: Request, res: Response) => {
    const {status} = v.listQuerySchema.parse(req.query);
    ok(res, await manufacturingService.listEntries(adminOf(req), processOf(req), status), 'Entries fetched');
});

const history = catchAsync(async (req: Request, res: Response) => {
    ok(res, await manufacturingService.history(adminOf(req), processOf(req)), 'History fetched');
});

const updateEntry = catchAsync(async (req: Request, res: Response) => {
    const id = v.idSchema.parse(req.params.id);
    const data = v.updateEntrySchema.parse(req.body);
    ok(res, await manufacturingService.updateEntry(adminOf(req), processOf(req), id, data), 'Entry updated');
});

const completeEntry = catchAsync(async (req: Request, res: Response) => {
    const id = v.idSchema.parse(req.params.id);
    const data = v.completeEntrySchema.parse(req.body);
    const result = await manufacturingService.completeEntry(adminOf(req), processOf(req), id, data);
    ok(res, result, 'Entry completed');
});

const revertEntry = catchAsync(async (req: Request, res: Response) => {
    const id = v.idSchema.parse(req.params.id);
    ok(res, await manufacturingService.revertEntry(adminOf(req), processOf(req), id), 'Entry reverted');
});

const listCards = catchAsync(async (req: Request, res: Response) => {
    ok(res, await manufacturingService.listCards(adminOf(req), processOf(req)), 'Stock cards fetched');
});

const finishedToStock = catchAsync(async (req: Request, res: Response) => {
    const data = v.finishedToStockSchema.parse(req.body);
    const result = await manufacturingService.finishedToStock(adminOf(req), data);
    ok(res, result, 'Added to Stock', httpStatus.CREATED);
});

const packLoose = catchAsync(async (req: Request, res: Response) => {
    const data = v.looseToPackagingSchema.parse(req.body);
    const result = await manufacturingService.packLoose(adminOf(req), data);
    ok(res, result, 'Packed', httpStatus.CREATED);
});

const looseToPackaging = catchAsync(async (req: Request, res: Response) => {
    const data = v.looseToPackagingSchema.parse(req.body);
    const result = await manufacturingService.looseToPackaging(adminOf(req), data);
    ok(res, result, 'Sent to Packaging', httpStatus.CREATED);
});

const listScrap = catchAsync(async (req: Request, res: Response) => {
    ok(res, await manufacturingService.listScrap(adminOf(req)), 'Scrap fetched');
});

const dispatch = catchAsync(async (req: Request, res: Response) => {
    const data = v.dispatchSchema.parse(req.body);
    const result = await manufacturingService.dispatch(adminOf(req), data);
    ok(res, result, 'Sent to next process', httpStatus.CREATED);
});

export default {
    getAvailableStock,
    galaiReceive,
    listEntries,
    history,
    updateEntry,
    completeEntry,
    revertEntry,
    listCards,
    dispatch,
    listScrap,
    finishedToStock,
    looseToPackaging,
    packLoose,
};
