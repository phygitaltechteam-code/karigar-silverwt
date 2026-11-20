import {z} from 'zod';

export const BillingItemSchema = z.object({
  id: z.string().optional(),
  itemId: z.string().min(1, 'Item is required'),
  item: z.string().min(1, 'Item name is required'),
  sizeId: z.string().optional().nullable(),
  size: z.string().optional().default(''),
  purity: z
    .number()
    .min(0, 'Purity must be at least 0')
    .max(100, 'Purity cannot exceed 100'),
  availableQty: z.number().optional().default(0),
  grossWt: z.number().min(0, 'Gross weight must be positive'),
  wastage: z.number().min(0).default(0),
  srp: z.number().min(0).default(0),
  fineWt: z.number().min(0).default(0),
  laborRate: z.number().min(0).default(0),
});

export type BillingItemFormData = z.infer<typeof BillingItemSchema>;

export const BillFormSchema = z.object({
  clientId: z.string().min(1, 'Client selection is required'),
  clientName: z.string().min(1, 'Client name is required'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  items: z.array(BillingItemSchema).min(1, 'At least one item is required'),
  customerWeight: z.number().min(0).default(0),
  totalFine: z.number().min(0).default(0),
  previousDue: z.number().default(0),
  newBalance: z.number().default(0),
});

export type BillFormData = z.infer<typeof BillFormSchema>;
