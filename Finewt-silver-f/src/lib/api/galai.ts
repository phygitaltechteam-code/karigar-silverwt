import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

const MFG = '/admin/manufacturing';

export interface GalaiEntry {
  id: string;
  particular?: string;
  grossWt: number;
  purity: number;
  expectedFine?: number;
  fineWeight?: number;
  scrapCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isCompleted?: boolean;
}

export interface GalaiStockCard {
  id: string;
  purity: number;
  stamp?: string;
  Stamp?: string;
  availableWeight: number;
  totalWeight?: number;
}

export interface AvailableStock {
  purity: number;
  weight: number;
}

export interface GalaiReceivePayload {
  items: {purity: number; availableWeight?: number; weight: number}[];
  targetPurity?: number;
  targetWeight?: number;
  bronze?: number;
  meltingPurity?: number;
  meltingWeight?: number;
  scrapWeight?: number;
  loss?: number;
}

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.errors?.[0]?.message ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

// The api client already unwraps the HTTP body, so `response` is {statusCode, data, ...}
const listOf = (response: any) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response)) return response;
  return [];
};

/* ------------------------------- API calls -------------------------------- */

// Main table: only rows still to be saved. Saved rows are shown in History.
export const getGalaiApi = async () => {
  const response = await api.get(`${MFG}/galai/entries`, {params: {status: 'PENDING'}});
  return listOf(response);
};

export const getGalaiHistoryApi = async () => {
  const response = await api.get(`${MFG}/galai/history`);
  return listOf(response);
};

// Galai output cards that can be sent to the next process
export const getGalaiCardsApi = async (): Promise<GalaiStockCard[]> => {
  const response = await api.get(`${MFG}/galai/cards`);
  return listOf(response);
};

// Raw silver in Stock, summed per purity
export const getAvailableStockApi = async (): Promise<AvailableStock[]> => {
  const response = await api.get(`${MFG}/stock/available`);
  return listOf(response);
};

export const getScrapApi = async () => {
  try {
    const response = await api.get('/admin/scrap');
    return response.data?.data || response.data || [];
  } catch (error) {
    return [];
  }
};

// "Stock" action on a Galai row: completes it and creates a Galai stock card
export const submitGalaiStockApi = async ({id, data}: {id?: string; data: any}) => {
  const payload = {
    particular: data?.particular,
    fineWeight: data?.fineWeight,
    loss: data?.loss,
    scrapWeight: data?.scrapWeight,
    ...(data?.purity !== undefined && {purity: Number(data.purity || 0)}),
  };
  if (data?.isCompleted) {
    const response = await api.post(`${MFG}/galai/entries/${id}/complete`, {
      ...payload,
      card: {weight: data?.fineWeight, stamp: data?.stamp},
    });
    return response.data;
  }
  const response = await api.put(`${MFG}/galai/entries/${id}`, payload);
  return response.data;
};

// "Add Galai": takes silver from Stock and creates a pending Galai row
export const galaiReceiveApi = async (data: GalaiReceivePayload) => {
  const response = await api.post(`${MFG}/galai/receive`, data);
  return response.data;
};

// Revert a pending Galai row: the silver goes back to Stock
export const revertGalaiApi = async (id: string) => {
  const response = await api.delete(`${MFG}/galai/entries/${id}`);
  return response.data;
};

/* --------------------------------- Hooks ---------------------------------- */

const invalidateGalai = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({queryKey: ['Galai']});
  queryClient.invalidateQueries({queryKey: ['GalaiHistory']});
  queryClient.invalidateQueries({queryKey: ['GalaiCards']});
  queryClient.invalidateQueries({queryKey: ['availableStock']});
  queryClient.invalidateQueries({queryKey: ['stock']});
};

export const useGetGalai = () =>
  useQuery({queryKey: ['Galai'], queryFn: getGalaiApi});

export const useGetGalaiHistory = () =>
  useQuery({queryKey: ['GalaiHistory'], queryFn: getGalaiHistoryApi});

export const useGetGalaiCards = () =>
  useQuery({queryKey: ['GalaiCards'], queryFn: getGalaiCardsApi});

export const useGetAvailableStock = (enabled = true) =>
  useQuery({queryKey: ['availableStock'], queryFn: getAvailableStockApi, enabled});

export const useGetScrap = () =>
  useQuery({queryKey: ['scrap'], queryFn: getScrapApi});

export const useSubmitGalaiStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitGalaiStockApi,
    onSuccess: () => invalidateGalai(queryClient),
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Failed to submit Galai stock'));
    },
  });
};

export const useGalaiReceive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: galaiReceiveApi,
    onSuccess: () => invalidateGalai(queryClient),
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Failed to save Galai entry'));
    },
  });
};

export const useRevertGalai = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertGalaiApi,
    onSuccess: () => invalidateGalai(queryClient),
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Failed to revert Galai entry'));
    },
  });
};

export const submitGalaiScrapStockApi = async (data: any) => {
  const response = await api.post('/admin/Galai/scrap', data);
  return response.data;
};

export const useSubmitGalaiScrapStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitGalaiScrapStockApi,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['Galai']});
      queryClient.invalidateQueries({queryKey: ['scrap']});
      queryClient.invalidateQueries({queryKey: ['stock']});
    },
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Failed to submit Galai scrap'));
    },
  });
};
