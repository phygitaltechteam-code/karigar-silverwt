import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface EPinItem {
  id: string;
  key: string;
  pinCode?: string;
  clientId?: string | null;
  licenseId?: string | null;
  machineId?: string | null;
  extendDays: number;
  isUsed: boolean;
  usedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface GenerateEPinPayload {
  extendDays: number;
  count: number;
}

export interface EPinRequestItem {
  id: string;
  requestId: string;
  adminId?: string;
  adminName: string;
  shopName: string;
  phoneNumber: string;
  packageType: string;
  accessType: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMode: string;
  transactionId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: string;
  generatedPins?: string[];
  rejectionReason?: string;
}

// GET /superAdmin/epin
export const getEPinInventoryApi = async (): Promise<EPinItem[]> => {
  try {
    const response = await api.get('/superAdmin/epin');
    const resData = response.data;

    let items: any[] = [];
    if (Array.isArray(resData)) {
      items = resData;
    } else if (Array.isArray(resData?.data)) {
      items = resData.data;
    }

    return items.map((item: any) => ({
      id: item.id || String(Math.random()),
      key: item.key || item.pinCode || '',
      pinCode: item.key || item.pinCode || '',
      clientId: item.clientId || null,
      licenseId: item.licenseId || null,
      machineId: item.machineId || null,
      extendDays: Number(item.extendDays) || 0,
      isUsed: Boolean(item.isUsed),
      usedAt: item.usedAt || null,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || '',
    }));
  } catch (error: any) {
    if (error?.response?.data?.message) {
      toast.error(error.response.data.message);
    }
    return [];
  }
};

export const useGetEPinInventory = () => {
  return useQuery({
    queryKey: ['epin-inventory'],
    queryFn: getEPinInventoryApi,
  });
};

// POST /superAdmin/epin
export const generateEPinBatchApi = async (payload: GenerateEPinPayload) => {
  const count = Number(payload.count) || 1;
  const extendDays = Number(payload.extendDays) || 30;

  try {
    const res = await api.post('/superAdmin/epin', {
      count,
      extendDays,
    });
    const resData = res.data;

    let generatedCodes: string[] = [];
    let itemsArray: any[] = [];

    if (Array.isArray(resData)) {
      itemsArray = resData;
    } else if (Array.isArray(resData?.data)) {
      itemsArray = resData.data;
    }

    if (itemsArray.length > 0) {
      generatedCodes = itemsArray.map(
        (it: any) => it.key || it.pinCode || String(it),
      );
    }

    return {
      success: true,
      codes: generatedCodes,
      data: itemsArray,
    };
  } catch (error: any) {
    const errMsg =
      error?.response?.data?.errors?.[0]?.message ||
      error?.response?.data?.message ||
      error?.message ||
      'Failed to generate E-PIN';
    throw new Error(errMsg);
  }
};

export const useGenerateEPin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateEPinBatchApi,
    onSuccess: (data) => {
      const count = data.codes?.length || 1;
      toast.success(`Successfully generated ${count} E-PIN(s)!`);
      queryClient.invalidateQueries({queryKey: ['epin-inventory']});
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate E-PIN');
    },
  });
};

// DELETE /superAdmin/epin/:id
export const revokeEPinApi = async (pinId: string) => {
  try {
    const res = await api.delete(`/superAdmin/epin/${pinId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to delete E-PIN',
    );
  }
};

export const useRevokeEPin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeEPinApi,
    onSuccess: () => {
      toast.success('E-PIN deleted successfully');
      queryClient.invalidateQueries({queryKey: ['epin-inventory']});
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete E-PIN');
    },
  });
};
