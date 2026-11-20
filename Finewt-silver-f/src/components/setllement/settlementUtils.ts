export interface SettlementEntry {
  id: string;
  srNo: number;
  clientName: string;
  phoneNumber: string;
  goldBalance: number;
  totalBill: number;
  status: 'pending' | 'settled' | 'partial';
  clientId: string;
  openingBalance?: number;
  due?: number | null;
  address?: string;
  totalBills?: number;
  amount: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  bills?: Array<any>;
  receipts?: Array<any>;
}

export interface SettlementDetail {
  clientName: string;
  phoneNumber: string;
  address: string;
  pendingBalance: number;
  totalBills: number;
  settlementAmount: number;
  settlementType: 'receive' | 'give';
  date: string;
  clientId: string;
  openingBalance?: number;
  due?: number | null;
  remark?: string;
}

export const parseDateSafely = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return Number.isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;

    const ddmmyyyyMatch = trimmed.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/,
    );
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const rest = ddmmyyyyMatch[4].trim();

      if (rest) {
        const timeMatch = rest.match(
          /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i,
        );
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
          const ampm = timeMatch[4] ? timeMatch[4].toLowerCase() : null;
          if (ampm === 'pm' && hours < 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          const d = new Date(year, month, day, hours, minutes, seconds);
          if (!Number.isNaN(d.getTime())) return d;
        }
      }
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

export const formatNumber = (
  value: number | string | null | undefined,
  maxDecimals: number = 3,
): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return '0';
  if (num === 0) return '0';

  const fixed = num.toFixed(maxDecimals);
  return parseFloat(fixed).toString();
};
