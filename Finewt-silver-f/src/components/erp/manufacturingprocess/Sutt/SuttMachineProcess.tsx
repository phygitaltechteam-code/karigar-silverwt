import { exceedsGiven } from '../shared/weightGuard';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getHistoryDefaultRange } from '@/utils/weekRangeUtils';
import { extendTrack, trackOf } from '@/utils/processTrack';
import {
  Building2,
  RotateCcw,
  Search,
  Flame,
  ChevronDown,
  ChevronRight,
  Printer,
  Layers,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { confirmAction } from '@/utils/confirmAction';
import ProcessDispatchPopup, { ProcessDispatchItem, ProcessDispatchPayload } from '../shared/ProcessDispatchPopup';
import { getSuttColumns } from './suttColumns';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface SuttRow {
  id: string;
  srNo: number;
  dateTime: string;
  createdAt?: string;
  purity: number;
  stamp: string;
  netWeightGiven: number;
  description: string;
  descriptionRaw?: string;
  netWeightReceived: number;
  netWeightReceivedRaw?: string;
  scrap: number;
  scrapRaw?: string;
  loss: number;
  karigar?: string;
  rate?: string | number;
  isCompleted?: boolean;
  status?: 'pending' | 'bharni' | 'reverted';
}

export interface SuttStockCard {
  processTrack?: string[];
  id: string;
  purity: number;
  stamp: string;
  availableWeight: number;
  totalWeight: number;
  count: number;
  description?: string;
  design?: string;
  sourceProcess?: string;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const toNumber = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const formatNumberDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(num);
};

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export const SuttMachineProcess: React.FC = () => {
  const [entries, setEntries] = useState<SuttRow[]>([]);
  const [stockCards, setStockCards] = useState<SuttStockCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Popup state for stock card click
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchItems, setDispatchItems] = useState<ProcessDispatchItem[]>([]);

  // Load entries and stock cards
  const loadEntries = useCallback(() => {
    try {
      const saved = localStorage.getItem('chain_sutt_process_entries_v2') || localStorage.getItem('chain_sutt_process_entries_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map((e: SuttRow, idx: number) => ({
            ...e,
            stamp: e.stamp || (e as any).Stamp || (e.purity ? (e.purity === 99.9 ? 'ST-999' : 'ST-925') : 'ST-925'),
            description: e.description || (e as any).design || (e as any).designName || '',
          }));
          setEntries(sanitized);
        } else {
          setEntries(defaultDemoData);
          localStorage.setItem('chain_sutt_process_entries_v2', JSON.stringify(defaultDemoData));
        }
      } else {
        setEntries(defaultDemoData);
        localStorage.setItem('chain_sutt_process_entries_v2', JSON.stringify(defaultDemoData));
      }

      const savedCards = localStorage.getItem('chain_sutt_stock_cards_v2');
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        if (Array.isArray(parsedCards) && parsedCards.length > 0) {
          const sanitizedCards = parsedCards.map((c: SuttStockCard, idx: number) => ({
            ...c,
            stamp: c.stamp || (c as any).Stamp || (c.purity ? (c.purity === 99.9 ? 'ST-999' : 'ST-925') : 'ST-925'),
            design: c.design && c.design !== 'Design' ? c.design : (c.description || ''),
            description: c.description || c.design || '',
            sourceProcess: c.sourceProcess || (c as any).source || '',
          }));
          setStockCards(sanitizedCards);
        } else {
          setStockCards(defaultStockCards);
          localStorage.setItem('chain_sutt_stock_cards_v2', JSON.stringify(defaultStockCards));
        }
      } else {
        setStockCards(defaultStockCards);
        localStorage.setItem('chain_sutt_stock_cards_v2', JSON.stringify(defaultStockCards));
      }
    } catch (e) {
      console.error('Error loading sutt process entries:', e);
    }
  }, []);

  const defaultDemoData: SuttRow[] = [];

  const defaultStockCards: SuttStockCard[] = [];

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Save entries
  const saveEntries = useCallback((updated: SuttRow[]) => {
    setEntries(updated);
    try {
      localStorage.setItem('chain_sutt_process_entries_v2', JSON.stringify(updated));
      localStorage.setItem('chain_sutt_process_entries_v1', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving sutt process entries:', e);
    }
  }, []);

  const saveStockCards = useCallback((updated: SuttStockCard[]) => {
    setStockCards(updated);
    try {
      localStorage.setItem('chain_sutt_stock_cards_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving sutt stock cards:', e);
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

  // Inline change
  const handleInlineChange = useCallback(
    (
      index: number,
      field: 'description' | 'netWeightReceived' | 'scrap',
      value: string,
    ) => {
      setEntries((prev) => {
        const updatedList = prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };
            if ((field as string) === 'stamp') {
              (updated as any).stamp = value;
              (updated as any).Stamp = value;
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
                  (updated.netWeightGiven -
                    numVal -
                    (updated.scrap || 0)) *
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
                  (updated.netWeightGiven -
                    (updated.netWeightReceived || 0) -
                    numVal) *
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
            'chain_sutt_process_entries_v2',
            JSON.stringify(updatedList),
          );
        } catch (e) { }

        return updatedList;
      });
    },
    [],
  );

  // Save table row to Sutt Stock Cards
  const handleSaveToStock = async (index: number) => {
    const entry = entries[index];
    if (!entry) return;

    const receivedWt = (entry.netWeightReceived && entry.netWeightReceived > 0)
      ? entry.netWeightReceived
      : entry.netWeightGiven;

    if (receivedWt <= 0) {
      toast.error('Please enter Net Wt Received first.');
      return;
    }

    const confirmed = await confirmAction(
      'Move to Sutt Stock',
      `Are you sure you want to save ${formatNumberDisplay(receivedWt)} G to Sutt Stock cards?`,
    );
    if (!confirmed) return;

    const updated = entries.map((item, i) =>
      i === index
        ? { ...item, netWeightReceived: receivedWt, status: 'bharni' as const, isCompleted: true }
        : item,
    );
    saveEntries(updated);

    const newCard: SuttStockCard = {
      id: `sutt-stock-${Date.now()}`,
      processTrack: extendTrack(trackOf(entry), 'Sutt'),
      purity: entry.purity,
      stamp: entry.stamp || '',
      availableWeight: receivedWt,
      totalWeight: receivedWt,
      count: 1,
      description: entry.description || '',
      design: entry.description || '',
    };
    saveStockCards([newCard, ...stockCards]);

    toast.success('Saved to Sutt Stock!');
  };

  const handlePrintHistory = () => {
    window.print();
  };

  // Active vs History
  const activeEntries = entries.filter(
    (e) => !e.isCompleted && e.status !== 'bharni' && e.status !== 'reverted',
  );
  const historyEntries = entries.filter(
    (e) => e.isCompleted || e.status === 'bharni' || e.status === 'reverted',
  );

  const targetList = showHistory
    ? historyEntries.length > 0
      ? historyEntries
      : entries
    : activeEntries;
  const currentSearch = showHistory ? historySearchTerm : searchTerm;

  const displayedEntries = targetList.filter((item) => {
    if (!currentSearch.trim()) return true;
    const query = currentSearch.toLowerCase();
    return (
      (item.stamp && item.stamp.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.purity && item.purity.toString().includes(query))
    );
  });

  // ---------------- Card Click → Popup ----------------
  const handleCardClick = (cardId: string) => {
    const card = stockCards.find((c) => c.id === cardId);
    if (!card) return;
    setDispatchItems([
      {
        id: card.id,
        purity: card.purity,
        availableWeight: card.availableWeight,
        stamp: card.stamp,
        Stamp: card.stamp,
        description: card.description || card.design || '',
        design: card.design || card.description || '',
        designName: card.design || card.description || '',
      },
    ]);
    setIsDispatchOpen(true);
  };

  const handleDispatchSuccess = (payload: ProcessDispatchPayload) => {
    const usedWeight = payload.weight || 0;
    const cardId = payload.itemId;

    let newStockCards = [...stockCards];
    const cardIndex = newStockCards.findIndex((c) => c.id === cardId);
    if (cardIndex > -1) {
      const card = newStockCards[cardIndex];
      const remaining = Math.max(0, Math.round((card.availableWeight - usedWeight) * 1000) / 1000);
      if (remaining <= 0) {
        newStockCards.splice(cardIndex, 1);
      } else {
        newStockCards[cardIndex] = { ...card, availableWeight: remaining };
      }
      saveStockCards(newStockCards);
    }
  };

  // ---------------- Columns ----------------
  // Columns get the position in the shown list; map it back to the full list by id
  const columns = useMemo(() => {
    const toEntryIdx = (i: number) => entries.findIndex((e) => e.id === displayedEntries[i]?.id);
    return getSuttColumns(
      (i: number, field: any, value: string) => handleInlineChange(toEntryIdx(i), field, value),
      (i: number) => handleSaveToStock(toEntryIdx(i)),
    );
  }, [entries, displayedEntries, handleInlineChange, handleSaveToStock]);

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------- Stock Cards Strip ---------------- */}
      {!showHistory && stockCards.length > 0 && (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Sutt Machine Stock Available ({stockCards.length})
              </span>
            </div>
          </div>

          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-2 pt-1">
            {stockCards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="flex min-w-[140px] flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-3 shadow-sm transition-all hover:border-[#785600]/60 cursor-pointer dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#1a1c1b] dark:text-slate-200">
                    Sutt ({formatNumberDisplay(card.purity)}%) {card.stamp ? `- ${card.stamp}` : ''}
                  </span>
                  {card.sourceProcess && (
                    <span className="text-[10px] font-bold text-[#785600] bg-amber-500/10 px-1.5 py-0.5 rounded uppercase dark:text-amber-400 shrink-0">
                      From: {card.sourceProcess}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 font-mono text-sm font-bold text-black dark:text-white">
                  {formatNumberDisplay(card.availableWeight)} G
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Header Controls ---------------- */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#785600] dark:text-amber-400" />
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Sutt Machine History' : 'Sutt Machine'}
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
                placeholder="Search sutt process..."
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
                  id="from-date-sutt"
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
                  id="to-date-sutt"
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

          <GenericButton size="sm" type="button" onClick={toggleHistory} variant="primary">
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Sutt Machine' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* ---------------- Table ---------------- */}
      <GenericTable<SuttRow>
        data={displayedEntries}
        columns={columns}
        emptyMessage={
          showHistory
            ? 'No history records found for Sutt machine process.'
            : 'No active sutt machine process records found. Send entries from Company or Press process to display them here.'
        }
        isLoading={false}
        showSrNo={true}
        srNoLabel="Sr No."
      />

      {/* Dispatch Popup */}
      <ProcessDispatchPopup
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        title="Sutt Process"
        items={dispatchItems}
        nextProcessOptions={['Bharni', 'Cutting', 'Wash']}
        onSuccess={handleDispatchSuccess}
      />
    </div>
  );
};

export default SuttMachineProcess;
