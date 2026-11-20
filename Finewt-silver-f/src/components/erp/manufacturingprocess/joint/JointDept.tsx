import React, {useState, useEffect, useCallback, useRef} from 'react';
import {ChevronRight, ChevronDown, Printer, Search} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {GenericTable} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetJoint,
  useGetJointHistory,
  useSubmitJoint,
  useRevertJoint,
} from '@/lib/api/joint';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';
import {useAddJointMelting} from '@/lib/api/processmelting';
import {useGetProcessAlert, AlertRule} from '@/lib/api/alertmanagement';

import {
  JointEntry,
  getJointColumns,
  printJointHistory,
  toNumber,
  truncate3Dec,
} from './jointUtils';
import HistoryJoint from './HistoryJoint';

const JointDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [jointEntries, setJointEntries] = useState<JointEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(
    new Set(),
  );
  const [revertLoadingIds, setRevertLoadingIds] = useState<Set<string>>(
    new Set(),
  );

  const getDefaultWeekRange = () => {
    const {fromDate, toDate} = getCurrentAppWeekRange();
    return {monday: fromDate, sunday: toDate};
  };

  const [dateRange, setDateRange] = useState<Date[]>(() => {
    const {fromDate, toDate} = getCurrentAppWeekRange();
    return [fromDate, toDate];
  });

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

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

  const isInitialMount = useRef(true);

  // Fetch data from API
  const {
    data: jointData = [],
    isLoading: jointLoading,
    refetch,
  } = useGetJoint();
  const {
    data: jointHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetJointHistory();
  const submitJoint = useSubmitJoint();
  const submitMelting = useAddJointMelting();
  const revertJoint = useRevertJoint();

  // Query joint alert threshold rules
  const {data: jointAlertRaw} = useGetProcessAlert('joint');

  const alertRules: AlertRule[] = React.useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(jointAlertRaw) && jointAlertRaw.length > 0) {
      list = jointAlertRaw;
    } else if (jointAlertRaw && typeof jointAlertRaw === 'object') {
      if (Array.isArray((jointAlertRaw as any).data)) {
        list = (jointAlertRaw as any).data;
      } else if ((jointAlertRaw as any).grossWt !== undefined) {
        list = [jointAlertRaw];
      }
    }

    if (list.length === 0) {
      try {
        const saved = localStorage.getItem(
          'chain_alert_management_settings_v2',
        );
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.joint) && parsed.joint.length > 0) {
            list = parsed.joint;
          }
        }
      } catch (e) {}
    }

    return list;
  }, [jointAlertRaw]);

  const handleRevert = async (entry: JointEntry) => {
    setRevertLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await revertJoint.mutateAsync(entry.id);
      await refetch();
    } catch (error: any) {
      console.error('Error in revert joint:', error);
    } finally {
      setRevertLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  };

  const handleMelting = async (entry: JointEntry) => {
    setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: entry.purity || 0,
          chainWeight: entry.chainWeight || entry.chainReceived || 0,
          jointId: entry.id,
        },
      });
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

  const {getScaleProps} = useTableScaleFocus<
    'powderReceived' | 'powder' | 'scrap'
  >((index, field, weight) => {
    handleInlineChange(index, field, weight.toString());
  });

  // Load data from API
  useEffect(() => {
    if (jointLoading) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    const rawJointList = Array.isArray(jointData)
      ? jointData
      : Array.isArray((jointData as any)?.data)
        ? (jointData as any).data
        : [];

    if (rawJointList.length > 0) {
      const entries: JointEntry[] = rawJointList.map(
        (joint: any, index: number) => {
          const itemName = joint.item?.name || joint.itemId || 'N/A';
          const sizeName = joint.size?.size || joint.sizeId || 'N/A';

          const chainGiven =
            joint.chainWeight !== undefined && joint.chainWeight !== null
              ? joint.chainWeight
              : joint.chainReceived || joint.chainGiven || 0;
          const isSaved = joint.isCompleted === true;
          const chainReceived = isSaved ? joint.powderReceived || 0 : 0;
          const scrapVal = isSaved ? joint.scrap || 0 : 0;
          const powder =
            chainReceived > 0
              ? Math.max(0, truncate3Dec(chainReceived + scrapVal - chainGiven))
              : joint.powder || 0;
          const increase =
            powder > 0 && chainReceived > 0
              ? truncate3Dec((powder / (chainReceived + scrapVal)) * 100)
              : joint.increase || 0;
          const loss =
            joint.loss !== undefined && joint.loss !== null
              ? joint.loss
              : isSaved && chainReceived > 0
                ? Math.max(
                    0,
                    Math.round((chainGiven - chainReceived - scrapVal) * 1000) /
                      1000,
                  )
                : 0;

          const basePurity =
            typeof joint.purity === 'number'
              ? joint.purity
              : parseFloat(joint.purity) || 0;

          return {
            id: joint.id,
            srNo: index + 1,
            dateTime: new Date(joint.createdAt)
              .toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              .replace(/,/g, ''),
            item: itemName,
            size: sizeName,
            purity: joint.purity || 0,
            basePurity: basePurity,
            chainWeight: chainGiven,
            chainReceived: chainGiven,
            powder: powder,
            powderReceived: chainReceived,
            increase: increase,
            srp: joint.srp || 0,
            scrap: scrapVal,
            loss: loss,
            isEditing: !isSaved,
            isSaved: isSaved,
            powderReceivedRaw:
              joint.powderReceived !== null &&
              joint.powderReceived !== undefined
                ? joint.powderReceived.toString()
                : '',
            powderRaw: powder > 0 ? powder.toString() : '',
            srpRaw: '',
            purityRaw: joint.purity ? joint.purity.toString() : '',
            scrapRaw:
              joint.scrap !== null && joint.scrap !== undefined
                ? joint.scrap.toString()
                : '',
            itemId: joint.itemId,
            sizeId: joint.sizeId,
            isCompleted: joint.isCompleted || false,
            isDirty: false,
            status: joint.status || '',
            process: joint.process || '',
            isMelting: joint.isMelting || false,
            meltingStatus: joint.meltingStatus || false,
          };
        },
      );
      setJointEntries(entries);
    } else {
      setJointEntries([]);
    }
  }, [jointData, jointLoading]);

  // Filter history by selected From-To date range.
  const getFilteredHistory = () => {
    const rawHistoryList = Array.isArray(jointHistory)
      ? jointHistory
      : Array.isArray((jointHistory as any)?.data)
        ? (jointHistory as any).data
        : [];
    let filtered = rawHistoryList;

    if (isTrial && !isDateFilterActive) {
      // Bypass date filtering for trial
    } else if (dateRange && dateRange.length > 0) {
      if (dateRange[0]) {
        const from = new Date(dateRange[0]);
        from.setHours(0, 0, 0, 0);
        filtered = filtered.filter((item: any) => {
          if (!item?.createdAt) return false;
          const itemDate = new Date(item.createdAt);
          if (Number.isNaN(itemDate.getTime())) return false;
          return itemDate >= from;
        });
      }
      if (dateRange[1]) {
        const to = new Date(dateRange[1]);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((item: any) => {
          if (!item?.createdAt) return false;
          const itemDate = new Date(item.createdAt);
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
        const chainGivenStr = String(
          item?.chainReceived || item?.chainWeight || '',
        ).toLowerCase();
        const powderRecStr = String(item?.powderReceived || '').toLowerCase();
        const powderStr = String(item?.powder || '').toLowerCase();
        const scrapStr = String(item?.scrap || '').toLowerCase();
        const purityStr = String(item?.purity || '').toLowerCase();

        return (
          itemName.includes(term) ||
          sizeName.includes(term) ||
          dateStr.includes(term) ||
          chainGivenStr.includes(term) ||
          powderRecStr.includes(term) ||
          powderStr.includes(term) ||
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
        totalGiven: number;
        totalReceived: number;
        totalPowder: number;
        totalPowderReceived: number;
        totalScrap: number;
        totalLoss: number;
      },
      item: any,
    ) => ({
      totalGiven: acc.totalGiven + toNumber(item?.chainWeight),
      totalReceived: acc.totalReceived + toNumber(item?.chainReceived),
      totalPowder: acc.totalPowder + toNumber(item?.powder),
      totalPowderReceived:
        acc.totalPowderReceived + toNumber(item?.powderReceived),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss:
        acc.totalLoss +
        toNumber(
          item?.loss ??
            Math.max(
              0,
              (item?.chainReceived || item?.chainWeight || 0) -
                (item?.powderReceived || 0) -
                (item?.scrap || 0),
            ),
        ),
    }),
    {
      totalGiven: 0,
      totalReceived: 0,
      totalPowder: 0,
      totalPowderReceived: 0,
      totalScrap: 0,
      totalLoss: 0,
    },
  );

  const handlePrintHistory = () => {
    printJointHistory(getFilteredHistory(), dateRange, getpdfheaderdata);
  };

  // Handle inline field change
  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'powderReceived' | 'powder' | 'purity' | 'scrap',
      value: string,
    ) => {
      setJointEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = {...entry};

            if (field === 'powderReceived') {
              updated.powderReceivedRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.powderReceived = 0;
              } else {
                const numValue = parseFloat(value);
                updated.powderReceived = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'powder') {
              updated.powderRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.powder = 0;
              } else {
                const numValue = parseFloat(value);
                updated.powder = isNaN(numValue) ? 0 : numValue;
              }
            } else if (field === 'purity') {
              updated.purityRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.purity = 0;
              } else {
                const numValue = parseFloat(value);
                updated.purity = isNaN(numValue) ? 0 : numValue;
                if (!isNaN(numValue) && numValue > 0) {
                  updated.basePurity = numValue;
                }
              }
            } else if (field === 'scrap') {
              updated.scrapRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.scrap = 0;
              } else {
                const numValue = parseFloat(value);
                updated.scrap = isNaN(numValue) ? 0 : numValue;
              }
            }

            if (field === 'powderReceived' || field === 'scrap') {
              const chainGiven = entry.chainReceived || entry.chainWeight || 0;
              const autoPowder = Math.max(
                0,
                truncate3Dec(
                  updated.powderReceived + (updated.scrap || 0) - chainGiven,
                ),
              );
              updated.powder = autoPowder;
              updated.powderRaw = autoPowder > 0 ? autoPowder.toString() : '0';

              if (updated.powder > 0 && updated.powderReceived > 0) {
                updated.increase = truncate3Dec(
                  (updated.powder /
                    (updated.powderReceived + (updated.scrap || 0))) *
                    100,
                );
              } else {
                updated.increase = 0;
              }
            }

            // Automatically adjust purity: new purity% = base purity% - increase%
            // Skip recalculation when the user is manually editing purity
            if (field !== 'purity') {
              const baseP =
                entry.basePurity !== undefined && entry.basePurity > 0
                  ? entry.basePurity
                  : (typeof entry.purity === 'number'
                      ? entry.purity
                      : parseFloat(
                          entry.purityRaw || String(entry.purity) || '0',
                        )) || 0;

              if (baseP > 0) {
                const calculatedPurity = Math.max(
                  0,
                  truncate3Dec(baseP - updated.increase),
                );
                updated.purity = calculatedPurity;
                updated.purityRaw = calculatedPurity.toString();
              }
            }

            const chainGiven = Number(
              entry.chainReceived || entry.chainWeight || 0,
            );
            const receivedAmount = Number(updated.powderReceived || 0);
            const scrapAmount = Number(updated.scrap || 0);

            updated.loss = Math.max(
              0,
              Math.round((chainGiven - receivedAmount - scrapAmount) * 1000) /
                1000,
            );

            console.log(`[Joint Field Change - Row #${index + 1}]`, {
              fieldChanged: field,
              newValue: value,
              chainGiven: chainGiven,
              powderReceived: receivedAmount,
              scrap: scrapAmount,
              calculatedLoss: updated.loss,
              formula: `${chainGiven} (Chain Given) - ${receivedAmount} (Powder Received) - ${scrapAmount} (Scrap) = ${updated.loss} G (Loss)`,
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

  const handleSaveClick = useCallback((index: number) => {
    setSaveIndex(index);
    setShowConfirmModal(true);
  }, []);

  const confirmSave = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = jointEntries[index];

    setIsLoading(true);

    try {
      await submitJoint.mutateAsync({
        id: entry.id,
        data: {
          powderReceived: entry.powderReceived,
          powder: entry.powder,
          increase: entry.increase,
          purity: Number(entry.purity || 0),
          scrap: entry.scrap,
          loss: entry.loss,
          srp: 0,
          isCompleted: true,
        },
      });

      setJointEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? {...s, isEditing: false, isSaved: true, isCompleted: true}
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();
    } catch (error: any) {
      console.error('Error saving joint:', error);
      const errorMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to save joint entry';
      toast.error(errorMessage);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, jointEntries, submitJoint, refetch]);

  const hasEditableValues = (entry: JointEntry): boolean => {
    return Boolean(entry.isDirty);
  };

  const isSubmitting = submitJoint.isPending;

  const columns = getJointColumns(
    getScaleProps,
    handleInlineChange,
    handleSaveClick,
    handleMelting,
    handleRevert,
    isLoading,
    isSubmitting,
    meltingLoadingIds,
    revertLoadingIds,
    hasEditableValues,
  );

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Joint History' : 'Joint Department'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Weekly Date Filter - Only show when viewing history */}
          {showHistory && (
            <div className="flex items-center gap-2">
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
            </div>
          )}

          {/* Print History Button */}
          {showHistory && (
            <GenericButton size="sm"
              type="button"
              onClick={handlePrintHistory}
              variant="primary"
            >
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Print</span>
            </GenericButton>
          )}

          {/* History Toggle Button */}
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
            <span>{showHistory ? 'Show Joint' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Conditional Rendering: Joint Table OR History Table */}
      {!showHistory ? (
        <div>
          <GenericTable<JointEntry>
            data={jointEntries}
            columns={columns}
            emptyMessage="No joint entries found."
            isLoading={false}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        <HistoryJoint
          filteredData={getFilteredHistory()}
          historyLoading={historyLoading}
          dateRange={dateRange}
          historyTotals={historyTotals}
          alertRules={alertRules}
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
                Are you sure you want to save this joint entry and proceed to{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  Cutting
                </strong>
                ?
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

export default JointDept;
