import {api} from '@/utils/axios';

/**
 * Shared manufacturing-flow API (all process stages).
 * Stages are moved off browser storage one at a time; this file grows as they move.
 */
const MFG = '/admin/manufacturing';

export const isServerId = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export interface DispatchRowPayload {
  weight?: number;
  karigarId?: string;
  karigarName?: string;
  rate?: number;
  stamp?: string;
  particular?: string;
  details?: Record<string, unknown>;
}

export interface DispatchPayload {
  cardId: string;
  toProcess: string;
  weight: number;
  karigarId?: string;
  karigarName?: string;
  rate?: number;
  stamp?: string;
  particular?: string;
  details?: Record<string, unknown>;
  rows?: DispatchRowPayload[];
}

/** Send weight from a stage's stock card into the next stage's table */
export const dispatchFromCardApi = async (data: DispatchPayload) => {
  try {
    // The api client already unwraps the HTTP body
    const response: any = await api.post(`${MFG}/dispatch`, data);
    return response?.data ?? response;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send to next process',
    );
  }
};

export interface FinishedToStockPayload {
  designName: string;
  size?: string;
  stamp?: string;
  purity: number;
  weight: number;
  sourceProcess?: string;
  processTrack?: string[];
  /** LOOSE = unpacked goods (Loose Stock tab); PRODUCT = packed, gets its own product ID */
  kind?: 'LOOSE' | 'PRODUCT';
}

export interface LooseToPackagingResult {
  stockId: string;
  remaining: number;
  weight: number;
  design: string;
  stamp: string | null;
  size: string | null;
  purity: number;
  processTrack: string[];
}

/** Give part of a Loose Stock row to Packaging (the rest stays in Loose Stock) */
export const looseToPackagingApi = async (data: {stockId: string; weight: number}) => {
  try {
    const response: any = await api.post(`${MFG}/loose-to-packaging`, data);
    return (response?.data ?? response) as LooseToPackagingResult;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send to Packaging',
    );
  }
};

export interface PackLooseResult {
  productId: string;
  productCode: string;
  remaining: number;
  weight: number;
  design: string;
}

/** Pack part of a Loose Stock row: creates a Product with its own ID, the rest stays loose */
export const packLooseApi = async (data: {stockId: string; weight: number}) => {
  try {
    const response: any = await api.post(`${MFG}/pack-loose`, data);
    return (response?.data ?? response) as PackLooseResult;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to pack',
    );
  }
};

/** Finished goods into Stock (Inward). The design name becomes the Stock item. */
export const finishedToStockApi = async (data: FinishedToStockPayload) => {
  try {
    const response: any = await api.post(`${MFG}/finished-to-stock`, data);
    return response?.data ?? response;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add to Stock',
    );
  }
};

/**
 * Stages whose tables live on the server. Dispatching INTO one of these skips the
 * old browser-storage tables. Add each stage here as it is moved to the server.
 */
export const SERVER_STAGES = new Set<string>(['Galai']);
