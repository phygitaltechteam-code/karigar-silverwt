import {z} from 'zod';

export const SettlementSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  clientName: z.string().min(1, 'Client name is required'),
  amount: z.number().min(0.001, 'Amount must be greater than 0'),
  type: z.enum(['give', 'receive']),
  pendingBalance: z.number().default(0),
  remark: z.string().optional().default(''),
});

export type SettlementFormData = z.infer<typeof SettlementSchema>;
