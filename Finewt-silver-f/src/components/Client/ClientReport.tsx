import {useNavigate, useParams} from '@tanstack/react-router';
import {Route} from '../../routes/_app/client/clientreport.$id';
import {useState, useEffect, useRef} from 'react';
import {ArrowLeft, Search, Printer, Wallet} from 'lucide-react';
import toast from 'react-hot-toast';
import {useGetClientReport} from '@/lib/api/reportapi';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {useGetClients} from '@/lib/api/client';
import {printClientReceipt} from '@/utils/printClientReceipt';
import {useScaleFocus} from '@/lib/hooks/useScaleFocus';
import {useSubmitSettlement} from '@/lib/api/settlement';
import {SettlementModal} from '@/components/setllement/SettlementModal';
import {SettlementDetail} from '@/components/setllement/settlementUtils';
import {
  ClientReportEntry,
  ApiResponse,
  ApiDataItem,
  getCurrentWeekRange,
} from './clientReportUtils';
import {ClientReportTable} from './ClientReportTable';
import {printClientReportDoc} from './printClientReportDoc';
import GenericButton from '../Forms/Buttons/GenericButton';

export default function ClientReport() {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const routeParams = Route.useParams();
  const rawParams = useParams({strict: false}) as {id?: string; $id?: string};
  const id = routeParams?.id || rawParams?.id || rawParams?.$id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState<ClientReportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

  const {data: clientsData, refetch: refetchClients} = useGetClients();

  // ----------------------------------------------------
  // SETTLEMENT MODAL STATES
  // ----------------------------------------------------
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const inputRef = useRef<HTMLInputElement>(null);
  const scaleFocus = useScaleFocus((weight) => {
    const val = weight.toString();
    setLocalAmount(val);
    setSettlementDetail((prev) => ({
      ...prev,
      settlementAmount: weight,
    }));
  });

  const submitSettlementMutation = useSubmitSettlement();

  useEffect(() => {
    if (!showSettleModal) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 150);
    return () => clearTimeout(timer);
  }, [showSettleModal]);

  const getDefaultWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {monday, sunday};
  };

  const [_dateRange, setDateRange] = useState<Date[]>(() => {
    const {monday, sunday} = getDefaultWeekRange();
    return [monday, sunday];
  });
  const {monday: defaultMonday, sunday: defaultSunday} = getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date | null>(defaultMonday);
  const [toDate, setToDate] = useState<Date | null>(defaultSunday);

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      const {monday, sunday} = getCurrentWeekRange();
      setDateRange([monday, sunday]);
      setFromDate(monday);
      setToDate(sunday);
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, []);

  const {
    data: clientReportData,
    isLoading,
    isError,
    refetch,
  } = useGetClientReport(id);

  // Transform API data and group rows by bill number
  useEffect(() => {
    if (!clientReportData) return;

    const response = clientReportData as ApiResponse | ApiDataItem[];

    const apiItems: ApiDataItem[] = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    const filteredApiItems = apiItems.filter((item) => {
      if (isTrial && !isDateFilterActive) return true;

      const createdAt = new Date(item.createdAt);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (createdAt < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (createdAt > to) return false;
      }
      return true;
    });

    const sortedItems = [...filteredApiItems].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const groupedData = sortedItems.reduce(
      (acc: Record<string, ApiDataItem[]>, item) => {
        const billKey = item.billNumber
          ? `BILL_${item.billNumber}`
          : item.receiptId
            ? `RECEIPT_${item.receiptId}`
            : `ENTRY_${item.id}`;

        if (!acc[billKey]) {
          acc[billKey] = [];
        }

        acc[billKey].push(item);
        return acc;
      },
      {},
    );

    const transformedData: ClientReportEntry[] = [];
    let srNo = 1;
    let groupId = 0;

    Object.entries(groupedData).forEach(([_, items]) => {
      groupId++;
      const groupRowSpan = items.length;
      const currentSrNo = srNo++;
      const firstItem = items[0];
      const groupBillNo = (firstItem.billNumber || '').trim();
      const hasBillNo = Boolean(groupBillNo);

      const receiptObj = items.find((it: any) => it.receipt)?.receipt as any;

      const rawTotalWeight = hasBillNo
        ? (receiptObj?.totalWeight ??
          receiptObj?.fineWeight ??
          items.find(
            (it: any) =>
              (it.totalWeight !== undefined && it.totalWeight !== null) ||
              (it.fineWeight !== undefined && it.fineWeight !== null) ||
              (it.fineweight !== undefined && it.fineweight !== null),
          )?.totalWeight ??
          items.find(
            (it: any) => it.fineWeight !== undefined && it.fineWeight !== null,
          )?.fineWeight ??
          items.find(
            (it: any) => it.fineweight !== undefined && it.fineweight !== null,
          )?.fineweight ??
          (firstItem as any).totalWeight ??
          (firstItem as any).fineWeight ??
          (firstItem as any).fineweight)
        : null;

      const groupTotalWeight =
        rawTotalWeight !== undefined && rawTotalWeight !== null
          ? Number(rawTotalWeight)
          : null;

      const rawGiven = hasBillNo
        ? (receiptObj?.paid ??
          receiptObj?.customerWeight ??
          items.find((it: any) => it.paid !== undefined && it.paid !== null)
            ?.paid ??
          items.find(
            (it: any) =>
              it.customerWeight !== undefined && it.customerWeight !== null,
          )?.customerWeight ??
          items.find((it: any) => it.given !== undefined && it.given !== null)
            ?.given ??
          (firstItem as any).paid ??
          (firstItem as any).customerWeight ??
          (firstItem as any).given)
        : null;

      const groupGiven =
        rawGiven !== undefined && rawGiven !== null ? Number(rawGiven) : null;

      const rawPending = hasBillNo
        ? (receiptObj?.pending ??
          receiptObj?.remainingWeight ??
          items.find(
            (it: any) => it.pending !== undefined && it.pending !== null,
          )?.pending ??
          items.find(
            (it: any) =>
              it.remainingWeight !== undefined && it.remainingWeight !== null,
          )?.remainingWeight ??
          (firstItem as any).pending ??
          (firstItem as any).remainingWeight)
        : null;

      const groupPending =
        rawPending !== undefined && rawPending !== null
          ? Number(rawPending)
          : null;

      items.forEach((item, index) => {
        const isFirstInBill = index === 0;
        const itemName = item.item?.name || 'Gold';
        const isGold =
          itemName.trim().toLowerCase() === 'gold' ||
          itemName.trim().toLowerCase().includes('gold');
        const sizeValue = isGold ? '' : item.size?.size || '';
        const purityValue = isGold
          ? '100'
          : item.purity !== null && item.purity !== undefined
            ? item.purity.toString()
            : 'N/A';

        const itemDate = new Date(item.createdAt);
        const itemFormattedDate = itemDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const itemFormattedTime = itemDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const itemDateTime = `${itemFormattedDate} ${itemFormattedTime}`;

        const weightValue = item.weight || 0;

        transformedData.push({
          id: item.id || `group-${groupId}-${index}`,
          srNo: currentSrNo,
          dateTime: itemDateTime,
          billNo: isFirstInBill ? groupBillNo : '',
          item: itemName,
          size: sizeValue,
          purity: purityValue,
          remark: item.remark || 'N/A',
          wt: weightValue,
          chainWt: isGold ? null : weightValue,
          goldWt: isGold ? weightValue : null,
          isGold,
          groupId: `group-${groupId}`,
          isFirstInGroup: isFirstInBill,
          groupRowSpan,
          rawGroupItems: isFirstInBill ? items : undefined,
          fineWeight: isFirstInBill && hasBillNo ? groupTotalWeight : null,
          totalWeight: isFirstInBill && hasBillNo ? groupTotalWeight : null,
          given: isFirstInBill && hasBillNo ? groupGiven : null,
          paid: isFirstInBill && hasBillNo ? groupGiven : null,
          pending: isFirstInBill && hasBillNo ? groupPending : null,
        });
      });
    });

    setReportData(transformedData);
    setLoading(false);
  }, [clientReportData, fromDate, toDate]);

  // Filter entries
  const filteredData = searchTerm
    ? reportData.filter((entry) => {
        const query = searchTerm.toLowerCase();
        return reportData.some((groupEntry) => {
          if (groupEntry.groupId !== entry.groupId) return false;
          return (
            groupEntry.item.toLowerCase().includes(query) ||
            groupEntry.billNo.toLowerCase().includes(query) ||
            groupEntry.size.toLowerCase().includes(query) ||
            groupEntry.remark.toLowerCase().includes(query) ||
            groupEntry.purity.toLowerCase().includes(query) ||
            groupEntry.wt.toString().includes(query) ||
            (groupEntry.fineWeight !== null &&
              groupEntry.fineWeight !== undefined &&
              groupEntry.fineWeight.toString().includes(query)) ||
            (groupEntry.totalWeight !== null &&
              groupEntry.totalWeight !== undefined &&
              groupEntry.totalWeight.toString().includes(query)) ||
            (groupEntry.given !== null &&
              groupEntry.given !== undefined &&
              groupEntry.given.toString().includes(query)) ||
            (groupEntry.pending !== null &&
              groupEntry.pending !== undefined &&
              groupEntry.pending.toString().includes(query)) ||
            (groupEntry.chainWt !== null &&
              groupEntry.chainWt.toString().includes(query)) ||
            (groupEntry.goldWt !== null &&
              groupEntry.goldWt.toString().includes(query))
          );
        });
      })
    : reportData;

  const clientList = Array.isArray(clientsData?.data)
    ? clientsData.data
    : Array.isArray(clientsData)
      ? clientsData
      : [];
  const currentClient = clientList.find((c: any) => c.id === id) || {};
  const currentClientName = currentClient.fullName || currentClient.name || '';

  const handleOpenSettleModal = () => {
    const balance = Number(
      currentClient.goldBalance ??
        currentClient.balance ??
        currentClient.due ??
        currentClient.openingBalance ??
        0,
    );

    setSettlementDetail({
      clientName: currentClientName || 'Client',
      phoneNumber: currentClient.phoneNumber || '',
      address: currentClient.address || '',
      pendingBalance: balance,
      totalBills: 0,
      settlementAmount: 0,
      settlementType: 'receive',
      date: new Date().toISOString().split('T')[0],
      clientId: id,
      openingBalance: currentClient.openingBalance || 0,
      due: currentClient.due || null,
    });

    setLocalAmount('');
    setShowSettleModal(true);
  };

  const closeSettlementModal = () => {
    setShowSettleModal(false);
    setShowConfirmModal(false);
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

      closeSettlementModal();
      refetch();
      refetchClients();
    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to save settlement');
    }
  };

  const handleOpenReceipt = (entry: ClientReportEntry) => {
    const rawItems = entry.rawGroupItems || [];
    const clientName = currentClientName || 'Client';
    const phoneNumber = currentClient.phoneNumber || '';
    const address = currentClient.address || '';
    const prevDue = Number(
      currentClient.openingBalance ??
        currentClient.goldBalance ??
        currentClient.balance ??
        0,
    );

    const totalWeight =
      rawItems.length > 0
        ? Math.abs(
            rawItems.reduce((acc, it) => acc + (Number(it.weight) || 0), 0),
          )
        : Math.abs(Number(entry.wt ?? entry.chainWt ?? entry.goldWt ?? 0));

    const items =
      rawItems.length > 0
        ? rawItems.map((it) => {
            const itemName = it.item?.name || 'Gold';
            const isGold =
              itemName.trim().toLowerCase() === 'gold' ||
              itemName.trim().toLowerCase().includes('gold');
            const purity = isGold
              ? '100%'
              : it.purity !== null && it.purity !== undefined
                ? `${it.purity}%`
                : '100%';
            const weight = Math.abs(Number(it.weight) || 0);
            return {
              item: itemName + (it.size?.size ? ` (${it.size.size})` : ''),
              purity,
              fineWeight: weight,
              weight,
              remark: it.remark || '',
            };
          })
        : [
            {
              item: entry.item || 'Gold',
              purity:
                entry.purity && entry.purity !== 'N/A'
                  ? entry.purity.includes('%')
                    ? entry.purity
                    : `${entry.purity}%`
                  : '100%',
              fineWeight: Math.abs(
                Number(entry.wt ?? entry.chainWt ?? entry.goldWt ?? 0),
              ),
              weight: Math.abs(
                Number(entry.wt ?? entry.chainWt ?? entry.goldWt ?? 0),
              ),
              remark: entry.remark || '',
            },
          ];

    const newDue = Number((prevDue + totalWeight).toFixed(3));

    printClientReceipt(
      {
        clientName,
        phoneNumber,
        address,
        billNumber: entry.billNo || undefined,
        transactionType: 'give',
        amount: totalWeight,
        previousBalance: prevDue,
        newBalance: newDue,
        dateTime: entry.dateTime,
        remark: entry.remark || undefined,
        items,
      },
      getpdfheaderdata,
    );
  };

  const handleFromDateChange = (dates: Date[]) => {
    if (isTrial) setIsDateFilterActive(true);
    if (dates && dates.length > 0) {
      const from = new Date(dates[0]);
      from.setHours(0, 0, 0, 0);

      if (toDate && from > toDate) {
        const sunday = new Date(from);
        sunday.setDate(from.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        setFromDate(from);
        setToDate(sunday);
      } else {
        setFromDate(from);
      }
    } else {
      setFromDate(null);
    }
  };

  const handleToDateChange = (dates: Date[]) => {
    if (isTrial) setIsDateFilterActive(true);
    if (dates && dates.length > 0) {
      const to = new Date(dates[0]);
      to.setHours(23, 59, 59, 999);

      if (fromDate && to < fromDate) {
        const monday = new Date(to);
        monday.setDate(to.getDate() - 6);
        monday.setHours(0, 0, 0, 0);
        setFromDate(monday);
        setToDate(to);
      } else {
        setToDate(to);
      }
    } else {
      setToDate(null);
    }
  };

  const openingEntry = reportData.find((e) =>
    (e.remark || '').toLowerCase().includes('opening'),
  );
  const detectedOpeningBalance = openingEntry
    ? Number(openingEntry.wt ?? openingEntry.goldWt ?? openingEntry.chainWt ?? 0)
    : 0;
  const openingBalance =
    Number(currentClient.openingBalance ?? 0) ||
    detectedOpeningBalance ||
    Number(currentClient.goldBalance ?? currentClient.due ?? 0);

  const handlePrint = () => {
    printClientReportDoc({
      filteredData,
      currentClientName,
      fromDate,
      toDate,
      headerData: getpdfheaderdata,
      openingBalance,
    });
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#785600]"></div>
          <p className="mt-4 text-[#785600] dark:text-amber-400">
            Loading client report...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 text-5xl text-red-500">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
            Error Loading Report
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Failed to fetch client report data.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-white hover:bg-[#5d4200]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <button
              onClick={() => navigate({to: '/setlment/settlement'})}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Client Report {currentClientName ? `- ${currentClientName}` : ''}
            </h2>
          </div>

          {/* Controls: Datepickers, Search, Settle and Print */}
          <div className="flex w-full flex-col items-center gap-2 sm:w-auto xl:flex-row">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <GenericWeeklyDatePicker
                id="from-date-box"
                mode="from"
                placeholder="DD/MM/YYYY"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={handleFromDateChange}
                className="w-32 sm:w-36 md:w-40"
              />

              <GenericWeeklyDatePicker
                id="to-date-box"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={toDate ? [toDate] : []}
                onDateChange={handleToDateChange}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search by bill, item, size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenSettleModal}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#785600] font-semibold text-white shadow-sm transition-colors hover:bg-[#5d4200] h-9 px-4 text-xs sm:text-[13px]"
            >
              <Wallet className="h-4 w-4" />
              <span>Settle</span>
            </button>

            <GenericButton
              onClick={handlePrint}
              className="!bg-[#785600] !text-white hover:!bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4 md:px-6">
        <ClientReportTable
          filteredData={filteredData}
          onOpenReceipt={handleOpenReceipt}
          openingBalance={openingBalance}
        />
      </div>

      {/* Settle Modal Integration */}
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
    </div>
  );
}
