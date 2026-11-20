import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createSchema,
  CreateDesignInput,
  UpdateDesignInput,
  manufacturingProcess,
} from '@/schemas/design.schema';

export interface BackendDesign {
  id: string;
  name: string;
  process: manufacturingProcess | string;
  rate?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

const DESIGN_CACHE_KEY = 'admin_design_cache_v1';

export const loadCachedDesigns = (): BackendDesign[] => {
  try {
    const raw = localStorage.getItem(DESIGN_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

export const saveCachedDesigns = (designs: BackendDesign[]): void => {
  try {
    localStorage.setItem(DESIGN_CACHE_KEY, JSON.stringify(designs));
  } catch {}
};

/* -------------------------------------------------------------------------- */
/*                                API CALLS                                   */
/* -------------------------------------------------------------------------- */

export const getDesignsApi = async (process?: string): Promise<BackendDesign[]> => {
  try {
    const response = await api.get('/admin/design', {
      params: process ? { process } : undefined,
    });
    const data = response.data;
    let list: any[] = [];
    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.data)) list = data.data;
    else if (data && Array.isArray(data.designs)) list = data.designs;
    else if (data && Array.isArray(data.items)) list = data.items;

    const normalized: BackendDesign[] = list.map((item) => ({
      id: String(item.id || item._id || `d-${Date.now()}`),
      name: item.name || item.designName || '',
      process: String(item.process || item.processType || 'BHARNI').toUpperCase(),
      rate: typeof item.rate === 'number' ? item.rate : item.rate ? parseFloat(item.rate) : undefined,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    saveCachedDesigns(normalized);
    return normalized;
  } catch (err: any) {
    throw new Error(err?.response?.data?.message || err?.message || 'Failed to load designs');
  }
};

export const createDesignApi = async (
  input: CreateDesignInput,
): Promise<BackendDesign> => {
  // Validate input against createSchema with superRefine
  const validated = createSchema.parse({
    name: input.name.trim(),
    process: input.process,
    rate:
      input.process === manufacturingProcess.SOLDERING && input.rate !== undefined
        ? Number(input.rate)
        : undefined,
  });

  try {
    const response = await api.post('/admin/design', validated);
    const result = response.data?.data || response.data?.design || response.data;
    const newEntry: BackendDesign = {
      id: String(result?.id || result?._id || `d-${Date.now()}`),
      name: result?.name || validated.name,
      process: (result?.process || validated.process).toUpperCase(),
      rate: result?.rate !== undefined ? Number(result.rate) : validated.rate,
      createdAt: result?.createdAt || new Date().toISOString(),
    };

    const current = loadCachedDesigns();
    saveCachedDesigns([newEntry, ...current.filter((d) => d.id !== newEntry.id)]);
    return newEntry;
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message || err?.message || 'Failed to create design',
    );
  }
};

export const deleteDesignApi = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admin/design/${id}`);
  } catch (err: any) {
    throw new Error(
      err?.response?.data?.message || err?.message || 'Failed to delete design',
    );
  }
  const current = loadCachedDesigns();
  saveCachedDesigns(current.filter((d) => d.id !== id));
};

/* -------------------------------------------------------------------------- */
/*                               REACT QUERY HOOKS                            */
/* -------------------------------------------------------------------------- */

export const useGetDesigns = (process?: string) => {
  return useQuery({
    queryKey: ['designs', process],
    queryFn: () => getDesignsApi(process),
  });
};

export const useCreateDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDesignApi,
    onSuccess: () => {
      toast.success('Design added successfully');
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to add design';
      toast.error(msg);
    },
  });
};

export const useDeleteDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDesignApi,
    onSuccess: () => {
      toast.success('Design deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to delete design';
      toast.error(msg);
    },
  });
};
