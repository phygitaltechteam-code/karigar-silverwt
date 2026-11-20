import React, { useState, useEffect } from 'react';
import { useProcessKarigars } from '@/lib/api/karigar';
import { X, Flame, Plus, Layers } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import toast from 'react-hot-toast';

export interface ScrapModalItem {
  id: string;
  purity: number;
  availableWeight: number;
  sendWeight?: string;
}

export interface DynamicMeltingItem {
  id: string;
  purity: string | number;
  availableWeight: string | number;
  weight: string | number;
}

interface MeltingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  scrapModalItems: ScrapModalItem[];
  refetch?: () => Promise<any>;
  onSuccess?: (payload?: any) => void;
}


export const formatNumberWithCommas = (value: number | string | undefined, decimals = 3) => {
  if (value === undefined || value === null || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value.toString();
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const MeltingPopup: React.FC<MeltingPopupProps> = ({
  isOpen,
  onClose,
  scrapModalItems,
  refetch,
  onSuccess,
}) => {
  const KARIGARS = useProcessKarigars('Melting', 'Self Karigar');
  const [items, setItems] = useState<DynamicMeltingItem[]>([]);
  const [selectedKarigar, setSelectedKarigar] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [stamp, setStamp] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && scrapModalItems && scrapModalItems.length > 0) {
      setItems(
        scrapModalItems.map((sm) => ({
          id: sm.id,
          purity: sm.purity,
          availableWeight: sm.availableWeight,
          weight: '',
        })),
      );
    } else {
      setItems([]);
    }
  }, [isOpen, scrapModalItems]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedKarigar('');
      setRate('');
      setStamp('');
      setDescription('');
    }
  }, [isOpen]);

  const handleKarigarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kName = e.target.value;
    setSelectedKarigar(kName);
    const k = KARIGARS.find((x) => x.name === kName);
    if (k) setRate(k.defaultRate.toString());
  };

  const handleUpdateItem = (id: string, field: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
            return { ...item, [field]: value };
          }
        }
        return item;
      }),
    );
  };

  const handleSubmit = async () => {
    if (!selectedKarigar) {
      toast.error('Please select a Karigar.');
      return;
    }
    if (!stamp) {
      toast.error('Please enter a Stamp (शिक्का).');
      return;
    }

    const item = items[0];
    if (!item) return;

    const inputWeight = parseFloat(item.weight.toString()) || 0;
    if (inputWeight <= 0) {
      toast.error('Given Wt must be greater than 0.');
      return;
    }

    if (inputWeight > Number(item.availableWeight)) {
      toast.error('Given Wt cannot exceed Available Qty.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Melting Entry Saved Successfully!');
      if (onSuccess) onSuccess({ selectedKarigar, rate, stamp, description, items });
      if (refetch) await refetch();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-lg flex max-h-[90vh] flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                Melting Process
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4 grid-cols-1">
            <div className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">

              {/* Card Inputs */}
              <div className="space-y-3">
                {/* Karigar & Rate */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                      Karigar <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedKarigar}
                      onChange={handleKarigarChange}
                      className="w-full h-8 px-2.5 text-xs font-semibold rounded border border-gray-300 bg-white focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="" disabled>Select</option>
                      {KARIGARS.map(k => (
                        <option key={k.id} value={k.name}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                      Rate (Rs)
                    </label>
                    <GenericInputField
                      type="text"
                      inputMode="decimal"
                      value={rate}
                      onChange={(e) => {
                        if (e.target.value === '' || /^\d*\.?\d{0,2}$/.test(e.target.value)) setRate(e.target.value);
                      }}
                      placeholder="e.g. 15"
                      compact
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Stamp (शिक्का) & Desc */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                      Stamp (शिक्का) <span className="text-red-500">*</span>
                    </label>
                    <GenericInputField
                      type="text"
                      value={stamp}
                      onChange={(e) => setStamp(e.target.value)}
                      placeholder="e.g. CH-995"
                      compact
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                      Description (तपशील)
                    </label>
                    <GenericInputField
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Details..."
                      compact
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Purity & Given Wt */}
                {items.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        Purity (%)
                      </label>
                      <GenericInputField
                        type="text"
                        value={items[0].purity as string}
                        onChange={() => { }}
                        suffix="%"
                        compact
                        disabled={true}
                        readOnly={true}
                        className="cursor-not-allowed border-[#c5b497] bg-[#eae3d5]/80 font-mono font-bold text-[#785600] shadow-inner dark:border-slate-600 dark:bg-slate-800 dark:text-amber-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        Given Wt (G) <span className="text-red-500">*</span>
                      </label>
                      <GenericInputField
                        type="text"
                        inputMode="decimal"
                        value={items[0].weight as string}
                        onChange={(e) => handleUpdateItem(items[0].id, 'weight', e.target.value)}
                        placeholder="0.000"
                        suffix="G"
                        compact
                        className="font-mono font-bold text-black"
                      />
                    </div>
                  </div>
                )}

                {/* Available Qty */}
                {items.length > 0 && (
                  <div>
                    <div className="mt-1.5 flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-[#785600] dark:bg-amber-900/30 dark:text-amber-300">
                      <span className="text-[11px] font-medium">
                        Gold Available Qty:
                      </span>
                      <span className="font-mono font-bold">
                        {formatNumberWithCommas(items[0].availableWeight, 3)} G
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 flex justify-end border-t border-[#d3c4af]/20 pt-3 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Add Entry'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeltingPopup;
