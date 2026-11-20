import React, { useEffect, useMemo, useState } from 'react';
import ProductCodes from '@/components/common/ProductCodes';
import { ChevronLeft, History, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { confirmAction } from '@/utils/confirmAction';
import { finishedToStockApi, looseToPackagingApi } from '@/lib/api/manufacturing';
import { formatTrack, formatTrackShort } from '@/utils/processTrack';

/**
 * Loose Stock: finished goods after Vibrator, not packed yet.
 * One table row per design / size / purity. Type the weight to pack and click
 * Pack: that weight becomes a Product with its own product ID, the rest stays
 * on the row.
 */
const PACKAGING_KEY = 'chain_packaging_entries_v2';

interface Props {
  stockList: any[];
  items: any[];
  sizes: any[];
  searchTerm: string;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (v: unknown) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(num(v));

const readPackaging = (): any[] => {
  try {
    const list = JSON.parse(localStorage.getItem(PACKAGING_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const writePackaging = (list: any[]) => {
  try {
    localStorage.setItem(PACKAGING_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable
  }
};

const LooseStockPanel: React.FC<Props> = ({ stockList, items, sizes, searchTerm }) => {
  const queryClient = useQueryClient();
  const [packWt, setPackWt] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [packaging, setPackaging] = useState<any[]>([]);

  useEffect(() => setPackaging(readPackaging()), []);

  const rows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return stockList
      .filter((s) => s.kind === 'LOOSE' && num(s.weight) > 0.0005)
      .map((s) => ({
        ...s,
        itemName: items.find((i) => i.id === s.itemId)?.name || s.item?.name || '',
        sizeName: sizes.find((z) => z.id === s.sizeId)?.size || s.size?.size || '',
      }))
      .filter((c) =>
        !q
          ? true
          : [c.itemName, c.design, c.stamp, c.sizeName, String(c.purity ?? '')]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q)),
      );
  }, [stockList, items, sizes, searchTerm]);

  const totalLoose = rows.reduce((s, r) => s + num(r.weight), 0);

  // History: every pack made from Loose Stock (each is a Product with its own ID)
  const packedHistory = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return stockList
      .filter((s) => s.kind === 'PRODUCT' && Array.isArray(s.processTrack) && s.processTrack.includes('Loose Stock'))
      .map((s) => ({
        ...s,
        productCode: `PRD-${String(s.id).slice(0, 8).toUpperCase()}`,
        itemName: items.find((i) => i.id === s.itemId)?.name || s.item?.name || '',
        sizeName: sizes.find((z) => z.id === s.sizeId)?.size || s.size?.size || '',
      }))
      .filter((c) =>
        !q
          ? true
          : [c.productCode, c.itemName, c.design, c.stamp, c.sizeName, String(c.purity ?? '')]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q)),
      )
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [stockList, items, sizes, searchTerm]);
  const packedWtOf = (r: any) => num(r.packedWeight ?? r.weight);
  const totalPacked = packedHistory.reduce((s, r) => s + packedWtOf(r), 0);

  // Older flow: parts sent to Packaging but never packed. Shown only if any exist.
  const waiting = useMemo(
    () => packaging.filter((p) => p.looseStockId && p.status !== 'completed'),
    [packaging],
  );

  const handlePack = async (row: any) => {
    const available = num(row.weight);
    const raw = packWt[row.id];
    const w = Math.round(num(raw === undefined || raw === '' ? available : raw) * 1000) / 1000;
    if (w <= 0) {
      toast.error('Enter the weight to pack.');
      return;
    }
    if (w > available + 0.0005) {
      toast.error(`Only ${fmt(available)} G is available.`);
      return;
    }
    const ok = await confirmAction(
      'Send to Packaging',
      <span className="block text-left">
        <span className="block">Design: <b>{row.design || row.itemName}</b></span>
        <span className="block">Purity: <b>{fmt(row.purity ?? 100)}%</b></span>
        <span className="block">Send: <b>{fmt(w)} G</b> · Remaining: <b>{fmt(available - w)} G</b></span>
        <span className="mt-2 block text-center">
          It shows as a card in Manufacturing → Packaging. Pack it there to create the product ID.
        </span>
      </span>,
    );
    if (!ok) return;
    setBusyId(row.id);
    try {
      const res = await looseToPackagingApi({ stockId: row.id, weight: w });
      const track = Array.isArray(res.processTrack) ? [...res.processTrack] : [];
      if (track[track.length - 1] !== 'Loose Stock') track.push('Loose Stock');
      // One Packaging card per send
      const card = {
        id: `packaging-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
        purity: num(res.purity ?? row.purity ?? 100),
        stamp: res.stamp || '',
        Stamp: res.stamp || '',
        design: res.design || row.design || row.itemName || '',
        designName: res.design || row.design || row.itemName || '',
        size: res.size || row.sizeName || '',
        grossWt: num(res.weight),
        netWeight: num(res.weight),
        karigar: 'Self Packaging',
        sourceProcess: 'Loose Stock',
        processTrack: track,
        status: 'pending',
        looseStockId: row.id,
      };
      const list = [card, ...readPackaging()];
      writePackaging(list);
      setPackaging(list);
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setPackWt((p) => ({ ...p, [row.id]: '' }));
      toast.success(`Sent ${fmt(w)} G to Packaging. ${fmt(res.remaining)} G left in Loose Stock.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send to Packaging');
    } finally {
      setBusyId(null);
    }
  };

  // Older flow: put an unpacked part back on its loose row
  const handleReturn = async (row: any) => {
    const ok = await confirmAction(
      'Return to Loose Stock',
      `${fmt(row.netWeight)} G of ${row.design || 'this item'} goes back to Loose Stock. Continue?`,
    );
    if (!ok) return;
    try {
      await finishedToStockApi({
        designName: row.design,
        size: row.size || undefined,
        stamp: row.stamp || undefined,
        purity: num(row.purity),
        weight: num(row.netWeight),
        sourceProcess: 'Packaging return',
        processTrack: row.processTrack,
        kind: 'LOOSE',
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to return');
      return;
    }
    const list = readPackaging().filter((p) => p.id !== row.id);
    writePackaging(list);
    setPackaging(list);
    queryClient.invalidateQueries({ queryKey: ['stock'] });
    toast.success('Returned to Loose Stock');
  };

  const columns: Column<any>[] = [
    {
      key: 'design',
      header: 'Item / Design',
      align: 'center',
      render: (r) => <span className="font-semibold text-[#1a1c1b] dark:text-white">{r.design || r.itemName || '-'}</span>,
    },
    { key: 'stamp', header: 'Stamp (शिक्का)', align: 'center', render: (r) => r.stamp || '-' },
    { key: 'size', header: 'Size', align: 'center', render: (r) => r.sizeName || '-' },
    { key: 'purity', header: 'Purity %', align: 'center', render: (r) => <span className="font-mono">{fmt(r.purity ?? 100)}%</span> },
    {
      key: 'processTrack',
      header: 'Track',
      align: 'center',
      render: (r) =>
        Array.isArray(r.processTrack) && r.processTrack.length ? (
          <span className="whitespace-nowrap text-[11px] font-semibold text-[#785600]" title={formatTrack(r.processTrack)}>
            {formatTrackShort(r.processTrack)}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'weight',
      header: 'Available (G)',
      align: 'center',
      render: (r) => <span className="font-mono font-bold text-black dark:text-white">{fmt(r.weight)} G</span>,
    },
    {
      key: 'packWt',
      header: 'Send Wt (G)',
      align: 'center',
      render: (r) => (
        <input
          type="number"
          step="0.001"
          min="0"
          inputMode="decimal"
          value={packWt[r.id] ?? ''}
          placeholder={fmt(r.weight)}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
            if (e.key === 'Enter') handlePack(r);
          }}
          onChange={(e) => {
            const v = e.target.value;
            if (num(v) > num(r.weight) + 0.0005) {
              toast.error(`Only ${fmt(r.weight)} G is available.`, { id: 'loose-over' });
              return;
            }
            setPackWt((p) => ({ ...p, [r.id]: v }));
          }}
          className="font-mono h-9 w-28 rounded-lg border border-[#d3c4af]/40 bg-white px-2 text-center text-sm text-[#1a1c1b] outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      ),
    },
    {
      key: 'remaining',
      header: 'Remaining (G)',
      align: 'center',
      render: (r) => {
        const typed = packWt[r.id];
        const rem = typed ? Math.max(0, num(r.weight) - num(typed)) : num(r.weight);
        return <span className="font-mono text-sm text-[#4f4535] dark:text-slate-300">{fmt(rem)} G</span>;
      },
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (r) => (
        <GenericButton type="button" variant="primary" size="sm" onClick={() => handlePack(r)} disabled={busyId === r.id}>
          {busyId === r.id ? 'Sending...' : 'Send to Packaging'}
        </GenericButton>
      ),
    },
  ];

  const historyColumns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Packed On',
      align: 'center',
      render: (r) => {
        const d = new Date(r.createdAt);
        return isNaN(d.getTime()) ? (
          '-'
        ) : (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">{d.toLocaleDateString('en-IN')}</span>
            <span className="text-xs text-[#817563] dark:text-slate-400">
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'productCode',
      header: 'Product ID',
      align: 'center',
      render: (r) => <ProductCodes code={r.productCode} />,
    },
    {
      key: 'design',
      header: 'Item / Design',
      align: 'center',
      render: (r) => <span className="font-semibold">{r.design || r.itemName || '-'}</span>,
    },
    { key: 'stamp', header: 'Stamp (शिक्का)', align: 'center', render: (r) => r.stamp || '-' },
    { key: 'size', header: 'Size', align: 'center', render: (r) => r.sizeName || '-' },
    { key: 'purity', header: 'Purity %', align: 'center', render: (r) => <span className="font-mono">{fmt(r.purity ?? 100)}%</span> },
    {
      key: 'weight',
      header: 'Packed Wt (G)',
      align: 'center',
      render: (r) => <span className="font-mono font-bold text-black dark:text-white">{fmt(packedWtOf(r))} G</span>,
    },
    {
      key: 'inStock',
      header: 'In Stock',
      align: 'center',
      render: (r) =>
        num(r.weight) <= 0.0005 ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Sold</span>
        ) : (
          <span className="font-mono text-sm">{fmt(r.weight)} G</span>
        ),
    },
  ];

  const waitingColumns: Column<any>[] = [
    { key: 'design', header: 'Item / Design', align: 'center', render: (r) => <span className="font-semibold">{r.design || '-'}</span> },
    { key: 'stamp', header: 'Stamp', align: 'center', render: (r) => r.stamp || '-' },
    { key: 'size', header: 'Size', align: 'center', render: (r) => r.size || '-' },
    { key: 'purity', header: 'Purity %', align: 'center', render: (r) => <span className="font-mono">{fmt(r.purity)}%</span> },
    { key: 'netWeight', header: 'Weight (G)', align: 'center', render: (r) => <span className="font-mono font-semibold">{fmt(r.netWeight)} G</span> },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (r) => (
        <GenericButton type="button" variant="outline" size="sm" onClick={() => handleReturn(r)}>
          Return
        </GenericButton>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Title + History button on one line (same as the other process pages) */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          {showHistory ? (
            <History className="h-4 w-4 shrink-0 text-[#785600] dark:text-amber-400" />
          ) : (
            <Package className="h-4 w-4 shrink-0 text-[#785600] dark:text-amber-400" />
          )}
          <span className="truncate text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
            {showHistory
              ? `Packed History (${packedHistory.length}) · ${fmt(totalPacked)} G`
              : `Loose Stock (${rows.length}) · ${fmt(totalLoose)} G`}
          </span>
        </div>
        <GenericButton type="button" size="sm" variant="primary" onClick={() => setShowHistory((v) => !v)} className="shrink-0">
          {showHistory ? <ChevronLeft className="h-4 w-4" /> : <History className="h-4 w-4" />}
          <span>{showHistory ? 'Loose Stock' : 'History'}</span>
        </GenericButton>
      </div>

      {!showHistory && (
      <div>
        <GenericTable
          data={rows}
          columns={columns}
          showSrNo={true}
          srNoLabel="Sr No."
          emptyMessage="No loose stock. Send finished items from Vibrator to Loose Stock."
        />
      </div>

      )}

      {showHistory && (
      <div>
        <GenericTable
          data={packedHistory}
          columns={historyColumns}
          showSrNo={true}
          srNoLabel="Sr No."
          pagination={true}
          pageSize={10}
          emptyMessage="Nothing packed from Loose Stock yet."
        />
      </div>
      )}

      {!showHistory && waiting.length > 0 && (
        <div>
          <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
            Sent to Packaging, not packed yet ({waiting.length}) · pack them in Manufacturing → Packaging, or return here
          </div>
          <GenericTable data={waiting} columns={waitingColumns} showSrNo={true} srNoLabel="Sr No." emptyMessage="" />
        </div>
      )}
    </div>
  );
};

export default LooseStockPanel;
