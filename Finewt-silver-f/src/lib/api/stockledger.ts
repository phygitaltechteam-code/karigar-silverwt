import {api} from '@/utils/axios';
import {useQuery} from '@tanstack/react-query';

export interface StockSummaryData {
  opening: {
    gold: number;
    raw: number;
    openingChain: number;
    srp: number;
    openingClientDue: number;
    inward: number;
  };
  closing: {
    gold: number;
    raw: number;
    closingChain: number;
    closingClientDue: number;
    outward: number;
    loss: number;
    profitLoss?: number;
  };
}

export interface StockTableItem {
  id: string;
  name: string;
  opening: number;
  closing: number;
  due?: number;
  difference?: number;
}

export interface StockMovementItem {
  id: string;
  inwardName: string;
  inwardSubtext?: string;
  inward?: number | null;
  outwardName: string;
  outwardSubtext?: string;
  outward?: number | null;
}

export interface StockLedgerReportResponse {
  statusCode?: number;
  status?: boolean;
  message?: string;
  data?: {
    summary?: StockSummaryData;
    opening?: any;
    closing?: any;
    rawStock?: StockTableItem[];
    chainStock?: StockTableItem[];
    client?: StockTableItem[];
    stockMovement?: StockMovementItem[];
    [key: string]: any;
  };
}



export const getStockLedgerReportApi = async (
  fromDate?: string,
  toDate?: string,
) => {
  try {
    const payload = {
      fromDate: fromDate || '',
      toDate: toDate || '',
    };

    const response = await api.post('/admin/stock/report', payload);
    const resData = response.data;



    return resData;
  } catch (error: any) {
    console.warn(
      'API /admin/stock/report POST response / error:',
      error?.response?.data || error?.message,
    );
    throw error;
  }
};

export const useGetStockLedgerReport = (fromDate?: string, toDate?: string) => {
  return useQuery({
    queryKey: ['stock-report', fromDate, toDate],
    queryFn: () => getStockLedgerReportApi(fromDate, toDate),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  });
};
