import React, { useState, useEffect, useMemo } from 'react';
import { productInfoUrl } from '@/components/common/ProductCodes';
import TabBar, { TabItem } from '@/components/common/TabBar';
import { Coins, Recycle, Boxes, PackageCheck, Factory } from 'lucide-react';
import {
  Plus,
  Save,
  X,
  Edit,
  Trash2,
  Package,
  Ruler,
  Search,
  Eye,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useNavigate } from '@tanstack/react-router';
import LooseStockPanel from './LooseStockPanel';
import toast from 'react-hot-toast';

import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { useGetItems, Item } from '@/lib/api/items';
import { useGetSizes, Size } from '@/lib/api/sizes';
import {
  useCreateStock,
  useUpdateStock,
  useDeleteStock,
  useGetStock,
  useRevertStock,
} from '@/lib/api/stock';
import { z } from 'zod';
import { GrRevert } from 'react-icons/gr';
import { confirmAction } from '@/utils/confirmAction';
import { Barcode128, productCodeFromId } from '@/components/common/Barcode128';
import { collectScrap, collectWorkInProgress } from '@/utils/manufacturingStock';
import { useGetGalai, useGetGalaiCards, useGetScrap } from '@/lib/api/galai';

// Zod Schema for validation
const OpeningStockSchema = z.object({
  itemId: z.string().min(1, 'Please select an item'),
  designId: z.string().min(1, 'Please select a design'),
  Stamp: z.array(z.string()).optional(),
  grams: z.number().min(0.001, 'Please enter a valid weight in grams'),
  purity: z
    .number()
    .min(1, 'Please enter purity percentage')
    .max(100, 'Purity cannot exceed 100%'),
});

type OpeningStockFormData = z.infer<typeof OpeningStockSchema>;

interface OpeningStockEntry {
  id: string;
  srNo: number;
  item: string;
  process?: string;
  design: string;
  Stamp: string;
  size?: string;
  purity: number;
  grams: number;
  qty?: number;
  barcode?: string;
  processTrack?: string[];
  scrapSourceProcess?: string;
  isEditing?: boolean;
  isSaved?: boolean;
  gramsRaw?: string;
  purityRaw?: string;
  itemId?: string;
  sizeId?: string;
  kind?: string;
}

type StockFilter = 'Silver' | 'Scrap' | 'Loose' | 'Product' | 'Manufacturing';

const FILTER_OPTIONS: TabItem<StockFilter>[] = [
  { id: 'Silver', label: 'Silver', icon: <Coins className="h-4 w-4" /> },
  { id: 'Scrap', label: 'Scrap', icon: <Recycle className="h-4 w-4" /> },
  { id: 'Loose', label: 'Loose Stock', icon: <Boxes className="h-4 w-4" /> },
  { id: 'Product', label: 'Product', icon: <PackageCheck className="h-4 w-4" /> },
  { id: 'Manufacturing', label: 'Manufacturing', icon: <Factory className="h-4 w-4" /> },
];

// ------------------------------------------------------------------
// High-Resolution QR Code with Product ID Component
// ------------------------------------------------------------------
const ProductQRCodeDisplay: React.FC<{ value: string }> = ({ value }) => {
  const code = value || 'PRD-0001';

  return (
    <div className="mx-auto flex flex-col items-center justify-center gap-1 py-1 text-center">
      <div className="inline-flex items-center justify-center rounded-lg bg-white p-1.5 shadow-sm border border-gray-200/80 dark:border-slate-700">
        <QRCode
          value={productInfoUrl(/^[0-9a-f-]{36}$/i.test(code) ? `PRD-${code.slice(0, 8).toUpperCase()}` : code)}
          size={42}
          style={{ height: '42px', maxWidth: '100%', width: '42px' }}
          viewBox="0 0 256 256"
        />
      </div>
      <span
        className="font-mono text-[10px] font-bold tracking-wider text-[#785600] dark:text-amber-400"
        title={code}
      >
        {/^[0-9a-f-]{36}$/i.test(code) ? `PRD-${code.slice(0, 8).toUpperCase()}` : code}
      </span>
    </div>
  );
};

// ------------------------------------------------------------------
// Manufacturing process order (used for the Process Track column)
// ------------------------------------------------------------------
export const PROCESS_ORDER = [
  'Galai',
  'Company',
  'Press',
  'Sutt',
  'Bharni',
  'Cutting',
  'Wash',
  'Soldering',
  'Meena',
  'Tass',
  'Polishing',
  'Vibrator',
];

export const getProcessTrackForProcess = (processName: string): string[] => {
  const p = (processName || '').trim();
  const idx = PROCESS_ORDER.findIndex(
    (step) => step.toLowerCase() === p.toLowerCase(),
  );
  if (idx >= 0) {
    return PROCESS_ORDER.slice(0, idx + 1);
  }
  return [p];
};

// ------------------------------------------------------------------

const StockMaster: React.FC = () => {
  const navigate = useNavigate();
  const [openingEntries, setOpeningEntries] = useState<OpeningStockEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<StockFilter>('Silver');
  const [revertItem, setRevertItem] = useState<OpeningStockEntry | null>(null);
  const [revertQty, setRevertQty] = useState<string>('');

  // Fetch items and sizes from API
  const { data: items = [], isLoading: itemsLoading } = useGetItems();
  const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();

  const revertStock = useRevertStock();

  // Fetch existing stock data
  const {
    data: stockData = [],
    isLoading: stockLoading,
    refetch,
  } = useGetStock();

  // Mutation hooks
  const createStock = useCreateStock();
  const updateStock = useUpdateStock();
  const deleteStock = useDeleteStock();

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (itemsLoading || sizesLoading || stockLoading) {
      return;
    }

    let entries: OpeningStockEntry[] = [];
    const stockList: any[] = Array.isArray(stockData)
      ? stockData
      : (stockData as any)?.data || (stockData as any)?.stocks || [];

    if (stockList.length > 0) {
      const stockEntries: OpeningStockEntry[] = stockList.map(
        (stock, index) => {
          const item = items.find((i) => i.id === stock.itemId);
          const size = sizes.find((s) => s.id === stock.sizeId);
          const isGold =
            (stock.sizeId === null && stock.purity === null) ||
            (item?.name?.toLowerCase().includes('gold') &&
              stock.sizeId === null);

          const weight = stock.weight ? Number(stock.weight) : 0;
          const purity = isGold ? 100 : stock.purity ? Number(stock.purity) : 0;

          return {
            id: stock.id,
            srNo: index + 1,
            item: item?.name || (isGold ? 'Silver' : ''),
            process: '',
            design: isGold ? '-' : stock.design || '',
            Stamp: stock.stamp || '',
            size: size?.size || '',
            purity: purity,
            grams: weight,
            qty: 0,
            barcode: stock.id,
            processTrack: Array.isArray(stock.processTrack) ? stock.processTrack : [],
            scrapSourceProcess: '',
            isEditing: false,
            isSaved: true,
            gramsRaw: formatNumberDisplay(weight, 3),
            purityRaw: formatNumberDisplay(purity, 3),
            itemId: stock.itemId,
            sizeId: stock.sizeId,
            kind: stock.kind || 'PRODUCT',
          };
        },
      );
      const goldItems = stockEntries.filter(
        (entry) => entry.sizeId === null && entry.purity === 100,
      );
      const otherItems = stockEntries.filter(
        (entry) => !(entry.sizeId === null && entry.purity === 100),
      );
      const sortedGold = goldItems.sort((a, b) => a.item.localeCompare(b.item));
      const sortedOther = otherItems.sort((a, b) => {
        if (a.grams > 0 && b.grams === 0) return -1;
        if (a.grams === 0 && b.grams > 0) return 1;
        return a.item.localeCompare(b.item);
      });
      entries = [...sortedGold, ...sortedOther];
      entries = entries.map((entry, index) => ({
        ...entry,
        srNo: index + 1,
      }));
    }

    setOpeningEntries(entries);
    setIsInitialized(true);
  }, [stockData, items, sizes, itemsLoading, sizesLoading, stockLoading, isInitialized]);

  // ---------------- Pick data based on filter ----------------
  // Galai lives on the server; the other stages are read from browser storage
  const { data: galaiPending = [] } = useGetGalai();
  const { data: galaiCards = [] } = useGetGalaiCards();
  const { data: serverScrap = [] } = useGetScrap();

  const filterScopedEntries: OpeningStockEntry[] = useMemo(() => {
    const isSilver = (e: OpeningStockEntry) => (e.item || '').trim().toUpperCase() === 'SILVER';
    const asRows = (list: Omit<OpeningStockEntry, 'srNo'>[]) =>
      list.map((e, i) => ({ ...e, srNo: i + 1 }) as OpeningStockEntry);

    switch (activeFilter) {
      case 'Silver':
        return asRows(openingEntries.filter(isSilver));
      case 'Product':
        // Every other Stock item: finished goods from manufacturing and opening-stock items
        return asRows(openingEntries.filter((e) => !isSilver(e) && e.kind !== 'LOOSE'));
      case 'Manufacturing': {
        // Work in progress in every stage, with where it is now and its track
        const galaiRows = [
          ...(Array.isArray(galaiPending) ? galaiPending : []).map((g: any) => ({
            id: `galai-${g.id}`,
            stage: 'Galai',
            design: g.particular || '',
            size: '',
            stamp: g.stamp || '',
            purity: Number(g.purity) || 0,
            weight: Number(g.grossWt) || 0,
            processTrack: ['Galai'],
          })),
          ...(Array.isArray(galaiCards) ? galaiCards : []).map((c: any) => ({
            id: `galai-card-${c.id}`,
            stage: 'Galai',
            design: c.design || '',
            size: c.size || '',
            stamp: c.stamp || '',
            purity: Number(c.purity) || 0,
            weight: Number(c.availableWeight) || 0,
            processTrack: ['Galai'],
          })),
        ];
        return asRows(
          [...galaiRows, ...collectWorkInProgress()].map((w) => ({
            id: w.id,
            item: w.stage,
            process: w.stage,
            design: w.design || '-',
            Stamp: w.stamp,
            size: w.size,
            purity: w.purity,
            grams: w.weight,
            gramsRaw: String(w.weight),
            processTrack: w.processTrack,
            isSaved: true,
          })),
        );
      }
      case 'Scrap': {
        const serverRows = (Array.isArray(serverScrap) ? serverScrap : []).map((g: any) => ({
          id: `galai-scrap-${g.purity}`,
          stage: 'Galai',
          purity: Number(g.purity) || 0,
          weight: Number(g.weight) || 0,
        }));
        return asRows(
          [...serverRows, ...collectScrap()].map((r) => ({
            id: r.id,
            item: `${r.stage} Scrap`,
            scrapSourceProcess: r.stage,
            design: '-',
            Stamp: '-',
            purity: r.purity,
            grams: r.weight,
            gramsRaw: String(r.weight),
            isSaved: true,
          })),
        );
      }
      default:
        return openingEntries;
    }
  }, [openingEntries, activeFilter, galaiPending, galaiCards, serverScrap]);

  // ---------------- Search filter ----------------
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return filterScopedEntries;
    const searchLower = searchTerm.toLowerCase().trim();
    return filterScopedEntries.filter((entry) => {
      return (
        entry.item.toLowerCase().includes(searchLower) ||
        entry.design.toLowerCase().includes(searchLower) ||
        entry.Stamp.toLowerCase().includes(searchLower) ||
        (entry.size || '').toLowerCase().includes(searchLower) ||
        (entry.process || '').toLowerCase().includes(searchLower) ||
        (entry.barcode || '').toLowerCase().includes(searchLower) ||
        (entry.scrapSourceProcess || '').toLowerCase().includes(searchLower) ||
        entry.purity.toString().includes(searchLower) ||
        entry.grams.toString().includes(searchLower)
      );
    });
  }, [filterScopedEntries, searchTerm]);

  // Validate form data
  const validateEntry = (entry: OpeningStockEntry): boolean => {
    try {
      OpeningStockSchema.parse({
        itemId: entry.itemId || '',
        sizeId: entry.sizeId || '',
        grams: entry.grams,
        purity:
          typeof entry.purity === 'string'
            ? parseFloat(entry.purity)
            : entry.purity,
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      }
      return false;
    }
  };

  const formatNumberDisplay = (
    value: number | string | null | undefined,
    maxDecimals: number = 2,
  ): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return '-';
    if (num === 0) return '0';

    const fixed = num.toFixed(maxDecimals);
    return parseFloat(fixed).toString();
  };

  const formatGrams = (value: number | string | null | undefined): string => {
    return formatNumberDisplay(value, 3);
  };

  // Handle row save - Create or Update
  const handleRowSave = async (index: number) => {
    const entry = openingEntries[index];

    if (!validateEntry(entry)) {
      return;
    }

    const stockDataPayload = {
      itemId: entry.itemId,
      sizeId: entry.sizeId,
      weight: entry.grams,
      purity:
        typeof entry.purity === 'string'
          ? parseFloat(entry.purity)
          : entry.purity,
    };

    try {
      if (entry.isSaved) {
        await updateStock.mutateAsync({ id: entry.id, data: stockDataPayload });
        toast.success('Opening stock updated successfully!');
      } else {
        const result = await createStock.mutateAsync(stockDataPayload);
        entry.id = result.id;
        toast.success('Opening stock saved successfully!');
      }

      setOpeningEntries((prev) =>
        prev.map((s, i) => {
          if (i === index) {
            return {
              ...s,
              isEditing: false,
              isSaved: true,
              gramsRaw: formatNumberDisplay(entry.grams, 3),
              purityRaw: formatNumberDisplay(entry.purity, 3),
            };
          }
          return s;
        }),
      );

      await refetch();
    } catch (error) {
      console.error('Error saving opening stock:', error);
      toast.error('Failed to save opening stock');
    }
  };

  const handleRowClick = (entry: OpeningStockEntry) => {
    navigate({ to: `/stock/stockreport/${entry.id}` });
  };

  const handleConfirmRevert = async () => {
    if (!revertItem || !revertQty) return;
    const qtyNum = parseFloat(revertQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await revertStock.mutateAsync({
        id: revertItem.id,
        data: { qty: qtyNum },
      });
      setRevertItem(null);
      setRevertQty('');
      await refetch();
    } catch (error) {
      console.error('Error reverting stock entry:', error);
    }
  };

  // ---------------- Dynamic Columns by Filter ----------------

  // Silver: Item, Purity, Wt
  const silverColumns: Column<OpeningStockEntry>[] = useMemo(
    () => [
      {
        key: 'item',
        header: 'Item',
        render: (item) => (
          <span className="font-medium text-[#1a1c1b] dark:text-white">
            {item.item}
          </span>
        ),
      },
      {
        key: 'purity',
        header: 'Purity (%)',
        render: (item) => (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity, 2)} %
          </span>
        ),
      },
      {
        key: 'gramsRaw',
        header: 'Wt (G)',
        render: (item) => (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.gramsRaw, 3)} G
          </span>
        ),
      },
    ],
    [],
  );

  // Scrap: Item, Process Name (of scrap), Purity, Wt (G)
  const scrapColumns: Column<OpeningStockEntry>[] = useMemo(
    () => [
      {
        key: 'item',
        header: 'Item',
        render: (item) => {
          return (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              {item.item || (item.scrapSourceProcess ? `${item.scrapSourceProcess} Scrap` : 'Silver Scrap')}
            </span>
          );
        },
      },
      {
        key: 'scrapSourceProcess',
        header: 'Process Name',
        render: (item) => (
          <span className="text-xs font-semibold text-[#1a1c1b] dark:text-white">
            {item.scrapSourceProcess || item.process || '-'}
          </span>
        ),
      },
      {
        key: 'purity',
        header: 'Purity (%)',
        render: (item) => (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity, 2)} %
          </span>
        ),
      },
      {
        key: 'gramsRaw',
        header: 'Wt (G)',
        render: (item) => (
          <span className="font-mono text-[#1a1c1b] dark:text-white font-bold">
            {formatNumberDisplay(item.gramsRaw, 3)} G
          </span>
        ),
      },
    ],
    [],
  );

  // Product: Item, Purity, Stamp (शिक्का), Design, Size, Wt, Barcode (Product ID)
  const productColumns: Column<OpeningStockEntry>[] = useMemo(
    () => [
      {
        key: 'item',
        header: 'Item',
        render: (item) => (
          <span className="font-medium text-[#1a1c1b] dark:text-white">
            {item.item}
          </span>
        ),
      },
      {
        key: 'purity',
        header: 'Purity (%)',
        render: (item) => (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity, 2)} %
          </span>
        ),
      },
      {
        key: 'Stamp',
        header: 'Stamp (शिक्का)',
        render: (item) => (
          <span className="text-[#1a1c1b] dark:text-white">
            {item.Stamp || '-'}
          </span>
        ),
      },
      {
        key: 'design',
        header: 'Design',
        render: (item) => (
          <span className="text-[#1a1c1b] dark:text-white">
            {item.design || '-'}
          </span>
        ),
      },
      {
        key: 'size',
        header: 'Size',
        render: (item) => (
          <span className="text-[#1a1c1b] dark:text-white">
            {item.size || '-'}
          </span>
        ),
      },
      {
        key: 'gramsRaw',
        header: 'Wt (G)',
        render: (item) => (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.gramsRaw, 3)} G
          </span>
        ),
      },
      {
        key: 'processTrack',
        header: 'Process Track',
        render: (item) => {
          const track = item.processTrack || [];
          return (
            <span className="text-xs font-semibold text-[#785600] dark:text-amber-400" title={track.join(' > ')}>
              {track.length > 0 ? track.map((t) => t.slice(0, 2)).join(' › ') : '-'}
            </span>
          );
        },
      },
      {
        key: 'barcode',
        header: 'Barcode (Product ID)',
        align: 'center',
        render: (item) => {
          // Scan this in Create Bill to fill the bill row
          const code = productCodeFromId(String(item.barcode || item.id || ''));
          return (
            <div className="flex w-full items-center justify-center text-center">
              <Barcode128 value={code} />
            </div>
          );
        },
      },
    ],
    [],
  );

  // Manufacturing: Process (Item), Process, Design, Size, Stamp (शिक्का), Wt, Process Track
  const manufacturingColumns: Column<OpeningStockEntry>[] = useMemo(
    () => [
      {
        key: 'item',
        header: 'Process (Item)',
        render: (item) => (
          <span className="font-medium text-[#1a1c1b] dark:text-white">
            {item.item}
          </span>
        ),
      },
      {
        key: 'process',
        header: 'Process',
        render: (item) => (
          <span className="text-[#1a1c1b] dark:text-white">
            {item.process || item.item || '-'}
          </span>
        ),
      },
      {
        key: 'design',
        header: 'Design',
        render: (item) => (
          <span className="text-[#1a1c1b] dark:text-white">
            {item.design || '-'}
          </span>
        ),
      },
      {
        key: 'size',
        header: 'Size',
        render: (item) => (
          <span className="text-[#1a1c1b] dark:text-white">
            {item.size || '-'}
          </span>
        ),
      },
      {
        key: 'Stamp',
        header: 'Stamp (शिक्का)',
        render: (item) => (
          <span className="text-[#1a1c1b] dark:text-white">
            {item.Stamp || '-'}
          </span>
        ),
      },
      {
        key: 'gramsRaw',
        header: 'Wt (G)',
        render: (item) => (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.gramsRaw, 3)} G
          </span>
        ),
      },
      {
        key: 'processTrack',
        header: 'Process Track',
        render: (item) => {
          const currentProcess = item.process || item.item || '';
          const track =
            item.processTrack && item.processTrack.length > 0
              ? item.processTrack
              : getProcessTrackForProcess(currentProcess);

          const shortTrack = track
            .map((step) => step.trim().slice(0, 2))
            .filter(Boolean)
            .join(' > ');

          return (
            <span
              className="text-xs font-semibold text-[#1a1c1b] dark:text-white"
              title={track.join(' > ')}
            >
              {shortTrack || '-'}
            </span>
          );
        },
      },
    ],
    [],
  );

  // Pick active columns
  const columns: Column<OpeningStockEntry>[] = useMemo(() => {
    switch (activeFilter) {
      case 'Silver':
        return silverColumns;
      case 'Scrap':
        return scrapColumns;
      case 'Product':
        return productColumns;
      case 'Manufacturing':
        return manufacturingColumns;
      default:
        return silverColumns;
    }
  }, [activeFilter, silverColumns, scrapColumns, productColumns, manufacturingColumns]);

  const isSubmitting =
    createStock.isPending || updateStock.isPending || deleteStock.isPending;


  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header with Title, Search and Buttons */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 md:px-6">
          {/* Row 1: title + actions */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left side - Title with Refresh Icon */}
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="whitespace-nowrap font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Stocks
            </h2>
            <button
              type="button"
              onClick={async () => {
                await refetch();
                toast.success('Stock data refreshed');
              }}
              disabled={stockLoading}
              title="Refresh Stock Data"
              className="flex items-center justify-center rounded-lg p-1.5 text-[#785600] transition-all hover:scale-105 hover:bg-[#785600]/10 active:scale-95 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-4 w-4 sm:h-5 sm:w-5 ${stockLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>


            {/* Action Buttons */}
            <div className="flex w-full flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/Stocks/stockmanagement' })}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Inward / Outward</span>
              </GenericButton>

              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/stock/openingstock' })}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Opening Stock</span>
              </GenericButton>

              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/master/additems' })}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Add Item</span>
              </GenericButton>

              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/master/size' })}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Add Size</span>
              </GenericButton>
            </div>
          </div>

          {/* Row 2: filter tabs + search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabBar tabs={FILTER_OPTIONS} active={activeFilter} onChange={setActiveFilter} className="w-full sm:w-auto sm:flex-1" />

            {/* Search Bar */}
            <div className="relative w-full sm:w-72 lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search by item, size, weight or purity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white/80 py-2 pl-9 pr-4 text-sm text-[#1a1c1b] outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-[#785600]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] hover:text-[#1a1c1b] dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {activeFilter === 'Loose' && (
        <div className="px-3 pb-4 pt-3 sm:px-4 md:px-6">
          <LooseStockPanel
            stockList={
              Array.isArray(stockData)
                ? stockData
                : (stockData as any)?.data || (stockData as any)?.stocks || []
            }
            items={items as any[]}
            sizes={sizes as any[]}
            searchTerm={searchTerm}
          />
        </div>
      )}
      <div className={`px-3 pb-4 sm:px-4 md:px-6 ${activeFilter === 'Loose' ? 'hidden' : ''}`}>
        <div className="-mx-3 overflow-x-auto sm:-mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <GenericTable
              data={filteredData}
              columns={columns}
              onSave={(item, index) => handleRowSave(index)}
              emptyMessage={
                searchTerm
                  ? `No results found for "${searchTerm}"`
                  : `No ${FILTER_OPTIONS.find((f) => f.id === activeFilter)?.label || activeFilter} entries found.`
              }
              isLoading={isSubmitting}
              showSrNo={true}
              srNoLabel="Sr No."
              onRowClick={handleRowClick}
              showEdit={false}
              showDelete={false}
              renderActions={undefined}
            />
          </div>
        </div>
      </div>

      {/* Stock Revert Quantity Modal */}
      {revertItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                Revert Stock - {revertItem.item}
              </h3>
              <button
                type="button"
                onClick={() => setRevertItem(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 flex flex-col gap-3">
              <div className="text-xs text-gray-500 dark:text-slate-400">
                Current Weight:{' '}
                <span className="font-semibold text-gray-800 dark:text-white">
                  {revertItem.grams} G
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Enter Quantity / Weight to Revert (G)
                </label>
                <input
                  type="number"
                  step="any"
                  value={revertQty}
                  onChange={(e) => setRevertQty(e.target.value)}
                  placeholder="Enter weight in grams..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevertItem(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevert}
                disabled={
                  revertStock.isPending ||
                  !revertQty ||
                  parseFloat(revertQty) <= 0
                }
                className="rounded-lg bg-[#785600] font-semibold text-white transition-all hover:bg-[#5e4300] disabled:opacity-50 h-9 px-4 text-xs sm:text-[13px]"
              >
                {revertStock.isPending ? 'Reverting...' : 'Confirm Revert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMaster;