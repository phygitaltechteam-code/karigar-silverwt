import LossAlertBadge from '../shared/LossAlertBadge';
import { exceedsGiven } from '../shared/weightGuard';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { extendTrack, trackOf } from '@/utils/processTrack';
import StageHistory from '../shared/StageHistory';
import { RotateCcw, Building2, Search, ChevronDown, ChevronRight, Printer, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import ScaleWeightField from '@/components/common/ScaleWeightField';
import ProcessDispatchPopup, { ProcessDispatchItem, ProcessDispatchPayload } from '../shared/ProcessDispatchPopup';
import CompanyModal, { CompanyPartItem } from './CompanyModal';
import { confirmAction } from '@/utils/confirmAction';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface CompanyRow {
  id: string;
  srNo: number;
  dateTime: string;
  createdAt?: string;
  purity: number;
  stamp: string;
  netWeightGiven: number;
  karigar?: string;
  description?: string;
  descriptionRaw?: string;
  netWeightReceived?: number;
  netWeightReceivedRaw?: string;
  scrap?: number;
  scrapRaw?: string;
  loss?: number;
  rate?: string | number;
  partNo?: string;
  status?: 'pending' | 'stock' | 'completed';
}

export interface CompanyStockCard {
  processTrack?: string[];
  id: string;
  purity: number;
  stamp: string;
  availableWeight: number;
  totalWeight: number; // Original weight
  count: number;
  description?: string;
  design?: string;
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

const CompanyProcess: React.FC = () => {
  const [entries, setEntries] = useState<CompanyRow[]>([]);
  const [stockCards, setStockCards] = useState<CompanyStockCard[]>([]);
  
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Popup state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Part Modal State
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedPartCard, setSelectedPartCard] = useState<CompanyPartItem | null>(null);
  const [partSourceRowIndex, setPartSourceRowIndex] = useState<number | null>(null);

  // ---------------- Load Data ----------------
  const loadData = useCallback(() => {
    try {
      // Load Table Entries
      const savedEntries = localStorage.getItem('chain_company_process_entries_v2');
      if (savedEntries && JSON.parse(savedEntries).length > 0) {
        const parsed = JSON.parse(savedEntries);
        const sanitized = parsed.map((e: CompanyRow, idx: number) => ({
          ...e,
          karigar: e.karigar || (e as any).karigarName || (e as any).selectedKarigar || '',
          description: e.description || (e as any).design || '',
        }));
        setEntries(sanitized);
      } else {
        const defaultEntries: CompanyRow[] = [];
        setEntries(defaultEntries);
        localStorage.setItem('chain_company_process_entries_v2', JSON.stringify(defaultEntries));
      }

      // Load Stock Cards
      const savedStock = localStorage.getItem('chain_company_stock_cards_v2');
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitizedCards = parsed.map((c: CompanyStockCard) => ({
            ...c,
            design: c.design || c.description || '',
            description: c.description || c.design || '',
          }));
          setStockCards(sanitizedCards);
          return;
        }
      }

      // Default 2 stock cards if none stored
      const defaultCards: CompanyStockCard[] = [];
      setStockCards(defaultCards);
      localStorage.setItem('chain_company_stock_cards_v2', JSON.stringify(defaultCards));
    } catch (e) { }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveEntries = (updated: CompanyRow[]) => {
    setEntries(updated);
    localStorage.setItem('chain_company_process_entries_v2', JSON.stringify(updated));
  };

  const saveStockCards = (updated: CompanyStockCard[]) => {
    setStockCards(updated);
    localStorage.setItem('chain_company_stock_cards_v2', JSON.stringify(updated));
  };

  // ---------------- Table Actions ----------------
  const handleInlineChange = useCallback(
    (index: number, field: keyof CompanyRow, value: string) => {
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
        localStorage.setItem('chain_company_process_entries_v2', JSON.stringify(updatedList));
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

    const given = Number(entry.netWeightGiven) || 0;
    const scrap = Number(entry.scrap) || 0;
    const loss = Math.max(0, Math.round((given - receivedWt - scrap) * 1000) / 1000);
    const confirmed = await confirmAction(
      'Move to Stock',
      <span className="block text-left">
        <span className="mb-2 block text-center">Please check before saving:</span>
        <span className="block">Karigar: <b>{entry.karigar || '-'}</b></span>
        <span className="block">Given Wt: <b>{formatNumberDisplay(given)} G</b></span>
        <span className="block">Received Wt: <b>{formatNumberDisplay(receivedWt)} G</b></span>
        <span className="block">Scrap: <b>{formatNumberDisplay(scrap)} G</b></span>
        <span className="block">Loss: <b>{formatNumberDisplay(loss)} G</b></span>
        <span className="mt-2 block text-center">{formatNumberDisplay(receivedWt)} G will move to Company Stock.</span>
      </span>,
    );
    if (!confirmed) return;

    // 1. Mark as completed in table
    const completedEntry = {
      ...entry,
      netWeightReceived: receivedWt,
      status: 'completed' as const,
    };
    const updatedEntries = entries.map((item, i) => (i === index ? completedEntry : item));
    saveEntries(updatedEntries);

    // 2. Add to Stock Cards
    const newStockCard: CompanyStockCard = {
      id: 'company-stock-' + Date.now(),
      processTrack: extendTrack(trackOf(entry), 'Company'),
      purity: entry.purity,
      stamp: entry.stamp || '',
      availableWeight: receivedWt,
      totalWeight: receivedWt,
      count: 1,
      description: entry.description || '',
      design: entry.description || '',
    };

    saveStockCards([newStockCard, ...stockCards]);
    toast.success(`Moved ${receivedWt}G to Company Stock Cards!`);
  };

  // ---------------- Part Action ----------------
  const handlePartRow = async (entry: CompanyRow, index: number) => {
    const receivedWt = entry.netWeightReceived || 0;
    if (receivedWt <= 0) {
      toast.error('Please enter Received Wt (G) first to save a part.');
      return;
    }

    if (receivedWt >= entry.netWeightGiven) {
      toast.error(
        `Received Wt (${receivedWt}G) is equal to or exceeds Given Wt (${entry.netWeightGiven}G). Please use "Save" for the full amount.`,
      );
      return;
    }

    const scrapWt = entry.scrap || 0;
    const remainingWt = Math.max(
      0,
      Math.round((entry.netWeightGiven - receivedWt - scrapWt) * 1000) / 1000,
    );

    const confirmed = await confirmAction(
      'Confirm Part Save',
      `Save ${receivedWt} G to Company Stock Cards and keep remaining ${remainingWt} G in Company Process table?`,
    );
    if (!confirmed) return;

    // 1. Create a Stock Card for the completed part
    const newStockCard: CompanyStockCard = {
      id: 'company-stock-' + Date.now(),
      processTrack: extendTrack(trackOf(entry), 'Company'),
      purity: entry.purity,
      stamp: entry.stamp || '',
      availableWeight: receivedWt,
      totalWeight: receivedWt,
      count: 1,
      description: entry.description || '',
      design: entry.description || '',
    };
    saveStockCards([newStockCard, ...stockCards]);

    // 2. Update current row: deduct saved part from netWeightGiven and reset inputs
    const updatedRow: CompanyRow = {
      ...entry,
      netWeightGiven: remainingWt,
      netWeightReceived: 0,
      netWeightReceivedRaw: '',
      scrap: 0,
      scrapRaw: '',
      loss: 0,
      status: 'pending',
    };
    const updatedEntries = entries.map((r, i) => (i === index ? updatedRow : r));
    saveEntries(updatedEntries);

    toast.success(
      `Part saved! ${receivedWt} G moved to Stock Cards, remaining ${remainingWt} G kept in table.`,
    );
  };

  const handleSavePartsFromModal = (
    design: string,
    parts: Array<{ partNo: string; weight: number; karigar: string; rate?: number }>,
    totalWeightUsed: number,
    nextProcess: string,
  ) => {
    if (!selectedPartCard) return;

    try {
      // 1. Dispatch parts to Press (or configured process table)
      const targetTable = nextProcess === 'Press'
        ? 'chain_press_process_entries_v2'
        : `chain_${nextProcess.toLowerCase()}_process_entries_v2`;

      const existingData = localStorage.getItem(targetTable);
      const pressEntries = existingData ? JSON.parse(existingData) : [];

      // Parts made together share a batch and carry the track so far
      const partBatchId = `company-parts-${Date.now()}`;
      const partTrack = extendTrack(trackOf(selectedPartCard), 'Company');
      const newPressRows = parts.map((part, pIdx) => ({
        batchId: partBatchId,
        partNo: part.partNo,
        processTrack: partTrack,
        sourceProcess: 'Company',
        id: `${nextProcess.toLowerCase()}-part-${Date.now()}-${pIdx}`,
        srNo: pressEntries.length + pIdx + 1,
        dateTime: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        createdAt: new Date().toISOString(),
        purity: selectedPartCard.purity,
        stamp: selectedPartCard.stamp || '',
        Stamp: selectedPartCard.stamp || '',
        netWeightGiven: part.weight,
        description: selectedPartCard.description || (design ? `${design} (Part ${part.partNo})` : `Part ${part.partNo}`),
        design: selectedPartCard.description || design || '',
        designName: selectedPartCard.description || design || '',
        karigar: part.karigar,
        rate: part.rate || 0,
        netWeightReceived: part.weight,
        scrap: 0,
        loss: 0,
        status: 'pending',
      }));

      localStorage.setItem(targetTable, JSON.stringify([...newPressRows, ...pressEntries]));

      // Also persist to v1 for cross-compatibility
      const targetTableV1 = targetTable.replace('_v2', '_v1');
      const existingV1 = localStorage.getItem(targetTableV1);
      const parsedV1 = existingV1 ? JSON.parse(existingV1) : [];
      localStorage.setItem(targetTableV1, JSON.stringify([...newPressRows, ...parsedV1]));

      // 2. If called from row, complete/deduct row in Company table
      if (partSourceRowIndex !== null && entries[partSourceRowIndex]) {
        const completedRow: CompanyRow = {
          ...entries[partSourceRowIndex],
          status: 'completed',
        };
        const updatedEntries = entries.map((r, i) => (i === partSourceRowIndex ? completedRow : r));
        saveEntries(updatedEntries);
      }

      // 3. If called from stock card, deduct from stock cards
      const cardIdx = stockCards.findIndex(c => c.id === selectedPartCard.id);
      if (cardIdx > -1) {
        const rem = Math.max(0, Math.round((stockCards[cardIdx].availableWeight - totalWeightUsed) * 1000) / 1000);
        let updatedCards = [...stockCards];
        if (rem <= 0) {
          updatedCards.splice(cardIdx, 1);
        } else {
          updatedCards[cardIdx] = { ...updatedCards[cardIdx], availableWeight: rem };
        }
        saveStockCards(updatedCards);
      }

      toast.success(`Successfully saved ${parts.length} part(s) to ${nextProcess}!`);
      setIsPartModalOpen(false);
      setSelectedPartCard(null);
      setPartSourceRowIndex(null);
    } catch (err: any) {
      toast.error('Failed to save parts: ' + (err?.message || 'Error'));
    }
  };

  // ---------------- Popup Actions ----------------
  const handleCardClick = (cardId: string) => {
    setSelectedCards(new Set([cardId]));
    setIsModalOpen(true);
  };

  const handlePopupSuccess = (payload: ProcessDispatchPayload) => {
    const usedWeight = payload.weight || 0;
    const cardId = payload.itemId;

    // Deduct from Company Stock Cards
    let newStockCards = [...stockCards];
    const cardIndex = newStockCards.findIndex(c => c.id === cardId);
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

  const dispatchItems: ProcessDispatchItem[] = useMemo(() => {
    return stockCards
      .filter((card) => selectedCards.has(card.id))
      .map((card) => ({
        id: card.id,
        purity: card.purity,
        availableWeight: card.availableWeight,
        stamp: card.stamp,
        Stamp: card.stamp,
        description: card.description || card.design || '',
        design: card.design || card.description || '',
        designName: card.design || card.description || '',
      }));
  }, [stockCards, selectedCards]);

  // ---------------- Columns ----------------
  const activeEntries = entries.filter(e => e.status !== 'completed');
  
  // Rows are shown filtered; handlers work on the full list, so look rows up by id
  const rowIdx = (row: { id: string }) => entries.findIndex((e) => e.id === row.id);

  const columns: Column<CompanyRow>[] = [
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
            {item.stamp || '-'}
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
      key: 'karigar',
      header: 'Karigar',
      render: (item) => <span className="font-semibold text-amber-700">{item.karigar || (item as any).karigarName || (item as any).selectedKarigar || '-'}</span>,
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
            value={item.descriptionRaw !== undefined ? item.descriptionRaw : (item.description || (item as any).design || '')}
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
          <LossAlertBadge stage="company" given={item.netWeightGiven} purity={Number((item as any).purity) || 0} loss={item.loss || 0} />
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
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSaveToStock(rowIdx(item))}
            className="rounded-lg bg-[#785600] px-3 py-1 text-xs font-bold text-white transition-all hover:bg-[#5c4200] cursor-pointer"
            title="Save to Stock"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => handlePartRow(item, rowIdx(item))}
            className="rounded-lg border border-[#785600]/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-[#785600] transition-all hover:bg-amber-500/20 dark:bg-amber-900/30 dark:text-amber-400 cursor-pointer"
            title="Save Part & Keep Remaining"
          >
            Part
          </button>
        </div>
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
                Company Stock Available ({stockCards.length})
              </span>
            </div>
          </div>
          <div className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 flex gap-2 overflow-x-auto pb-2 pt-1">
            {stockCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setSelectedCards(new Set([card.id]));
                  setIsModalOpen(true);
                }}
                className="flex min-w-[140px] flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-3 shadow-sm transition-all hover:border-[#785600]/60 cursor-pointer dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[#1a1c1b] dark:text-slate-200">
                    Patla ({card.purity}%) {card.stamp ? `- ${card.stamp}` : ''}
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

      {/* ---------------- Table Section ---------------- */}
      {!showHistory && (
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
          Company Process
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
            <span>{showHistory ? 'Show Company' : 'History'}</span>
          </GenericButton>
      </div>
      )}

      {showHistory ? (
        <StageHistory stageName="Company" onBack={() => setShowHistory(false)} entries={entries.filter((e: any) => e.status === 'completed')} />
      ) : (
      <div className="border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="overflow-hidden">
          <GenericTable data={activeEntries} columns={columns} showSrNo={true} srNoLabel="Sr No." />
        </div>
      </div>
      )}

      {/* ---------------- Part Modal ---------------- */}
      <CompanyModal
        isOpen={isPartModalOpen}
        onClose={() => {
          setIsPartModalOpen(false);
          setSelectedPartCard(null);
          setPartSourceRowIndex(null);
        }}
        selectedCard={selectedPartCard}
        onSaveParts={handleSavePartsFromModal}
      />

      {/* ---------------- Popup ---------------- */}
      <ProcessDispatchPopup
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Company Process"
        items={dispatchItems}
        nextProcessOptions={['Press', 'Sutt', 'Wash']}
        onSuccess={handlePopupSuccess}
      />
    </div>
  );
};

export default CompanyProcess;
