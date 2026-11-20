import { exceedsGiven } from '../shared/weightGuard';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getHistoryDefaultRange } from '@/utils/weekRangeUtils';
import {
  ChevronRight,
  ChevronDown,
  Printer,
  Plus,
  Search,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import {
  useGetGalai,
  useGetGalaiHistory,
  useGetGalaiCards,
  useGetScrap,
  useSubmitGalaiStock,
  useRevertGalai,
} from '@/lib/api/galai';
import {
  useGetProcessAlert,
} from '@/lib/api/alertmanagement';
import HistoryDept from './HistoryDept';
import GalaiPopup, { ScrapModalItem } from './GalaiPopup';
import ProcessDispatchPopup, { ProcessDispatchPayload } from '../shared/ProcessDispatchPopup';
import {
  GalaiRow,
  ScrapCardData,
  AlertRule,
  getCurrentWeekRange,
  calculateExpectedFine,
  getGalaiColumns,
  printGalaiHistory,
} from './galaiUtils';
import { GalaiStockStrip } from './GalaiStockStrip';
import { GalaiConfirmModal } from './GalaiConfirmModal';
import {
  filterGalaiHistoryData,
  calculateGalaiHistoryTotals,
} from './galaiDataHelpers';

const GalaiDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [GalaiEntries, setGalaiEntries] = useState<GalaiRow[]>([]);
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

  // Galai Stock Cards for next process dispatch (stored on the server)
  const { data: galaiStockCards = [], refetch: refetchCards } = useGetGalaiCards();
  const [isDispatchPopupOpen, setIsDispatchPopupOpen] = useState(false);
  const [selectedGalaiCard, setSelectedGalaiCard] = useState<
    { id: string; purity: number; stamp?: string; Stamp?: string; availableWeight: number; totalWeight?: number } | null
  >(null);

  // The server already deducted the dispatched weight; just reload the cards
  const handleDispatchSuccess = (_payload: ProcessDispatchPayload) => {
    refetchCards();
  };

  const [selectedScrapPurities, setSelectedScrapPurities] = useState<Set<number>>(new Set());
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);

  const isInitialMount = useRef(true);

  // Fetch data from API
  const {
    data: GalaiData = [],
    isLoading: GalaiLoading,
    refetch,
  } = useGetGalai();
  const {
    data: GalaiHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetGalaiHistory();
  const { data: scrapData = [] } = useGetScrap();
  const submitGalaiStock = useSubmitGalaiStock();
  const revertGalai = useRevertGalai();
  const { data: GalaiAlertRaw } = useGetProcessAlert('Galai');

  const alertRules: AlertRule[] = React.useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(GalaiAlertRaw) && GalaiAlertRaw.length > 0) {
      list = GalaiAlertRaw;
    } else if (GalaiAlertRaw && typeof GalaiAlertRaw === 'object') {
      if (Array.isArray((GalaiAlertRaw as any).data)) {
        list = (GalaiAlertRaw as any).data;
      } else if ((GalaiAlertRaw as any).grossWt !== undefined) {
        list = [GalaiAlertRaw];
      }
    }

    if (list.length === 0) {
      try {
        const saved = localStorage.getItem(
          'chain_alert_management_settings_v2',
        );
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.Galai) && parsed.Galai.length > 0) {
            list = parsed.Galai;
          }
        }
      } catch (e) {}
    }

    return list;
  }, [GalaiAlertRaw]);

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'fineWeight'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

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

  const scrapModalItems: ScrapModalItem[] = React.useMemo(() => {
    return scrapCards
      .filter((card) => selectedScrapPurities.has(card.purity))
      .map((card) => ({
        id: card.purity.toString(),
        purity: card.purity,
        availableWeight: card.totalWeight,
      }));
  }, [scrapCards, selectedScrapPurities]);

  useEffect(() => {
    if (GalaiLoading) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (GalaiData && GalaiData.length > 0) {
      const entries: GalaiRow[] = GalaiData.map(
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
            id: item.id,
            srNo: index + 1,
            dateTime: new Date(item.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            particular:
              item.particular ||
              item.description ||
              (item.purity ? `Scrap Galai ${item.purity}%` : 'Scrap Galai'),
            grossWt: grossWt,
            purity: purity,
            expectedFine: expectedFine,
            fineWeight: fineWeight,
            loss: loss,
            scrapCount: item.scrapCount || 1,
            scrapWeight: Number(item.scrapWeight) || 0,
            isEditing: !isSaved,
            isSaved: isSaved,
            grossWtRaw: grossWt.toString(),
            fineWeightRaw: fineWeight > 0 ? fineWeight.toString() : '',
            purityRaw: purity.toString(),
            isDirty: false,
          };
        },
      );
      setGalaiEntries(entries);
    } else {
      setGalaiEntries([]);
    }
  }, [GalaiData, GalaiLoading]);

  // Filter history
  const getFilteredHistory = () => {
    const rawList = Array.isArray(GalaiHistory?.data)
      ? GalaiHistory.data
      : Array.isArray(GalaiHistory)
        ? GalaiHistory
        : [];
    return filterGalaiHistoryData(
      rawList,
      fromDate,
      toDate,
      historySearchTerm,
      isTrial,
      isDateFilterActive,
    );
  };

  // History totals
  const historyTotals = React.useMemo(() => {
    return calculateGalaiHistoryTotals(getFilteredHistory());
  }, [GalaiHistory, GalaiData, fromDate, toDate, historySearchTerm, isTrial, isDateFilterActive]);

  // Save Galai entries to localStorage for persistence
  useEffect(() => {
    if (!isInitialMount.current && GalaiEntries) {
      try {
        localStorage.setItem(
          'chain_silver_Galai_entries_v2',
          JSON.stringify(GalaiEntries),
        );
      } catch (e) {}
    }
  }, [GalaiEntries]);

  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'stamp' | 'description' | 'netWeight' | 'scrapWeight' | 'fineWeight',
      value: string,
    ) => {
      setGalaiEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };
            if (field === 'stamp') {
              (updated as any).stampRaw = value;
              updated.stamp = value;
            } else if (field === 'description') {
              (updated as any).descriptionRaw = value;
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
              const givenWt = updated.grossWt || updated.expectedFine || 0;
              const receivedWt = updated.fineWeight || 0;
              if (exceedsGiven(givenWt, receivedWt, scrapVal)) return entry;
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
              const givenWt = updated.grossWt || updated.expectedFine || 0;
              if (exceedsGiven(givenWt, updated.fineWeight, updated.scrapWeight)) return entry;
              updated.loss = Math.max(
                0,
                Math.round((givenWt - updated.fineWeight - (updated.scrapWeight || 0)) * 1000) / 1000,
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
      const entry = GalaiEntries[index];
      if (!entry) return;

      setSaveIndex(index);
      setShowConfirmModal(true);
    },
    [GalaiEntries],
  );

  // Confirm Stock and Proceed
  const confirmStock = useCallback(async () => {
    if (saveIndex === null || saveIndex === undefined) return;
    const index = saveIndex;
    const entry = GalaiEntries[index];
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
            Math.round(((entry.grossWt || entry.expectedFine) - fineToSend - (entry.scrapWeight || 0)) * 1000) / 1000,
          )
      : 0;

    setIsLoading(true);
    try {
      await submitGalaiStock.mutateAsync({
        id: entry.id,
        data: {
          particular: entry.particular,
          grossWt: entry.grossWt,
          loss: lossToSend,
          purity: entry.purity,
          expectedFine: entry.expectedFine,
          fineWeight: fineToSend,
          scrapWeight: entry.scrapWeight || 0,
          stamp: entry.stamp || undefined,
          isCompleted: true,
        },
      });

      toast.success('Galai item saved to Galai Stock Cards!');
      setShowConfirmModal(false);
      setSaveIndex(null);
      await Promise.all([refetch(), refetchHistory(), refetchCards()]);
    } catch (err: any) {
      // Error toast is shown by the mutation hook; keep the row editable
    } finally {
      setIsLoading(false);
    }
  }, [
    saveIndex,
    GalaiEntries,
    submitGalaiStock,
    refetch,
    refetchHistory,
    refetchCards,
  ]);

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      setFromDate(null);
      setToDate(null);
      refetch();
    } else {
      setShowHistory(true);
      const { fromDate: from, toDate: to } = getHistoryDefaultRange();
      setFromDate(from);
      setToDate(to);
      refetch();
      refetchHistory();
    }
  };

  const handleRevertClick = useCallback(
    async (index: number) => {
      const entry = GalaiEntries[index];
      if (!entry) return;
      try {
        await revertGalai.mutateAsync(entry.id);
        toast.success('Galai entry reverted successfully');
      } catch {
        // Error toast is shown by the mutation hook
      }
    },
    [GalaiEntries, revertGalai],
  );

  // Main Table columns
  const columns = getGalaiColumns(
    getScaleProps,
    handleInlineChange,
    handleStockClick,
    alertRules,
  );

  // Print History Report
  const handlePrintHistory = () => {
    printGalaiHistory(
      getFilteredHistory(),
      fromDate,
      toDate,
      getpdfheaderdata,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Galai Stock Cards (Outbound to Melting/Company) */}
      {!showHistory && (
        <GalaiStockStrip
          galaiStockCards={galaiStockCards}
          onSelectCard={(card) => {
            setSelectedGalaiCard(card);
            setIsDispatchPopupOpen(true);
          }}
        />
      )}

      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Galai History' : 'Galai Process'}
          </h2>
        </div>

        <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          {showHistory && (
            <>
              <div className="relative order-last w-full sm:order-none sm:w-48 md:w-56">
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
                    id="from-date-Galai"
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
                    id="to-date-Galai"
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

          {!showHistory && (
            <GenericButton size="sm"
            type="button"
            onClick={() => setIsScrapModalOpen(true)}
            variant="primary"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Galai</span>
          </GenericButton>
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
            <span>{showHistory ? 'Show Galai' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Table Section */}
      {!showHistory ? (
        <div>
          <GenericTable<GalaiRow>
            data={GalaiEntries || []}
            columns={columns}
            emptyMessage="No Galai records found. Scrap from manufacturing processes will appear here."
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
      <GalaiConfirmModal
        isOpen={showConfirmModal}
        saveIndex={saveIndex}
        galaiEntries={GalaiEntries}
        alertRules={alertRules}
        isLoading={isLoading}
        onCancel={() => {
          setShowConfirmModal(false);
          setSaveIndex(null);
        }}
        onConfirm={confirmStock}
      />

      {/* Silver Received & Galai Modal */}
      <GalaiPopup
        isOpen={isScrapModalOpen}
        onClose={() => setIsScrapModalOpen(false)}
        scrapModalItems={scrapModalItems}
        refetch={refetch}
        onSuccess={() => {
          setSelectedScrapPurities(new Set());
        }}
      />

      {/* Dispatch from Galai Stock to Next Process */}
      <ProcessDispatchPopup
        isOpen={isDispatchPopupOpen}
        onClose={() => setIsDispatchPopupOpen(false)}
        title="Galai Process"
        items={selectedGalaiCard ? [{ id: selectedGalaiCard.id, purity: selectedGalaiCard.purity, availableWeight: selectedGalaiCard.availableWeight, Stamp: selectedGalaiCard.Stamp || selectedGalaiCard.stamp }] : []}
        nextProcessOptions={['Company']}
        onSuccess={handleDispatchSuccess}
      />
    </div>
  );
};

export default GalaiDept;
