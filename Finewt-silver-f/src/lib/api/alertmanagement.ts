import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {api} from '@/utils/axios';
import toast from 'react-hot-toast';

export interface SubmitAlertParams {
  id?: string;
  grossWt: number;
  purity: number;
  loss: number;
  adjustment: number;
}

export interface SubmitAlertResponse {
  message?: string;
  data?: any;
}

export const ALERT_ENDPOINTS: Record<string, string> = {
  melting: '/admin/profile/melting',
  tar: '/admin/profile/tar',
  box: '/admin/profile/box',
  soldering: '/admin/profile/soldering',
  joint: '/admin/profile/joint',
  cutting: '/admin/profile/cutting',
  skunda: '/admin/profile/kunda',
  galai: '/admin/profile/galai',
  kunda: '/admin/profile/kunda',
};

// Generic process alert get function
export const getProcessAlertApi = async (rawProcess: string) => {
  const process = String(rawProcess || '').toLowerCase();
  try {
    const endpoint = ALERT_ENDPOINTS[process] || `/admin/profile/${process}`;
    const response = await api.get(endpoint);
    return response.data?.data || response.data || [];
  } catch (error) {
    return [];
  }
};

// Generic process alert submit function
export const submitProcessAlertApi = async ({
  process,
  data,
}: {
  process: string;
  data: SubmitAlertParams[] | SubmitAlertParams;
}) => {
  const endpoint = ALERT_ENDPOINTS[process] || `/admin/profile/${process}`;
  const response = await api.post<SubmitAlertResponse>(endpoint, data);
  return response.data;
};

// Generic process alert single delete function
export const deleteProcessAlertApi = async ({
  process,
  id,
}: {
  process: string;
  id: string;
}) => {
  const base = ALERT_ENDPOINTS[process] || `/admin/profile/${process}`;
  const endpoint = `${base}/${id}`;
  const response = await api.delete<SubmitAlertResponse>(endpoint);
  return response.data;
};

// Query hook for getting process alerts
export const useGetProcessAlert = (process: string) => {
  return useQuery({
    queryKey: ['processAlert', String(process || '').toLowerCase()],
    queryFn: () => getProcessAlertApi(process),
    enabled: Boolean(process),
  });
};

// Specific API functions per process (supports array or single object)
export const getMeltingAlert = () => getProcessAlertApi('melting');
export const getTarAlert = () => getProcessAlertApi('tar');
export const getBoxAlert = () => getProcessAlertApi('box');
export const getSolderingAlert = () => getProcessAlertApi('soldering');
export const getJointAlert = () => getProcessAlertApi('joint');
export const getCuttingAlert = () => getProcessAlertApi('cutting');
export const getSKundaAlert = () => getProcessAlertApi('kunda');

export const submitMeltingAlert = (
  data: SubmitAlertParams[] | SubmitAlertParams,
) =>
  api
    .post<SubmitAlertResponse>('/admin/profile/melting', data)
    .then((res) => res.data);

export const submitTarAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
  api
    .post<SubmitAlertResponse>('/admin/profile/tar', data)
    .then((res) => res.data);

export const submitBoxAlert = (data: SubmitAlertParams[] | SubmitAlertParams) =>
  api
    .post<SubmitAlertResponse>('/admin/profile/box', data)
    .then((res) => res.data);

export const submitSolderingAlert = (
  data: SubmitAlertParams[] | SubmitAlertParams,
) =>
  api
    .post<SubmitAlertResponse>('/admin/profile/soldering', data)
    .then((res) => res.data);

export const submitJointAlert = (
  data: SubmitAlertParams[] | SubmitAlertParams,
) =>
  api
    .post<SubmitAlertResponse>('/admin/profile/joint', data)
    .then((res) => res.data);

export const submitCuttingAlert = (
  data: SubmitAlertParams[] | SubmitAlertParams,
) =>
  api
    .post<SubmitAlertResponse>('/admin/profile/cutting', data)
    .then((res) => res.data);

export const submitSKundaAlert = (
  data: SubmitAlertParams[] | SubmitAlertParams,
) =>
  api
    .post<SubmitAlertResponse>('/admin/profile/kunda', data)
    .then((res) => res.data);

// Specific delete functions per process
export const deleteMeltingAlert = (id: string) =>
  api
    .delete<SubmitAlertResponse>(`/admin/profile/melting/${id}`)
    .then((res) => res.data);

export const deleteTarAlert = (id: string) =>
  api
    .delete<SubmitAlertResponse>(`/admin/profile/tar/${id}`)
    .then((res) => res.data);

export const deleteBoxAlert = (id: string) =>
  api
    .delete<SubmitAlertResponse>(`/admin/profile/box/${id}`)
    .then((res) => res.data);

export const deleteSolderingAlert = (id: string) =>
  api
    .delete<SubmitAlertResponse>(`/admin/profile/soldering/${id}`)
    .then((res) => res.data);

export const deleteJointAlert = (id: string) =>
  api
    .delete<SubmitAlertResponse>(`/admin/profile/joint/${id}`)
    .then((res) => res.data);

export const deleteCuttingAlert = (id: string) =>
  api
    .delete<SubmitAlertResponse>(`/admin/profile/cutting/${id}`)
    .then((res) => res.data);

export const deleteSKundaAlert = (id: string) =>
  api
    .delete<SubmitAlertResponse>(`/admin/profile/kunda/${id}`)
    .then((res) => res.data);

// Hook for submitting alert by process
export const useSubmitProcessAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitProcessAlertApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['processAlert', variables.process],
      });
      toast.success('Alert settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save alert settings');
    },
  });
};

// Hook for single delete alert by process
export const useDeleteProcessAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProcessAlertApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['processAlert', variables.process],
      });
      toast.success('Alert rule deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete alert rule');
    },
  });
};

export const useDeleteAlert = () => {
  return useDeleteProcessAlert();
};

export const useSubmitAlert = () => {
  return useSubmitProcessAlert();
};

export interface AlertRule {
  grossWt: number | string;
  purity: number | string;
  loss?: number | string;
  lossWt?: number | string;
  adjustment?: number | string;
  adjsutment?: number | string;
}

export interface ProcessLossAlertResult {
  isExceeded: boolean;
  actualLoss: number;
  baseLoss: number;
  maxAllowedLoss: number;
  adjustmentPercent: number;
  diff: number;
  colorState: 'gray' | 'green' | 'yellow' | 'red';
}

export const checkProcessLossAlert = (
  grossWt: number,
  purity: number,
  actualLoss: number,
  alertRules?: AlertRule[],
  hasEnteredValues: boolean = true,
): ProcessLossAlertResult | null => {
  if (!Array.isArray(alertRules) || alertRules.length === 0 || !grossWt || grossWt <= 0) {
    return null;
  }

  const rules = alertRules
    .map((r: any) => {
      const gWt =
        typeof r.grossWt === 'number'
          ? r.grossWt
          : parseFloat(String(r.grossWt).replace(/[^0-9.]/g, '')) || 100;
      const pur = parseFloat(String(r.purity)) || 0;
      const l =
        parseFloat(
          String(
            r.loss !== undefined && r.loss !== null ? r.loss : (r.lossWt ?? 0),
          ),
        ) || 0;
      const rawAdj =
        r.adjustment !== undefined && r.adjustment !== null
          ? r.adjustment
          : r.adjsutment;
      const adj =
        typeof rawAdj === 'number'
          ? rawAdj
          : parseFloat(String(rawAdj ?? 0).replace(/[^0-9.-]/g, '')) || 0;
      return {grossWt: gWt, purity: pur, loss: l, adjustment: adj};
    })
    .filter((r) => r.grossWt > 0 && r.loss > 0);

  if (rules.length === 0) return null;

  // 1. Find matched rule by purity or closest purity
  let matchedRule = rules.find((r) => Math.abs(r.purity - purity) < 0.1);
  if (!matchedRule) {
    matchedRule = rules.reduce((prev, curr) =>
      Math.abs(curr.purity - purity) < Math.abs(prev.purity - purity)
        ? curr
        : prev,
    );
  }

  // 2. Scale expected base loss according to gross weight (based on 100G standard from matched rule)
  const ruleGrossWt = matchedRule.grossWt > 0 ? matchedRule.grossWt : 100;
  let baseLoss = (matchedRule.loss / ruleGrossWt) * grossWt;
  baseLoss = Math.round(baseLoss * 1000) / 1000;

  // 3. Max allowed loss with tolerance adjustment (+/- %)
  const adjPercent = matchedRule.adjustment || 0;
  const maxAllowedLoss =
    Math.round(baseLoss * (1 + adjPercent / 100) * 1000) / 1000;

  const validLoss = Math.max(0, Math.round(actualLoss * 1000) / 1000);
  const isExceeded = validLoss > maxAllowedLoss && validLoss > 0.001;
  const diff = isExceeded
    ? Math.round((validLoss - maxAllowedLoss) * 1000) / 1000
    : 0;

  let colorState: 'gray' | 'green' | 'yellow' | 'red' = 'gray';
  if (!hasEnteredValues || validLoss === 0) {
    colorState = 'gray';
  } else if (isExceeded) {
    colorState = 'red';
  } else if (validLoss > baseLoss) {
    colorState = 'yellow';
  } else {
    colorState = 'green';
  }

  const result: ProcessLossAlertResult = {
    isExceeded,
    actualLoss: validLoss,
    baseLoss,
    maxAllowedLoss,
    adjustmentPercent: adjPercent,
    diff,
    colorState,
  };

  return result;
};

export const getProcessLossColorClass = (
  alertResult?: ProcessLossAlertResult | null,
): string => {
  if (!alertResult) return 'text-gray-500 dark:text-slate-400';
  if (alertResult.colorState === 'green')
    return 'font-semibold text-green-600 dark:text-green-400';
  if (alertResult.colorState === 'yellow')
    return 'font-semibold text-amber-500 dark:text-amber-400';
  if (alertResult.colorState === 'red')
    return 'font-bold text-red-600 dark:text-red-500';
  return 'text-gray-500 dark:text-slate-400';
};
