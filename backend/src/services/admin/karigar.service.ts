import prisma from '@client';
import ApiError from '@utils/ApiError';
import httpStatus from 'http-status';
import type {
    CreateKarigarInput,
    UpdateKarigarInput,
    PaymentInput,
} from '@validations/karigar.validation';

const createKarigar = async (adminId: string, data: CreateKarigarInput) => {
    if (data.phone) {
        const existingKarigar = await prisma.karigar.findUnique({
            where: {phone: data.phone},
        });

        if (existingKarigar) {
            throw new ApiError(httpStatus.CONFLICT, 'Phone number already exists');
        }
    }

    return prisma.karigar.create({
        data: {
            name: data.name,
            process: data.process,
            phone: data.phone,
            address: data.address,
            openingBalance: data.openingBalance,
            adminId,
        },
    });
};

const getAllKarigars = async (adminId: string) => {
    return prisma.karigar.findMany({
        where: {adminId},
        orderBy: {createdAt: 'desc'},
    });
};

const getSingleKarigar = async (adminId: string, id: string) => {
    const karigar = await prisma.karigar.findFirst({
        where: {id, adminId},
    });

    if (!karigar) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Karigar not found');
    }

    return karigar;
};

const updateKarigar = async (adminId: string, id: string, data: UpdateKarigarInput) => {
    const existingKarigar = await prisma.karigar.findFirst({
        where: {id, adminId},
    });

    if (!existingKarigar) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Karigar not found');
    }

    if (data.phone) {
        const duplicatePhone = await prisma.karigar.findFirst({
            where: {
                phone: data.phone,
                NOT: {id},
            },
        });

        if (duplicatePhone) {
            throw new ApiError(httpStatus.CONFLICT, 'Phone number already exists');
        }
    }

    return prisma.karigar.update({
        where: {id: existingKarigar.id},
        data,
    });
};

const deleteKarigar = async (adminId: string, id: string) => {
    const existingKarigar = await prisma.karigar.findFirst({
        where: {id, adminId},
    });

    if (!existingKarigar) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Karigar not found');
    }

    return prisma.karigar.delete({
        where: {id: existingKarigar.id},
    });
};

const listPayments = async (adminId: string, karigarId: string) => {
    await getSingleKarigar(adminId, karigarId);
    return prisma.karigarPayment.findMany({
        where: {adminId, karigarId},
        orderBy: {createdAt: 'desc'},
    });
};

const addPayment = async (adminId: string, karigarId: string, data: PaymentInput) => {
    await getSingleKarigar(adminId, karigarId);
    return prisma.karigarPayment.create({data: {...data, adminId, karigarId}});
};

export default {
    listPayments,
    addPayment,
    createKarigar,
    getAllKarigars,
    getSingleKarigar,
    updateKarigar,
    deleteKarigar,
};
