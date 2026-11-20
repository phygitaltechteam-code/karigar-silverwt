// WashPopup.tsx - updated to use process select dropdown
import React, { useState, useEffect } from 'react';
import { useProcessKarigars } from '@/lib/api/karigar';
import { X, Waves, Plus } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import toast from 'react-hot-toast';

export interface ScrapModalItem {
  id: string;
  purity: number;
  availableWeight: number;
  Stamp?: string;
  stamp?: string;
}

export interface DynamicWashItem {
  id: string;
  purity: string | number;
  availableWeight: string | number;
  weight: string | number;
  Stamp?: string;
  stamp?: string;
}

interface WashPopupProps {
  isOpen: boolean;
  onClose: () => void;
  scrapModalItems: ScrapModalItem[];
  onSuccess?: (payload?: any) => void;
}


// Wash can send to: Cutting, Soldering, Sutt, Stock, Polishing
const NEXT_PROCESSES = ['Cutting', 'Soldering', 'Sutt', 'Stock', 'Polishing'];

export const formatNumberWithCommas = (value: number | string | undefined, decimals = 3) => {
  if (value === undefined || value === null || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value.toString();
  return num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const WashPopup: React.FC<WashPopupProps> = ({ isOpen, onClose, scrapModalItems, onSuccess }) => {
  const KARIGARS = useProcessKarigars('Wash', 'Self Karigar');
  const [items, setItems] = useState<DynamicWashItem[]>([]);
  const [selectedKarigar, setSelectedKarigar] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && scrapModalItems && scrapModalItems.length > 0) {
      setItems(scrapModalItems.map((sm) => ({ id: sm.id, purity: sm.purity, availableWeight: sm.availableWeight, weight: '', Stamp: sm.Stamp || sm.stamp || '' })));
    } else {
      setItems([]);
    }
  }, [isOpen, scrapModalItems]);

useEffect(() => {
  if (!isOpen) { setSelectedKarigar(''); setRate(''); setSelectedProcess(''); }
}, [isOpen]);

const selectedKarigarObj = KARIGARS.find((x) => x.name === selectedKarigar);
const baseKarigarRate = selectedKarigarObj ? selectedKarigarObj.defaultRate : 0;

const handleKarigarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const kName = e.target.value;
  setSelectedKarigar(kName);
  const k = KARIGARS.find((x) => x.name === kName);
  if (k) {
    const numWt = items.length > 0 ? (parseFloat(String(items[0].weight)) || 0) : 0;
    if (k.defaultRate > 0 && numWt > 0) {
      setRate(((k.defaultRate * numWt) / 1000).toFixed(2));
    } else {
      setRate(k.defaultRate.toString());
    }
  }
};

const handleUpdateItem = (id: string, value: string) => {
  setItems((prev) => prev.map((item) => {
    if (item.id === id && (value === '' || /^\d*\.?\d{0,3}$/.test(value))) {
      if (selectedKarigar) {
        const k = KARIGARS.find((x) => x.name === selectedKarigar);
        const baseRate = k ? k.defaultRate : 0;
        const numWt = parseFloat(value) || 0;
        if (baseRate > 0 && numWt > 0) {
          setRate(((baseRate * numWt) / 1000).toFixed(2));
        } else if (baseRate > 0) {
          setRate(baseRate.toString());
        }
      }
      return { ...item, weight: value };
    }
    return item;
  }));
};

const handleSubmit = async () => {
  if (!selectedKarigar) { toast.error('Please select a Karigar.'); return; }
  if (!selectedProcess) { toast.error('Please select a Process.'); return; }
  const item = items[0];
  if (!item) return;
  const inputWeight = parseFloat(item.weight.toString()) || 0;
  if (inputWeight <= 0) { toast.error('Given Wt must be greater than 0.'); return; }
  if (inputWeight > Number(item.availableWeight)) { toast.error('Given Wt cannot exceed Available Qty.'); return; }

  setIsSubmitting(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 400));
    if (onSuccess) onSuccess({ selectedKarigar, rate, selectedProcess, items });
    onClose();
  } catch (error: any) {
    toast.error(error.message || 'Failed to save entry');
  } finally {
    setIsSubmitting(false);
  }
};

if (!isOpen) return null;

return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
    <div className="w-full max-w-md flex max-h-[90vh] flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
            <Waves className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">Send from Wash Stock</h3>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">Send to Process <span className="text-red-500">*</span></label>
              <select value={selectedProcess} onChange={(e) => setSelectedProcess(e.target.value)} className="w-full h-8 px-2.5 text-xs font-semibold rounded border border-gray-300 bg-white focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="" disabled>Select Process</option>
                {NEXT_PROCESSES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">Karigar <span className="text-red-500">*</span></label>
                <select value={selectedKarigar} onChange={handleKarigarChange} className="w-full h-8 px-2.5 text-xs font-semibold rounded border border-gray-300 bg-white focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <option value="" disabled>Select</option>
                  {KARIGARS.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                </select>
              </div>
              {items.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">Given Wt (G) <span className="text-red-500">*</span></label>
                  <GenericInputField type="text" inputMode="decimal" value={items[0].weight as string} onChange={(e) => handleUpdateItem(items[0].id, e.target.value)} placeholder="0.000" suffix="G" compact className="font-mono font-bold text-black dark:text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">Rate (Rs)</label>
                  {baseKarigarRate > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400" title="Fixed Base Rate per KG">
                      ₹{baseKarigarRate}/KG
                    </span>
                  )}
                </div>
                <GenericInputField type="text" inputMode="decimal" value={rate} onChange={(e) => { if (e.target.value === '' || /^\d*\.?\d{0,2}$/.test(e.target.value)) setRate(e.target.value); }} placeholder="e.g. 15" compact className="font-mono" />
              </div>
            </div>

            {items.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-[#785600] dark:bg-amber-900/30 dark:text-amber-300">
                <span className="text-[11px] font-medium">Available Qty:</span>
                <span className="font-mono font-bold">{formatNumberWithCommas(items[0].availableWeight, 3)} G</span>
              </div>
            )}
        </div>
      </div>

      <div className="border-t border-[#d3c4af]/20 p-4 dark:border-slate-800">
        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50 h-9 px-4 text-xs sm:text-[13px]">
          <Plus className="h-4 w-4" />
          <span>{isSubmitting ? 'Sending...' : 'Send to Process'}</span>
        </button>
      </div>
    </div>
  </div>
);
};

export default WashPopup;
