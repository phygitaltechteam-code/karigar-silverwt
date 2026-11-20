export interface PolishingRow {
  id: string;
  srNo: number;
  dateTime: string;
  createdAt?: string;
  purity: number;
  stamp: string;
  design?: string;
  netWeightGiven: number;
  description?: string;
  descriptionRaw?: string;
  size?: string;
  sizeRaw?: string;
  qtyGiven?: number;
  qtyGivenRaw?: string;
  qtyReceived?: number;
  qtyReceivedRaw?: string;
  netWeightReceived?: number;
  netWeightReceivedRaw?: string;
  scrap?: number;
  scrapRaw?: string;
  loss?: number;
  lossRaw?: string;
  karigar?: string;
  rate?: string | number;
  rateRaw?: string;
  status?: 'pending' | 'stock' | 'completed';
}

export interface PolishingStockCard {
  processTrack?: string[];
  id: string;
  purity: number;
  stamp: string;
  design?: string;
  description?: string;
  qty?: string | number;
  availableWeight: number;
  totalWeight: number;
  count: number;
  sourceProcess?: string;
}

export const toNumber = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const formatNumberDisplay = (v: unknown): string =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(toNumber(v));

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
