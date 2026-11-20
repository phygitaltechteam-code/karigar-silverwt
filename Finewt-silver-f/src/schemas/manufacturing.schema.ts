import {z} from 'zod';

export const TarFormSchema = z.object({
  goldWeight: z.number().min(0.001, 'Gold weight must be greater than 0'),
  purity: z
    .number()
    .min(0, 'Purity must be at least 0')
    .max(100, 'Purity cannot exceed 100'),
  remark: z.string().optional().default(''),
});

export type TarFormData = z.infer<typeof TarFormSchema>;

export const PurityUpgradeSchema = z.object({
  currentWeight: z.number().min(0.001, 'Current weight must be greater than 0'),
  currentPurity: z
    .number()
    .min(0, 'Current purity must be at least 0')
    .max(100, 'Current purity cannot exceed 100'),
  targetPurity: z
    .number()
    .min(0, 'Target purity must be at least 0')
    .max(100, 'Target purity cannot exceed 100'),
});

export type PurityUpgradeFormData = z.infer<typeof PurityUpgradeSchema>;
