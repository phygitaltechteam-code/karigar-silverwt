import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  History,
  ChevronRight,
  ChevronDown,
  Printer,
  PackageCheck,
  Flame,
  Layers,
  Sparkles,
  Plus,
  X,
  Scale,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus, useScaleFocus } from '@/lib/hooks/useScaleFocus';
import {
  useGetMelting,
  useGetMeltingHistory,
  useGetScrap,
  useSubmitMeltingStock,
  useSubmitMeltingScrapStock,
} from '@/lib/api/melting';
import {
  useGetProcessAlert,
  checkProcessLossAlert,
} from '@/lib/api/alertmanagement';
import HistoryDept from './HistoryDept';
import AddDept from './AddDept';
import MeltingPopup, { ScrapModalItem } from '../cutting/MeltingPopup';
import ProcessDispatchPopup, { ProcessDispatchItem, ProcessDispatchPayload } from '../shared/ProcessDispatchPopup';
import { Package } from 'lucide-react';
import {
  MeltingRow,
  ScrapCardData,
  AlertRule,
  getCurrentWeekRange,
  calculateExpectedFine,
  formatNumberDisplay,
  formatDate,
  getMeltingColumns,
  checkMeltingLossAlert,
  printMeltingHistory,
} from './meltingUtils';
const MeltingDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [meltingEntries, setMeltingEntries] = useState<MeltingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

  // Melting Stock Cards for dispatch to Company
  const [meltingStockCards, setMeltingStockCards] = useState<{ id: string; purity: number; stamp: string; availableWeight: number; totalWeight: number; }[]>([]);
  const [isDispatchPopupOpen, setIsDispatchPopupOpen] = useState(false);
  const [selectedMeltingCard, setSelectedMeltingCard] = useState<{ id: string; purity: number; stamp: string; availableWeight: number; totalWeight: number; } | null>(null);

  // Load Melting Stock Cards
  useEffect(() => {
    try {
      const savedStock = localStorage.getItem('chain_melting_stock_cards_v2');
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed)) {
          setMeltingStockCards(parsed);
          return;
        }
      }
      setMeltingStockCards([]);
    } catch (e) { }
  }, []);

  const saveMeltingStockCards = (updated: { id: string; purity: number; stamp: string; availableWeight: number; totalWeight: number; }[]) => {
    setMeltingStockCards(updated);
    try {
      localStorage.setItem('chain_melting_stock_cards_v2', JSON.stringify(updated));
    } catch (e) { }
  };

  const handleDispatchSuccess = (payload: ProcessDispatchPayload) => {
    const usedWeight = payload.weight || 0;
    const cardId = payload.itemId;

    let newStockCards = [...meltingStockCards];
    const cardIndex = newStockCards.findIndex(c => c.id === cardId);
    if (cardIndex > -1) {
      const card = newStockCards[cardIndex];
      const remaining = Math.max(0, Math.round((card.availableWeight - usedWeight) * 1000) / 1000);
      if (remaining <= 0) newStockCards.splice(cardIndex, 1);
      else newStockCards[cardIndex] = { ...card, availableWeight: remaining };
      saveMeltingStockCards(newStockCards);
    }
  };

  // Add Scrap Modal state
  const [selectedScrapPurities, setSelectedScrapPurities] = useState<Set<number>>(new Set());
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [showAddScrapModal, setShowAddScrapModal] = useState(false);
  const [selectedPurity, setSelectedPurity] = useState<number | ''>('');
  const [availableWeight, setAvailableWeight] = useState<number>(0);
  const [scrapWeight, setScrapWeight] = useState<string>('');
  const [particular, setParticular] = useState<string>('');
  const [isSubmittingScrap, setIsSubmittingScrap] = useState(false);

  const isInitialMount = useRef(true);

  // Fetch data from API
  const {
    data: meltingData = [],
    isLoading: meltingLoading,
    refetch,
    error,
  } = useGetMelting();
  const {
    data: meltingHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetMeltingHistory();
  const { data: scrapData = [] } = useGetScrap();
  const submitMeltingStock = useSubmitMeltingStock();
  const submitMeltingScrap = useSubmitMeltingScrapStock();
  const { data: meltingAlertRaw } = useGetProcessAlert('melting');

  const alertRules: AlertRule[] = React.useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(meltingAlertRaw) && meltingAlertRaw.length > 0) {
      list = meltingAlertRaw;
    } else if (meltingAlertRaw && typeof meltingAlertRaw === 'object') {
      if (Array.isArray((meltingAlertRaw as any).data)) {
        list = (meltingAlertRaw as any).data;
      } else if ((meltingAlertRaw as any).grossWt !== undefined) {
        list = [meltingAlertRaw];
      }
    }

    if (list.length === 0) {
      try {
        const saved = localStorage.getItem(
          'chain_alert_management_settings_v2',
        );
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.melting) && parsed.melting.length > 0) {
            list = parsed.melting;
          }
        }
      } catch (e) { }
    }

    return list;
  }, [meltingAlertRaw]);

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'fineWeight'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  // Weighing Scale single focus hook for Add Scrap modal
  const modalScaleProps = useScaleFocus((weight) => {
    setScrapWeight(weight.toString());
  });

  const scrapCards: ScrapCardData[] = React.useMemo(() => {
    const scrapList = Array.isArray(scrapData?.data)
      ? scrapData.data
      : Array.isArray(scrapData)
        ? scrapData
        : [];

    const staticCards: ScrapCardData[] = [];

    if (scrapList.length === 0) return staticCards;

    const cardMap = new Map<number, { totalWeight: number; count: number }>();
    scrapList.forEach((item: any) => {
      const p = Number(item.purity) || 0;
      const wt = Number(item.weight) || 0;
      if (p > 0 && wt > 0) {
        const current = cardMap.get(p) || { totalWeight: 0, count: 0 };
        cardMap.set(p, {
          totalWeight: current.totalWeight + wt,
          count: current.count + 1,
        });
      }
    });

    const result = Array.from(cardMap.entries()).map(([purity, data]) => ({
      purity,
      totalWeight: Math.round(data.totalWeight * 1000) / 1000,
      count: data.count,
    }));

    return result.length > 0 ? result : staticCards;
  }, [scrapData]);

  const toggleSelectScrapCard = (purity: number) => {
    setSelectedScrapPurities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(purity)) {
        newSet.delete(purity);
      } else {
        newSet.add(purity);
      }
      return newSet;
    });
  };

  const scrapModalItems: ScrapModalItem[] = React.useMemo(() => {
    return scrapCards
      .filter((card) => selectedScrapPurities.has(card.purity))
      .map((card) => ({
        id: card.purity.toString(),
        purity: card.purity,
        availableWeight: card.totalWeight,
      }));
  }, [scrapCards, selectedScrapPurities]);

  const scrapCalculations = React.useMemo(() => {
    let weightedPuritySum = 0;
    let totalAvailableWeight = 0;

    scrapModalItems.forEach((item) => {
      weightedPuritySum += item.availableWeight * item.purity;
      totalAvailableWeight += item.availableWeight;
    });

    const finalPurity =
      totalAvailableWeight > 0 ? weightedPuritySum / totalAvailableWeight : 0;

    return {
      finalPurity,
      totalAvailableWeight,
    };
  }, [scrapModalItems]);

  const openScrapModal = () => {
    if (selectedScrapPurities.size === 0) {
      toast.error('Please select at least one scrap card');
      return;
    }
    setIsScrapModalOpen(true);
  };

  // Handle selecting purity in Add Scrap popup
  const handleSelectPurity = (purityVal: number | '') => {
    if (purityVal === '') {
      setSelectedPurity('');
      setAvailableWeight(0);
      setParticular('');
      return;
    }
    setSelectedPurity(purityVal);
    const card = scrapCards.find((c) => c.purity === purityVal);
    const wt = card ? card.totalWeight : 0;
    setAvailableWeight(wt);
    setParticular(`Scrap Melting ${purityVal}%`);
  };

  // Open Add Scrap popup
  const handleOpenAddScrap = (defaultPurity?: number) => {
    if (defaultPurity !== undefined) {
      handleSelectPurity(defaultPurity);
    } else if (scrapCards.length > 0) {
      handleSelectPurity(scrapCards[0].purity);
    } else {
      setSelectedPurity('');
      setAvailableWeight(0);
      setParticular('');
    }
    setScrapWeight('');
    setShowAddScrapModal(true);
  };

  // Submit scrap to melting
  const handleSubmitAddScrap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPurity) {
      toast.error('Please select a purity');
      return;
    }
    const weightNum = parseFloat(scrapWeight);
    if (!weightNum || isNaN(weightNum) || weightNum <= 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    setIsSubmittingScrap(true);
    const expectedFine = calculateExpectedFine(
      weightNum,
      Number(selectedPurity),
    );
    const particularText =
      particular.trim() || `Scrap Melting ${selectedPurity}%`;

    try {
      await submitMeltingScrap.mutateAsync({
        particular: particularText,
        grossWt: weightNum,
        purity: Number(selectedPurity),
        expectedFine: expectedFine,
        weight: weightNum,
        scrapWeight: weightNum,
      });
      toast.success('Scrap added to melting successfully!');
      await refetch();
    } catch (err: any) {
      console.warn(
        'API submission error, adding locally to melting process:',
        err,
      );
      const newEntry: MeltingRow = {
        id: `melting-${Date.now()}`,
        srNo: meltingEntries.length + 1,
        dateTime: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        particular: particularText,
        grossWt: weightNum,
        purity: Number(selectedPurity),
        expectedFine: expectedFine,
        fineWeight: 0,
        loss: 0,
        scrapCount: 1,
        isEditing: true,
        isSaved: false,
        grossWtRaw: weightNum.toString(),
        fineWeightRaw: '',
        purityRaw: selectedPurity.toString(),
        isDirty: false,
      };
      setMeltingEntries((prev) => [newEntry, ...prev]);
      toast.success('Scrap added to melting successfully!');
    } finally {
      setIsSubmittingScrap(false);
      setShowAddScrapModal(false);
      setScrapWeight('');
    }
  };
  useEffect(() => {
    if (meltingLoading) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (meltingData && meltingData.length > 0) {
      const entries: MeltingRow[] = meltingData.map(
        (item: any, index: number) => {
          const grossWt = item.grossWt || item.grossWeight || item.weight || 0;
          const purity = item.purity || 0;
          const expectedFine =
            item.expectedFine || calculateExpectedFine(grossWt, purity);
          const isSaved = item.isCompleted === true;
          const fineWeight =
            item.fineWeight !== undefined && item.fineWeight !== null
              ? Number(item.fineWeight)
              : 0;

          const loss = isSaved
            ? item.loss !== undefined && item.loss !== null
              ? Number(item.loss)
              : fineWeight > 0
                ? Math.max(
                  0,
                  Math.round((expectedFine - fineWeight) * 1000) / 1000,
                )
                : 0
            : fineWeight > 0
              ? Math.max(
                0,
                Math.round((expectedFine - fineWeight) * 1000) / 1000,
              )
              : 0;

          return {
            id: item._id || item.id || `melting-${index}`,
            srNo: index + 1,
            dateTime: item.createdAt
              ? new Date(item.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              : '-',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            particular:
              item.particular ||
              item.name ||
              `Scrap Melting ${purity ? purity + '%' : ''}`,
            grossWt: grossWt,
            purity: purity,
            expectedFine: expectedFine,
            fineWeight: fineWeight,
            loss: loss,
            scrapCount: item.scrapCount || item.count || 1,
            isEditing: !isSaved,
            isSaved: isSaved,
            grossWtRaw: grossWt ? grossWt.toString() : '',
            fineWeightRaw: fineWeight > 0 ? fineWeight.toString() : '',
            purityRaw: purity ? purity.toString() : '',
            isDirty: false,
          };
        },
      );
      setMeltingEntries(entries);
    } else {
      try {
        const savedLocal = localStorage.getItem(
          'chain_silver_melting_entries_v2',
        );
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMeltingEntries(parsed);
            return;
          }
        }
      } catch (e) { }

      // Fallback static demo melting entries
      setMeltingEntries([
        {
          id: 'melting-static-1',
          srNo: 1,
          dateTime: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          particular: 'Scrap Melting 92.5%',
          stamp: '925 (à¤¶à¤¿à¤•à¥à¤•à¤¾)',
          description: 'Silver Scrap Melting',
          grossWt: 150.5,
          purity: 92.5,
          expectedFine: 139.213,
          fineWeight: 139.0,
          loss: 0.213,
          scrapCount: 3,
          isEditing: true,
          isSaved: false,
          grossWtRaw: '150.5',
          fineWeightRaw: '139.0',
          purityRaw: '92.5',
          isDirty: false,
        },
        {
          id: 'melting-static-2',
          srNo: 2,
          dateTime: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          particular: 'Scrap Melting 99.9%',
          stamp: '83.5 (à¤¶à¤¿à¤•à¥à¤•à¤¾)',
          description: 'Fine Silver Melting',
          grossWt: 280.75,
          purity: 99.9,
          expectedFine: 280.469,
          fineWeight: 280.2,
          loss: 0.269,
          scrapCount: 5,
          isEditing: true,
          isSaved: false,
          grossWtRaw: '280.75',
          fineWeightRaw: '280.2',
          purityRaw: '99.9',
          isDirty: false,
        },
      ]);
    }
  }, [meltingData, meltingLoading, error]);

  // Filter and sort history by Proceed Date & Time (updatedAt / proceedDateTime)
  const getFilteredHistory = () => {
    const historyList = Array.isArray(meltingHistory)
      ? meltingHistory
      : Array.isArray(meltingHistory?.data)
        ? meltingHistory.data
        : Array.isArray(meltingHistory?.history)
          ? meltingHistory.history
          : Array.isArray(meltingHistory?.meltingHistory)
            ? meltingHistory.meltingHistory
            : [];

    const completedFromActive = Array.isArray(meltingData)
      ? meltingData.filter((item: any) => item.isCompleted || item.isSaved)
      : [];

    const existingIds = new Set(
      historyList.map((item: any) => item.id || item._id),
    );
    const combinedHistory = [
      ...historyList,
      ...completedFromActive.filter(
        (item: any) => !existingIds.has(item.id || item._id),
      ),
    ];

    // Sort descending by Proceed Date & Time so newest processed items appear first
    const sortedHistory = [...combinedHistory].sort((a: any, b: any) => {
      const dateA = new Date(
        a.updatedAt ||
        a.proceedDateTime ||
        a.updated_at ||
        a.proceedDate ||
        a.createdAt ||
        0,
      ).getTime();
      const dateB = new Date(
        b.updatedAt ||
        b.proceedDateTime ||
        b.updated_at ||
        b.proceedDate ||
        b.createdAt ||
        0,
      ).getTime();
      return dateB - dateA;
    });

    const filtered = sortedHistory.filter((item: any) => {
      const dateVal =
        item.updatedAt ||
        item.proceedDateTime ||
        item.updated_at ||
        item.proceedDate ||
        item.createdAt ||
        item.dateTime ||
        item.created_at;

      let matchesDate = true;
      if (isTrial && !isDateFilterActive) {
        matchesDate = true;
      } else if (dateVal) {
        const itemDate = new Date(dateVal);
        if (!Number.isNaN(itemDate.getTime())) {
          if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (itemDate < from) matchesDate = false;
          }
          if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (itemDate > to) matchesDate = false;
          }
        }
      }
      if (!matchesDate) return false;

      if (historySearchTerm) {
        const query = historySearchTerm.toLowerCase();
        const particularStr = String(item.particular || '').toLowerCase();
        const grossStr = String(
          item.grossWeight ?? item.grossWt ?? item.weight ?? '',
        );
        const purityStr = String(item.purity ?? '');
        const fineStr = String(item.fineWeight ?? item.fineWt ?? '');
        const dateObj = formatDate(dateVal);
        const dateStr = `${dateObj.date} ${dateObj.time}`.toLowerCase();
        return (
          particularStr.includes(query) ||
          grossStr.includes(query) ||
          purityStr.includes(query) ||
          fineStr.includes(query) ||
          dateStr.includes(query)
        );
      }
      return true;
    });

    return filtered;
  };

  // History totals
  const historyTotals = React.useMemo(() => {
    const data = getFilteredHistory();
    return data.reduce(
      (acc: any, item: any) => {
        const gross = Number(
          item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
        );
        const purity = Number(item.purity ?? 0);
        const expected = Number(
          item.expected ??
          item.expectedFine ??
          calculateExpectedFine(gross, purity),
        );
        const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
        const loss =
          fine > 0
            ? Math.max(0, Math.round((expected - fine) * 1000) / 1000)
            : item.loss !== undefined && item.loss !== null
              ? Number(item.loss)
              : 0;
        return {
          totalGross: acc.totalGross + gross,
          totalExpected: acc.totalExpected + expected,
          totalFine: acc.totalFine + fine,
          totalLoss: acc.totalLoss + loss,
        };
      },
      { totalGross: 0, totalExpected: 0, totalFine: 0, totalLoss: 0 },
    );
  }, [meltingHistory, meltingData, fromDate, toDate]);

  // Main Melting process totals
  const meltingTotals = React.useMemo(() => {
    return (meltingEntries || []).reduce(
      (acc: any, item: MeltingRow) => {
        const gross = Number(item.grossWt) || 0;
        const expected = Number(item.expectedFine) || 0;
        const fine = Number(item.fineWeight) || 0;
        const hasEntered = Boolean(
          (item.fineWeightRaw !== undefined &&
            item.fineWeightRaw.trim() !== '') ||
          (item.fineWeight !== undefined && item.fineWeight > 0),
        );
        let loss = 0;
        if (hasEntered) {
          loss = Math.max(0, Math.round((expected - fine) * 1000) / 1000);
        } else if (
          item.isSaved &&
          item.loss !== undefined &&
          item.loss !== null
        ) {
          loss = Number(item.loss);
        } else {
          const alertCheck = checkProcessLossAlert(
            gross,
            Number(item.purity) || 0,
            0,
            alertRules,
            false,
          );
          loss = alertCheck?.maxAllowedLoss || alertCheck?.baseLoss || 0;
        }
        return {
          totalGross: acc.totalGross + gross,
          totalExpected: acc.totalExpected + expected,
          totalFine: acc.totalFine + fine,
          totalLoss: acc.totalLoss + loss,
        };
      },
      { totalGross: 0, totalExpected: 0, totalFine: 0, totalLoss: 0 },
    );
  }, [meltingEntries, alertRules]);

  // Save melting entries to localStorage for persistence
  useEffect(() => {
    if (!isInitialMount.current && meltingEntries) {
      try {
        localStorage.setItem(
          'chain_silver_melting_entries_v2',
          JSON.stringify(meltingEntries),
        );
      } catch (e) { }
    }
  }, [meltingEntries]);

  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'stamp' | 'description' | 'netWeight' | 'scrapWeight' | 'fineWeight',
      value: string,
    ) => {
      setMeltingEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };
            if (field === 'stamp') {
              updated.stampRaw = value;
              updated.stamp = value;
            } else if (field === 'description') {
              updated.descriptionRaw = value;
              updated.description = value;
              updated.particular = value;
            } else if (field === 'netWeight') {
              updated.netWeightRaw = value;
              const numVal = parseFloat(value) || 0;
              updated.netWeight = numVal;
              const givenWt = updated.expectedFine || updated.fineWeight || updated.grossWt || 0;
              const scrapWt = updated.scrapWeight || 0;
              updated.loss = Math.max(
                0,
                Math.round((givenWt - numVal - scrapWt) * 1000) / 1000,
              );
            } else if (field === 'scrapWeight') {
              updated.scrapWeightRaw = value;
              const scrapVal = parseFloat(value) || 0;
              updated.scrapWeight = scrapVal;
              const givenWt = updated.expectedFine || updated.fineWeight || updated.grossWt || 0;
              const receivedWt = updated.netWeight || 0;
              updated.loss = Math.max(
                0,
                Math.round((givenWt - receivedWt - scrapVal) * 1000) / 1000,
              );
            } else if (field === 'fineWeight') {
              updated.fineWeightRaw = value;
              if (value === '' || value === '.' || value === '-') {
                updated.fineWeight = 0;
              } else {
                const numValue = parseFloat(value);
                updated.fineWeight = isNaN(numValue) ? 0 : numValue;
              }
              updated.loss = Math.max(
                0,
                Math.round((updated.expectedFine - updated.fineWeight) * 1000) / 1000,
              );
            }
            updated.isDirty = true;
            return updated;
          }
          return entry;
        }),
      );
    },
    [],
  );

  // Stock Action Click
  const handleStockClick = useCallback(
    (index: number) => {
      const entry = meltingEntries[index];
      if (!entry) return;

      setSaveIndex(index);
      setShowConfirmModal(true);
    },
    [meltingEntries],
  );

  // Confirm Stock and Proceed
  const confirmStock = useCallback(async () => {
    if (saveIndex === null || saveIndex === undefined) return;
    const index = saveIndex;
    const entry = meltingEntries[index];
    if (!entry) return;

    const hasEnteredFine = Boolean(
      (entry.fineWeightRaw !== undefined &&
        entry.fineWeightRaw.trim() !== '') ||
      (entry.fineWeight !== undefined && entry.fineWeight > 0),
    );
    const fineToSend = hasEnteredFine
      ? Number(entry.fineWeight || 0)
      : Number(entry.expectedFine || 0);
    const lossToSend = hasEnteredFine
      ? entry.loss !== undefined && entry.loss !== null
        ? entry.loss
        : Math.max(
          0,
          Math.round((entry.expectedFine - fineToSend) * 1000) / 1000,
        )
      : 0;

    setIsLoading(true);
    try {
      await submitMeltingStock.mutateAsync({
        id: entry.id,
        data: {
          particular: entry.particular,
          grossWt: entry.grossWt,
          loss: lossToSend,
          purity: entry.purity,
          expectedFine: entry.expectedFine,
          fineWeight: fineToSend,
          isCompleted: true,
        },
      });

      // 1. Add to Melting stock cards at top
      const newCard = {
        id: `melting-stock-${Date.now()}`,
        purity: entry.purity,
        stamp: entry.stamp || '',
        availableWeight: fineToSend,
        totalWeight: fineToSend,
    };
    saveMeltingStockCards([newCard, ...meltingStockCards]);

    setMeltingEntries((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
            ...s,
            fineWeight: fineToSend,
            loss: lossToSend,
            isEditing: false,
            isSaved: true,
            isDirty: false,
          }
          : s,
      ),
    );

    toast.success('Melting item saved to Melting Stock Cards!');
    setIsLoading(false);
    setShowConfirmModal(false);
    setSaveIndex(null);
    await refetch();
    await refetchHistory();
  } catch (err: any) {
    console.warn('Local save to Melting Stock cards:', err);
    const newCard = {
      id: `melting-stock-${Date.now()}`,
      purity: entry.purity,
      stamp: entry.stamp || '',
      availableWeight: fineToSend,
      totalWeight: fineToSend,
  };
  saveMeltingStockCards([newCard, ...meltingStockCards]);

  setMeltingEntries((prev) =>
    prev.map((s, i) =>
      i === index
        ? {
          ...s,
          fineWeight: fineToSend,
          loss: lossToSend,
          isEditing: false,
          isSaved: true,
          isDirty: false,
        }
        : s,
    ),
  );

  toast.success('Melting item saved to Melting Stock Cards!');
  setIsLoading(false);
  setShowConfirmModal(false);
  setSaveIndex(null);
}
  }, [
  saveIndex,
  meltingEntries,
  alertRules,
  submitMeltingStock,
  refetch,
  refetchHistory,
]);

const toggleHistory = () => {
  if (showHistory) {
    setShowHistory(false);
    setFromDate(null);
    setToDate(null);
    refetch();
  } else {
    setShowHistory(true);
    const { monday, sunday } = getCurrentWeekRange();
    const from = new Date(monday);
    from.setHours(0, 0, 0, 0);
    const to = new Date(sunday);
    to.setHours(23, 59, 59, 999);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const finalTo = to > todayEnd ? to : todayEnd;
    setFromDate(from);
    setToDate(finalTo);
    refetch();
    refetchHistory();
  }
};

const handleRevertClick = useCallback((index: number) => {
  setMeltingEntries((prev) => prev.filter((_, i) => i !== index));
  toast.success('Melting entry reverted successfully');
}, []);

// Main Table columns
const columns = getMeltingColumns(
  getScaleProps,
  handleInlineChange,
  handleStockClick,
  handleRevertClick,
  alertRules,
);

// Print History Report
const handlePrintHistory = () => {
  printMeltingHistory(
    getFilteredHistory(),
    fromDate,
    toDate,
    getpdfheaderdata,
  );
};

return (
  <div className="flex flex-col gap-4">
    {/* ---------------- Melting Stock Cards (Outbound to Company) ---------------- */}
    {meltingStockCards.length > 0 && !showHistory && (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#785600] dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Melting Stock Available ({meltingStockCards.length})
            </span>
          </div>
        </div>
        <div className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 flex gap-2 overflow-x-auto pb-2 pt-1">
          {meltingStockCards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setSelectedMeltingCard(card);
                setIsDispatchPopupOpen(true);
              }}
              className="flex min-w-[140px] flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-3 shadow-sm transition-all hover:border-[#785600]/60 cursor-pointer dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#1a1c1b] dark:text-slate-200">
                  {card.stamp || 'Silver'} ({card.purity}%)
                </span>
              </div>
              <span className="mt-0.5 font-mono text-sm font-bold text-black dark:text-white">
                {formatNumberDisplay(card.availableWeight)} G
              </span>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Header Controls */}
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
          {showHistory ? 'Melting History' : 'Melting Process'}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showHistory && (
          <>
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
              <div>
                <GenericWeeklyDatePicker
                  id="from-date-melting"
                  placeholder="DD/MM/YYYY"
                  mode="from"
                  initialDates={fromDate ? [fromDate] : []}
                  onDateChange={(dates) => {
                    if (isTrial) setIsDateFilterActive(true);
                    if (dates && dates.length > 0) {
                      const selected = new Date(dates[0]);
                      selected.setHours(0, 0, 0, 0);
                      setFromDate(selected);
                    } else {
                      setFromDate(null);
                    }
                  }}
                  className="w-32 sm:w-36 md:w-40"
                />
              </div>

              <div>
                <GenericWeeklyDatePicker
                  id="to-date-melting"
                  placeholder="DD/MM/YYYY"
                  mode="to"
                  initialDates={toDate ? [toDate] : []}
                  onDateChange={(dates) => {
                    if (isTrial) setIsDateFilterActive(true);
                    if (dates && dates.length > 0) {
                      const selected = new Date(dates[0]);
                      selected.setHours(23, 59, 59, 999);
                      setToDate(selected);
                    } else {
                      setToDate(null);
                    }
                  }}
                  className="w-32 sm:w-36 md:w-40"
                />
              </div>
            </div>

            <GenericButton size="sm"
              type="button"
              onClick={handlePrintHistory}
              variant="primary"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          </>
        )}



        <GenericButton size="sm"
          type="button"
          onClick={toggleHistory}
          variant="primary"
          className="flex items-center gap-1.5"
        >
          {showHistory ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span>{showHistory ? 'Show Melting' : 'History'}</span>
        </GenericButton>
      </div>
    </div>

    {/* Table Section */}
    {!showHistory ? (
      <div>
        <GenericTable<MeltingRow>
          data={meltingEntries || []}
          columns={columns}
          emptyMessage="No melting records found. Scrap from manufacturing processes will appear here."
          isLoading={false}
          showSrNo={true}
          srNoLabel="Sr No."
        />
      </div>
    ) : (
      <HistoryDept
        historyData={getFilteredHistory()}
        historyTotals={historyTotals}
        historyLoading={historyLoading}
        alertRules={alertRules}
        onPrint={handlePrintHistory}
      />
    )}

    {/* Confirmation Modal */}
    {showConfirmModal && saveIndex !== null && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-2 text-lg font-bold text-[#1a1c1b] dark:text-white">
            Confirm Stocking Melted Gold
          </h3>
          <p className="mb-4 text-sm text-[#4f4535] dark:text-slate-400">
            Are you sure you want to send this melted fine gold to Stock?
          </p>

          {(() => {
            const entry = meltingEntries[saveIndex];
            if (!entry) return null;
            const hasEnteredFine = Boolean(
              (entry.fineWeightRaw !== undefined &&
                entry.fineWeightRaw.trim() !== '') ||
              (entry.fineWeight !== undefined && entry.fineWeight > 0),
            );
            const fineToSend = hasEnteredFine
              ? Number(entry.fineWeight || 0)
              : Number(entry.expectedFine || 0);
            const lossToSend = hasEnteredFine
              ? entry.loss !== undefined && entry.loss !== null
                ? entry.loss
                : Math.max(
                  0,
                  Math.round((entry.expectedFine - fineToSend) * 1000) /
                  1000,
                )
              : 0;
            const alertCheck = checkProcessLossAlert(
              entry.grossWt,
              entry.purity,
              lossToSend,
              alertRules,
              hasEnteredFine,
            );
            const diff = hasEnteredFine ? alertCheck?.diff || 0 : 0;

            return (
              <div className="bg-gray-50 mb-4 rounded-xl border border-[#d3c4af]/30 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 dark:text-slate-400">
                    Particular:
                  </span>
                  <span className="font-semibold text-black dark:text-white">
                    {entry.particular}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 dark:text-slate-400">
                    Gross Wt:
                  </span>
                  <span className="font-mono font-semibold text-black dark:text-white">
                    {formatNumberDisplay(entry.grossWt)} G
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 dark:text-slate-400">
                    Purity:
                  </span>
                  <span className="font-mono font-semibold text-black dark:text-white">
                    {entry.purity}%
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 dark:text-slate-400">
                    Expected Fine (à¤²à¤—à¤¡):
                  </span>
                  <span className="font-mono font-semibold text-[#785600] dark:text-amber-400">
                    {formatNumberDisplay(entry.expectedFine)} G
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 dark:text-slate-400">
                    Fine Wt (To Stock):
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-green-700 dark:text-green-400">
                      {formatNumberDisplay(fineToSend)} G
                    </span>
                    {!hasEnteredFine && (
                      <span className="text-gray-500 text-[10px] italic dark:text-slate-400">
                        (Expected Wt)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500 dark:text-slate-400">
                    Loss:
                  </span>
                  <div className="flex flex-col items-end">
                    <span
                      className={`font-mono font-bold ${lossToSend > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-slate-300'
                        }`}
                    >
                      Act: {formatNumberDisplay(lossToSend)} G
                    </span>
                    {alertCheck && (
                      <div className="mt-0.5 flex flex-col items-end text-[10px] leading-tight text-gray-500 dark:text-slate-400">
                        <span>
                          Exp: {formatNumberDisplay(alertCheck.maxAllowedLoss || alertCheck.baseLoss || 0)} G
                        </span>
                        <span
                          className={
                            diff > 0
                              ? 'font-semibold text-red-600 dark:text-red-400'
                              : 'text-gray-500 dark:text-slate-400'
                          }
                        >
                          Diff: {diff > 0 ? `+${formatNumberDisplay(diff)}` : formatNumberDisplay(diff)} G
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowConfirmModal(false);
                setSaveIndex(null);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg border px-4 py-2 text-sm font-semibold dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <GenericButton size="sm"
              type="button"
              onClick={confirmStock}
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Stocking...' : 'Confirm & Stock'}
            </GenericButton>
          </div>
        </div>
      </div>
    )}

    {/* Silver Received & Melting Modal */}
    <MeltingPopup
      isOpen={isScrapModalOpen}
      onClose={() => setIsScrapModalOpen(false)}
      scrapModalItems={scrapModalItems}
      scrapCalculations={scrapCalculations}
      refetchCuttingScrap={refetch}
      refetch={refetch}
      onRemoveItem={(purity) => toggleSelectScrapCard(purity)}
      onSuccess={() => {
        setSelectedScrapPurities(new Set());
      }}
      onSubmitScrap={async (payload) => {
        const fineWt = payload.weight * (payload.receivedPurity / 100);
        const expectedFine = calculateExpectedFine(
          payload.weight,
          payload.avgPurity,
        );

        const newEntry: MeltingRow = {
          id: `melting-${Date.now()}`,
          srNo: meltingEntries.length + 1,
          dateTime: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          createdAt: new Date().toISOString(),
          particular:
            payload.description || `Silver Melting ${payload.avgPurity}%`,
          purity: payload.avgPurity,
          stamp: payload.stamp || '',
          description:
    payload.description || `Silver Melting ${payload.avgPurity}%`,
    grossWt: payload.weight,
    netWeight: payload.weight,
    scrapWeight: payload.avgWeight,
    expectedFine: expectedFine,
    fineWeight: fineWt,
    loss: payload.lossWeight,
    scrapCount: scrapModalItems.length,
    isEditing: true,
    isSaved: false,
    grossWtRaw: payload.weight.toString(),
            fineWeightRaw: fineWt > 0 ? fineWt.toString() : '',
    purityRaw: payload.avgPurity.toString(),
    stampRaw: payload.stamp || '',
    descriptionRaw: payload.description || '',
    isDirty: false,
          };

    try {
      await submitMeltingScrap.mutateAsync({
        ...payload,
        particular: newEntry.particular,
        grossWt: payload.weight,
        purity: payload.avgPurity,
        expectedFine: expectedFine,
        fineWeight: fineWt,
        lossWeight: payload.lossWeight,
        stamp: payload.stamp,
        description: payload.description,
            });
          } catch (e) {
      console.warn('API notice, stored locally:', e);
          }

          setMeltingEntries((prev) => [newEntry, ...prev]);
    toast.success('Silver melting entry created!');
        }}
      />

    {/* Dispatch from Melting Stock to Next Process (Company) */}
    <ProcessDispatchPopup
      isOpen={isDispatchPopupOpen}
      onClose={() => setIsDispatchPopupOpen(false)}
      title="Melting Process"
      items={selectedMeltingCard ? [{ id: selectedMeltingCard.id, purity: selectedMeltingCard.purity, availableWeight: selectedMeltingCard.availableWeight, stamp: selectedMeltingCard.stamp }] : []}
    nextProcessOptions={['Company']}
    onSuccess={handleDispatchSuccess}
      />
  </div>
);
};

export default MeltingDept;




