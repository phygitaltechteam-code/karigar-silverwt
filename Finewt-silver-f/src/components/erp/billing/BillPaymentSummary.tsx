import React from 'react';
import { Scale, Plus, Minus } from 'lucide-react';
import { formatNumberThreeDecimals } from './billFormTypes';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';

export interface AdvanceItem {
  srNo: number;
  item: string;
  purity: string;
  grossWt: string;
  fineWt: string | number;
}

interface BillPaymentSummaryProps {
  totalFine: number | string;
  customerWeight: number | string;
  savedAdvance?: number;
  dueBalance: number;
  totalBill?: number | null;
  remainingBalance: number;
  isReadOnly?: boolean;
  onCustomerWeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTotalFineChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  advanceItems?: AdvanceItem[];
  availableItems?: any[];
  onAdvanceItemChange?: (
    index: number,
    field: 'item' | 'purity' | 'grossWt' | 'fineWt',
    value: string,
  ) => void;
  getAdvanceScaleProps?: (
    index: number,
    field: string,
  ) => { onFocus: () => void; onBlur: () => void };
  onAddAdvanceItem?: () => void;
  onRemoveAdvanceItem?: (index: number) => void;
}

export const DEFAULT_ADVANCE_ITEMS = [
  'Silver Chock',
  'Silver Patla',
];

export const BillPaymentSummary: React.FC<BillPaymentSummaryProps> = ({
  totalFine,
  customerWeight,
  savedAdvance = 0,
  dueBalance,
  totalBill,
  remainingBalance,
  isReadOnly = false,
  onCustomerWeightChange,
  onTotalFineChange,
  advanceItems = [],
  availableItems = [],
  onAdvanceItemChange,
  getAdvanceScaleProps,
  onAddAdvanceItem,
  onRemoveAdvanceItem,
}) => {
  const numericSavedAdvance = Number(savedAdvance) || 0;
  const savedAdvanceRows = advanceItems.filter(
    (r) => Number(r.grossWt) > 0 || Number(r.fineWt) > 0,
  );

  /* ── Row action buttons ── */
  const renderAdvanceActions = (row: AdvanceItem) => {
    if (isReadOnly) return null;
    const actualIndex = advanceItems.indexOf(row);

    return (
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onRemoveAdvanceItem?.(actualIndex)}
          className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Remove row"
          disabled={advanceItems.length <= 1}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onAddAdvanceItem?.()}
          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          title="Add row"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  /* ── Columns: Item (dropdown with Silver Chock & Silver Patla), Purity, Gross Wt, Fine Wt ── */
  const advanceColumns: Column<AdvanceItem>[] = [
    {
      mobileFull: true,
      key: 'item',
      header: 'Item',
      render: (row, idx) => {
        if (isReadOnly) {
          return (
            <span className="font-semibold text-[#1a1c1b] dark:text-white">
              {row.item || '-'}
            </span>
          );
        }
        return (
          <select
            value={row.item}
            onChange={(e) => {
              const val = e.target.value;
              onAdvanceItemChange?.(idx, 'item', val);
              if (!row.purity || row.purity === '0') {
                if (val === 'Silver Patla') {
                  onAdvanceItemChange?.(idx, 'purity', '99.9');
                } else if (val === 'Silver Chock') {
                  onAdvanceItemChange?.(idx, 'purity', '92.5');
                }
              }
            }}
            className="h-8 w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1 text-xs text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select Item</option>
            {DEFAULT_ADVANCE_ITEMS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            {row.item && !DEFAULT_ADVANCE_ITEMS.includes(row.item) && (
              <option value={row.item}>{row.item}</option>
            )}
          </select>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (row, idx) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end font-medium text-[#1a1c1b] dark:text-white">
              {row.purity ? `${row.purity}%` : '-'}
            </div>
          );
        }
        return (
          <GenericInputField compact
            type="text"
            inputMode="decimal"
            step="0.001"
            min="0"
            max="100"
            value={row.purity}
            decimalScale={3}
            suffix="%"
            placeholder="0.000"
            onChange={(e) =>
              onAdvanceItemChange?.(idx, 'purity', e.target.value)
            }
            className="!w-full !min-w-0 !px-1.5 !pr-6 text-right text-xs"
          />
        );
      },
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (row, idx) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end font-bold text-[#1a1c1b] dark:text-white">
              {formatNumberThreeDecimals(row.grossWt)} G
            </div>
          );
        }
        return (
          <div className="relative w-full">
            <GenericInputField compact
              type="text"
              inputMode="decimal"
              step="0.001"
              min="0"
              value={row.grossWt}
              decimalScale={3}
              placeholder="0.000"
              title="Focus to receive weight from scale machine"
              onChange={(e) =>
                onAdvanceItemChange?.(idx, 'grossWt', e.target.value)
              }
              onFocus={
                getAdvanceScaleProps
                  ? () => getAdvanceScaleProps(idx, 'grossWt').onFocus()
                  : undefined
              }
              onBlur={
                getAdvanceScaleProps
                  ? () => getAdvanceScaleProps(idx, 'grossWt').onBlur()
                  : undefined
              }
              className="!w-full !min-w-0 !px-1.5 !pr-6 text-right text-xs"
            />
            <Scale
              className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#785600]/60 dark:text-amber-500/60"
              strokeWidth={2}
            />
          </div>
        );
      },
    },
    {
      key: 'fineWt',
      header: 'Fine Wt (G)',
      render: (row) => (
        <div className="flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-md border border-[#c5b497] bg-[#eae3d5] px-2 py-1.5 text-xs shadow-inner dark:border-slate-600 dark:bg-slate-800">
          <span className="font-mono font-bold text-black dark:text-amber-400">
            {formatNumberThreeDecimals(row.fineWt)}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-slate-400">
            G
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-4 flex flex-col items-stretch gap-4 xl:flex-row xl:items-start">
      {/* ── Advance Table (left) ── */}
      {!isReadOnly && (
        <div className="w-full flex-1 overflow-hidden border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-[#d3c4af]/20 bg-white px-4 py-2.5 dark:border-slate-700">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Advance
            </h3>
          </div>

          <div className="w-full min-w-0 overflow-hidden [&_table]:w-full [&_table]:table-fixed [&_td]:px-1.5 [&_td]:py-1.5 [&_td]:text-xs [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[11px]">
            <GenericTable<AdvanceItem>
          mobileCards
              data={advanceItems}
              columns={advanceColumns}
              showSrNo={true}
              srNoLabel="Sr No."
              emptyMessage="No advance rows yet."
              showEdit={false}
              showDelete={false}
              showPagination={false}
              pagination={false}
              renderActions={isReadOnly ? undefined : renderAdvanceActions}
            />
          </div>
        </div>
      )}

      {/* ── Advance rows of a saved bill (view only) ── */}
      {isReadOnly && savedAdvanceRows.length > 0 && (
        <div className="w-full flex-1 overflow-hidden border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Advance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-wider text-white">
                  <th className="px-3 py-2 font-semibold">Sr No.</th>
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 font-semibold">Purity (%)</th>
                  <th className="px-3 py-2 font-semibold">Gross Wt (G)</th>
                  <th className="px-3 py-2 font-semibold">Fine Wt (G)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f2] text-[#1a1c1b] dark:divide-slate-700 dark:text-white">
                {savedAdvanceRows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{r.item || '-'}</td>
                    <td className="font-mono px-3 py-2">{Number(r.purity) || 0}%</td>
                    <td className="font-mono px-3 py-2">{formatNumberThreeDecimals(Number(r.grossWt) || 0)} G</td>
                    <td className="font-mono px-3 py-2 font-semibold">{formatNumberThreeDecimals(Number(r.fineWt) || 0)} G</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payment Summary Card (right) ── */}
      <div className="w-full shrink-0 max-w-sm overflow-hidden sm:ml-auto rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Total Fine Wt */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
          <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
            Total Fine Wt
          </span>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.001"
              min="0"
              disabled
              value={totalFine || ''}
              onChange={onTotalFineChange}
              placeholder="0.000"
              className="font-mono w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
              G
            </span>
          </div>
        </div>

        {/* Advance */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
          <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
            Advance{' '}
            {!isReadOnly && numericSavedAdvance > 0
              ? `(${numericSavedAdvance % 1 === 0
                ? numericSavedAdvance
                : Number(numericSavedAdvance.toFixed(3))
              }G)`
              : ''}
          </span>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.001"
              min="0"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              disabled={isReadOnly}
              value={
                isReadOnly
                  ? customerWeight !== undefined &&
                    customerWeight !== '' &&
                    customerWeight !== null &&
                    Number(customerWeight) !== 0
                    ? customerWeight
                    : numericSavedAdvance || ''
                  : customerWeight || ''
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('-')) return;
                if (Number(val) < 0) return;
                onCustomerWeightChange(e);
              }}
              placeholder="0.000"
              className="font-mono disabled:bg-gray-100 w-28 rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 pr-7 text-right text-sm font-semibold text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:disabled:bg-slate-900"
            />
            <span className="pointer-events-none absolute right-2.5 text-xs text-[#817563] dark:text-slate-400">
              G
            </span>
          </div>
        </div>

        {/* Due Balance */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-4 py-2.5 dark:border-slate-700">
          <span className="text-sm font-medium text-[#4f4535] dark:text-slate-300">
            Due Balance
          </span>
          <span className="font-mono text-sm font-semibold text-black dark:text-white">
            {formatNumberThreeDecimals(dueBalance)} G
          </span>
        </div>

        {/* Remaining Balance */}
        <div className="flex items-center justify-between bg-[#f4f0e5] px-4 py-3 dark:bg-slate-800">
          <span className="text-sm font-bold text-[#1a1c1b] dark:text-white">
            Remaining Balance
          </span>
          <span className="font-mono text-base font-bold text-black dark:text-white">
            {formatNumberThreeDecimals(
              totalBill !== undefined && totalBill !== null
                ? totalBill
                : remainingBalance,
            )}{' '}
            G
          </span>
        </div>
      </div>
    </div>
  );
};

export default BillPaymentSummary;