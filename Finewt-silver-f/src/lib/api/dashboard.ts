import {api} from '@/utils/axios';
import {useQuery} from '@tanstack/react-query';

export const useGetDashboard = () => {
  return useQuery({
    queryKey: ['cutting'],
    queryFn: getDashboardApi,
  });
};
export const getDashboardApi = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch dashboard data');
    }
    throw error;
  }
};
