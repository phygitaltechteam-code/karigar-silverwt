import { exceedsGiven } from '../shared/weightGuard';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getHistoryDefaultRange } from '@/utils/weekRangeUtils';
import { extendTrack, trackOf } from '@/utils/processTrack';
import {
  Search,
  Box,
  ChevronDown,
  ChevronRight,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import ProcessDispatchPopup, { ProcessDispatchPayload } from '../shared/ProcessDispatchPopup';
import { BharniStockCard } from './BharniModal';
import {
  BharniRow,
  formatNumberDisplay,
  DEFAULT_STOCK_CARDS,
  bharniGroupKey,
  DEFAULT_DEMO_BHARNI_DATA,
  groupBharniEntries,
} from './bharniUtils';
import { BharniStockStrip } from './BharniStockStrip';
import { BharniTable } from './BharniTable';

export const BharniProcess: React.FC = () => {
  const [entries, setEntries] = useState<BharniRow[]>([]);
  const [stockCards, setStockCards] = useState<BharniStockCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<BharniStockCard | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Load stock cards from localStorage
  const loadStockCards = useCallback(() => {
    try {
      const saved = localStorage.getItem('chain_bharni_stock_cards_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStockCards(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading bharni stock cards:', e);
    }
    setStockCards(DEFAULT_STOCK_CARDS);
  }, []);

  // Load entries from localStorage
  const loadEntries = useCallback(() => {
    try {
      const saved = localStorage.getItem('chain_bharni_process_entries_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading bharni process entries:', e);
    }

    setEntries(DEFAULT_DEMO_BHARNI_DATA);
  }, []);

  useEffect(() => {
    loadEntries();
    loadStockCards();
  }, [loadEntries, loadStockCards]);

  // Save entries to localStorage
  const saveEntries = useCallback((updated: BharniRow[]) => {
    setEntries(updated);
    try {
      localStorage.setItem(
        'chain_bharni_process_entries_v1',
        JSON.stringify(updated),
      );
    } catch (e) {
      console.error('Error saving bharni process entries:', e);
    }
  }, []);

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      setFromDate(null);
      setToDate(null);
    } else {
      setShowHistory(true);
      const { fromDate: from, toDate: to } = getHistoryDefaultRange();
      setFromDate(from);
      setToDate(to);
    }
  };

  // Handle inline field changes in table
  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'description' | 'netWeightReceived' | 'scrap' | 'rateRs',
      value: string,
    ) => {
      setEntries((prev) => {
        const updatedList = prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };
            if (field === 'rateRs') {
              (updated as any).rateRsRaw = value;
              (updated as any).rateRs = parseFloat(value) || 0;
            } else if (field === 'description') {
              updated.descriptionRaw = value;
              updated.description = value;
            } else if (field === 'netWeightReceived') {
              updated.netWeightReceivedRaw = value;
              const numVal = parseFloat(value) || 0;
              if (exceedsGiven(updated.netWeightGiven, numVal, updated.scrap)) return entry;
              updated.netWeightReceived = numVal;
              updated.loss = Math.max(
                0,
                Math.round(
                  (updated.netWeightGiven - updated.netWeightReceived - (updated.scrap || 0)) *
                  1000,
                ) / 1000,
              );
            } else if (field === 'scrap') {
              updated.scrapRaw = value;
              const numVal = parseFloat(value) || 0;
              if (exceedsGiven(updated.netWeightGiven, updated.netWeightReceived, numVal)) return entry;
              updated.scrap = numVal;
              updated.loss = Math.max(
                0,
                Math.round(
                  (updated.netWeightGiven - (updated.netWeightReceived || 0) - updated.scrap) *
                  1000,
                ) / 1000,
              );
            }
            return updated;
          }
          return entry;
        });

        try {
          localStorage.setItem(
            'chain_bharni_process_entries_v1',
            JSON.stringify(updatedList),
          );
        } catch (e) {}

        return updatedList;
      });
    },
    [],
  );

  // Handle batch description change across all rows of the same batch
  // Update one field on every row of a batch. The batch key is pinned as batchId first,
  // so editing the stamp (part of the key) does not split the batch while typing.
  const updateBatch = (groupKey: string, patch: Partial<BharniRow>) => {
    setEntries((prev) => {
      const updatedList = prev.map((entry) => {
        if (bharniGroupKey(entry) === groupKey) {
          return { ...entry, batchId: groupKey, ...patch };
        }
        return entry;
      });
      try {
        localStorage.setItem(
          'chain_bharni_process_entries_v1',
          JSON.stringify(updatedList),
        );
      } catch (e) {}
      return updatedList;
    });
  };

  const handleBatchDescriptionChange = (groupKey: string, newDesc: string) =>
    updateBatch(groupKey, { description: newDesc, descriptionRaw: newDesc } as Partial<BharniRow>);

  const handleBatchStampChange = (groupKey: string, newStamp: string) =>
    updateBatch(groupKey, { stamp: newStamp } as Partial<BharniRow>);

  // Part Button Action: Process partial or full quantity and carry over remaining
  const handleProcessPart = (originalIndex: number) => {
    const entry = entries[originalIndex];
    if (!entry) return;

    const given = entry.netWeightGiven || 0;
    const received = entry.netWeightReceived || 0;
    const scrap = entry.scrap || 0;
    const loss = Math.max(
      0,
      Math.round((given - received - scrap) * 1000) / 1000,
    );

    if (received <= 0) {
      toast.error('Please enter received weight before processing part.');
      return;
    }

    const processedWeight = Math.round((received + scrap + loss) * 1000) / 1000;
    const remainingWeight = Math.max(0, Math.round((given - processedWeight) * 1000) / 1000);

    if (remainingWeight > 0.001) {
      // Partial processing:
      const completedPortion: BharniRow = {
        ...entry,
        id: `bharni-completed-${Date.now()}`,
        netWeightGiven: processedWeight,
        netWeightReceived: received,
        scrap: scrap,
        loss: loss,
        isCompleted: true,
        status: 'soldering',
      };

      const updatedActiveRow: BharniRow = {
        ...entry,
        netWeightGiven: remainingWeight,
        netWeightReceived: remainingWeight,
        netWeightReceivedRaw: remainingWeight.toString(),
        scrap: 0,
        scrapRaw: '',
        loss: 0,
        isCompleted: false,
        status: 'pending',
      };

      const newEntriesList = entries.map((item, idx) =>
        idx === originalIndex ? updatedActiveRow : item,
      );
      newEntriesList.unshift(completedPortion);
      saveEntries(newEntriesList);

      const newCard: BharniStockCard = {
        id: `bharni-card-${Date.now()}`,
        processTrack: extendTrack(trackOf(entry), 'Bharni'),
        stamp: entry.stamp || '',
        purity: entry.purity || 0,
        totalWeight: received,
        design: entry.design || entry.description || '',
        description: entry.description || entry.design || '',
        partNo: entry.partNo,
        karigar: entry.karigar,
      };
      const updatedCards = [newCard, ...stockCards];
      setStockCards(updatedCards);
      try {
        localStorage.setItem('chain_bharni_stock_cards_v1', JSON.stringify(updatedCards));
      } catch (e) {}

      toast.success(
        `Part #${entry.partNo || 1}: Processed ${formatNumberDisplay(received)} G to Bharni Stock Cards! Remaining ${formatNumberDisplay(remainingWeight)} G kept in Bharni.`,
      );
    } else {
      const updated = entries.map((item, idx) =>
        idx === originalIndex
          ? {
              ...item,
              netWeightReceived: received,
              scrap: scrap,
              loss: loss,
              isCompleted: true,
              status: 'soldering' as const,
            }
          : item,
      );
      saveEntries(updated);

      const newCard: BharniStockCard = {
        id: `bharni-card-${Date.now()}`,
        processTrack: extendTrack(trackOf(entry), 'Bharni'),
        stamp: entry.stamp || '',
        purity: entry.purity || 0,
        totalWeight: received,
        design: entry.design || entry.description || '',
        description: entry.description || entry.design || '',
        partNo: entry.partNo,
        karigar: entry.karigar,
      };
      const updatedCards = [newCard, ...stockCards];
      setStockCards(updatedCards);
      try {
        localStorage.setItem('chain_bharni_stock_cards_v1', JSON.stringify(updatedCards));
      } catch (e) {}

      toast.success(
        `Part #${entry.partNo || 1} (${formatNumberDisplay(received)} G) completed and saved to Bharni Stock Cards!`,
      );
    }
  };

  // Active vs History entries filter
  const activeEntries = entries.filter((e) => !e.isCompleted && e.status !== 'soldering' && e.status !== 'reverted');
  const historyEntries = entries.filter((e) => e.isCompleted || e.status === 'soldering' || e.status === 'reverted');

  // Main table: rows still pending. History: saved rows. (No fallback to the other list.)
  const targetList = showHistory ? historyEntries : activeEntries;

  const currentSearch = showHistory ? historySearchTerm : searchTerm;

  const displayedEntries = useMemo(() => {
    return targetList.filter((item) => {
      if (!currentSearch.trim()) return true;
      const query = currentSearch.toLowerCase();
      return (
        (item.stamp && item.stamp.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.design && item.design.toLowerCase().includes(query)) ||
        (item.karigar && item.karigar.toLowerCase().includes(query)) ||
        (item.purity && item.purity.toString().includes(query))
      );
    });
  }, [targetList, currentSearch]);

  const groups = useMemo(() => groupBharniEntries(displayedEntries), [displayedEntries]);

  // Save parts from Bharni modal
  const handleDispatchSuccess = (payload: ProcessDispatchPayload) => {
    const usedWeight = payload.weight || 0;
    const cardId = payload.itemId;

    let newStockCards = [...stockCards];
    const cardIndex = newStockCards.findIndex((c) => c.id === cardId);
    if (cardIndex > -1) {
      const card = newStockCards[cardIndex];
      const remaining = Math.max(
        0,
        Math.round((card.totalWeight - usedWeight) * 1000) / 1000,
      );
      if (remaining <= 0) {
        newStockCards.splice(cardIndex, 1);
      } else {
        newStockCards[cardIndex] = { ...card, totalWeight: remaining };
      }
      setStockCards(newStockCards);
      try {
        localStorage.setItem(
          'chain_bharni_stock_cards_v1',
          JSON.stringify(newStockCards),
        );
      } catch (e) {}
    }
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handlePrintHistory = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Silver Stock Cards Bar for Bharni */}
      {!showHistory && (
        <BharniStockStrip
          stockCards={stockCards}
          onSelectCard={(card) => {
            setSelectedCard(card);
            setIsModalOpen(true);
          }}
        />
      )}

      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-[#785600] dark:text-amber-400" />
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Bharni History' : 'Bharni Department'}
          </h2>
        </div>

        <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          {!showHistory ? (
            <div className="relative order-last w-full sm:order-none sm:w-48 md:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search bharni process..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          ) : (
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
                <GenericWeeklyDatePicker
                  id="from-date-bharni"
                  placeholder="DD/MM/YYYY"
                  mode="from"
                  initialDates={fromDate ? [fromDate] : []}
                  onDateChange={(dates) => {
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

                <GenericWeeklyDatePicker
                  id="to-date-bharni"
                  placeholder="DD/MM/YYYY"
                  mode="to"
                  initialDates={toDate ? [toDate] : []}
                  onDateChange={(dates) => {
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
          >
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Bharni' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Grouped Bharni Process Table */}
      <BharniTable
        groups={groups}
        showHistory={showHistory}
        handleBatchDescriptionChange={handleBatchDescriptionChange}
        handleBatchStampChange={handleBatchStampChange}
        // Table rows carry their position in the shown list; map back to the full list by id
        handleInlineChange={(i: number, field: any, value: string) =>
          handleInlineChange(entries.findIndex((e) => e.id === displayedEntries[i]?.id), field, value)
        }
        handleProcessPart={(i: number) =>
          handleProcessPart(entries.findIndex((e) => e.id === displayedEntries[i]?.id))
        }
      />

      {/* Dispatch from Bharni Stock to Next Process (Soldering, Cutting, Wash) */}
      <ProcessDispatchPopup
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCard(null);
        }}
        title="Bharni Process"
        items={
          selectedCard
            ? [
                {
                  id: selectedCard.id,
                  purity: selectedCard.purity,
                  availableWeight: selectedCard.totalWeight,
                  Stamp: selectedCard.stamp,
                  stamp: selectedCard.stamp,
                  designName: selectedCard.design || selectedCard.description || '',
                  design: selectedCard.design || selectedCard.description || '',
                  description: selectedCard.description || selectedCard.design || '',
                  qty: selectedCard.qty,
                  partNo: selectedCard.partNo !== undefined ? String(selectedCard.partNo) : undefined,
                },
              ]
            : []
        }
        nextProcessOptions={['Soldering', 'Cutting', 'Wash']}
        onSuccess={handleDispatchSuccess}
      />
    </div>
  );
};

export default BharniProcess;
