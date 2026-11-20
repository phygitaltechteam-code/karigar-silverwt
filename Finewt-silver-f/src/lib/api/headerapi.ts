// lib/api/headerapi.ts
import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import toast from 'react-hot-toast';

// Zod Schema for Header PDF Design Validation
export const HeaderConfigSchema = z.object({
  leftInvocation: z.string().min(1, 'Left invocation is required'),
  rightInvocation: z.string().min(1, 'Right invocation is required'),
  factoryName: z.string().min(1, 'Factory / Shop Name is required'),
  Description: z.string().min(1, 'Description (तपशील) / Tagline is required'),
  proprietorName: z.string().min(1, 'Proprietor name is required'),
  phoneNumbers: z.string().min(1, 'Phone numbers are required'),
  invocationColor: z.string().optional(),
  factoryNameColor: z.string().optional(),
  DescriptionColor: z.string().optional(),
  proprietorColor: z.string().optional(),
  phoneColor: z.string().optional(),
  factoryFontSize: z.number().or(z.string().transform(Number)).optional(),
  DescriptionFontSize: z.number().or(z.string().transform(Number)).optional(),
  proprietorFontSize: z.number().or(z.string().transform(Number)).optional(),
  phoneFontSize: z.number().or(z.string().transform(Number)).optional(),
});

export type HeaderConfig = z.infer<typeof HeaderConfigSchema>;

// API Call to get Header Config
export const getHeaderApi = async () => {
  try {
    const response = await api.get('/admin/profile/pdf');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch header config');
    }
    throw error;
  }
};

// API Call to save Header Config
export const saveHeaderApi = async (data: HeaderConfig) => {
  try {
    const response = await api.post('/admin/profile', data);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to save header config');
    }
    throw error;
  }
};

// Hook for fetching Header Config
export const useGetHeader = () => {
  return useQuery({
    queryKey: ['header-config'],
    queryFn: getHeaderApi,
  });
};

// Hook for saving Header Config
export const useSaveHeader = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveHeaderApi,
    onSuccess: () => {
      toast.success('Header config saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['header-config'] });
    },
    onError: (error: any) => {
      console.error('Save header error:', error);
      toast.error(error?.message || 'Failed to save header config');
    },
  });
};
