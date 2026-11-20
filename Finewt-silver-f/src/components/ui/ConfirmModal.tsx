import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="p-6">
          <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
            {title}
          </h3>
          <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
            {message}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="rounded-lg bg-[#8c6b2e] font-bold text-white transition-colors hover:bg-[#785600] disabled:cursor-not-allowed disabled:opacity-50 h-9 px-4 text-xs sm:text-[13px]"
            >
              {isLoading ? 'Processing...' : 'Confirm & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
