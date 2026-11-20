import React from 'react';
import { confirmAction } from '@/utils/confirmAction';
import { Flame, RotateCcw } from 'lucide-react';
import { Column } from '@/components/Forms/Table/GenericTable';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {
  AlertRule,
  checkProcessLossAlert,
  getProcessLossColorClass,
} from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';
import {
  KundaEntry,
  getItemName,
  getSizeName,
  formatDate,
  formatNumberDisplay,
  formatPurityDisplay,
  hasMeltingStatus,
  toNumber,
} from './sKundaUtils';

// ======================================================
// Columns Definition
// ======================================================

export const getHistorySKundaColumns = (
  alertRules?: AlertRule[],
): Column<any>[] => [
  {
    key: 'createdAt',
    header: 'Date & Time',
    render: (item) => {
      const {date, time} = formatDate(item.createdAt);
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
  {
    key: 'item',
    header: 'Item',
    render: (item) => (
      <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
        {getItemName(item?.item)}
      </span>
    ),
  },
  {
    key: 'size',
    header: 'Size',
    render: (item) => (
      <span className="text-sm text-[#1a1c1b] dark:text-white">
        {getSizeName(item?.size)}
      </span>
    ),
  },
  {
    key: 'purity',
    header: 'Purity (%)',
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
          {formatPurityDisplay(item.purity)}%
        </span>
      );
    },
  },
  {
    key: 'chainGiven',
    header: 'Chain Given (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      return (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight || item.chainGiven)} G
        </span>
      );
    },
  },
  {
    key: 'kundaGiven',
    header: 'S/Kunda Given (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      return (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(
            item.kundaGiven || item.kundaGiven || item.kunda || 0,
          )}{' '}
          G
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
    key: 'scrap',
    header: 'Scrap (G)',
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
      const inputVal =
        toNumber(item?.chainGiven || item?.chainWeight || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );
      return (
        <span className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-300">
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
      const inputVal =
        toNumber(item?.chainGiven || item?.chainWeight || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );
      return (
        <span
          className={`font-mono text-sm font-semibold ${details.lossColorClass}`}
        >
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
      const inputVal =
        toNumber(item?.chainGiven || item?.chainWeight || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );
      const isPositive = details.diffLoss > 0;
      const isNegative = details.diffLoss < 0;

      return (
        <span
          className={`font-mono text-sm font-bold ${
            isPositive
              ? 'text-red-600 dark:text-red-400'
              : isNegative
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400'
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
      const {date, time} = formatDate(item.updatedAt);
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

export const getSKundaColumns = (
  getScaleProps: (index: number, field: any) => any,
  handleInlineChange: (index: number, field: any, value: string) => void,
  handleStockClick: (index: number) => void,
  isLoading: boolean,
  isSubmitting: boolean,
  hasEditableValues: (entry: KundaEntry) => boolean,
  showActionColumn: boolean,
  alertRules?: AlertRule[],
  handleRevert?: (item: KundaEntry) => void,
  revertLoadingIds?: Record<string, boolean>,
): Column<KundaEntry>[] => {
  const baseColumns: Column<KundaEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {getItemName(item?.item)}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {getSizeName(item?.size)}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-20">
              <GenericInputField
                name={`skundaPurity-${index}`}
                type="text"
                inputMode="decimal"
                decimalScale={2}
                autoFocus={index === 0}
                value={
                  item.purityRaw !== undefined
                    ? item.purityRaw
                    : item.purity === 0 || item.purity === ''
                      ? ''
                      : item.purity
                }
                onChange={(e) =>
                  handleInlineChange(index, 'purity', e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const kundaGivenInput = document.querySelector<HTMLInputElement>(
                      `input[name="skundaKundaGiven-${index}"]`,
                    );
                    if (kundaGivenInput) {
                      kundaGivenInput.focus();
                      kundaGivenInput.select();
                    }
                  }
                }}
                placeholder="0.00"
                suffix="%"
                compact
                className="font-mono text-center !border-2 !border-amber-600/80 dark:!border-amber-500/80 shadow-sm"
              />
            </div>
          );
        }
        return (
          <div className="bg-gray-50/50 flex w-20 items-center justify-center gap-1 whitespace-nowrap px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
              {formatPurityDisplay(item.purity)}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'chainGiven',
      header: 'Chain Given (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainGiven)} G
        </span>
      ),
    },
    {
      key: 'kundaGiven',
      header: 'S/Kunda Given (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                name={`skundaKundaGiven-${index}`}
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={
                  item.kundaGivenRaw !== undefined
                    ? item.kundaGivenRaw
                    : item.kundaGiven === 0
                      ? ''
                      : item.kundaGiven
                }
                {...getScaleProps(index, 'kundaGiven')}
                onChange={(e) =>
                  handleInlineChange(index, 'kundaGiven', e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const chainReceivedInput = document.querySelector<HTMLInputElement>(
                      `input[name="skundaChainReceived-${index}"]`,
                    );
                    if (chainReceivedInput) {
                      chainReceivedInput.focus();
                      chainReceivedInput.select();
                    }
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
            {formatNumberDisplay(item.kundaGiven)} G
          </span>
        );
      },
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                name={`skundaChainReceived-${index}`}
                type="text"
                inputMode="decimal"
                decimalScale={3}
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
                      `input[name="skundaScrap-${index}"]`,
                    );
                    if (scrapInput) {
                      scrapInput.focus();
                      scrapInput.select();
                    }
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
                name={`skundaScrap-${index}`}
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
                    const nextPurityInput = document.querySelector<HTMLInputElement>(
                      `input[name="skundaPurity-${index + 1}"]`,
                    );
                    if (nextPurityInput) {
                      nextPurityInput.focus();
                      nextPurityInput.select();
                    } else {
                      handleStockClick(index);
                    }
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
        const hasValues = Boolean(
          (item.kundaGivenRaw !== undefined && item.kundaGivenRaw !== '') ||
          (item.chainReceivedRaw !== undefined &&
            item.chainReceivedRaw !== '') ||
          (item.scrapRaw !== undefined && item.scrapRaw !== '') ||
          item.kundaGiven > 0 ||
          item.chainReceived > 0 ||
          item.scrap > 0 ||
          item.isSaved,
        );
        const grossVal = item.chainGiven + (item.kundaGiven || 0);
        const alertCheck = checkProcessLossAlert(
          grossVal,
          item.purity,
          item.loss,
          alertRules,
          hasValues,
        );

        const hasAlert = Boolean(alertRules && alertRules.length > 0 && alertCheck);
        if (!hasAlert) {
          return (
            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
              {formatNumberDisplay(item.loss)} G
            </span>
          );
        }

        const colorClass = getProcessLossColorClass(alertCheck);
        const expectedLoss = alertCheck?.maxAllowedLoss || alertCheck?.baseLoss || 0;
        const diff = alertCheck?.diff || 0;

        return (
          <div className="flex flex-col items-center justify-center">
            <span className={`font-mono text-sm font-semibold ${colorClass}`}>
              Act: {formatNumberDisplay(item.loss)} G
            </span>
            <div className="mt-0.5 flex flex-col items-center text-[10px] leading-tight text-gray-500 dark:text-slate-400">
              <span>Exp: {formatNumberDisplay(expectedLoss)} G</span>
              <span
                className={
                  diff > 0
                    ? 'font-semibold text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-slate-400'
                }
              >
                Diff: {diff > 0 ? `+${formatNumberDisplay(diff)}` : formatNumberDisplay(diff)} G
              </span>
            </div>
          </div>
        );
      },
    },
  ];

  if (showActionColumn || handleRevert) {
    baseColumns.push({
      key: 'actions',
      header: 'Action',
      render: (item: KundaEntry, index: number) => {
        const canStock =
          showActionColumn &&
          !item.isSaved &&
          item.isEditing &&
          hasEditableValues(item);
        const canRevert = Boolean(handleRevert && item.id);
        const isReverting = Boolean(item.id && revertLoadingIds?.[item.id]);

        if (!canStock && !canRevert) {
          return null;
        }

        return (
          <div className="flex items-center justify-center gap-1.5">
            {canStock && (
              <button
                type="button"
                onClick={() => handleStockClick(index)}
                disabled={isLoading || isSubmitting || isReverting}
                className="rounded-lg bg-[#785600] px-3.5 py-1 text-xs font-bold text-white transition-all hover:bg-[#5c4200] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                title="Stock Process"
              >
                Stock
              </button>
            )}
            {canRevert && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await confirmAction(
                    'Confirm Revert',
                    'Are you sure you want to revert this item?',
                  );
                  if (confirmed) {
                    handleRevert!(item);
                  }
                }}
                disabled={isLoading || isSubmitting || isReverting}
                className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                title="Revert S Kunda"
              >
                {isReverting ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        );
      },
    } as Column<KundaEntry>);
  }

  return baseColumns;
};
