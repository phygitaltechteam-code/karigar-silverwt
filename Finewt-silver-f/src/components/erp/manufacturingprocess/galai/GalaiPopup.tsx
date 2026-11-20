import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Scale } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import ScaleWeightField from '@/components/common/ScaleWeightField';
import toast from 'react-hot-toast';
import { useGetAvailableStock, useGalaiReceive, useGetScrap } from '@/lib/api/galai';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface ScrapModalItem {
  id: string;
  purity: number;
  availableWeight: number;
}

export interface DynamicGalaiItem {
  id: string;
  purity: string | number;
  availableWeight: string | number;
  weight: string | number;
}

interface GalaiPopupProps {
  isOpen: boolean;
  onClose: () => void;
  scrapModalItems: ScrapModalItem[];
  refetchCuttingScrap?: () => Promise<any>;
  refetch: () => Promise<any>;
  onSuccess: () => void;
  onSubmitScrap?: (payload: any) => Promise<any>;
  onRemoveItem?: (purity: number) => void;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
const GalaiPopup: React.FC<GalaiPopupProps> = ({
  isOpen,
  onClose,
  scrapModalItems,
  refetch,
  onSuccess,
}) => {
  const [items, setItems] = useState<DynamicGalaiItem[]>([]);
  const [targetPurity, setTargetPurity] = useState<string>('');
  const [bronze, setBronze] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Raw silver available in Stock, per purity
  const { data: availableStock = [] } = useGetAvailableStock(isOpen);
  // Scrap collected from completed process entries, per purity
  const { data: rawScrap } = useGetScrap();
  const scrapStock: { purity: number; weight: number }[] = (Array.isArray(rawScrap) ? rawScrap : [])
    .map((s: any) => ({ purity: Number(s.purity) || 0, weight: Number(s.weight) || 0 }))
    .filter((s) => s.weight > 0.0005);
  const galaiReceive = useGalaiReceive();
  const availableFor = (purity: string | number): number => {
    const p = parseFloat(String(purity));
    if (isNaN(p)) return 0;
    const match = availableStock.find((s) => Math.abs(s.purity - p) < 0.001);
    return match ? match.weight : 0;
  };

  // ---------------- Initialize on open ----------------
  useEffect(() => {
    if (isOpen) {
      if (scrapModalItems && scrapModalItems.length > 0) {
        setItems(
          scrapModalItems.map((item, idx) => ({
            id: item.id || `item-${Date.now()}-${idx}`,
            purity: item.purity || '',
            availableWeight: item.availableWeight || 0,
            weight: '',
          })),
        );
      } else {
        setItems([
          {
            id: `item-${Date.now()}-1`,
            purity: '',
            availableWeight: '',
            weight: '',
          },
        ]);
      }
      setTargetPurity('');
      setBronze('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, scrapModalItems]);

  // ---------------- Row actions ----------------
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        purity: '',
        availableWeight: '',
        weight: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((it) => it.id !== id);
      return updated.length > 0
        ? updated
        : [
          {
            id: `item-${Date.now()}-1`,
            purity: '',
            availableWeight: '',
            weight: '',
          },
        ];
    });
  };

  const handlePurityChange = (val: string, setter: (val: string) => void) => {
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setter(val);
    }
  };

  const handleWeightChange = (val: string, setter: (val: string) => void) => {
    if (val === '' || /^\d*\.?\d{0,3}$/.test(val)) {
      setter(val);
    }
  };

  const handleUpdateItem = (
    id: string,
    field: keyof DynamicGalaiItem,
    val: string,
    isPurity: boolean,
  ) => {
    const regex = isPurity ? /^\d*\.?\d{0,2}$/ : /^\d*\.?\d{0,3}$/;
    if (val === '' || regex.test(val)) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) return { ...item, [field]: val };
          return item;
        }),
      );
    }
  };

  // ---------------- Computed values ----------------
  const totalReceivedWeight = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (parseFloat(item.weight as string) || 0),
      0,
    );
  }, [items]);

  const totalFineWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      const w = parseFloat(item.weight as string) || 0;
      const p = parseFloat(item.purity as string) || 0;
      return sum + (w * p) / 100;
    }, 0);
  }, [items]);

  const avgReceivedPurity = useMemo(() => {
    if (totalReceivedWeight > 0) {
      return (totalFineWeight / totalReceivedWeight) * 100;
    }
    return 0;
  }, [totalFineWeight, totalReceivedWeight]);

  const computedTargetWeight = useMemo(() => {
    const tp = parseFloat(targetPurity);
    if (!isNaN(tp) && tp > 0 && totalFineWeight > 0) {
      return totalFineWeight / (tp / 100);
    }
    return 0;
  }, [targetPurity, totalFineWeight]);

  useEffect(() => {
    if (computedTargetWeight > totalReceivedWeight && totalReceivedWeight > 0) {
      const br = computedTargetWeight - totalReceivedWeight;
      setBronze(br.toFixed(3));
    } else {
      setBronze('');
    }
  }, [computedTargetWeight, totalReceivedWeight]);

  // ---------------- Submit ----------------
  const handleSubmit = async () => {
    const rows = items
      .map((it) => ({
        purity: Number(it.purity) || 0,
        weight: Number(it.weight) || 0,
      }))
      .filter((it) => it.weight > 0);

    if (rows.length === 0) {
      toast.error('Enter the weight to take from stock.');
      return;
    }
    if (rows.some((r) => r.purity <= 0)) {
      toast.error('Enter purity for every row.');
      return;
    }
    // Same purity may appear on several rows: check the combined weight
    const byPurity = new Map<number, number>();
    rows.forEach((r) => byPurity.set(r.purity, (byPurity.get(r.purity) || 0) + r.weight));
    for (const [purity, weight] of byPurity) {
      const available = availableFor(purity);
      if (weight > available + 0.0005) {
        toast.error(
          `Only ${formatNumberWithCommas(available, 3)} G available at ${purity}% in stock.`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await galaiReceive.mutateAsync({
        items: rows,
        targetPurity: Number(targetPurity) || undefined,
        targetWeight: computedTargetWeight || undefined,
        bronze: Number(bronze) || undefined,
      });

      toast.success('Galai Entry Saved Successfully!');
      onSuccess();
      await refetch();
      onClose();
    } catch (error: any) {
      // Error toast is shown by the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- Formatters ----------------
  const formatNumberWithCommas = (num: number | string, maxDecimals = 3) => {
    if (!num && num !== 0) return '';
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(parsed)) return num.toString();

    let str = parsed.toFixed(maxDecimals);
    str = str.replace(/\.?0+$/, '');

    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const formatFixedDecimals = (num: number, minDecimals = 2) => {
    if (isNaN(num)) return '';
    let str = num.toFixed(minDecimals);
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  if (!isOpen) return null;

  // ---------------- Render ----------------
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-lg flex max-h-[90vh] flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                Silver Received & Melting
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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4 grid-cols-1">
            {/* ---------------- Materials Received Card ---------------- */}
            <div className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800/80">
              <div className="mb-3">
                <h4 className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                  Materials Received
                </h4>
                {/* Stock and scrap on hand, per purity (small reference text) */}
                <div className="mt-1 space-y-0.5 text-[11px] leading-snug text-[#817563] dark:text-slate-400">
                  <p>
                    <span className="font-semibold text-[#4f4535] dark:text-slate-300">Available stock: </span>
                    {availableStock.filter((s) => s.weight > 0.0005).length > 0
                      ? availableStock
                          .filter((s) => s.weight > 0.0005)
                          .map((s) => `${formatNumberWithCommas(s.purity, 2)}% · ${formatNumberWithCommas(s.weight, 3)} G`)
                          .join('  |  ')
                      : 'None'}
                  </p>
                  <p>
                    <span className="font-semibold text-[#4f4535] dark:text-slate-300">Scrap stock: </span>
                    {scrapStock.length > 0
                      ? scrapStock
                          .map((s) => `${formatNumberWithCommas(s.purity, 2)}% · ${formatNumberWithCommas(s.weight, 3)} G`)
                          .join('  |  ')
                      : 'None'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative rounded-lg border border-[#d3c4af]/20 bg-white p-3 dark:bg-slate-900/50"
                  >
                    {/* ✅ grid changed to 4 columns + 56px for buttons on one line */}
                    <div className="grid grid-cols-[1fr_1fr_1fr_56px] gap-2.5 items-end">
                      <div>
                        {idx === 0 && (
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                            Purity (%)
                          </label>
                        )}
                        <GenericInputField
                          type="text"
                          inputMode="decimal"
                          value={item.purity as string}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'purity', e.target.value, true)
                          }
                          placeholder="Purity"
                          suffix="%"
                          compact
                          className="font-mono text-xs"
                        />
                      </div>

                      <div>
                        {idx === 0 && (
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                            Available
                          </label>
                        )}
                        <GenericInputField
                          type="text"
                          inputMode="decimal"
                          value={
                            String(item.purity).trim() === ''
                              ? ''
                              : formatNumberWithCommas(availableFor(item.purity), 3) || '0'
                          }
                          onChange={() => { }}
                          placeholder="0.000"
                          compact
                          className="font-mono text-xs cursor-not-allowed bg-slate-50 text-slate-500 border-gray-200"
                          readOnly={true}
                        />
                      </div>

                      <div>
                        {idx === 0 && (
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                            Enter Wt
                          </label>
                        )}
                        <ScaleWeightField
                          onScaleWeight={(w) => handleUpdateItem(item.id, 'weight', String(w), false)}
                          type="text"
                          inputMode="decimal"
                          value={item.weight as string}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'weight', e.target.value, false)
                          }
                          placeholder="0.000"
                          compact
                          className="font-mono text-xs"
                        />
                      </div>

                      {/* ✅ Plus & Cross now on the SAME horizontal line */}
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          title="Add Row"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove Row"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gold/Silver Available Bar Style for Total */}
              <div className="mt-4 flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-[#785600] dark:bg-amber-900/30 dark:text-amber-300">
                <span className="font-bold">
                  Total Wt: {formatNumberWithCommas(totalReceivedWeight, 3)} G
                </span>
                <span className="font-bold">
                  Avg Purity:{' '}
                  {avgReceivedPurity > 0 ? formatNumberWithCommas(avgReceivedPurity, 2) : '0'}{' '}
                  %
                </span>
              </div>
            </div>

            {/* ---------------- Target Purity Card ---------------- */}
            <div className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800/80">
              <h4 className="mb-3 text-sm font-bold text-[#1a1c1b] dark:text-white">Target Specifications</h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                    Target Purity (%)
                  </label>
                  <GenericInputField
                    type="text"
                    inputMode="decimal"
                    value={targetPurity}
                    onChange={(e) => handlePurityChange(e.target.value, setTargetPurity)}
                    placeholder="0"
                    suffix="%"
                    compact
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                    Target Wt (G)
                  </label>
                  <GenericInputField
                    type="text"
                    readOnly
                    value={computedTargetWeight > 0 ? formatFixedDecimals(computedTargetWeight, 3) : ''}
                    placeholder="0.000"
                    suffix="G"
                    compact
                    className="font-mono text-xs cursor-not-allowed border-[#c5b497] bg-[#eae3d5]/80 font-bold text-[#785600]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                    Bronze (G)
                  </label>
                  <GenericInputField
                    type="text"
                    inputMode="decimal"
                    value={bronze}
                    onChange={(e) => handleWeightChange(e.target.value, setBronze)}
                    placeholder="0"
                    suffix="G"
                    compact
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || computedTargetWeight <= 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50 h-9 px-4 text-xs sm:text-[13px]"
          >
            <Plus className="h-4 w-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Galai Process'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalaiPopup;
