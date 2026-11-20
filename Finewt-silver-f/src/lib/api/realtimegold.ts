import {api} from '@/utils/axios';
import {useQuery} from '@tanstack/react-query';

export const getRealTimeGoldApi = async (
  fromDate?: string | null,
  toDate?: string | null,
) => {
  try {
    const params: Record<string, string> = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await api.get('/admin/stock/current', {params});
    return response.data;
  } catch (error) {
    return null;
  }
};

export const useGetRealTimeGold = (
  fromDate?: string | null,
  toDate?: string | null,
) => {
  return useQuery({
    queryKey: ['realtimegold', fromDate, toDate],
    queryFn: () => getRealTimeGoldApi(fromDate, toDate),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};
