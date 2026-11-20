import React from 'react';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';

// ======================================================
// INTERFACES
// ======================================================
export interface GoldItem {
  id?: string | number;
  name: string;
  grossweight?: number;
  grossWeight: number;
  purity: number | null;
  fineweight?: number;
  fineWeight: number;
  category?: string;
  type?: 'stock' | 'process';
}

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'Stock' | 'Process';
  items: GoldItem[];
  totalGrossWeight: number;
  totalFineWeight: number;
  count: number;
}

export interface SummaryData {
  totalStockWeight: number;
  totalStockFineWeight: number;
  totalProcessWeight: number;
  totalProcessFineWeight: number;
  totalScrapWeight?: number;
  totalScrapFineWeight?: number;
  totalCuttingScrapWeight?: number;
  totalCuttingScrapFineWeight?: number;
  grandTotalWeight: number;
  grandTotalFineWeight: number;
  stockItemsCount: number;
  processItemsCount: number;
  scrapItemsCount?: number;
  cuttingScrapItemsCount?: number;
  totalItemsCount: number;
  byProcess?: Record<
    string,
    {totalWeight: number; totalFineWeight: number; count: number}
  >;
}

export interface ApiStockData {
  stock?: GoldItem[];
  tarStock?: GoldItem[];
  boxStock?: GoldItem[];
  scrap?: GoldItem[];
  cuttingScrap?: GoldItem[];
}

export interface ApiProcessData {
  tar?: GoldItem[];
  box?: GoldItem[];
  soldering?: GoldItem[];
  joint?: GoldItem[];
  cutting?: GoldItem[];
  kunda?: GoldItem[];
  melting?: GoldItem[];
  all?: GoldItem[];
}

export interface ApiResponse {
  statusCode?: number;
  status?: boolean;
  message?: string;
  data?: {
    summary?: SummaryData;
    stock?: GoldItem[];
    stocks?: ApiStockData;
    process?: ApiProcessData | GoldItem[];
    processes?: ApiProcessData;
    all?: GoldItem[];
  };
  summary?: SummaryData;
  stock?: GoldItem[];
  stocks?: ApiStockData;
  process?: ApiProcessData | GoldItem[];
  processes?: ApiProcessData;
  all?: GoldItem[];
  errors?: null;
}

// ======================================================
// HELPER FUNCTIONS
// ======================================================
export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatNumberDisplay = (
  value: unknown,
  minDecimals = 3,
): string => {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';

  const roundedClean = Number(Math.round(Number(num + 'e+6')) + 'e-6');
  const strVal = String(roundedClean);
  const decimalPart = strVal.includes('.') ? strVal.split('.')[1] : '';
  const actualDecimals = decimalPart.length;

  const decimals = Math.max(minDecimals, Math.min(actualDecimals, 4));
  return num.toFixed(decimals);
};

export const calculateAvgPurity = (gross: number, fine: number): string => {
  if (!gross || gross <= 0 || !fine || fine <= 0) return '0.00';
  const purity = (fine / gross) * 100;
  return purity.toFixed(2);
};

export const getItemPurity = (item: GoldItem): number | null => {
  if (
    item.purity !== null &&
    item.purity !== undefined &&
    Number(item.purity) > 0
  ) {
    return Number(item.purity);
  }
  if (item.grossWeight > 0 && item.fineWeight > 0) {
    return Math.round((item.fineWeight / item.grossWeight) * 10000) / 100;
  }
  return null;
};

export const renderItemDisplayName = (item: GoldItem) => {
  const purityVal = getItemPurity(item);
  if (purityVal === null) {
    return <span>{item.name}</span>;
  }

  const purityFormatted = formatNumberDisplay(purityVal, 2);
  const nameHasPurity =
    item.name.includes(`${purityFormatted}%`) ||
    item.name.includes(`${purityVal}%`) ||
    item.name.includes('%');

  return (
    <span>
      {item.name}
      {!nameHasPurity && (
        <span className="ml-1 text-xs font-semibold text-[#785600] dark:text-amber-400">
          ({purityFormatted}%)
        </span>
      )}
    </span>
  );
};

export const getItemPrintName = (item: GoldItem): string => {
  const purityVal = getItemPurity(item);
  if (purityVal === null) {
    return item.name;
  }

  const purityFormatted = formatNumberDisplay(purityVal, 2);
  const nameHasPurity =
    item.name.includes(`${purityFormatted}%`) ||
    item.name.includes(`${purityVal}%`) ||
    item.name.includes('%');

  if (nameHasPurity) {
    return item.name;
  }
  return `${item.name} <span style="font-size:7px;color:#785600;font-weight:400;"> (${purityFormatted}%)</span>`;
};

export const getDefaultWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

export const formatDateForDisplay = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateForApi = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Map items into structured categories
export const buildCategoryGroups = (data: any | undefined): CategoryGroup[] => {
  if (!data) return [];

  const groups: CategoryGroup[] = [];

  const normalizeItem = (
    item: any,
    type: 'stock' | 'process',
    categoryName: string,
  ): GoldItem => {
    const gw = toNumber(item.grossWeight ?? item.grossweight ?? item.due ?? 0);
    const fw = toNumber(item.fineWeight ?? item.fineweight ?? item.due ?? 0);
    const itemName = item.clientName || item.name || 'Unnamed Item';
    return {
      id: item.id || `${categoryName}-${itemName}-${gw}-${fw}`,
      name: itemName,
      grossWeight: gw,
      grossweight: gw,
      fineWeight: fw,
      fineweight: fw,
      purity:
        item.purity !== undefined && item.purity !== null
          ? toNumber(item.purity)
          : null,
      category: categoryName,
      type,
    };
  };

  const addGroup = (
    id: string,
    name: string,
    type: 'Stock' | 'Process',
    rawItems: any[] | undefined,
  ) => {
    if (!rawItems || rawItems.length === 0) return;
    const items = rawItems.map((i) =>
      normalizeItem(i, type === 'Stock' ? 'stock' : 'process', name),
    );
    const totalGrossWeight = items.reduce((sum, i) => sum + i.grossWeight, 0);
    const totalFineWeight = items.reduce((sum, i) => sum + i.fineWeight, 0);

    groups.push({
      id,
      name,
      type,
      items,
      totalGrossWeight,
      totalFineWeight,
      count: items.length,
    });
  };

  // 1. Stock Data Categories
  if (data.stocks) {
    addGroup(
      'stock-gold',
      'Silver Stock',
      'Stock',
      data.stocks.gold || data.gold,
    );
    addGroup('stock-ready', 'Stock (Ready)', 'Stock', data.stocks.stock);
    addGroup('stock-scrap', 'Scrap', 'Stock', data.stocks.scrap);
    addGroup(
      'stock-cutting-scrap',
      'Cutting Scrap',
      'Stock',
      data.stocks.cuttingScrap,
    );
    addGroup('stock-tar', 'Tar Stock', 'Stock', data.stocks.tarStock);
    addGroup('stock-box', 'Box Stock', 'Stock', data.stocks.boxStock);
  } else {
    if (data.gold) {
      addGroup('stock-gold', 'Silver Stock', 'Stock', data.gold);
    }
    if (Array.isArray(data.stock)) {
      const scrapItems: GoldItem[] = [];
      const cuttingScrapItems: GoldItem[] = [];
      const tarStockItems: GoldItem[] = [];
      const boxStockItems: GoldItem[] = [];
      const generalStockItems: GoldItem[] = [];

      data.stock.forEach((item: any) => {
        const upper = (item.name || '').toUpperCase();
        if (upper.includes('CUTTING SCRAP')) {
          cuttingScrapItems.push(item);
        } else if (upper.includes('SCRAP')) {
          scrapItems.push(item);
        } else if (upper.includes('TAR STOCK')) {
          tarStockItems.push(item);
        } else if (upper.includes('BOX STOCK')) {
          boxStockItems.push(item);
        } else {
          generalStockItems.push(item);
        }
      });

      addGroup('stock-ready', 'Stock (Ready)', 'Stock', generalStockItems);
      addGroup('stock-scrap', 'Scrap', 'Stock', scrapItems);
      addGroup(
        'stock-cutting-scrap',
        'Cutting Scrap',
        'Stock',
        cuttingScrapItems,
      );
      addGroup('stock-tar', 'Tar Stock', 'Stock', tarStockItems);
      addGroup('stock-box', 'Box Stock', 'Stock', boxStockItems);
    }
  }

  // 2. Process Data Categories
  const processDataObj =
    data.processes ||
    (typeof data.process === 'object' && !Array.isArray(data.process)
      ? data.process
      : null);

  if (processDataObj) {
    // Manufacturing stages in flow order, then any other key the data has
    const STAGES = [
      'galai', 'company', 'press', 'sutt', 'bharni', 'cutting', 'wash',
      'soldering', 'meena', 'tass', 'polishing', 'vibrator', 'packaging',
    ];
    const keys = [
      ...STAGES.filter((k) => processDataObj[k]),
      ...Object.keys(processDataObj).filter((k) => !STAGES.includes(k)),
    ];
    keys.forEach((k) => {
      const label = k.charAt(0).toUpperCase() + k.slice(1);
      addGroup(`process-${k}`, `${label} Process`, 'Process', processDataObj[k]);
    });
  } else if (Array.isArray(data.process)) {
    const meltingItems: GoldItem[] = [];
    const tarItems: GoldItem[] = [];
    const boxItems: GoldItem[] = [];
    const kundaItems: GoldItem[] = [];
    const solderingItems: GoldItem[] = [];
    const jointItems: GoldItem[] = [];
    const cuttingItems: GoldItem[] = [];
    const otherProcessItems: GoldItem[] = [];

    data.process.forEach((item: any) => {
      const upper = (item.name || '').toUpperCase();
      if (upper.includes('MELTING')) meltingItems.push(item);
      else if (upper.includes('TAR')) tarItems.push(item);
      else if (upper.includes('BOX')) boxItems.push(item);
      else if (upper.includes('KUNDA')) kundaItems.push(item);
      else if (upper.includes('SOLDER')) solderingItems.push(item);
      else if (upper.includes('JOINT')) jointItems.push(item);
      else if (upper.includes('CUTTING')) cuttingItems.push(item);
      else otherProcessItems.push(item);
    });

    addGroup('process-tar', 'Tar Process', 'Process', tarItems);
    addGroup('process-box', 'Box Process', 'Process', boxItems);
    addGroup(
      'process-soldering',
      'Soldering Process',
      'Process',
      solderingItems,
    );
    addGroup('process-joint', 'Joint Process', 'Process', jointItems);
    addGroup('process-cutting', 'Cutting Process', 'Process', cuttingItems);
    addGroup('process-kunda', 'Kunda Process', 'Process', kundaItems);
    addGroup('process-melting', 'Melting Process', 'Process', meltingItems);
    addGroup('process-other', 'Other Process', 'Process', otherProcessItems);
  }

  // 3. Client Due Data Categories
  const clientDueItems =
    data.clientDues ||
    data.clientDue ||
    data.client_due ||
    data.stocks?.clientDues ||
    data.stocks?.clientDue;
  if (clientDueItems && Array.isArray(clientDueItems)) {
    const activeDueItems = clientDueItems
      .filter((i: any) => {
        const dueVal = toNumber(
          i.due ??
            i.fineWeight ??
            i.fineweight ??
            i.grossWeight ??
            i.grossweight ??
            0,
        );
        return dueVal > 0;
      })
      .map((i: any) => {
        const dueVal = toNumber(
          i.due ??
            i.fineWeight ??
            i.fineweight ??
            i.grossWeight ??
            i.grossweight ??
            0,
        );
        const clientName = i.clientName || i.name || 'Unnamed Client';
        return {
          id: i.id || `client-due-${clientName}-${dueVal}`,
          name: clientName,
          grossWeight: 0,
          grossweight: 0,
          fineWeight: dueVal,
          fineweight: dueVal,
          purity: null,
          category: 'Client Due',
          type: 'Stock' as const,
        };
      });

    if (activeDueItems.length > 0) {
      const totalDue = activeDueItems.reduce((sum, i) => sum + i.fineWeight, 0);
      groups.push({
        id: 'client-due',
        name: 'Client Due',
        type: 'Stock',
        items: activeDueItems,
        totalGrossWeight: 0,
        totalFineWeight: totalDue,
        count: activeDueItems.length,
      });
    }
  }

  return groups;
};
