// lib/api/soldering.ts
import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Soldering {
  id: string;
  itemId: string;
  sizeId: string;
  chainGiven: number;
  chainReceived: number;
  powder: number;
  increase: number;
  scrap: number;
  isCompleted?: boolean;
  purity?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getBackendErrorMessage = (
  error: any,
  fallback: string,
): string => {
  if (!error) return fallback;
  const msg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.message;

  if (Array.isArray(msg)) {
    return msg.join(', ');
  }
  if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }
  return fallback;
};



// API Functions
export const getSolderingApi = async () => {

  const response = await api.get('/admin/soldering');
  return response.data;
};

export const getSolderingHistoryApi = async () => {

  const response = await api.get('/admin/soldering/history');
  return response.data;
};

export const submitSolderingApi = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => {
  const payload = {
    ...data,
    ...(data?.purity !== undefined && {
      purity: Number(Number(data.purity || 0).toFixed(2)),
    }),
  };
  const response = await api.put(`/admin/soldering/${id}`, payload);
  return response.data;
};

export const createSolderingApi = async (data: any) => {
  const items: any[] = Array.isArray(data) ? data : [data];
  const payload = items.map((item) => ({
    ...item,
    ...(item?.purity !== undefined && {
      purity: Number(Number(item.purity || 0).toFixed(2)),
    }),
  }));
  const response = await api.post('/admin/soldering', payload);
  return response.data;
};

// React Query Hooks
export const useGetSoldering = () => {
  return useQuery({
    queryKey: ['soldering'],
    queryFn: getSolderingApi,
  });
};

export const useGetSolderingHistory = () => {
  return useQuery({
    queryKey: ['soldering'],
    queryFn: getSolderingHistoryApi,
  });
};

export const useSubmitSoldering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSolderingApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Soldering submitted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['soldering']});
    },
    onError: (error: any) => {
      const msg = getBackendErrorMessage(error, 'Failed to submit soldering');
      toast.error(msg);
    },
  });
};

export const useCreateSoldering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSolderingApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Soldering created successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['soldering']});
    },
    onError: (error: any) => {
      const msg = getBackendErrorMessage(
        error,
        'Failed to create soldering entry',
      );
      toast.error(msg);
    },
  });
};

export const revertSolderingApi = async (id: string) => {
  try {
    const response = await api.put(`/admin/soldering/revert/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const response = await api.post(`/admin/soldering/revert/${id}`);
      return response.data;
    }
    throw error;
  }
};

export const revertSolderingCardApi = async (id: string) => {

  try {
    const response = await api.put(`/admin/soldering/history/revert/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const fallback = await api.put(`/admin/soldering/revert/${id}`);
      return fallback.data;
    }
    throw error;
  }
};

export const useRevertSoldering = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertSolderingApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Soldering reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['soldering']});
      queryClient.invalidateQueries({queryKey: ['box']});
      queryClient.invalidateQueries({queryKey: ['boxweight']});
    },
    onError: (error: any) => {
      const msg = getBackendErrorMessage(error, 'Failed to revert soldering');
      toast.error(msg);
    },
  });
};

export const useRevertSolderingCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertSolderingCardApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Soldering reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['soldering']});
      queryClient.invalidateQueries({queryKey: ['box']});
      queryClient.invalidateQueries({queryKey: ['boxweight']});
    },
    onError: (error: any) => {
      const msg = getBackendErrorMessage(error, 'Failed to revert soldering');
      toast.error(msg);
    },
  });
};
