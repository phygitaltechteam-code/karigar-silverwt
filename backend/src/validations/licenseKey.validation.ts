import {z} from 'zod';

const generateLicenseKeySchema = z.object({
    extendDays: z.number().int().positive('Extend days must be a positive integer'),
    count: z
        .number()
        .int()
        .positive('Count must be a positive integer')
        .max(100, 'Cannot generate more than 100 keys at once'),
});

const useLicenseKeySchema = z.object({
    key: z.string().min(1, 'License key is required'),
});

export default {
    generateLicenseKeySchema,
    useLicenseKeySchema,
};
