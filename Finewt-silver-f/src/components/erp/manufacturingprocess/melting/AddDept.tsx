import React from 'react';
import {X} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {ScrapCardData, formatNumberDisplay} from './meltingUtils';

interface AddDeptProps {
  showAddScrapModal: boolean;
  setShowAddScrapModal: (show: boolean) => void;
  handleSubmitAddScrap: (e?: React.FormEvent) => void;
  selectedPurity: number | '';
  handleSelectPurity: (purity: number | '') => void;
  scrapCards: ScrapCardData[];
  availableWeight: number;
  scrapWeight: string;
  setScrapWeight: (weight: string) => void;
  isSubmittingScrap: boolean;
  modalScaleProps: any;
}

const AddDept: React.FC<AddDeptProps> = ({
  showAddScrapModal,
  setShowAddScrapModal,
  handleSubmitAddScrap,
  selectedPurity,
  handleSelectPurity,
  scrapCards,
  availableWeight,
  scrapWeight,
  setScrapWeight,
  isSubmittingScrap,
  modalScaleProps,
}) => {
  if (!showAddScrapModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="mb-4 flex items-center justify-between border-b border-[#d3c4af]/20 pb-3 dark:border-slate-800">
          <h3 className="font-semibold text-[#1a1c1b] dark:text-white">
            Add Scrap for Melting
          </h3>
          <button
            type="button"
            onClick={() => setShowAddScrapModal(false)}
            className="text-gray-400 hover:bg-gray-100 rounded-lg p-1 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitAddScrap} className="space-y-4">
          {/* 1. Purity Select */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
              Purity (टंच) <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPurity}
              onChange={(e) => {
                const val =
                  e.target.value === '' ? '' : parseFloat(e.target.value);
                handleSelectPurity(val);
              }}
              className="w-full rounded-lg border border-[#d3c4af]/40 bg-white px-3 py-2 text-sm text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select Purity</option>
              {scrapCards.map((c) => (
                <option key={c.purity} value={c.purity}>
                  {c.purity}%
                </option>
              ))}
            </select>
          </div>

          {/* 2. Weight as per Purity */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
              Weight as per Purity (G)
            </label>
            <GenericInputField
              type="text"
              readOnly
              decimalScale={3}
              value={
                selectedPurity !== ''
                  ? formatNumberDisplay(availableWeight)
                  : ''
              }
              placeholder="0.000"
              suffix="G"
              compact
              className="font-mono cursor-not-allowed font-bold text-black dark:text-amber-400"
            />
          </div>

          {/* 3. One Scrap Weight Input Field */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1a1c1b] dark:text-slate-200">
              Scrap Weight (G)
            </label>
            <GenericInputField
              type="text"
              inputMode="decimal"
              decimalScale={3}
              value={scrapWeight}
              {...modalScaleProps}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*\.?\d*$/.test(val)) {
                  setScrapWeight(val);
                }
              }}
              placeholder="Enter scrap weight"
              suffix="G"
              compact
              className="font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="border-gray-100 mt-2 flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
            <GenericButton size="sm"
              type="submit"
              variant="primary"
              disabled={
                !selectedPurity ||
                !scrapWeight ||
                (parseFloat(scrapWeight) || 0) <= 0 ||
                isSubmittingScrap
              }
            >
              {isSubmittingScrap ? 'Submitting...' : 'Submit'}
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDept;
