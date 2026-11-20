import {z} from 'zod';
import {accessType} from '@prisma/client';
import {password, emailSchema, usernameSchema, fullnameSchema} from './custom.validation';

// Empty strings from form fields are treated as "not provided"
const emptyToUndefined = (val: unknown) => (val === '' || val === null ? undefined : val);

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());
const optionalNumber = z.preprocess(emptyToUndefined, z.coerce.number().optional());
const optionalInt = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional());
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const phone = z.string().trim().regex(/^\d{10}$/, 'Phone number must be 10 digits');
const pincode = z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
);

const adminFields = {
    shopName: optionalString,
    secondaryPhoneNumber: z.preprocess(emptyToUndefined, phone.optional()),
    address: optionalString,
    pincode,
    city: optionalString,
    district: optionalString,
    state: optionalString,
    country: optionalString,
    accessType: z.nativeEnum(accessType).optional(),
    amount: optionalNumber,
    renewalAmount: optionalNumber,
    startDate: optionalDate,
    expiryDate: optionalDate,
    key: optionalString,
    extendKey: optionalString,
    extendDays: optionalInt,
    BrandColour: optionalString,
};

const createAdminSchema = z.object({
    fullname: fullnameSchema.trim(),
    email: emailSchema.trim(),
    username: z.preprocess(emptyToUndefined, usernameSchema.trim().optional()),
    password: password,
    phoneNumber: phone,
    ...adminFields,
});

const updateAdminSchema = z.object({
    fullname: z.preprocess(emptyToUndefined, fullnameSchema.trim().optional()),
    email: z.preprocess(emptyToUndefined, emailSchema.trim().optional()),
    username: z.preprocess(emptyToUndefined, usernameSchema.trim().optional()),
    password: z.preprocess(emptyToUndefined, password.optional()),
    phoneNumber: z.preprocess(emptyToUndefined, phone.optional()),
    isActive: z.boolean().optional(),
    ...adminFields,
});

const adminIdSchema = z.string().uuid('Invalid admin id');

export default {createAdminSchema, updateAdminSchema, adminIdSchema};
