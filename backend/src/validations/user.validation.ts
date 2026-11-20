import {z} from 'zod';
import {password, emailSchema, usernameSchema, fullnameSchema} from './custom.validation';

import commonValidation from './common.validation';
import {Role} from '.prisma/client/default';

const registerUserSchema = z.object({
    fullname: fullnameSchema.trim(),
    email: emailSchema.trim(),
    username: usernameSchema.trim(),
    password: password,
    phoneNumber: z.string(),
    secondaryPhoneNumber: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    customerLimit: z.coerce.number().optional(),
    dob: z.coerce.date().optional(),
    address: z.string().optional(),
    amount: z.coerce.number().optional(),
    renewalAmount: z.coerce.number().optional(),
    district: z.string().optional(),
    BrandColour: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    accessType: z.enum(['ONLINE', 'OFFLINE']).optional(),
    key: z.string().optional(),
    extendDays: z.coerce.number().int().optional(),
    extendKey: z.string().optional(),
    startDate: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    pincode: z.string().optional(),
    contactPersonName: z.string().optional(),
    contactPersonPhone: z.string().optional(),
    contactPersonEmail: z.string().optional(),
    shopName: z.string().optional(),
});
const registerComapnySchema = z.object({
    fullname: fullnameSchema.trim(),
    email: emailSchema.trim(),
    username: usernameSchema.trim(),
    password: password,
    phoneNumber: z.string(),
    passport: z.string().optional(),
    aadharCard: z.string().optional(),
    panCard: z.string().optional(),
    passportNumber: z.string().optional(),
    aadharCardNumber: z.string().optional(),
    panCardNumber: z.string().optional(),
    accountNumber: z.string(),
    address: z.string(),
    city: z.string(),
    photo: z.string(),
    state: z.string(),
    country: z.string(),
    pincode: z.string(),
    securityPin: z.string(),
    rejectedReason: z.string().optional(),
    bankName: z.string(),
    Routing_IFSC: z.string(),
    // Account_Type: z.nativeEnum(Account_Type).optional(),
    createdAt: z.date().default(new Date()),
    updatedAt: z.date().default(new Date()),
    Nominee_Name: z.string().optional(),
    Relationship: z.string().optional(),
    Contact: z.string().optional(),
    Allocation: z.string().optional(),
    isKycCompleted: z.string().optional(),
});

const loginUserSchema = z.object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    password: password,
    type: z.string().optional(),
});

const changePasswordSchema = z.object({
    currentPassword: password,
    newPassword: password,
});

const requestPasswordResetSchema = z.object({
    email: emailSchema,
});

const resetPasswordSchema = z.object({
    newPassword: password,
});

const updateUserSchema = registerUserSchema
    .omit({
        email: true,
        username: true,
        password: true,
        role: true,
    })
    .partial();

const refreshTokenRequestSchema = z.object({
    refreshToken: commonValidation.refreshTokenSchema,
    cookies: z
        .object({
            refreshToken: commonValidation.refreshTokenSchema,
        })
        .refine((data) => data.refreshToken, {
            message: 'Refresh token is required',
            path: ['refreshToken'],
        }),
});

const verifyVerificationCodeSchema = z.object({
    username: usernameSchema,
    code: z.string().length(6, {
        message: 'Verification code must be 6 digits!',
    }),
});
const changePin = z.object({
    currentPin: z.string(),
    newPin: z.string(),
});

export default {
    registerUserSchema,
    loginUserSchema,
    changePasswordSchema,
    updateUserSchema,
    requestPasswordResetSchema,
    refreshTokenRequestSchema,
    verifyVerificationCodeSchema,
    resetPasswordSchema,
    customerIdSchema: z.object({
        id: z.string(),
        customerId: z.string(),
    }),
    changePin,
    registerComapnySchema,
    idSchema: commonValidation.idSchema,
};
