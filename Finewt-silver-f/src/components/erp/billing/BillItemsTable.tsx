import React from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { ReceiptItem, formatNumberThreeDecimals } from './billFormTypes';

interface BillItemsTableProps {
  items: ReceiptItem[];
  availableItems: any[];
  availableSizes: any[];
  isReadOnly?: boolean;
  onItemChange: (index: number, field: keyof ReceiptItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  getScaleProps: (index: number, field: keyof ReceiptItem) => any;
}

export const defaultDesigns = [
  'Indo-Italian',
  'Round Box',
  'Spiga Chain',
  'Laser Cut',
  'Diamond Cut',
  'Final Polishing',
];

export const defaultStamps = [
  'SHIQA 92.5',
  'SHIQA 99.9',
  '92.5 STERLING',
  'FINE 999',
  'HALLMARK 916',
];

export const BillItemsTable: React.FC<BillItemsTableProps> = ({
  items,
  availableItems,
  availableSizes,
  isReadOnly = false,
  onItemChange,
  onAddItem,
  onRemoveItem,
  getScaleProps,
}) => {
  const renderActions = (item: ReceiptItem) => {
    if (isReadOnly) return null;
    const actualIndex = items.indexOf(item);

    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onRemoveItem(actualIndex)}
          className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Remove row"
          disabled={items.length <= 1}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onAddItem}
          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          title="Add row"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const columns: Column<ReceiptItem>[] = [
    {
      mobileFull: true,
      key: 'item',
      header: 'Item',
      render: (item) => {
        if (isReadOnly) {
          return (
            <span className="flex flex-col">
              <span className="font-semibold text-[#1a1c1b] dark:text-white">{item.item || '-'}</span>
              {item.productCode && (
                <span className="font-mono text-[10px] text-[#785600]">{item.productCode}</span>
              )}
            </span>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <div className="flex flex-col">
          <select
            value={item.item}
            onChange={(e) => onItemChange(actualIndex, 'item', e.target.value)}
            className="h-8 w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select Item</option>
            {availableItems.map((it: any) => (
              <option key={it.id} value={it.name}>
                {it.name}
              </option>
            ))}
          </select>
          {item.productCode && (
            <span className="mt-0.5 font-mono text-[10px] text-[#785600]">{item.productCode}</span>
          )}
          </div>
        );
      },
    },
    {
      key: 'design',
      header: 'Design',
      render: (item) => {
        if (isReadOnly) {
          return (
            <span className="text-[#1a1c1b] dark:text-white">
              {item.design || '-'}
            </span>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <input
            type="text"
            value={item.design || ''}
            onChange={(e) => onItemChange(actualIndex, 'design', e.target.value)}
            placeholder="Design"
            className="h-8 w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        );
      },
    },
    {
      key: 'Stamp (शिक्का)',
      header: 'Stamp (शिक्का)',
      render: (item) => {
        if (isReadOnly) {
          return (
            <span className="text-[#1a1c1b] dark:text-white">
              {item['Stamp (शिक्का)'] || (item as any).stamp || '-'}
            </span>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <input
            type="text"
            value={item['Stamp (शिक्का)'] || (item as any).stamp || ''}
            onChange={(e) => onItemChange(actualIndex, 'Stamp (शिक्का)', e.target.value)}
            placeholder="Stamp (शिक्का)"
            className="h-8 w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end font-medium text-[#1a1c1b] dark:text-white">
              {item.purity !== undefined &&
                item.purity !== null &&
                item.purity !== ''
                ? `${item.purity}%`
                : '-'}
            </div>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <div className="relative flex-1">
            <GenericInputField compact
              type="text"
              inputMode="decimal"
              step="0.001"
              min="0"
              max="100"
              value={
                item.purity !== undefined && item.purity !== null
                  ? item.purity
                  : ''
              }
              onChange={(e) =>
                onItemChange(actualIndex, 'purity', e.target.value)
              }
              placeholder="0.000"
              suffix="%"
              className="!w-full !min-w-0 !px-1.5 !pr-6 text-right text-xs"
              decimalScale={3}
            />
            {item.isLoadingQty && (
              <Loader2 className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#785600]" />
            )}
          </div>
        );
      },
    },
    {
      key: 'availableQty',
      header: 'Available Qty',
      render: (item) => (
        <div className="flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-md border border-[#c5b497] bg-[#eae3d5] px-2 py-1.5 text-xs shadow-inner dark:border-slate-600 dark:bg-slate-800">
          <span className="font-mono font-bold text-black dark:text-white">
            {item.availableQty !== undefined &&
              item.availableQty !== null &&
              item.availableQty !== ''
              ? formatNumberThreeDecimals(Number(item.availableQty))
              : '0'}
          </span>
          <span className="text-gray-500 text-[10px] dark:text-slate-400">
            G
          </span>
        </div>
      ),
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end font-bold text-[#1a1c1b] dark:text-white">
              {formatNumberThreeDecimals(item.grossWt)} G
            </div>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <GenericInputField compact
            type="text"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={
              item.grossWt !== undefined && item.grossWt !== null
                ? item.grossWt
                : ''
            }
            {...getScaleProps(actualIndex, 'grossWt')}
            onChange={(e) => {
              onItemChange(actualIndex, 'grossWt', e.target.value);
            }}
            placeholder="0.000"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !pr-6 text-right text-xs"
            decimalScale={3}
          />
        );
      },
    },
    {
      key: 'srp',
      header: 'Wastage (G)',
      render: (item) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end text-[#1a1c1b] dark:text-white">
              {formatNumberThreeDecimals(item.srp)} G
            </div>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <GenericInputField compact
            type="text"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={item.srp !== undefined && item.srp !== null ? item.srp : ''}
            onChange={(e) => onItemChange(actualIndex, 'srp', e.target.value)}
            placeholder="0.000"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !pr-6 text-right text-xs"
            decimalScale={3}
          />
        );
      },
    },
    {
      key: 'fineWt',
      header: 'Fine Wt (G)',
      render: (item) => (
        <div className="flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-md border border-[#c5b497] bg-[#eae3d5] px-2 py-1.5 text-xs shadow-inner dark:border-slate-600 dark:bg-slate-800">
          <span className="font-mono font-bold text-black dark:text-amber-400">
            {formatNumberThreeDecimals(item.fineWt)}
          </span>
          <span className="text-gray-500 text-[10px] dark:text-slate-400">
            G
          </span>
        </div>
      ),
    },
    {
      key: 'laborRate',
      header: 'Labour',
      // Wide enough for the input + G/₹ switch (otherwise the next column's buttons cover the ₹ button)
      className: 'min-w-[200px]',
      render: (item) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end text-[#1a1c1b] dark:text-white">
              {item.laborType === 'AMOUNT'
                ? `₹ ${formatNumberThreeDecimals(item.laborRate)}`
                : `${formatNumberThreeDecimals(item.laborRate)} G`}
            </div>
          );
        }
        const actualIndex = items.indexOf(item);
        const isAmount = item.laborType === 'AMOUNT';
        return (
          <div className="relative z-[1] flex h-9 w-[168px] shrink-0 items-stretch overflow-hidden rounded-lg border border-[#d3c4af]/50 bg-white focus-within:border-[#785600] focus-within:ring-2 focus-within:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800">
            <input
              type="text"
              inputMode="decimal"
              value={
                item.laborRate !== undefined && item.laborRate !== null
                  ? item.laborRate
                  : ''
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v !== '' && !/^d*.?d{0,3}$/.test(v)) return;
                onItemChange(actualIndex, 'laborRate', v);
              }}
              placeholder={isAmount ? '0.00' : '0.000'}
              aria-label="Labour"
              className="font-mono min-w-0 flex-1 bg-transparent px-2 text-right text-sm text-[#1a1c1b] outline-none dark:text-white"
            />
            <div className="flex shrink-0 border-l border-[#d3c4af]/50 dark:border-slate-700" role="group" aria-label="Labour in grams or rupees">
              {(['GRAM', 'AMOUNT'] as const).map((t) => {
                const on = (t === 'AMOUNT') === isAmount;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onItemChange(actualIndex, 'laborType', t)}
                    title={t === 'GRAM' ? 'Labour in grams (added to fine)' : 'Labour in rupees'}
                    className={`w-8 text-xs font-bold transition-colors sm:w-9 ${
                      on
                        ? 'bg-[#785600] text-white'
                        : 'text-[#785600] hover:bg-[#f4f0e5] dark:text-amber-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t === 'GRAM' ? 'G' : '₹'}
                  </button>
                );
              })}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
          Items
        </h3>
      </div>

      <div className="w-full min-w-0 overflow-x-auto [&_table]:w-full [&_table]:min-w-[980px] [&_table]:table-fixed [&_td]:px-1.5 [&_td]:py-1.5 [&_td]:text-xs [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[11px]">
        <GenericTable<ReceiptItem>
          mobileCards
          data={items}
          columns={columns}
          emptyMessage="No items added yet."
          isLoading={false}
          renderActions={isReadOnly ? undefined : renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
        />
      </div>
    </div>
  );
};

export default BillItemsTable;
