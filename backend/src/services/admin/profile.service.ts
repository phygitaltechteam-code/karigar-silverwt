/* eslint-disable @typescript-eslint/no-explicit-any */
import {z} from 'zod';
import prisma from '@client';
import {Prisma} from '@prisma/client';
import {adminValidation} from '@validations/index';
import ApiError from '@utils/ApiError';
import {isPasswordMatch, encryptPassword} from '@utils/index';

type updateAdminInput = z.infer<typeof adminValidation.updateAdminProfileSchema>;
type pdfHeader = z.infer<typeof adminValidation.pdfHeader>;
type AlertInput = z.infer<typeof adminValidation.alertItemSchema>;
// type TarAlertInput = AlertInput;
export const STAGE_ALERT_PROCESSES = [
    'company',
    'press',
    'sutt',
    'bharni',
    'wash',
    'meena',
    'tass',
    'polishing',
    'vibrator',
] as const;
export type AlertProcess =
    | 'tar'
    | 'melting'
    | 'box'
    | 'kunda'
    | 'joint'
    | 'cutting'
    | 'soldering'
    | 'galai'
    | (typeof STAGE_ALERT_PROCESSES)[number];

/** processAlert rows of one stage, used like the per-process alert tables */
const stageAlertDelegate = (tx: any, process: string) => ({
    findFirst: (args: any) => tx.processAlert.findFirst({...args, where: {...args.where, process}}),
    findMany: (args: any) => tx.processAlert.findMany({...args, where: {...args.where, process}}),
    create: (args: any) => tx.processAlert.create({...args, data: {...args.data, process}}),
    update: (args: any) => tx.processAlert.update(args),
    delete: (args: any) => tx.processAlert.delete(args),
});

class ProfileService {
    async getById(id: string) {
        return await prisma.admin.findUnique({
            where: {id},
            include: {
                user: {
                    select: {
                        address: true,
                        email: true,
                        fullname: true,
                        phoneNumber: true,
                        secondaryPhoneNumber: true,
                    },
                },
                tarAlerts: {orderBy: {createdAt: 'asc'}},
                meltingAlerts: {orderBy: {createdAt: 'asc'}},
                boxAlerts: {orderBy: {createdAt: 'asc'}},
                kundaAlerts: {orderBy: {createdAt: 'asc'}},
                jointAlerts: {orderBy: {createdAt: 'asc'}},
                cuttingAlerts: {orderBy: {createdAt: 'asc'}},
                solderingAlerts: {orderBy: {createdAt: 'asc'}},
                galaiAlerts: {orderBy: {createdAt: 'asc'}},
                processAlerts: {orderBy: {createdAt: 'asc'}},
            },
        });
    }
    async update(id: string, data: updateAdminInput) {
        const updateData: Prisma.AdminUpdateInput = {};

        // Map Admin fields
        if (data.city !== undefined) updateData.city = data.city;
        if (data.state !== undefined) updateData.state = data.state;
        if (data.country !== undefined) updateData.country = data.country;
        if (data.pincode !== undefined) updateData.pincode = data.pincode;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.accessType !== undefined) updateData.accessType = data.accessType;
        if (data.key !== undefined) {
            updateData.key = data.key;
            updateData.isUsedKey = false;
        }
        if (data.shopName != undefined) updateData.shopName = data.shopName;
        if (data.workStartTime !== undefined) updateData.workStartTime = data.workStartTime;
        if (data.workEndTime !== undefined) updateData.workEndTime = data.workEndTime;
        // if (data.renewalAmount !== undefined) updateData.renewalAmount = data.renewalAmount;

        // Map User fields
        const userUpdate: Prisma.UserUpdateInput = {};
        if (data.fullname !== undefined) userUpdate.fullname = data.fullname;
        if (data.email !== undefined) userUpdate.email = data.email;
        if (data.phoneNumber !== undefined) userUpdate.phoneNumber = data.phoneNumber;
        if (data.address !== undefined) userUpdate.address = data.address;

        // Password change logic
        const currentPass = data.currentPassword;
        const newPass = data.newPassword;

        if (newPass) {
            if (!currentPass) {
                throw new ApiError(400, 'Current password is required to change password.');
            }

            let admin = await prisma.admin.findUnique({
                where: {id},
                include: {user: true},
            });

            if (!admin) {
                admin = await prisma.admin.findUnique({
                    where: {userId: id},
                    include: {user: true},
                });
            }

            if (!admin || !admin.user || !admin.user.password) {
                throw new ApiError(404, 'Admin user not found.');
            }

            const isMatch = await isPasswordMatch(currentPass, admin.user.password);
            if (!isMatch) {
                throw new ApiError(400, 'Current password does not match.');
            }

            if (newPass.length < 6) {
                throw new ApiError(400, 'New password must be at least 6 characters long.');
            }

            userUpdate.password = await encryptPassword(newPass);
        }

        if (Object.keys(userUpdate).length > 0) {
            updateData.user = {
                update: userUpdate,
            };
        }

        if (data.tarAlerts && data.tarAlerts.length > 0) {
            await this.upsertProcessAlerts('tar', id, data.tarAlerts);
        }
        if (data.meltingAlerts && data.meltingAlerts.length > 0) {
            await this.upsertProcessAlerts('melting', id, data.meltingAlerts);
        }
        if (data.boxAlerts && data.boxAlerts.length > 0) {
            await this.upsertProcessAlerts('box', id, data.boxAlerts);
        }
        if (data.kundaAlerts && data.kundaAlerts.length > 0) {
            await this.upsertProcessAlerts('kunda', id, data.kundaAlerts);
        }
        if (data.jointAlerts && data.jointAlerts.length > 0) {
            await this.upsertProcessAlerts('joint', id, data.jointAlerts);
        }
        if (data.cuttingAlerts && data.cuttingAlerts.length > 0) {
            await this.upsertProcessAlerts('cutting', id, data.cuttingAlerts);
        }
        if (data.solderingAlerts && data.solderingAlerts.length > 0) {
            await this.upsertProcessAlerts('soldering', id, data.solderingAlerts);
        }

        return await prisma.admin.update({
            where: {id},
            data: updateData,
            include: {
                user: {
                    select: {
                        address: true,
                        email: true,
                        fullname: true,
                        phoneNumber: true,
                        secondaryPhoneNumber: true,
                    },
                },
                tarAlerts: {orderBy: {createdAt: 'asc'}},
                meltingAlerts: {orderBy: {createdAt: 'asc'}},
                boxAlerts: {orderBy: {createdAt: 'asc'}},
                kundaAlerts: {orderBy: {createdAt: 'asc'}},
                jointAlerts: {orderBy: {createdAt: 'asc'}},
                cuttingAlerts: {orderBy: {createdAt: 'asc'}},
                solderingAlerts: {orderBy: {createdAt: 'asc'}},
                galaiAlerts: {orderBy: {createdAt: 'asc'}},
                processAlerts: {orderBy: {createdAt: 'asc'}},
            },
        });
    }

    private getAlertDelegate(tx: any, process: AlertProcess) {
        switch (process) {
            case 'tar':
                return tx.tarAlert;
            case 'melting':
                return tx.meltingAlert;
            case 'box':
                return tx.boxAlert;
            case 'kunda':
                return tx.kundaAlert;
            case 'joint':
                return tx.jointAlert;
            case 'cutting':
                return tx.cuttingAlert;
            case 'soldering':
                return tx.solderingAlert;
            case 'galai':
                return tx.galaiAlert;
            default:
                if ((STAGE_ALERT_PROCESSES as readonly string[]).includes(process)) {
                    return stageAlertDelegate(tx, process);
                }
                throw new ApiError(400, `Invalid alert process: ${process}`);
        }
    }

    async upsertProcessAlerts(process: AlertProcess, adminId: string, alerts: AlertInput[]) {
        let admin = await prisma.admin.findUnique({
            where: {id: adminId},
        });
        if (!admin) {
            admin = await prisma.admin.findUnique({
                where: {userId: adminId},
            });
        }
        if (!admin) {
            throw new ApiError(404, 'Admin not found.');
        }

        const effectiveAdminId = admin.id;

        return await prisma.$transaction(async (tx) => {
            const delegate = this.getAlertDelegate(tx, process);
            const results = [];
            for (const alert of alerts) {
                if (alert.id) {
                    const existing = await delegate.findFirst({
                        where: {id: alert.id, adminId: effectiveAdminId},
                    });
                    if (existing) {
                        const updated = await delegate.update({
                            where: {id: alert.id},
                            data: {
                                grossWt: alert.grossWt,
                                lossWt: alert.lossWt,
                                adjsutment: alert.adjsutment,
                                purity: alert.purity,
                            },
                        });
                        results.push(updated);
                    } else {
                        const created = await delegate.create({
                            data: {
                                id: alert.id,
                                grossWt: alert.grossWt,
                                lossWt: alert.lossWt,
                                adjsutment: alert.adjsutment,
                                purity: alert.purity,
                                adminId: effectiveAdminId,
                            },
                        });
                        results.push(created);
                    }
                } else {
                    const existing = await delegate.findFirst({
                        where: {adminId: effectiveAdminId, purity: alert.purity},
                    });
                    if (existing) {
                        const updated = await delegate.update({
                            where: {id: existing.id},
                            data: {
                                grossWt: alert.grossWt,
                                lossWt: alert.lossWt,
                                adjsutment: alert.adjsutment,
                            },
                        });
                        results.push(updated);
                    } else {
                        const created = await delegate.create({
                            data: {
                                grossWt: alert.grossWt,
                                lossWt: alert.lossWt,
                                adjsutment: alert.adjsutment,
                                purity: alert.purity,
                                adminId: effectiveAdminId,
                            },
                        });
                        results.push(created);
                    }
                }
            }
            return results;
        });
    }

    async getProcessAlerts(process: AlertProcess, adminId: string) {

        let admin = await prisma.admin.findUnique({
            where: {id: adminId},
        });

        if (!admin) {
            admin = await prisma.admin.findUnique({
                where: {userId: adminId},
            });
        }

        if (!admin) {
            throw new ApiError(404, 'Admin not found.');
        }

        const delegate = this.getAlertDelegate(prisma, process);

        const alerts = await delegate.findMany({
            where: {adminId: admin.id},
            orderBy: {createdAt: 'asc'},
        });

        // No sample rules: the admin sets them on the Alert Management page

        return alerts;
    }
    async deleteProcessAlert(process: AlertProcess, adminId: string, id: string) {
        let admin = await prisma.admin.findUnique({
            where: {id: adminId},
        });
        if (!admin) {
            admin = await prisma.admin.findUnique({
                where: {userId: adminId},
            });
        }
        if (!admin) {
            throw new ApiError(404, 'Admin not found.');
        }

        const delegate = this.getAlertDelegate(prisma, process);
        const alert = await delegate.findFirst({
            where: {id, adminId: admin.id},
        });
        if (!alert) {
            throw new ApiError(404, `${process} alert not found.`);
        }

        return await delegate.delete({
            where: {id},
        });
    }

    async upsertTarAlerts(adminId: string, alerts: AlertInput[]) {
        return this.upsertProcessAlerts('tar', adminId, alerts);
    }

    async getTarAlerts(adminId: string) {
        return this.getProcessAlerts('tar', adminId);
    }

    async deleteTarAlert(adminId: string, id: string) {
        return this.deleteProcessAlert('tar', adminId, id);
    }

    async updatePdfHeader(adminId: string, data: pdfHeader) {
        const admin = await prisma.admin.findUnique({
            where: {
                id: adminId,
            },
        });
        if (!admin) {
            throw new ApiError(404, 'Admin not found.');
        }
        const pdfHeader = await prisma.pdfHeader.upsert({
            where: {
                adminId: adminId,
            },
            update: {
                ...data,
            },
            create: {
                ...data,
                adminId: adminId,
            },
        });
        return pdfHeader;
    }

    async getPdfId(adminId: string) {
        return prisma.pdfHeader.findUnique({
            where: {
                adminId,
            },
        });
    }
    async expandExpiry(adminId: string, key: string) {
        console.log('Extend Key:', key);

        if (!adminId) {
            throw new ApiError(400, 'Admin ID is required.');
        }

        if (!key || !key.trim()) {
            throw new ApiError(400, 'Extend key is required.');
        }

        const admin = await prisma.admin.findUnique({
            where: {
                id: adminId,
            },
        });

        if (!admin) {
            throw new ApiError(404, 'Admin not found.');
        }

        // Check key
        if (admin.extendKey !== key.trim()) {
            throw new ApiError(404, 'Key not found.');
        }

        // Check already used
        if (admin.isExtendUsedKey) {
            throw new ApiError(400, 'Key already used.');
        }

        const now = new Date();

        const baseDate = admin.expiryDate && admin.expiryDate > now ? admin.expiryDate : now;

        const extendDays = admin.extendDays ?? 0;

        if (extendDays <= 0) {
            throw new ApiError(400, 'Invalid extension days.');
        }

        const newExpiryDate = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000);

        const adminData = await prisma.$transaction(async (tx) => {
            const currentAdmin = await tx.admin.findUnique({
                where: {
                    id: adminId,
                },
            });

            if (!currentAdmin) {
                throw new ApiError(404, 'Admin not found.');
            }

            if (currentAdmin.extendKey !== key.trim()) {
                throw new ApiError(404, 'Key not found.');
            }

            if (currentAdmin.isExtendUsedKey) {
                throw new ApiError(400, 'Key already used.');
            }

            return await tx.admin.update({
                where: {
                    id: adminId,
                },
                data: {
                    expiryDate: newExpiryDate,
                    isExtendUsedKey: true,
                },
            });
        });

        return adminData;
    }
    async checkpassword(adminId: string, password: string): Promise<boolean> {
        if (!password) {
            return false;
        }

        let admin = await prisma.admin.findUnique({
            where: {id: adminId},
            include: {
                user: true,
            },
        });

        if (!admin) {
            admin = await prisma.admin.findUnique({
                where: {userId: adminId},
                include: {
                    user: true,
                },
            });
        }

        if (!admin || !admin.user || !admin.user.password) {
            return false;
        }

        return await isPasswordMatch(password, admin.user.password);
    }

    async changePassword(adminId: string, currentPass?: string, newPass?: string) {
        if (!currentPass || !newPass) {
            throw new ApiError(400, 'Both currentPassword and newPassword are required.');
        }

        let admin = await prisma.admin.findUnique({
            where: {id: adminId},
            include: {user: true},
        });

        if (!admin) {
            admin = await prisma.admin.findUnique({
                where: {userId: adminId},
                include: {user: true},
            });
        }

        if (!admin || !admin.user) {
            throw new ApiError(404, 'Admin user not found.');
        }

        if (!admin.user.password) {
            throw new ApiError(400, 'No existing password set for this user.');
        }

        const isMatch = await isPasswordMatch(currentPass, admin.user.password);
        if (!isMatch) {
            throw new ApiError(400, 'Current password does not match.');
        }

        if (newPass.length < 6) {
            throw new ApiError(400, 'New password must be at least 6 characters long.');
        }

        const hashedPassword = await encryptPassword(newPass);

        await prisma.user.update({
            where: {id: admin.userId},
            data: {
                password: hashedPassword,
            },
        });

        return {
            success: true,
            message: 'Password changed successfully.',
        };
    }
}

export default new ProfileService();
