import React from 'react';
import { Flame } from 'lucide-react';
import { BharniStockCard } from './BharniModal';
import { formatNumberDisplay } from './bharniUtils';

interface BharniStockStripProps {
  stockCards: BharniStockCard[];
  onSelectCard: (card: BharniStockCard) => void;
}

export const BharniStockStrip: React.FC<BharniStockStripProps> = ({
  stockCards,
  onSelectCard,
}) => {
  if (stockCards.length === 0) return null;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-[#785600] dark:text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
            Silver Stock Available for Bharni Process
          </span>
        </div>
      </div>

      {/* Scrollable Stock Cards */}
      <div className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600 flex gap-2 overflow-x-auto pb-2 pt-1">
        {stockCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectCard(card)}
            className="flex min-w-[140px] flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 shadow-sm transition-all hover:border-[#785600] hover:shadow-md dark:border-slate-700 dark:bg-slate-900 cursor-pointer text-left"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#785600] dark:text-amber-400">
                {card.design || card.description || 'Bharni'} ({card.purity}%) {card.stamp ? `- ${card.stamp}` : ''}
              </span>
              {card.sourceProcess && (
                <span className="text-[10px] font-bold text-[#785600] bg-amber-500/10 px-1.5 py-0.5 rounded uppercase dark:text-amber-400 shrink-0">
                  From: {card.sourceProcess}
                </span>
              )}
            </div>
            {(card.partNo || card.karigar) && (
              <span className="mt-0.5 text-[10px] font-semibold text-[#4f4535] dark:text-slate-400">
                {card.partNo ? `Part ${card.partNo}` : ''}
                {card.partNo && card.karigar ? ' · ' : ''}
                {card.karigar || ''}
              </span>
            )}
            <span className="mt-0.5 font-mono text-sm font-bold text-black dark:text-white">
              {formatNumberDisplay(card.totalWeight)} G
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
