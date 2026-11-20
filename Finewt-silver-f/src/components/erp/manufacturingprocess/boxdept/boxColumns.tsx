import React from 'react';
import { confirmAction } from '@/utils/confirmAction';
import { Column } from '@/components/Forms/Table/GenericTable';
import { Flame, RotateCcw, Plus } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {
  checkProcessLossAlert,
  getProcessLossColorClass,
  AlertRule,
} from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';
import {
  BoxEntry,
  formatDate,
  formatNumberDisplay,
  hasMeltingStatus,
} from './boxUtils';

// ======================================================
// Helper functions for Split Rows
// ======================================================

export const isSplitRow = (item: BoxEntry): boolean =>
  typeof item.id === 'string' && item.id.includes('-split-');

export const getParentId = (item: BoxEntry): string =>
  item.id.replace(/-split-\d+$/, '');

// ======================================================
// Table Columns Definitions
// ======================================================

export const getHistoryBoxColumns = (
  alertRules?: AlertRule[],
): Column<any>[] => [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item?.createdAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">{time}</span>
          </div>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item?.purity)}%
        </span>
      ),
    },
    {
      key: 'tarWeight',
      header: 'Tar Weight (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 6 : 1),
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
            {formatNumberDisplay(item?.tarWeight)} G
          </span>
        );
      },
    },
    {
      key: 'chainWeight',
      header: 'Chain Weight (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        return (
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
              {formatNumberDisplay(item?.chainWeight)} G
            </span>
            {item?.breakId && (
              <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Break
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item?.scrap)} G
          </span>
        );
      },
    },
    {
      key: 'expectedLoss',
      header: 'Expected Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        const lossVal =
          item?.loss ?? (item?.tarWeight || 0) - (item?.chainWeight || 0);
        const details = evaluateLossDetails(
          item?.tarWeight,
          item?.purity,
          lossVal,
          alertRules,
          'box',
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
        if (hasMeltingStatus(item)) {
          return null;
        }
        const lossVal =
          item?.loss ?? (item?.tarWeight || 0) - (item?.chainWeight || 0);
        const details = evaluateLossDetails(
          item?.tarWeight,
          item?.purity,
          lossVal,
          alertRules,
          'box',
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
        if (hasMeltingStatus(item)) {
          return null;
        }
        const lossVal =
          item?.loss ?? (item?.tarWeight || 0) - (item?.chainWeight || 0);
        const details = evaluateLossDetails(
          item?.tarWeight,
          item?.purity,
          lossVal,
          alertRules,
          'box',
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
        const { date, time } = formatDate(item?.updatedAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">{time}</span>
          </div>
        );
      },
    },
  ];

export const getBoxColumns = (
  getScaleProps: (index: number, field: any) => any,
  handleInlineChange: (index: number, field: any, value: string) => void,
  handleSaveClick: (index: number) => void,
  handleMelting: (item: BoxEntry) => void,
  hasEditableValues: (entry: BoxEntry) => boolean,
  isLoading: boolean,
  isSubmitting: boolean,
  meltingLoadingIds: Set<string>,
  alertRules?: AlertRule[],
  handleRevert?: (item: BoxEntry) => void,
  revertLoadingIds?: Record<string, boolean>,
  totalEntriesCount?: number,
  handleBreakTar?: (item: BoxEntry, index: number) => void,
  allEntries?: BoxEntry[],
): Column<BoxEntry>[] => [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(', ') : ['', ''];
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {parts[0] || ''}
            </span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {parts.slice(1).join(', ') || ''}
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
      key: 'tarWeight',
      header: 'Tar(तार)',
      render: (item) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.tarWeight)} G
          </span>
        </div>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Weight(G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                name={`boxChainWeight-${index}`}
                type="text"
                inputMode="decimal"
                decimalScale={3}
                autoFocus={index === 0}
                value={
                  item.chainWeightRaw !== undefined
                    ? item.chainWeightRaw
                    : item.chainWeight === 0
                      ? ''
                      : item.chainWeight
                }
                {...getScaleProps(index, 'chainWeight')}
                onChange={(e) =>
                  handleInlineChange(index, 'chainWeight', e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const scrapInput = document.querySelector<HTMLInputElement>(
                      `input[name="boxScrap-${index}"]`,
                    );
                    if (scrapInput) {
                      scrapInput.focus();
                      scrapInput.select();
                    } else {
                      handleSaveClick(index);
                    }
                  }
                }}
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-right"
              />
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
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                name={`boxScrap-${index}`}
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
                    handleSaveClick(index);
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
        const hasValues = hasEditableValues(item);
        const alertCheck = checkProcessLossAlert(
          item.tarWeight,
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

    {
      key: 'actions',
      header: 'Action',
      render: (item: BoxEntry, index: number) => {
        const isMeltingLoading = meltingLoadingIds.has(item.id);
        const isReverting = Boolean(item.id && revertLoadingIds?.[item.id]);
        const isLastEntry =
          totalEntriesCount !== undefined
            ? index === totalEntriesCount - 1
            : true;

        const chainWt =
          parseFloat(
            item.chainWeightRaw !== undefined
              ? item.chainWeightRaw
              : item.chainWeight?.toString() || '0',
          ) || 0;

        const isWeightMoreThanAvailable = chainWt > 0 && chainWt >= item.tarWeight;

        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* Break Tar Button - Only shown when weight is strictly less than available tar weight */}
            {handleBreakTar && !isWeightMoreThanAvailable && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await confirmAction(
                    'Confirm Break Tar',
                    'Are you sure you want to break this tar quantity?',
                  );
                  if (confirmed) {
                    handleBreakTar(item, index);
                  }
                }}
                disabled={
                  isLoading || isSubmitting || isMeltingLoading || isReverting
                }
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-200 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-950/50 dark:text-emerald-300"
                title="Break Tar Quantity"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Break</span>
              </button>
            )}

            {/* Soldering Button - Shown if entry is not saved and has editable values or if weight >= available */}
            {!item.isSaved && (hasEditableValues(item) || isWeightMoreThanAvailable) && (
              <button
                type="button"
                onClick={() => handleSaveClick(index)}
                disabled={
                  isLoading || isSubmitting || isMeltingLoading || isReverting
                }
                className="rounded-lg bg-[#785600] px-3.5 py-1 text-xs font-bold text-white transition-all hover:bg-[#5c4200] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                title="Move to Soldering"
              >
                Soldering
              </button>
            )}

            {/* Melting Button - Always visible for all entries */}
            <button
              type="button"
              onClick={async () => {
                const confirmed = await confirmAction(
                  'Confirm Melting',
                  'Are you sure you want to send this item to melting?',
                );
                if (confirmed) {
                  handleMelting(item);
                }
              }}
              disabled={
                isLoading || isSubmitting || isMeltingLoading || isReverting
              }
              className="rounded-lg border border-amber-300 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400"
              title="Send to Melting"
            >
              {isMeltingLoading ? (
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
                <Flame className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Revert Button - Only show on the last entry */}
            {handleRevert && item.id && isLastEntry && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await confirmAction(
                    'Confirm Revert',
                    'Are you sure you want to revert this item?',
                  );
                  if (confirmed) {
                    handleRevert(item);
                  }
                }}
                disabled={
                  isLoading || isSubmitting || isMeltingLoading || isReverting
                }
                className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                title="Revert Box"
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
    },
  ];
