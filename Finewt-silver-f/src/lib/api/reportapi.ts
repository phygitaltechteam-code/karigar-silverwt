import {api} from '@/utils/axios';
import { collectManufacturingHistory } from '@/utils/manufacturingStock';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';


export const useGetClientReport = (id: string) => {
  return useQuery({
    queryKey: ['client report', id],
    queryFn: () => getclientreport(id),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const getclientreport = async (id: string) => {
  try {
    const response = await api.get(`admin/client/pay/${id}`);
    return response.data;
  } catch (error: any) {

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch client report',
    );
  }
};

export const useGetStockReport = (id: string) => {
  return useQuery({
    queryKey: ['stock report', id],
    queryFn: () => getstockreport(id),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

const getstockreport = async (id: string) => {
  try {
    const response = await api.get(`admin/stock/history/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch stock report',
    );
  }
};

export const revertStockReportApi = async (id: string) => {
  try {
    const response = await api.put(`/admin/stock/history/revert/${id}`);
    return response.data;
  } catch (error: any) {
    try {
      const fallback = await api.put(`/admin/stock/revert/${id}`);
      return fallback.data;
    } catch (fallbackErr: any) {
      const postFallback = await api.post(`/admin/stock/revert/${id}`);
      return postFallback.data;
    }
  }
};

export const useRevertStockReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertStockReportApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Stock entry reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['stock report']});
      queryClient.invalidateQueries({queryKey: ['stock']});
      queryClient.invalidateQueries({queryKey: ['stockInward']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert stock entry';
      toast.error(msg);
    },
  });
};

export const useGetManufacturingData = () => {
  return useQuery({
    queryKey: ['manufacturing report'],
    queryFn: getManufacturingData,
    retry: 1,
  });
};

const getManufacturingData = async () => {
  // Galai (server) + every other stage (browser): saved rows only
  let galai: any[] = [];
  try {
    const response: any = await api.get('/admin/manufacturing/galai/history');
    const list = response?.data ?? response;
    galai = (Array.isArray(list) ? list : []).map((e: any) => ({
      id: e.id,
      createdAt: e.completedAt || e.updatedAt || e.createdAt,
      itemId: 'Galai',
      item: { name: e.particular ? `Galai · ${e.particular}` : 'Galai' },
      sizeId: '',
      size: { size: 'N/A' },
      purity: Number(e.purity) || 0,
      weight: Number(e.grossWt) || 0,
      currentWeight: Number(e.fineWeight) || 0,
      scrap: Number(e.scrapWeight) || 0,
      loss: Number(e.loss) || 0,
    }));
  } catch (error: any) {
    console.warn('Failed to fetch Galai history:', error);
  }
  const history = [...galai, ...collectManufacturingHistory()];
  const sum = (k: string) => history.reduce((t, h) => t + (Number(h[k]) || 0), 0);
  return {
    totals: {
      totalWeight: sum('weight'),
      totalScrap: sum('scrap'),
      totalLoss: sum('loss'),
      currentWeight: sum('currentWeight'),
    },
    history,
  };
};
