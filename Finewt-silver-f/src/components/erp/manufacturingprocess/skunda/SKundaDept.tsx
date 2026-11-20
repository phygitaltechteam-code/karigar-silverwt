import React, {useState, useEffect, useCallback, useRef} from 'react';
import {ChevronRight, ChevronDown, Printer, Plus, Search} from 'lucide-react';
import toast from 'react-hot-toast';
import {GenericTable} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {
  useAddSKundaInStock,
  useGetKunda,
  useGetKundaHistory,
  useSubmitKunda,
  useRevertKunda,
} from '@/lib/api/cutting';
import {useGetHeader} from '@/lib/api/headerapi';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';
import {useAddSkundaMelting} from '@/lib/api/processmelting';
import {
  useGetProcessAlert,
  checkProcessLossAlert,
} from '@/lib/api/alertmanagement';

import {
  KundaEntry,
  hasMeltingStatus,
  toNumber,
  getDefaultWeekRange,
  printSKundaHistory,
  getSKundaColumns,
} from './sKundaUtils';
import HistorySKunda from './HistorySKunda';
import SkundaAddInStock from './SkundaAddInStock';
import { SKundaConfirmModal } from './SKundaConfirmModal';

const SKundaDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [kundaEntries, setKundaEntries] = useState<KundaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [revertLoadingIds, setRevertLoadingIds] = useState<
    Record<string, boolean>
  >({});
  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const {monday, sunday} = getDefaultWeekRange();
    return [monday, sunday];
  });

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      const {monday, sunday} = getDefaultWeekRange();
      setDateRange([monday, sunday]);
      setIsDateFilterActive(true);
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, []);

  const isInitialMount = useRef(true);

  const {
    data: kundaData = [],
    isLoading: kundaLoading,
    refetch,
    error,
  } = useGetKunda();
  const {
    data: kundaHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetKundaHistory();
  const submitKunda = useSubmitKunda();
  const revertKunda = useRevertKunda();
  const addStockInward = useAddSKundaInStock();
  const {data: alertRules} = useGetProcessAlert('kunda');

  const {getScaleProps} = useTableScaleFocus<
    'kundaGiven' | 'chainReceived' | 'scrap'
  >((index, field, weight) => {
    handleInlineChange(index, field, weight.toString());
  });

  const handleRevert = async (item: KundaEntry) => {
    if (!item.id) return;
    try {
      setRevertLoadingIds((prev) => ({...prev, [item.id]: true}));
      await revertKunda.mutateAsync(item.id);
      await refetch();
    } catch (error: any) {
      console.error('Error reverting S Kunda entry:', error);
    } finally {
      setRevertLoadingIds((prev) => ({...prev, [item.id]: false}));
    }
  };

  useEffect(() => {
    if (kundaLoading) return;

    if (error) {
      console.error('Error fetching S Kunda data:', error);
      setKundaEntries([]);
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    const rawKundaList = Array.isArray(kundaData)
      ? kundaData
      : Array.isArray((kundaData as any)?.data)
        ? (kundaData as any).data
        : [];

    if (rawKundaList.length > 0) {
      const entries: KundaEntry[] = rawKundaList.map(
        (kunda: any, index: number) => {
          const itemName = kunda.item?.name || kunda.itemId || 'N/A';
          const sizeName = kunda.size?.size || kunda.sizeId || 'N/A';

          const chainGiven = kunda.chainWeight || 0;
          const isSaved = kunda.isCompleted === true;
          const kundaGiven = isSaved ? kunda.kundaGiven || kunda.kunda || 0 : 0;
          const chainReceived = isSaved ? kunda.chainReceived || 0 : 0;
          const scrap = isSaved ? kunda.scrap || 0 : 0;
          const loss =
            isSaved && (chainReceived > 0 || kundaGiven > 0 || scrap > 0)
              ? kunda.loss !== undefined && kunda.loss !== null
                ? kunda.loss
                : Math.max(
                    0,
                    Math.round(
                      (chainGiven + kundaGiven - chainReceived - scrap) * 1000,
                    ) / 1000,
                  )
              : 0;

          return {
            id: kunda.id,
            srNo: index + 1,
            dateTime: new Date(kunda.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            item: itemName,
            size: sizeName,
            purity: kunda.purity || 0,
            chainGiven: chainGiven,
            kundaGiven: kundaGiven,
            chainReceived: chainReceived,
            scrap: scrap,
            loss: loss,
            isEditing: !isSaved,
            isSaved: isSaved,
            kundaGivenRaw:
              isSaved && (kunda.kundaGiven || kunda.kunda)
                ? (kunda.kundaGiven || kunda.kunda).toString()
                : '',
            chainReceivedRaw:
              isSaved && kunda.chainReceived
                ? kunda.chainReceived.toString()
                : '',
            scrapRaw: isSaved && kunda.scrap ? kunda.scrap.toString() : '',
            purityRaw:
              kunda.purity !== null && kunda.purity !== undefined && kunda.purity !== '' && kunda.purity !== 0
                ? String(parseFloat(Number(kunda.purity).toFixed(2)))
                : '',
            itemId: kunda.itemId,
            sizeId: kunda.sizeId,
            isCompleted: kunda.isCompleted || false,
            isDirty: false,
            status: kunda.status,
            process: kunda.process,
            isMelting: kunda.isMelting,
            meltingStatus: kunda.meltingStatus,
          };
        },
      );
      setKundaEntries(entries);
    } else {
      setKundaEntries([]);
    }
  }, [kundaData, kundaLoading, error]);

  // Filter and sort history by Proceed Date & Time
  const getFilteredHistory = () => {
    let filtered = Array.isArray(kundaHistory?.data)
      ? kundaHistory.data
      : Array.isArray(kundaHistory)
        ? kundaHistory
        : [];

    // Sort descending by Proceed Date & Time
    filtered = [...filtered].sort((a: any, b: any) => {
      const dateA = new Date(
        a.updatedAt || a.proceedDateTime || a.updated_at || a.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        b.updatedAt || b.proceedDateTime || b.updated_at || b.createdAt || 0,
      ).getTime();
      return dateB - dateA;
    });

    if (isTrial && !isDateFilterActive) {
      // Bypass date filtering for trial
    } else if (dateRange && dateRange.length > 0) {
      if (dateRange[0]) {
        const from = new Date(dateRange[0]);
        from.setHours(0, 0, 0, 0);
        filtered = filtered.filter((item: any) => {
          const dateVal =
            item?.updatedAt ||
            item?.proceedDateTime ||
            item?.updated_at ||
            item?.createdAt;
          if (!dateVal) return false;
          const itemDate = new Date(dateVal);
          if (Number.isNaN(itemDate.getTime())) return false;
          return itemDate >= from;
        });
      }
      if (dateRange[1]) {
        const to = new Date(dateRange[1]);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((item: any) => {
          const dateVal =
            item?.updatedAt ||
            item?.proceedDateTime ||
            item?.updated_at ||
            item?.createdAt;
          if (!dateVal) return false;
          const itemDate = new Date(dateVal);
          if (Number.isNaN(itemDate.getTime())) return false;
          return itemDate <= to;
        });
      }
    }

    if (historySearchTerm.trim()) {
      const searchLower = historySearchTerm.trim().toLowerCase();
      filtered = filtered.filter((item: any) => {
        const itemName = (item?.itemName || item?.item || '').toLowerCase();
        const purity = (item?.purity?.toString() || '').toLowerCase();
        const size = (item?.size?.toString() || '').toLowerCase();
        const chainGiven = (
          item?.chainGiven?.toString() ||
          item?.chainWeight?.toString() ||
          ''
        ).toLowerCase();
        const kundaGiven = (
          item?.kundaGiven?.toString() ||
          item?.kunda?.toString() ||
          ''
        ).toLowerCase();
        const chainReceived = (
          item?.chainReceived?.toString() || ''
        ).toLowerCase();
        const scrap = (item?.scrap?.toString() || '').toLowerCase();
        const loss = (item?.loss?.toString() || '').toLowerCase();
        const timeTaken = (item?.timeTaken || '').toLowerCase();
        const remarks = (item?.remarks || item?.remark || '').toLowerCase();
        const dateStr =
          item?.updatedAt ||
          item?.proceedDateTime ||
          item?.updated_at ||
          item?.createdAt ||
          '';

        return (
          itemName.includes(searchLower) ||
          purity.includes(searchLower) ||
          size.includes(searchLower) ||
          chainGiven.includes(searchLower) ||
          kundaGiven.includes(searchLower) ||
          chainReceived.includes(searchLower) ||
          scrap.includes(searchLower) ||
          loss.includes(searchLower) ||
          timeTaken.includes(searchLower) ||
          remarks.includes(searchLower) ||
          dateStr.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  const filteredHistory = getFilteredHistory();
  const historyTotals = filteredHistory.reduce(
    (
      acc: {
        totalGiven: number;
        totalKundaGiven: number;
        totalReceived: number;
        totalScrap: number;
        totalLoss: number;
      },
      item: any,
    ) => ({
      totalGiven:
        acc.totalGiven + toNumber(item?.chainWeight || item?.chainGiven),
      totalKundaGiven:
        acc.totalKundaGiven +
        toNumber(item?.kundaGiven || item?.kundaGiven || item?.kunda),
      totalReceived: acc.totalReceived + toNumber(item?.chainReceived),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss: acc.totalLoss + toNumber(item?.loss),
    }),
    {
      totalGiven: 0,
      totalKundaGiven: 0,
      totalReceived: 0,
      totalScrap: 0,
      totalLoss: 0,
    },
  );

  const handlePrintHistory = () => {
    printSKundaHistory(
      getFilteredHistory(),
      dateRange,
      getpdfheaderdata,
      alertRules,
    );
  };

  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'kundaGiven' | 'chainReceived' | 'scrap' | 'purity',
      value: string,
    ) => {
      setKundaEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = {...entry};

            if (field === 'kundaGiven') {
              updated.kundaGivenRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.kundaGiven = 0;
              } else {
                const numValue = parseFloat(value);
                updated.kundaGiven = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'chainReceived') {
              updated.chainReceivedRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.chainReceived = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainReceived = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'scrap') {
              updated.scrapRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.scrap = 0;
              } else {
                const numValue = parseFloat(value);
                updated.scrap = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'purity') {
              updated.purityRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.purity = 0;
              } else {
                const numValue = parseFloat(value);
                updated.purity = isNaN(numValue) ? 0 : numValue;
              }
            }

            const kundaAmount = Number(updated.kundaGiven || 0);
            const receivedAmount = Number(updated.chainReceived || 0);
            const scrapAmount = Number(updated.scrap || 0);
            const totalGiven = Number(updated.chainGiven || 0) + kundaAmount;

            updated.loss = Math.max(
              0,
              Math.round((totalGiven - receivedAmount - scrapAmount) * 1000) /
                1000,
            );

            console.log(`[S/Kunda Field Change - Row #${index + 1}]`, {
              fieldChanged: field,
              newValue: value,
              chainGiven: updated.chainGiven,
              kundaGiven: kundaAmount,
              chainReceived: receivedAmount,
              scrap: scrapAmount,
              calculatedLoss: updated.loss,
              formula: `(${updated.chainGiven} Given + ${kundaAmount} Kunda) - ${receivedAmount} (Received) - ${scrapAmount} (Scrap) = ${updated.loss} G (Loss)`,
            });

            updated.isDirty = true;
            return updated;
          }
          return entry;
        }),
      );
    },
    [],
  );

  const handleStockClick = useCallback(
    (index: number) => {
      const entry = kundaEntries[index];

      if (!entry.chainReceived || entry.chainReceived < 0) {
        toast.error('Please enter a valid chain received weight');
        return;
      }

      if (!entry.purity || entry.purity <= 0 || entry.purity > 100) {
        toast.error('Please enter a valid purity percentage');
        return;
      }

      setSaveIndex(index);
      setShowConfirmModal(true);
    },
    [kundaEntries],
  );

  // Update the handleStockAdded function
  const handleStockAdded = async (stockData: {
    id: string;
    stockId?: string;
    weight: number;
  }) => {
    try {
      const stockId = stockData.stockId || stockData.id;
      await addStockInward.mutateAsync({
        id: stockId,
        data: {
          stockId: stockId,
          weight: stockData.weight,
        },
      });
      await refetch();
    } catch (error: any) {
      console.error('Error adding stock:', error);
    }
  };

  const confirmStock = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = kundaEntries[index];

    setIsLoading(true);

    try {
      await submitKunda.mutateAsync({
        id: entry.id,
        data: {
          kundaGiven: entry.kundaGiven,
          chainReceived: entry.chainReceived,
          scrap: entry.scrap,
          purity: Number(entry.purity || 0),
          loss: entry.loss,
          isCompleted: true,
        },
      });

      setKundaEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                isEditing: false,
                isSaved: true,
                isCompleted: true,
                isDirty: false,
              }
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();
    } catch (error: any) {
      console.error('Error submitting S Kunda process:', error);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, kundaEntries, submitKunda, refetch, alertRules]);

  const hasEditableValues = (entry: KundaEntry): boolean => {
    return Boolean(entry.isDirty);
  };

  const showActionColumn = kundaEntries.some(
    (entry) => !entry.isSaved && entry.isDirty,
  );

  const isSubmitting = submitKunda.isPending;

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  const columns = getSKundaColumns(
    getScaleProps,
    handleInlineChange,
    handleStockClick,
    isLoading,
    isSubmitting,
    hasEditableValues,
    showActionColumn,
    alertRules,
    handleRevert,
    revertLoadingIds,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'S Kunda History' : 'S Kunda Department'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showHistory && (
            <>
              {/* Search Bar */}
              <div className="relative w-full sm:w-48 md:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                <input
              autoComplete="off"
              data-lpignore="true"
                  type="search"
                  placeholder="Search history..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <GenericWeeklyDatePicker
                  id="from-date-box"
                  placeholder="DD/MM/YYYY"
                  mode="from"
                  initialDates={dateRange}
                  onDateChange={(dates) => {
                    if (isTrial) setIsDateFilterActive(true);
                    if (dates && dates.length > 0) {
                      const from = new Date(dates[0]);
                      from.setHours(0, 0, 0, 0);
                      setDateRange((prev) => [from, prev[1] || from]);
                    } else {
                      setDateRange((prev) => [undefined as any, prev[1]]);
                    }
                  }}
                  className="w-32 sm:w-36 md:w-40"
                />

                <GenericWeeklyDatePicker
                  id="to-date-box"
                  placeholder="DD/MM/YYYY"
                  mode="to"
                  initialDates={dateRange}
                  onDateChange={(dates) => {
                    if (isTrial) setIsDateFilterActive(true);
                    if (dates && dates.length > 0) {
                      const to = new Date(dates[0]);
                      to.setHours(23, 59, 59, 999);
                      setDateRange((prev) => [prev[0] || to, to]);
                    } else {
                      setDateRange((prev) => [prev[0], undefined as any]);
                    }
                  }}
                  className="w-32 sm:w-36 md:w-40"
                />
              </div>

              <GenericButton size="sm"
                type="button"
                onClick={handlePrintHistory}
                variant="primary"
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Print</span>
              </GenericButton>
            </>
          )}
          {!showHistory && (
            <GenericButton size="sm"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add</span>
            </GenericButton>
          )}
          <GenericButton size="sm"
            type="button"
            onClick={toggleHistory}
            variant="primary"
          >
            {showHistory ? (
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span>{showHistory ? 'Show S Kunda' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {!showHistory ? (
        <div>
          <GenericTable<KundaEntry>
            data={kundaEntries}
            columns={columns}
            emptyMessage="No S Kunda entries found."
            isLoading={false}
            showSrNo={true}
            srNoLabel="Sr No."
            rowClassName={(item) =>
              hasMeltingStatus(item)
                ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
                : ''
            }
          />
        </div>
      ) : (
        <HistorySKunda
          filteredData={getFilteredHistory()}
          historyTotals={historyTotals}
          historyLoading={historyLoading}
          alertRules={alertRules}
        />
      )}
      <SkundaAddInStock
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleStockAdded}
      />
      <SKundaConfirmModal
        isOpen={showConfirmModal}
        isLoading={isLoading}
        onCancel={() => {
          setShowConfirmModal(false);
          setSaveIndex(null);
        }}
        onConfirm={confirmStock}
      />
    </div>
  );
};

export default SKundaDept;
