// lib/api/cutting.ts
import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Cutting {
  id: string;
  itemId: string;
  sizeId: string;
  chainGiven: number;
  chainReceived: number;
  scrap: number;
  purity?: string;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}



// API Functions
export const getCuttingApi = async () => {

  try {
    const response = await api.get('/admin/cutting');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch cutting entries');
    }
    throw error;
  }
};
export const getCuttingHistoryApi = async () => {

  try {
    const response = await api.get('/admin/cutting/history');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch cutting history ');
    }
    throw error;
  }
};

export const getCuttingStockApi = async () => {
  try {
    const response = await api.get('/admin/cutting/stock');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch cutting stock');
    }
    throw error;
  }
};

export const getLastCuttingStockApi = async () => {
  try {
    const response = await api.get('/admin/cutting/lastStock');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch last cutting stock');
    }
    throw error;
  }
};

export const submitCuttingStockApi = async (data: any) => {
  try {
    const payload = {
      ...(data?.itemId && { itemId: data.itemId }),
      ...(data?.sizeId && { sizeId: data.sizeId }),
      ...(data?.purity !== undefined && { purity: Number(data.purity) }),
      ...(data?.chainWeight !== undefined
        ? { chainWeight: Number(data.chainWeight) }
        : data?.chainGiven !== undefined
          ? { chainWeight: Number(data.chainGiven) }
          : data?.weight !== undefined
            ? { chainWeight: Number(data.weight) }
            : {}),
    };
    const response = await api.post('/admin/cutting/stock', payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to submit cutting stock';
    throw new Error(message);
  }
};

export const submitCuttingApi = async ({ id, data }: { id: string; data: any }) => {
  try {
    const payload = {
      ...data,
      ...(data?.purity !== undefined && { purity: Number(data.purity || 0) }),
    };
    const response = await api.put(`/admin/cutting/${id}`, payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to submit cutting';
    const err = new Error(message);
    (err as any).response = error?.response;
    throw err;
  }
};

export const submitMoveCuttingApi = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => {
  try {
    const payload = {
      ...data,
      ...(data?.purity !== undefined && { purity: Number(data.purity || 0) }),
    };
    const response = await api.put(`/admin/soldering/cutting/${id}`, payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to submit cutting';
    const err = new Error(message);
    (err as any).response = error?.response;
    throw err;
  }
};

export const getKundaApi = async () => {

  try {
    const response = await api.get('/admin/kunda');
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch S Kunda entries';
    const err = new Error(message);
    (err as any).response = error?.response;
    throw err;
  }
};

export const getKundaHistoryApi = async () => {

  try {
    const response = await api.get('/admin/kunda/history');
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch S Kunda history';
    const err = new Error(message);
    (err as any).response = error?.response;
    throw err;
  }
};

export const submitKundaApi = async ({ id, data }: { id: string; data: any }) => {
  try {
    const payload = {
      ...data,
      ...(data?.purity !== undefined && { purity: Number(data.purity || 0) }),
    };
    const response = await api.put(`/admin/kunda/${id}`, payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to submit S Kunda';
    const err = new Error(message);
    (err as any).response = error?.response;
    throw err;
  }
};

export const submitMoveKundaApi = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}) => {
  try {
    const payload = {
      ...data,
      ...(data?.purity !== undefined && { purity: Number(data.purity || 0) }),
    };
    const response = await api.put(`/admin/cutting/kunda/${id}`, payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to move to S Kunda';
    const err = new Error(message);
    (err as any).response = error?.response;
    throw err;
  }
};

// React Query Hooks
export const useGetCutting = () => {
  return useQuery({
    queryKey: ['cutting'],
    queryFn: getCuttingApi,
  });
};

export const useGetCuttingHistory = () => {
  return useQuery({
    queryKey: ['cutting-history'],
    queryFn: getCuttingHistoryApi,
  });
};

export const useGetCuttingStock = () => {
  return useQuery({
    queryKey: ['cutting-stock'],
    queryFn: getCuttingStockApi,
  });
};

export const useGetLastCuttingStock = () => {
  return useQuery({
    queryKey: ['cutting-last-stock'],
    queryFn: getLastCuttingStockApi,
  });
};

export const useSubmitCuttingStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitCuttingStockApi,
    onSuccess: () => {
      toast.success('Cutting stock submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['cutting-stock'] });
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit cutting stock');
    },
  });
};

export const useSubmitCutting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitCuttingApi,
    onSuccess: () => {
      toast.success('Cutting submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
      queryClient.invalidateQueries({ queryKey: ['cutting-history'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit cutting');
    },
  });
};

export const useSubmitMoveCutting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitMoveCuttingApi,
    onSuccess: () => {
      toast.success('Cutting submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
      queryClient.invalidateQueries({ queryKey: ['cutting-history'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit cutting');
    },
  });
};

export const useGetKunda = () => {
  return useQuery({
    queryKey: ['kunda'],
    queryFn: getKundaApi,
  });
};

export const useGetKundaHistory = () => {
  return useQuery({
    queryKey: ['kunda-history'],
    queryFn: getKundaHistoryApi,
  });
};

export const useSubmitKunda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitKundaApi,
    onSuccess: () => {
      toast.success('S Kunda process stopped successfully');
      queryClient.invalidateQueries({ queryKey: ['kunda'] });
      queryClient.invalidateQueries({ queryKey: ['kunda-history'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to stop S Kunda process');
    },
  });
};

export const useSubmitMoveKunda = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitMoveKundaApi,
    onSuccess: () => {
      toast.success('Moved to S Kunda successfully');
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
      queryClient.invalidateQueries({ queryKey: ['kunda'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to move to S Kunda');
    },
  });
};

export const useAddSKundaInStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addSKundaInStock,
    onSuccess: () => {
      toast.success('Added to stock successfully');
      queryClient.invalidateQueries({ queryKey: ['stockInward'] });
      queryClient.invalidateQueries({ queryKey: ['kunda'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to stock');
    },
  });
};
export const revertCuttingStockApi = async (id: string) => {
  try {
    const response = await api.put(`/admin/cutting/revertStock/${id}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to revert cutting stock';
    throw new Error(message);
  }
};

export const useRevertCuttingStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertCuttingStockApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['cutting-stock'] });
      queryClient.invalidateQueries({ queryKey: ['cutting-last-stock'] });
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
      queryClient.invalidateQueries({ queryKey: ['cutting-history'] });
      queryClient.invalidateQueries({ queryKey: ['cuttingScrap'] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert';
      toast.error(msg);
    },
  });
};

export const revertCuttingApi = async (id: string) => {
  try {
    const response = await api.put(`/admin/cutting/revert/${id}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to revert cutting';
    throw new Error(message);
  }
};

export const useRevertCutting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertCuttingApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Cutting reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['cutting-stock'] });
      queryClient.invalidateQueries({ queryKey: ['cutting-last-stock'] });
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
      queryClient.invalidateQueries({ queryKey: ['cutting-history'] });
      queryClient.invalidateQueries({ queryKey: ['cuttingScrap'] });
      queryClient.invalidateQueries({ queryKey: ['soldering'] });
      queryClient.invalidateQueries({ queryKey: ['joint'] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert cutting';
      toast.error(msg);
    },
  });
};

export const revertKundaApi = async (id: string) => {
  const response = await api.put(`/admin/kunda/revert/${id}`);
  return response.data;
};

export const useRevertKunda = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertKundaApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'S Kunda reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ['kunda'] });
      queryClient.invalidateQueries({ queryKey: ['cutting'] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert S Kunda';
      toast.error(msg);
    },
  });
};

export const addSKundaInStock = async ({
  id,
  data,
}: {
  id?: string;
  data: any;
}) => {
  try {
    const payload = {
      stockId: data?.stockId || id,
      weight: data?.weight,
    };
    const response = await api.post(`/admin/kunda/stock`, payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to add to stock';
    const err = new Error(message);
    (err as any).response = error?.response;
    throw err;
  }
};
