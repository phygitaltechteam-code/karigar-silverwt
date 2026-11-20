import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface MeltingEntry {
  id: string;
  particular?: string;
  grossWt: number;
  purity: number;
  expectedFine?: number;
  fineWt?: number;
  scrapCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isCompleted?: boolean;
}

export const getMeltingApi = async () => {

  try {
    const response = await api.get('/admin/melting');
    return response.data?.data || response.data || [];
  } catch (error) {
    return [];
  }
};

export const getMeltingHistoryApi = async () => {

  try {
    const response = await api.get('/admin/melting/history');
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.data?.history)) return response.data.history;
    if (Array.isArray(response.data?.meltingHistory))
      return response.data.meltingHistory;
    return response.data?.data || response.data?.history || response.data || [];
  } catch (error) {
    return [];
  }
};

export const getScrapApi = async () => {

  try {
    const response = await api.get('/admin/scrap');
    return response.data?.data || response.data || [];
  } catch (error) {
    return [];
  }
};

export const submitMeltingStockApi = async ({
  id,
  data,
}: {
  id?: string;
  data: any;
}) => {
  const payload = {
    ...data,
    ...(data?.purity !== undefined && {purity: Number(data.purity || 0)}),
  };
  const response = await api.put(`/admin/melting/${id}`, payload);
  return response.data;
};

export const useGetMelting = () => {
  return useQuery({
    queryKey: ['melting'],
    queryFn: getMeltingApi,
  });
};

export const useGetMeltingHistory = () => {
  return useQuery({
    queryKey: ['meltingHistory'],
    queryFn: getMeltingHistoryApi,
  });
};

export const useGetScrap = () => {
  return useQuery({
    queryKey: ['scrap'],
    queryFn: getScrapApi,
  });
};

export const useSubmitMeltingStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitMeltingStockApi,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['melting']});
      queryClient.invalidateQueries({queryKey: ['meltingHistory']});
      queryClient.invalidateQueries({queryKey: ['stock']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit melting stock';
      toast.error(msg);
    },
  });
};

export const submitMeltingScrapStockApi = async (data: any) => {
  const response = await api.post('/admin/melting/scrap', data);
  return response.data;
};

export const useSubmitMeltingScrapStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitMeltingScrapStockApi,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['melting']});
      queryClient.invalidateQueries({queryKey: ['scrap']});
      queryClient.invalidateQueries({queryKey: ['stock']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit melting scrap';
      toast.error(msg);
    },
  });
};
