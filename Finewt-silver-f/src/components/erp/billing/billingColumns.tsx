import React from 'react';
import {Printer, Trash2} from 'lucide-react';
import {Column} from '@/components/Forms/Table/GenericTable';
import {
  BillGroup,
  formatNumberWithDecimals,
  getTypeColor,
} from './billingTypes';

export const getBillingColumns = (
  handlePrintReceipt: (item: BillGroup) => void,
  handleDelete: (item: BillGroup) => void,
  isDeletePending: boolean,
): {
  columns: Column<BillGroup>[];
  renderActions: (item: BillGroup, index: number) => React.ReactNode;
} => {
  const renderActions = (item: BillGroup, index: number) => (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrintReceipt(item);
        }}
        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
        title="Print Receipt"
      >
        <Printer className="h-4 w-4" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(item);
        }}
        disabled={isDeletePending}
        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const columns: Column<BillGroup>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'billNo',
      header: 'Bill No',
      render: (item) => (
        <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
          {item.billNo}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.clientName}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.phoneNumber}
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayItems.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="text-sm font-medium leading-relaxed text-[#1a1c1b] dark:text-white"
            >
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayPurity.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="font-mono text-sm leading-relaxed text-[#1a1c1b] dark:text-white"
            >
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'finWt',
      header: 'Fin Wt (g)',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displayFinWt.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="font-mono text-sm font-bold leading-relaxed text-black dark:text-amber-400"
            >
              {line} G
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'srp',
      header: 'Wastage',
      render: (item) => (
        <div className="flex flex-col items-center whitespace-pre-line text-center">
          {item.displaySRP.split('\n').map((line, idx) => (
            <span
              key={idx}
              className="font-mono text-sm leading-relaxed text-[#1a1c1b] dark:text-white"
            >
              {line}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'receive',
      header: 'Receive (g)',
      render: (item) => (
        <span className="font-mono text-sm font-semibold text-black dark:text-green-400">
          {formatNumberWithDecimals(item.receive)} G
        </span>
      ),
    },
    {
      key: 'pending',
      header: 'Pending (g)',
      render: (item) => (
        <span className="font-mono text-sm font-semibold text-black dark:text-red-400">
          {formatNumberWithDecimals(
            Math.abs(
              item.remainingWeight !== undefined &&
                item.remainingWeight !== null
                ? item.remainingWeight
                : item.pending || 0,
            ),
          )}{' '}
          G
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Status',
      render: (item) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getTypeColor(item.type)}`}
        >
          {item.type || '-'}
        </span>
      ),
    },
  ];

  return {columns, renderActions};
};
