import {z} from 'zod';

export const ClientSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  address: z.string().min(1, 'Address is required'),
  openingBalance: z.number().default(0),
});

export type ClientFormData = z.infer<typeof ClientSchema>;

export const EditClientSchema = ClientSchema.extend({
  id: z.string().optional(),
});

export type EditClientFormData = z.infer<typeof EditClientSchema>;
