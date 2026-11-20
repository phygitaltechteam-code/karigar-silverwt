// lib/api/joint.ts
import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Joint {
  id: string;
  itemId: string;
  sizeId: string;
  chainGiven: number;
  chainReceived: number;
  powder: number;
  powderReceived: number;
  srp: number;
  purity?: string;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}


// API Functions
export const getJointApi = async () => {
  try {
    const response = await api.get('/admin/joint');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch joint entries');
    }
    throw error;
  }
};
export const getJointHistoryApi = async () => {
  try {
    const response = await api.get('/admin/joint/history');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch joint entries');
    }
    throw error;
  }
};

export const submitJointApi = async ({id, data}: {id: string; data: any}) => {
  try {
    const payload = {
      ...data,
      ...(data?.purity !== undefined && {purity: Number(data.purity || 0)}),
    };
    const response = await api.put(`/admin/joint/${id}`, payload);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit joint');
    }
    throw error;
  }
};

// React Query Hooks
export const useGetJoint = () => {
  return useQuery({
    queryKey: ['joint'],
    queryFn: getJointApi,
  });
};
export const useGetJointHistory = () => {
  return useQuery({
    queryKey: ['jointhistory'],
    queryFn: getJointHistoryApi,
  });
};

export const useSubmitJoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitJointApi,
    onSuccess: () => {
      toast.success('Joint submitted successfully');
      queryClient.invalidateQueries({queryKey: ['joint']});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit joint');
    },
  });
};

export const revertJointApi = async (id: string) => {
  const response = await api.put(`/admin/joint/revert/${id}`);
  return response.data;
};

export const useRevertJoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertJointApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Joint reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['joint']});
      queryClient.invalidateQueries({queryKey: ['soldering']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert joint';
      toast.error(msg);
    },
  });
};
