import React, { useState } from 'react';
import { Boxes, Search } from 'lucide-react';
import LooseStockPanel from '@/components/erp/masters/LooseStockPanel';
import { useGetStock } from '@/lib/api/stock';
import { useGetItems } from '@/lib/api/items';
import { useGetSizes } from '@/lib/api/sizes';

/**
 * Loose Stock step (after Vibrator, before Packaging).
 * Same cards as Stocks → Loose Stock: click a card, give weight to Packaging,
 * the remainder stays on the card.
 */
const LooseStockProcess: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: stockData } = useGetStock();
  const { data: items = [] } = useGetItems();
  const { data: sizes = [] } = useGetSizes();

  const stockList: any[] = Array.isArray(stockData)
    ? stockData
    : (stockData as any)?.data || (stockData as any)?.stocks || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-[#785600] dark:text-amber-400" />
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">Loose Stock</h2>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
          <input
              autoComplete="off"
              data-lpignore="true"
            type="search"
            placeholder="Search item, stamp, size..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-xs text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>
      <LooseStockPanel
        stockList={stockList}
        items={items as any[]}
        sizes={sizes as any[]}
        searchTerm={searchTerm}
      />
    </div>
  );
};

export default LooseStockProcess;
