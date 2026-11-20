import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {useAuthContext} from '@/context/AuthContext';

export interface ProfilePayload {
  fullname?: string;
  email?: string;
  phoneNumber?: string;
  secondaryPhoneNumber?: string;
  address?: string;
  city?: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  currentPassword?: string;
  oldPassword?: string;
  newPassword?: string;
  password?: string;
}

// API call to get user profile data
export const getProfileDataApi = async () => {
  try {
    const response = await api.get('admin/profile');
    const resData = response.data?.data || response.data || {};
    const accessType = resData.accessType || resData.user?.accessType;
    if (accessType) {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        u.accessType = accessType;
        localStorage.setItem('user', JSON.stringify(u));
        localStorage.setItem('admin_access_type', accessType);
      } catch (e) {}
    }

    // Persist alert rules to localStorage for reports and calculations
    try {
      const alertMap: Record<string, any[]> = {
        tar: resData.tarAlerts || [],
        melting: resData.meltingAlerts || [],
        box: resData.boxAlerts || [],
        skunda: resData.kundaAlerts || resData.skundaAlerts || [],
        kunda: resData.kundaAlerts || resData.skundaAlerts || [],
        joint: resData.jointAlerts || [],
        cutting: resData.cuttingAlerts || [],
        soldering: resData.solderingAlerts || [],
      };
      if (Object.values(alertMap).some((arr) => arr && arr.length > 0)) {
        localStorage.setItem(
          'chain_alert_management_settings_v2',
          JSON.stringify(alertMap),
        );
      }
    } catch (e) {}

    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch profile data');
    }
    throw error;
  }
};

// Hook for fetching profile data
// Superadmins have no admin profile, so the request is skipped for them
export const useGetProfileData = () => {
  const {user} = useAuthContext();
  const isSuper = user?.role?.toUpperCase() === 'SUPERADMIN';
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: getProfileDataApi,
    enabled: !!user && !isSuper,
  });
};

// API call to update user profile
export const updateProfileApi = async (data: ProfilePayload) => {
  try {
    const response = await api.put('admin/profile', data);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data) {
      const errData = error.response.data;
      if (
        errData.errors &&
        Array.isArray(errData.errors) &&
        errData.errors.length > 0
      ) {
        const errorDetails = errData.errors
          .map((e: any) => `${e.field || 'Field'}: ${e.message}`)
          .join(', ');
        throw new Error(errorDetails || errData.message || 'Validation failed');
      }
      if (errData.message) {
        throw new Error(errData.message);
      }
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to update profile');
    }
    throw error;
  }
};

// Hook for updating profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfileApi,
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({queryKey: ['user-profile']});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
};

// API call to activate / submit key
export const activateKeyApi = async (keyData: {key: string}) => {
  try {
    const response = await api.post('/admin/profile/expiry', keyData);
    return response.data;
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to activate key';
    throw new Error(msg);
  }
};

// Hook for activating / submitting license key
export const useActivateKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateKeyApi,
    onSuccess: (data) => {
      toast.success(data?.message || 'License key activated successfully!');
      queryClient.invalidateQueries({queryKey: ['user-profile']});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate key');
    },
  });
};

export const useAccessForBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accessPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['user-profile']});
    },
  });
};

export const accessPassword = async (data: ProfilePayload) => {
  try {
    const res: any = await api.post('admin/password', data);
    // Axios interceptor returns response.data directly
    if (res?.data !== true) {
      throw new Error(res?.message || 'Password is incorrect');
    }
    return res;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to verify password');
    }
    throw error;
  }
};
