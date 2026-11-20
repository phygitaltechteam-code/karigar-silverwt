export interface ReceiptItem {
  id: string;
  srNo: number;
  item: string;
  size?: string;
  design?: string;
  stamp?: string;
  purity: number | string;
  availableQty: number | string;
  grossWt: number | string;
  wastage: number | string;
  srp: number | string;
  fineWt: number;
  laborRate: number | string;
  /** GRAM = labour in fine grams (added to the bill), AMOUNT = labour in rupees */
  laborType?: 'GRAM' | 'AMOUNT';
  isLoadingQty?: boolean;
  itemId?: string;
  sizeId?: string;
  /** Product ID: stock code when scanned, or generated for a custom product */
  productCode?: string;
}

export interface ReceiptFormData {
  clientId: string;
  clientName: string;
  date: string;
  items: ReceiptItem[];
  customerWeight: number | string;
  remainingWeight?: number | string;
  totalFine: number | string;
  goldInfo: {
    karat: string;
    rate: number;
    weight: number;
    totalAmount: number;
  };
}

export const calculateSrpFineWeight = (
  grossWt: number,
  srpInput: number,
) => {
  // Wastage is entered in grams and added to the fine weight as is
  if (!grossWt || grossWt <= 0 || !srpInput || srpInput <= 0) return 0;
  return Math.round(srpInput * 1000) / 1000;
};

export const calculateFineWeight = (
  purity: number,
  grossWt: number,
  srpInput: number,
) => {
  const baseFineWt = (purity / 100) * grossWt;
  const srpFineWt = calculateSrpFineWeight(grossWt, srpInput);
  const totalFine = baseFineWt + srpFineWt;
  return Math.round(totalFine * 1000) / 1000;
};

export const updateTotalFine = (items: ReceiptItem[]) => {
  const total = items.reduce(
    (sum, item) =>
      sum +
      (item.fineWt || 0) +
      (item.laborType === 'AMOUNT' ? 0 : Number(item.laborRate) || 0),
    0,
  );
  return Math.round(total * 1000) / 1000;
};

export const getClientDueBalance = (client: any) => {
  if (!client) return 0;
  const due =
    client?.due !== null && client?.due !== undefined
      ? Number(client.due)
      : NaN;
  if (!isNaN(due)) {
    return Math.round(due * 1000) / 1000;
  }
  const openingBalance = Number(client?.openingBalance) || 0;
  return Math.round(openingBalance * 1000) / 1000;
};

export const formatNumberThreeDecimals = (value: any) => {
  if (value === 0 || value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  const formatted = Number(num.toFixed(3)).toString();
  return formatted;
};
