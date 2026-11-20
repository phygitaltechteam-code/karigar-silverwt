import React, { useMemo, useState } from 'react';
import { getHistoryDefaultRange } from '@/utils/weekRangeUtils';
import { Search, Printer, ChevronRight } from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { formatTrack, formatTrackShort, trackOf } from '@/utils/processTrack';
import {
  useGetProcessAlert,
  checkProcessLossAlert,
  getProcessLossColorClass,
  type ProcessLossAlertResult,
} from '@/lib/api/alertmanagement';

/**
 * History table shared by the manufacturing stages.
 * Shows saved (completed) rows; rows sent together (parts of one batch) are merged
 * into one block, and every row shows its full process track.
 */

interface StageHistoryProps {
  stageName: string;
  entries: any[];
  /** Back to the stage's normal table */
  onBack?: () => void;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (v: unknown, decimals = 3) =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num(v));

// Field names differ slightly between stages; read whichever is present
const givenOf = (e: any) =>
  num(e.netWeightGiven ?? e.netWeight ?? e.grossWt ?? e.chainGiven ?? e.chainWeight);
const receivedOf = (e: any) =>
  num(e.netWeightReceived ?? e.receivedWeight ?? e.receivedWt ?? e.fineWeight);
const scrapOf = (e: any) => num(e.scrap ?? e.scrapWeight);
const lossOf = (e: any) => {
  if (e.loss !== undefined && e.loss !== null && e.loss !== '') return num(e.loss);
  if (e.increase !== undefined && e.increase !== null) return 0;
  return Math.max(0, Math.round((givenOf(e) - receivedOf(e) - scrapOf(e)) * 1000) / 1000);
};
// Same as the stage tables: rate is ₹/kg on the received weight (given if nothing received)
const amountOf = (e: any) => {
  const wt = receivedOf(e) > 0 ? receivedOf(e) : givenOf(e);
  return Math.round(((num(e.rate) * wt) / 1000) * 100) / 100;
};
const dateOf = (e: any): Date | null => {
  const d = new Date(e.completedAt || e.updatedAt || e.createdAt || e.dateTime || '');
  return isNaN(d.getTime()) ? null : d;
};
const designOf = (e: any) => e.design || e.designName || e.description || '';

interface Group {
  key: string;
  date: Date | null;
  purity: number;
  stamp: string;
  design: string;
  track: string[];
  rows: any[];
}

export const StageHistory: React.FC<StageHistoryProps> = ({ stageName, entries, onBack }) => {
  const [search, setSearch] = useState('');
  // Loss alert rules of this stage (Alert Management): expected loss vs actual loss
  const { data: alertRulesRaw } = useGetProcessAlert(stageName.toLowerCase());
  const alertRules: any[] = Array.isArray(alertRulesRaw)
    ? alertRulesRaw
    : Array.isArray((alertRulesRaw as any)?.data)
      ? (alertRulesRaw as any).data
      : [];
  const alertOf = (e: any): ProcessLossAlertResult | null =>
    checkProcessLossAlert(givenOf(e), num(e.purity), lossOf(e), alertRules, true);
  // Expected loss = rule loss scaled to the given weight + adjustment %; diff = actual - expected
  const expectedOf = (e: any): number | null => {
    const a = alertOf(e);
    return a ? a.maxAllowedLoss || a.baseLoss || 0 : null;
  };
  const diffOf = (e: any): number | null => {
    const x = expectedOf(e);
    return x === null ? null : Math.round((lossOf(e) - x) * 1000) / 1000;
  };
  // Opens on the last 7 days, like every stage's History
  const [fromDate, setFromDate] = useState<Date | null>(() => getHistoryDefaultRange().fromDate);
  const [toDate, setToDate] = useState<Date | null>(() => getHistoryDefaultRange().toDate);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => {
        const d = dateOf(e);
        if (fromDate && d && d < fromDate) return false;
        if (toDate && d && d > toDate) return false;
        if (!q) return true;
        return [
          e.karigar,
          e.stamp,
          e.Stamp,
          designOf(e),
          e.partNo,
          e.size,
          String(e.purity ?? ''),
          formatTrack(trackOf(e)),
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a, b) => (dateOf(b)?.getTime() || 0) - (dateOf(a)?.getTime() || 0));
  }, [entries, search, fromDate, toDate]);

  // Parts of one batch share batchId; everything else is its own block
  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    const order: Group[] = [];
    filtered.forEach((e) => {
      const key = e.batchId || e.id;
      if (!map.has(key)) {
        const g: Group = {
          key,
          date: dateOf(e),
          purity: num(e.purity),
          stamp: e.stamp || e.Stamp || '',
          design: designOf(e),
          track: trackOf(e),
          rows: [],
        };
        map.set(key, g);
        order.push(g);
      }
      map.get(key)!.rows.push(e);
    });
    return order;
  }, [filtered]);

  // Part column only when the rows shown actually have parts / batches
  const showPart = useMemo(
    () => filtered.some((e) => e.partNo) || groups.some((g) => g.rows.length > 1),
    [filtered, groups],
  );

  const totals = useMemo(
    () =>
      filtered.reduce(
        (t, e) => ({
          given: t.given + givenOf(e),
          received: t.received + receivedOf(e),
          scrap: t.scrap + scrapOf(e),
          loss: t.loss + lossOf(e),
          expected: t.expected + (expectedOf(e) ?? 0),
          diff: t.diff + (diffOf(e) ?? 0),
          amount: t.amount + amountOf(e),
        }),
        { given: 0, received: 0, scrap: 0, loss: 0, expected: 0, diff: 0, amount: 0 },
      ),
    [filtered, alertRules],
  );

  const printHistory = () => {
    const esc = (v: unknown) =>
      String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
    const rows = filtered
      .map((e) => {
        const d = dateOf(e);
        return `<tr><td>${d ? esc(d.toLocaleString('en-IN')) : '-'}</td><td>${fmt(e.purity, 2)}%</td><td>${esc(e.stamp || e.Stamp || '-')}</td><td>${esc(designOf(e) || '-')}</td><td>${esc(e.partNo ? `Part ${e.partNo}` : '-')}</td><td>${esc(e.karigar || '-')}</td><td>${fmt(givenOf(e))}</td><td>${fmt(receivedOf(e))}</td><td>${fmt(scrapOf(e))}</td><td>${expectedOf(e) !== null ? fmt(expectedOf(e)!) : '-'}</td><td>${fmt(lossOf(e))}</td><td>${diffOf(e) !== null ? `${diffOf(e)! > 0 ? '+' : ''}${fmt(diffOf(e)!)}` : '-'}</td><td>${fmt(amountOf(e), 2)}</td><td>${esc(formatTrack(trackOf(e)))}</td></tr>`;
      })
      .join('');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${esc(stageName)} History</title><style>
      body{font-family:sans-serif;padding:16px} h2{margin:0 0 8px} table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #ccc;padding:4px 6px;text-align:center} th{background:#785600;color:#fff}
      .t{margin:8px 0;font-size:12px}</style></head><body>
      <h2>${esc(stageName)} History</h2>
      <div class="t">Given: ${fmt(totals.given)} G &nbsp; Received: ${fmt(totals.received)} G &nbsp; Scrap: ${fmt(totals.scrap)} G &nbsp; Expected Loss: ${fmt(totals.expected)} G &nbsp; Actual Loss: ${fmt(totals.loss)} G &nbsp; Diff Loss: ${fmt(totals.diff)} G &nbsp; Amount: ₹ ${fmt(totals.amount, 2)}</div>
      <table><thead><tr><th>Date</th><th>Purity</th><th>Stamp</th><th>Design</th><th>Part</th><th>Karigar</th><th>Given (G)</th><th>Received (G)</th><th>Scrap (G)</th><th>Expected Loss (G)</th><th>Actual Loss (G)</th><th>Diff Loss (G)</th><th>Amount (₹)</th><th>Track</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="12">No entries</td></tr>'}</tbody></table></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const th =
    'px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap';
  const td =
    'border-b border-[#d3c4af]/20 px-3 py-2.5 text-center text-xs text-[#1a1c1b] dark:border-slate-800 dark:text-slate-200';

  return (
    <div className="flex flex-col gap-3">
      {/* Header (same layout as Galai History) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">{stageName} History</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-48 md:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              autoComplete="off"
              data-lpignore="true"
              type="search"
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <GenericWeeklyDatePicker
            id={`from-date-${stageName}`}
            placeholder="DD/MM/YYYY"
            mode="from"
            initialDates={fromDate ? [fromDate] : []}
            onDateChange={(dates) => {
              if (dates && dates.length > 0) {
                const d = new Date(dates[0]);
                d.setHours(0, 0, 0, 0);
                setFromDate(d);
              } else setFromDate(null);
            }}
            className="w-32 sm:w-36 md:w-40"
          />
          <GenericWeeklyDatePicker
            id={`to-date-${stageName}`}
            placeholder="DD/MM/YYYY"
            mode="to"
            initialDates={toDate ? [toDate] : []}
            onDateChange={(dates) => {
              if (dates && dates.length > 0) {
                const d = new Date(dates[0]);
                d.setHours(23, 59, 59, 999);
                setToDate(d);
              } else setToDate(null);
            }}
            className="w-32 sm:w-36 md:w-40"
          />
          <GenericButton type="button" size="sm" variant="primary" onClick={() => printHistory()}>
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </GenericButton>
          {onBack && (
            <GenericButton type="button" size="sm" variant="primary" onClick={onBack}>
              <ChevronRight className="h-4 w-4" />
              <span>Show {stageName}</span>
            </GenericButton>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {[
          ['Total Given', `${fmt(totals.given)} G`],
          ['Total Received', `${fmt(totals.received)} G`],
          ['Total Scrap', `${fmt(totals.scrap)} G`],
          ['Expected Loss', alertRules.length ? `${fmt(totals.expected)} G` : 'No alert rule'],
          ['Actual Loss', `${fmt(totals.loss)} G`],
          ['Diff Loss', alertRules.length ? `${totals.diff > 0 ? '+' : ''}${fmt(totals.diff)} G` : '-'],
          ['Total Amount', `₹ ${fmt(totals.amount, 2)}`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              {label}
            </div>
            <div className="mt-1 font-mono text-base font-bold text-[#1a1c1b] dark:text-white">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <table className="w-full min-w-[1300px] border-collapse">
          <thead className="bg-gradient-to-r from-[#785600] to-[#986d00]">
            <tr>
              <th className={th}>Date &amp; Time</th>
              <th className={th}>Purity %</th>
              <th className={th}>Stamp (शिक्का)</th>
              <th className={th}>Design / Description</th>
              {showPart && <th className={th}>Part</th>}
              <th className={th}>Karigar</th>
              <th className={th}>Given Wt (G)</th>
              <th className={th}>Received Wt (G)</th>
              <th className={th}>Scrap (G)</th>
              <th className={th}>Expected Loss (G)</th>
              <th className={th}>Actual Loss (G)</th>
              <th className={th}>Diff Loss (G)</th>
              <th className={th}>Amount (₹)</th>
              <th className={th}>Track</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={showPart ? 14 : 13} className="px-3 py-10 text-center text-sm text-[#4f4535] dark:text-slate-400">
                  No saved {stageName} entries yet.
                </td>
              </tr>
            ) : (
              groups.map((g) =>
                g.rows.map((e, i) => {
                  const span = g.rows.length;
                  const first = i === 0;
                  return (
                    <tr key={`${g.key}-${e.id || i}`} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40">
                      {first && (
                        <>
                          <td rowSpan={span} className={`${td} align-middle`}>
                            {g.date ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{g.date.toLocaleDateString('en-IN')}</span>
                                <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                                  {g.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td rowSpan={span} className={`${td} align-middle font-mono`}>
                            {fmt(g.purity, 2)}%
                          </td>
                          <td rowSpan={span} className={`${td} align-middle font-semibold`}>
                            {g.stamp || '-'}
                          </td>
                          <td rowSpan={span} className={`${td} align-middle`}>
                            {g.design || '-'}
                          </td>
                        </>
                      )}
                      {showPart && (
                        <td className={td}>{e.partNo ? `Part ${e.partNo}` : span > 1 ? `#${i + 1}` : '-'}</td>
                      )}
                      <td className={`${td} font-semibold text-amber-700`}>{e.karigar || '-'}</td>
                      <td className={`${td} font-mono`}>{fmt(givenOf(e))} G</td>
                      <td className={`${td} font-mono`}>{fmt(receivedOf(e))} G</td>
                      <td className={`${td} font-mono`}>{fmt(scrapOf(e))} G</td>
                      {(() => {
                        const alert = alertOf(e);
                        return (
                          <>
                            <td
                              className={`${td} font-mono text-gray-600 dark:text-slate-300`}
                              title={alert ? `Rule loss ${fmt(alert.baseLoss)} G + ${alert.adjustmentPercent}% adjustment` : 'No alert rule for this stage'}
                            >
                              {alert ? `${fmt(expectedOf(e)!)} G` : '-'}
                            </td>
                            <td
                              className={`${td} font-mono ${alert ? getProcessLossColorClass(alert) : 'text-red-600'}`}
                              title={alert?.isExceeded ? `${fmt(alert.diff)} G over the allowed loss` : undefined}
                            >
                              {fmt(lossOf(e))} G
                            </td>
                            {(() => {
                              const d = diffOf(e);
                              return (
                                <td className={`${td} font-mono font-semibold ${d === null ? 'text-gray-500' : d > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {d === null ? '-' : `${d > 0 ? '+' : ''}${fmt(d)} G`}
                                </td>
                              );
                            })()}
                          </>
                        );
                      })()}
                      <td className={`${td} font-mono`}>₹ {fmt(amountOf(e), 2)}</td>
                      {first &&
                        (() => {
                          const full = [...g.track, stageName].filter(
                            (s, idx, arr) => idx === 0 || arr[idx - 1] !== s,
                          );
                          return (
                            <td
                              rowSpan={span}
                              title={formatTrack(full)}
                              className={`${td} align-middle whitespace-nowrap text-[11px] font-semibold text-[#785600]`}
                            >
                              {formatTrackShort(full)}
                            </td>
                          );
                        })()}
                    </tr>
                  );
                }),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StageHistory;
