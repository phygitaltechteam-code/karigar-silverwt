import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Building2 } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericDropDown from '@/components/Forms/DropDown/GenericDropDown';
import toast from 'react-hot-toast';
import { useGetItems } from '@/lib/api/items';
import { useProcessKarigars } from '@/lib/api/karigar';
import { confirmAction } from '@/utils/confirmAction';

export interface CompanyPartItem {
  id: string;
  purity: number;
  totalWeight: number;
  stamp?: string;
  description?: string;
}

export interface CompanyPartRow {
  id: string;
  partNo: string;
  weight: string;
  karigar: string;
  rate?: string;
}

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCard: CompanyPartItem | null;
  onSaveParts: (
    design: string,
    parts: Array<{ partNo: string; weight: number; karigar: string; rate?: number }>,
    totalWeightUsed: number,
    nextProcess: string,
  ) => void;
}

const FALLBACK_DESIGNS: string[] = [];

const FALLBACK_KARIGARS = ['Self'];

export const formatNumberDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(num);
};

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  onClose,
  selectedCard,
  onSaveParts,
}) => {
  const { data: itemsData } = useGetItems();

  // Karigars for this process from the Karigar Master (Self first)
  const processKarigars = useProcessKarigars('Company');
  const masterKarigars = processKarigars.map((k) => k.name);
  const rateOfKarigar = (name: string) =>
    String(processKarigars.find((k) => k.name === name)?.defaultRate ?? 0);

  const nextProcessOptions = ['Press', 'Sutt', 'Wash'];
  const [selectedProcess, setSelectedProcess] = useState<string>('Press');
  const [selectedDesign, setSelectedDesign] = useState<string>('');
  const [partRows, setPartRows] = useState<CompanyPartRow[]>([
    {
      id: 'part-1',
      partNo: '1',
      weight: '',
      karigar: 'Self',
      rate: '0',
    },
  ]);

  const designOptions = React.useMemo(() => {
    const apiItems = Array.isArray((itemsData as any)?.data)
      ? (itemsData as any).data.map((i: any) => i.name)
      : Array.isArray(itemsData)
        ? itemsData.map((i: any) => i.name)
        : [];
    const set = new Set([...FALLBACK_DESIGNS, ...apiItems]);
    return Array.from(set);
  }, [itemsData]);

  const designDropdownOptions = React.useMemo(() => {
    return designOptions.map((d) => ({ value: d, label: d }));
  }, [designOptions]);

  const karigarDropdownOptions = React.useMemo(() => {
    return masterKarigars.map((k) => ({ value: k, label: k }));
  }, [masterKarigars]);

  const processDropdownOptions = React.useMemo(() => {
    return nextProcessOptions.map((p) => ({ value: p, label: p }));
  }, [nextProcessOptions]);

  useEffect(() => {
    if (isOpen && selectedCard) {
      setSelectedDesign(designOptions[0] || FALLBACK_DESIGNS[0] || '');
      setPartRows([
        {
          id: `part-1-${Date.now()}`,
          partNo: '1',
          weight: selectedCard.totalWeight > 0 ? selectedCard.totalWeight.toString() : '',
          karigar: 'Self',
          rate: '0',
        },
      ]);
    }
  }, [isOpen, selectedCard, designOptions]);

  if (!isOpen || !selectedCard) return null;

  const totalEnteredWeight = partRows.reduce((sum, row) => {
    const val = parseFloat(row.weight);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const remainingStock = Math.round((selectedCard.totalWeight - totalEnteredWeight) * 1000) / 1000;
  const isExceeded = remainingStock < 0;

  const handleAddRow = () => {
    const nextIndex = partRows.length + 1;
    const defaultKarigar = masterKarigars[(nextIndex - 1) % Math.max(masterKarigars.length, 1)];
    setPartRows((prev) => [
      ...prev,
      {
        id: `part-${Date.now()}-${nextIndex}`,
        partNo: `${nextIndex}`,
        weight: '',
        karigar: defaultKarigar || 'Self',
        rate: '0',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (partRows.length <= 1) {
      toast.error('At least one Part row is required.');
      return;
    }
    const updated = partRows
      .filter((row) => row.id !== id)
      .map((row, idx) => ({
        ...row,
        partNo: `${idx + 1}`,
      }));
    setPartRows(updated);
  };

  const handleRowChange = (
    id: string,
    field: 'weight' | 'karigar' | 'rate',
    value: string,
  ) => {
    setPartRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          if (field === 'karigar') {
            return { ...row, karigar: value, rate: rateOfKarigar(value) };
          }
          return { ...row, [field]: value };
        }
        return row;
      }),
    );
  };

  const handleSave = async () => {
    if (totalEnteredWeight <= 0) {
      toast.error('Please enter weight for at least one Part.');
      return;
    }

    if (isExceeded) {
      toast.error(
        `Entered weight (${formatNumberDisplay(totalEnteredWeight)} G) exceeds available stock (${formatNumberDisplay(selectedCard.totalWeight)} G)!`,
      );
      return;
    }

    const validParts = partRows
      .filter((row) => {
        const wt = parseFloat(row.weight);
        return !isNaN(wt) && wt > 0;
      })
      .map((row) => ({
        partNo: row.partNo,
        weight: parseFloat(row.weight),
        karigar: row.karigar.trim() || 'Self',
        rate: parseFloat(row.rate || '0') || 0,
      }));

    if (validParts.length === 0) {
      toast.error('Please enter valid positive weight for parts.');
      return;
    }

    const confirmed = await confirmAction(
      'Confirm Save Parts',
      `Are you sure you want to save ${validParts.length} part(s) totaling ${formatNumberDisplay(totalEnteredWeight)} G to ${selectedProcess}?`,
    );
    if (!confirmed) return;

    onSaveParts(selectedDesign, validParts, totalEnteredWeight, selectedProcess);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-2xl flex max-h-[90vh] flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                Company Process Parts Entry
              </h3>
              <p className="text-xs text-[#817563] dark:text-slate-400">
                Purity: {selectedCard.purity}% &bull; Available Weight:{' '}
                <span className="font-semibold text-[#1a1c1b] dark:text-slate-200">
                  {formatNumberDisplay(selectedCard.totalWeight)} G
                </span>
                {selectedCard.stamp && (
                  <span className="ml-1.5 font-mono text-xs font-medium text-[#785600] dark:text-amber-400">
                    ({selectedCard.stamp})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Design & Process Card */}
          <div className="rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Select Design (डिझाइन निवड) <span className="text-red-500">*</span>
                </label>
                <GenericDropDown
                  options={designDropdownOptions}
                  value={selectedDesign}
                  onChange={(val) => setSelectedDesign(val)}
                  placeholder="Select Design"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Next Process <span className="text-red-500">*</span>
                </label>
                {nextProcessOptions.length === 1 ? (
                  <input
                    type="text"
                    value={nextProcessOptions[0]}
                    disabled
                    readOnly
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed"
                  />
                ) : (
                  <GenericDropDown
                    options={processDropdownOptions}
                    value={selectedProcess}
                    onChange={(val) => setSelectedProcess(val)}
                    placeholder="Select Process"
                    className="w-full text-xs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Parts Table Card */}
          <div className="rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Parts Entry Table (भाग तपशील)
              </label>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#d3c4af]/30 bg-white dark:border-slate-700 dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#d3c4af]/30 bg-[#f4f1eb]/80 text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-center w-14">Part No</th>
                    <th className="px-3 py-2 font-semibold w-28">Weight (G)</th>
                    <th className="px-3 py-2 font-semibold w-40">Karigar</th>
                    <th className="px-3 py-2 font-semibold w-24">Rate (Rs)</th>
                    <th className="px-3 py-2 text-center font-semibold w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                  {partRows.map((row) => (
                    <tr key={row.id} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/60">
                      <td className="px-3 py-2 text-center font-bold text-[#785600] dark:text-amber-400">
                        Part {row.partNo}
                      </td>
                      <td className="px-2 py-1.5">
                        <GenericInputField
                          type="text"
                          inputMode="decimal"
                          decimalScale={3}
                          value={row.weight}
                          onChange={(e) => handleRowChange(row.id, 'weight', e.target.value)}
                          placeholder="0.000"
                          suffix="G"
                          compact
                          className="font-mono"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <GenericDropDown
                          options={karigarDropdownOptions}
                          value={row.karigar}
                          onChange={(val) => handleRowChange(row.id, 'karigar', val)}
                          placeholder="Select Karigar"
                          className="w-full text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <GenericInputField
                          type="text"
                          inputMode="decimal"
                          decimalScale={2}
                          value={row.rate ?? ''}
                          onChange={(e) => handleRowChange(row.id, 'rate', e.target.value)}
                          placeholder="15"
                          compact
                          className="font-mono text-right"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={handleAddRow}
                            title="Add Part Row"
                            className="rounded p-1 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          {partRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              title="Remove Row"
                              className="rounded p-1 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700 cursor-pointer"
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
          </div>

          {/* Stock Available Bar */}
          <div
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
              isExceeded
                ? 'border border-red-300 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400'
                : 'border border-amber-200/50 bg-amber-500/10 text-[#785600] dark:border-amber-700/30 dark:bg-amber-900/30 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium">Stock Available (उपलब्ध साठा):</span>
              <strong
                className={
                  isExceeded
                    ? 'font-mono text-red-600 dark:text-red-400'
                    : 'font-mono font-bold text-[#785600] dark:text-amber-400'
                }
              >
                {formatNumberDisplay(remainingStock)} G
              </strong>
            </div>
            <span className="text-[11px] text-[#817563] dark:text-slate-400">
              Card Total: {formatNumberDisplay(selectedCard.totalWeight)} G
            </span>
          </div>
          {isExceeded && (
            <p className="px-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
              ⚠️ Entered total weight ({formatNumberDisplay(totalEnteredWeight)} G) exceeds available card stock!
            </p>
          )}
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isExceeded || totalEnteredWeight <= 0}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] font-bold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50 cursor-pointer h-9 px-4 text-xs sm:text-[13px]"
          >
            <span>{selectedProcess ? `Save to ${selectedProcess}` : 'Save Entry'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyModal;
