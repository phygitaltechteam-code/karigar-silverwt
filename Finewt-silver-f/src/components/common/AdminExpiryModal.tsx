import React, {useState} from 'react';
import {Key, AlertTriangle, ShieldAlert, CheckCircle2} from 'lucide-react';
import toast from 'react-hot-toast';
import {useGetProfileData, useActivateKey} from '@/lib/api/profile';
import {useAuthContext} from '@/context/AuthContext';

export const AdminExpiryModal: React.FC = () => {
  const {user} = useAuthContext();
  const profileQuery = useGetProfileData();
  const profileData = profileQuery?.data?.data || profileQuery?.data;

  const [enteredKey, setEnteredKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const activateKeyMutation = useActivateKey();

  // Only run check for non-SUPERADMIN roles
  if (user?.role === 'SUPERADMIN') {
    return null;
  }

  const expiryDate = profileData?.expiryDate;
  const extendDays = Number(profileData?.extendDays) || 0;
  const storedKey = profileData?.key || profileData?.extendKey;

  // Calculate effective expiry time including extension days
  let effectiveExpiryTime = expiryDate ? new Date(expiryDate).getTime() : NaN;
  if (!isNaN(effectiveExpiryTime) && extendDays > 0) {
    effectiveExpiryTime += extendDays * 86400000;
  }

  const isExpired =
    !isNaN(effectiveExpiryTime) &&
    Date.now() > effectiveExpiryTime &&
    !isUnlocked;

  if (!isExpired) {
    return null;
  }

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = enteredKey.trim().toUpperCase();
    if (!cleanKey) {
      setKeyError('Please enter your license / activation key');
      return;
    }

    activateKeyMutation.mutate(
      {key: cleanKey},
      {
        onSuccess: () => {
          setIsUnlocked(true);
          setKeyError('');
          setEnteredKey('');
          // toast.success('License activated successfully!');
          profileQuery.refetch();
        },
        onError: (err: any) => {
          // If stored key matches offline fallback, unlock
          if (storedKey && cleanKey === storedKey.trim().toUpperCase()) {
            setIsUnlocked(true);
            setKeyError('');
            toast.success('License verified successfully!');
            profileQuery.refetch();
          } else {
            const errorMsg =
              err?.message ||
              'Invalid key. Please contact your administrator for a valid renewal key.';
            setKeyError(errorMsg);
          }
        },
      },
    );
  };

  const formattedExpiry = !isNaN(effectiveExpiryTime)
    ? new Date(effectiveExpiryTime).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'Expired';

  return (
    <div className="animate-in fade-in fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 bg-white shadow-2xl dark:border-red-900/50 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-amber-600 px-6 py-5 text-center text-white">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-wide">
            Subscription Expired
          </h2>
          <p className="mt-1 text-xs text-white/90">
            Your software license validity has ended.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Account Details Box */}
          <div className="mb-4 space-y-1.5 rounded-xl border border-[#d3c4af]/30 bg-[#f9f9f7] p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex justify-between py-1">
              <span className="font-medium text-[#4f4535] dark:text-slate-400">
                User / Shop:
              </span>
              <span className="font-bold text-[#1a1c1b] dark:text-white">
                {profileData?.user?.fullname ||
                  profileData?.shopName ||
                  user?.fullname ||
                  'Admin Account'}
              </span>
            </div>
            {(profileData?.user?.phoneNumber || profileData?.phoneNumber) && (
              <div className="flex justify-between py-1">
                <span className="font-medium text-[#4f4535] dark:text-slate-400">
                  Mobile Number:
                </span>
                <span className="font-medium text-[#1a1c1b] dark:text-white">
                  {profileData?.user?.phoneNumber || profileData?.phoneNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#d3c4af]/20 pt-1.5 dark:border-slate-700">
              <span className="font-medium text-[#4f4535] dark:text-slate-400">
                Expired On:
              </span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {formattedExpiry}
              </span>
            </div>
          </div>

          {/* Key Submission Form */}
          <form onSubmit={handleKeySubmit} className="space-y-3.5">
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
                  className={`font-mono w-full rounded-xl border px-3.5 py-2.5 text-xs uppercase tracking-wider text-[#1a1c1b] placeholder:text-[#817563] focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white ${
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
              disabled={activateKeyMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#785600] to-[#986d00] font-bold text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 h-9 px-4 text-xs sm:text-[13px]"
            >
              <Key className="h-4 w-4" />
              <span>
                {activateKeyMutation.isPending
                  ? 'Verifying & Activating...'
                  : 'Submit & Unlock Access'}
              </span>
            </button>
          </form>

          {/* Contact Support Note */}
          <div className="text-gray-500 dark:text-gray-400 mt-4 border-t border-[#d3c4af]/20 pt-3 text-center text-[11px] dark:border-slate-800">
            <span>To renew your license or get an extension key, contact </span>
            <span className="font-semibold text-[#785600] dark:text-amber-400">
              System Support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExpiryModal;
