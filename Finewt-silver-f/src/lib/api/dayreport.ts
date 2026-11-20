import {api} from '@/utils/axios';
import {useQuery} from '@tanstack/react-query';
import {collectDayProcess} from '@/utils/manufacturingStock';

export interface NewStockItem {
  id?: string;
  name?: string;
  itemName?: string;
  grossweight?: number;
  grossWeight?: number;
  weight?: number;
  purity: number | null;
  fineweight?: number;
  fineWeight?: number;
  remark?: string;
  type?: string;
  isManual?: boolean;
  item?: string;
  size?: string;
  createdAt?: string;
}

export interface ProcessDataItem {
  id?: string;
  name?: string;
  processName?: string;
  itemName?: string;
  item?: string;
  grossweight?: number;
  grossWeight?: number;
  weight?: number;
  purity?: number | null;
  fineweight?: number;
  fineWeight?: number;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  size?: string;
  scrap?: number;
  loss?: number;
}

export interface ClientDuePaidItem {
  id?: string;
  clientName?: string;
  name?: string;
  duePaid?: number;
  due?: number;
  weight?: number;
  grossweight?: number;
  purity?: number;
  fineweight?: number;
  remark?: string;
  createdAt?: string;
}

export interface LossDataItem {
  id?: string;
  particular?: string;
  item?: string | {name?: string};
  name?: string;
  processName?: string;
  purity?: number | null;
  loss?: number;
  lossWeight?: number;
  weight?: number;
  createdAt?: string;
}

export interface StockSummaryData {
  totalInwardWeight?: number;
  totalOutwardWeight?: number;
  netWeight?: number;
  inward?: NewStockItem[];
  outward?: NewStockItem[];
}

export interface BillDetailItem {
  id?: string;
  itemName?: string;
  item?: string;
  name?: string;
  size?: string;
  purity?: number | null;
  weight?: number;
  grossweight?: number;
  fineWeight?: number;
  fineweight?: number;
  srp?: number;
  laborRate?: number;
}

export interface BillDataItem {
  id?: string;
  billNumber?: string;
  clientName?: string;
  type?: string;
  totalWeight?: number;
  customerWeight?: number;
  remainingWeight?: number;
  receiptDate?: string;
  createdAt?: string;
  items?: BillDetailItem[];
  itemsCount?: number;
}

export interface DayReportData {
  date?: string;
  summary?: {
    totalProcessWeight?: number;
    totalProcessFineWeight?: number;
    totalDuePaidWeight?: number;
    totalSettlementWeight?: number;
    totalSettlementFineWeight?: number;
    totalLossWeight?: number;
    totalStockInwardWeight?: number;
    totalStockOutwardWeight?: number;
    totalClientDueWeight?: number;
    totalClientDueFineWeight?: number;
    totalNewStockWeight?: number;
    totalNewStockFineWeight?: number;
    totalBillsWeight?: number;
    totalBillsCustomerWeight?: number;
    totalBillsRemainingWeight?: number;
    counts?: {
      process?: number;
      clientDuePaid?: number;
      settlement?: number;
      clientDue?: number;
      loss?: number;
      stockInward?: number;
      stockOutward?: number;
      newStock?: number;
      bills?: number;
    };
    byProcess?: Record<
      string,
      {totalWeight?: number; totalFineWeight?: number; count?: number}
    >;
  };
  process?: {
    tar?: ProcessDataItem[];
    box?: ProcessDataItem[];
    soldering?: ProcessDataItem[];
    joint?: ProcessDataItem[];
    cutting?: ProcessDataItem[];
    kunda?: ProcessDataItem[];
    melting?: ProcessDataItem[];
    all?: ProcessDataItem[];
  };
  processList?: ProcessDataItem[];
  clientDue?: ClientDuePaidItem[];
  clientDuePaid?: ClientDuePaidItem[];
  settlement?: ClientDuePaidItem[];
  loss?: LossDataItem[];
  lossList?: LossDataItem[];
  todayLoss?: LossDataItem[];
  losses?: LossDataItem[];
  stock?: StockSummaryData;
  newStock?: NewStockItem[];
  bills?: BillDataItem[];
}

export interface DayReportResponse {
  statusCode?: number;
  status?: boolean;
  data?: DayReportData;
  message?: string;
}

export const getDayReportApi = async (date?: string | null) => {
  try {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response: any = await api.get('/admin/stock/today', {params});
    const data: any = response?.data ?? response ?? {};
    // Add the stages kept in the browser for the same day
    const local = collectDayProcess(date ? new Date(date) : new Date());
    const all = [...(data.process?.all || []), ...local];
    const sum = (k: string) =>
      Math.round(all.reduce((t: number, x: any) => t + (Number(x[k]) || 0), 0) * 1000) / 1000;
    const merged = {
      ...data,
      process: { ...(data.process || {}), all },
      processList: all,
      summary: {
        ...(data.summary || {}),
        totalProcessWeight: sum('grossWeight'),
        totalProcessFineWeight: sum('fineWeight'),
        counts: { ...(data.summary?.counts || {}), process: all.length },
      },
    };
    return { ...response, data: merged };
  } catch (error) {
    console.error('Error in getDayReportApi:', error);
    return null;
  }
};

export const useGetDayReport = (date?: string | null) => {
  return useQuery({
    queryKey: ['dayReport', date],
    queryFn: () => getDayReportApi(date),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};
