import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Printer,
  Plus,
  Box,
  Search,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetBox,
  useGetBoxHistory,
  useSubmitBox,
  useRevertBox,
  useBreakBox,
} from '@/lib/api/box';

import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { getCurrentAppWeekRange } from '@/utils/weekRangeUtils';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useAddBoxMelting } from '@/lib/api/processmelting';
import {
  useGetProcessAlert,
  checkProcessLossAlert,
  AlertRule,
} from '@/lib/api/alertmanagement';

import {
  BoxEntry,
  formatNumberDisplay,
  hasMeltingStatus,
  printBoxHistory,
  getHistoryBoxColumns,
  getBoxColumns,
  isSplitRow,
  truncate3Dec,
} from './boxUtils';
import HistoryBox from './HistoryBox';

const BoxDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [boxEntries, setBoxEntries] = useState<BoxEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [revertLoadingIds, setRevertLoadingIds] = useState<
    Record<string, boolean>
  >({});
  const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(
    new Set(),
  );
  const isInitialMount = useRef(true);

  // Fetch data from API
  const { data: boxData = [], isLoading: boxLoading, refetch } = useGetBox();
  const {
    data: boxHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetBoxHistory();

  const submitBox = useSubmitBox();
  const revertBox = useRevertBox();
  const breakBox = useBreakBox();
  const submitMelting = useAddBoxMelting();

  // Query box alert threshold rules
  const { data: boxAlertRaw } = useGetProcessAlert('box');

  const alertRules: AlertRule[] = React.useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(boxAlertRaw) && boxAlertRaw.length > 0) {
      list = boxAlertRaw;
    } else if (boxAlertRaw && typeof boxAlertRaw === 'object') {
      if (Array.isArray((boxAlertRaw as any).data)) {
        list = (boxAlertRaw as any).data;
      } else if ((boxAlertRaw as any).grossWt !== undefined) {
        list = [boxAlertRaw];
      }
    }

    if (list.length === 0) {
      try {
        const saved = localStorage.getItem(
          'chain_alert_management_settings_v2',
        );
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.box) && parsed.box.length > 0) {
            list = parsed.box;
          }
        }
      } catch (e) { }
    }

    return list;
  }, [boxAlertRaw]);

  const handleMelting = async (entry: BoxEntry) => {
    // Add this entry ID to loading set
    setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: entry.purity,
          tarWeight: entry.tarWeight,
          boxId: entry.id,
        },
      });

      // toast.success('Melting process completed successfully');
      await refetch();
    } catch (error: any) {
      console.error('Error in melting:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        'Failed to process melting';
      toast.error(errorMessage);
    } finally {
      setMeltingLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  };
  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'chainWeight' | 'scrap'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  const getDefaultWeekRange = () => {
    const { fromDate, toDate } = getCurrentAppWeekRange();
    return { monday: fromDate, sunday: toDate };
  };

  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const { monday, sunday } = getDefaultWeekRange();
    return [monday, sunday];
  });

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      const { monday, sunday } = getDefaultWeekRange();
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

  // Helper function to convert to number safely
  const toNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  // Load data from API
  useEffect(() => {
    if (boxLoading) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    const rawBoxList = Array.isArray(boxData)
      ? boxData
      : Array.isArray((boxData as any)?.data)
        ? (boxData as any).data
        : [];

    if (rawBoxList.length > 0) {
      const entries: BoxEntry[] = rawBoxList.map((box: any, index: number) => {
        const itemName = box.item?.name || box.itemId || 'N/A';

        const chainWeight = box.chainWeight || 0;
        const tarWeight = box.tarWeight || 0;
        const scrap = box.scrap || 0;
        const loss =
          chainWeight > 0 || scrap > 0
            ? Math.max(
              0,
              Math.round((tarWeight - chainWeight - scrap) * 1000) / 1000,
            )
            : 0;

        const isSaved =
          box.isCompleted === true &&
          box.chainWeight !== null &&
          box.chainWeight !== undefined &&
          box.scrap !== null &&
          box.scrap !== undefined;

        const dateTime = new Date(box.createdAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        return {
          id: box.id,
          srNo: index + 1,
          dateTime: dateTime,
          item: itemName,
          purity: box.purity || box.tar?.purity || 0,
          tarWeight: tarWeight,
          chainWeight: chainWeight,
          scrap: box.scrap || 0,
          loss: loss,
          isEditing: !isSaved,
          isSaved: isSaved,
          purityRaw: box.purity
            ? box.purity.toString()
            : box.tar?.purity
              ? box.tar.purity.toString()
              : '',
          chainWeightRaw: box.chainWeight ? box.chainWeight.toString() : '',
          scrapRaw: box.scrap ? box.scrap.toString() : '',
          itemId: box.itemId,
          isCompleted: box.isCompleted || false,
          isDirty: false,
          status: box.status,
          process: box.process,
          isMelting: box.isMelting,
          meltingStatus: box.meltingStatus,
        };
      });
      setBoxEntries(entries);
    } else {
      setBoxEntries([]);
    }
  }, [boxData, boxLoading]);

  // Filter and sort history by Proceed Date & Time
  const getFilteredHistory = () => {
    let filtered = Array.isArray(boxHistory?.data)
      ? boxHistory.data
      : Array.isArray(boxHistory)
        ? boxHistory
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
      const term = historySearchTerm.toLowerCase();
      filtered = filtered.filter((item: any) => {
        const itemName = (
          typeof item?.item === 'object'
            ? item?.item?.name || item?.item?.item || ''
            : item?.item || ''
        ).toLowerCase();
        const sizeName = (
          typeof item?.size === 'object'
            ? item?.size?.size || item?.size?.name || ''
            : item?.size || ''
        ).toLowerCase();
        const dateStr = (
          item?.updatedAt ||
          item?.proceedDateTime ||
          item?.updated_at ||
          item?.createdAt ||
          ''
        ).toLowerCase();
        const tarStr = String(item?.tarWeight || '').toLowerCase();
        const chainStr = String(item?.chainWeight || '').toLowerCase();
        const scrapStr = String(item?.scrap || '').toLowerCase();
        const purityStr = String(item?.purity || '').toLowerCase();

        return (
          itemName.includes(term) ||
          sizeName.includes(term) ||
          dateStr.includes(term) ||
          tarStr.includes(term) ||
          chainStr.includes(term) ||
          scrapStr.includes(term) ||
          purityStr.includes(term)
        );
      });
    }

    return filtered;
  };

  // Calculate history totals
  const filteredHistory = getFilteredHistory();
  const historyTotals = filteredHistory.reduce(
    (
      acc: {
        totalTar: number;
        totalChain: number;
        totalScrap: number;
        totalLoss: number;
      },
      item: any,
    ) => ({
      totalTar: acc.totalTar + toNumber(item?.tarWeight),
      totalChain: acc.totalChain + toNumber(item?.chainWeight),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss:
        acc.totalLoss +
        toNumber(
          item?.loss ??
          (item?.tarWeight || 0) -
          (item?.chainWeight || 0) -
          (item?.scrap || 0),
        ),
    }),
    { totalTar: 0, totalChain: 0, totalScrap: 0, totalLoss: 0 },
  );


  // Print History Function
  const handlePrintHistory = () => {
    const fromDate = dateRange?.[0] || null;
    const toDate = dateRange?.[1] || null;
    printBoxHistory(getFilteredHistory(), dateRange, getpdfheaderdata);
  };

  const historyColumns = getHistoryBoxColumns(alertRules);

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  // Reset date range to current week
  const resetDateRange = () => {
    const { monday, sunday } = getDefaultWeekRange();
    setDateRange([monday, sunday]);
  };

  // Handle inline field change
  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'chainWeight' | 'scrap' | 'purity',
      value: string,
    ) => {
      setBoxEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };

            if (field === 'chainWeight') {
              updated.chainWeightRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.chainWeight = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainWeight = isNaN(numValue) ? 0 : numValue;
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
            const tarVal = Number(entry.tarWeight || 0);
            const chainVal = Number(updated.chainWeight || 0);
            const scrapVal = Number(updated.scrap || 0);

            updated.loss = Math.max(
              0,
              Math.round((tarVal - chainVal - scrapVal) * 1000) / 1000,
            );

            console.log(`[Box Field Change - Row #${index + 1}]`, {
              fieldChanged: field,
              newValue: value,
              tarWeight: tarVal,
              chainWeight: chainVal,
              scrap: scrapVal,
              calculatedLoss: updated.loss,
              formula: `${tarVal} (Tar Wt) - ${chainVal} (Chain Wt) - ${scrapVal} (Scrap) = ${updated.loss} G (Loss)`,
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

  // Open confirmation popup before saving
  const handleSaveClick = useCallback(
    (index: number) => {
      const entry = boxEntries[index];

      if (!entry.chainWeight || entry.chainWeight < 0) {
        toast.error('Please enter a valid chain weight');
        return;
      }

      setSaveIndex(index);
      setShowConfirmModal(true);
    },
    [boxEntries],
  );

  // Confirm and save
  const confirmSave = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = boxEntries[index];

    setIsLoading(true);

    try {
      await submitBox.mutateAsync({
        id: entry.id,
        data: {
          chainWeight: entry.chainWeight,
          scrap: entry.scrap,
          loss: entry.loss,
          purity: Number(entry.purity || 0),
          isCompleted: true,
        },
      });

      setBoxEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();
    } catch (error: any) {
      console.error('Error saving box:', error);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, boxEntries, submitBox, navigate, refetch]);

  const handleRevert = async (item: BoxEntry) => {
    if (!item.id) return;
    try {
      setRevertLoadingIds((prev) => ({ ...prev, [item.id]: true }));
      await revertBox.mutateAsync(item.id);
      await refetch();
    } catch (error: any) {
      console.error('Error reverting box entry:', error);
    } finally {
      setRevertLoadingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // Check if any editable field has values
  const hasEditableValues = (entry: BoxEntry): boolean => {
    return Boolean(entry.isDirty);
  };

  const isSubmitting = submitBox.isPending;

  const handleBreakTar = useCallback(
    async (_entry: BoxEntry, index: number) => {
      const current = boxEntries[index];
      if (!current) return;

      const chainWt =
        parseFloat(
          current.chainWeightRaw || current.chainWeight?.toString() || '0',
        ) || 0;

      if (chainWt <= 0) {
        toast.error('Please enter a Chain Weight before clicking Break');
        return;
      }

      if (chainWt >= current.tarWeight) {
        return;
      }

      const remainingTarWeight = truncate3Dec(current.tarWeight - chainWt);

      try {
        await breakBox.mutateAsync({
          id: current.id,
          data: {
            chainWeight: chainWt,
            tarWeight: current.tarWeight,
            remainingTarWeight,
            purity: current.purity,
          },
        });

        await refetch();
      } catch (error: any) {
        console.error('Error calling break box API:', error);
      }
    },
    [boxEntries, breakBox, refetch],
  );

  // Main table columns
  const columns = getBoxColumns(
    getScaleProps,
    handleInlineChange,
    handleSaveClick,
    handleMelting,
    hasEditableValues,
    isLoading,
    isSubmitting,
    meltingLoadingIds,
    alertRules,
    handleRevert,
    revertLoadingIds,
    boxEntries.length,
    handleBreakTar,
    boxEntries,
  );

  // Row class
  const getRowClassName = (_item: BoxEntry, _index: number): string => '';

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Box History' : 'Box Department'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filters - Only show when viewing history */}
          {showHistory && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Search History */}
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

              {/* From Date - Defaults to Monday */}
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

              {/* To Date - Defaults to Sunday */}
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
          )}

          {/* PRINT HISTORY */}
          {showHistory && (
            <GenericButton size="sm"
              type="button"
              onClick={handlePrintHistory}
              variant="primary"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          )}



          {/* HISTORY / SHOW BOX */}
          <GenericButton size="sm"
            type="button"
            onClick={toggleHistory}
            variant="primary"
          >
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Box' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Table Section */}
      {!showHistory ? (
        <div>
          <GenericTable<BoxEntry>
            data={boxEntries}
            columns={columns}
            emptyMessage="No box entries found."
            isLoading={false}
            showSrNo={true}
            srNoLabel="Sr No."
            rowClassName={getRowClassName}
          />
        </div>
      ) : (
        <HistoryBox
          dateRange={dateRange}
          historyTotals={historyTotals}
          historyData={getFilteredHistory()}
          historyColumns={historyColumns}
          historyLoading={historyLoading}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Save
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this box entry? This will move to
                the{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  Soldering Department
                </strong>
                .
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSaveIndex(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={isLoading}
                  className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Confirm Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BoxDept;
