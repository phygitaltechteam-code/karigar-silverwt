import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Stock {
  id: string;
  itemId: string;
  sizeId: string;
  weight: number;
  purity: string;
  type: string;
  note?: string;
  stockQty?: number;
  adminId?: string;
  createdAt?: string;
  updatedAt?: string;
}



// ============= GET API =============
export const getAllStockApi = async () => {
  try {
    const response: any = await api.get('/admin/stock');
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.data)) return response.data;
    if (response && Array.isArray(response.stocks)) return response.stocks;
    if (response && Array.isArray(response.items)) return response.items;
    return response?.data || response || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch stock entries');
    }
    throw error;
  }
};

// ============= GET STOCK BY ID =============
export const getStockByIdApi = async (id: string) => {
  try {
    const response = await api.get(`/admin/stock/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to fetch stock with ID: ${id}`);
    }
    throw error;
  }
};

// ============= UPDATE STOCK (INWARD/OUTWARD) =============
export const updateStockApi = async ({id, data}: {id: string; data: any}) => {
  try {
    const response = await api.post(`/admin/stock/increment/${id}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to update stock with ID: ${id}`);
    }
    throw error;
  }
};

// ============= DELETE STOCK =============
export const deleteStockByIdApi = async (id: string) => {
  try {
    const response = await api.delete(`/admin/stock/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to delete stock with ID: ${id}`);
    }
    throw error;
  }
};

// ============= REACT QUERY HOOKS =============

// ============= GET ALL STOCK HOOK =============
export const useGetAllStock = () => {
  return useQuery({
    queryKey: ['stock'],
    queryFn: getAllStockApi,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

// ============= GET STOCK BY ID HOOK =============
export const useGetStockById = (id: string) => {
  return useQuery({
    queryKey: ['stock', id],
    queryFn: () => getStockByIdApi(id),
    enabled: !!id,
  });
};

// ============= UPDATE STOCK HOOK =============
export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStockApi,
    onSuccess: () => {
      // toast.success('Stock updated successfully');
      queryClient.invalidateQueries({queryKey: ['stock']});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stock');
    },
  });
};

// ============= DELETE STOCK HOOK =============
export const useDeleteStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStockByIdApi,
    onSuccess: () => {
      toast.success('Stock deleted successfully');
      queryClient.invalidateQueries({queryKey: ['stock']});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete stock');
    },
  });
};
