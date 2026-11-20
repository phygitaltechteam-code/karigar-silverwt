import {unAuthenticatedApi} from '@/utils/axios';
import {useMutation} from '@tanstack/react-query';
import {jwtDecode} from 'jwt-decode';
import toast from 'react-hot-toast';
import {AxiosError} from 'axios'; // Don't forget this import

export const LogIn = async (data: {username: string; password: string}) => {
  try {

    const response = await unAuthenticatedApi.post('/users/login', data);

    const responseData = response.data;

    if (responseData.status && responseData.data) {
      const decodedToken: any = jwtDecode(responseData.data.accessToken);
      const accessType =
        responseData.data.accessType ||
        responseData.data.user?.accessType ||
        decodedToken.accessType ||
        decodedToken.user?.accessType ||
        '';
      const userToStore = {
        ...decodedToken,
        ...(responseData.data.user || {}),
        accessType,
      };
      localStorage.setItem('token', JSON.stringify(responseData.data));
      localStorage.setItem('user', JSON.stringify(userToStore));
      if (accessType) {
        localStorage.setItem('admin_access_type', accessType);
      }
      return responseData.data;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
    throw new Error('An unexpected error occurred');
  }
};

export const useLogin = () => {
  return useMutation({
    mutationFn: LogIn,
    onSuccess: () => {
      toast.success('Login successful');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    },
  });
};
