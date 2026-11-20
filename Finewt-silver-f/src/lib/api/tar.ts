import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Tar {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  grosswt?: number;
  grossWt?: number;
  fine: number;
  tar: number;
  scrap: number;
  loss: number;
  purity: number;
  isSaved?: boolean;
  itemId?: string;
  sizeId?: string;
  createdAt?: string;
  updatedAt?: string;
}



// API Functions
const getTarApi = async () => {

  try {
    const response = await api.get('/admin/tar');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch tar entries');
    }
    throw error;
  }
};

const createTarApi = async (data: {
  grossWt?: number;
  fine: number;
  tar: number;
  scrap: number;
  loss: number;
  purity: number | string;
  isSaved: boolean;
  dateTime?: string;
}) => {
  const grossVal = Number(data.grosswt ?? data.grossWt ?? data.fine ?? 0);
  const payload = {
    ...data,
    grosswt: grossVal,
    grossWt: grossVal,
    fine: Number(data.fine),
    purity: Number(data.purity || 0),
    tar: Number(data.tar || 0),
    scrap: Number(data.scrap || 0),
    loss: Number(data.loss || 0),
  };
  const response = await api.post('/admin/tar', payload);
  return response.data;
};

const saveTarApi = async ({id, data}: {id: string; data: Partial<Tar>}) => {
  const grossVal = Number(
    (data as any).grosswt ?? (data as any).grossWt ?? data.fine ?? 0,
  );
  // Include all required fields in the payload
  const payload = {
    id: id,
    itemId: data.itemId || '',
    sizeId: data.sizeId || '',
    grosswt: grossVal,
    grossWt: grossVal,
    fine: data.fine !== undefined ? Number(data.fine) : 0,
    item: data.item || '',
    size: data.size || '',
    tar: data.tar !== undefined ? Number(data.tar) : 0,
    scrap: data.scrap !== undefined ? Number(data.scrap) : 0,
    loss: data.loss !== undefined ? Number(data.loss) : 0,
    purity: Number(data.purity || 0),
    isSaved: data.isSaved || false,
  };

  const response = await api.put(`/admin/tar/${id}`, payload);
  return response.data;
};

const getTarByIdApi = async (id: string) => {
  try {
    const response = await api.get(`/admin/tar/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || `Failed to fetch tar with ID: ${id}`);
    }
    throw error;
  }
};

// Export individual functions
export {getTarApi, getTarByIdApi, createTarApi, saveTarApi};

// React Query Hooks
export const useTar = () => {
  return useQuery({
    queryKey: ['tar'],
    queryFn: getTarApi,
  });
};

export const useTarById = (id: string) => {
  return useQuery({
    queryKey: ['tar', id],
    queryFn: () => getTarByIdApi(id),
    enabled: !!id,
  });
};

export const useCreateTar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTarApi,
    onSuccess: () => {
      toast.success('Tar entry created successfully');
      queryClient.invalidateQueries({queryKey: ['tar']});
    },
  });
};

export const useSaveTar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTarApi,
    onSuccess: () => {
      toast.success('Tar entry saved successfully');
      queryClient.invalidateQueries({queryKey: ['tar']});
    },
  });
};

export const useGetTarHistory = () => {
  return useQuery({
    queryKey: ['tarHistory'],
    queryFn: getTarHistory,
  });
};

const getTarHistory = async () => {

  try {
    const response = await api.get('/admin/tar/history');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch items');
    }
    throw error;
  }
};

export const useAddMelting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: string; data: any}) => {
      const response = await api.post(`/admin/tar/melting/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Melting completed successfully');
      queryClient.invalidateQueries({queryKey: ['tar']});
      queryClient.invalidateQueries({queryKey: ['melting']});
    },
    onError: (error: any) => {
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to complete melting';
      toast.error(errorMessage);
    },
  });
};

export const revertTarApi = async (id: string) => {

  const response = await api.put(`/admin/tar/revert/${id}`);
  return response.data;
};

export const revertTarCardApi = async (id: string) => {

  try {
    const response = await api.put(`/admin/tar/history/revert/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const fallback = await api.put(`/admin/tar/revert/${id}`);
      return fallback.data;
    }
    throw error;
  }
};

export const useRevertTar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertTarApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Tar entry reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['tar']});
      queryClient.invalidateQueries({queryKey: ['tarHistory']});
      queryClient.invalidateQueries({queryKey: ['tarweight']});
      queryClient.invalidateQueries({queryKey: ['box']});
      queryClient.invalidateQueries({queryKey: ['goldstock']});
      queryClient.invalidateQueries({queryKey: ['stock']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert tar entry';
      toast.error(msg);
    },
  });
};

export const useRevertTarCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertTarCardApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Tar entry reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['tar']});
      queryClient.invalidateQueries({queryKey: ['tarHistory']});
      queryClient.invalidateQueries({queryKey: ['tarweight']});
      queryClient.invalidateQueries({queryKey: ['box']});
      queryClient.invalidateQueries({queryKey: ['goldstock']});
      queryClient.invalidateQueries({queryKey: ['stock']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert tar entry';
      toast.error(msg);
    },
  });
};
