import {z} from 'zod';
import {BillingItemSchema} from './billing.schema';

export const ReceiptItemSchema = BillingItemSchema;
export type ReceiptItemFormData = z.infer<typeof ReceiptItemSchema>;

export const ReceiptFormSchema = z.object({
  clientId: z.string().min(1, 'Client selection is required'),
  clientName: z.string().min(1, 'Client name is required'),
  date: z.string().min(1, 'Date is required'),
  items: z.array(ReceiptItemSchema).min(1, 'At least one item is required'),
  customerWeight: z.number().min(0).default(0),
  totalFine: z.number().min(0).default(0),
});

export type ReceiptFormData = z.infer<typeof ReceiptFormSchema>;
