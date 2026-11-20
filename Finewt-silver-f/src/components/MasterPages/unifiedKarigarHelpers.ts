import React from 'react';

/* -------------------------------------------------------------------------- */
/*                              STORAGE KEYS                                  */
/* -------------------------------------------------------------------------- */

export const UNIFIED_KARIGAR_STORAGE_KEY = 'chain_unified_karigars_v2';
export const BHARNI_KARIGAR_STORAGE_KEY = 'chain_bharni_karigars_v1';
export const SOLDERING_KARIGAR_STORAGE_KEY = 'chain_soldering_karigars_v1';
export const POLISHING_KARIGAR_STORAGE_KEY = 'chain_polishing_karigars_v1';
export const VIBRATOR_KARIGAR_STORAGE_KEY = 'chain_vibrator_karigars_v1';
export const MELTING_KARIGAR_STORAGE_KEY = 'chain_melting_karigars_v1';
export const COMPANY_KARIGAR_STORAGE_KEY = 'chain_company_karigars_v1';
export const PRESS_KARIGAR_STORAGE_KEY = 'chain_press_karigars_v1';
export const SUTT_KARIGAR_STORAGE_KEY = 'chain_sutt_karigars_v1';
export const CUTTING_KARIGAR_STORAGE_KEY = 'chain_cutting_karigars_v1';
export const WASH_KARIGAR_STORAGE_KEY = 'chain_wash_karigars_v1';
export const MEENA_KARIGAR_STORAGE_KEY = 'chain_meena_karigars_v1';
export const TASS_KARIGAR_STORAGE_KEY = 'chain_tass_karigars_v1';

/* --------------------------- Common Rate Keys ----------------------------- */
export const BHARNI_KARIGAR_RATE_KEY = 'chain_bharni_karigar_rate_v1';
export const SOLDERING_KARIGAR_RATE_KEY = 'chain_soldering_karigar_rate_v1';
export const POLISHING_KARIGAR_RATE_KEY = 'chain_polishing_karigar_rate_v1';
export const VIBRATOR_KARIGAR_RATE_KEY = 'chain_vibrator_karigar_rate_v1';
export const MELTING_KARIGAR_RATE_KEY = 'chain_melting_karigar_rate_v1';
export const COMPANY_KARIGAR_RATE_KEY = 'chain_company_karigar_rate_v1';
export const PRESS_KARIGAR_RATE_KEY = 'chain_press_karigar_rate_v1';
export const SUTT_KARIGAR_RATE_KEY = 'chain_sutt_karigar_rate_v1';
export const CUTTING_KARIGAR_RATE_KEY = 'chain_cutting_karigar_rate_v1';
export const WASH_KARIGAR_RATE_KEY = 'chain_wash_karigar_rate_v1';
export const MEENA_KARIGAR_RATE_KEY = 'chain_meena_karigar_rate_v1';
export const TASS_KARIGAR_RATE_KEY = 'chain_tass_karigar_rate_v1';

export type KarigarProcessType =
  | 'Melting'
  | 'Company'
  | 'Press'
  | 'Sutt'
  | 'Bharni'
  | 'Cutting'
  | 'Wash'
  | 'Soldering'
  | 'Polishing'
  | 'Vibrator'
  | 'Meena'
  | 'Tass';

export const RATE_STORAGE_MAP: Record<KarigarProcessType, string> = {
  Melting: MELTING_KARIGAR_RATE_KEY,
  Company: COMPANY_KARIGAR_RATE_KEY,
  Press: PRESS_KARIGAR_RATE_KEY,
  Sutt: SUTT_KARIGAR_RATE_KEY,
  Bharni: BHARNI_KARIGAR_RATE_KEY,
  Cutting: CUTTING_KARIGAR_RATE_KEY,
  Wash: WASH_KARIGAR_RATE_KEY,
  Soldering: SOLDERING_KARIGAR_RATE_KEY,
  Polishing: POLISHING_KARIGAR_RATE_KEY,
  Vibrator: VIBRATOR_KARIGAR_RATE_KEY,
  Meena: MEENA_KARIGAR_RATE_KEY,
  Tass: TASS_KARIGAR_RATE_KEY,
};

export const hasRate = (processType: KarigarProcessType): boolean =>
  processType !== 'Soldering';

export function loadKarigarCommonRate(processType: KarigarProcessType): string {
  try {
    const val = localStorage.getItem(RATE_STORAGE_MAP[processType]);
    return val ?? '';
  } catch {
    return '';
  }
}

export function saveKarigarCommonRate(
  processType: KarigarProcessType,
  rate: string,
) {
  try {
    localStorage.setItem(RATE_STORAGE_MAP[processType], rate);
  } catch {}
}

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface JobStage {
  id: string;
  jobId?: string;
  jobNo: string;
  itemName: string;
  design: string;
  stamp: string;
  purity: string;
  rate: number;
  processName: string;
  metal: string;
  giveM: number;
  issueDate: string;
  takenWt: number;
  returnDate: string | null;
  expectedLoss: number;
  loss: number;
  differenceLoss: number;
  labourAmount: number | null;
  labourType?: 'GRAM' | 'AMOUNT';
  payment: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  wastage?: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  job: string;
  stage: string;
  account: string;
  stageId?: string;
}

export interface UnifiedKarigarEntry {
  id: string;
  name: string;
  number: string;
  address: string;
  processType: KarigarProcessType;
  openingBalance?: number;
  rate?: string;
  jobStages?: JobStage[];
  ledger?: LedgerEntry[];
}

/* -------------------------------------------------------------------------- */
/*                              SAMPLE DATA                                   */
/* -------------------------------------------------------------------------- */

// Real job stages/ledger come from actual work; nothing is invented
export const createSampleStages = (_processName: string): JobStage[] => [];

// Real job stages/ledger come from actual work; nothing is invented
export const createSampleLedger = (_processName: string): LedgerEntry[] => [];

export const defaultKarigars: UnifiedKarigarEntry[] = [];

export const mockAccounts = [
  { id: 'acc-1', name: 'Cash' },
  { id: 'acc-2', name: 'Bank' },
  { id: 'acc-3', name: 'UPI' },
];

/* -------------------------------------------------------------------------- */
/*                              LOAD / SAVE                                   */
/* -------------------------------------------------------------------------- */

export function loadUnifiedKarigars(): UnifiedKarigarEntry[] {
  try {
    const saved = localStorage.getItem(UNIFIED_KARIGAR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((k) => !['k-1', 'k-2', 'k-3', 'k-4'].includes(k.id));
      }
    }
  } catch {}
  return [];
}

export function saveUnifiedKarigars(list: UnifiedKarigarEntry[]) {
  try {
    localStorage.setItem(UNIFIED_KARIGAR_STORAGE_KEY, JSON.stringify(list));

    const filterBy = (type: KarigarProcessType) =>
      list.filter((k) => k.processType === type);

    localStorage.setItem(
      BHARNI_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Bharni')),
    );
    localStorage.setItem(
      SOLDERING_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Soldering')),
    );
    localStorage.setItem(
      POLISHING_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Polishing')),
    );
    localStorage.setItem(
      VIBRATOR_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Vibrator')),
    );
    localStorage.setItem(
      MELTING_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Melting')),
    );
    localStorage.setItem(
      COMPANY_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Company')),
    );
    localStorage.setItem(
      PRESS_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Press')),
    );
    localStorage.setItem(
      SUTT_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Sutt')),
    );
    localStorage.setItem(
      CUTTING_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Cutting')),
    );
    localStorage.setItem(
      WASH_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Wash')),
    );
    localStorage.setItem(
      MEENA_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Meena')),
    );
    localStorage.setItem(
      TASS_KARIGAR_STORAGE_KEY,
      JSON.stringify(filterBy('Tass')),
    );
  } catch {}
}

export function loadBharniKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Bharni');
}
export function loadSolderingKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Soldering');
}
export function loadPolishingKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Polishing');
}
export function loadVibratorKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Vibrator');
}
export function loadMeltingKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Melting');
}
export function loadCuttingKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Cutting');
}
export function loadWashKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Wash');
}
export function loadMeenaKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Meena');
}
export function loadTassKarigars() {
  return loadUnifiedKarigars().filter((k) => k.processType === 'Tass');
}
