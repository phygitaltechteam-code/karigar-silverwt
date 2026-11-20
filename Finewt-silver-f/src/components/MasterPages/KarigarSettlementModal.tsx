import React, { useState, useRef, useEffect } from 'react';
import {
  Wallet,
  X,
  User,
  Phone,
  MapPin,
  Minus,
  Plus,
  ArrowRight,
  CheckCircle,
  Loader2,
  Tag,
} from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { UnifiedKarigarEntry } from './unifiedKarigarHelpers';
import { useUpdateKarigar } from '@/lib/api/karigar';
import toast from 'react-hot-toast';

interface KarigarSettlementModalProps {
  isOpen: boolean;
  karigar: UnifiedKarigarEntry | null;
  onClose: () => void;
  onSettled?: (updatedKarigar: UnifiedKarigarEntry) => void;
}

export const KarigarSettlementModal: React.FC<KarigarSettlementModalProps> = ({
  isOpen,
  karigar,
  onClose,
  onSettled,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [settlementType, setSettlementType] = useState<'receive' | 'give'>('receive');
  const [localAmount, setLocalAmount] = useState<string>('');
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const updateKarigarMutation = useUpdateKarigar();

  useEffect(() => {
    if (isOpen) {
      setSettlementType('receive');
      setLocalAmount('');
      setSettlementAmount(0);
      setShowConfirmModal(false);
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, karigar]);

  if (!isOpen || !karigar) return null;

  const currentBalance = Number(karigar.openingBalance || 0);

  // Opposite of a client: Receive (from karigar) = plus, Give (to karigar) = minus
  const remainingBalance =
    settlementType === 'receive'
      ? currentBalance + settlementAmount
      : currentBalance - settlementAmount;

  const handleProceedToConfirm = () => {
    if (!settlementAmount || settlementAmount <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!settlementAmount || settlementAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalNewBalance = Number(remainingBalance.toFixed(3));

      // Create ledger entry
      const ledgerEntry = {
        id: `lg-${Date.now()}`,
        date: new Date().toISOString(),
        stage: `${karigar.processType} Settlement`,
        action: settlementType === 'receive' ? ('RECEIVE' as const) : ('ISSUE' as const),
        type: settlementType === 'receive' ? ('DEBIT' as const) : ('CREDIT' as const),
        grossWeight: settlementAmount,
        fineWeight: settlementAmount,
        purity: 100,
        balance: finalNewBalance,
        remarks: `Settlement (${settlementType.toUpperCase()})`,
      };

      const updatedLedger = [ledgerEntry, ...(karigar.ledger || [])];

      const updatedEntry: UnifiedKarigarEntry = {
        ...karigar,
        openingBalance: finalNewBalance,
        ledger: updatedLedger,
      };

      // Call API
      await updateKarigarMutation.mutateAsync({
        id: karigar.id,
        data: {
          openingBalance: finalNewBalance,
        },
      });

      if (onSettled) {
        onSettled(updatedEntry);
      }

      toast.success(
        `Settlement saved! New balance: ${finalNewBalance.toFixed(3)} G`,
      );
      setShowConfirmModal(false);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to complete settlement';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. SETTLEMENT INPUT MODAL */}
      {!showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-slate-900 border border-[#d3c4af]/30 dark:border-slate-800"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-5 py-3 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#785600] dark:text-amber-400" />
                <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                  Karigar Settlement
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-5">
              {/* KARIGAR INFORMATION */}
              <div className="mb-4 space-y-2 border-b border-[#d3c4af]/20 pb-4 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#785600] dark:text-amber-400" />
                    <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
                      {karigar.name}
                    </span>
                  </div>
                  <span className="rounded-full bg-[#785600]/10 px-2 py-0.5 text-[11px] font-bold text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
                    {karigar.processType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#785600] dark:text-amber-400" />
                  <span className="text-xs text-[#1a1c1b] dark:text-white">
                    {karigar.number || 'No Mobile'}
                  </span>
                </div>

                {karigar.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-[#785600] dark:text-amber-400" />
                    <span className="text-xs text-[#1a1c1b] dark:text-white">
                      {karigar.address}
                    </span>
                  </div>
                )}

                <div className="mt-2 grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-[#f9f9f7] p-2 dark:bg-slate-800/60">
                    <p className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400">
                      Due / Current Balance
                    </p>
                    <p className="font-mono text-sm font-bold text-[#785600] dark:text-amber-400">
                      {currentBalance.toFixed(3)} G
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f9f9f7] p-2 dark:bg-slate-800/60">
                    <p className="text-[10px] font-medium text-[#4f4535] dark:text-slate-400">
                      Rate (/Kg)
                    </p>
                    <p className="font-mono text-sm font-bold text-[#1a1c1b] dark:text-white">
                      {karigar.rate ? `${karigar.rate}` : 'Standard'}
                    </p>
                  </div>
                </div>
              </div>

              {/* RECEIVE / GIVE BUTTONS */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSettlementType('receive');
                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    }, 50);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    settlementType === 'receive'
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300 shadow-sm'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Receive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettlementType('give');
                    setTimeout(() => {
                      inputRef.current?.focus();
                      inputRef.current?.select();
                    }, 50);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    settlementType === 'give'
                      ? 'border-red-500 bg-red-100 text-red-800 ring-2 ring-red-300 shadow-sm'
                      : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  Give
                </button>
              </div>

              {/* AMOUNT INPUT */}
              <div className="mb-3">
                <GenericInputField
                  inputRef={inputRef}
                  name="settlementAmount"
                  type="text"
                  inputMode="decimal"
                  label="Amount (G) *"
                  value={localAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*\.?\d{0,3}$/.test(value)) {
                      return;
                    }
                    setLocalAmount(value);
                    if (value === '') {
                      setSettlementAmount(0);
                      return;
                    }
                    const num = Number(value);
                    if (!Number.isNaN(num)) {
                      setSettlementAmount(num);
                    }
                  }}
                  onBlur={() => {
                    const num = Number(localAmount);
                    if (localAmount === '' || Number.isNaN(num)) {
                      setLocalAmount('');
                      setSettlementAmount(0);
                      return;
                    }
                    const finalNum = Number(Math.max(num, 0).toFixed(3));
                    setSettlementAmount(finalNum);
                    setLocalAmount(finalNum > 0 ? finalNum.toFixed(3) : '');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleProceedToConfirm();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      onClose();
                    }
                  }}
                  placeholder="Enter weight in grams (e.g. 15.250)"
                  suffix="G"
                />
              </div>

              {/* REMAINING / NEW BALANCE PREVIEW */}
              {settlementAmount > 0 && (
                <div className="mb-4 rounded-lg border border-[#d3c4af]/20 bg-[#f9f9f7] px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#4f4535] dark:text-slate-400">
                      New Due Balance:
                    </span>
                    <span className="font-mono text-sm font-bold text-[#785600] dark:text-amber-400">
                      {remainingBalance.toFixed(3)} G
                    </span>
                  </div>
                </div>
              )}

              {/* ACTION BUTTON */}
              <button
                type="button"
                onClick={handleProceedToConfirm}
                disabled={settlementAmount <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#785600] font-medium text-white transition-colors hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm h-9 px-4 text-xs sm:text-[13px]"
              >
                <ArrowRight className="h-4 w-4" />
                Proceed to Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-slate-900 border border-[#d3c4af]/30 dark:border-slate-800"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 absolute right-3 top-3 rounded-lg p-1.5 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#785600]/10 dark:bg-amber-400/10">
                  <CheckCircle className="h-6 w-6 text-[#785600] dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                  Confirm Settlement
                </h2>
                <p className="text-xs text-[#4f4535] dark:text-slate-400">
                  Please review the settlement details
                </p>
              </div>

              <div className="mb-5 space-y-2.5 rounded-lg border border-[#d3c4af]/20 bg-[#f9f9f7] p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex justify-between text-sm">
                  <span className="text-[#4f4535] dark:text-slate-400">Karigar:</span>
                  <span className="font-semibold text-[#1a1c1b] dark:text-white">
                    {karigar.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4f4535] dark:text-slate-400">Process:</span>
                  <span className="font-medium text-[#1a1c1b] dark:text-white">
                    {karigar.processType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4f4535] dark:text-slate-400">Action:</span>
                  <span
                    className={`font-bold ${
                      settlementType === 'receive'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {settlementType === 'receive' ? 'Receive' : 'Give'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4f4535] dark:text-slate-400">Amount:</span>
                  <span className="font-mono font-bold text-[#1a1c1b] dark:text-white">
                    {settlementAmount.toFixed(3)} G
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4f4535] dark:text-slate-400">Current Due:</span>
                  <span className="font-mono text-[#1a1c1b] dark:text-white">
                    {currentBalance.toFixed(3)} G
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#d3c4af]/20 pt-2 text-sm dark:border-slate-700">
                  <span className="font-semibold text-[#4f4535] dark:text-slate-300">
                    New Due Balance:
                  </span>
                  <span className="font-mono font-bold text-[#785600] dark:text-amber-400">
                    {remainingBalance.toFixed(3)} G
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#785600] font-medium text-white transition-colors hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm h-9 px-4 text-xs sm:text-[13px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Confirm & Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KarigarSettlementModal;
