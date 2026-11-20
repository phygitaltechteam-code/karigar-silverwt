import React from 'react';
import LossAlertBadge from '../shared/LossAlertBadge';
import { Column } from '@/components/Forms/Table/GenericTable';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import ScaleWeightField from '@/components/common/ScaleWeightField';
import { SuttRow, formatNumberDisplay } from './SuttMachineProcess';

const toNumber = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const getSuttColumns = (
  handleInlineChange: (
    index: number,
    field: 'description' | 'netWeightReceived' | 'scrap',
    value: string,
  ) => void,
  handleSaveToStock: (index: number) => void,
): Column<SuttRow>[] => [
  {
    key: 'dateTime',
    header: 'Date & Time',
    render: (item) => (
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.dateTime.split(', ')[0] || item.dateTime}
        </span>
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.dateTime.split(', ')[1] || ''}
        </span>
      </div>
    ),
  },
  {
    key: 'purity',
    header: 'Purity % (टंच)',
    render: (item) => (
      <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
        {formatNumberDisplay(item.purity)}%
      </span>
    ),
  },
  {
    key: 'stamp',
    header: 'Stamp (शिक्का)',
    render: (item, idx) =>
      (item as any).status === 'completed' || (item as any).isSaved ? (
        <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
          {item.stamp || (item as any).Stamp || (item as any)['Stamp (शिक्का)'] || '-'}
        </span>
      ) : (
        <div className="inline-block w-24">
          <GenericInputField
            type="text"
            value={(item as any).stamp ?? (item as any).Stamp ?? ''}
            onChange={(e) => handleInlineChange(idx, 'stamp' as any, e.target.value)}
            placeholder="Stamp"
            compact
            className="text-xs"
          />
        </div>
      ),
  },
  {
    key: 'netWeightGiven',
    header: 'Net Wt Given (G)',
    render: (item) => (
      <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
        {formatNumberDisplay(item.netWeightGiven)} G
      </span>
    ),
  },
  {
    key: 'description',
    header: 'Description (तपशील)',
    render: (item, index) => (
      <div className="inline-block w-48 min-w-[180px]">
        <GenericInputField
          type="text"
          value={
            item.descriptionRaw !== undefined
              ? item.descriptionRaw
              : (item.description || (item as any).design || (item as any).designName || '')
          }
          onChange={(e) =>
            handleInlineChange(index, 'description', e.target.value)
          }
          placeholder="Description (तपशील)"
          className="font-mono text-left w-full"
          compact
        />
      </div>
    ),
  },
  {
    key: 'karigar',
    header: 'Karigar',
    render: (item) => (
      <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
        {item.karigar || 'Self'}
      </span>
    ),
  },
  {
    key: 'netWeightReceived',
    header: 'Net Wt Received (G)',
    render: (item, index) => (
      <div className="inline-block w-28">
        <ScaleWeightField
          onScaleWeight={(w) => handleInlineChange(index, 'netWeightReceived', String(w))}
          name={`suttNetWeightReceived-${index}`}
          type="text"
          inputMode="decimal"
          decimalScale={3}
          value={
            item.netWeightReceivedRaw !== undefined
              ? item.netWeightReceivedRaw
              : item.netWeightReceived || ''
          }
          onChange={(e) =>
            handleInlineChange(index, 'netWeightReceived', e.target.value)
          }
          placeholder="0.000"
          suffix="G"
          compact
          className="font-mono text-right"
        />
      </div>
    ),
  },
  {
    key: 'scrap',
    header: 'Scrap (G)',
    render: (item, index) => (
      <div className="inline-block w-24">
        <GenericInputField
          name={`suttScrap-${index}`}
          type="text"
          inputMode="decimal"
          decimalScale={3}
          value={item.scrapRaw !== undefined ? item.scrapRaw : item.scrap || ''}
          onChange={(e) => handleInlineChange(index, 'scrap', e.target.value)}
          placeholder="0.000"
          suffix="G"
          compact
          className="font-mono text-right"
        />
      </div>
    ),
  },
  {
    key: 'loss',
    header: 'Loss (G)',
    render: (item) => {
      const calculatedLoss = Math.max(
        0,
        Math.round(
          (item.netWeightGiven -
            (item.netWeightReceived || 0) -
            (item.scrap || 0)) *
          1000,
        ) / 1000,
      );
      return (
        <div className="flex flex-col items-end">
          <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
            {formatNumberDisplay(calculatedLoss)} G
          </span>
          <LossAlertBadge stage="sutt" given={item.netWeightGiven} purity={Number((item as any).purity) || 0} loss={calculatedLoss} />
        </div>
      );
    },
  },
  {
    key: 'rate',
    header: 'Rate (Rs)',
    render: (item) => {
      const baseRate = toNumber(item.rate) || 0;
      const effectiveWt = (item.netWeightReceived && item.netWeightReceived > 0)
        ? item.netWeightReceived
        : item.netWeightGiven;
      const laborCost = ((baseRate * effectiveWt) / 1000).toFixed(2);
      return (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-sm text-[#785600] dark:text-amber-400">
            ₹ {laborCost}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-slate-400">
            (₹{baseRate}/kg)
          </span>
        </div>
      );
    },
  },
  {
    key: 'actions',
    header: 'Action',
    render: (item: SuttRow, index: number) => {
      if (item.status === 'bharni') {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
            Bharni Process
          </span>
        );
      }

      return (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSaveToStock(index)}
            className="rounded-lg bg-[#785600] px-3.5 py-1 text-xs font-bold text-white transition-all hover:bg-[#5c4200] dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 cursor-pointer"
            title="Save"
          >
            Save
          </button>
        </div>
      );
    },
  },
];
