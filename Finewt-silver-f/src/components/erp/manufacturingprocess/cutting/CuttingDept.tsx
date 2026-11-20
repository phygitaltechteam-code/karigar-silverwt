import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import {
  useGetCutting,
  useGetCuttingHistory,
  useGetCuttingStock,
  useGetLastCuttingStock,
  useSubmitCuttingStock,
  useSubmitCutting,
  useSubmitMoveKunda,
  useRevertCutting,
  useRevertCuttingStock,
} from '@/lib/api/cutting';
import { useGetItems } from '@/lib/api/items';
import { useGetSizes } from '@/lib/api/sizes';
import { useGetHeader } from '@/lib/api/headerapi';
import { getCurrentAppWeekRange } from '@/utils/weekRangeUtils';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import {
  useAddCuttingMelting,
  useGetCuttingScrap,
  getBackendErrorMessage,
  useAddCuttingScrap,
} from '@/lib/api/processmelting';
import {
  useGetProcessAlert,
} from '@/lib/api/alertmanagement';

import {
  CuttingEntry,
  hasMeltingStatus,
  getCuttingColumns,
  getHistoryCuttingColumns,
  printCuttingHistory,
} from './cuttingUtils';
import HistoryCutting from './HistoryCutting';
import MeltingPopup from './MeltingPopup';
import { StockCardItem } from './AddCuttingStockModal';
import { CuttingRevertModal } from './CuttingRevertModal';
import { CuttingConfirmModal } from './CuttingConfirmModal';
import { CuttingStockStrip } from './CuttingStockStrip';
import { CuttingHeaderControls } from './CuttingHeaderControls';
import { CuttingDispatchModal } from './CuttingDispatchModal';
import {
  DEFAULT_DEMO_CUTTING_STOCK,
  DEFAULT_DEMO_CUTTING_ENTRIES,
  mapCuttingApiData,
  filterCuttingHistoryData,
} from './cuttingDataHelpers';
import {
  calculateCuttingInlineChange,
  syncCuttingToSolderingStorage,
  calculateCuttingStockList,
} from './cuttingCalculationHelpers';

const CuttingDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const [cuttingEntries, setCuttingEntries] = useState<CuttingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setHasEditedRow] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'stock' | 'kunda' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(
    new Set(),
  );
  const [revertLoadingIds, setRevertLoadingIds] = useState<Set<string>>(
    new Set(),
  );
  const revertCutting = useRevertCutting();

  const handleRevert = async (entry: CuttingEntry) => {
    setRevertLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await revertCutting.mutateAsync(entry.id);
      await Promise.all([
        refetch(),
        refetchHistory(),
        refetchCuttingStock(),
        refetchCuttingScrap(),
      ]);
    } catch (error: any) {
      console.error('Error in revert cutting:', error);
    } finally {
      setRevertLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  };

  const handleRevertSelectedHistory = async (ids: string[]) => {
    let successCount = 0;
    for (const id of ids) {
      try {
        await revertCutting.mutateAsync(id);
        successCount++;
      } catch (e) {
        console.error('Failed to revert cutting history id:', id, e);
      }
    }
    if (successCount > 0) {
      await Promise.all([
        refetch(),
        refetchHistory(),
        refetchCuttingStock(),
        refetchCuttingScrap(),
      ]);
    }
  };

  // Scrap selection and modal states
  const [selectedScrapIds, setSelectedScrapIds] = useState<Set<string>>(
    new Set(),
  );
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [scrapModalItems, setScrapModalItems] = useState<
    { id: string; purity: number; availableWeight: number; sendWeight?: string }[]
  >([]);

  // Tab & Stock Modal States
  const [selectedStockCard, setSelectedStockCard] =
    useState<StockCardItem | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'chainReceived' | 'scrap'>(
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
    data: cuttingData = [],
    isLoading: cuttingLoading,
    refetch,
  } = useGetCutting();
  const {
    data: cuttingHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetCuttingHistory();
  const {
    data: lastCuttingStockData,
    isLoading: lastStockLoading,
    refetch: refetchLastStock,
  } = useGetLastCuttingStock();
  const submitCutting = useSubmitCutting();
  const submitMoveKunda = useSubmitMoveKunda();
  const submitMelting = useAddCuttingMelting();
  const { data: cuttingScrapData, refetch: refetchCuttingScrap } =
    useGetCuttingScrap();
  const { data: alertRules } = useGetProcessAlert('cutting');
  const { data: rawItemsData = [] } = useGetItems();
  const { data: cuttingStockData, refetch: refetchCuttingStock } =
    useGetCuttingStock();
  const { data: rawSizesData = [] } = useGetSizes();

  const itemsList = React.useMemo(() => {
    const list = Array.isArray((rawItemsData as any)?.data)
      ? (rawItemsData as any).data
      : Array.isArray(rawItemsData)
        ? rawItemsData
        : [];
    return list.filter((item: any) => {
      const name = String(item?.name || '').trim().toLowerCase();
      return name !== 'gold' && !name.includes('gold');
    });
  }, [rawItemsData]);

  const scrapList = React.useMemo(() => {
    const list = Array.isArray(cuttingScrapData?.data)
      ? cuttingScrapData.data
      : Array.isArray(cuttingScrapData)
        ? cuttingScrapData
        : [];
    return list;
  }, [cuttingScrapData]);

  const sizes = React.useMemo(() => {
    return Array.isArray((rawSizesData as any)?.data)
      ? (rawSizesData as any).data
      : Array.isArray(rawSizesData)
        ? rawSizesData
        : [];
  }, [rawSizesData]);

  const stockList = React.useMemo(
    () => calculateCuttingStockList(cuttingStockData, itemsList, sizes),
    [cuttingStockData, itemsList, sizes],
  );

  const handleMelting = async (entry: CuttingEntry) => {
    setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: entry.purity || 0,
          chainReceived: entry.chainReceived || 0,
          cuttingId: entry.id,
        },
      });
      await refetchCuttingScrap();
      await refetch();
    } catch (error: any) {
      console.error('Error in melting:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to process melting'));
    } finally {
      setMeltingLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  };

  // Load data from API
  useEffect(() => {
    if (cuttingLoading) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    const rawCuttingList = Array.isArray(cuttingData)
      ? cuttingData
      : Array.isArray((cuttingData as any)?.data)
        ? (cuttingData as any).data
        : [];

    if (rawCuttingList.length > 0) {
      setCuttingEntries(mapCuttingApiData(rawCuttingList));
    } else {
      setCuttingEntries(DEFAULT_DEMO_CUTTING_ENTRIES);
    }
  }, [cuttingData, cuttingLoading]);

  // Filter and sort history
  const getFilteredHistory = () => {
    const rawList = Array.isArray(cuttingHistory?.data)
      ? cuttingHistory.data
      : Array.isArray(cuttingHistory)
        ? cuttingHistory
        : [];
    return filterCuttingHistoryData(
      rawList,
      dateRange,
      historySearchTerm,
      isTrial,
      isDateFilterActive,
    );
  };

  // Handle inline field change
  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'chainGiven' | 'chainReceived' | 'scrap' | 'purity' | 'itemId' | 'item' | 'description' | 'stamp' | 'size' | 'qtyGiven' | 'qtyReceived',
      value: string,
    ) => {
      setHasEditedRow(true);

      setCuttingEntries((prev) =>
        prev.map((entry, i) =>
          i !== index
            ? entry
            : calculateCuttingInlineChange(entry, field, value, itemsList),
        ),
      );
    },
    [itemsList],
  );

  const handleSaveClick = useCallback(
    (index: number, target: 'stock' | 'kunda') => {
      const entry = cuttingEntries[index];

      if (!entry.chainGiven || entry.chainGiven < 0) {
        toast.error('Please enter a valid chain given weight');
        return;
      }

      if (!entry.chainReceived || entry.chainReceived < 0) {
        toast.error('Please enter a valid chain received weight');
        return;
      }

      setSaveIndex(index);
      setActionType(target);
      setShowConfirmModal(true);
    },
    [cuttingEntries],
  );

  const confirmSave = useCallback(async () => {
    if (saveIndex === null || !actionType) return;

    const index = saveIndex;
    const entry = cuttingEntries[index];

    const lossVal =
      entry.loss !== undefined && entry.loss !== null
        ? entry.loss
        : Math.max(
          0,
          Math.round(
            (Number(entry.chainGiven || 0) -
              Number(entry.chainReceived || 0) -
              Number(entry.scrap || 0)) *
            1000,
          ) / 1000,
        );

    setIsLoading(true);

    try {
      if (actionType === 'stock') {
        await submitCutting.mutateAsync({
          id: entry.id,
          data: {
            itemId: entry.itemId,
            item: entry.item,
            chainGiven: entry.chainGiven,
            chainReceived: entry.chainReceived,
            scrap: entry.scrap,
            loss: lossVal,
            purity: Number(entry.purity || 0),
            isCompleted: true,
          },
        });
      } else if (actionType === 'kunda') {
        await submitMoveKunda.mutateAsync({
          id: entry.id,
          data: {
            itemId: entry.itemId,
            item: entry.item,
            chainGiven: entry.chainGiven,
            chainReceived: entry.chainReceived,
            scrap: entry.scrap,
            loss: lossVal,
            purity: Number(entry.purity || 0),
            isCompleted: true,
          },
        });
      }

      if (actionType === 'stock') {
        syncCuttingToSolderingStorage(entry);
      }

      setCuttingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
            : s,
        ),
      );

      setHasEditedRow(false);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);

      await Promise.all([
        refetch(),
        refetchHistory(),
        refetchCuttingStock(),
        refetchCuttingScrap(),
      ]);
    } catch (error: any) {
      console.error('Error saving cutting:', error);
      toast.error(
        getBackendErrorMessage(error, 'Failed to save cutting entry'),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [
    saveIndex,
    actionType,
    cuttingEntries,
    submitCutting,
    submitMoveKunda,
    refetch,
    refetchHistory,
    refetchCuttingStock,
    refetchCuttingScrap,
  ]);

  const isSubmitting = submitCutting.isPending || submitMoveKunda.isPending;

  const columns = getCuttingColumns({
    getScaleProps,
    handleInlineChange,
    handleSaveClick,
    handleMelting,
    handleRevert,
    isLoading,
    isSubmitting,
    submitMoveKundaIsPending: submitMoveKunda.isPending,
    meltingLoadingIds,
    revertLoadingIds,
    alertRules,
    itemsList,
    totalEntriesCount: cuttingEntries.length,
  });

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
      {/* Available Cutting Stock Cards */}
      {!showHistory && (
        <CuttingStockStrip
          stockList={stockList}
          onSelectCard={(card) => {
            setSelectedStockCard(card);
            setIsStockModalOpen(true);
          }}
        />
      )}
      {/* Header Controls */}
      <CuttingHeaderControls
        showHistory={showHistory}
        historySearchTerm={historySearchTerm}
        setHistorySearchTerm={setHistorySearchTerm}
        dateRange={dateRange}
        setDateRange={setDateRange}
        isTrial={isTrial}
        setIsDateFilterActive={setIsDateFilterActive}
        handlePrint={() =>
          printCuttingHistory(
            getFilteredHistory(),
            dateRange,
            getpdfheaderdata,
          )
        }
        toggleHistory={toggleHistory}
      />

      {/* Conditional Rendering: Cutting Table OR History Table */}
      {!showHistory ? (
        <div>
          <GenericTable<CuttingEntry>
            data={cuttingEntries}
            columns={columns}
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
        <HistoryCutting
          filteredData={getFilteredHistory()}
          historyLoading={historyLoading}
          dateRange={dateRange}
          historyColumns={getHistoryCuttingColumns(alertRules)}
          alertRules={alertRules}
        />
      )}

      {/* Confirmation Modal */}
      <CuttingConfirmModal
        isOpen={showConfirmModal}
        actionType={actionType}
        isLoading={isLoading}
        onCancel={() => {
          setShowConfirmModal(false);
          setSaveIndex(null);
          setActionType(null);
        }}
        onConfirm={confirmSave}
      />

      {/* Scrap Received Modal */}
      <MeltingPopup
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        scrapModalItems={scrapModalItems}
        refetch={refetch}
        onSuccess={() => {
          setSelectedScrapIds(new Set());
        }}
      />

      {/* Cutting Process Dispatch to Next Process (Direct Wash Process) */}
      <CuttingDispatchModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedStockCard(null);
        }}
        selectedStockCard={selectedStockCard}
        onSuccess={async () => {
          await Promise.all([
            refetch(),
            refetchHistory(),
            refetchCuttingStock(),
            refetchCuttingScrap(),
          ]);
        }}
      />

      {/* Cutting History Revert Modal */}
      <CuttingRevertModal
        isOpen={isRevertModalOpen}
        onClose={() => setIsRevertModalOpen(false)}
        historyData={lastCuttingStockData || cuttingHistory}
        isLoading={lastStockLoading || historyLoading}
        onRevertSelected={handleRevertSelectedHistory}
        refetchHistory={() => {
          refetchLastStock();
          refetchHistory();
        }}
      />
    </div>
  );
};

export default CuttingDept;
