import React, {useRef, useState} from 'react';
import {
  Download,
  Upload,
  Loader2,
  Trash2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Mail,
  X,
  Database,
  CheckCircle,
} from 'lucide-react';

import {useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  getBackFile,
  useRestore,
  useDeleteDatabase,
  useSendBackupEmail,
} from '@/lib/api/backup';

import GenericButton from '@/components/Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';

const BackupAndRestorePage = () => {
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showBackupOptionsModal, setShowBackupOptionsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const restore = useRestore(queryClient);
  const deleteDbMutation = useDeleteDatabase(queryClient);
  const sendEmailMutation = useSendBackupEmail();

  /**
   * ============================================
   * DOWNLOAD BACKUP
   * ============================================
   */
  const handleDownloadBackup = async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      toast.loading('Generating database backup...', {
        id: 'backup-download',
      });

      const blob = await getBackFile();

      if (!(blob instanceof Blob)) {
        throw new Error('Invalid backup file received');
      }

      if (blob.size === 0) {
        throw new Error('Backup file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.download = `database-backup-${today}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast.success('SQL backup downloaded successfully', {
        id: 'backup-download',
      });
      setShowBackupOptionsModal(false);
    } catch (error: any) {
      console.error('========== DOWNLOAD ERROR ==========', error);
      toast.error(error?.message || 'Failed to download database backup', {
        id: 'backup-download',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * ============================================
   * SEND BACKUP VIA EMAIL (DIRECT API CALL)
   * ============================================
   */
  const handleSendBackupToEmail = async () => {
    if (isSendingEmail) {
      return;
    }

    setIsSendingEmail(true);

    try {
      toast.loading('Sending backup to email...', {
        id: 'backup-email',
      });

      await sendEmailMutation.mutateAsync();

      toast.success('Backup sent to your email successfully!', {
        id: 'backup-email',
      });
      setShowBackupOptionsModal(false);
    } catch (error: any) {
      console.error('========== EMAIL BACKUP ERROR ==========', error);
      toast.error(error?.message || 'Failed to send backup via email', {
        id: 'backup-email',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  /**
   * ============================================
   * SELECT SQL FILE
   * ============================================
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.sql')) {
      toast.error('Please select a .sql backup file');
      event.target.value = '';
      return;
    }

    if (file.size === 0) {
      toast.error('Selected SQL backup file is empty');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  /**
   * ============================================
   * RESTORE DATABASE
   * ============================================
   */
  const handleRestore = async () => {
    if (!selectedFile) {
      toast.error('Please select a backup file');
      return;
    }

    const confirmed = window.confirm(
      'This will overwrite all existing database data.\n\n' +
        'Are you sure you want to restore this backup?',
    );

    if (!confirmed) {
      return;
    }

    setIsUploading(true);

    try {
      toast.loading('Restoring database...', {
        id: 'database-restore',
      });

      const formData = new FormData();
      formData.append('file', selectedFile);

      await restore.mutateAsync(formData);

      toast.success('Data restored successfully', {
        id: 'database-restore',
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await queryClient.invalidateQueries();
    } catch (error: any) {
      console.error('========== RESTORE ERROR ==========', error);
      toast.error(error?.message || 'Failed to restore database', {
        id: 'database-restore',
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * ============================================
   * DELETE DATABASE
   * ============================================
   */
  const handleDeleteDatabase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      toast.loading('Deleting database records...', {
        id: 'database-delete',
      });

      await deleteDbMutation.mutateAsync('');

      toast.success('Database records deleted successfully', {
        id: 'database-delete',
      });

      setShowDeleteConfirmModal(false);
      await queryClient.invalidateQueries();
    } catch (error: any) {
      console.error('========== DELETE DATABASE ERROR ==========', error);
      toast.error(error?.message || 'Failed to delete database', {
        id: 'database-delete',
      });
    }
  };

  const handleOpenDeleteModal = () => {
    setShowDeleteConfirmModal(true);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 dark:bg-slate-950">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            title="Data Backup & Management"
            subtitle="Backup, restore, or reset your database"
          />
        </div>

        {/* 3 Action Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Backup Data */}
          <div className="flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Database className="h-5 w-5 text-[#785600] dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-[#1a1c1b] dark:text-white">
                  Database Backup
                </h2>
              </div>
              <p className="mb-6 text-sm text-[#4f4535] dark:text-slate-400">
                Backup your complete database via direct email or instant
                download to your device.
              </p>
            </div>

            <GenericButton
              type="button"
              onClick={() => setShowBackupOptionsModal(true)}
              disabled={isDownloading || isSendingEmail}
              variant="primary"
              className="w-full !px-6"
            >
              {isDownloading || isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Backup Data
                </>
              )}
            </GenericButton>
          </div>

          {/* Card 2: Restore Data */}
          <div className="flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#785600] dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-[#1a1c1b] dark:text-white">
                  Restore Data
                </h2>
              </div>
              <p className="mb-4 text-sm text-[#4f4535] dark:text-slate-400">
                Upload an existing SQL backup file to restore database data.
              </p>

              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql,application/sql,text/plain"
                  onChange={handleFileSelect}
                  className="text-gray-500 block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#785600] hover:file:bg-amber-100 dark:file:bg-slate-800 dark:file:text-amber-400"
                />
              </div>
            </div>

            <GenericButton
              type="button"
              onClick={handleRestore}
              disabled={!selectedFile || restore.isPending || isUploading}
              className={`w-full !whitespace-nowrap !px-6 ${
                !selectedFile || restore.isPending || isUploading
                  ? '!bg-gray-300 !text-gray-500 !cursor-not-allowed dark:!bg-slate-800 dark:!text-slate-600'
                  : '!bg-emerald-600 !text-white hover:!bg-emerald-700'
              }`}
            >
              {restore.isPending || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Restore Data
                </>
              )}
            </GenericButton>
          </div>

          {/* Card 3: Delete Database */}
          <div className="flex flex-col justify-between rounded-xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/30 dark:bg-slate-900">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Delete Database
                </h2>
              </div>
              <p className="mb-6 text-sm text-[#4f4535] dark:text-slate-400">
                Permanently clear and reset all database records. This action
                cannot be undone.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenDeleteModal}
              disabled={deleteDbMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteDbMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Database</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
              {/* Header */}
              <div className="bg-red-50 p-6 text-center dark:bg-red-950/30">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                  Confirm Database Deletion
                </h3>
                <p className="mt-2 text-sm text-[#4f4535] dark:text-slate-300">
                  Are you sure you want to permanently delete all database
                  records? This action cannot be undone.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 p-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmModal(false)}
                  disabled={deleteDbMutation.isPending}
                  className="hover:bg-gray-100 rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDatabase()}
                  disabled={deleteDbMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteDbMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Backup Modal (Email or Download) */}
        {showBackupOptionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                  Backup Database
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBackupOptionsModal(false)}
                  disabled={isDownloading || isSendingEmail}
                  className="hover:bg-gray-100 rounded-lg p-1 text-[#4f4535] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-5 text-xs text-[#4f4535] dark:text-slate-400">
                Please select your preferred backup option:
              </p>

              {/* 2 Simple Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleSendBackupToEmail}
                  disabled={isSendingEmail || isDownloading}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-blue-700 transition-all hover:bg-blue-100 active:scale-95 disabled:opacity-50 dark:border-blue-900/40 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  {isSendingEmail ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  )}
                  <span className="text-xs font-bold sm:text-sm">
                    {isSendingEmail ? 'Sending...' : 'Send to Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={isDownloading || isSendingEmail}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#785600]/30 bg-[#785600]/10 text-[#785600] transition-all hover:bg-[#785600]/20 active:scale-95 disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-300 h-9 px-4 text-xs sm:text-[13px]"
                >
                  {isDownloading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-[#785600] dark:text-amber-400" />
                  ) : (
                    <Download className="h-6 w-6 text-[#785600] dark:text-amber-400" />
                  )}
                  <span className="text-xs font-bold sm:text-sm">
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupAndRestorePage;
