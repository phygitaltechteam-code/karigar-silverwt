import React from 'react';
import {AlertCircle, Loader2, FileText} from 'lucide-react';

interface StockErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAsDraft: () => void;
  isSubmitting: boolean;
}

export const StockErrorModal: React.FC<StockErrorModalProps> = ({
  isOpen,
  onClose,
  onSaveAsDraft,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-[#d3c4af]/20 bg-red-50/80 px-5 py-3.5 dark:border-slate-700 dark:bg-red-950/30">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-sm font-bold text-[#1a1c1b] dark:text-white">
            Insufficient Stock (स्टॉक कम है)
          </h3>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs leading-relaxed text-[#4f4535] dark:text-slate-300">
            Not enough stock available to complete this bill. You can save it as
            a draft.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d3c4af]/40 px-3.5 py-1.5 text-xs font-semibold text-[#4f4535] transition-colors hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSaveAsDraft}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#d97706] to-[#92400e] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockErrorModal;
