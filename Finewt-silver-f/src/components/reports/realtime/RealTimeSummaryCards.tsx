import React from 'react';
import {formatNumberDisplay} from './realTimeGoldUtils';

interface RealTimeSummaryCardsProps {
  grandTotals: {
    grandTotalWeight: number;
    grandTotalFineWeight: number;
    avgPurity: string;
  };
}

export const RealTimeSummaryCards: React.FC<RealTimeSummaryCardsProps> = ({
  grandTotals,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {/* 1. Total Gross WT */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-2 text-center sm:p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wide sm:text-[10px] sm:tracking-wider text-black dark:text-slate-300">
            Total Gross WT
          </span>
          <span className="text-sm font-black sm:text-lg text-black dark:text-white">
            {formatNumberDisplay(grandTotals.grandTotalWeight)} G
          </span>
        </div>
      </div>

      {/* 2. Avg Purity */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-2 text-center sm:p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wide sm:text-[10px] sm:tracking-wider text-black dark:text-slate-300">
            Avg Purity
          </span>
          <span className="text-sm font-black sm:text-lg text-black dark:text-white">
            {grandTotals.avgPurity}%
          </span>
        </div>
      </div>

      {/* 3. Total Fine WT */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-2 text-center sm:p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-wide sm:text-[10px] sm:tracking-wider text-black dark:text-slate-300">
            Total Fine WT
          </span>
          <span className="text-sm font-black sm:text-lg text-black dark:text-white">
            {formatNumberDisplay(grandTotals.grandTotalFineWeight)} G
          </span>
        </div>
      </div>
    </div>
  );
};
