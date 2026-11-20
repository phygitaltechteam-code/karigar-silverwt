import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface SettlementData {
  clientId: string;
  amount: number;
  type: 'receive' | 'give';
  notes?: string;
  date?: string;
  pendingBalance?: number;
  totalGiven?: number;
  totalReceived?: number;
}



// GET all settlements - without /all
export const getSettlements = async () => {

  try {
    const response = await api.get('/admin/settlement');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch settlements');
    }
    throw error;
  }
};

// POST - Submit settlement
export const submitSettlement = async (data: SettlementData) => {
  try {
    const response = await api.post(`/admin/client/pay/${data.clientId}`, data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit settlement');
    }
    throw error;
  }
};

// React Query hooks
export const useGetSettlements = () => {
  return useQuery({
    queryKey: ['settlements'],
    queryFn: getSettlements,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const useSubmitSettlement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSettlement,
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Settlement submitted successfully');
      queryClient.invalidateQueries({queryKey: ['settlements']});
      queryClient.invalidateQueries({queryKey: ['clients']});
      queryClient.invalidateQueries({queryKey: ['client report']});
      queryClient.invalidateQueries({queryKey: ['day report']});
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to submit settlement',
      );
    },
  });
};
