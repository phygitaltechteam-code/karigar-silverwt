/* -------------------------------------------------------------------------- */
/*                               STORAGE KEYS                                 */
/* -------------------------------------------------------------------------- */

export const BHARNI_DESIGN_STORAGE_KEY = 'chain_bharni_designs_v1';
export const BHARNI_COMMON_RATE_KEY = 'chain_bharni_common_rate_v1';

export const CUTTING_DESIGN_STORAGE_KEY = 'chain_cutting_designs_v1';

export const POLISHING_DESIGN_STORAGE_KEY = 'chain_polishing_designs_v1';
export const POLISHING_COMMON_RATE_KEY = 'chain_polishing_common_rate_v1';

export const SOLDERING_DESIGN_STORAGE_KEY = 'chain_soldering_designs_v1';

export const VIBRATOR_DESIGN_STORAGE_KEY = 'chain_vibrator_designs_v1';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface DesignEntry {
  id: string;
  designName: string;
  ratePerKg?: string;
}

export type BharniDesignEntry = DesignEntry;

export interface CuttingDesignEntry {
  id: string;
  designName: string;
  ratePerKg?: string;
}

export interface PolishingDesignEntry {
  id: string;
  designName: string;
  ratePerKg?: string;
}

export interface SolderingDesignEntry {
  id: string;
  designName: string;
  ratePerDesign?: string;
}

export interface VibratorDesignEntry {
  id: string;
  designName: string;
}

export type ProcessTabType =
  | 'BHARNI'
  | 'CUTTING'
  | 'POLISHING'
  | 'SOLDERING'
  | 'VIBRATOR';

export interface UnifiedDesignItem {
  id: string;
  designName: string;
  processType: 'Bharni' | 'Cutting' | 'Polishing' | 'Soldering' | 'Vibrator';
  ratePerDesign?: string;
  ratePerKg?: string;
}

/* -------------------------------------------------------------------------- */
/*                               DEFAULT DATA                                 */
/* -------------------------------------------------------------------------- */

export const defaultBharniDesigns: BharniDesignEntry[] = [];
export const defaultCuttingDesigns: CuttingDesignEntry[] = [];
export const defaultPolishingDesigns: PolishingDesignEntry[] = [];
export const defaultSolderingDesigns: SolderingDesignEntry[] = [];
export const defaultVibratorDesigns: VibratorDesignEntry[] = [];

const LEGACY_MOCK_IDS = new Set([
  'd1', 'd2', 'd3',
  'cd1', 'cd2', 'cd3',
  'pd1', 'pd2', 'pd3',
  'sd1', 'sd2', 'sd3',
  'vd1', 'vd2',
]);

const filterOutMocks = <T extends { id: string }>(items: T[]): T[] => {
  return items.filter((item) => !LEGACY_MOCK_IDS.has(item.id));
};

/* -------------------------------------------------------------------------- */
/*                               LOAD FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

export function loadBharniCommonRate(): string {
  try {
    const saved = localStorage.getItem(BHARNI_COMMON_RATE_KEY);
    if (saved) return saved;
  } catch {}
  return '';
}

export function loadBharniDesigns(): BharniDesignEntry[] {
  try {
    const saved = localStorage.getItem(BHARNI_DESIGN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return filterOutMocks(parsed);
    }
  } catch {}
  return [];
}

export function loadCuttingDesigns(): CuttingDesignEntry[] {
  try {
    const saved = localStorage.getItem(CUTTING_DESIGN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return filterOutMocks(parsed);
    }
  } catch {}
  return [];
}

export function loadPolishingCommonRate(): string {
  try {
    const saved = localStorage.getItem(POLISHING_COMMON_RATE_KEY);
    if (saved) return saved;
  } catch {}
  return '';
}

export function loadPolishingDesigns(): PolishingDesignEntry[] {
  try {
    const saved = localStorage.getItem(POLISHING_DESIGN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return filterOutMocks(parsed);
    }
  } catch {}
  return [];
}

export function loadSolderingDesigns(): SolderingDesignEntry[] {
  try {
    const saved = localStorage.getItem(SOLDERING_DESIGN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return filterOutMocks(parsed);
    }
  } catch {}
  return [];
}

export function loadVibratorDesigns(): VibratorDesignEntry[] {
  try {
    const saved = localStorage.getItem(VIBRATOR_DESIGN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed))
        return filterOutMocks(
          parsed.map((d: any) => ({
            id: d.id,
            designName: d.designName,
          })),
        );
    }
  } catch {}
  return [];
}
