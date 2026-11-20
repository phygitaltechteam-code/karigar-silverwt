import {accessType} from '@prisma/client';
import {z} from 'zod';

export type AlertInput = {
    id?: string;
    grossWt: number;
    lossWt: number;
    adjsutment: number;
    purity: number;
};
export type TarAlertInput = AlertInput;

export const alertItemSchema = z
    .object({
        id: z.string().optional(),
        grossWt: z.coerce.number(),
        loss: z.coerce.number().optional(),
        lossWt: z.coerce.number().optional(),
        adjsutment: z.coerce.number().optional(),
        adjustment: z.coerce.number().optional(),
        purity: z.coerce.number(),
    })
    .transform(
        (val): AlertInput => ({
            ...(val.id ? {id: val.id} : {}),
            grossWt: val.grossWt,
            lossWt: val.loss ?? val.lossWt ?? 0,
            adjsutment: val.adjustment ?? val.adjsutment ?? 0,
            purity: val.purity,
        }),
    );
export const tarAlertItemSchema = alertItemSchema;

export const alertsSchema = z.union([
    z.array(alertItemSchema),
    alertItemSchema.transform((val) => [val]),
    z
        .object({
            alerts: z.array(alertItemSchema),
        })
        .transform((val) => val.alerts),
    z
        .object({
            tarAlerts: z.array(alertItemSchema),
        })
        .transform((val) => val.tarAlerts),
    z
        .object({
            meltingAlerts: z.array(alertItemSchema),
        })
        .transform((val) => val.meltingAlerts),
    z
        .object({
            boxAlerts: z.array(alertItemSchema),
        })
        .transform((val) => val.boxAlerts),
    z
        .object({
            kundaAlerts: z.array(alertItemSchema),
        })
        .transform((val) => val.kundaAlerts),
    z
        .object({
            jointAlerts: z.array(alertItemSchema),
        })
        .transform((val) => val.jointAlerts),
    z
        .object({
            cuttingAlerts: z.array(alertItemSchema),
        })
        .transform((val) => val.cuttingAlerts),
    z
        .object({
            solderingAlerts: z.array(alertItemSchema),
        })
        .transform((val) => val.solderingAlerts),
]);
export const tarAlertsSchema = alertsSchema;

const updateAdminProfileSchema = z.object({
    // userId: z.string().uuid(),
    fullname: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(10).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().max(6).min(6).optional(),
    godNames: z.array(z.string().min(1)).optional(),
    accountName: z.string().min(1).optional(),
    bankName: z.string().min(1).optional(),
    accountNumber: z.string().min(1).optional(),
    ifscCode: z.string().min(1).optional(),
    upiId: z.string().min(1).optional(),
    terms: z.array(z.string().min(1)).optional(),
    usersLimit: z.number().optional(),
    gstNo: z.string().optional(),
    amount: z.number().optional(),
    accessType: z.nativeEnum(accessType).optional(),
    key: z.string().optional().optional(),
    district: z.string().optional(),
    renewalAmount: z.number().optional(),
    shopName: z.string().optional(),
    extendKey: z.string().optional(),
    extendDays: z.number().optional(),
    workStartTime: z.coerce.date().optional(),
    workEndTime: z.coerce.date().optional(),
    currentPassword: z.string().optional(),
    password: z.string().optional(),
    newPassword: z.string().min(6).optional(),
    tarAlerts: alertsSchema.optional(),
    meltingAlerts: alertsSchema.optional(),
    boxAlerts: alertsSchema.optional(),
    kundaAlerts: alertsSchema.optional(),
    jointAlerts: alertsSchema.optional(),
    cuttingAlerts: alertsSchema.optional(),
    solderingAlerts: alertsSchema.optional(),

    startDate: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
});

const updateAdminBankDetailsSchema = z.object({
    accountName: z.string().min(1),
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    ifscCode: z.string().min(1),
    upiId: z.string().min(1),
});

const pdfHeader = z.object({
    leftInovation: z.coerce.string().optional(),
    rightInovation: z.coerce.string().optional(),
    factoryName: z.coerce.string().optional(),
    description: z.coerce.string().optional(),
    proprietorName: z.coerce.string().optional(),
    phoneNumbers: z.coerce.string().optional(),
    invocationColor: z.coerce.string().optional(),
    factoryNameColor: z.coerce.string().optional(),
    descriptionColor: z.coerce.string().optional(),
    proprietorColor: z.coerce.string().optional(),
    phoneColor: z.coerce.string().optional(),
    factoryFontSize: z.coerce.string().optional(),
    descriptionFontSize: z.coerce.string().optional(),
    proprietorFontSize: z.coerce.string().optional(),
    phoneFontSize: z.coerce.string().optional(),
});

export const saveRoomTime = z.object({
    startTime: z.string(),
    endTime: z.string(),
});

const idSchema = z.string();

const checkPasswordSchema = z.object({
    password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z
    .object({
        currentPassword: z.string().optional(),
        currentpassword: z.string().optional(),
        newPassword: z.string().optional(),
        newpassword: z.string().optional(),
    })
    .refine(
        (data) =>
            (data.currentPassword || data.currentpassword) &&
            (data.newPassword || data.newpassword),
        {
            message: 'Both currentPassword and newPassword are required',
        },
    );

export default {
    updateAdminProfileSchema,
    updateAdminBankDetailsSchema,
    idSchema,
    saveRoomTime,
    pdfHeader,
    checkPasswordSchema,
    changePasswordSchema,
    tarAlertItemSchema,
    tarAlertsSchema,
    alertItemSchema,
    alertsSchema,
};
