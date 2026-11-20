import {api} from '@/utils/axios';
import {useMutation} from '@tanstack/react-query';

export const getBackFile = async (): Promise<Blob> => {
  try {
    const response = await api.get('/backup', {
      responseType: 'blob',
    });

    if (!response) {
      throw new Error('Backup API returned empty data');
    }

    if (!(response instanceof Blob)) {
      console.error('Expected Blob but received:', response);

      throw new Error('Backup API did not return a valid SQL file');
    }

    if (response.size === 0) {
      throw new Error('Backup file is empty');
    }
    return response;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch database backup');
  }
};

const getRestoreFile = async (formData: FormData) => {
  try {
    const response = await api.post('/backup/restore', formData);

    return response;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to restore database backup');
  }
};

export const deleteDatabase = async (password?: string) => {
  try {
    const response = await api.delete('/admin/backup/delete', {
      data: password ? {password} : {},
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to delete database',
    );
  }
};

export const useRestore = (queryClient: any) => {
  return useMutation({
    mutationFn: getRestoreFile,

    onSuccess: () => {
      queryClient.invalidateQueries();
    },

    onError: (error) => {
      console.error('Restore mutation error:', error);
    },
  });
};

export const useDeleteDatabase = (queryClient?: any) => {
  return useMutation({
    mutationFn: (password?: string) => deleteDatabase(password),
    onSuccess: () => {
      if (queryClient) {
        queryClient.invalidateQueries();
      }
    },
    onError: (error: any) => {
      console.error('Delete database mutation error:', error);
    },
  });
};

export const sendBackupEmail = async () => {
  try {
    const response = await api.get('/backup');
    return response;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to trigger backup',
    );
  }
};

export const useSendBackupEmail = () => {
  return useMutation({
    mutationFn: sendBackupEmail,
  });
};
