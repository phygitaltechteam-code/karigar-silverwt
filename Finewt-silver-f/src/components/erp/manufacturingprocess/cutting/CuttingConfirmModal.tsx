import React from 'react';

interface CuttingConfirmModalProps {
  isOpen: boolean;
  actionType: 'stock' | 'kunda' | null;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CuttingConfirmModal: React.FC<CuttingConfirmModalProps> = ({
  isOpen,
  actionType,
  isLoading,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="p-6">
          <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
            Confirm Save
          </h3>

          <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
            Are you sure you want to save this cutting entry and go to the{' '}
            <strong className="text-[#785600] dark:text-amber-400">
              {actionType === 'kunda' ? 'S/Kunda' : 'Stock'}
            </strong>{' '}
            department?
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Confirm Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
