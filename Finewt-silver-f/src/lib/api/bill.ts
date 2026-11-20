import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useGetQuantity = () => {
  return useMutation({
    mutationFn: getQuantityApi,
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to fetch quantity');
    },
  });
};

export const useBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBillApi,
    onSuccess: () => {
      toast.success('Bill added successfully');
      queryClient.invalidateQueries({ queryKey: ['bill'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stock-report'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

const saveBillApi = async (data: any) => {
  const response = await api.post('/admin/billing', data);
  return response.data;
};

const getQuantityApi = async (payload: {
  itemId: string;
  sizeId: string;
  purity: number;
  customerId: string;
}) => {
  const response = await api.put('/admin/billing/check', payload);
  return response.data;
};



export const useGetBill = () => {
  return useQuery({
    queryKey: ['bill'],
    queryFn: getbillAll,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const getbillAll = async () => {

  try {
    const response = await api.get('/admin/billing');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch bills');
    }
    throw error;
  }
};

export const useGetBillByid = (id: string) => {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: async () => {
      const response = await api.get(`/admin/billing/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

const deleteBillApi = async (id: string) => {
  const response = await api.delete(`/admin/billing/${id}`);
  return response.data;
};

export const useDeleteBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBillApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stock-report'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

export const useBillUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBillApi,
    onSuccess: () => {
      toast.success('Bill updated successfully');
      queryClient.invalidateQueries({ queryKey: ['bill'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stock-report'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

export const updateBillApi = async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/admin/billing/${id}`, data);
  return response.data;
};
