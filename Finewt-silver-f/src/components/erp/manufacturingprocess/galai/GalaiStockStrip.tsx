import React from 'react';
import { Package } from 'lucide-react';
import { formatNumberDisplay } from './galaiUtils';

interface GalaiStockStripProps {
  galaiStockCards: Array<{
    id: string;
    purity: number;
    stamp?: string;
    Stamp?: string;
    availableWeight: number;
    totalWeight?: number;
  }>;
  onSelectCard: (card: any) => void;
}

export const GalaiStockStrip: React.FC<GalaiStockStripProps> = ({
  galaiStockCards,
  onSelectCard,
}) => {
  if (galaiStockCards.length === 0) return null;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[#785600] dark:text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
            Galai Stock Available ({galaiStockCards.length})
          </span>
        </div>
      </div>
      <div className="scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 flex gap-2 overflow-x-auto pb-2 pt-1">
        {galaiStockCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectCard(card)}
            className="flex min-w-[140px] flex-col items-start rounded-xl border border-[#d3c4af]/30 bg-white px-4 py-3 shadow-sm transition-all hover:border-[#785600]/60 cursor-pointer dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-medium text-[#1a1c1b] dark:text-slate-200">
                Galai Silver ({card.purity}%) {card.Stamp || card.stamp ? `- ${card.Stamp || card.stamp}` : ''}
              </span>
            </div>
            <span className="mt-0.5 font-mono text-sm font-bold text-black dark:text-white">
              {formatNumberDisplay(card.availableWeight)} G
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
