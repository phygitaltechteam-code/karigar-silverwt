import React from 'react';
import { Column } from '@/components/Forms/Table/GenericTable';
import { Flame } from 'lucide-react';
import { AlertRule } from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';
import {
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
