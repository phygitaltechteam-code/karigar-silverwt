import React, { useState, useEffect, useMemo } from 'react';
import { Layers, X, Save, Plus, Trash2, RotateCcw, User } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import toast from 'react-hot-toast';
import { loadCuttingKarigars } from '@/components/MasterPages/UnifiedKarigarMaster';

export interface StockCardItem {
  id: string;
  Stamp?: string;
  stamp?: string;
  design?: string;
  description?: string;
  qty?: string | number;
  itemId?: string;
  sizeId?: string;
  itemName?: string;
  sizeName?: string;
  purity: number;
  weight: number;
  sourceProcess?: string;
}

export interface SizeQtyRow {
  id: string;
  sizeId: string;
  sizeName: string;
  qty: string;
}

interface AddCuttingStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockCard: StockCardItem | null;
  itemsList?: any[];
  sizesList?: any[];
  onAddEntries?: (entriesData: {
    stockCard: StockCardItem;
    sizeQtyList: { sizeId: string; sizeName: string; qty: number }[];
  }) => void;
  onAddEntry?: (entryData: any) => void;
  onRevert?: (stockCard: StockCardItem) => void | Promise<void>;
  onOpenRevert?: () => void;
  isReverting?: boolean;
}

const defaultSizeOptions: any[] = [];

const formatNumberDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';
  const str = num.toString();
  const parts = str.split('.');
  if (parts.length === 1) return parts[0];
  const dec = parts[1].slice(0, 3).replace(/0+$/, '');
  return dec ? `${parts[0]}.${dec}` : parts[0];
};

const formatPurityDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0.00';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2).replace(/\.00$/, '');
};

const AddCuttingStockModal: React.FC<AddCuttingStockModalProps> = ({
  isOpen,
  onClose,
  stockCard,
  sizesList = [],
  onAddEntries,
  onAddEntry,
  onRevert,
  onOpenRevert,
  isReverting = false,
}) => {
  const availableSizes = sizesList.length > 0 ? sizesList : defaultSizeOptions;

  const karigarList = useMemo(() => {
    const list = loadCuttingKarigars();
    return [{ id: 'self', name: 'Self' }, ...list.filter((k) => k.name.toLowerCase() !== 'self')];
  }, [isOpen]);
  const [selectedKarigar, setSelectedKarigar] = useState<string>('Self');

  useEffect(() => {
    if (karigarList.length > 0) {
      setSelectedKarigar(karigarList[0].name);
    }
  }, [karigarList, isOpen]);

  const [rows, setRows] = useState<SizeQtyRow[]>([
    {
      id: 'row-1',
      sizeId: availableSizes[0]?.id || 'sz-18',
      sizeName: availableSizes[0]?.size || '18"',
      qty: '5',
    },
  ]);

  useEffect(() => {
    if (stockCard) {
      setRows([
        {
          id: 'row-1',
          sizeId: availableSizes[0]?.id || 'sz-18',
          sizeName: availableSizes[0]?.size || '18"',
          qty: '5',
        },
      ]);
    }
  }, [stockCard, availableSizes]);

  if (!isOpen || !stockCard) return null;

  const handleAddRow = () => {
    const nextIdx = rows.length % availableSizes.length;
    const sizeObj = availableSizes[nextIdx] || availableSizes[0];
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        sizeId: sizeObj.id || sizeObj._id || '',
        sizeName: sizeObj.size || '',
        qty: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      toast.error('At least one size row is required');
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (
    index: number,
    field: 'sizeId' | 'qty',
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i === index) {
          if (field === 'sizeId') {
            const matched = availableSizes.find(
              (s: any) => String(s.id || s._id) === String(value),
            );
            return {
              ...r,
              sizeId: value,
              sizeName: matched?.size || value,
            };
          } else {
            return { ...r, qty: value };
          }
        }
        return r;
      }),
    );
  };

  const handleSave = () => {
    const validRows = rows
      .map((r) => ({
        sizeId: r.sizeId,
        sizeName: r.sizeName,
        qty: parseInt(r.qty, 10) || 0,
      }))
      .filter((r) => r.qty > 0);

    if (validRows.length === 0) {
      toast.error('Please enter quantity for at least one size row');
      return;
    }

    if (onAddEntries) {
      onAddEntries({
        stockCard,
        sizeQtyList: validRows,
      });
    } else if (onAddEntry) {
      validRows.forEach((vr) => {
        onAddEntry({
          itemId: stockCard.id,
          itemName: stockCard.design || stockCard.itemName || 'Cutting Item',
          sizeId: vr.sizeId,
          sizeName: vr.sizeName,
          purity: stockCard.purity,
          chainGiven: stockCard.weight,
          qty: vr.qty,
        });
      });
    }

    toast.success('Cutting stock entries saved successfully!');
    onClose();
  };

  const stampDisplay = stockCard.stamp || '-';
  const designDisplay = stockCard.design || stockCard.itemName || 'Box Chain';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-[#d3c4af]/30 bg-white p-5 shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#785600]/10 p-2.5 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white sm:text-xl">
                Add Cutting Process
              </h3>
              <p className="text-xs text-[#817563] dark:text-slate-400">
                Select sizes & enter quantities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(onOpenRevert || (onRevert && stockCard)) && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenRevert) {
                    onOpenRevert();
                  } else if (onRevert && stockCard) {
                    onRevert(stockCard);
                  }
                }}
                disabled={isReverting}
                className="flex items-center gap-1.5 rounded-xl border border-[#d3c4af]/60 bg-white px-3 py-1.5 text-xs font-semibold text-[#785600] shadow-sm transition-all hover:bg-[#785600]/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-amber-950/40"
              >
                <RotateCcw
                  className={`h-3.5 w-3.5 ${isReverting ? 'animate-spin' : ''}`}
                />
                <span>Revert</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isReverting}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Info Badge (Stamp (शिक्का), Design, Purity, Weight) */}
        <div className="my-4 rounded-xl border border-[#d3c4af]/40 bg-[#eae3d5]/40 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Stamp (शिक्का)
              </span>
              <span className="font-mono text-sm font-bold text-black dark:text-white">
                {stampDisplay}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Design
              </span>
              <span className="text-sm font-bold text-black dark:text-white">
                {designDisplay}
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Purity % (टंच)
              </span>
              <span className="font-mono text-sm font-bold text-black dark:text-amber-400">
                {formatPurityDisplay(stockCard.purity)}%
              </span>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Weight
              </span>
              <span className="font-mono text-sm font-bold text-black dark:text-amber-400">
                {formatNumberDisplay(stockCard.weight)} G
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Table for Size Select & Qty Enter */}
        <div className="mb-4 flex-1 overflow-y-auto">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Size & Quantity Breakdown
            </span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d3c4af]/30 bg-[#f8f6f0] text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <th className="py-2 px-3 w-12 text-center">Sr No.</th>
                <th className="py-2 px-3">Size Select</th>
                <th className="py-2 px-3">Qty Enter</th>
                <th className="py-2 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-center text-xs font-bold text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={row.sizeId}
                      onChange={(e) =>
                        handleRowChange(idx, 'sizeId', e.target.value)
                      }
                      className="w-full rounded-lg border border-[#b8a892] bg-white px-2.5 py-1.5 text-xs text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {availableSizes.map((s: any) => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.size}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <GenericInputField
                      type="number"
                      value={row.qty}
                      onChange={(e) =>
                        handleRowChange(idx, 'qty', e.target.value)
                      }
                      placeholder="Enter Qty"
                      className="font-mono text-xs font-semibold"
                    />
                  </td>
                  <td className="px-3 py-2 text-center w-16">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={handleAddRow}
                        title="Add Part Row"
                        className="rounded p-1 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-slate-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          title="Remove Row"
                          className="rounded p-1 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] via-[#855b00] to-[#986d00] py-3 text-base font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99]"
        >
          <Save className="h-5 w-5" />
          <span>Save Cutting Process</span>
        </button>
      </div>
    </div>
  );
};

export default AddCuttingStockModal;
