import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ProductCodes from '@/components/common/ProductCodes';
import { ChevronDown, ChevronRight, Package, Printer, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import StageHistory from '../shared/StageHistory';
import { extendTrack, formatTrack, trackOf } from '@/utils/processTrack';
import { finishedToStockApi } from '@/lib/api/manufacturing';
import { useQueryClient } from '@tanstack/react-query';
import { useGetStock } from '@/lib/api/stock';
import { useGetSizes } from '@/lib/api/sizes';
import { useGetHeader } from '@/lib/api/headerapi';
import { useScaleFocus } from '@/lib/hooks/useScaleFocus';

/**
 * Packaging: last stage. Items arrive here from Stocks → Loose Stock ("Send to
 * Packaging") or from older stage sends, and show as cards. Click a card, enter the
 * weight to pack (and any wastage), then Save & Print: the packed weight becomes a
 * Product in Stock with its own product ID, a packing slip prints, and the pack is
 * listed in the Packed table. Any weight left stays on the card.
 */
const STORAGE_KEY = 'chain_packaging_entries_v2';
/** Wastage per pack (Stock rows do not store it), keyed by the product's stock id */
const PACKS_KEY = 'chain_packaging_packs_v1';

interface PackagingRow {
  id: string;
  createdAt?: string;
  dateTime?: string;
  purity: number;
  stamp?: string;
  Stamp?: string;
  design?: string;
  designName?: string;
  description?: string;
  size?: string;
  qty?: string | number;
  grossWt?: number;
  netWeight?: number;
  karigar?: string;
  processTrack?: string[];
  sourceProcess?: string;
  status?: string;
  completedAt?: string;
  productCode?: string;
  looseStockId?: string;
}

interface PackRecord {
  stockId: string;
  productCode: string;
  packedWeight: number;
  wastage: number;
  /** Weight the pack was taken from (pack + wastage) */
  baseWeight: number;
  packedAt: string;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const fmt = (v: unknown) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(num(v));
const weightOf = (r: PackagingRow) => num(r.netWeight ?? r.grossWt);
const designOf = (r: PackagingRow) => r.design || r.designName || r.description || '';
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

const readPacks = (): PackRecord[] => {
  try {
    const list = JSON.parse(localStorage.getItem(PACKS_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const escapeHtml = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Print an A5 packing slip in a hidden frame (no new window) */
function printPackingSlip(
  header: any,
  slip: {
    productCode: string;
    design: string;
    stamp: string;
    size: string;
    qty: string;
    purity: number;
    packedWeight: number;
    wastage: number;
    baseWeight: number;
    track: string[];
  },
) {
  const now = new Date();
  const factoryName = header?.factoryName || 'Packing Slip';
  const phones = header?.phoneNumbers || '';
  const fine = r3((slip.packedWeight * slip.purity) / 100);
  const rows: [string, string][] = [
    ['Product ID', slip.productCode || '-'],
    ['Design', slip.design || '-'],
    ['Stamp', slip.stamp || '-'],
    ['Size', slip.size || '-'],
    ['Qty', slip.qty || '-'],
    ['Purity', `${fmt(slip.purity)} %`],
    ['Packed Weight', `${fmt(slip.packedWeight)} G`],
    ['Fine Weight', `${fmt(fine)} G`],
    ['Wastage', `${fmt(slip.wastage)} G (${pct(slip.wastage, slip.baseWeight).toFixed(2)} %)`],
    ['Process Track', formatTrack(slip.track)],
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Packing Slip ${escapeHtml(slip.productCode)}</title>
<style>
  @page { size: A5; margin: 10mm; }
  body { font-family: Arial, sans-serif; color: #000; margin: 0; }
  .head { text-align: center; border-bottom: 2px solid #785600; padding-bottom: 6px; margin-bottom: 10px; }
  .head h1 { margin: 0; font-size: 20px; color: #785600; }
  .head p { margin: 2px 0 0; font-size: 11px; }
  h2 { text-align: center; font-size: 15px; margin: 6px 0 10px; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  td { border: 1px solid #333; padding: 6px 8px; }
  td:first-child { width: 38%; font-weight: bold; background: #f7f3ea; }
  .foot { margin-top: 28px; display: flex; justify-content: space-between; font-size: 11px; }
</style></head><body>
  <div class="head"><h1>${escapeHtml(factoryName)}</h1>${phones ? `<p>${escapeHtml(phones)}</p>` : ''}</div>
  <h2>PACKING SLIP</h2>
  <p style="font-size:11px;margin:0 0 8px;">Date: ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
  <table>${rows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
  <div class="foot"><span>Packed By</span><span>Checked By</span></div>
</body></html>`;

  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  }, 250);
}

const PackagingProcess: React.FC = () => {
  const [entries, setEntries] = useState<PackagingRow[]>([]);
  const [packs, setPacks] = useState<PackRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { data: stockData } = useGetStock();
  const { data: sizesData = [] } = useGetSizes();
  const { data: headerRes } = useGetHeader();
  const header = (headerRes as any)?.data?.data || (headerRes as any)?.data || headerRes || {};

  // Pack popup
  const [packCard, setPackCard] = useState<PackagingRow | null>(null);
  const [packWt, setPackWt] = useState('');
  const [wastageWt, setWastageWt] = useState('');
  const [isPacking, setIsPacking] = useState(false);
  // Weighing machine fills the pack weight while that field is focused
  const packScale = useScaleFocus((w) => setPackWt(String(r3(w))));

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setEntries(Array.isArray(list) ? list : []);
    } catch {
      setEntries([]);
    }
    setPacks(readPacks());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = (list: PackagingRow[]) => {
    setEntries(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // storage unavailable
    }
  };

  const savePacks = (list: PackRecord[]) => {
    setPacks(list);
    try {
      localStorage.setItem(PACKS_KEY, JSON.stringify(list));
    } catch {
      // storage unavailable
    }
  };

  const openPack = (card: PackagingRow) => {
    setPackCard(card);
    setPackWt(String(weightOf(card)));
    setWastageWt('');
  };

  const closePack = () => {
    if (isPacking) return;
    setPackCard(null);
  };

  const available = packCard ? weightOf(packCard) : 0;
  const packNum = r3(num(packWt));
  const wastageNum = r3(num(wastageWt));
  const remaining = Math.max(0, r3(available - packNum - wastageNum));
  const wastagePct = pct(wastageNum, packNum + wastageNum);

  const handleSaveAndPrint = async () => {
    if (!packCard) return;
    const designName = designOf(packCard).trim();
    if (!designName) {
      toast.error('This item has no design. Add a design before packing.');
      return;
    }
    if (packNum <= 0) {
      toast.error('Enter the weight to pack.');
      return;
    }
    if (packNum + wastageNum > available + 0.0005) {
      toast.error(`Pack + wastage cannot be more than ${fmt(available)} G.`);
      return;
    }

    const track = extendTrack(trackOf(packCard), 'Packaging');
    setIsPacking(true);
    let stockId = '';
    let productCode = '';
    try {
      // The packed weight goes into Stock as a Product (item = design name) with its own product ID
      const created: any = await finishedToStockApi({
        designName,
        size: packCard.size ? String(packCard.size) : undefined,
        stamp: packCard.stamp || packCard.Stamp || undefined,
        purity: Number(packCard.purity) || 0,
        weight: packNum,
        sourceProcess: 'Packaging',
        processTrack: track,
        kind: 'PRODUCT',
      });
      stockId = created?.id ? String(created.id) : '';
      if (stockId) productCode = `PRD-${stockId.slice(0, 8).toUpperCase()}`;
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add to Stock');
      setIsPacking(false);
      return;
    }

    // Card keeps what is left; it moves to History once nothing is left
    const done = remaining <= 0.0005;
    save(
      entries.map((e) =>
        e.id === packCard.id
          ? {
              ...e,
              netWeight: remaining,
              grossWt: remaining,
              processTrack: track,
              productCode,
              ...(done ? { status: 'completed', completedAt: new Date().toISOString() } : {}),
            }
          : e,
      ),
    );
    if (stockId) {
      savePacks([
        {
          stockId,
          productCode,
          packedWeight: packNum,
          wastage: wastageNum,
          baseWeight: r3(packNum + wastageNum),
          packedAt: new Date().toISOString(),
        },
        ...readPacks(),
      ]);
    }

    printPackingSlip(header, {
      productCode,
      design: designName,
      stamp: packCard.stamp || packCard.Stamp || '',
      size: packCard.size ? String(packCard.size) : '',
      qty: packCard.qty !== undefined && packCard.qty !== '' ? String(packCard.qty) : '',
      purity: Number(packCard.purity) || 0,
      packedWeight: packNum,
      wastage: wastageNum,
      baseWeight: r3(packNum + wastageNum),
      track,
    });

    toast.success(
      `Packed ${fmt(packNum)} G${productCode ? ` · ${productCode}` : ''} added to Stock → Product.` +
        (done ? '' : ` ${fmt(remaining)} G left on the card.`),
    );
    setIsPacking(false);
    setPackCard(null);
  };

  const matches = (values: unknown[]) => {
    const q = searchTerm.trim().toLowerCase();
    return !q || values.filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  };

  const pending = useMemo(
    () =>
      entries
        .filter((e) => e.status !== 'completed' && weightOf(e) > 0.0005)
        .filter((e) => matches([e.design, e.designName, e.description, e.stamp, e.size, String(e.purity)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, searchTerm],
  );

  // Packed products come from Stock (kind PRODUCT): each row is one pack with its own product ID
  const packed = useMemo(() => {
    const list: any[] = Array.isArray(stockData)
      ? stockData
      : (stockData as any)?.data || (stockData as any)?.stocks || [];
    const sizes: any[] = Array.isArray(sizesData) ? sizesData : (sizesData as any)?.data || [];
    const packById = new Map(packs.map((p) => [p.stockId, p]));
    return list
      .filter((p) => p.kind === 'PRODUCT')
      .map((p) => {
        const rec = packById.get(String(p.id));
        const packedWeight = num(p.packedWeight ?? p.weight);
        return {
          id: p.id,
          productCode: `PRD-${String(p.id).slice(0, 8).toUpperCase()}`,
          createdAt: p.createdAt,
          completedAt: p.createdAt,
          design: p.design || p.item?.name || '',
          stamp: p.stamp || '',
          size: sizes.find((z) => z.id === p.sizeId)?.size || p.size?.size || '',
          purity: num(p.purity ?? 100),
          netWeight: packedWeight,
          wastage: rec ? rec.wastage : undefined,
          wastagePct: rec ? pct(rec.wastage, rec.baseWeight || packedWeight + rec.wastage) : undefined,
        };
      })
      .filter((e) => matches([e.productCode, e.design, e.stamp, e.size, String(e.purity)]))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockData, sizesData, packs, searchTerm]);

  const packedColumns: Column<any>[] = [
    {
      key: 'completedAt',
      header: 'Packed On',
      render: (item) => {
        const d = new Date(item.completedAt || item.createdAt || '');
        return isNaN(d.getTime()) ? (
          '-'
        ) : (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{d.toLocaleDateString('en-IN')}</span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'productCode',
      header: 'Product ID',
      render: (item) =>
        item.productCode ? (
          <ProductCodes code={item.productCode} barcodeHeight={26} />
        ) : (
          <span className="text-xs text-[#817563]">-</span>
        ),
    },
    {
      key: 'design',
      header: 'Design (डिझाइन)',
      render: (item) => <span className="text-sm">{item.design || '-'}</span>,
    },
    {
      key: 'stamp',
      header: 'Stamp (शिक्का)',
      render: (item) => <span className="text-sm">{item.stamp || '-'}</span>,
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => <span className="text-sm">{item.size || '-'}</span>,
    },
    {
      key: 'purity',
      header: 'Purity %',
      render: (item) => <span className="font-mono text-sm">{fmt(item.purity)}%</span>,
    },
    {
      key: 'netWeight',
      header: 'Weight (G)',
      render: (item) => <span className="font-mono text-sm font-semibold">{fmt(item.netWeight)} G</span>,
    },
    {
      key: 'wastage',
      header: 'Wastage (G)',
      render: (item) =>
        item.wastage === undefined ? (
          <span className="text-xs text-[#817563]">-</span>
        ) : (
          <span className="font-mono text-sm">{fmt(item.wastage)} G</span>
        ),
    },
    {
      key: 'wastagePct',
      header: 'Wastage %',
      render: (item) =>
        item.wastagePct === undefined ? (
          <span className="text-xs text-[#817563]">-</span>
        ) : (
          <span
            className={`font-mono text-sm font-semibold ${item.wastagePct > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
          >
            {item.wastagePct.toFixed(2)}%
          </span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {showHistory ? (
        <StageHistory
          stageName="Packaging"
          onBack={() => setShowHistory(false)}
          entries={entries.filter((e) => e.status === 'completed')}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#785600] dark:text-amber-400" />
              <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">Packaging Process</h2>
            </div>
            <div className="contents sm:flex sm:items-center sm:gap-2">
              <div className="relative order-last w-full sm:order-none sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                <input
                  autoComplete="off"
                  data-lpignore="true"
                  type="search"
                  placeholder="Search design, stamp, size..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-xs text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <GenericButton
                type="button"
                size="sm"
                variant="primary"
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-1.5"
              >
                {showHistory ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span>History</span>
              </GenericButton>
            </div>
          </div>

          {/* Items waiting to be packed: click a card to pack */}
          <div className="w-full">
            <div className="mb-2 flex items-center gap-2 px-1">
              <Package className="h-4 w-4 text-[#785600] dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Ready to Pack ({pending.length}) · {fmt(pending.reduce((s, e) => s + weightOf(e), 0))} G
              </span>
            </div>
            {pending.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d3c4af]/50 p-4 text-center text-xs text-[#817563] dark:border-slate-700 dark:text-slate-400">
                Nothing to pack. Send weight from Stocks → Loose Stock to Packaging.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pending.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => openPack(card)}
                    className="flex flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-left shadow-sm transition-all hover:border-[#785600] hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-[#785600] dark:text-amber-400">
                        {designOf(card) || 'Item'}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-semibold text-[#4f4535] dark:text-slate-300">
                        {fmt(card.purity)}%
                      </span>
                    </div>
                    <span className="mt-0.5 text-[11px] text-[#817563] dark:text-slate-400">
                      {[card.stamp || card.Stamp, card.size ? `Size ${card.size}` : '', card.qty ? `${card.qty} Pcs` : '']
                        .filter(Boolean)
                        .join(' · ') || '-'}
                    </span>
                    <span className="mt-1 font-mono text-base font-bold text-black dark:text-white">
                      {fmt(weightOf(card))} G
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Package className="h-4 w-4 text-[#785600] dark:text-amber-400" />
            <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
              Packed Products ({packed.length})
            </h3>
          </div>
          <div className="border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="overflow-hidden">
              <GenericTable
                data={packed}
                columns={packedColumns}
                showSrNo={true}
                srNoLabel="Sr No."
                pagination={true}
                pageSize={10}
                emptyMessage="No products packed yet. Click a card above to pack."
              />
            </div>
          </div>
        </>
      )}

      {/* Pack popup: same layout as the other process popups */}
      {packCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">Pack Item</h3>
                  <p className="text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                    <span className="font-bold text-amber-700 dark:text-amber-400">Track: </span>
                    {formatTrack(extendTrack(trackOf(packCard), 'Packaging'))}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePack}
                className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-[#785600] dark:bg-amber-900/30 dark:text-amber-300">
                <span className="font-bold">Purity: {fmt(packCard.purity)}%</span>
                <button
                  type="button"
                  onClick={() => {
                    setPackWt(String(available));
                    setWastageWt('');
                  }}
                  className="font-bold underline hover:opacity-80"
                  title="Click to pack all available weight"
                >
                  Available: {fmt(available)} G
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-xs sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900/50">
                {[
                  ['Design', designOf(packCard) || '-'],
                  ['Stamp', packCard.stamp || packCard.Stamp || '-'],
                  ['Size', packCard.size || '-'],
                  ['Qty', packCard.qty ? `${packCard.qty} Pcs` : '-'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <span className="block text-[10px] text-gray-500">{label}</span>
                    <span className="block truncate font-semibold text-[#1a1c1b] dark:text-white">{value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    Pack Wt (G) <span className="text-red-500">*</span>
                  </label>
                  <GenericInputField
                    type="text"
                    inputMode="decimal"
                    value={packWt}
                    onChange={(e) => {
                      if (e.target.value === '' || /^\d*\.?\d{0,3}$/.test(e.target.value)) setPackWt(e.target.value);
                    }}
                    {...packScale}
                    placeholder="0.000"
                    suffix="G"
                    compact
                    className="font-mono font-bold text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    Wastage (G)
                  </label>
                  <GenericInputField
                    type="text"
                    inputMode="decimal"
                    value={wastageWt}
                    onChange={(e) => {
                      if (e.target.value === '' || /^\d*\.?\d{0,3}$/.test(e.target.value)) setWastageWt(e.target.value);
                    }}
                    placeholder="0.000"
                    suffix="G"
                    compact
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    Wastage %
                  </label>
                  <div
                    className={`flex h-9 items-center rounded-lg border border-[#c5b497] bg-[#eae3d5]/80 px-3 font-mono text-sm font-bold ${wastagePct > 0 ? 'text-red-700' : 'text-[#785600]'}`}
                  >
                    {wastagePct.toFixed(2)} %
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[#f7f5f0] px-3 py-2 text-xs font-semibold text-[#4f4535] dark:bg-slate-800 dark:text-slate-300">
                <span>Left on card after packing</span>
                <span className="font-mono font-bold text-black dark:text-white">{fmt(remaining)} G</span>
              </div>
            </div>

            <div className="border-t border-[#d3c4af]/20 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveAndPrint}
                disabled={isPacking || packNum <= 0}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50 sm:text-[13px]"
              >
                <Printer className="h-4 w-4" />
                <span>{isPacking ? 'Saving...' : 'Save & Print Packing Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagingProcess;
