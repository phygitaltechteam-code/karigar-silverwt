import {Prisma, Role, accessType as AccessType} from '@prisma/client';
import httpStatus from 'http-status';
import {z} from 'zod';
import prisma from '../../client';
import {ApiError, encryptPassword} from '@utils/index';
import superAdminValidation from '@validations/superAdmin.validation';

type CreateAdminData = z.infer<typeof superAdminValidation.createAdminSchema>;
type UpdateAdminData = z.infer<typeof superAdminValidation.updateAdminSchema>;

// Never expose password hashes, refresh tokens or OTP codes
const userSelect = {
    id: true,
    username: true,
    email: true,
    fullname: true,
    phoneNumber: true,
    secondaryPhoneNumber: true,
    address: true,
    role: true,
    isActive: true,
    isVerified: true,
    createdAt: true,
} satisfies Prisma.UserSelect;

const adminInclude = {user: {select: userSelect}} satisfies Prisma.AdminInclude;

const DAY_MS = 24 * 60 * 60 * 1000;

// Default validity matches the options shown in the UI: TRIAL = 7 days, others = 1 year
const defaultExpiry = (type: AccessType, from: Date) =>
    new Date(from.getTime() + (type === AccessType.TRIAL ? 7 : 365) * DAY_MS);

class SuperAdminAdminService {
    public async create(data: CreateAdminData) {
        const existing = await prisma.user.findFirst({
            where: {OR: [{phoneNumber: data.phoneNumber}, {email: data.email}]},
        });
        if (existing) {
            throw new ApiError(
                httpStatus.CONFLICT,
                existing.phoneNumber === data.phoneNumber
                    ? 'User with this phone number already exists'
                    : 'User with this email already exists',
            );
        }

        const type = data.accessType ?? AccessType.OFFLINE;
        const startDate = data.startDate ?? new Date();
        const hashedPassword = await encryptPassword(data.password);

        return prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullname: data.fullname,
                    email: data.email,
                    username: data.username ?? data.phoneNumber,
                    password: hashedPassword,
                    phoneNumber: data.phoneNumber,
                    secondaryPhoneNumber: data.secondaryPhoneNumber ?? null,
                    address: data.address ?? '',
                    role: Role.ADMIN,
                    isVerified: true,
                    isActive: true,
                },
            });

            const admin = await tx.admin.create({
                data: {
                    userId: user.id,
                    shopName: data.shopName,
                    pincode: data.pincode,
                    city: data.city,
                    district: data.district,
                    state: data.state,
                    country: data.country,
                    accessType: type,
                    amount: data.amount,
                    renewalAmount: data.renewalAmount,
                    startDate,
                    expiryDate: data.expiryDate ?? defaultExpiry(type, startDate),
                    key: data.key,
                    extendKey: data.extendKey,
                    extendDays: data.extendDays,
                    isExtendUsedKey: data.extendKey ? false : null,
                    BrandColour: data.BrandColour,
                },
                include: adminInclude,
            });

            // Every admin starts with the default SILVER item (same as /users/register)
            await tx.item.create({data: {name: 'SILVER', adminId: admin.id}});

            return admin;
        });
    }

    public async getAll() {
        return prisma.admin.findMany({
            include: adminInclude,
            orderBy: {createdAt: 'desc'},
        });
    }

    public async getById(id: string) {
        const admin = await prisma.admin.findUnique({where: {id}, include: adminInclude});
        if (!admin) throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
        return admin;
    }

    public async update(id: string, data: UpdateAdminData) {
        const admin = await this.getById(id);

        if (data.phoneNumber || data.email) {
            const conflict = await prisma.user.findFirst({
                where: {
                    id: {not: admin.userId},
                    OR: [
                        ...(data.phoneNumber ? [{phoneNumber: data.phoneNumber}] : []),
                        ...(data.email ? [{email: data.email}] : []),
                    ],
                },
            });
            if (conflict) {
                throw new ApiError(
                    httpStatus.CONFLICT,
                    conflict.phoneNumber === data.phoneNumber
                        ? 'Another user already uses this phone number'
                        : 'Another user already uses this email',
                );
            }
        }

        const userUpdate: Prisma.UserUpdateInput = {
            fullname: data.fullname,
            email: data.email,
            username: data.username,
            phoneNumber: data.phoneNumber,
            secondaryPhoneNumber: data.secondaryPhoneNumber,
            address: data.address,
            isActive: data.isActive,
        };
        if (data.password) userUpdate.password = await encryptPassword(data.password);

        const adminUpdate: Prisma.AdminUpdateInput = {
            shopName: data.shopName,
            pincode: data.pincode,
            city: data.city,
            district: data.district,
            state: data.state,
            country: data.country,
            accessType: data.accessType,
            amount: data.amount,
            renewalAmount: data.renewalAmount,
            startDate: data.startDate,
            expiryDate: data.expiryDate,
            extendDays: data.extendDays,
            BrandColour: data.BrandColour,
            user: {update: userUpdate},
        };

        // A changed licence key must be activated again
        if (data.key !== undefined && data.key !== admin.key) {
            adminUpdate.key = data.key;
            adminUpdate.isUsedKey = false;
        }
        if (data.extendKey !== undefined && data.extendKey !== admin.extendKey) {
            adminUpdate.extendKey = data.extendKey;
            adminUpdate.isExtendUsedKey = false;
        }

        return prisma.admin.update({where: {id}, data: adminUpdate, include: adminInclude});
    }

    public async remove(id: string) {
        const admin = await this.getById(id);

        // Delete all data owned by this admin, children before parents
        await prisma.$transaction([
            prisma.tarAlert.deleteMany({where: {adminId: id}}),
            prisma.meltingAlert.deleteMany({where: {adminId: id}}),
            prisma.boxAlert.deleteMany({where: {adminId: id}}),
            prisma.kundaAlert.deleteMany({where: {adminId: id}}),
            prisma.jointAlert.deleteMany({where: {adminId: id}}),
            prisma.cuttingAlert.deleteMany({where: {adminId: id}}),
            prisma.solderingAlert.deleteMany({where: {adminId: id}}),
            prisma.galaiAlert.deleteMany({where: {adminId: id}}),
            prisma.pdfHeader.deleteMany({where: {adminId: id}}),
            prisma.receipt.deleteMany({where: {adminId: id}}),
            prisma.processEntry.deleteMany({where: {adminId: id}}),
            prisma.processStockCard.deleteMany({where: {adminId: id}}),
            prisma.silverHistory.deleteMany({where: {adminId: id}}),
            prisma.stockHistory.deleteMany({where: {adminId: id}}),
            prisma.stock.deleteMany({where: {adminId: id}}),
            prisma.client.deleteMany({where: {adminId: id}}), // cascades clientHistory & galai
            prisma.size.deleteMany({where: {adminId: id}}),
            prisma.item.deleteMany({where: {adminId: id}}),
            prisma.design.deleteMany({where: {adminId: id}}),
            prisma.karigar.deleteMany({where: {adminId: id}}),
            prisma.admin.delete({where: {id}}),
            prisma.user.delete({where: {id: admin.userId}}),
        ]);

        return {id};
    }
}

export default new SuperAdminAdminService();
