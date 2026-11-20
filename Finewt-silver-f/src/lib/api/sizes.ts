import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {z} from 'zod';

// Zod Schema for validation
export const SizeSchema = z.object({
  size: z.string().min(1, 'Size is required'),
});

export type SizeFormData = z.infer<typeof SizeSchema>;

export interface Size {
  id: string;
  size: string;
  srNo?: number;
  createdAt?: string;
  updatedAt?: string;
}



// API Functions
const createSizeApi = async (data: SizeFormData) => {

  try {
    const response = await api.post('/admin/size', data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Failed to add size';
    throw new Error(message);
  }
};

const getSizesApi = async () => {

  try {
    const response = await api.get('/admin/size');
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch sizes';
    throw new Error(message);
  }
};

const updateSizeApi = async ({id, data}: {id: string; data: SizeFormData}) => {

  try {
    const response = await api.put(`/admin/size/${id}`, data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      `Failed to update size with ID: ${id}`;
    throw new Error(message);
  }
};

const deleteSizeApi = async (id: string) => {

  try {
    await api.delete(`/admin/size/${id}`);
    return {success: true};
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      `Failed to delete size with ID: ${id}`;
    throw new Error(message);
  }
};

export {createSizeApi, getSizesApi, updateSizeApi, deleteSizeApi};

export const useGetSizes = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: getSizesApi,
  });
};

export const useCreateSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSizeApi,

    onSuccess: () => {
      toast.success('Size added successfully');

      queryClient.invalidateQueries({
        queryKey: ['sizes'],
      });
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add size';
      toast.error(message);
    },
  });
};

export const useUpdateSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSizeApi,

    onSuccess: () => {
      toast.success('Size updated successfully');

      queryClient.invalidateQueries({
        queryKey: ['sizes'],
      });
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update size';
      toast.error(message);
    },
  });
};

export const useDeleteSize = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSizeApi,

    onSuccess: async (_, deletedId) => {
      toast.success('Size deleted successfully');

      // Remove deleted size immediately from React Query cache.
      queryClient.setQueryData<Size[]>(['sizes'], (oldSizes = []) =>
        oldSizes.filter((size) => size.id !== deletedId),
      );

      // Refresh latest data from the database.
      await queryClient.invalidateQueries({
        queryKey: ['sizes'],
      });
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete size';
      toast.error(message);
    },
  });
};
