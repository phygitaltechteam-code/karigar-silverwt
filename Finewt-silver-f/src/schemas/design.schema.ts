import { z } from 'zod';

export enum manufacturingProcess {
  MELTING = 'MELTING',
  COMPANY = 'COMPANY',
  PRESS = 'PRESS',
  SUTT = 'SUTT',
  BHARNI = 'BHARNI',
  CUTTING = 'CUTTING',
  WASH = 'WASH',
  SOLDERING = 'SOLDERING',
  POLISHING = 'POLISHING',
  VIBRATOR = 'VIBRATOR',
  MEENA = 'MEENA',
  TASS = 'TASS',
}

export const baseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  process: z.nativeEnum(manufacturingProcess),
  rate: z.number().nonnegative('Rate cannot be negative').optional(),
});

export const createSchema = baseSchema.superRefine((data, ctx) => {
  if (data.process !== manufacturingProcess.SOLDERING && data.rate !== undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rate'],
      message: 'Rate can only be added for the SOLDERING process',
    });
  }
});

export const updateSchema = baseSchema.partial().superRefine((data, ctx) => {
  if (
    data.process !== undefined &&
    data.process !== manufacturingProcess.SOLDERING &&
    data.rate !== undefined
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rate'],
      message: 'Rate can only be added for the SOLDERING process',
    });
  }
});

export type BaseDesignInput = z.infer<typeof baseSchema>;
export type CreateDesignInput = z.infer<typeof createSchema>;
export type UpdateDesignInput = z.infer<typeof updateSchema>;
