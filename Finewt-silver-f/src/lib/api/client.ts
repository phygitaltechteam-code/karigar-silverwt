import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Client {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  openingBalance: number;
  adminId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const extractErrorMessage = (error: any, defaultMsg: string): string => {
  const backendMsg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.msg ||
    error?.data?.message ||
    error?.message;

  if (Array.isArray(backendMsg)) {
    return backendMsg.join(', ');
  }
  if (typeof backendMsg === 'string' && backendMsg.trim()) {
    return backendMsg;
  }
  return defaultMsg;
};



// API Functions
export const getClientsApi = async (): Promise<Client[]> => {

  try {
    const response = await api.get('/admin/client');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.clients)) return data.clients;
    return [];
  } catch (error: any) {
    const message = extractErrorMessage(error, 'Failed to fetch clients');
    throw new Error(message);
  }
};

export const createClientApi = async (
  data: Omit<Client, 'id' | 'adminId' | 'createdAt' | 'updatedAt'>,
) => {

  try {
    const response = await api.post('/admin/client', data);
    return response.data;
  } catch (error: any) {
    const message = extractErrorMessage(error, 'Failed to create client');
    throw new Error(message);
  }
};

export const updateClientApi = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<Client>;
}) => {

  try {
    const response = await api.put(`/admin/client/${id}`, data);
    return response.data;
  } catch (error: any) {
    const message = extractErrorMessage(
      error,
      `Failed to update client with ID: ${id}`,
    );
    throw new Error(message);
  }
};

export const deleteClientApi = async (id: string) => {

  try {
    const response = await api.delete(`/admin/client/${id}`);
    return response.data;
  } catch (error: any) {
    const message = extractErrorMessage(
      error,
      `Failed to delete client with ID: ${id}`,
    );
    throw new Error(message);
  }
};

// React Query Hooks
export const useGetClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: getClientsApi,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientApi,
    onSuccess: (data: any) => {
      const successMsg =
        data?.message || data?.msg || 'Client created successfully';
      toast.success(successMsg);
      queryClient.invalidateQueries({queryKey: ['clients']});
      queryClient.invalidateQueries({queryKey: ['settlements']});
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error, 'Failed to create client');
      toast.error(message);
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClientApi,
    onSuccess: (data: any) => {
      const successMsg =
        data?.message || data?.msg || 'Client updated successfully';
      toast.success(successMsg);
      queryClient.invalidateQueries({queryKey: ['clients']});
      queryClient.invalidateQueries({queryKey: ['settlements']});
      queryClient.invalidateQueries({queryKey: ['client report']});
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error, 'Failed to update client');
      toast.error(message);
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientApi,
    onSuccess: async (data: any) => {
      const successMsg =
        data?.message || data?.msg || 'Client deleted successfully';
      toast.success(successMsg);
      await queryClient.invalidateQueries({queryKey: ['clients']});
      await queryClient.invalidateQueries({queryKey: ['settlements']});
      await queryClient.invalidateQueries({queryKey: ['client report']});
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error, 'Failed to delete client');
      toast.error(message);
    },
  });
};
