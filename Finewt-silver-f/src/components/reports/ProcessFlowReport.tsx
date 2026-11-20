import React, { useMemo } from 'react';
import { ArrowRight, GitBranch, Printer } from 'lucide-react';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { useGetGalaiHistory } from '@/lib/api/galai';
import { collectProcessFlow, FlowInputRow, ProcessFlowRow } from '@/utils/manufacturingStock';
import { PROCESS_TABS } from '@/components/erp/manufacturingprocess/processTabs';

/**
 * Process flow report: one row per manufacturing stage in flow order
 * (Galai → … → Packaging) for the chosen dates — weight given and received,
 * scrap, loss, loss %, fine loss and labour (rate) — plus a grand total.
 */
interface Props {
  fromDate: Date | null;
  toDate: Date | null;
  header?: any;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (v: unknown, d = 3) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: d }).format(num(v));
const money = (v: unknown) =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num(v))}`;
const escapeHtml = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ORDER = PROCESS_TABS.map((t) => t.name);

const ProcessFlowReport: React.FC<Props> = ({ fromDate, toDate, header }) => {
  const { data: galaiHistory = [] } = useGetGalaiHistory();

  const rows = useMemo<ProcessFlowRow[]>(() => {
    const galai: FlowInputRow[] = (Array.isArray(galaiHistory) ? galaiHistory : []).map((g: any) => ({
      createdAt: g.createdAt,
      completedAt: g.completedAt || g.updatedAt,
      purity: num(g.purity),
      given: num(g.grossWt ?? g.grossWeight),
      received: num(g.fineWeight),
      scrap: num(g.scrapWeight ?? g.scrap),
      loss: g.loss !== undefined && g.loss !== null ? num(g.loss) : undefined,
      rate: num(g.rate),
      karigar: g.karigarName || '',
    }));
    return collectProcessFlow(fromDate, toDate, galai).sort(
      (a, b) => ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage),
    );
  }, [galaiHistory, fromDate, toDate]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (acc, r) => ({
        count: acc.count + r.count,
        scrap: acc.scrap + r.scrap,
        loss: acc.loss + r.loss,
        fineLoss: acc.fineLoss + r.fineLoss,
        labour: acc.labour + r.labour,
      }),
      { count: 0, scrap: 0, loss: 0, fineLoss: 0, labour: 0 },
    );
    // Silver into the flow = Galai given; out = packed weight
    const input = rows.find((r) => r.stage === 'Galai')?.given || 0;
    const packed = rows.find((r) => r.stage === 'Packaging')?.received || 0;
    return { ...t, input, packed };
  }, [rows]);

  const columns: Column<ProcessFlowRow & { id: string }>[] = [
    {
      key: 'stage',
      header: 'Process',
      align: 'left',
      render: (r) => {
        const tab = PROCESS_TABS.find((t) => t.name === r.stage);
        return (
          <span className="flex items-center gap-1.5 font-bold text-[#785600] dark:text-amber-400">
            {tab && <tab.Icon className="h-4 w-4" />}
            {r.stage}
          </span>
        );
      },
    },
    { key: 'count', header: 'Entries', render: (r) => <span className="font-mono">{r.count}</span> },
    { key: 'given', header: 'Given (G)', render: (r) => <span className="font-mono">{fmt(r.given)}</span> },
    { key: 'received', header: 'Received (G)', render: (r) => <span className="font-mono">{fmt(r.received)}</span> },
    { key: 'scrap', header: 'Scrap (G)', render: (r) => <span className="font-mono">{fmt(r.scrap)}</span> },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (r) => <span className="font-mono font-semibold text-red-700 dark:text-red-400">{fmt(r.loss)}</span>,
    },
    {
      key: 'lossPct',
      header: 'Loss %',
      render: (r) => <span className="font-mono">{r.lossPct.toFixed(2)}%</span>,
    },
    { key: 'fineLoss', header: 'Fine Loss (G)', render: (r) => <span className="font-mono">{fmt(r.fineLoss)}</span> },
    {
      key: 'avgRate',
      header: 'Avg Rate (₹/kg)',
      render: (r) => <span className="font-mono">{r.avgRate > 0 ? money(r.avgRate) : '-'}</span>,
    },
    {
      key: 'labour',
      header: 'Labour (₹)',
      render: (r) => <span className="font-mono font-semibold">{r.labour > 0 ? money(r.labour) : '-'}</span>,
    },
    {
      key: 'karigars',
      header: 'Karigars',
      align: 'left',
      render: (r) => (
        <span className="text-xs text-[#4f4535] dark:text-slate-300">{r.karigars.join(', ') || '-'}</span>
      ),
    },
  ];

  const handlePrint = () => {
    const period = `${fromDate ? fromDate.toLocaleDateString('en-IN') : 'Start'} to ${toDate ? toDate.toLocaleDateString('en-IN') : 'Today'}`;
    const factory = header?.factoryName || 'Manufacturing';
    const td = (v: unknown, align = 'right') =>
      `<td style="border:1px solid #333;padding:4px 6px;text-align:${align};font-size:11px;">${escapeHtml(v)}</td>`;
    const body = rows
      .map(
        (r) =>
          `<tr>${td(r.stage, 'left')}${td(r.count)}${td(fmt(r.given))}${td(fmt(r.received))}${td(fmt(r.scrap))}${td(fmt(r.loss))}${td(`${r.lossPct.toFixed(2)}%`)}${td(fmt(r.fineLoss))}${td(r.avgRate > 0 ? money(r.avgRate) : '-')}${td(r.labour > 0 ? money(r.labour) : '-')}${td(r.karigars.join(', ') || '-', 'left')}</tr>`,
      )
      .join('');
    const th = (h: string) =>
      `<th style="border:1px solid #333;padding:5px 6px;font-size:11px;background:#f7f3ea;">${h}</th>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Process Flow Report</title>
<style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial,sans-serif;color:#000}table{width:100%;border-collapse:collapse}</style></head><body>
<h2 style="text-align:center;margin:0;color:#785600;">${escapeHtml(factory)}</h2>
<h3 style="text-align:center;margin:4px 0;">Process Flow Report (Galai → Packaging)</h3>
<p style="text-align:center;font-size:11px;margin:0 0 10px;">${escapeHtml(period)}</p>
<table><thead><tr>${['Process', 'Entries', 'Given (G)', 'Received (G)', 'Scrap (G)', 'Loss (G)', 'Loss %', 'Fine Loss (G)', 'Avg Rate (₹/kg)', 'Labour (₹)', 'Karigars'].map(th).join('')}</tr></thead>
<tbody>${body}<tr style="font-weight:bold;">${td('TOTAL', 'left')}${td(totals.count)}${td('')}${td('')}${td(fmt(totals.scrap))}${td(fmt(totals.loss))}${td('')}${td(fmt(totals.fineLoss))}${td('')}${td(money(totals.labour))}${td('')}</tr></tbody></table>
<p style="font-size:11px;margin-top:10px;">Silver into Galai: <b>${fmt(totals.input)} G</b> · Packed: <b>${fmt(totals.packed)} G</b> · Total scrap: <b>${fmt(totals.scrap)} G</b> · Total loss: <b>${fmt(totals.loss)} G</b></p>
</body></html>`;
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) return frame.remove();
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1000);
    }, 250);
  };

  const cards: [string, string][] = [
    ['Silver into Galai', `${fmt(totals.input)} G`],
    ['Packed (Product)', `${fmt(totals.packed)} G`],
    ['Total Scrap', `${fmt(totals.scrap)} G`],
    ['Total Loss', `${fmt(totals.loss)} G`],
    ['Fine Loss', `${fmt(totals.fineLoss)} G`],
    ['Total Labour', money(totals.labour)],
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <GitBranch className="h-5 w-5 shrink-0 text-[#785600] dark:text-amber-400" />
          <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">Process Flow</h3>
          <span className="hidden items-center gap-1 text-xs text-[#817563] sm:flex dark:text-slate-400">
            Galai <ArrowRight className="h-3 w-3" /> Packaging · loss, scrap and rate per process
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200]"
        >
          <Printer className="h-4 w-4" />
          Print Flow
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <span className="block text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              {label}
            </span>
            <span className="text-lg font-bold text-black dark:text-white">{value}</span>
          </div>
        ))}
      </div>

      <div className="-mx-3 sm:-mx-4 md:mx-0">
        <GenericTable<ProcessFlowRow & { id: string }>
          data={rows.map((r) => ({ ...r, id: r.stage }))}
          columns={columns}
          showSrNo={true}
          srNoLabel="Sr No."
          pagination={false}
          emptyMessage="No completed process entries in this period."
        />
      </div>
    </div>
  );
};

export default ProcessFlowReport;
