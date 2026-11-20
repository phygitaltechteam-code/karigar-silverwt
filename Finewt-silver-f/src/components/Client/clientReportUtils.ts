import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';

export interface ClientReportEntry {
  id: string;
  srNo: number;
  dateTime: string;
  billNo: string;
  item: string;
  size: string;
  purity: string;
  remark: string;
  wt: number;
  chainWt: number | null;
  goldWt: number | null;
  isGold: boolean;
  groupId: string;
  isFirstInGroup: boolean;
  groupRowSpan: number;
  rawGroupItems?: ApiDataItem[];
  totalWeight?: number | null;
  fineWeight?: number | null;
  given?: number | null;
  paid?: number | null;
  pending?: number | null;
}

export interface ApiResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: ApiDataItem[];
  errors: null;
}

export interface ApiDataItem {
  id: string;
  clientId: string;
  billNumber: string | null;
  itemId: string | null;
  sizeId: string | null;
  purity: number | null;
  remark: string;
  weight: number;
  receiptId: string | null;
  createdAt: string;
  updatedAt: string;
  fineWeight?: number | null;
  fineweight?: number | null;
  totalWeight?: number | null;
  customerWeight?: number | null;
  remainingWeight?: number | null;
  paid?: number | null;
  given?: number | null;
  pending?: number | null;
  receipt?: {
    id?: string;
    clientID?: string;
    receiptDate?: string;
    billNumber?: string | null;
    totalWeight?: number | null;
    customerWeight?: number | null;
    remainingWeight?: number | null;
    totalBill?: number | null;
    dueBalance?: number | null;
    paid?: number | null;
    pending?: number | null;
    receiptItems?: any[];
  } | null;
  item: {
    id: string;
    name: string;
    adminId?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  size: {
    id: string;
    size: string;
    adminId?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export const formatIndianDate = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getCurrentWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

export const formatNumber = (value: any) => {
  if (value === 0 || value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  const str = num.toFixed(3);
  return str.replace(/\.?0+$/, '');
};

export const getRemarkStyle = (_remark: string) => {
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};
