import React, { useState, useMemo } from 'react';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import TabBar from '@/components/common/TabBar';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Search,
  Calendar,
  CreditCard,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  loadUnifiedKarigars,
  UnifiedKarigarEntry,
  JobStage,
  LedgerEntry,
} from './UnifiedKarigarMaster';
import {
  useGetKarigars,
  useGetKarigarById,
  useGetKarigarPayments,
  useAddKarigarPayment,
} from '@/lib/api/karigar';
import { collectKarigarJobs } from '@/utils/manufacturingStock';

import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';

/** Same remembered silver rate (₹ per gram) as Client Settlement */
const RATE_KEY = 'settlement_current_rate';
const round2 = (v: number) => Math.round(v * 100) / 100;

export default function KarigarByIdPage() {
  const navigate = useNavigate();
  // Same page is used by /karigar/kairgerbyid/$id and /soldering/solderingkarigar/$id
  const rawParams = useParams({ strict: false }) as { id?: string };
  const id = rawParams?.id || '';

  const { data: apiKarigar } = useGetKarigarById(id);
  const { data: apiList } = useGetKarigars();
  const [list] = useState<UnifiedKarigarEntry[]>(() => loadUnifiedKarigars());

  const karigar = useMemo(() => {
    if (apiKarigar) return apiKarigar;
    const currentList = apiList && apiList.length > 0 ? apiList : list;
    if (!id) return currentList[0] || null;
    return currentList.find((k) => k.id === id) || null;
  }, [apiKarigar, apiList, list, id]);

  const [activeTab, setActiveTab] = useState<'jobs' | 'payments'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // Jobs ticked in the popup; the paid amount is split over them oldest first
  const [checkedJobIds, setCheckedJobIds] = useState<Set<string>>(new Set());
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  // Pay in rupees, or in silver grams at the current rate
  const [payMode, setPayMode] = useState<'amount' | 'grams'>('amount');
  const [payGrams, setPayGrams] = useState('');
  const [currentRate, setCurrentRate] = useState<string>(() => {
    try {
      return localStorage.getItem(RATE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payments are stored on the server; jobs come from the manufacturing rows given to this karigar
  const { data: payments = [] } = useGetKarigarPayments(karigar?.id);
  const addPayment = useAddKarigarPayment();

  const ledger: LedgerEntry[] = useMemo(
    () =>
      payments.map((p) => ({
        id: p.id,
        date: p.createdAt,
        amount: p.amount,
        type: p.type,
        job: p.job || 'GENERAL SETTLEMENT',
        stage: p.stage || '',
        account: p.account || '',
        stageId: p.stageId,
      })),
    [payments],
  );

  const stages: JobStage[] = useMemo(() => {
    const paidByJob: Record<string, number> = {};
    payments.forEach((p) => {
      if (!p.stageId) return;
      paidByJob[p.stageId] =
        (paidByJob[p.stageId] || 0) + (p.type === 'DEBIT' ? p.amount : -p.amount);
    });
    return collectKarigarJobs(karigar?.name || '', paidByJob) as unknown as JobStage[];
  }, [karigar?.name, payments]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // From = start of that day, To = end of that day (so the To day itself is included)
  const inRange = (raw?: string) => {
    if (!raw) return true;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return true;
    if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
    if (toDate && d > new Date(toDate + 'T23:59:59.999')) return false;
    return true;
  };

  const filteredLedger = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ledger.filter(
      (l) =>
        inRange(l.date) &&
        (!q || [l.job, l.stage, l.account, l.type, String(l.amount)].some((v) => String(v || '').toLowerCase().includes(q))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger, fromDate, toDate, searchTerm]);

  const filteredStages = useMemo(() => {
    return stages.filter((stg) => {
      if (!inRange(stg.issueDate)) return false;
      if (
        searchTerm &&
        !stg.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !stg.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !stg.design.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !stg.processName.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [stages, fromDate, toDate, searchTerm]);

  // Statistics calculation
  const totalWorks = filteredStages.length;
  const totalSilverIssued = filteredStages.reduce((acc, s) => acc + (s.giveM || 0), 0);
  const totalSilverReceived = filteredStages.reduce((acc, s) => acc + (s.takenWt || 0), 0);
  const silverInPossession = totalSilverIssued - totalSilverReceived;
  const totalLoss = filteredStages.reduce((acc, s) => acc + (s.loss || s.wastage || 0), 0);

  const totalPaymentAmount = stages.reduce((acc, s) => acc + (s.payment || 0), 0);
  // Paid = payments (DEBIT) minus amounts taken back (CREDIT)
  const totalPaidAmount =
    Math.round(
      ledger.reduce((acc, l) => acc + (l.type === 'DEBIT' ? l.amount : -l.amount), 0) * 100,
    ) / 100;
  const balanceDue = Math.round((totalPaymentAmount - totalPaidAmount) * 100) / 100;
  const totalPendingAmount = Math.max(0, balanceDue);
  const totalAdvanceAmount = Math.max(0, -balanceDue);

  // Ledger comes newest first; the latest money paid to the karigar
  const lastPaidEntry = ledger.find((l) => l.type === 'DEBIT') || null;
  const pastPaidDate = lastPaidEntry
    ? `${formatDate(lastPaidEntry.date)} • ${formatTime(lastPaidEntry.date)}`
    : 'No payments yet';

  // Jobs that still have labour to pay, oldest first
  const pendingJobs = useMemo(
    () =>
      stages
        .filter((s) => s.pendingAmount > 0)
        .sort((a, b) => new Date(a.issueDate || 0).getTime() - new Date(b.issueDate || 0).getTime()),
    [stages],
  );
  const checkedJobs = pendingJobs.filter((s) => checkedJobIds.has(s.id));
  const checkedPending = round2(checkedJobs.reduce((s, j) => s + j.pendingAmount, 0));
  const checkedPaid = round2(checkedJobs.reduce((s, j) => s + (j.paidAmount || 0), 0));
  const rate = Number(currentRate) || 0;

  const handleRateChange = (value: string) => {
    if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
    setCurrentRate(value);
    try {
      localStorage.setItem(RATE_KEY, value);
    } catch {
      // storage unavailable
    }
    // Grams stay fixed; the rupee amount follows the new rate
    if (payMode === 'grams') setPaymentAmount(round2((Number(payGrams) || 0) * (Number(value) || 0)));
  };

  const handleGramsChange = (value: string) => {
    if (value !== '' && !/^\d*\.?\d{0,3}$/.test(value)) return;
    setPayGrams(value);
    setPaymentAmount(round2((Number(value) || 0) * rate));
  };

  // Ticking jobs fills the paid amount with their total pending (it can still be edited)
  const toggleJob = (jobId: string) => {
    const next = new Set(checkedJobIds);
    if (next.has(jobId)) next.delete(jobId);
    else next.add(jobId);
    setCheckedJobIds(next);
    const total = round2(pendingJobs.filter((s) => next.has(s.id)).reduce((s, j) => s + j.pendingAmount, 0));
    setPaymentAmount(total);
    setPayGrams(rate > 0 && total > 0 ? String(Math.round((total / rate) * 1000) / 1000) : '');
  };

  const toggleAllJobs = () => {
    const allTicked = pendingJobs.length > 0 && pendingJobs.every((s) => checkedJobIds.has(s.id));
    const next = new Set(allTicked ? [] : pendingJobs.map((s) => s.id));
    setCheckedJobIds(next);
    const total = allTicked ? 0 : round2(pendingJobs.reduce((s, j) => s + j.pendingAmount, 0));
    setPaymentAmount(total);
    setPayGrams(rate > 0 && total > 0 ? String(Math.round((total / rate) * 1000) / 1000) : '');
  };

  const handleMakePayment = () => {
    setPaymentType('DEBIT');
    setCheckedJobIds(new Set());
    setPaymentAmount(0);
    setPayMode('amount');
    setPayGrams('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!karigar?.id) {
      toast.error('Karigar not found');
      return;
    }

    const paidVia =
      payMode === 'grams' && rate > 0
        ? `Silver ${Number(payGrams) || 0} g @ ₹${rate}/g`
        : 'Cash';

    // One ledger line per ticked job, oldest first. A payment above their pending
    // (or with no job ticked) is kept as a general settlement / advance.
    const lines: { amount: number; stage: JobStage | null }[] = [];
    if (paymentType === 'DEBIT') {
      let left = round2(paymentAmount);
      for (const job of checkedJobs) {
        if (left <= 0) break;
        const part = round2(Math.min(left, job.pendingAmount));
        if (part > 0) lines.push({ amount: part, stage: job });
        left = round2(left - part);
      }
      if (left > 0) lines.push({ amount: left, stage: null });
    } else {
      lines.push({ amount: round2(paymentAmount), stage: checkedJobs.length === 1 ? checkedJobs[0] : null });
    }

    setIsSubmitting(true);
    try {
      for (const line of lines) {
        await addPayment.mutateAsync({
          id: karigar.id,
          data: {
            amount: line.amount,
            type: paymentType,
            account: paidVia,
            job: line.stage ? line.stage.jobNo : 'GENERAL SETTLEMENT',
            stage: line.stage ? line.stage.processName : karigar.processType,
            stageId: line.stage?.id,
          },
        });
      }
      toast.success(
        `Payment (${paymentType}) of ₹${paymentAmount.toLocaleString()} recorded` +
          (lines.length > 1 ? ` across ${lines.length} entries` : ''),
      );
      setShowPaymentModal(false);
      setCheckedJobIds(new Set());
      setPaymentAmount(0);
      setPayGrams('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table Columns Definition
  const jobStageColumns: Column<JobStage>[] = [
    {
      key: 'jobNo',
      header: 'JOB NO',
      align: 'left',
      render: (item) => (
        <span className="font-bold text-[#785600] dark:text-amber-400">
          {item.jobNo}
        </span>
      ),
    },
    {
      key: 'itemName',
      header: 'ITEM',
      align: 'left',
      render: (item) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {item.itemName}
        </span>
      ),
    },
    {
      key: 'design',
      header: 'DESIGN',
      align: 'left',
      render: (item) => (
        <span className="text-slate-700 dark:text-slate-300">
          {item.design || '-'}
        </span>
      ),
    },
    {
      key: 'stamp',
      header: 'Stamp (शिक्का)',
      align: 'left',
      render: (item) => (
        <span className="font-mono text-slate-700 dark:text-slate-300">
          {item.stamp || (item as any).Stamp || '-'}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'PURITY % (टंच)',
      align: 'left',
      render: (item) => (
        <span className="font-mono text-slate-700 dark:text-slate-300">
          {Number(item.purity) ? `${item.purity}%` : '-'}
        </span>
      ),
    },
    {
      key: 'giveM',
      header: 'ISSUED (G)',
      align: 'right',
      render: (item) => <span className="font-mono">{item.giveM.toFixed(3)}</span>,
    },
    {
      key: 'takenWt',
      header: 'RECEIVED (G)',
      align: 'right',
      render: (item) => <span className="font-mono">{item.takenWt.toFixed(3)}</span>,
    },
    {
      key: 'loss',
      header: 'LOSS (घट) (G)',
      align: 'right',
      render: (item) => (
        <span className="font-mono">{(item.loss || item.wastage || 0).toFixed(3)}</span>
      ),
    },
    {
      key: 'rate',
      header: 'RATE (RS)',
      align: 'right',
      render: (item) => (
        <span className="font-mono">{item.rate ? `₹${item.rate}/kg` : '-'}</span>
      ),
    },
    {
      key: 'payment',
      header: 'LABOUR (₹)',
      align: 'right',
      render: (item) => (
        <span className="font-mono font-medium">₹{item.payment.toLocaleString()}</span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'PAID (₹)',
      align: 'right',
      render: (item) => (
        <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
          ₹{item.paidAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'pendingAmount',
      header: 'PENDING (₹)',
      render: (item) => {
        const advance = (item as any).advanceAmount || 0;
        return advance > 0 ? (
          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
            Advance ₹{advance.toLocaleString()}
          </span>
        ) : (
          <span
            className={`font-mono font-medium ${item.pendingAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}
          >
            ₹{item.pendingAmount.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: (item) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${(item.payment || 0) <= 0 ? 'bg-slate-100 text-slate-500' : item.pendingAmount === 0
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
        >
          {(item.payment || 0) <= 0 ? 'NO RATE' : item.pendingAmount === 0 ? 'PAID' : 'PENDING'}
        </span>
      ),
    },
  ];

  const paymentColumns: Column<LedgerEntry>[] = [
    {
      key: 'date',
      header: 'DATE & TIME',
      align: 'left',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{formatDate(item.date)}</span>
          <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{formatTime(item.date)}</span>
        </div>
      ),
    },
    {
      key: 'job',
      header: 'JOB REFERENCE',
      align: 'left',
      render: (item) => (
        <span className="font-bold text-[#785600] dark:text-amber-400">
          {item.job}
        </span>
      ),
    },
    {
      key: 'stage',
      header: 'PROCESS',
      align: 'left',
      render: (item) => (
        <span className="text-slate-700 dark:text-slate-300">
          {item.stage}
        </span>
      ),
    },
    {
      key: 'account',
      header: 'PAID VIA',
      align: 'left',
      render: (item) => (
        <span className="text-slate-700 dark:text-slate-300">
          {item.account}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'AMOUNT (₹)',
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          ₹{item.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'TYPE',
      align: 'center',
      render: (item) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.type === 'DEBIT'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}
        >
          {item.type}
        </span>
      ),
    },
  ];

  if (!karigar) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-[#d3c4af]/30 max-w-md w-full">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Karigar Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {id ? `No karigar records found for ID: ${id}` : 'No karigar records found.'}
          </p>
          <button
            onClick={() => navigate({ to: '/soldering/solderingkarigar' })}
            className="rounded-lg bg-[#785600] text-white px-5 py-2.5 text-xs font-bold hover:bg-[#5d4200] transition-colors"
          >
            Back to Karigar Master
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Back Button & Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d3c4af]/30 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/soldering/solderingkarigar' })}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#4f4535] shadow-sm transition-all hover:bg-[#f4f4f2] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Karigars
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold italic text-[#1a1c1b] dark:text-white">
                  {karigar.name}
                </h1>
                <span className="rounded-full bg-[#785600]/10 px-3 py-0.5 text-xs font-bold text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
                  {karigar.processType} Karigar
                </span>
              </div>
              <p className="text-xs text-[#817563] dark:text-slate-400">
                Phone: {karigar.number || 'N/A'} • Address: {karigar.address || 'N/A'} • Opening Bal:{' '}
                {karigar.openingBalance || 0} G
              </p>
            </div>
          </div>

          <button
            onClick={handleMakePayment}
            className="flex items-center gap-1.5 rounded-lg bg-[#785600] hover:bg-[#5d4200] font-bold text-white shadow-md active:scale-95 transition-all h-9 px-4 text-xs sm:text-[13px]"
          >
            <CreditCard className="h-4 w-4" />
            <span>Settle (₹)</span>
          </button>
        </div>

        {/* Stats Cards Row - Simple White Cards, Clean Text */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Works
            </span>
            <p className="mt-1 text-lg font-bold text-black dark:text-white">
              {totalWorks}
            </p>
            <span className="text-[10px] text-[#817563] dark:text-slate-400">
              Job stages assigned
            </span>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Silver Issued / Taken
            </span>
            <p className="mt-1 text-lg font-bold text-black dark:text-white">
              {totalSilverIssued.toFixed(3)} G / {totalSilverReceived.toFixed(3)} G
            </p>
            <span className="text-[10px] text-[#817563] dark:text-slate-400">
              In possession: {silverInPossession.toFixed(3)} G • Loss (घट): {totalLoss.toFixed(3)} G
            </span>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Labour Payment
            </span>
            <p className="mt-1 text-lg font-bold text-black dark:text-white">
              ₹{totalPaymentAmount.toLocaleString()}
            </p>
            <span className="text-[10px] text-[#817563] dark:text-slate-400">
              Paid: ₹{totalPaidAmount.toLocaleString()}
            </span>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Pending Settlement
            </span>
            <p className="mt-1 text-lg font-bold text-black dark:text-white">
              {totalAdvanceAmount > 0
                ? `Advance ₹${totalAdvanceAmount.toLocaleString()}`
                : `₹${totalPendingAmount.toLocaleString()}`}
            </p>
            <span className="text-[10px] text-[#817563] dark:text-slate-400">
              Last paid: {pastPaidDate}
            </span>
          </div>
        </div>

        {/* Filters & Tabs Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d3c4af]/30 pb-3 dark:border-slate-800">
          <TabBar
            tabs={[
              { id: 'jobs', label: <>Job Stages ({filteredStages.length})</> },
              { id: 'payments', label: <>Payment Ledger ({filteredLedger.length})</> },
            ]}
            active={activeTab as 'jobs' | 'payments'}
            onChange={(id) => setActiveTab(id)}
            className="border-b-0"
          />

          <div className="flex flex-wrap items-center gap-2">
            <GenericWeeklyDatePicker
              id="karigar-from-date"
              placeholder="DD/MM/YYYY"
              mode="from"
              initialDates={fromDate ? [new Date(fromDate + 'T00:00:00')] : []}
              onDateChange={(dates) => setFromDate(((dates) => {
                  const d = dates && dates[0];
                  return d
                    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    : '';
                })(dates))}
              className="w-32 sm:w-36"
            />
            <GenericWeeklyDatePicker
              id="karigar-to-date"
              placeholder="DD/MM/YYYY"
              mode="to"
              initialDates={toDate ? [new Date(toDate + 'T00:00:00')] : []}
              onDateChange={(dates) => setToDate(((dates) => {
                  const d = dates && dates[0];
                  return d
                    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                    : '';
                })(dates))}
              className="w-32 sm:w-36"
            />

            {/* Silver Only Badge */}
            <div className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400">
              Metal: Silver
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search job, process, account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border sm:w-52 border-[#d3c4af]/30 bg-white py-1.5 pl-8 pr-2 text-xs outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: JOB STAGES TABLE USING GenericTable */}
        {activeTab === 'jobs' && (
          <GenericTable
            data={filteredStages}
            columns={jobStageColumns}
            showSrNo={true}
            srNoLabel="Sr No."
            pagination={true}
            pageSize={10}
            emptyMessage="No job stages found matching filters."
          />
        )}

        {/* TAB 2: PAYMENT HISTORY TABLE USING GenericTable */}
        {activeTab === 'payments' && (
          <GenericTable
            data={filteredLedger}
            columns={paymentColumns}
            showSrNo={true}
            srNoLabel="Sr No."
            pagination={true}
            pageSize={10}
            emptyMessage="No payment records found."
          />
        )}
      </div>

      {/* Payment Settlement Popup (3 Fields in ONE Line) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-[#d3c4af]/30 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#785600] dark:text-amber-400" />
                <h3 className="font-bold text-[#1a1c1b] dark:text-white">
                  Record Settlement Payment
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg p-1 text-[#817563] hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4 text-xs">
              {/* Job assignments: tick the jobs being paid */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-[#4f4535] dark:text-slate-300">
                    Job Assignments ({pendingJobs.length} pending)
                  </span>
                  {pendingJobs.length > 0 && (
                    <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-[#785600] dark:text-amber-400">
                      <input
                        type="checkbox"
                        checked={pendingJobs.every((s) => checkedJobIds.has(s.id))}
                        onChange={toggleAllJobs}
                        className="h-3.5 w-3.5 accent-[#785600]"
                      />
                      Select all
                    </label>
                  )}
                </div>
                {pendingJobs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#d3c4af]/50 p-3 text-center text-[#817563] dark:border-slate-700">
                    No pending jobs. The payment is recorded as a general settlement.
                  </div>
                ) : (
                  <div className="max-h-56 divide-y divide-[#d3c4af]/20 overflow-y-auto rounded-lg border border-[#d3c4af]/30 dark:divide-slate-800 dark:border-slate-700">
                    {pendingJobs.map((s) => (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors ${
                          checkedJobIds.has(s.id) ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-[#f8f6f4] dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checkedJobIds.has(s.id)}
                          onChange={() => toggleJob(s.id)}
                          className="h-4 w-4 shrink-0 accent-[#785600]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-[#785600] dark:text-amber-400">
                            {s.jobNo} · {s.processName}
                          </div>
                          <div className="truncate text-[11px] text-[#817563] dark:text-slate-400">
                            {[s.design, s.itemName].filter(Boolean).join(' · ') || '-'} · {formatDate(s.issueDate)}
                          </div>
                        </div>
                        <div className="shrink-0 text-right font-mono">
                          <div className="font-bold text-red-600 dark:text-red-400">₹{s.pendingAmount.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            Paid ₹{(s.paidAmount || 0).toLocaleString()}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals for the ticked jobs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-900/40 dark:bg-red-950/20">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                    Total Pending ({checkedJobs.length} ticked)
                  </span>
                  <span className="font-mono text-base font-bold text-red-700 dark:text-red-400">
                    ₹{checkedPending.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Already Paid (ticked)
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{checkedPaid.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Rate, mode and amount */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold text-[#4f4535] dark:text-slate-300">
                    Current Rate (₹/g)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currentRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    placeholder="e.g. 95"
                    className="w-full rounded-lg border border-[#b8a892] bg-white p-2 font-mono text-xs font-bold text-[#1a1c1b] outline-none focus:border-[#785600] dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[#4f4535] dark:text-slate-300">Pay In</label>
                  <div className="grid h-[34px] grid-cols-2 overflow-hidden rounded-lg border border-[#b8a892] font-semibold">
                    {(['amount', 'grams'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        disabled={m === 'grams' && rate <= 0}
                        title={m === 'grams' && rate <= 0 ? 'Enter the current rate first' : ''}
                        onClick={() => {
                          setPayMode(m);
                          if (m === 'grams') {
                            setPayGrams(paymentAmount > 0 && rate > 0 ? String(Math.round((paymentAmount / rate) * 1000) / 1000) : '');
                          }
                        }}
                        className={`transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          payMode === m
                            ? 'bg-[#785600] text-white'
                            : 'bg-white text-[#4f4535] hover:bg-[#f4f4f2] dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {m === 'amount' ? 'Amount ₹' : 'Silver (g)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[#4f4535] dark:text-slate-300">
                    Transaction Type *
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as 'DEBIT' | 'CREDIT')}
                    className="w-full rounded-lg border border-[#b8a892] bg-white p-2 text-xs font-semibold text-[#1a1c1b] outline-none focus:border-[#785600] dark:bg-slate-800 dark:text-white"
                  >
                    <option value="DEBIT">DEBIT (-) Paid</option>
                    <option value="CREDIT">CREDIT (+) Return</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {payMode === 'grams' && (
                  <div>
                    <label className="mb-1 block font-semibold text-[#4f4535] dark:text-slate-300">
                      Silver Given (g) *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={payGrams}
                      onChange={(e) => handleGramsChange(e.target.value)}
                      placeholder="0.000"
                      className="w-full rounded-lg border border-[#b8a892] bg-white p-2 font-mono text-xs font-bold text-[#1a1c1b] outline-none focus:border-[#785600] dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}
                <div className={payMode === 'grams' ? '' : 'sm:col-span-2'}>
                  <label className="mb-1 block font-semibold text-[#4f4535] dark:text-slate-300">
                    Paid Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-[#785600]">₹</span>
                    <input
                      type="number"
                      value={paymentAmount || ''}
                      readOnly={payMode === 'grams'}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className={`w-full rounded-lg border border-[#b8a892] py-2 pl-6 pr-2 font-mono text-xs font-bold text-[#1a1c1b] outline-none focus:border-[#785600] dark:text-white ${
                        payMode === 'grams' ? 'cursor-not-allowed bg-[#eae3d5]/80 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'
                      }`}
                      placeholder="Enter amount"
                    />
                  </div>
                  {rate > 0 && paymentAmount > 0 && payMode === 'amount' && (
                    <p className="mt-1 text-[11px] text-[#817563] dark:text-slate-400">
                      = {(Math.round((paymentAmount / rate) * 1000) / 1000).toLocaleString()} g at ₹{rate}/g
                    </p>
                  )}
                </div>
              </div>

              {paymentType === 'DEBIT' && paymentAmount > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-[#f8f6f4] px-3 py-2 font-semibold text-[#4f4535] dark:bg-slate-800 dark:text-slate-300">
                  <span>Pending after this payment</span>
                  <span className="font-mono font-bold">
                    {paymentAmount > checkedPending
                      ? `₹0 · Advance ₹${round2(paymentAmount - checkedPending).toLocaleString()}`
                      : `₹${round2(checkedPending - paymentAmount).toLocaleString()}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#d3c4af]/20 p-4 dark:border-slate-700">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg px-4 py-2 font-medium text-[#4f4535] dark:text-slate-300 hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={isSubmitting || paymentAmount <= 0}
                className="flex items-center gap-1.5 rounded-lg bg-[#785600] font-bold text-white hover:bg-[#5d4200] disabled:opacity-50 transition-all h-9 px-4 text-xs sm:text-[13px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Pay Now (₹{paymentAmount.toLocaleString()})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
