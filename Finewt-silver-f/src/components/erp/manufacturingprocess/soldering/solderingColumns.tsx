import React from 'react';
import { Flame } from 'lucide-react';
import { Column } from '@/components/Forms/Table/GenericTable';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { AlertRule } from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';
import {
  SolderingEntry,
  formatDate,
  formatNumberDisplay,
  hasMeltingStatus,
} from './solderingUtils';

// ======================================================
// Table Columns Definitions
// ======================================================

export const getHistorySolderingColumns = (
  alertRules?: AlertRule[],
  allData?: any[],
): Column<any>[] => [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item, index) => {
        const { date, time } = formatDate(item.createdAt);
        const prevItem = allData && index > 0 ? allData[index - 1] : null;
        const prevDate = prevItem ? formatDate(prevItem.createdAt).date : null;
        const showDate = !prevDate || prevDate !== date;
        return (
          <div className="flex flex-col items-center">
            {showDate ? (
              <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            ) : (
              <span className="text-sm text-transparent select-none">—</span>
            )}
            <span className="text-sm text-[#1a1c1b] dark:text-white">{time}</span>
          </div>
        );
      },
    },
    {
      key: 'sizeName',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item?.size?.size}
        </span>
      ),
    },
    {
      key: 'design',
      header: 'Design (डिझाइन)',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {(item as any).design || (item as any).designName || (item as any).description || (item as any)['Design (डिझाइन)'] || '-'}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 8 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return (
            <div className="flex items-center justify-center py-0.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Melting
              </span>
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainWeight)} G
          </span>
        );
      },
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainReceived)} G
          </span>
        );
      },
    },
    {
      key: 'powder',
      header: 'Powder Given (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.powder)} G
          </span>
        );
      },
    },
    {
      key: 'increase',
      header: 'Increase %',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.increase)} %
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)} G
          </span>
        );
      },
    },
    {
      key: 'expectedLoss',
      header: 'Expected Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'soldering',
        );
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(details.expectedLoss)} G
          </span>
        );
      },
    },
    {
      key: 'actualLoss',
      header: 'Actual Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'soldering',
        );
        return (
          <span className={`font-mono text-sm ${details.colorClass}`}>
            {formatNumberDisplay(details.actualLoss)} G
          </span>
        );
      },
    },
    {
      key: 'diffLoss',
      header: 'Diff Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'soldering',
        );
        const isPositive = details.diffLoss > 0;
        const isNegative = details.diffLoss < 0;
        return (
          <span
            className={`font-mono text-sm ${isPositive
                ? 'font-semibold text-red-600 dark:text-red-400'
                : isNegative
                  ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                  : 'text-[#1a1c1b] dark:text-white'
              }`}
          >
            {isPositive
              ? `+${formatNumberDisplay(details.diffLoss)}`
              : formatNumberDisplay(details.diffLoss)}{' '}
            G
          </span>
        );
      },
    },
    {
      key: 'timeTaken',
      header: 'Gold Aging',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item?.timeTaken || '-'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item.updatedAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },
  ];

export const getSolderingColumns = (
  getScaleProps: (index: number, field: any) => any,
  handleInlineChange: (index: number, field: any, value: string) => void,
  handleSaveClick: (index: number, action: 'joint' | 'cutting') => void,
  handleMelting: (item: SolderingEntry) => void,
  handleRevert: (item: SolderingEntry) => void,
  isLoading: boolean,
  isSubmitting: boolean,
  meltingLoadingIds: Set<string>,
  revertLoadingIds: Set<string>,
  hasEditableValues: (entry: SolderingEntry) => boolean,
  alertRules?: AlertRule[],
  totalEntriesCount?: number,
  allData?: SolderingEntry[],
): Column<SolderingEntry>[] => [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item, index) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';
        const prevItem = allData && index > 0 ? allData[index - 1] : null;
        const prevParts = prevItem?.dateTime ? prevItem.dateTime.split(' ') : [];
        const prevDatePart = prevParts[0] || '';
        const showDate = !prevDatePart || prevDatePart !== datePart;
        return (
          <div className="flex flex-col items-center">
            {showDate ? (
              <span className="text-sm text-[#1a1c1b] dark:text-white">
                {datePart}
              </span>
            ) : (
              <span className="text-sm text-transparent select-none">—</span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <div className="bg-gray-50/50 flex w-24 items-center justify-center gap-1 whitespace-nowrap px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/50">
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)}%
          </span>
        </div>
      ),
    },
    {
      key: 'stamp',
      header: 'Stamp (शिक्का)',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-slate-200">
          {(item as any)['Stamp (शिक्का)'] || item.stamp || (item as any).Stamp || '-'}
        </span>
      ),
    },
    {
      key: 'design',
      header: 'Design (डिझाइन)',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {(item as any).design || (item as any).designName || (item as any).description || (item as any)['Design (डिझाइन)'] || '-'}
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Given Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight)} G
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description (तपशील)',
      render: (item, index) => (
        <div className="inline-block w-48 min-w-[140px]">
          <GenericInputField
            type="text"
            value={
              item.descriptionRaw !== undefined
                ? item.descriptionRaw
                : (item as any).description || ''
            }
            onChange={(e) =>
              handleInlineChange(index, 'Description (तपशील)', e.target.value)
            }
            placeholder="Description (तपशील)"
            className="font-mono text-left w-full text-xs"
            compact
          />
        </div>
      ),
    },
    {
      key: 'karigar',
      header: 'Karigar (कारीगर)',
      render: (item) => (
        <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
          {(item as any).karigar || (item as any).karigarName || 'Self'}
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Received Wt (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div
              className="inline-block w-24"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>(
                  `input[name="chainReceived-${index}"]`,
                );
                if (input) { input.focus(); }
              }}
            >
              <GenericInputField
                name={`chainReceived-${index}`}
                type="text"
                inputMode="decimal"
                decimalScale={3}
                autoFocus={index === 0}
                value={
                  item.chainReceivedRaw !== undefined
                    ? item.chainReceivedRaw
                    : item.chainReceived === 0
                      ? ''
                      : item.chainReceived
                }
                {...getScaleProps(index, 'chainReceived')}
                onChange={(e) =>
                  handleInlineChange(index, 'chainReceived', e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const scrapInput = document.querySelector<HTMLInputElement>(
                      `input[name="scrap-${index}"]`,
                    );
                    if (scrapInput) {
                      scrapInput.focus();
                    } else {
                      handleSaveClick(index, 'cutting');
                    }
                  }
                }}
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-center cursor-text"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainReceived)} G
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                name={`scrap-${index}`}
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={
                  item.scrapRaw !== undefined
                    ? item.scrapRaw
                    : item.scrap === 0
                      ? ''
                      : item.scrap
                }
                {...getScaleProps(index, 'scrap')}
                onChange={(e) =>
                  handleInlineChange(index, 'scrap', e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveClick(index, 'cutting');
                  }
                }}
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-center"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)} G
          </span>
        );
      },
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => {
        const loss = Math.max(
          0,
          Math.round(
            ((item.chainWeight || 0) -
              (item.chainReceived || 0) -
              (item.scrap || 0)) *
              1000,
          ) / 1000,
        );
        return (
          <span className="font-mono text-sm font-semibold text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(loss)} G
          </span>
        );
      },
    },
    {
      key: 'rate',
      header: 'Rate (Rs)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          ₹{(item as any).rate || '15'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item: SolderingEntry, index: number) => {
        const isMeltingLoading = meltingLoadingIds.has(item.id);
        const isRevertLoading = revertLoadingIds.has(item.id);
        const anyLoading = isLoading || isSubmitting || isMeltingLoading || isRevertLoading;

        return (
          <button
            type="button"
            onClick={() => handleSaveClick(index, 'cutting')}
            disabled={anyLoading}
            className="rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#5c4200] cursor-pointer"
          >
            Save
          </button>
        );
      },
    } as Column<SolderingEntry>,
  ];
