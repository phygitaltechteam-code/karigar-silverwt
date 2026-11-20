import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import {
  useGetSoldering,
  useGetSolderingHistory,
  useSubmitSoldering,
  useCreateSoldering,
  useRevertSolderingCard,
  getBackendErrorMessage,
} from '@/lib/api/soldering';
import { useGetSizes } from '@/lib/api/sizes';
import { useSubmitMoveCutting } from '@/lib/api/cutting';
import {
  useGetBox,
  useGetBoxweight,
  useGetBoxHistory,
  useRevertBoxCard,
} from '@/lib/api/box';
import { BoxRevertModal } from './BoxRevertModal';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useAddSolderingMelting } from '@/lib/api/processmelting';
import { useGetProcessAlert, AlertRule } from '@/lib/api/alertmanagement';

import {
  SolderingEntry,
  SolderingCardForm,
  createNewSolderingCard,
  getCurrentWeekRange,
  truncate3Dec,
  printSolderingHistory,
  getSolderingColumns,
} from './solderingUtils';
import HistorySoldering from './HistorySoldering';
import { loadSolderingKarigars } from '@/components/MasterPages/UnifiedKarigarMaster';
import { loadSolderingDesigns } from '@/components/MasterPages/UnifiedDesignMaster';
import { SolderingStockStrip } from './SolderingStockStrip';
import { SolderingConfirmModal } from './SolderingConfirmModal';
import { AddSolderingModal } from './AddSolderingModal';
import { SolderingHeaderControls } from './SolderingHeaderControls';
import { SolderingDispatchModal } from './SolderingDispatchModal';
import {
  DEFAULT_DEMO_SOLDERING,
  mapSolderingApiData,
  filterSolderingHistoryData,
} from './solderingDataHelpers';
import {
  getPuritiesForSize,
  getAvailableBoxQty,
  getRowRemainingAvailable,
  calculateBoxCards,
  calculateAvailablePurities,
  getSolderingAlertRules,
} from './solderingStockHelpers';
import {
  calculateSolderingInlineChange,
  saveJointPolishingCard,
  saveCuttingStockCard,
  buildSolderingPayloads,
  createLocalSolderingEntries,
} from './solderingCalculationHelpers';

const SolderingDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [solderingEntries, setSolderingEntries] = useState<SolderingEntry[]>([]);
  const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(new Set());
  const [revertLoadingIds, setRevertLoadingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [, setHasEditedRow] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'joint' | 'cutting' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [solderingStockCards, setSolderingStockCards] = useState<
    { id: string; purity: number; stamp: string; availableWeight: number; totalWeight: number }[]
  >([]);
  const [isDispatchPopupOpen, setIsDispatchPopupOpen] = useState(false);
  const [selectedSolderingCard, setSelectedSolderingCard] = useState<
    { id: string; purity: number; stamp: string; availableWeight: number; totalWeight: number } | null
  >(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chain_soldering_stock_cards_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSolderingStockCards(parsed);
      }
    } catch (e) {}
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCards, setModalCards] = useState<SolderingCardForm[]>([
    createNewSolderingCard(),
  ]);

  const [selectedBoxForModal, setSelectedBoxForModal] = useState<{
    id: string;
    sizeId: string;
    size: string;
    purity: number;
    stamp?: string;
    totalWeight: number;
    design?: string;
  } | null>(null);

  const solderingKarigarOptions = React.useMemo(() => loadSolderingKarigars(), [isModalOpen]);
  const solderingDesignOptions = React.useMemo(() => loadSolderingDesigns(), [isModalOpen]);
  const [selectedKarigar, setSelectedKarigar] = useState<string>('');
  const [selectedDesign, setSelectedDesign] = useState<string>('');
  const [selectedStamp, setSelectedStamp] = useState<string>('92.5');

  const currentDesignObj = React.useMemo(
    () => solderingDesignOptions.find((d) => d.designName === selectedDesign) || solderingDesignOptions[0],
    [solderingDesignOptions, selectedDesign],
  );
  const currentRate = currentDesignObj?.ratePerDesign || '120';

  useEffect(() => {
    if (isModalOpen) {
      const kList = loadSolderingKarigars();
      if (kList.length > 0 && !selectedKarigar) setSelectedKarigar(kList[0].name);
      const dList = loadSolderingDesigns();
      if (dList.length > 0 && !selectedDesign) setSelectedDesign(dList[0].designName);
      if (selectedBoxForModal?.stamp) {
        setSelectedStamp(selectedBoxForModal.stamp);
      }
    }
  }, [isModalOpen, selectedBoxForModal, selectedKarigar, selectedDesign]);

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const {
    data: solderingData = [],
    isLoading: solderingLoading,
    refetch,
  } = useGetSoldering();

  const {
    data: solderingHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetSolderingHistory();

  const { data: sizes = [] } = useGetSizes();
  const { data: boxData = [] } = useGetBox();
  const {
    data: tarData = [],
    refetch: tarRefetch,
  } = useGetBoxweight();

  const [isBoxRevertModalOpen, setIsBoxRevertModalOpen] = useState(false);
  const {
    data: rawBoxHistory = [],
    isLoading: isBoxHistoryLoading,
    refetch: refetchBoxHistory,
  } = useGetBoxHistory();
  const revertBox = useRevertBoxCard();

  const handleRevertSelectedBox = async (ids: string[]) => {
    let successCount = 0;
    for (const id of ids) {
      try {
        await revertBox.mutateAsync(id);
        successCount++;
      } catch (e) {
        console.error('Failed to revert box id:', id, e);
      }
    }
    if (successCount > 0) {
      toast.success(`Successfully reverted ${successCount} Box record(s)`);
      await refetchBoxHistory();
      await tarRefetch();
      await refetch();
    }
  };

  const submitSoldering = useSubmitSoldering();
  const createSoldering = useCreateSoldering();
  const submitCutting = useSubmitMoveCutting();
  const submitMelting = useAddSolderingMelting();
  const revertSoldering = useRevertSolderingCard();

  const { data: solderingAlertRaw } = useGetProcessAlert('soldering');

  const alertRules: AlertRule[] = React.useMemo(
    () => getSolderingAlertRules(solderingAlertRaw),
    [solderingAlertRaw],
  );

  const handleRevert = async (entry: SolderingEntry) => {
    setRevertLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await revertSoldering.mutateAsync(entry.id);
      await Promise.all([
        refetch(),
        refetchHistory(),
        tarRefetch(),
      ]);
    } catch (error: any) {
      console.error('Error in revert soldering:', error);
    } finally {
      setRevertLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  };

  const handleMelting = async (entry: SolderingEntry) => {
    setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: parseFloat(entry.purity) || 0,
          chainWeight: entry.chainWeight || 0,
          solderingId: entry.id,
        },
      });
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

  const boxStockList = Array.isArray((tarData as any)?.data)
    ? (tarData as any).data
    : Array.isArray(tarData)
      ? tarData
      : [];

  const boxCards = React.useMemo(
    () => calculateBoxCards(boxStockList, sizes),
    [boxStockList, sizes],
  );

  const availablePurities = React.useMemo(
    () => calculateAvailablePurities(boxCards, boxData),
    [boxCards, boxData],
  );

  const getAvailableBoxQtyMemo = useCallback(
    (sizeId?: string, purity?: string): number => {
      return getAvailableBoxQty(boxCards, boxStockList, boxData, sizes, sizeId, purity);
    },
    [boxCards, boxStockList, boxData, sizes],
  );

  const getRowRemainingAvailableMemo = useCallback(
    (cardIndex: number, sizeId?: string, purity?: string): number => {
      return getRowRemainingAvailable(
        modalCards,
        selectedBoxForModal,
        getAvailableBoxQtyMemo,
        cardIndex,
        sizeId,
        purity,
      );
    },
    [modalCards, selectedBoxForModal, getAvailableBoxQtyMemo],
  );

  // Load data from API
  useEffect(() => {
    if (solderingLoading) return;
    if (solderingData && solderingData.length > 0) {
      setSolderingEntries(mapSolderingApiData(solderingData));
    } else {
      setSolderingEntries((prev) => (prev.length > 0 ? prev : DEFAULT_DEMO_SOLDERING));
    }
  }, [solderingData, solderingLoading]);

  const getFilteredHistory = () => {
    const rawList = Array.isArray(solderingHistory)
      ? solderingHistory
      : Array.isArray((solderingHistory as any)?.data)
        ? (solderingHistory as any).data
        : [];
    return filterSolderingHistoryData(
      rawList,
      fromDate,
      toDate,
      historySearchTerm,
      isTrial,
      isDateFilterActive,
    );
  };

  const handlePrintHistory = () => {
    const success = printSolderingHistory(
      getFilteredHistory(),
      fromDate,
      toDate,
      getpdfheaderdata,
    );
    if (!success) {
      toast.error('No history records available to print for the selected date range');
    }
  };

  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'chainReceived' | 'scrap' | 'purity' | 'description' | 'Description' | 'Description (तपशील)',
      value: string,
    ) => {
      setHasEditedRow(true);
      setSolderingEntries((prev) =>
        prev.map((entry, i) =>
          i !== index ? entry : calculateSolderingInlineChange(entry, field, value),
        ),
      );
    },
    [],
  );

  const { getScaleProps } = useTableScaleFocus<'chainReceived' | 'scrap'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  const handleSaveClick = useCallback(
    (index: number, action: 'joint' | 'cutting') => {
      setSaveIndex(index);
      setActionType(action);
      setShowConfirmModal(true);
    },
    [],
  );

  const confirmSaveJoint = useCallback(async () => {
    if (saveIndex === null) return;
    const index = saveIndex;
    const entry = solderingEntries[index];
    setIsLoading(true);

    try {
      await submitSoldering.mutateAsync({
        id: entry.id,
        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          purity: Number(entry.purity || 0),
          isCompleted: true,
        },
      });

      saveJointPolishingCard(entry);

      setSolderingEntries((prev) =>
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
      await refetch();
    } catch (error: any) {
      console.error('Error saving soldering:', error);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, solderingEntries, submitSoldering, refetch]);

  const confirmSaveCutting = useCallback(async () => {
    if (saveIndex === null) return;
    const index = saveIndex;
    const entry = solderingEntries[index];
    setIsLoading(true);

    try {
      await submitCutting.mutateAsync({
        id: entry.id,
        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          purity: Number(entry.purity || 0),
          isCompleted: true,
        },
      });

      const updatedCards = saveCuttingStockCard(entry, solderingStockCards);
      setSolderingStockCards(updatedCards);

      setSolderingEntries((prev) =>
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
      await refetch();
    } catch (error: any) {
      console.error('Error saving soldering:', error);
      const updatedCards = saveCuttingStockCard(entry, solderingStockCards);
      setSolderingStockCards(updatedCards);

      setSolderingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
            : s,
        ),
      );

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, solderingEntries, submitCutting, refetch, solderingStockCards]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBoxForModal(null);
    setModalCards([createNewSolderingCard()]);
  };

  const handleSaveAllCards = async () => {
    for (let i = 0; i < modalCards.length; i++) {
      const card = modalCards[i];
      if (!card.sizeId) {
        card.sizeId = sizes.length > 0 ? String(sizes[0].id || (sizes[0] as any)._id) : 'size-1';
      }
      const chainWeightVal = parseFloat(card.chainWeight) || 0;
      if (chainWeightVal <= 0) {
        toast.error(`Please enter a valid Chain Weight for Row #${i + 1}`);
        return;
      }
      const availableQty = getRowRemainingAvailableMemo(i, card.sizeId, card.purity);
      if (availableQty > 0 && chainWeightVal > availableQty) {
        toast.error(
          `Row #${i + 1}: Chain Weight (${chainWeightVal}g) cannot exceed Available Quantity (${availableQty}g)`,
        );
        return;
      }
    }

    setModalCards((prev) => prev.map((c) => ({ ...c, isSaving: true })));

    try {
      const allPayloads = buildSolderingPayloads(
        modalCards,
        sizes,
        selectedBoxForModal,
        selectedStamp,
        selectedKarigar,
        selectedDesign,
        currentRate,
      );

      await createSoldering.mutateAsync(allPayloads);

      const newCreatedEntries = createLocalSolderingEntries(
        allPayloads,
        solderingEntries.length,
        selectedDesign,
      );

      setSolderingEntries((prev) => [...newCreatedEntries, ...prev]);

      toast.success(`Successfully saved ${allPayloads.length} soldering item(s)`);
      handleCloseModal();
      await tarRefetch();
      await refetch();
    } catch (error: any) {
      console.error('Error saving soldering cards:', error);
      toast.error(
        getBackendErrorMessage(error, 'Failed to save all soldering entries'),
      );
      await tarRefetch();
      await refetch();
    } finally {
      setModalCards((prev) => prev.map((c) => ({ ...c, isSaving: false })));
    }
  };

  const hasEditableValues = (entry: SolderingEntry): boolean => Boolean(entry.isDirty);
  const isSubmitting = submitSoldering.isPending || submitCutting.isPending;

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      setFromDate(null);
      setToDate(null);
      refetch();
    } else {
      setShowHistory(true);
      const { monday, sunday } = getCurrentWeekRange();
      setFromDate(monday);
      setToDate(sunday);
      refetchHistory();
    }
  };

  const columns = useMemo(
    () =>
      getSolderingColumns(
        getScaleProps,
        handleInlineChange,
        handleSaveClick,
        handleMelting,
        handleRevert,
        solderingLoading,
        isSubmitting,
        meltingLoadingIds,
        revertLoadingIds,
        hasEditableValues,
        alertRules,
        solderingEntries.length,
        solderingEntries,
      ),
    [
      getScaleProps,
      handleInlineChange,
      handleSaveClick,
      handleMelting,
      handleRevert,
      solderingLoading,
      isSubmitting,
      meltingLoadingIds,
      revertLoadingIds,
      alertRules,
      solderingEntries,
    ],
  );

  const filteredSolderingEntries = useMemo(() => {
    if (!tableSearchTerm.trim()) return solderingEntries;
    const term = tableSearchTerm.toLowerCase().trim();
    return solderingEntries.filter(
      (e) =>
        (e.design || '').toLowerCase().includes(term) ||
        (e.stamp || '').toLowerCase().includes(term) ||
        (e.karigar || '').toLowerCase().includes(term) ||
        (e.description || '').toLowerCase().includes(term) ||
        String(e.purity || '').includes(term) ||
        String(e.tarWeight || '').includes(term),
    );
  }, [solderingEntries, tableSearchTerm]);

  return (
    <div className="flex flex-col gap-4">
      {!showHistory && (
        <SolderingStockStrip
          solderingStockCards={solderingStockCards}
          onSelectCard={(card) => {
            setSelectedSolderingCard(card);
            setIsDispatchPopupOpen(true);
          }}
        />
      )}

      {/* Header Controls */}
      <SolderingHeaderControls
        showHistory={showHistory}
        tableSearchTerm={tableSearchTerm}
        setTableSearchTerm={setTableSearchTerm}
        historySearchTerm={historySearchTerm}
        setHistorySearchTerm={setHistorySearchTerm}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        isTrial={isTrial}
        setIsDateFilterActive={setIsDateFilterActive}
        handlePrintHistory={handlePrintHistory}
        toggleHistory={toggleHistory}
      />

      {/* Table Section */}
      {!showHistory ? (
        <div>
          <GenericTable<SolderingEntry>
            data={filteredSolderingEntries}
            columns={columns}
            emptyMessage={
              tableSearchTerm
                ? `No soldering records found matching "${tableSearchTerm}"`
                : 'No soldering entries found.'
            }
            isLoading={false}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        <HistorySoldering
          filteredData={getFilteredHistory()}
          historyLoading={historyLoading}
          fromDate={fromDate}
          toDate={toDate}
          alertRules={alertRules}
        />
      )}

      {/* Confirmation Modal */}
      <SolderingConfirmModal
        isOpen={showConfirmModal}
        actionType={actionType}
        isLoading={isLoading}
        onCancel={() => {
          setShowConfirmModal(false);
          setSaveIndex(null);
          setActionType(null);
        }}
        onConfirm={actionType === 'joint' ? confirmSaveJoint : confirmSaveCutting}
      />

      {/* Add Soldering Modal */}
      <AddSolderingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        modalCards={modalCards}
        selectedBoxForModal={selectedBoxForModal}
        selectedStamp={selectedStamp}
        selectedKarigar={selectedKarigar}
        selectedDesign={selectedDesign}
        currentRate={currentRate}
        solderingKarigarOptions={solderingKarigarOptions}
        solderingDesignOptions={solderingDesignOptions}
        setSelectedKarigar={setSelectedKarigar}
        setSelectedDesign={setSelectedDesign}
        onOpenRevertModal={() => {
          refetchBoxHistory();
          setIsBoxRevertModalOpen(true);
        }}
        onSaveAll={handleSaveAllCards}
      />

      {/* Box Revert Modal */}
      <BoxRevertModal
        isOpen={isBoxRevertModalOpen}
        onClose={() => setIsBoxRevertModalOpen(false)}
        boxHistoryData={rawBoxHistory}
        isLoading={isBoxHistoryLoading}
        onRevertSelected={handleRevertSelectedBox}
        refetchHistory={refetchBoxHistory}
      />

      {/* Soldering Process Dispatch Popup Modal */}
      <SolderingDispatchModal
        isOpen={isDispatchPopupOpen}
        onClose={() => {
          setIsDispatchPopupOpen(false);
          setSelectedSolderingCard(null);
        }}
        selectedCard={selectedSolderingCard}
        stockCards={solderingStockCards}
        setStockCards={setSolderingStockCards}
      />
    </div>
  );
};

export default SolderingDept;
