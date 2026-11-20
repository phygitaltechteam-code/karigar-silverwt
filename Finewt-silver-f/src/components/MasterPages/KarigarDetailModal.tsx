import React, { useState, useMemo } from 'react';
import TabBar from '@/components/common/TabBar';
import {
  X,
  CreditCard,
  ArrowLeft,
  Search,
  Calendar,
  Loader2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  UnifiedKarigarEntry,
  JobStage,
  LedgerEntry,
  mockAccounts,
  hasRate,
} from './unifiedKarigarHelpers';

interface KarigarDetailModalProps {
  karigar: UnifiedKarigarEntry;
  onClose: () => void;
  onUpdateKarigar: (updated: UnifiedKarigarEntry) => void;
}

export const KarigarDetailModal: React.FC<KarigarDetailModalProps> = ({
  karigar,
  onClose,
  onUpdateKarigar,
}) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'payments'>('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<JobStage | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [selectedAccount, setSelectedAccount] = useState<string>('acc-1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stages = karigar.jobStages || [];
  const ledger = karigar.ledger || [];

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

  const filteredStages = useMemo(() => {
    return stages.filter((stg) => {
      if (fromDate && new Date(stg.issueDate) < new Date(fromDate)) return false;
      if (toDate && new Date(stg.issueDate) > new Date(toDate)) return false;
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

  const totalWorks = filteredStages.length;
  const totalSilverIssued = filteredStages.reduce(
    (acc, s) => acc + (s.giveM || 0),
    0,
  );
  const totalSilverReceived = filteredStages.reduce(
    (acc, s) => acc + (s.takenWt || 0),
    0,
  );
  const silverInPossession = totalSilverIssued - totalSilverReceived;
  const totalLoss = filteredStages.reduce(
    (acc, s) => acc + (s.loss || s.wastage || 0),
    0,
  );

  const totalPaymentAmount = stages.reduce(
    (acc, s) => acc + (s.payment || 0),
    0,
  );
  const totalPaidAmount = ledger
    .filter((l) => l.type === 'DEBIT')
    .reduce((acc, l) => acc + l.amount, 0);
  const totalPendingAmount = Math.max(0, totalPaymentAmount - totalPaidAmount);

  const lastPaidEntry = ledger.length > 0 ? ledger[ledger.length - 1] : null;
  const pastPaidDate = lastPaidEntry
    ? `${formatDate(lastPaidEntry.date)} • ${formatTime(lastPaidEntry.date)}`
    : 'No payments yet';

  const handleMakePayment = () => {
    const stageToPay =
      filteredStages.find((s) => s.pendingAmount > 0) || filteredStages[0];
    if (stageToPay) {
      setSelectedStage(stageToPay);
      setPaymentAmount(
        stageToPay.pendingAmount > 0 ? stageToPay.pendingAmount : 500,
      );
      setShowPaymentModal(true);
    } else {
      toast.error('No job stages available for payment');
    }
  };

  const handlePaymentSubmit = () => {
    if (paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const accObj = mockAccounts.find((a) => a.id === selectedAccount);
      const accName = accObj ? accObj.name : 'Cash';

      const newLedgerEntry: LedgerEntry = {
        id: `led-${Date.now()}`,
        date: new Date().toISOString(),
        amount: paymentAmount,
        type: paymentType,
        job: selectedStage ? selectedStage.jobNo : 'GENERAL SETTLEMENT',
        stage: selectedStage ? selectedStage.processName : karigar.processType,
        account: accName,
        stageId: selectedStage?.id,
      };

      const updatedLedger = [newLedgerEntry, ...ledger];

      let updatedStages = [...stages];
      if (selectedStage) {
        updatedStages = stages.map((stg) => {
          if (stg.id === selectedStage.id) {
            const newPaid =
              stg.paidAmount +
              (paymentType === 'DEBIT' ? paymentAmount : -paymentAmount);
            return {
              ...stg,
              paidAmount: Math.max(0, newPaid),
              pendingAmount: Math.max(0, stg.payment - newPaid),
              status: newPaid >= stg.payment ? 'PAID' : 'IN_PROGRESS',
            };
          }
          return stg;
        });
      }

      const updatedKarigar: UnifiedKarigarEntry = {
        ...karigar,
        jobStages: updatedStages,
        ledger: updatedLedger,
      };

      onUpdateKarigar(updatedKarigar);
      toast.success(
        `Payment (${paymentType}) of ₹${paymentAmount.toLocaleString()} recorded successfully`,
      );
      setIsSubmitting(false);
      setShowPaymentModal(false);
      setSelectedStage(null);
      setPaymentAmount(0);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl my-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-[#d3c4af]/30 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#d3c4af]/20 bg-[#f8f6f4] dark:bg-slate-800/80 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#4f4535] hover:bg-[#d3c4af]/30 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
                  {karigar.name}
                </h2>
                <span className="rounded-full bg-[#785600]/10 px-3 py-0.5 text-xs font-bold text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
                  {karigar.processType} Karigar
                </span>
                {hasRate(karigar.processType) && karigar.rate && (
                  <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    ₹{karigar.rate} / KG
                  </span>
                )}
              </div>
              <p className="text-xs text-[#817563] dark:text-slate-400">
                Phone: {karigar.number || 'N/A'} • Address:{' '}
                {karigar.address || 'N/A'} • Opening Bal:{' '}
                {karigar.openingBalance || 0} G
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMakePayment}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#785600] to-[#986d00] font-bold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all h-9 px-4 text-xs sm:text-[13px]"
            >
              <CreditCard className="h-4 w-4" />
              <span>Settle (₹)</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#817563] hover:bg-[#d3c4af]/20 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Stats Cards Row */}
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
                In possession: <strong>{silverInPossession.toFixed(3)} G</strong>{' '}
                • Total Loss (घट): <strong>{totalLoss.toFixed(3)} G</strong>
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
                Pending Settlement (₹)
              </span>
              <p className="mt-1 text-lg font-bold text-black dark:text-white">
                ₹{totalPendingAmount.toLocaleString()}
              </p>
              <span className="text-[10px] text-[#817563] dark:text-slate-400">
                Last paid: {pastPaidDate}
              </span>
            </div>
          </div>

          {/* Filters & Tabs Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d3c4af]/20 pb-3 dark:border-slate-800">
            <TabBar
              tabs={[
                { id: 'jobs', label: <>Job Stages ({filteredStages.length})</> },
                { id: 'payments', label: <>Payment Ledger ({ledger.length})</> },
              ]}
              active={activeTab as 'jobs' | 'payments'}
              onChange={(id) => setActiveTab(id)}
              className="border-b-0"
            />

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                <Calendar className="h-3.5 w-3.5 text-[#785600] dark:text-amber-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-24 bg-transparent text-[11px] outline-none dark:text-white"
                />
                <span className="text-xs text-[#817563]">-</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-24 bg-transparent text-[11px] outline-none dark:text-white"
                />
              </div>

              <div className="rounded-lg border border-[#d3c4af]/30 bg-white px-2.5 py-1 text-xs font-bold text-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400">
                Metal: Silver
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#817563]" />
                <input
              autoComplete="off"
              data-lpignore="true"
                  type="search"
                  placeholder="Search stages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-36 rounded-lg border border-[#d3c4af]/30 bg-white py-1 pl-8 pr-2 text-xs outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* TAB 1: JOB STAGES TABLE */}
          {activeTab === 'jobs' && (
            <div className="overflow-x-auto rounded-xl border border-[#d3c4af]/20 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f4f4f2] dark:bg-slate-800 uppercase tracking-wider text-[#4f4535] dark:text-slate-300 border-b border-[#d3c4af]/20">
                    <th className="p-3">Job No</th>
                    <th className="p-3">Item</th>
                    <th className="p-3">Design</th>
                    <th className="p-3">Stamp (शिक्का)</th>
                    <th className="p-3">Purity % (टंच)</th>
                    <th className="p-3 text-right">Issued (G)</th>
                    <th className="p-3 text-right">Received (G)</th>
                    <th className="p-3 text-right">Loss (घट) (G)</th>
                    <th className="p-3 text-right">Rate (Rs)</th>
                    <th className="p-3 text-right">Labour (₹)</th>
                    <th className="p-3 text-right">Paid (₹)</th>
                    <th className="p-3 text-right">Pending (₹)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-800">
                  {filteredStages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="p-6 text-center text-[#817563] dark:text-slate-400"
                      >
                        No job stages found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStages.map((stage) => (
                      <tr
                        key={stage.id}
                        className="hover:bg-[#f8f6f4] dark:hover:bg-slate-800/50"
                      >
                        <td className="p-3 font-bold text-[#785600] dark:text-amber-400">
                          {stage.jobNo}
                        </td>
                        <td className="p-3 font-medium text-[#1a1c1b] dark:text-white">
                          {stage.itemName}
                        </td>
                        <td className="p-3 font-medium text-purple-700 dark:text-purple-400">
                          {stage.design || 'Choko Chain'}
                        </td>
                        <td className="p-3 font-mono text-amber-800 dark:text-amber-300">
                          {stage.stamp || '925 (शिक्का)'}
                        </td>
                        <td className="p-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {stage.purity || '92.5%'}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {stage.giveM.toFixed(3)}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {stage.takenWt.toFixed(3)}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                          {(stage.loss || stage.wastage || 0).toFixed(3)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          ₹{stage.rate || karigar.rate || 150}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                          ₹{stage.payment.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{stage.paidAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold text-red-600 dark:text-red-400">
                          ₹{stage.pendingAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              stage.pendingAmount === 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}
                          >
                            {stage.pendingAmount === 0 ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: PAYMENT HISTORY TABLE */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto rounded-xl border border-[#d3c4af]/20 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f4f4f2] dark:bg-slate-800 uppercase tracking-wider text-[#4f4535] dark:text-slate-300 border-b border-[#d3c4af]/20">
                    <th className="p-3">Sr No.</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Job Reference</th>
                    <th className="p-3">Process</th>
                    <th className="p-3">Account</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3 text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-800">
                  {ledger.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-6 text-center text-[#817563] dark:text-slate-400"
                      >
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    ledger.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-[#f8f6f4] dark:hover:bg-slate-800/50"
                      >
                        <td className="p-3 text-[#817563]">{idx + 1}</td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{formatDate(entry.date)}</span>
                            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{formatTime(entry.date)}</span>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-[#785600] dark:text-amber-400">
                          {entry.job}
                        </td>
                        <td className="p-3">{entry.stage}</td>
                        <td className="p-3">{entry.account}</td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{entry.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              entry.type === 'DEBIT'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
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

            <div className="p-4 space-y-4 text-xs">
              <div className="rounded-lg bg-[#f8f6f4] dark:bg-slate-800 p-3 flex flex-wrap items-center justify-between gap-2 border border-[#d3c4af]/20">
                <div>
                  <span className="text-[#817563]">Karigar: </span>
                  <span className="font-bold text-[#1a1c1b] dark:text-white">
                    {karigar.name}
                  </span>
                </div>
                <div>
                  <span className="text-[#817563]">Job Stage Ref: </span>
                  <span className="font-bold text-[#785600] dark:text-amber-400">
                    {selectedStage ? selectedStage.jobNo : 'General Settlement'}
                  </span>
                </div>
                {selectedStage && (
                  <div className="text-red-600 dark:text-red-400 font-bold">
                    <span>Stage Pending: </span>
                    <span>₹{selectedStage.pendingAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#4f4535] dark:text-slate-300 mb-1">
                    Payment Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-[#785600]">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) =>
                        setPaymentAmount(parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-[#b8a892] bg-white dark:bg-slate-800 py-2 pl-6 pr-2 font-mono font-bold text-xs text-[#1a1c1b] dark:text-white outline-none focus:border-[#785600]"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#4f4535] dark:text-slate-300 mb-1">
                    Transaction Type *
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) =>
                      setPaymentType(e.target.value as 'DEBIT' | 'CREDIT')
                    }
                    className="w-full rounded-lg border border-[#b8a892] bg-white dark:bg-slate-800 p-2 font-semibold text-xs text-[#1a1c1b] dark:text-white outline-none focus:border-[#785600]"
                  >
                    <option value="DEBIT">DEBIT (-) Paid</option>
                    <option value="CREDIT">CREDIT (+) Return</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#4f4535] dark:text-slate-300 mb-1">
                    Pay From Account *
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full rounded-lg border border-[#b8a892] bg-white dark:bg-slate-800 p-2 text-xs font-medium text-[#1a1c1b] dark:text-white outline-none focus:border-[#785600]"
                  >
                    {mockAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
};

export default KarigarDetailModal;
