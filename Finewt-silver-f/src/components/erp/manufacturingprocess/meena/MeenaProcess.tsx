import { exceedsGiven } from '../shared/weightGuard';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import StageHistory from '../shared/StageHistory';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { RotateCcw, Flame, Scale, CheckCircle2, Package, Search, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import ScaleWeightField from '@/components/common/ScaleWeightField';
import ProcessDispatchPopup, {
  ProcessDispatchItem,
  ProcessDispatchPayload,
} from '../shared/ProcessDispatchPopup';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface MeenaEntry {
  id: string;
  srNo: number;
  dateTime: string;
  purity: number;
  stamp: string;
  design?: string;
  size?: string;
  sizeRaw?: string;
  qty?: string | number;
  qtyRaw?: string;
  description?: string;
  descriptionRaw?: string;
  netWeight: number;
  karigar: string;
  receivedWeight: number;
  scrap: number;
  increase: number;
  rate: number;
  receivedWeightRaw?: string;
  scrapRaw?: string;
  increaseRaw?: string;
  rateRaw?: string;
  karigarRaw?: string;
  isSaved?: boolean;
  isDirty?: boolean;
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

const formatNumberDisplay = (v: unknown): string =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(toNumber(v));

const formatPurityDisplay = (v: unknown): string => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

const formatDate = (iso: string) => {
  if (!iso) return { date: '-', time: '-' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

// ------------------------------------------------------------------
// Demo data
// ------------------------------------------------------------------
const DEFAULT_MEENA_ENTRIES: MeenaEntry[] = [];

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
const MeenaProcess: React.FC = () => {
  const [entries, setEntries] = useState<MeenaEntry[]>(DEFAULT_MEENA_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<MeenaEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chain_meena_process_entries_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map((e: MeenaEntry, idx: number) => ({
            ...e,
            design: e.design || '',
            size: e.size || '',
            qty: e.qty !== undefined && e.qty !== '' ? e.qty : '',
            description: e.description || '',
          }));
          setEntries(sanitized);
        }
      }
    } catch (e) { }
  }, []);

  const saveEntries = useCallback((updated: MeenaEntry[]) => {
    setEntries(updated);
    try { localStorage.setItem('chain_meena_process_entries_v2', JSON.stringify(updated)); } catch (e) { }
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    const term = searchTerm.toLowerCase().trim();
    return entries.filter(
      (e) =>
        (e.design || '').toLowerCase().includes(term) ||
        (e.stamp || '').toLowerCase().includes(term) ||
        (e.description || '').toLowerCase().includes(term) ||
        (e.karigar || '').toLowerCase().includes(term) ||
        (e.size || '').toLowerCase().includes(term) ||
        String(e.qty || '').toLowerCase().includes(term) ||
        String(e.purity || '').includes(term) ||
        String(e.netWeight || '').includes(term),
    );
  }, [entries, searchTerm]);

  // ---------------- Inline change ----------------
  const handleInlineChange = (
    index: number,
    field: keyof MeenaEntry,
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((entry, i) => {
        if (i !== index) return entry;
        const updated: MeenaEntry = { ...entry };

        if (field === 'karigar') {
          updated.karigar = value;
          updated.karigarRaw = value;
        } else if ((field as string) === 'stamp') {
          (updated as any).stamp = value;
          (updated as any).Stamp = value;
        } else if (field === 'description') {
          updated.description = value;
          updated.descriptionRaw = value;
        } else if (field === 'size') {
          updated.size = value;
          updated.sizeRaw = value;
        } else if (field === 'qty') {
          updated.qty = parseInt(value, 10) || 0;
          updated.qtyRaw = value;
        } else if (field === 'receivedWeight') {
          updated.receivedWeightRaw = value;
          updated.receivedWeight =
            value === '' || value === '.' ? 0 : toNumber(value);
          if (exceedsGiven(updated.netWeight, updated.receivedWeight, 0, updated.increase)) return entry;
          const autoScrap = Math.max(
            0,
            Math.round((updated.netWeight - updated.receivedWeight) * 1000) /
            1000,
          );
          updated.scrap = autoScrap;
          updated.scrapRaw = autoScrap > 0 ? String(autoScrap) : '';
        } else if (field === 'scrap') {
          updated.scrapRaw = value;
          updated.scrap = value === '' || value === '.' ? 0 : toNumber(value);
          if (exceedsGiven(updated.netWeight, updated.receivedWeight, updated.scrap, updated.increase)) return entry;
        } else if (field === 'increase') {
          updated.increaseRaw = value;
          updated.increase =
            value === '' || value === '.' ? 0 : toNumber(value);
        } else if (field === 'rate') {
          updated.rateRaw = value;
          updated.rate = value === '' || value === '.' ? 0 : toNumber(value);
        }

        updated.isDirty = true;
        return updated;
      }),
    );
  };

  // ---------------- Open Proceed popup ----------------
  const openProceedPopup = (entry: MeenaEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  // ---------------- Dispatch Handler ----------------
  const handlePopupSuccess = (payload: ProcessDispatchPayload) => {
    if (!selectedEntry) return;
    const usesReceived = !!(selectedEntry.receivedWeight && selectedEntry.receivedWeight > 0);
    const available = usesReceived ? selectedEntry.receivedWeight : selectedEntry.netWeight;
    const sent = Math.min(Number(payload.weight) || 0, available);
    const remaining = Math.max(0, Math.round((available - sent) * 1000) / 1000);

    let updated: MeenaEntry[];
    if (remaining > 0) {
      // Part sent: the sent part goes to History, the rest stays in the table
      const sentPart: MeenaEntry = {
        ...selectedEntry,
        id: `${selectedEntry.id}-sent-${Date.now()}`,
        ...(usesReceived ? { receivedWeight: sent } : { netWeight: sent }),
        isSaved: true,
      };
      updated = entries.flatMap((e) =>
        e.id === selectedEntry.id
          ? [
              sentPart,
              {
                ...e,
                ...(usesReceived
                  ? { receivedWeight: remaining, receivedWeightRaw: String(remaining) }
                  : { netWeight: remaining }),
              },
            ]
          : [e],
      );
      toast.success(`${sent} G sent. ${remaining} G kept in Meena.`);
    } else {
      updated = entries.map((e) => (e.id === selectedEntry.id ? { ...e, isSaved: true } : e));
    }
    saveEntries(updated);
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const dispatchItems: ProcessDispatchItem[] = useMemo(() => {
    if (!selectedEntry) return [];
    const avail = (selectedEntry.receivedWeight && selectedEntry.receivedWeight > 0)
      ? selectedEntry.receivedWeight
      : selectedEntry.netWeight;

    return [
      {
        id: selectedEntry.id,
        purity: selectedEntry.purity,
        availableWeight: avail,
        stamp: selectedEntry.stamp,
        Stamp: selectedEntry.stamp,
        designName: selectedEntry.design || selectedEntry.description || '',
        design: selectedEntry.design || selectedEntry.description || '',
        description: selectedEntry.description || selectedEntry.design || '',
        size: selectedEntry.size || '',
        qty: selectedEntry.qty || '',
      },
    ];
  }, [selectedEntry]);

  // ---------------- Columns ----------------
  // Rows are shown filtered; handlers work on the full list, so look rows up by id
  const rowIdx = (row: { id: string }) => entries.findIndex((e) => e.id === row.id);

  const columns: Column<MeenaEntry>[] = useMemo(
    () => [
      {
        key: 'srNo',
        header: 'Sr No',
        render: (item) => (
          <span className="text-sm text-[#1a1c1b] dark:text-white">
            {item.srNo}
          </span>
        ),
      },
      {
        key: 'dateTime',
        header: 'Date & Time',
        render: (item) => {
          const { date, time } = formatDate(item.dateTime);
          return (
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                {date}
              </span>
              <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                {time}
              </span>
            </div>
          );
        },
      },
      {
        key: 'design',
        header: 'Design (डिझाइन)',
        render: (item) => (
          <span className="text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {item.design || item.description || '-'}
          </span>
        ),
      },
      {
        key: 'size',
        header: 'Size',
        render: (item) => (
          <span className="text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {item.size || '-'}
          </span>
        ),
      },
      {
        key: 'qty',
        header: 'Qty',
        render: (item) => (
          <span className="font-mono text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {item.qty !== undefined && item.qty !== '' ? item.qty : '-'}
          </span>
        ),
      },
      {
        key: 'purity',
        header: 'Purity %',
        render: (item) => (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatPurityDisplay(item.purity)}%
          </span>
        ),
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
        key: 'netWeight',
        header: 'Net Wt (G)',
        render: (item) => (
          <span className="font-mono text-sm font-semibold text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.netWeight)} G
          </span>
        ),
      },
      {
        key: 'description',
        header: 'Description (तपशील)',
        render: (item, index) => (
          <div className="inline-block w-40 min-w-[140px]">
            <GenericInputField
              name={`meenaDescription-${index}`}
              type="text"
              value={item.descriptionRaw !== undefined ? item.descriptionRaw : item.description || ''}
              onChange={(e) =>
                handleInlineChange(rowIdx(item), 'description', e.target.value)
              }
              placeholder="Description (तपशील)"
              compact
              className="text-xs"
            />
          </div>
        ),
      },
      {
        key: 'karigar',
        header: 'Karigar',
        render: (item) => (
          <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
            {item.karigar || 'Self'}
          </span>
        ),
      },
      {
        key: 'receivedWeight',
        header: 'Received Wt (G)',
        render: (item, index) => (
          <div className="inline-block w-28">
            <ScaleWeightField
              onScaleWeight={(w) => handleInlineChange(rowIdx(item), 'receivedWeight', String(w))}
              name={`meenaReceived-${index}`}
              type="text"
              inputMode="decimal"
              decimalScale={3}
              value={
                item.receivedWeightRaw !== undefined
                  ? item.receivedWeightRaw
                  : item.receivedWeight === 0
                    ? ''
                    : item.receivedWeight
              }
              onChange={(e) =>
                handleInlineChange(rowIdx(item), 'receivedWeight', e.target.value)
              }
              placeholder="0.000"
              suffix="G"
              compact
              className="font-mono text-center"
            />
          </div>
        ),
      },
      {
        key: 'scrap',
        header: 'Scrap (G)',
        render: (item, index) => (
          <div className="inline-block w-24">
            <GenericInputField
              name={`meenaScrap-${index}`}
              type="text"
              inputMode="decimal"
              decimalScale={3}
              value={
                item.scrapRaw !== undefined
                  ? item.scrapRaw
                  : item.scrap === 0
                    ? ''
                    : item.scrap
              }
              onChange={(e) =>
                handleInlineChange(rowIdx(item), 'scrap', e.target.value)
              }
              placeholder="0.000"
              suffix="G"
              compact
              className="font-mono text-center"
            />
          </div>
        ),
      },
      {
        key: 'increase',
        header: 'Increase (G)',
        render: (item, index) => (
          <div className="inline-block w-24">
            <GenericInputField
              name={`meenaIncrease-${index}`}
              type="text"
              inputMode="decimal"
              decimalScale={3}
              value={
                item.increaseRaw !== undefined
                  ? item.increaseRaw
                  : item.increase === 0
                    ? ''
                    : item.increase
              }
              onChange={(e) =>
                handleInlineChange(rowIdx(item), 'increase', e.target.value)
              }
              placeholder="0.000"
              suffix="G"
              compact
              className="font-mono text-center"
            />
          </div>
        ),
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
        key: 'action',
        header: 'Action',
        render: (item: MeenaEntry) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => openProceedPopup(item)}
              className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-[#785600] px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#5c4200] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 cursor-pointer"
              title="Save"
            >
              Save
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries],
  );

  // Active entries for stock cards
  const activeEntries = useMemo(() => entries.filter(e => !e.isSaved), [entries]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Stock Cards */}
      {activeEntries.length > 0 && (
        <div className="w-full">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Package className="h-4 w-4 text-[#785600] dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Meena Stock ({activeEntries.length})
            </span>
          </div>
          <div className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 flex gap-2 overflow-x-auto pb-2 pt-1">
            {activeEntries.map((entry) => {
              const fullTitle = `${entry.design || entry.description || 'Meena'} (${formatPurityDisplay(entry.purity)}%) ${entry.stamp ? `- ${entry.stamp}` : ''} | Wt: ${formatNumberDisplay(entry.netWeight)}G | Size: ${entry.size || '-'} | Qty: ${entry.qty || '-'}`;
              return (
                <button
                  key={entry.id}
                  type="button"
                  title={fullTitle}
                  onClick={() => openProceedPopup(entry)}
                  className="flex min-w-[150px] flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-3 shadow-sm transition-all hover:border-[#785600]/60 cursor-pointer dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#1a1c1b] dark:text-slate-200 truncate max-w-[200px]" title={fullTitle}>
                      {entry.design || entry.description || 'Meena'} ({formatPurityDisplay(entry.purity)}%) {entry.stamp ? `- ${entry.stamp}` : ''}
                    </span>
                    {entry.sourceProcess && (
                      <span className="text-[10px] font-bold text-[#785600] bg-amber-500/10 px-1.5 py-0.5 rounded uppercase dark:text-amber-400 shrink-0">
                        From: {entry.sourceProcess}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm font-bold text-black dark:text-white">
                      {formatNumberDisplay(entry.netWeight)} G
                    </span>
                    {entry.qty !== undefined && entry.qty !== null && entry.qty !== '' && (
                      <span className="text-xs font-semibold text-[#785600] dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                        {entry.qty} Pcs
                      </span>
                    )}
                    {entry.size && (
                      <span className="text-xs text-gray-500 font-medium">
                        ({entry.size})
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header with Title and Search Bar */}
      {!showHistory && (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-[#785600] dark:text-amber-400" />
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            Meena Department
          </h2>
        </div>
        <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          <div className="relative order-last w-full sm:order-none sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              autoComplete="off"
              data-lpignore="true"
              type="search"
              placeholder="Search design, stamp, desc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-xs text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
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
            <span>{showHistory ? 'Show Meena' : 'History'}</span>
          </GenericButton>
        </div>
      </div>
      )}

      {/* Table */}
      {showHistory ? (
        <StageHistory stageName="Meena" onBack={() => setShowHistory(false)} entries={entries.filter((e: any) => e.isSaved)} />
      ) : (
      <div className="border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="overflow-hidden">
          <GenericTable<MeenaEntry>
            data={filteredEntries}
            columns={columns}
            emptyMessage={
              searchTerm
                ? `No Meena records found matching "${searchTerm}"`
                : 'No Meena entries found.'
            }
            showSrNo={false}
          />
        </div>
      </div>
      )}

      {/* Process Dispatch Popup */}
      <ProcessDispatchPopup
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
        }}
        title="Meena Process"
        items={dispatchItems}
        nextProcessOptions={['Vibrator', 'Tass', 'Polishing', 'Stock']}
        showDesign={true}
        onSuccess={handlePopupSuccess}
      />
    </div>
  );
};

export default MeenaProcess;