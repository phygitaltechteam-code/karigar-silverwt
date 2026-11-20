import React from 'react';
import { Column } from '@/components/Forms/Table/GenericTable';
import { Flame } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { AlertRule } from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';
import {
  CuttingEntry,
  formatDate,
  formatNumberDisplay,
  formatPurityDisplay,
  getItemName,
  getSizeName,
  hasMeltingStatus,
} from './cuttingUtils';

export const getHistoryCuttingColumns = (
  alertRules?: AlertRule[],
): Column<any>[] => [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item.createdAt);
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
      key: 'design',
      header: 'Design (डिझाइन)',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item?.design || item?.designName || getItemName(item?.item) || '-'}
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
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatPurityDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight ?? item.chainGiven)} G
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 5 : 1),
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
        if (hasMeltingStatus(item)) {
          return null;
        }
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
        if (hasMeltingStatus(item)) {
          return null;
        }
        const details = evaluateLossDetails(
          item.chainWeight ?? item.chainGiven,
          item.purity,
          item.loss,
          alertRules,
          'cutting',
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
        const details = evaluateLossDetails(
          item.chainWeight ?? item.chainGiven,
          item.purity,
          item.loss,
          alertRules,
          'cutting',
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
        const details = evaluateLossDetails(
          item.chainWeight ?? item.chainGiven,
          item.purity,
          item.loss,
          alertRules,
          'cutting',
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

export const getCuttingColumns = (
  getScalePropsParam: any,
  handleInlineChangeParam?: any,
  handleSaveClickParam?: any,
  handleMeltingParam?: any,
  isLoadingParam?: boolean,
  isSubmittingParam?: boolean,
  submitMoveKundaIsPendingParam?: boolean,
  meltingLoadingIdsParam?: Set<string>,
  alertRulesParam?: AlertRule[],
  handleRevertParam?: any,
  revertLoadingIdsParam?: Set<string>,
  itemsListParam?: any[],
  totalEntriesCountParam?: number,
): Column<CuttingEntry>[] => {
  let getScaleProps = getScalePropsParam;
  let handleInlineChange = handleInlineChangeParam;
  let handleSaveClick = handleSaveClickParam;
  let handleMelting = handleMeltingParam;
  let handleRevert = handleRevertParam;
  let isLoading = isLoadingParam;
  let isSubmitting = isSubmittingParam;
  let submitMoveKundaIsPending = submitMoveKundaIsPendingParam;
  let meltingLoadingIds = meltingLoadingIdsParam;
  let revertLoadingIds = revertLoadingIdsParam;
  let alertRules = alertRulesParam;
  let itemsList = itemsListParam;
  let totalEntriesCount = totalEntriesCountParam;

  if (
    getScalePropsParam &&
    typeof getScalePropsParam === 'object' &&
    typeof getScalePropsParam !== 'function'
  ) {
    getScaleProps = getScalePropsParam.getScaleProps;
    handleInlineChange = getScalePropsParam.handleInlineChange;
    handleSaveClick = getScalePropsParam.handleSaveClick;
    handleMelting = getScalePropsParam.handleMelting;
    handleRevert = getScalePropsParam.handleRevert;
    isLoading = getScalePropsParam.isLoading;
    isSubmitting = getScalePropsParam.isSubmitting;
    submitMoveKundaIsPending = getScalePropsParam.submitMoveKundaIsPending;
    meltingLoadingIds = getScalePropsParam.meltingLoadingIds;
    revertLoadingIds = getScalePropsParam.revertLoadingIds;
    alertRules = getScalePropsParam.alertRules;
    itemsList = getScalePropsParam.itemsList || itemsListParam;
    totalEntriesCount = getScalePropsParam.totalEntriesCount || totalEntriesCountParam;
  }

  if (typeof getScaleProps !== 'function') {
    getScaleProps = () => ({});
  }

  return [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const dt = item.dateTime || '';
        const clean = dt.replace(/,/g, '');
        const parts = clean ? clean.split(' ') : ['', ''];
        return (
          <div className="flex flex-col text-xs">
            <span className="text-[#1a1c1b] dark:text-white font-medium">
              {parts[0] || dt}
            </span>
            {parts[1] && (
              <span className="text-gray-400 text-[10px]">
                {parts.slice(1).join(' ')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-20">
              <GenericInputField
                name={`cuttingPurity-${index}`}
                type="text"
                inputMode="decimal"
                decimalScale={2}
                autoFocus={index === 0}
                value={
                  item.purityRaw !== undefined
                    ? item.purityRaw
                    : item.purity === 0
                      ? ''
                      : item.purity
                }
                {...getScaleProps(index, 'purity')}
                onChange={(e) =>
                  handleInlineChange && handleInlineChange(index, 'purity', e.target.value)
                }
                placeholder="0.00"
                suffix="%"
                compact
                className="font-mono text-center !border-2 !border-amber-600/80 dark:!border-amber-500/80 shadow-sm"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
            {formatPurityDisplay(item.purity)}%
          </span>
        );
      },
    },
    {
      key: 'stamp',
      header: '	Stamp (शिक्का)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-20">
              <GenericInputField
                name={`cuttingStamp-${index}`}
                type="text"
                value={item.stampRaw !== undefined ? item.stampRaw : item.stamp || ''}
                onChange={(e) =>
                  handleInlineChange && handleInlineChange(index, 'stamp', e.target.value)
                }
                placeholder="Stamp"
                compact
                className="text-xs text-center"
              />
            </div>
          );
        }
        return (
          <span className="text-xs font-medium text-[#1a1c1b] dark:text-slate-200">
            {item.stamp || '-'}
          </span>
        );
      },
    },
    {
      key: 'design',
      header: 'Design (डिझाइन)',
      render: (item) => (
        <span className="text-xs font-medium text-[#1a1c1b] dark:text-slate-200">
          {(item as any).design || (item as any).designName || (item as any).item || '-'}
        </span>
      ),
    },
    {
      key: 'netWeightGiven',
      header: 'Given Wt (G)',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight ?? item.chainGiven ?? 0)} G
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description (तपशील)',
      render: (item, index) => {
        const displayName = (() => {
          if (typeof item?.item === 'object') {
            return (item?.item as any)?.name ?? (item?.item as any)?.item ?? '-';
          }
          if (
            typeof item?.item === 'string' &&
            item?.item !== 'N/A' &&
            item?.item !== '-'
          ) {
            const matched = itemsList?.find(
              (it: any) => String(it.id || it._id) === String(item.item),
            );
            if (matched) {
              return matched.name || matched.item || item.item;
            }
            return item.item;
          }
          return '-';
        })();

        return (
          <div className="w-28">
            <GenericInputField
              type="text"
              value={
                item.descriptionRaw !== undefined
                  ? item.descriptionRaw
                  : item.description || (displayName !== '-' ? displayName : '')
              }
              onChange={(e) =>
                handleInlineChange && handleInlineChange(index, 'description', e.target.value)
              }
              placeholder="Description"
              compact
              className="text-xs"
            />
          </div>
        );
      },
    },
    {
      key: 'size',
      header: 'Size',
      render: (item, index) => {
        const sizeStr = typeof item?.size === 'object'
          ? ((item?.size as any)?.size ?? '-')
          : (item?.size ?? '-');

        if (item.isEditing) {
          return (
            <div className="w-16">
              <GenericInputField
                type="text"
                value={item.sizeRaw !== undefined ? item.sizeRaw : sizeStr}
                onChange={(e) =>
                  handleInlineChange && handleInlineChange(index, 'size', e.target.value)
                }
                placeholder="Size"
                compact
                className="text-xs text-center"
              />
            </div>
          );
        }
        return (
          <span className="text-xs text-[#1a1c1b] dark:text-white">
            {sizeStr}
          </span>
        );
      },
    },
    {
      key: 'qtyGiven',
      header: 'Qty Given',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="w-16">
              <GenericInputField
                type="text"
                inputMode="numeric"
                value={item.qtyGivenRaw !== undefined ? item.qtyGivenRaw : item.qtyGiven ?? 1}
                onChange={(e) =>
                  handleInlineChange && handleInlineChange(index, 'qtyGiven', e.target.value)
                }
                compact
                className="text-center font-mono text-xs"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
            {item.qtyGiven ?? 1}
          </span>
        );
      },
    },
    {
      key: 'qtyReceived',
      header: 'Qty Received',
      render: (item, index) => {
        return (
          <div className="inline-block w-20">
            <GenericInputField
              name={`cuttingChainReceived-${index}`}
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
                handleInlineChange && handleInlineChange(index, 'chainReceived', e.target.value)
              }
              placeholder="0.000"
              suffix="G"
              compact
              className="font-mono text-center text-xs"
            />
          </div>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap',
      render: (item, index) => {
        return (
          <div className="inline-block w-20">
            <GenericInputField
              name={`cuttingScrap-${index}`}
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
                handleInlineChange && handleInlineChange(index, 'scrap', e.target.value)
              }
              placeholder="0.000"
              suffix="G"
              compact
              className="font-mono text-center text-xs"
            />
          </div>
        );
      },
    },
    {
      key: 'loss',
      header: 'Loss',
      render: (item) => {
        const given = item.chainWeight ?? item.chainGiven ?? 0;
        const rec = item.chainReceived ?? 0;
        const scrap = item.scrap ?? 0;
        const calcLoss = item.loss !== undefined && item.loss !== null
          ? item.loss
          : Math.max(0, Math.round((given - rec - scrap) * 1000) / 1000);
        return (
          <span className="font-mono text-xs font-semibold text-[#785600] dark:text-amber-400">
            {formatNumberDisplay(calcLoss)} G
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item: CuttingEntry, index: number) => {
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSaveClick && handleSaveClick(index, 'stock')}
              disabled={isLoading || isSubmitting || submitMoveKundaIsPending}
              className="rounded-lg bg-[#785600] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#5c4200] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Save
            </button>
          </div>
        );
      },
    },
  ];
};
