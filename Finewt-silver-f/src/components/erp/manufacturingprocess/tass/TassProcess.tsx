import LossAlertBadge from '../shared/LossAlertBadge';
import { exceedsGiven } from '../shared/weightGuard';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { extendTrack, trackOf } from '@/utils/processTrack';
import StageHistory from '../shared/StageHistory';
import { RotateCcw, Scissors, Search, ChevronDown, ChevronRight, Printer, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import ScaleWeightField from '@/components/common/ScaleWeightField';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import ProcessDispatchPopup, { ProcessDispatchItem, ProcessDispatchPayload } from '../shared/ProcessDispatchPopup';
import { confirmAction } from '@/utils/confirmAction';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface TassRow {
  id: string;
  srNo: number;
  dateTime: string;
  createdAt?: string;
  purity: number;
  stamp: string;
  design?: string;
  netWeightGiven: number;
  karigar?: string;
  description?: string;
  descriptionRaw?: string;
  size?: string;
  qty?: string | number;
  netWeightReceived?: number;
  netWeightReceivedRaw?: string;
  scrap?: number;
  scrapRaw?: string;
  loss?: number;
  rate?: string | number;
  status?: 'pending' | 'stock' | 'completed';
}

export interface TassStockCard {
  processTrack?: string[];
  id: string;
  purity: number;
  stamp: string;
  design?: string;
  description?: string;
  qty?: string | number;
  availableWeight: number;
  totalWeight: number; // Original weight
  count: number;
  sourceProcess?: string;
}

const toNumber = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatNumberDisplay = (v: unknown): string =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(toNumber(v));

const TassProcess: React.FC = () => {
  const [entries, setEntries] = useState<TassRow[]>([]);
  const [stockCards, setStockCards] = useState<TassStockCard[]>([]);

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
      // Load Table Entries
      const savedEntries = localStorage.getItem('chain_tass_process_entries_v2');
      if (savedEntries && JSON.parse(savedEntries).length > 0) {
        const parsed = JSON.parse(savedEntries);
        const sanitized = parsed.map((e: TassRow, idx: number) => ({
          ...e,
          design: e.design || (e as any).designName || e.description || '',
          description: e.description || e.design || (e as any).designName || '',
        }));
        setEntries(sanitized);
      } else {
        const defaultEntries: TassRow[] = [];
        setEntries(defaultEntries);
        localStorage.setItem('chain_tass_process_entries_v2', JSON.stringify(defaultEntries));
      }

      // Load Stock Cards
      const savedStock = localStorage.getItem('chain_tass_stock_cards_v2');
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitizedCards = parsed.map((c: TassStockCard, idx: number) => ({
            ...c,
            design: c.design && c.design !== 'Design' ? c.design : (c.description && c.description !== 'Design' ? c.description : ''),
            description: c.description || c.design || '',
          }));
          setStockCards(sanitizedCards);
          return;
        }
      }

      const defaultCards: TassStockCard[] = [];
      setStockCards(defaultCards);
      localStorage.setItem('chain_tass_stock_cards_v2', JSON.stringify(defaultCards));
    } catch (e) { }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveEntries = (updated: TassRow[]) => {
    setEntries(updated);
    localStorage.setItem('chain_tass_process_entries_v2', JSON.stringify(updated));
  };

  const saveStockCards = (updated: TassStockCard[]) => {
    setStockCards(updated);
    localStorage.setItem('chain_tass_stock_cards_v2', JSON.stringify(updated));
  };

  // ---------------- Table Actions ----------------
  const handleInlineChange = useCallback(
    (index: number, field: keyof TassRow, value: string) => {
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
              updated.loss = Math.max(0, Math.round((updated.netWeightGiven - numVal - (updated.scrap || 0)) * 1000) / 1000);
            } else if (field === 'scrap') {
              updated.scrapRaw = value;
              const numVal = parseFloat(value) || 0;
              if (exceedsGiven(updated.netWeightGiven, updated.netWeightReceived, numVal)) return entry;
              updated.scrap = numVal;
              updated.loss = Math.max(0, Math.round((updated.netWeightGiven - (updated.netWeightReceived || 0) - numVal) * 1000) / 1000);
            }
            return updated;
          }
          return entry;
        });
        localStorage.setItem('chain_tass_process_entries_v2', JSON.stringify(updatedList));
        return updatedList;
      });
    },
    [],
  );

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
      'Move to Stock',
      `This will move ${formatNumberDisplay(receivedWt)}G to Tass Stock cards. Continue?`,
    );
    if (!confirmed) return;

    // 1. Mark as completed in table
    const completedEntry = { ...entry, netWeightReceived: receivedWt, status: 'completed' as const };
    const updatedEntries = entries.map((item, i) => (i === index ? completedEntry : item));
    saveEntries(updatedEntries);

    // 2. Add to Stock Cards
    const newStockCard: TassStockCard = {
      id: `tass-stock-${Date.now()}`,
      processTrack: extendTrack(trackOf(entry), 'Tass'),
      purity: entry.purity,
      stamp: entry.stamp || '',
      design: entry.design || entry.description || '',
      description: entry.description || entry.design || '',
      availableWeight: receivedWt,
      totalWeight: receivedWt,
      count: 1,
      size: (entry as any).size || '',
      qty: (entry as any).qty || '',
    } as TassStockCard;

    saveStockCards([newStockCard, ...stockCards]);
    toast.success(`Moved ${formatNumberDisplay(receivedWt)}G to Tass Stock Cards!`);
  };

  // ---------------- Popup Actions ----------------
  const handleCardClick = (cardId: string) => {
    setSelectedCards(new Set([cardId]));
    setIsModalOpen(true);
  };

  const handlePopupSuccess = (payload: ProcessDispatchPayload) => {
    const usedWeight = payload.weight || 0;
    const cardId = payload.itemId;

    // Deduct from Tass Stock Cards
    let newStockCards = [...stockCards];
    const cardIndex = newStockCards.findIndex(c => c.id === cardId);
    if (cardIndex > -1) {
      const card = newStockCards[cardIndex];
      const remaining = Math.max(0, Math.round((card.availableWeight - usedWeight) * 1000) / 1000);
      if (remaining <= 0) newStockCards.splice(cardIndex, 1);
      else newStockCards[cardIndex] = { ...card, availableWeight: remaining };
      saveStockCards(newStockCards);
    }
  };

  const dispatchItems: ProcessDispatchItem[] = useMemo(() => {
    return stockCards
      .filter((card) => selectedCards.has(card.id))
      .map((card) => ({
        id: card.id,
        purity: card.purity,
        availableWeight: card.availableWeight,
        stamp: card.stamp,
        Stamp: card.stamp,
        designName: card.design || card.description || '',
        design: card.design || card.description || '',
        description: card.description || card.design || '',
        qty: card.qty,
        size: (card as any).size || '',
      }));
  }, [stockCards, selectedCards]);

  // ---------------- Columns ----------------
  const activeEntries = entries.filter(e => e.status !== 'completed');

  // Rows are shown filtered; handlers work on the full list, so look rows up by id
  const rowIdx = (row: { id: string }) => entries.findIndex((e) => e.id === row.id);

  const columns: Column<TassRow>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const d = new Date((item as any).createdAt || item.dateTime);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{d.toLocaleDateString('en-IN')}</span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => <span className="font-semibold">{item.purity}%</span>,
    },
    {
      key: 'stamp',
      header: 'Stamp (शिक्का)',
      render: (item, idx) =>
        (item as any).status === 'completed' || (item as any).isSaved ? (
          <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
            {item.stamp || item.Stamp || (item as any)['Stamp (शिक्का)'] || '-'}
          </span>
        ) : (
          <div className="inline-block w-24">
            <GenericInputField
              type="text"
              value={(item as any).stamp ?? (item as any).Stamp ?? ''}
              onChange={(e) => handleInlineChange(rowIdx(item), 'stamp' as any, e.target.value)}
              placeholder="Stamp"
              compact
              className="text-xs"
            />
          </div>
        ),
    },
    {
      key: 'design',
      header: 'Design (डिझाइन)',
      render: (item) => (
        <span className="text-sm font-semibold text-[#1a1c1b] dark:text-white">
          {item.design || (item as any).designName || item.description || '-'}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-xs font-semibold text-[#1a1c1b] dark:text-white">{(item as any).size || '-'}</span>
      ),
    },
    {
      key: 'qty',
      header: 'Qty',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[#1a1c1b] dark:text-white">
          {(item as any).qty !== undefined && (item as any).qty !== '' ? (item as any).qty : '-'}
        </span>
      ),
    },
    {
      key: 'karigar',
      header: 'Karigar',
      render: (item) => <span className="font-semibold text-amber-700">{item.karigar || '-'}</span>,
    },
    {
      key: 'netWeightGiven',
      header: 'Given Wt (G)',
      render: (item) => <span className="font-semibold">{formatNumberDisplay(item.netWeightGiven)} G</span>,
    },
    {
      key: 'description',
      header: 'Description (तपशील)',
      render: (item, idx) => (
           <div className="inline-block w-48 min-w-[180px]">
          <GenericInputField
            type="text"
            value={item.descriptionRaw !== undefined ? item.descriptionRaw : (item.description || item.design || (item as any).designName || '')}
            onChange={(e) => handleInlineChange(rowIdx(item), 'description', e.target.value)}
            compact
            className="text-xs"
          />
        </div>
      )
    },
    {
      key: 'netWeightReceived',
      header: 'Received Wt (G)',
      render: (item, idx) => (
        <div className="w-28">
          <ScaleWeightField
            onScaleWeight={(w) => handleInlineChange(rowIdx(item), 'netWeightReceived', String(w))}
            type="text"
            inputMode="decimal"
            value={item.netWeightReceivedRaw !== undefined ? item.netWeightReceivedRaw : item.netWeightReceived || ''}
            onChange={(e) => handleInlineChange(rowIdx(item), 'netWeightReceived', e.target.value)}
            suffix="G"
            compact
            className="text-right font-mono"
          />
        </div>
      )
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item, idx) => (
        <div className="w-24">
          <GenericInputField
            type="text"
            inputMode="decimal"
            value={item.scrapRaw !== undefined ? item.scrapRaw : item.scrap || ''}
            onChange={(e) => handleInlineChange(rowIdx(item), 'scrap', e.target.value)}
            suffix="G"
            compact
            className="text-right font-mono"
          />
        </div>
      )
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => (
        <div className="flex flex-col items-center">
          <span className="font-mono font-semibold text-[#1a1c1b] dark:text-white">{formatNumberDisplay(item.loss || 0)} G</span>
          <LossAlertBadge stage="tass" given={item.netWeightGiven} purity={Number((item as any).purity) || 0} loss={item.loss || 0} />
        </div>
      )
    },
    {
      key: 'rate',
      header: 'Rate (Rs)',
      render: (item) => {
        const baseRate = toNumber(item.rate) || 0;
        const effectiveWt = (item.netWeightReceived && item.netWeightReceived > 0)
          ? item.netWeightReceived
          : item.netWeightGiven;
        const laborCost = ((baseRate * effectiveWt) / 1000).toFixed(2);
        return (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-sm text-[#785600] dark:text-amber-400">
              ₹ {laborCost}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-slate-400">
              (₹{baseRate}/kg)
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item, idx) => (
        <button
          onClick={() => handleSaveToStock(rowIdx(item))}
          className="rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#5c4200] cursor-pointer"
        >
          Save
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ---------------- Stock Cards (Outbound) ---------------- */}
      {stockCards.length > 0 && !showHistory && (
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Tass Stock Available ({stockCards.length})
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

      {/* ---------------- Table Section ---------------- */}
      {!showHistory && (
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
          Tass Process
        </h2>
        <GenericButton size="sm"
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            variant="primary"
            className="flex items-center gap-1.5"
          >
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Tass' : 'History'}</span>
          </GenericButton>
      </div>
      )}

      {showHistory ? (
        <StageHistory stageName="Tass" onBack={() => setShowHistory(false)} entries={entries.filter((e: any) => e.status === 'completed')} />
      ) : (
      <div className="border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="overflow-hidden">
          <GenericTable data={activeEntries} columns={columns} showSrNo={true} srNoLabel="Sr No." />
        </div>
      </div>
      )}

      <ProcessDispatchPopup
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tass Process"
        items={dispatchItems}
        nextProcessOptions={['Vibrator']}
        onSuccess={handlePopupSuccess}
      />
    </div>
  );
};

export default TassProcess;