import prisma from '@client';
import {ApiError} from '@utils/index';
import httpStatus from 'http-status';
import {z} from 'zod';
import rateValidation from '@validations/rate.validation';

type RateField =
    | 'meltingRate'
    | 'companyRate'
    | 'pressRate'
    | 'suttRate'
    | 'bharnaiRate'
    | 'cuttingRate'
    | 'washRate'
    | 'polishingRate'
    | 'vibratorRate'
    | 'meenaRate'
    | 'tassRate';

type CreateRateInput = z.infer<typeof rateValidation.createSchema>;
type UpdateRateInput = z.infer<typeof rateValidation.updateSchema>;

class rateService {
    // Common method to update any rate field
    private async updateRate(adminId: string, field: RateField, rate: number) {
        const admin = await prisma.admin.findUnique({
            where: {id: adminId},
        });

        if (!admin) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
        }

        return prisma.admin.update({
            where: {id: adminId},
            data: {
                [field]: rate,
            },
        });
    }

    async createMeltingRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'meltingRate', data.rate);
    }

    async updateMeltingRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'meltingRate', data.rate!);
    }

    async createCompanyRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'companyRate', data.rate);
    }

    async updateCompanyRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'companyRate', data.rate!);
    }

    async createPressRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'pressRate', data.rate);
    }

    async updatePressRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'pressRate', data.rate!);
    }

    async createSuttRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'suttRate', data.rate);
    }

    async updateSuttRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'suttRate', data.rate!);
    }

    async createBharnaiRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'bharnaiRate', data.rate);
    }

    async updateBharnaiRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'bharnaiRate', data.rate!);
    }

    async createCuttingRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'cuttingRate', data.rate);
    }

    async updateCuttingRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'cuttingRate', data.rate!);
    }

    async createWashRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'washRate', data.rate);
    }

    async updateWashRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'washRate', data.rate!);
    }

    async createPolishingRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'polishingRate', data.rate);
    }

    async updatePolishingRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'polishingRate', data.rate!);
    }

    async createVibratorRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'vibratorRate', data.rate);
    }

    async updateVibratorRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'vibratorRate', data.rate!);
    }

    async createMeenaRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'meenaRate', data.rate);
    }

    async updateMeenaRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'meenaRate', data.rate!);
    }

    async createTassRate(adminId: string, data: CreateRateInput) {
        return this.updateRate(adminId, 'tassRate', data.rate);
    }

    async updateTassRate(adminId: string, data: UpdateRateInput) {
        return this.updateRate(adminId, 'tassRate', data.rate!);
    }

    // Map a process name from the URL to its rate column ("bharni" and "bharnai" both work)
    static readonly processToField: Record<string, RateField> = {
        melting: 'meltingRate',
        company: 'companyRate',
        press: 'pressRate',
        sutt: 'suttRate',
        bharni: 'bharnaiRate',
        bharnai: 'bharnaiRate',
        cutting: 'cuttingRate',
        wash: 'washRate',
        polishing: 'polishingRate',
        vibrator: 'vibratorRate',
        meena: 'meenaRate',
        tass: 'tassRate',
    };

    private fieldFor(process: string): RateField {
        const field = rateService.processToField[process.trim().toLowerCase()];
        if (!field) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Unknown process "${process}"`);
        }
        return field;
    }

    async getProcessRate(adminId: string, process: string) {
        const field = this.fieldFor(process);
        const rates = await this.getRates(adminId);
        return {process: process.toLowerCase(), rate: rates[field] ?? null};
    }

    async setProcessRate(adminId: string, process: string, rate: number) {
        const field = this.fieldFor(process);
        const admin = await this.updateRate(adminId, field, rate);
        return {process: process.toLowerCase(), rate: admin[field]};
    }

    // Fetch all manufacturing rates for this admin
    async getRates(adminId: string) {
        const admin = await prisma.admin.findUnique({
            where: {id: adminId},
            select: {
                meltingRate: true,
                companyRate: true,
                pressRate: true,
                suttRate: true,
                bharnaiRate: true,
                cuttingRate: true,
                washRate: true,
                polishingRate: true,
                vibratorRate: true,
                meenaRate: true,
                tassRate: true,
            },
        });

        if (!admin) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
        }

        return admin;
    }
}

export default new rateService();
