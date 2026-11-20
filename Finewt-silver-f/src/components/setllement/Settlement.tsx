import React, {useEffect, useRef, useState} from 'react';
import {Search, Plus, CheckCircle, Printer} from 'lucide-react';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import {useSubmitSettlement} from '@/lib/api/settlement';
import {Client, useGetClients} from '@/lib/api/client';
import {useGetHeader} from '@/lib/api/headerapi';
import GenericButton from '../Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '../Forms/DatePicker/GenericWeeklyDatePicker';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {useScaleFocus} from '@/lib/hooks/useScaleFocus';
import {useNavigate} from '@tanstack/react-router';
import AddClientModal from '../Client/AddClientModal';
import {printClientReceipt} from '@/utils/printClientReceipt';
import {
  SettlementEntry,
  SettlementDetail,
  parseDateSafely,
  formatNumber,
} from './settlementUtils';
import {SettlementSummaryCards} from './SettlementSummaryCards';
import {SettlementModal} from './SettlementModal';
import {printSettlementReport} from './printSettlementReport';

const Settlement: React.FC = () => {
  const navigate = useNavigate();
  const getpdfheaderdata = useGetHeader();

  // ----------------------------------------------------
  // TABLE & FILTER STATES
  // ----------------------------------------------------
  const [settlements, setSettlements] = useState<SettlementEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<string>('all');

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

  const getDefaultWeekRange = () => {
    const {fromDate, toDate} = getCurrentAppWeekRange();
    return {monday: fromDate, sunday: toDate};
  };

  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const {monday, sunday} = getDefaultWeekRange();
    return [monday, sunday];
  });

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      const {monday, sunday} = getDefaultWeekRange();
      setDateRange([monday, sunday]);
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, []);

  // ----------------------------------------------------
  // MODAL STATES
  // ----------------------------------------------------
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // ----------------------------------------------------
  // AMOUNT & DETAIL STATES
  // ----------------------------------------------------
  const [localAmount, setLocalAmount] = useState<string>('');
  const [settlementDetail, setSettlementDetail] = useState<SettlementDetail>({
    clientName: '',
    phoneNumber: '',
    address: '',
    pendingBalance: 0,
    totalBills: 0,
    settlementAmount: 0,
    settlementType: 'receive',
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    openingBalance: 0,
    due: null,
  });

  // ----------------------------------------------------
  // SCALE FOCUS & INPUT REF
  // ----------------------------------------------------
  const inputRef = useRef<HTMLInputElement>(null);

  const scaleFocus = useScaleFocus((weight) => {
    const val = weight.toString();
    setLocalAmount(val);
    setSettlementDetail((prev) => ({
      ...prev,
      settlementAmount: weight,
    }));
  });

  useEffect(() => {
    if (!showSettleModal) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 150);
    return () => clearTimeout(timer);
  }, [showSettleModal]);

  // ----------------------------------------------------
  // API
  // ----------------------------------------------------
  const {
    data: settlementsData,
 
    refetch: refetchSettlements,
  } = useGetClients();

  const submitSettlementMutation = useSubmitSettlement();

  useEffect(() => {
    const rawList = Array.isArray(settlementsData)
      ? settlementsData
      : (settlementsData as any)?.data &&
          Array.isArray((settlementsData as any).data)
        ? (settlementsData as any).data
        : (settlementsData as any)?.clients &&
            Array.isArray((settlementsData as any).clients)
          ? (settlementsData as any).clients
          : [];

    if (rawList.length > 0 || Array.isArray(settlementsData)) {
      const apiData: SettlementEntry[] = rawList.map(
        (item: any, index: number) => ({
          id: item.id || `settlement-${index}`,
          srNo: index + 1,
          clientName:
            item.fullName ||
            item.clientName ||
            item.client?.name ||
            'Unknown Client',
          phoneNumber: item.phoneNumber || item.client?.phone || 'N/A',
          goldBalance: Number(
            item.openingBalance ?? item.balance ?? item.goldBalance ?? 0,
          ),
          totalBill: Number(
            item.totalBills ?? item.totalBill ?? item.totalGiven ?? 0,
          ),
          status: item.status || 'pending',
          clientId: item.id || item.clientId || item.client?.id || '',
          openingBalance: Number(item.openingBalance ?? 0),
          due: item.due ?? null,
          address: item.address || '',
          totalBills: Number(item.totalBills ?? item._count?.receipts ?? 0),
          amount: Number(item.openingBalance ?? 0),
          remark: Number(item.openingBalance ?? 0) > 0 ? 'Received' : 'Given',
          createdAt:
            item.createdAt ||
            item.updatedAt ||
            item.date ||
            item.dateTime ||
            item.created_at ||
            item.updated_at ||
            item.client?.createdAt ||
            '',
          updatedAt: item.updatedAt || item.updated_at || '',
          bills: item.bills || item.receipts || [],
          receipts: item.receipts || item.bills || [],
        }),
      );

      setSettlements(apiData);
    } else if (settlementsData && (settlementsData as any)?.status === false) {
      toast.error(
        (settlementsData as any)?.message || 'Failed to fetch settlement data',
      );
      setSettlements([]);
    } else {
      setSettlements([]);
    }
  }, [settlementsData]);

  // ----------------------------------------------------
  // DATE HANDLERS
  // ----------------------------------------------------
  const handleFromDateChange = (dates: Date[]) => {
    if (isTrial) setIsDateFilterActive(true);
    if (dates && dates.length > 0) {
      const selected = new Date(dates[0]);
      selected.setHours(0, 0, 0, 0);
      setDateRange((prev) => [selected, prev[1] || selected]);
    } else {
      setDateRange((prev) => [undefined as any, prev[1]]);
    }
  };

  const handleToDateChange = (dates: Date[]) => {
    if (isTrial) setIsDateFilterActive(true);
    if (dates && dates.length > 0) {
      const selected = new Date(dates[0]);
      selected.setHours(23, 59, 59, 999);
      setDateRange((prev) => [prev[0] || selected, selected]);
    } else {
      setDateRange((prev) => [prev[0], undefined as any]);
    }
  };

  // ----------------------------------------------------
  // MODAL HANDLERS
  // ----------------------------------------------------
  const handleSettle = (entry: SettlementEntry) => {
    const balance = Number(entry.goldBalance || 0);

    setSettlementDetail({
      clientName: entry.clientName,
      phoneNumber: entry.phoneNumber,
      address: entry.address || '',
      pendingBalance: balance,
      totalBills: entry.totalBills || 0,
      settlementAmount: 0,
      settlementType: 'receive',
      date: new Date().toISOString().split('T')[0],
      clientId: entry.clientId,
      openingBalance: entry.openingBalance || 0,
      due: entry.due || null,
    });

    setLocalAmount('');
    setShowSettleModal(true);
  };

  const closeSettlementModal = () => {
    setShowSettleModal(false);
    setLocalAmount('');
    setSettlementDetail({
      clientName: '',
      phoneNumber: '',
      address: '',
      pendingBalance: 0,
      totalBills: 0,
      settlementAmount: 0,
      settlementType: 'receive',
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      openingBalance: 0,
      due: null,
    });
  };

  const handleProceedToConfirm = () => {
    const amount = Number(settlementDetail.settlementAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }
    if (!settlementDetail.clientId) {
      toast.error('Client ID is missing');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSaveSettlement = async () => {
    try {
      const amount = Number(settlementDetail.settlementAmount);
      if (!amount || Number.isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      if (!settlementDetail.clientId) {
        toast.error('Client ID is missing');
        return;
      }

      const signedAmount =
        settlementDetail.settlementType === 'receive' ? -amount : amount;

      const settlementData = {
        clientId: settlementDetail.clientId,
        amount: signedAmount,
        type: settlementDetail.settlementType,
        pendingBalance: settlementDetail.pendingBalance,
      };

      const isGive = settlementDetail.settlementType === 'give';
      const receiptDataToPrint = isGive
        ? {
            clientName: settlementDetail.clientName,
            phoneNumber: settlementDetail.phoneNumber,
            address: settlementDetail.address,
            transactionType: 'give' as const,
            amount: settlementDetail.settlementAmount,
            previousBalance: settlementDetail.pendingBalance,
            newBalance:
              settlementDetail.pendingBalance +
              settlementDetail.settlementAmount,
            remark: settlementDetail.remark || 'Settlement (Given)',
            items: [
              {
                item: 'Gold',
                purity: '100%',
                fineWeight: settlementDetail.settlementAmount,
                weight: settlementDetail.settlementAmount,
                remark: settlementDetail.remark || '',
              },
            ],
            dateTime: new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
          }
        : null;

      await submitSettlementMutation.mutateAsync(settlementData);

      if (isGive && receiptDataToPrint) {
        printClientReceipt(receiptDataToPrint, getpdfheaderdata);
      }

      setShowConfirmModal(false);
      setShowSettleModal(false);
      setLocalAmount('');

      setSettlementDetail({
        clientName: '',
        phoneNumber: '',
        address: '',
        pendingBalance: 0,
        totalBills: 0,
        settlementAmount: 0,
        settlementType: 'receive',
        date: new Date().toISOString().split('T')[0],
        clientId: '',
        openingBalance: 0,
        due: null,
      });

      await refetchSettlements();
    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to save settlement');
    }
  };

  // ----------------------------------------------------
  // FILTERING LOGIC
  // ----------------------------------------------------
  const filteredSettlements = settlements.filter((entry) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      entry.clientName.toLowerCase().includes(search) ||
      entry.phoneNumber.includes(search);

    const matchesBalance =
      balanceFilter === 'all' ||
      (balanceFilter === 'positive' && entry.goldBalance > 0) ||
      (balanceFilter === 'negative' && entry.goldBalance < 0) ||
      (balanceFilter === 'zero' && entry.goldBalance === 0);

    let matchesDate = true;
    if (isTrial && !isDateFilterActive) {
      matchesDate = true;
    } else if (dateRange && (dateRange[0] || dateRange[1])) {
      const fromDate = dateRange[0] ? parseDateSafely(dateRange[0]) : null;
      const toDate = dateRange[1] ? parseDateSafely(dateRange[1]) : null;

      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(23, 59, 59, 999);

      if (fromDate || toDate) {
        const allBills = [...(entry.bills || []), ...(entry.receipts || [])];

        if (allBills.length > 0) {
          const hasMatchingBill = allBills.some((bill: any) => {
            const billDateStr =
              bill?.createdAt ||
              bill?.created_at ||
              bill?.date ||
              bill?.dateTime ||
              bill?.updatedAt;
            const billDate = parseDateSafely(billDateStr);
            if (!billDate) return false;

            if (fromDate && billDate.getTime() < fromDate.getTime())
              return false;
            if (toDate && billDate.getTime() > toDate.getTime()) return false;
            return true;
          });

          matchesDate = hasMatchingBill;
        } else {
          const entryDate = parseDateSafely(entry.updatedAt || entry.createdAt);
          if (entryDate) {
            const inRange =
              (!fromDate || entryDate.getTime() >= fromDate.getTime()) &&
              (!toDate || entryDate.getTime() <= toDate.getTime());
            matchesDate = inRange || entry.goldBalance !== 0;
          }
        }
      }
    }

    return matchesSearch && matchesBalance && matchesDate;
  });

  // ----------------------------------------------------
  // TOTALS COMPUTATION
  // ----------------------------------------------------
  const totalPositiveBalance = filteredSettlements.reduce(
    (sum, item) => (item.goldBalance > 0 ? sum + item.goldBalance : sum),
    0,
  );

  const totalNegativeBalance = filteredSettlements.reduce(
    (sum, item) =>
      item.goldBalance < 0 ? sum + Math.abs(item.goldBalance) : sum,
    0,
  );

  const totalPending = filteredSettlements.filter(
    (item) => item.status !== 'settled',
  ).length;
  const totalSettled = filteredSettlements.filter(
    (item) => item.status === 'settled',
  ).length;

  const handleRowClick = (client: Client) => {
    const targetId = client?.id || (client as any)?._id;
    if (targetId) {
      navigate({to: '/client/clientreport/$id', params: {id: targetId}});
    }
  };

  const handlePrint = () => {
    if (!filteredSettlements || filteredSettlements.length === 0) {
      toast.error('No records to print');
      return;
    }
    const headerInfo =
      getpdfheaderdata?.data?.data ||
      (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});

    printSettlementReport({
      settlements: filteredSettlements,
      headerInfo,
      dateRange,
    });
  };

  // ----------------------------------------------------
  // TABLE COLUMNS & ACTIONS
  // ----------------------------------------------------
  const renderActions = (item: SettlementEntry) => {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSettle(item);
        }}
        className="flex items-center gap-1 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#5d4200]"
      >
        <CheckCircle className="h-3 w-3" />
        Settle
      </button>
    );
  };

  const columns: Column<SettlementEntry>[] = [
    {
      key: 'clientName',
      header: 'Client Name',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.clientName}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.phoneNumber}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.address}
        </span>
      ),
    },
    {
      key: 'goldBalance',
      header: 'Due Balance(G)',
      render: (item) => (
        <div className="text-black dark:text-white">
          {formatNumber(item.goldBalance)} G
        </div>
      ),
    },
    {
      key: 'totalBills',
      header: 'Total Bills',
      render: (item) => (
        <span className="font-mono text-sm text-black dark:text-white">
          {item.totalBills || 0}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 md:px-8 md:py-6">
        {/* PAGE HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <PageHeader
            title="Client & Settlement"
            subtitle="Manage client settlements and gold balances"
          />
          <GenericButton
            onClick={() => setShowAddClientModal(true)}
            variant="primary"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </GenericButton>
        </div>

        {/* SUMMARY CARDS */}
        <SettlementSummaryCards
          totalClients={filteredSettlements.length}
          totalPending={totalPending}
          totalSettled={totalSettled}
          netBalance={totalPositiveBalance - totalNegativeBalance}
        />

        {/* FILTERS */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="search"
                placeholder="Search by client name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                name="client-search-filter"
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Balance</option>
              <option value="positive">Receiving (+)</option>
              <option value="negative">Giving (-)</option>
              <option value="zero">Zero Balance</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <GenericWeeklyDatePicker
              id="from-date-settlement"
              placeholder="DD/MM/YYYY"
              mode="from"
              initialDates={dateRange}
              onDateChange={handleFromDateChange}
              className="w-32 sm:w-36 md:w-40"
            />

            <GenericWeeklyDatePicker
              id="to-date-settlement"
              placeholder="DD/MM/YYYY"
              mode="to"
              initialDates={dateRange}
              onDateChange={handleToDateChange}
              className="w-32 sm:w-36 md:w-40"
            />

            <GenericButton
              onClick={handlePrint}
              className="!bg-[#785600] !text-white hover:!bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          </div>
        </div>

        {/* TABLE */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable<SettlementEntry>
            data={filteredSettlements}
            columns={columns}
            onSave={(item) => console.log('Save:', item)}
           
            renderActions={renderActions}
            showSrNo={true}
            onRowClick={handleRowClick}
            srNoLabel="Sr No."
          />
        </div>
      </div>

      {/* MODALS */}
      <SettlementModal
        showSettleModal={showSettleModal}
        showConfirmModal={showConfirmModal}
        settlementDetail={settlementDetail}
        setSettlementDetail={setSettlementDetail}
        localAmount={localAmount}
        setLocalAmount={setLocalAmount}
        inputRef={inputRef}
        scaleFocus={scaleFocus}
        onCloseSettle={closeSettlementModal}
        onProceedToConfirm={handleProceedToConfirm}
        onCloseConfirm={() => setShowConfirmModal(false)}
        onConfirmSave={handleSaveSettlement}
        isSubmitting={submitSettlementMutation.isPending}
      />
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onSuccess={async () => {
          setSearchTerm('');
          await refetchSettlements();
        }}
      />
    </div>
  );
};

export default Settlement;
