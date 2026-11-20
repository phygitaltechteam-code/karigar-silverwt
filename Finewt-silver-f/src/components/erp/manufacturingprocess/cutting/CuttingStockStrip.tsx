import React from 'react';
import { Box } from 'lucide-react';
import { formatNumberDisplay, formatPurityNoTrailingZeros } from './cuttingUtils';

interface CuttingStockStripProps {
  stockList: any[];
  onSelectCard: (card: any) => void;
}

export const CuttingStockStrip: React.FC<CuttingStockStripProps> = ({
  stockList,
  onSelectCard,
}) => {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-[#785600] dark:text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
            Available Cutting Stock {stockList.length > 0 ? `(${stockList.length})` : ''}
          </span>
        </div>
      </div>

      <div className="scrollbar-thin flex gap-2.5 overflow-x-auto pb-2 pt-1">
        {stockList.map((card, idx) => (
          <button
            key={card.id || idx}
            type="button"
            onClick={() => onSelectCard(card)}
            className="flex min-w-[140px] cursor-pointer flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 shadow-sm transition-all hover:border-[#785600] hover:shadow-md dark:border-slate-700 dark:bg-slate-900 text-left"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#785600] dark:text-amber-400">
                {card.design || card.itemName || card.description || 'Cutting'} ({formatPurityNoTrailingZeros(card.purity)}%) {card.stamp ? `- ${card.stamp}` : ''}
              </span>
              {card.sourceProcess && (
                <span className="text-[10px] font-bold text-[#785600] bg-amber-500/10 px-1.5 py-0.5 rounded uppercase dark:text-amber-400 shrink-0">
                  From: {card.sourceProcess}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-sm font-bold text-black dark:text-white">
                {formatNumberDisplay(card.weight)} G
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
  );
};
