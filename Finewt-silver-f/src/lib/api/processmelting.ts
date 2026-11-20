import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const getBackendErrorMessage = (
  error: any,
  fallback: string,
): string => {
  return (
    (Array.isArray(error?.response?.data?.message)
      ? error.response.data.message.join(', ')
      : error?.response?.data?.message) ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

export const useAddBoxMelting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: string; data: any}) => {
      const response = await api.post(`/admin/box/melting/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Melting completed successfully');
      queryClient.invalidateQueries({queryKey: ['box']});
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

export const useAddSolderingMelting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: string; data: any}) => {
      const response = await api.post(`/admin/soldering/melting/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Melting completed successfully');
      queryClient.invalidateQueries({queryKey: ['soldering']});
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

export const useAddJointMelting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: string; data: any}) => {
      const response = await api.post(`/admin/joint/melting/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Melting completed successfully');
      queryClient.invalidateQueries({queryKey: ['joint']});
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

export const useAddCuttingMelting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: string; data: any}) => {
      const response = await api.post(`/admin/cutting/melting/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Melting completed successfully');
      queryClient.invalidateQueries({queryKey: ['cutting']});
      queryClient.invalidateQueries({queryKey: ['cuttingScrap']});
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

export const useAddSkundaMelting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, data}: {id: string; data: any}) => {
      const response = await api.post(`/admin/kunda/melting/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Melting completed successfully');
      queryClient.invalidateQueries({queryKey: ['skunda']});
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

export const useGetCuttingScrap = () => {
  return useQuery({
    queryKey: ['cuttingScrap'],
    queryFn: async () => {
      const response = await api.get('/admin/cutting/scrap');
      return response.data;
    },
  });
};

export const useAddCuttingScrap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({data}: {data: any}) => {
      const response = await api.post(`/admin/cutting/scrap`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Scrap added successfully');
      queryClient.invalidateQueries({queryKey: ['cuttingScrap']});
    },
    onError: (error: any) => {
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to add scrap';
      toast.error(errorMessage);
    },
  });
};
