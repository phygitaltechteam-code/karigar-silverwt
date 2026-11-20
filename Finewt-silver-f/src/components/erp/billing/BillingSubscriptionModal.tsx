import React from 'react';
import {AlertTriangle, Key} from 'lucide-react';

interface BillingSubscriptionModalProps {
  isExpired: boolean;
  profileData: any;
  expiryDate?: string;
  enteredKey: string;
  setEnteredKey: (val: string) => void;
  keyError: string;
  setKeyError: (val: string) => void;
  handleKeySubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export const BillingSubscriptionModal: React.FC<
  BillingSubscriptionModalProps
> = ({
  isExpired,
  profileData,
  expiryDate,
  enteredKey,
  setEnteredKey,
  keyError,
  setKeyError,
  handleKeySubmit,
  isPending,
}) => {
  if (!isExpired) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-200/50 bg-white shadow-2xl dark:border-red-900/50 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-amber-600 p-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold tracking-wide">
            Subscription Expired
          </h3>
          <p className="mt-1 text-xs text-red-100">
            Your access period has expired. Please contact your admin to renew.
          </p>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 p-6">
          {/* Expiry Details Card */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            <div className="flex justify-between py-1">
              <span className="text-gray-500 dark:text-gray-400 font-semibold">
                User / Shop:
              </span>
              <span className="font-bold">
                {profileData?.user?.fullname || 'Admin Account'}
              </span>
            </div>
            {profileData?.user?.phoneNumber && (
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">
                  Phone:
                </span>
                <span>{profileData.user.phoneNumber}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-gray-500 dark:text-gray-400 font-semibold">
                Expired On:
              </span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {expiryDate
                  ? new Date(expiryDate).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Expired'}
              </span>
            </div>
          </div>

          {/* Key Submission Form */}
          <form onSubmit={handleKeySubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                Enter Renewal / Activation Key
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={enteredKey}
                  onChange={(e) => {
                    setEnteredKey(e.target.value);
                    if (keyError) setKeyError('');
                  }}
                  placeholder="e.g. XXXX-XXXX-XXXX-XXXX"
                  className={`font-mono w-full rounded-lg border px-3.5 py-2.5 text-xs uppercase text-[#1a1c1b] placeholder:text-[#817563] focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white ${
                    keyError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#d3c4af]/40 focus:border-[#785600] focus:ring-[#785600]/10 dark:border-slate-700'
                  }`}
                />
              </div>
              {keyError && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {keyError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#785600] to-[#986d00] font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 h-9 px-4 text-xs sm:text-[13px]"
            >
              <Key className="h-4 w-4" />
              <span>
                {isPending
                  ? 'Verifying & Activating...'
                  : 'Submit & Activate Key'}
              </span>
            </button>
          </form>

          {/* Contact Help */}
          <div className="text-gray-500 dark:text-gray-400 pt-1 text-center text-[11px]">
            <span>Need a new renewal key? Please contact your </span>
            <span className="font-semibold text-[#785600] dark:text-amber-400">
              System Administrator
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSubscriptionModal;
