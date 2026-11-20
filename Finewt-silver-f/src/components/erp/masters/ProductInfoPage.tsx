import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, PackageCheck, PackageX } from 'lucide-react';
import { useGetStock } from '@/lib/api/stock';
import { useGetSizes } from '@/lib/api/sizes';
import { useGetItems } from '@/lib/api/items';
import { Barcode128 } from '@/components/common/Barcode128';
import { formatTrack } from '@/utils/processTrack';

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (v: unknown) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(num(v));

/** Page a phone opens when it scans a product's QR code */
const ProductInfoPage: React.FC<{ code: string }> = ({ code }) => {
  const { data: stockData, isLoading } = useGetStock();
  const { data: sizesData = [] } = useGetSizes();
  const { data: itemsData = [] } = useGetItems();

  const product = useMemo(() => {
    const list: any[] = Array.isArray(stockData)
      ? stockData
      : (stockData as any)?.data || (stockData as any)?.stocks || [];
    // PRD-1B2ECA48 -> id starting with 1b2eca48; a full id also works
    const key = decodeURIComponent(code || '').trim().replace(/^PRD-/i, '').toLowerCase();
    if (!key) return null;
    return list.find((s) => String(s.id).toLowerCase() === key) ||
      list.find((s) => String(s.id).toLowerCase().startsWith(key)) ||
      null;
  }, [stockData, code]);

  const sizes: any[] = Array.isArray(sizesData) ? sizesData : (sizesData as any)?.data || [];
  const items: any[] = Array.isArray(itemsData) ? itemsData : (itemsData as any)?.data || [];
  const productCode = product ? `PRD-${String(product.id).slice(0, 8).toUpperCase()}` : decodeURIComponent(code || '');
  const sold = product ? num(product.weight) <= 0.0005 : false;
  const packedWt = product ? num(product.packedWeight ?? product.weight) : 0;
  const track: string[] = product && Array.isArray(product.processTrack) ? product.processTrack : [];

  const rows: [string, React.ReactNode][] = product
    ? [
        ['Item', items.find((i) => i.id === product.itemId)?.name || product.item?.name || '-'],
        ['Design', product.design || '-'],
        ['Stamp (शिक्का)', product.stamp || '-'],
        ['Size', sizes.find((z) => z.id === product.sizeId)?.size || product.size?.size || '-'],
        ['Purity', `${fmt(product.purity ?? 100)}%`],
        ['Packed Weight', `${fmt(packedWt)} G`],
        ['In Stock', sold ? 'Sold' : `${fmt(product.weight)} G`],
        ['Fine Weight', `${fmt((num(product.weight) * num(product.purity ?? 100)) / 100)} G`],
        [
          'Packed On',
          product.createdAt
            ? new Date(product.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-',
        ],
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-4">
      <Link
        to="/Stocks/stockpage"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#785600] dark:text-amber-400"
      >
        <ArrowLeft className="h-4 w-4" /> Stocks
      </Link>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#785600] border-t-transparent" />
        </div>
      ) : !product ? (
        <div className="rounded-2xl border border-dashed border-[#d3c4af]/60 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <PackageX className="mx-auto mb-2 h-10 w-10 text-[#817563]" />
          <div className="font-mono text-sm font-bold text-[#1a1c1b] dark:text-white">{productCode}</div>
          <p className="mt-1 text-sm text-[#4f4535] dark:text-slate-400">No product found with this ID.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#785600] to-[#986d00] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <PackageCheck className="h-5 w-5 shrink-0" />
              <span className="truncate text-base font-bold">{product.design || 'Product'}</span>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                sold ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {sold ? 'Sold' : 'In Stock'}
            </span>
          </div>

          <div className="flex justify-center border-b border-[#d3c4af]/20 py-4 dark:border-slate-800">
            <Barcode128 value={productCode} height={44} />
          </div>

          <dl className="divide-y divide-[#f4f4f2] dark:divide-slate-800">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-sm text-[#4f4535] dark:text-slate-400">{label}</dt>
                <dd className="text-right text-sm font-semibold text-[#1a1c1b] dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>

          {track.length > 0 && (
            <div className="border-t border-[#d3c4af]/20 px-4 py-3 dark:border-slate-800">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#817563] dark:text-slate-400">
                Process Route
              </div>
              <div className="text-sm font-semibold leading-relaxed text-[#785600] dark:text-amber-400">{formatTrack(track)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductInfoPage;
