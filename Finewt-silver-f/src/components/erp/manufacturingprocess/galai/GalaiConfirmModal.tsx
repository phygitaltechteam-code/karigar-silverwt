import React from 'react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { checkProcessLossAlert } from '@/lib/api/alertmanagement';
import { GalaiRow, AlertRule, formatNumberDisplay } from './galaiUtils';

interface GalaiConfirmModalProps {
  isOpen: boolean;
  saveIndex: number | null;
  galaiEntries: GalaiRow[];
  alertRules: AlertRule[];
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const GalaiConfirmModal: React.FC<GalaiConfirmModalProps> = ({
  isOpen,
  saveIndex,
  galaiEntries,
  alertRules,
  isLoading,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen || saveIndex === null) return null;
  const entry = galaiEntries[saveIndex];
  if (!entry) return null;

  const hasEnteredFine = Boolean(
    (entry.fineWeightRaw !== undefined &&
      entry.fineWeightRaw.trim() !== '') ||
    (entry.fineWeight !== undefined && entry.fineWeight > 0),
  );
  const fineToSend = hasEnteredFine
    ? Number(entry.fineWeight || 0)
    : Number(entry.expectedFine || 0);
  const lossToSend = hasEnteredFine
    ? entry.loss !== undefined && entry.loss !== null
      ? entry.loss
      : Math.max(
        0,
        Math.round(((entry.grossWt || entry.expectedFine) - fineToSend - (entry.scrapWeight || 0)) * 1000) / 1000,
      )
    : 0;
  const alertCheck = checkProcessLossAlert(
    entry.grossWt,
    entry.purity,
    lossToSend,
    alertRules,
    hasEnteredFine,
  );
  const diff = hasEnteredFine ? alertCheck?.diff || 0 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-2 text-lg font-bold text-[#1a1c1b] dark:text-white">
          Confirm Stocking Melted Gold
        </h3>
        <p className="mb-4 text-sm text-[#4f4535] dark:text-slate-400">
          Are you sure you want to send this melted fine gold to Stock?
        </p>

        <div className="bg-gray-50 mb-4 rounded-xl border border-[#d3c4af]/30 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-slate-400">
              Particular:
            </span>
            <span className="font-semibold text-black dark:text-white">
              {entry.particular}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-slate-400">
              Gross Wt:
            </span>
            <span className="font-mono font-semibold text-black dark:text-white">
              {formatNumberDisplay(entry.grossWt)} G
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-slate-400">
              Purity:
            </span>
            <span className="font-mono font-semibold text-black dark:text-white">
              {entry.purity}%
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-slate-400">
              Expected Fine (लगड):
            </span>
            <span className="font-mono font-semibold text-[#785600] dark:text-amber-400">
              {formatNumberDisplay(entry.expectedFine)} G
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-slate-400">
              Fine Wt (To Stock):
            </span>
            <div className="flex items-center gap-1">
              <span className="font-mono font-bold text-green-700 dark:text-green-400">
                {formatNumberDisplay(fineToSend)} G
              </span>
              {!hasEnteredFine && (
                <span className="text-gray-500 text-[10px] italic dark:text-slate-400">
                  (Expected Wt)
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500 dark:text-slate-400">
              Loss:
            </span>
            <div className="flex flex-col items-end">
              <span
                className={`font-mono font-bold ${
                  lossToSend > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-slate-300'
                }`}
              >
                Act: {formatNumberDisplay(lossToSend)} G
              </span>
              {alertCheck && (
                <div className="mt-0.5 flex flex-col items-end text-[10px] leading-tight text-gray-500 dark:text-slate-400">
                  <span>
                    Exp: {formatNumberDisplay(alertCheck.maxAllowedLoss || alertCheck.baseLoss || 0)} G
                  </span>
                  <span
                    className={
                      diff > 0
                        ? 'font-semibold text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-slate-400'
                    }
                  >
                    Diff: {diff > 0 ? `+${formatNumberDisplay(diff)}` : formatNumberDisplay(diff)} G
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg border px-4 py-2 text-sm font-semibold dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <GenericButton size="sm"
            type="button"
            onClick={onConfirm}
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Stocking...' : 'Confirm & Stock'}
          </GenericButton>
        </div>
      </div>
    </div>
  );
};
