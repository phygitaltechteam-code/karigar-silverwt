import React, {useState} from 'react';
import {Copy, Check, Sparkles, Key, Trash2, RefreshCw} from 'lucide-react';
import {
  useGetEPinInventory,
  useGenerateEPin,
  useRevokeEPin,
  EPinItem,
} from '@/lib/api/epin';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import PageHeader from '@/components/Forms/Common/PageHeader';
import toast from 'react-hot-toast';

export const EPinRequest: React.FC = () => {
  // Only two inputs
  const [extendDays, setExtendDays] = useState<number>(30);
  const [count, setCount] = useState<number>(1);

  // Copied tracking
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Queries & Mutations
  const {
    data: inventory = [],
    isLoading,
    refetch,
    isRefetching,
  } = useGetEPinInventory();
  const generateMutation = useGenerateEPin();
  const revokeMutation = useRevokeEPin();

  // Helper: compute preview expiry date (today + days)
  const getExpiryPreview = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || 0));
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Helper: format date & time into two lines (like BoxDept / AdminCreate)
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return {date: '-', time: '-'};
    try {
      const d =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(d.getTime())) return {date: String(dateString), time: ''};
      return {
        date: d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      };
    } catch {
      return {date: String(dateString) || '-', time: ''};
    }
  };

  const getCalculatedExpiryDate = (createdStr?: string, days?: number) => {
    if (!createdStr) return undefined;
    try {
      const d = new Date(createdStr);
      if (isNaN(d.getTime())) return undefined;
      d.setDate(d.getDate() + Number(days || 0));
      return d;
    } catch {
      return undefined;
    }
  };

  // Copy PIN to clipboard
  const handleCopyPin = (pin: string) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    toast.success(`Copied: ${pin}`, {
      icon: '📋',
      duration: 2000,
    });
    setTimeout(() => setCopiedPin(null), 2000);
  };

  // Generate handler
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!extendDays || extendDays <= 0) {
      toast.error('Please enter valid extend days (e.g. 30)');
      return;
    }
    if (!count || count <= 0) {
      toast.error('Please enter a valid count (at least 1)');
      return;
    }

    generateMutation.mutate(
      {
        extendDays: Number(extendDays),
        count: Number(count),
      },
      {
        onSuccess: (res) => {
          if (res.codes && res.codes.length === 1) {
            handleCopyPin(res.codes[0]);
          } else if (res.codes && res.codes.length > 1) {
            navigator.clipboard.writeText(res.codes.join('\n'));
            toast.success(
              `Generated & copied ${res.codes.length} keys to clipboard!`,
            );
          }
        },
      },
    );
  };

  // Define columns for GenericTable
  const columns: Column<EPinItem>[] = [
    {
      key: 'key',
      header: 'E-PIN Key',
      render: (item) => {
        const pinKey = item.key || item.pinCode || '';
        return (
          <span className="font-mono text-sm font-extrabold text-[#785600] dark:text-amber-400">
            {pinKey}
          </span>
        );
      },
    },
    {
      key: 'copy',
      header: 'Copy',
      render: (item) => {
        const pinKey = item.key || item.pinCode || '';
        return (
          <button
            type="button"
            onClick={() => handleCopyPin(pinKey)}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition ${
              copiedPin === pinKey
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {copiedPin === pinKey ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        );
      },
    },
    {
      key: 'extendDays',
      header: 'Extend Days',
      render: (item) => (
        <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
          {item.extendDays} Days
        </span>
      ),
    },
    {
      key: 'isUsed',
      header: 'Status',
      render: (item) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            item.isUsed
              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          }`}
        >
          {item.isUsed ? 'Used' : 'Available'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Create Date Time',
      render: (item) => {
        const {date, time} = formatDate(item?.createdAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date Time',
      render: (item) => {
        const expDate = getCalculatedExpiryDate(
          item.createdAt,
          item.extendDays,
        );
        const {date, time} = formatDate(expDate);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            {time && time !== '-' && (
              <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                {time}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  // Actions column (Delete)
  const renderActions = (item: EPinItem) => {
    const pinKey = item.key || item.pinCode || '';
    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete E-PIN ${pinKey}?`)) {
              revokeMutation.mutate(item.id);
            }
          }}
          className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-amber-400 dark:hover:bg-slate-800"
          title="Delete E-PIN"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="mx-auto space-y-4 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <PageHeader title="E-PIN Generator" />
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh list"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isLoading || isRefetching ? 'animate-spin text-[#785600]' : ''
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* One-Line 2-Fields + Generate Button Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={handleGenerate}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            {/* Field 1: Extend Days */}
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Extend Days
                </label>
                <span className="text-[11px] text-slate-400">
                  Exp:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {getExpiryPreview(extendDays)}
                  </strong>
                </span>
              </div>
              <input
                type="number"
                min={1}
                required
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                placeholder="e.g. 30"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Field 2: Count */}
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Count (Quantity)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                placeholder="e.g. 1"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Generate Button on Same Line */}
            <div className="w-full sm:w-auto">
              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#785600] font-bold text-white shadow transition hover:bg-[#986d00] disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700 h-9 px-4 text-xs sm:text-[13px]"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {generateMutation.isPending
                    ? 'Generating...'
                    : 'Generate E-PIN'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* E-PINs Table using GenericTable */}
        <GenericTable<EPinItem>
          data={inventory}
          columns={columns}
          emptyMessage="No E-PINs generated yet."
          isLoading={isLoading}
          // renderActions={renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
          onSave={() => {}}
        />
      </div>
    </div>
  );
};

export default EPinRequest;
