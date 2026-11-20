import { z } from 'zod';

export const manufacturingProcessSchema = z
  .enum([
    'Melting',
    'Company',
    'Press',
    'Sutt',
    'Bharni',
    'Cutting',
    'Wash',
    'Soldering',
    'Polishing',
    'Vibrator',
    'Meena',
    'Tass',
  ])
  .or(z.string().trim());

export const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),

  process: manufacturingProcessSchema.optional(),

  phone: z
    .string()
    .trim()
    .min(1, 'Phone cannot be empty')
    .max(20, 'Phone must not exceed 20 characters')
    .nullable()
    .optional(),

  address: z.string().trim().max(500).nullable().optional(),

  openingBalance: z.coerce.number().finite().nullable().optional(),
});

export const updateSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(255).optional(),

    process: manufacturingProcessSchema.optional(),

    phone: z
      .string()
      .trim()
      .min(1, 'Phone cannot be empty')
      .max(20, 'Phone must not exceed 20 characters')
      .nullable()
      .optional(),

    address: z.string().trim().max(500).nullable().optional(),

    openingBalance: z.coerce.number().finite().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update',
  });

export type CreateKarigarInput = z.infer<typeof createSchema>;
export type UpdateKarigarInput = z.infer<typeof updateSchema>;

// Aliases for convenience across modules
export const CreateKarigarSchema = createSchema;
export const UpdateKarigarSchema = updateSchema;
