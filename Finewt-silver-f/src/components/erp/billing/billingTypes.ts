export interface ReceiptItem {
  id: string;
  receiptID: string;
  itemID: string;
  sizeID: string;
  purity: number;
  grossWeight: number;
  srp: number;
  fineWeight: number;
  laborRate: number;
  laborType?: string;
  item: {
    id: string;
    name: string;
  };
  size: {
    id: string;
    size: string;
  };
}

export interface ReceiptData {
  id: string;
  clientID: string;
  receiptDate: string;
  billNumber?: string;
  totalWeight: number;
  customerWeight: number;
  remainingWeight: number;
  createdAt: string;
  type: string;
  client: {
    id: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    openingBalance: number;
    due?: number;
  };
  receiptItems: ReceiptItem[];
}

export interface BillGroup {
  id: string;
  /** Advance rows the customer gave (printed on the receipt) */
  advanceItems?: { item?: string; purity?: number | string; grossWt?: number | string; fineWt?: number | string }[];
  srNo: number;
  dateTime: string;
  billNo: string;
  clientName: string;
  phoneNumber: string;
  receive: number;
  pending: number;
  remainingWeight: number;
  type: 'DRAFT' | 'BILL';
  createdAt: string;
  items: {
    itemId?: string;
    sizeId?: string;
    item: string;
    size: string;
    purity: number;
    availableQty?: number;
    finWt: number;
    srp: number;
    grossWeight: number;
    laborRate?: number;
    laborType?: string;
  }[];
  displayItems: string;
  displaySizes: string;
  displayPurity: string;
  displayGrossWt: string;
  displayFinWt: string;
  displaySRP: string;
  totalFinWt: number;
  totalSRP: number;
  dueBalance: number;
}

export const formatNumberWithDecimals = (value: any) => {
  if (value === 0 || value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  const str = num.toFixed(3);
  return str.replace(/\.?0+$/, '');
};

export const formatNumberWith2Decimals = (value: any) => {
  if (value === 0 || value === null || value === undefined || value === '') return '0.00';
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'BILL':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
