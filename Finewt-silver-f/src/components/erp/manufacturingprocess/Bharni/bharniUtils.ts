import { BharniStockCard } from './BharniModal';

export interface BharniRow {
  id: string;
  batchId?: string;
  srNo: number;
  dateTime: string;
  createdAt?: string;
  purity: number;
  stamp: string;
  totalBatchWeight?: number;
  netWeightGiven: number;
  description: string;
  descriptionRaw?: string;
  design?: string;
  partNo?: string | number;
  karigar?: string;
  netWeightReceived: number;
  netWeightReceivedRaw?: string;
  scrap: number;
  scrapRaw?: string;
  loss: number;
  ratePerKg?: number;
  rateRs?: number;
  isCompleted?: boolean;
  status?: 'pending' | 'soldering' | 'reverted';
}

export interface BharniRowGroup {
  groupKey: string;
  date: string;
  time: string;
  purity: number;
  stamp: string;
  totalBatchWeight: number;
  description: string;
  design: string;
  rows: { entry: BharniRow; originalIndex: number }[];
}

export const formatNumberDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(num);
};

export const DEFAULT_STOCK_CARDS: BharniStockCard[] = [];

export const DEFAULT_DEMO_BHARNI_DATA: BharniRow[] = [];

export const COLUMNS = [
  { label: 'Sr No.', width: '3%' },
  { label: 'Date & Time', width: '7%' },
  { label: 'Purity % (टंच)', width: '5%' },
  { label: 'Stamp (शिक्का)', width: '7%' },
  { label: 'Total Net Wt (G)', width: '6%' },
  { label: 'Description (तपशील)', width: '11%' },
  { label: 'Design (डिझाइन)', width: '7%' },
  { label: 'Part No', width: '5%' },
  { label: 'Karigar (कारीगर)', width: '7%' },
  { label: 'Given Net Wt (G)', width: '6%' },
  { label: 'Net Wt Received (G)', width: '9%' },
  { label: 'Scrap (G)', width: '8%' },
  { label: 'Loss (G)', width: '5%' },
  { label: 'Rate (Rs)', width: '5%' },
  { label: 'Action', width: '9%' },
];

export const formatDate = (iso?: string | null) => {
  if (!iso) return { date: '-', time: '' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    const clean = iso.replace(/,/g, '');
    const parts = clean ? clean.split(' ') : ['', ''];
    return { date: parts[0] || iso, time: parts.slice(1).join(' ') || '' };
  }
  return {
    date: d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

/** Key that groups Bharni rows into one batch (shared by the table and its edit handlers) */
export function bharniGroupKey(entry: BharniRow): string {
  const cleanDT = (entry.dateTime || '').replace(/\s+/g, '').replace(/,/g, '');
  return entry.batchId || `${cleanDT}_${entry.purity}_${entry.stamp}`;
}

export function groupBharniEntries(data: BharniRow[]): BharniRowGroup[] {
  const groups: BharniRowGroup[] = [];
  const groupMap = new Map<string, BharniRowGroup>();

  data.forEach((entry, originalIndex) => {
    const groupKey = bharniGroupKey(entry);
    const { date, time } = formatDate(entry.createdAt || entry.dateTime);

    if (!groupMap.has(groupKey)) {
      const newGroup: BharniRowGroup = {
        groupKey,
        date,
        time,
        purity: entry.purity,
        stamp: entry.stamp,
        totalBatchWeight: entry.totalBatchWeight || entry.netWeightGiven,
        description: entry.description,
        design: entry.design || '',
        rows: [],
      };
      groupMap.set(groupKey, newGroup);
      groups.push(newGroup);
    }

    groupMap.get(groupKey)!.rows.push({ entry, originalIndex });
  });

  return groups;
}
