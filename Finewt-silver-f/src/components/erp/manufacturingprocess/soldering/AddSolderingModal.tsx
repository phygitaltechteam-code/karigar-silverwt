import React from 'react';
import { Layers, RotateCcw, X, Save } from 'lucide-react';
import { SolderingCardForm, formatNumberDisplay } from './solderingUtils';

interface AddSolderingModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalCards: SolderingCardForm[];
  selectedBoxForModal: {
    id: string;
    sizeId: string;
    size: string;
    purity: number;
    stamp?: string;
    totalWeight: number;
    design?: string;
  } | null;
  selectedStamp: string;
  selectedKarigar: string;
  selectedDesign: string;
  currentRate: string;
  solderingKarigarOptions: Array<{ id: string; name: string; address?: string }>;
  solderingDesignOptions: Array<{ id: string; designName: string; ratePerDesign?: string | number }>;
  setSelectedKarigar: (val: string) => void;
  setSelectedDesign: (val: string) => void;
  onOpenRevertModal: () => void;
  onSaveAll: () => void;
}

export const AddSolderingModal: React.FC<AddSolderingModalProps> = ({
  isOpen,
  onClose,
  modalCards,
  selectedBoxForModal,
  selectedStamp,
  selectedKarigar,
  selectedDesign,
  currentRate,
  solderingKarigarOptions,
  solderingDesignOptions,
  setSelectedKarigar,
  setSelectedDesign,
  onOpenRevertModal,
  onSaveAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-4xl flex max-h-[90vh] flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                Add Soldering Process
              </h3>
              <p className="text-xs text-[#4f4535] dark:text-slate-400">
                {modalCards.length}{' '}
                {modalCards.length === 1
                  ? 'soldering item'
                  : 'soldering items'}{' '}
                to configure
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRevertModal}
              className="flex items-center gap-1 rounded-lg border border-[#d3c4af]/40 px-2.5 py-1 text-xs font-semibold text-[#785600] transition-all hover:bg-[#785600]/10 dark:border-slate-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Revert</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Rows Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* Info Badge: Design, Purity, Weight, Stamp (शिक्का) on ONE line */}
          <div className="mb-4 rounded-xl border border-[#d3c4af]/40 bg-[#f8f6f0] p-3.5 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div>
                <span className="block font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Design
                </span>
                <span className="font-bold text-black dark:text-white sm:text-sm">
                  {selectedBoxForModal?.design || '-'}
                </span>
              </div>
              <div>
                <span className="block font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Purity % (टंच)
                </span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 sm:text-sm">
                  {selectedBoxForModal?.purity || modalCards[0]?.purity || '92.5'}%
                </span>
              </div>
              <div>
                <span className="block font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Weight
                </span>
                <span className="font-mono font-bold text-black dark:text-amber-400 sm:text-sm">
                  {formatNumberDisplay(
                    selectedBoxForModal?.totalWeight || modalCards[0]?.chainWeight || 0,
                  )}{' '}
                  G
                </span>
              </div>
              <div>
                <span className="block font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                  Stamp (शिक्का)
                </span>
                <span className="font-mono font-bold text-[#785600] dark:text-amber-400 sm:text-sm">
                  {selectedStamp || selectedBoxForModal?.stamp || 'BH-925'}
                </span>
              </div>
            </div>

            {/* Dropdowns for Karigar, Design & Disabled Rate (Auto from Design) */}
            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#d3c4af]/30 pt-3 dark:border-slate-700 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  Select Karigar (कारीगर) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedKarigar}
                  onChange={(e) => setSelectedKarigar(e.target.value)}
                  className="w-full rounded-lg border border-[#b8a892] bg-white px-3 py-1.5 text-xs font-medium text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  {solderingKarigarOptions.map((k) => (
                    <option key={k.id} value={k.name}>
                      {k.name} ({k.address || 'Local'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  Select Design (डिझाइन) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDesign}
                  onChange={(e) => setSelectedDesign(e.target.value)}
                  className="w-full rounded-lg border border-[#b8a892] bg-white px-3 py-1.5 text-xs font-medium text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  {solderingDesignOptions.map((d) => (
                    <option key={d.id} value={d.designName}>
                      {d.designName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                  Rate (Rs)
                </label>
                <input
                  type="text"
                  disabled
                  value={`₹ ${currentRate}`}
                  className="w-full rounded-lg border border-[#d3c4af]/50 bg-gray-100 px-3 py-1.5 text-xs font-mono font-bold text-[#785600] cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Save / Cancel Footer Actions */}
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#d3c4af]/30 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-[#4f4535] transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveAll}
              disabled={modalCards.some((c) => c.isSaving)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
