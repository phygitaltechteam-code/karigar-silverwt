import React from 'react';
import { Plus, Trash2, Layers, X } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { TarCardForm, formatNumber } from './tarUtils';

interface AddTarModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalCards: TarCardForm[];
  handleRemoveCard: (index: number) => void;
  handleCardChange: (
    cardIndex: number,
    field: 'itemId' | 'sizeId' | 'grossWt' | 'purity' | 'fine',
    value: string,
  ) => void;
  getModalScaleProps: (index: number, field: any) => any;
  getGoldAvailableWeight: () => number;
  handleSaveCard: (index: number) => void;
}

const AddTarModal: React.FC<AddTarModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  modalCards,
  handleRemoveCard,
  handleCardChange,
  getModalScaleProps,
  getGoldAvailableWeight,
  handleSaveCard,
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div
        className={`w-full ${modalCards.length > 1 ? 'max-w-4xl' : 'max-w-lg'
          } flex max-h-[90vh] flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                Add Tar Process
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Cards Container */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className={`grid gap-4 ${modalCards.length > 1
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1'
              }`}
          >
            {modalCards.map((card, idx) => {
              const isCardSaving = card.isSaving || false;
              return (
                <div
                  key={card.id || idx}
                  className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
                >
                  <div className="mb-3 flex items-center justify-between">
                    {modalCards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(idx)}
                        disabled={isCardSaving}
                        className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                        title="Remove this card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Card Inputs */}
                  <div className="space-y-3">
                    {/* Fine Wt & Purity */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Fine Wt (लगड) <span className="text-red-500">*</span>
                        </label>
                        <GenericInputField
                          type="text"
                          inputMode="decimal"
                          decimalScale={3}
                          value={card.fine}
                          {...getModalScaleProps(idx, 'fine')}
                          onChange={(e) =>
                            handleCardChange(idx, 'fine', e.target.value)
                          }
                          placeholder="0.000"
                          suffix="G"
                          compact
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Purity (%) <span className="text-red-500">*</span>
                        </label>
                        <GenericInputField
                          type="text"
                          inputMode="decimal"
                          decimalScale={2}
                          value={card.purity}
                          onChange={(e) =>
                            handleCardChange(idx, 'purity', e.target.value)
                          }
                          placeholder="e.g. 93"
                          suffix="%"
                          compact
                          className="font-mono"
                        />
                      </div>
                    </div>

                    {/* Gross Wt (Disabled / Auto-calculated) */}
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Gross Wt (G)
                        </label>
                        <span className="text-[10px] font-semibold text-[#817563] dark:text-slate-400">
                          (Auto-calculated)
                        </span>
                      </div>
                      <GenericInputField
                        type="text"
                        inputMode="decimal"
                        decimalScale={3}
                        value={card.grossWt}
                        disabled={true}
                        readOnly={true}
                        placeholder="0.000"
                        suffix="G"
                        compact
                        className="cursor-not-allowed border-[#c5b497] bg-[#eae3d5]/80 font-mono font-bold text-[#785600] shadow-inner dark:border-slate-600 dark:bg-slate-800 dark:text-amber-400"
                      />

                      {/* Gold Available Qty */}
                      <div className="mt-1.5 flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-[#785600] dark:bg-amber-900/30 dark:text-amber-300">
                        <span className="text-[11px] font-medium">
                          Gold Available Qty:
                        </span>
                        <span className="font-mono font-bold">
                          {formatNumber(getGoldAvailableWeight())} G
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="mt-4 flex justify-end border-t border-[#d3c4af]/20 pt-3 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleSaveCard(idx)}
                      disabled={isCardSaving}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isCardSaving ? 'Adding...' : 'Add'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTarModal;
