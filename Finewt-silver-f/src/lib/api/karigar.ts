import { api, unAuthenticatedApi } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createSchema,
  updateSchema,
  CreateKarigarInput,
  UpdateKarigarInput,
} from '@/schemas/karigar.schema';
import {
  loadUnifiedKarigars,
  saveUnifiedKarigars,
  UnifiedKarigarEntry,
  createSampleStages,
  createSampleLedger,
  saveKarigarCommonRate,
  loadKarigarCommonRate,
  KarigarProcessType,
} from '@/components/MasterPages/unifiedKarigarHelpers';

export interface Karigar {
  id: string;
  name: string;
  process?: string;
  processType?: string;
  phone?: string | null;
  number?: string | null;
  address?: string | null;
  openingBalance?: number | null;
  adminId?: string;
  createdAt?: string;
  updatedAt?: string;
  rate?: string;
  jobStages?: any[];
  ledger?: any[];
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

// Normalize backend karigar item to frontend format
const toTitleCase = (val: string) =>
  val ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() : val;

export const normalizeKarigar = (k: any): UnifiedKarigarEntry => {
  const processVal = toTitleCase(String(k.process || k.processType || 'Melting'));
  const phoneVal = k.phone || k.number || '';
  return {
    id: String(k.id || k._id || `k-${Date.now()}`),
    name: k.name || '',
    number: phoneVal,
    address: k.address || '',
    processType: processVal as any,
    openingBalance:
      typeof k.openingBalance === 'number' ? k.openingBalance : parseFloat(k.openingBalance) || 0,
    rate: k.rate || '',
    jobStages: k.jobStages && k.jobStages.length > 0 ? k.jobStages : createSampleStages(`${processVal} Process`),
    ledger: k.ledger && k.ledger.length > 0 ? k.ledger : createSampleLedger(`${processVal} Process`),
  };
};

/* -------------------------------------------------------------------------- */
/*                                API FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

export const getKarigarsApi = async (): Promise<UnifiedKarigarEntry[]> => {
  try {
    const response = await api.get('/admin/karigar');
    const data = response.data;
    let list: any[] = [];
    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.data)) list = data.data;
    else if (data && Array.isArray(data.karigars)) list = data.karigars;
    else if (data && Array.isArray(data.items)) list = data.items;

    const normalized = list.map(normalizeKarigar);
    saveUnifiedKarigars(normalized);
    return normalized;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error, 'Failed to load karigars'));
  }
};

export const getKarigarByIdApi = async (id: string): Promise<UnifiedKarigarEntry | null> => {
  if (!id) return null;
  try {
    const response = await api.get(`/admin/karigar/${id}`);
    const data = response.data?.data || response.data;
    return data ? normalizeKarigar(data) : null;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error, 'Failed to load karigar'));
  }
};

export const createKarigarApi = async (data: CreateKarigarInput) => {
  // Validate against user schema
  const parsed = createSchema.parse(data);

  try {
    const response = await api.post('/admin/karigar', parsed);
    const backendData = response.data?.data || response.data;
    const entry = normalizeKarigar(backendData || parsed);

    // Sync to local storage
    const current = loadUnifiedKarigars();
    saveUnifiedKarigars([entry, ...current.filter((k) => k.id !== entry.id)]);

    return entry;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error, 'Failed to create karigar'));
  }
};

export const updateKarigarApi = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateKarigarInput;
}) => {
  const parsed = updateSchema.parse(data);

  try {
    const response = await api.put(`/admin/karigar/${id}`, parsed);
    const backendData = response.data?.data || response.data;
    const current = loadUnifiedKarigars();
    const updatedList = current.map((k) => {
      if (k.id === id) {
        return {
          ...k,
          ...(parsed.name ? { name: parsed.name } : {}),
          ...(parsed.phone !== undefined ? { number: parsed.phone || '' } : {}),
          ...(parsed.address !== undefined ? { address: parsed.address || '' } : {}),
          ...(parsed.process ? { processType: parsed.process as any } : {}),
          ...(parsed.openingBalance !== undefined ? { openingBalance: parsed.openingBalance || 0 } : {}),
          ...(backendData ? normalizeKarigar(backendData) : {}),
        };
      }
      return k;
    });
    saveUnifiedKarigars(updatedList);
    return backendData;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error, 'Failed to update karigar'));
  }
};

export const deleteKarigarApi = async (id: string) => {
  try {
    const response = await api.delete(`/admin/karigar/${id}`);
    const current = loadUnifiedKarigars();
    saveUnifiedKarigars(current.filter((k) => k.id !== id));
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error, 'Failed to delete karigar'));
  }
};

/* -------------------------------------------------------------------------- */
/*                      KARIGAR LOGIN / AUTHENTICATION                        */
/* -------------------------------------------------------------------------- */

export interface KarigarLoginParams {
  phone: string;
  name?: string;
}

export const karigarLoginApi = async ({ phone }: KarigarLoginParams) => {
  const cleanPhone = phone.trim().replace(/\D/g, '').slice(0, 10);
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  let matchedKarigar: UnifiedKarigarEntry | undefined;

  // 1. Try to find karigar in backend
  try {
    const response = await unAuthenticatedApi.post('/users/karigar-login', {
      phone: cleanPhone,
    });
    if (response.data?.karigar) {
      matchedKarigar = normalizeKarigar(response.data.karigar);
    }
  } catch {
    // If specific login endpoint doesn't exist, search local or list
  }

  if (!matchedKarigar) {
    const localList = loadUnifiedKarigars();
    matchedKarigar = localList.find((k) => {
      const p = (k.number || '').replace(/\D/g, '');
      return p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p);
    });
  }

  // If karigar not found by exact number, we can either use existing or auto-register a session
  if (!matchedKarigar) {
    // Check if any karigar exists or create temporary profile
    const localList = loadUnifiedKarigars();
    matchedKarigar = {
      id: `k-login-${cleanPhone}`,
      name: `Karigar (${cleanPhone})`,
      number: cleanPhone,
      address: '',
      processType: 'Soldering',
      openingBalance: 0,
      jobStages: createSampleStages('Soldering Process'),
      ledger: createSampleLedger('Soldering Process'),
    };
    saveUnifiedKarigars([matchedKarigar, ...localList]);
  }

  // Build user session for Karigar
  const karigarUser = {
    id: matchedKarigar.id,
    username: cleanPhone,
    fullname: matchedKarigar.name,
    role: 'KARIGAR',
    karigarId: matchedKarigar.id,
    phoneNumber: cleanPhone,
    processType: matchedKarigar.processType,
    accessType: 'KARIGAR',
  };

  const karigarToken = {
    accessToken: `karigar-token-${matchedKarigar.id}`,
    refreshToken: `karigar-refresh-${matchedKarigar.id}`,
  };

  localStorage.setItem('token', JSON.stringify(karigarToken));
  localStorage.setItem('user', JSON.stringify(karigarUser));
  localStorage.setItem('admin_access_type', 'KARIGAR');
  localStorage.setItem('active_karigar_id', matchedKarigar.id);

  return { user: karigarUser, token: karigarToken, karigar: matchedKarigar };
};

/* -------------------------------------------------------------------------- */
/*                             REACT QUERY HOOKS                              */
/* -------------------------------------------------------------------------- */

export const useGetKarigars = () => {
  return useQuery({
    queryKey: ['karigars'],
    queryFn: getKarigarsApi,
    staleTime: 1000 * 60 * 5,
  });
};

export const useGetKarigarById = (id?: string) => {
  return useQuery({
    queryKey: ['karigar', id],
    queryFn: () => getKarigarByIdApi(id!),
    enabled: !!id,
  });
};

export const useCreateKarigar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKarigarApi,
    onSuccess: (data) => {
      toast.success(`Karigar "${data.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ['karigars'] });
    },
    onError: (error: any) => {
      const msg = extractErrorMessage(error, 'Failed to create karigar');
      toast.error(msg);
    },
  });
};

export const useUpdateKarigar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateKarigarApi,
    onSuccess: () => {
      toast.success('Karigar updated successfully');
      queryClient.invalidateQueries({ queryKey: ['karigars'] });
      queryClient.invalidateQueries({ queryKey: ['karigar'] });
    },
    onError: (error: any) => {
      const msg = extractErrorMessage(error, 'Failed to update karigar');
      toast.error(msg);
    },
  });
};

export const useDeleteKarigar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKarigarApi,
    onSuccess: () => {
      toast.success('Karigar deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['karigars'] });
    },
    onError: (error: any) => {
      const msg = extractErrorMessage(error, 'Failed to delete karigar');
      toast.error(msg);
    },
  });
};

export const useKarigarLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: karigarLoginApi,
    onSuccess: (result) => {
      toast.success(`Welcome back, ${result.karigar.name}!`);
      queryClient.invalidateQueries({ queryKey: ['getCurrentUser'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Karigar login failed');
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         PROCESS RATE APIs (/admin/rates)                   */
/* -------------------------------------------------------------------------- */

export interface ProcessRatePayload {
  process: string;
  rate: number | string;
}

export const getProcessRateApi = async (process: string): Promise<string> => {
  if (!process) return '';
  const procKey = process.toLowerCase();
  try {
    const response = await api.get(`/admin/rates/${procKey}`);
    const resData = response.data;
    let rateVal = '';
    if (resData !== undefined && resData !== null) {
      if (typeof resData === 'number' || typeof resData === 'string') {
        rateVal = String(resData);
      } else if (resData.rate !== undefined && resData.rate !== null) {
        rateVal = String(resData.rate);
      } else if (resData.data !== undefined) {
        if (typeof resData.data === 'number' || typeof resData.data === 'string') {
          rateVal = String(resData.data);
        } else if (resData.data?.rate !== undefined && resData.data?.rate !== null) {
          rateVal = String(resData.data.rate);
        }
      }
    }
    if (rateVal) {
      saveKarigarCommonRate(process as KarigarProcessType, rateVal);
      return rateVal;
    }
    return loadKarigarCommonRate(process as KarigarProcessType);
  } catch (error: any) {
    console.warn(`GET /admin/rates/${procKey} failed, using cached rate:`, error?.message);
    return loadKarigarCommonRate(process as KarigarProcessType);
  }
};

export const setProcessRateApi = async ({
  process,
  rate,
}: ProcessRatePayload) => {
  const procKey = process.toLowerCase();
  const numRate = parseFloat(String(rate)) || 0;

  try {
    const response = await api.post(`/admin/rates/${procKey}`, {
      rate: numRate,
      process: procKey,
    });
    saveKarigarCommonRate(process as KarigarProcessType, String(numRate));
    return response.data;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error, 'Failed to save process rate'));
  }
};

export const useGetProcessRate = (process: string) => {
  return useQuery({
    queryKey: ['processRate', process?.toLowerCase()],
    queryFn: () => getProcessRateApi(process),
    enabled: !!process && process !== 'Soldering',
    staleTime: 1000 * 60 * 5,
  });
};

export const useSetProcessRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setProcessRateApi,
    onSuccess: (_, variables) => {
      toast.success(`${variables.process} rate saved: ₹${variables.rate || 0} / Kg`);
      queryClient.invalidateQueries({
        queryKey: ['processRate', variables.process.toLowerCase()],
      });
      queryClient.invalidateQueries({ queryKey: ['karigars'] });
      queryClient.invalidateQueries({ queryKey: ['processRates'] });
    },
    onError: (error: any) => {
      const msg = extractErrorMessage(error, 'Failed to save process rate');
      toast.error(msg);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*               KARIGARS FOR ONE PROCESS (from the Karigar Master)           */
/* -------------------------------------------------------------------------- */

export interface ProcessKarigarOption {
  id: string;
  name: string;
  defaultRate: number;
}

/** "Self" first, then the Karigar Master entries for this process */
export const useProcessKarigars = (
  process: string,
  selfLabel = 'Self',
): ProcessKarigarOption[] => {
  const { data = [] } = useGetKarigars();
  const { data: rates } = useGetAllProcessRates();
  const commonRate = processRateFor(rates, process);
  const key = process.trim().toLowerCase();
  return [
    { id: 'self', name: selfLabel, defaultRate: 0 },
    ...data
      .filter(
        (k) =>
          String(k.processType || '').toLowerCase() === key &&
          !['self', selfLabel.toLowerCase()].includes(k.name.trim().toLowerCase()),
      )
      .map((k) => ({ id: k.id, name: k.name, defaultRate: Number(k.rate) || commonRate })),
  ];
};

/* -------------------------------------------------------------------------- */
/*            COMMON RATE PER PROCESS (set on the Karigar Master page)         */
/* -------------------------------------------------------------------------- */

const RATE_FIELD_BY_PROCESS: Record<string, string> = {
  melting: 'meltingRate',
  company: 'companyRate',
  press: 'pressRate',
  sutt: 'suttRate',
  bharni: 'bharnaiRate',
  cutting: 'cuttingRate',
  wash: 'washRate',
  polishing: 'polishingRate',
  vibrator: 'vibratorRate',
  meena: 'meenaRate',
  tass: 'tassRate',
};

export type ProcessRates = Record<string, number | null>;

export const getAllProcessRatesApi = async (): Promise<ProcessRates> => {
  const response: any = await api.get('/admin/rates');
  return response?.data ?? response ?? {};
};

export const useGetAllProcessRates = () =>
  useQuery({
    queryKey: ['processRates'],
    queryFn: getAllProcessRatesApi,
    staleTime: 1000 * 60,
  });

/** Common ₹/KG rate for a process, 0 if not set */
export const processRateFor = (rates: ProcessRates | undefined, process: string): number => {
  const field = RATE_FIELD_BY_PROCESS[process.trim().toLowerCase()];
  return field && rates ? Number(rates[field]) || 0 : 0;
};

/* -------------------------------------------------------------------------- */
/*                         KARIGAR PAYMENTS (ledger)                           */
/* -------------------------------------------------------------------------- */

export interface KarigarPayment {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  account?: string;
  job?: string;
  stage?: string;
  stageId?: string;
  note?: string;
  createdAt: string;
}

export const getKarigarPaymentsApi = async (id: string): Promise<KarigarPayment[]> => {
  const response: any = await api.get(`/admin/karigar/${id}/payments`);
  const list = response?.data ?? response;
  return Array.isArray(list) ? list : [];
};

export const addKarigarPaymentApi = async ({
  id,
  data,
}: {
  id: string;
  data: Omit<KarigarPayment, 'id' | 'createdAt'>;
}) => {
  try {
    const response: any = await api.post(`/admin/karigar/${id}/payments`, data);
    return response?.data ?? response;
  } catch (error: any) {
    throw new Error(extractErrorMessage(error, 'Failed to record payment'));
  }
};

export const useGetKarigarPayments = (id?: string) =>
  useQuery({
    queryKey: ['karigarPayments', id],
    queryFn: () => getKarigarPaymentsApi(id!),
    enabled: !!id,
  });

export const useAddKarigarPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addKarigarPaymentApi,
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['karigarPayments', vars.id] });
    },
  });
};
