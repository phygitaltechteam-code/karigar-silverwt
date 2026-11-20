import {useState, useEffect, useRef} from 'react';
import TabBar, { TabItem } from '@/components/common/TabBar';
import {Lock, Loader2, CheckCircle2, Eye, EyeOff} from 'lucide-react';
import toast from 'react-hot-toast';
import {useAccessForBackup, useUpdateProfile} from '@/lib/api/profile';
import AdminProfile from './AdminProfile';
import HeaderPdfDesign from './HeaderPdfDesign';
import BackupAndRestorePage from './Backup&RestorePage';
import ScaleSetting from './ScaleSetting';
import AlertManagement from './AlertManagement';
import GenericButton from './Forms/Buttons/GenericButton';
import GenericInputField from './Forms/Input/GenericInputField';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'header' | 'backup' | 'scale' | 'alert'
  >('profile');

  const [isBackupUnlocked, setIsBackupUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  // The unlock field stays hidden until Ctrl+Shift+B is pressed
  const [showPinField, setShowPinField] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useAccessForBackup();

  // Ctrl+Shift+B: show the hidden field (unlocked: open the Backup & Restore tab). Esc hides it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (isBackupUnlocked) {
          setActiveTab('backup');
          return;
        }
        setShowPinField(true);
        setTimeout(() => pinInputRef.current?.focus(), 0);
      } else if (e.key === 'Escape') {
        setShowPinField(false);
        setAdminPassword('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isBackupUnlocked]);

  // Once unlocked (or locked again) the field goes back to hidden
  useEffect(() => {
    setShowPinField(false);
  }, [isBackupUnlocked]);

  // Automatically call the API to verify password as user enters it
  useEffect(() => {
    const trimmed = adminPassword.trim();
    if (!trimmed || isBackupUnlocked) return;

    const timer = setTimeout(async () => {
      setIsVerifying(true);
      try {
        const res: any = await updateProfileMutation.mutateAsync({
          password: trimmed,
        });

        if (res?.data !== true) {
          return;
        }

        setIsBackupUnlocked(true);
        setActiveTab('backup');
        setAdminPassword('');
        toast.success('Access granted: Backup & Restore tab unlocked!', {
          id: 'password-verify',
        });
      } catch (error: any) {
        // Suppress backend error message as requested
      } finally {
        setIsVerifying(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [adminPassword, isBackupUnlocked]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = adminPassword.trim();
      if (!trimmed) return;

      setIsVerifying(true);
      try {
        const res: any = await updateProfileMutation.mutateAsync({
          password: trimmed,
        });

        if (res?.data !== true) {
          return;
        }

        setIsBackupUnlocked(true);
        setActiveTab('backup');
        setAdminPassword('');
        toast.success('Access granted: Backup & Restore tab unlocked!', {
          id: 'password-verify',
        });
      } catch (error: any) {
        // Suppress backend error message as requested
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const tabs = [
    {id: 'profile', label: 'Admin Profile'},
    {id: 'header', label: 'Bill Header'},
    ...(isBackupUnlocked
      ? [{id: 'backup', label: 'Backup & Restore Data'}]
      : []),
    {id: 'scale', label: 'Weight Scale'},
    // { id: 'alert', label: 'Alert Management' },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Tab Bar Header with Top-Right Small Password Field */}
        <div className="mb-5 flex flex-col gap-3 border-b border-[#d3c4af]/20 dark:border-slate-700 sm:flex-row sm:items-end sm:justify-between">
          {/* Tab Navigation */}
          <TabBar
            tabs={tabs as TabItem<'profile' | 'header' | 'backup' | 'scale' | 'alert'>[]}
            active={activeTab as 'profile' | 'header' | 'backup' | 'scale' | 'alert'}
            onChange={(id) => setActiveTab(id)}
            className="min-w-0 flex-1 border-b-0"
          />

          {/* Right Top Corner Small Password Field (No Button, Auto-Verifies) */}
          <div className="self-end sm:self-auto">
            {!isBackupUnlocked ? (
              showPinField && (
              <div className="relative flex items-center">
                <input
                  ref={pinInputRef}
                  onBlur={() => {
                    if (!adminPassword.trim()) setShowPinField(false);
                  }}
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  // placeholder="Enter Password"
                  name="backup_pin_val"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  spellCheck={false}
                  style={{
                    WebkitTextSecurity: showBackupPassword ? 'none' : 'disc',
                  }}
                  className="w-44 rounded-lg border border-[#d3c4af]/40 bg-white py-1.5 pl-3 pr-7 text-xs font-medium text-[#1a1c1b] placeholder:text-slate-400 focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {/* <button
                  type="button"
                  onClick={() => setShowBackupPassword(!showBackupPassword)}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  title={showBackupPassword ? 'Hide password' : 'Show password'}
                >
                  {showBackupPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button> */}
              </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Backup Unlocked
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsBackupUnlocked(false);
                    if (activeTab === 'backup') {
                      setActiveTab('profile');
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  title="Lock Backup Tab"
                >
                  <Lock className="h-3 w-3" />
                  <span>Lock</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'profile' && <AdminProfile />}
          {activeTab === 'header' && <HeaderPdfDesign />}
          {activeTab === 'backup' && isBackupUnlocked && (
            <BackupAndRestorePage />
          )}
          {activeTab === 'scale' && <ScaleSetting />}
          {/* {activeTab === 'alert' && <AlertManagement />} */}
        </div>
      </div>
    </div>
  );
};
