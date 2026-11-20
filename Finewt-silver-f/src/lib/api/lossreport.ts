import {useQuery} from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import {api} from '@/utils/axios';
import {collectLosses} from '@/utils/manufacturingStock';

// ======================================================
// INTERFACES
// ======================================================

export interface LossReportItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  loss: number;
  lossWeight?: number;
  item?: {
    id: string;
    name: string;
  };
  size?: {
    id: string;
    size: string;
  };
  purity?: number;
  remark?: string;
  department?: string;
}



const fetchLossReport = async () => {
  // Server-side stages (Galai) + stages kept in the browser
  let serverRows: any[] = [];
  try {
    const response: any = await api.get('/admin/stock/loss');
    const list = response?.data ?? response;
    serverRows = Array.isArray(list) ? list : [];
  } catch (error) {
    console.warn('Failed to fetch loss report:', error);
  }
  return { status: true, data: [...serverRows, ...collectLosses()] };
};

// ======================================================
// REACT QUERY HOOK
// ======================================================

export const useGetLossReport = () => {
  return useQuery({
    queryKey: ['loss-report'],
    queryFn: fetchLossReport,
    retry: 1,
  });
};
