import React from 'react';
import LossAlertBadge from '../shared/LossAlertBadge';
import { Column } from '@/components/Forms/Table/GenericTable';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import ScaleWeightField from '@/components/common/ScaleWeightField';
import { PolishingRow, formatNumberDisplay, formatDate, toNumber } from './polishingUtils';

export const getPolishingColumns = (
  handleInlineChange: (
    idx: number,
    field:
      | 'description'
      | 'size'
      | 'qtyGiven'
      | 'qtyReceived'
      | 'netWeightReceived'
      | 'scrap'
      | 'loss'
      | 'rate',
    val: string,
  ) => void,
  handleSaveToStock: (idx: number) => void,
): Column<PolishingRow>[] => [
  {
    key: 'srNo',
    header: 'Sr No.',
    render: (_, idx) => (
      <span className="text-xs font-semibold text-[#1a1c1b] dark:text-white">
        {idx + 1}
      </span>
    ),
  },
  {
    key: 'dateTime',
    header: 'Date & Time',
    render: (item) => {
      const { date, time } = formatDate(item.createdAt || item.dateTime);
      return (
        <div className="flex flex-col text-xs">
          <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
            {date}
          </span>
          {time && <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{time}</span>}
        </div>
      );
    },
  },
  {
    key: 'purity',
    header: 'Purity %',
    render: (item) => (
      <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
        {formatNumberDisplay(item.purity)}%
      </span>
    ),
  },
  {
    key: 'stamp',
    header: 'Stamp (शिक्का)',
    render: (item, idx) =>
      (item as any).status === 'completed' || (item as any).isSaved ? (
        <span className="text-xs font-medium text-[#1a1c1b] dark:text-slate-200">
          {item.stamp || item.Stamp || (item as any)['Stamp (शिक्का)'] || '-'}
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
    key: 'design',
    header: 'Design (डिझाइन)',
    render: (item) => (
      <span className="text-xs font-medium text-[#1a1c1b] dark:text-slate-200">
        {item.design || (item as any).designName || item.description || '-'}
      </span>
    ),
  },
  {
    key: 'size',
    header: 'Size',
    render: (item) => (
      <span className="text-xs font-medium text-[#1a1c1b] dark:text-slate-200">{(item as any).size || '-'}</span>
    ),
  },
  {
    key: 'qty',
    header: 'Qty',
    render: (item) => {
      const q = (item as any).qtyGiven ?? (item as any).qty;
      return (
        <span className="font-mono text-xs font-medium text-[#1a1c1b] dark:text-slate-200">
          {q !== undefined && q !== '' ? q : '-'}
        </span>
      );
    },
  },
  {
    key: 'netWeightGiven',
    header: 'Given Wt (G)',
    render: (item) => (
      <span className="font-mono text-xs font-semibold text-[#1a1c1b] dark:text-white">
        {formatNumberDisplay(item.netWeightGiven)} G
      </span>
    ),
  },
  {
    key: 'description',
    header: 'Description (तपशील)',
    render: (item, idx) => (
      <div className="inline-block w-48 min-w-[180px]">
        <GenericInputField
          type="text"
          value={
            item.descriptionRaw !== undefined
              ? item.descriptionRaw
              : (item.description || item.design || (item as any).designName || '')
          }
          onChange={(e) =>
            handleInlineChange(idx, 'description', e.target.value)
          }
          compact
          className="text-xs"
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
    header: 'Received Wt (G)',
    render: (item, idx) => (
      <div className="w-24">
        <ScaleWeightField
          onScaleWeight={(w) => handleInlineChange(idx, 'netWeightReceived', String(w))}
          type="text"
          inputMode="decimal"
          value={
            item.netWeightReceivedRaw !== undefined
              ? item.netWeightReceivedRaw
              : item.netWeightReceived || ''
          }
          onChange={(e) =>
            handleInlineChange(idx, 'netWeightReceived', e.target.value)
          }
          suffix="G"
          compact
          className="text-right font-mono"
        />
      </div>
    ),
  },
  {
    key: 'scrap',
    header: 'Scrap',
    render: (item, idx) => (
      <div className="w-20">
        <GenericInputField
          type="text"
          inputMode="decimal"
          value={item.scrapRaw !== undefined ? item.scrapRaw : item.scrap || ''}
          onChange={(e) => handleInlineChange(idx, 'scrap', e.target.value)}
          suffix="G"
          compact
          className="text-right font-mono"
        />
      </div>
    ),
  },
  {
    key: 'loss',
    header: 'Loss',
    render: (item, idx) => {
      const rec = item.netWeightReceived || 0;
      const scrap = item.scrap || 0;
      const given = item.netWeightGiven || 0;
      const calcLoss = Math.max(
        0,
        Math.round((given - rec - scrap) * 1000) / 1000,
      );
      const displayValue =
        item.lossRaw !== undefined
          ? item.lossRaw
          : item.loss !== undefined && item.loss !== null
            ? String(item.loss)
            : calcLoss || '';
      return (
        <div className="w-20">
          <GenericInputField
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={(e) => handleInlineChange(idx, 'loss', e.target.value)}
            suffix="G"
            compact
            className="text-right font-mono"
          />
          <LossAlertBadge stage="polishing" given={given} purity={Number((item as any).purity) || 0} loss={Number(displayValue) || 0} />
        </div>
      );
    },
  },
  {
    key: 'rate',
    header: 'Rate (Rs)',
    render: (item) => {
      const baseRate = toNumber(item.rate) || 0;
      const effectiveWt =
        item.netWeightReceived && item.netWeightReceived > 0
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
    render: (_, idx) => (
      <button
        type="button"
        onClick={() => handleSaveToStock(idx)}
        className="rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#5c4200] cursor-pointer"
      >
        Save
      </button>
    ),
  },
];
