import { exceedsGiven } from '../shared/weightGuard';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getHistoryDefaultRange } from '@/utils/weekRangeUtils';
import { extendTrack, trackOf } from '@/utils/processTrack';
import { Package, ChevronDown, ChevronRight, Printer, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import ProcessDispatchPopup, {
  ProcessDispatchItem,
  ProcessDispatchPayload,
} from '../shared/ProcessDispatchPopup';
import { confirmAction } from '@/utils/confirmAction';
import { useGetHeader } from '@/lib/api/headerapi';
import {
  VibratorRow,
  VibratorStockCard,
  formatNumberDisplay,
  formatDate,
} from './vibratorUtils';
import { getVibratorColumns } from './vibratorColumns';

export const VibratorProcess: React.FC = () => {
  const getpdfheaderdata = useGetHeader();

  const [entries, setEntries] = useState<VibratorRow[]>([]);
  const [stockCards, setStockCards] = useState<VibratorStockCard[]>([]);

  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Popup state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // ---------------- Load Data ----------------
  const loadData = useCallback(() => {
    try {
      const savedEntries = localStorage.getItem('chain_vibrator_process_entries_v2');
      if (savedEntries && JSON.parse(savedEntries).length > 0) {
        const parsed = JSON.parse(savedEntries);
        const sanitized = parsed.map((e: VibratorRow, idx: number) => ({
          ...e,
          design: e.design || (e as any).designName || e.description || '',
          description: e.description || e.design || (e as any).designName || '',
        }));
        setEntries(sanitized);
      } else {
        const defaultEntries: VibratorRow[] = [];
        setEntries(defaultEntries);
        localStorage.setItem('chain_vibrator_process_entries_v2', JSON.stringify(defaultEntries));
      }

      const savedStock = localStorage.getItem('chain_vibrator_stock_cards_v2');
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitizedCards = parsed.map((c: VibratorStockCard, idx: number) => ({
            ...c,
            design: c.design && c.design !== 'Design' ? c.design : (c.description && c.description !== 'Design' ? c.description : ''),
            description: c.description || c.design || '',
          }));
          setStockCards(sanitizedCards);
          return;
        }
      }

      const defaultCards: VibratorStockCard[] = [];
      setStockCards(defaultCards);
      localStorage.setItem('chain_vibrator_stock_cards_v2', JSON.stringify(defaultCards));
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveEntries = (updated: VibratorRow[]) => {
    setEntries(updated);
    localStorage.setItem('chain_vibrator_process_entries_v2', JSON.stringify(updated));
  };

  const saveStockCards = (updated: VibratorStockCard[]) => {
    setStockCards(updated);
    localStorage.setItem('chain_vibrator_stock_cards_v2', JSON.stringify(updated));
  };

  // ---------------- Inline Changes ----------------
  const handleInlineChange = useCallback(
    (index: number, field: keyof VibratorRow, value: string) => {
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
            } else if (field === 'size') {
              updated.sizeRaw = value;
              updated.size = value;
            } else if (field === 'qtyGiven') {
              updated.qtyGivenRaw = value;
              updated.qtyGiven = parseInt(value, 10) || 0;
            } else if (field === 'qtyReceived') {
              updated.qtyReceivedRaw = value;
              updated.qtyReceived = parseInt(value, 10) || 0;
            } else if (field === 'karigar') {
              updated.karigar = value;
            } else if (field === 'netWeightReceived') {
              updated.netWeightReceivedRaw = value;
              const numVal = parseFloat(value) || 0;
              if (exceedsGiven(updated.netWeightGiven, numVal, updated.scrap, (updated as any).increase)) return entry;
              updated.netWeightReceived = numVal;
              const calcLoss = Math.max(
                0,
                updated.netWeightGiven - numVal - (updated.scrap || 0),
              );
              updated.loss = Math.round(calcLoss * 1000) / 1000;
            } else if (field === 'scrap') {
              updated.scrapRaw = value;
              const numVal = parseFloat(value) || 0;
              if (exceedsGiven(updated.netWeightGiven, updated.netWeightReceived, numVal, (updated as any).increase)) return entry;
              updated.scrap = numVal;
              const calcLoss = Math.max(
                0,
                updated.netWeightGiven - (updated.netWeightReceived || 0) - numVal,
              );
              updated.loss = Math.round(calcLoss * 1000) / 1000;
            } else if (field === 'increase') {
              updated.increaseRaw = value;
              updated.increase = parseFloat(value) || 0;
            } else if (field === 'rate') {
              updated.rateRaw = value;
              updated.rate = value;
            }
            return updated;
          }
          return entry;
        });
        localStorage.setItem(
          'chain_vibrator_process_entries_v2',
          JSON.stringify(updatedList),
        );
        return updatedList;
      });
    },
    [],
  );

  const handleSaveToStock = async (index: number) => {
    const entry = entries[index];
    if (!entry) return;

    const receivedWt =
      entry.netWeightReceived && entry.netWeightReceived > 0
        ? entry.netWeightReceived
        : entry.netWeightGiven;

    if (receivedWt <= 0) {
      toast.error('Please enter Net Wt Received first.');
      return;
    }

    const confirmed = await confirmAction(
      'Move to Stock',
      `This will move ${formatNumberDisplay(receivedWt)}G to Vibrator Stock cards. Continue?`,
    );
    if (!confirmed) return;

    const completedEntry = {
      ...entry,
      netWeightReceived: receivedWt,
      status: 'completed' as const,
    };
    const updatedEntries = entries.map((item, i) =>
      i === index ? completedEntry : item,
    );
    saveEntries(updatedEntries);

    const newStockCard: VibratorStockCard = {
      id: `vibrator-stock-${Date.now()}`,
      processTrack: extendTrack(trackOf(entry), 'Vibrator'),
      purity: entry.purity,
      stamp: entry.stamp || '',
      availableWeight: receivedWt,
      totalWeight: receivedWt,
      count: 1,
      design: entry.design || entry.description || '',
      description: entry.description || '',
      qty: entry.qtyReceived || entry.qtyGiven || (entry as any).qty || 0,
      size: (entry as any).size || '',
    } as VibratorStockCard;

    saveStockCards([newStockCard, ...stockCards]);
    toast.success(
      `Moved ${formatNumberDisplay(receivedWt)}G to Vibrator Stock Cards!`,
    );
  };

  // ---------------- Dispatch Popup Actions ----------------
  const handleCardClick = (cardId: string) => {
    setSelectedCards(new Set([cardId]));
    setIsModalOpen(true);
  };

  const handlePopupSuccess = (payload: ProcessDispatchPayload) => {
    const usedWeight = payload.weight || 0;
    const cardId = payload.itemId;

    const newStockCards = [...stockCards];
    const cardIndex = newStockCards.findIndex((c) => c.id === cardId);
    if (cardIndex > -1) {
      const card = newStockCards[cardIndex];
      const remaining =
        Math.max(0, Math.round((card.availableWeight - usedWeight) * 1000) / 1000);
      if (remaining <= 0) newStockCards.splice(cardIndex, 1);
      else newStockCards[cardIndex] = { ...card, availableWeight: remaining };
      saveStockCards(newStockCards);
    }
  };

  const dispatchItems: ProcessDispatchItem[] = useMemo(() => {
    return stockCards
      .filter((c) => selectedCards.has(c.id))
      .map((c) => ({
        id: c.id,
        purity: c.purity,
        stamp: c.stamp,
        Stamp: c.stamp,
        designName: c.design || c.description,
        description: c.description || c.design,
        qty: c.qty,
        size: (c as any).size || '',
        availableWeight: c.availableWeight,
      }));
  }, [stockCards, selectedCards]);

  // ---------------- Print History ----------------
  const handlePrintHistory = () => {
    toast.success('Printing Vibrator History Report');
    window.print();
  };

  // ---------------- Requested Sequence of Columns ----------------
  // Date & Time | Purity % | Stamp (शिक्का) | Design (डिझाइन) | Given Wt (G) | Description (तपशील) | Karigar | Received Wt (G) | Scrap | Increase (G) | Rate | Action

  const filteredEntries = useMemo(() => {
    let list = showHistory
      ? entries.filter((e) => e.status === 'completed')
      : entries.filter((e) => e.status !== 'completed');

    if (showHistory && (fromDate || toDate)) {
      list = list.filter((e) => {
        const rawDate = e.createdAt || e.dateTime;
        if (!rawDate) return true;
        const entryDate = new Date(rawDate);
        if (isNaN(entryDate.getTime())) return true;
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          if (entryDate < from) return false;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (entryDate > to) return false;
        }
        return true;
      });
    }

    if (historySearchTerm.trim()) {
      const lower = historySearchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.stamp?.toLowerCase().includes(lower) ||
          e.description?.toLowerCase().includes(lower) ||
          e.size?.toLowerCase().includes(lower) ||
          e.karigar?.toLowerCase().includes(lower) ||
          String(e.purity).includes(lower),
      );
    }
    return list;
  }, [entries, showHistory, historySearchTerm, fromDate, toDate]);

  // Columns get the position in the shown list; map it back to the full list by id
  const columns = useMemo(() => {
    const toEntryIdx = (i: number) => entries.findIndex((e) => e.id === filteredEntries[i]?.id);
    return getVibratorColumns(
      (i: number, field: any, value: string) => handleInlineChange(toEntryIdx(i), field, value),
      (i: number) => handleSaveToStock(toEntryIdx(i)),
    );
  }, [entries, filteredEntries, handleInlineChange, handleSaveToStock]);

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------- Stock Cards (Outbound) ---------------- */}
      {stockCards.length > 0 && !showHistory && (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Vibrator Stock Available ({stockCards.length})
              </span>
            </div>
          </div>
          <div className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 flex gap-2 overflow-x-auto pb-2 pt-1">
            {stockCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                className="flex min-w-[140px] flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-3 shadow-sm transition-all hover:border-[#785600]/60 cursor-pointer dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#1a1c1b] dark:text-slate-200">
                    {card.design || card.description || 'Design'} ({formatNumberDisplay(card.purity)}%) {card.stamp ? `- ${card.stamp}` : ''}
                  </span>
                  {card.sourceProcess && (
                    <span className="text-[10px] font-bold text-[#785600] bg-amber-500/10 px-1.5 py-0.5 rounded uppercase dark:text-amber-400 shrink-0">
                      From: {card.sourceProcess}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sm font-bold text-black dark:text-white">
                    {formatNumberDisplay(card.availableWeight)} G
                  </span>
                  {card.qty !== undefined && card.qty !== null && card.qty !== '' && (
                    <span className="text-xs font-semibold text-[#785600] dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                      {card.qty} Pcs
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Header Section with History Controls ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
          {showHistory ? 'Vibrator History' : 'Vibrator Process'}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {showHistory && (
            <>
              {/* Search History */}
              <div className="relative w-44 sm:w-52">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
              autoComplete="off"
              data-lpignore="true"
                  type="search"
                  placeholder="Search history..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* From Date */}
              <GenericWeeklyDatePicker
                id="from-date-vibrator"
                placeholder="DD/MM/YYYY"
                mode="from"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={(dates) => {
                  if (dates && dates.length > 0) setFromDate(new Date(dates[0]));
                  else setFromDate(null);
                }}
                className="w-32 sm:w-36"
              />

              {/* To Date */}
              <GenericWeeklyDatePicker
                id="to-date-vibrator"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={toDate ? [toDate] : []}
                onDateChange={(dates) => {
                  if (dates && dates.length > 0) setToDate(new Date(dates[0]));
                  else setToDate(null);
                }}
                className="w-32 sm:w-36"
              />

              {/* Print Button */}
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

          {/* History Toggle Button */}
          <GenericButton size="sm"
            type="button"
            onClick={() => {
              if (!showHistory) {
                const { fromDate: from, toDate: to } = getHistoryDefaultRange();
                setFromDate(from);
                setToDate(to);
              }
              setShowHistory(!showHistory);
            }}
            variant="primary"
            className="flex items-center gap-1.5"
          >
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Vibrator' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* ---------------- Table Section ---------------- */}
        <div>
          <GenericTable
            showSrNo={true}
            srNoLabel="Sr No."
            data={filteredEntries}
            columns={columns}
            emptyMessage="No vibrator entries found."
          />
        </div>
      
      <ProcessDispatchPopup
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Vibrator Process"
        items={dispatchItems}
        nextProcessOptions={['Stock']}
        onSuccess={handlePopupSuccess}
      />
    </div>
  );
};

export default VibratorProcess;