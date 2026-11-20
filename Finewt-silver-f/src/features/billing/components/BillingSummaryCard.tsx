import React from 'react';
import {formatNumberDisplay} from '@/utils/tableFormatters';

export interface BillingSummaryCardProps {
  totalGrossWt: number;
  totalFineWt: number;
  totalSRP?: number;
  customerWeight?: number;
  previousDue?: number;
  newBalance?: number;
  showSRP?: boolean;
}

export const BillingSummaryCard: React.FC<BillingSummaryCardProps> = ({
  totalGrossWt,
  totalFineWt,
  totalSRP = 0,
  customerWeight = 0,
  previousDue = 0,
  newBalance = 0,
  showSRP = true,
}) => {
  return (
    <div className="rounded-xl border border-[#d3c4af]/30 bg-[#faf9f6] p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
        Bill Calculation Summary
      </h3>
      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-slate-800">
          <span className="text-gray-500 text-[10px] font-semibold dark:text-slate-400">
            Total Gross WT
          </span>
          <p className="font-mono text-sm font-bold text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(totalGrossWt)} G
          </p>
        </div>

        <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-slate-800">
          <span className="text-gray-500 text-[10px] font-semibold dark:text-slate-400">
            Total Fine WT
          </span>
          <p className="font-mono text-sm font-bold text-[#785600] dark:text-amber-400">
            {formatNumberDisplay(totalFineWt)} G
          </p>
        </div>

        {showSRP && (
          <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-slate-800">
            <span className="text-gray-500 text-[10px] font-semibold dark:text-slate-400">
              Total Wastage
            </span>
            <p className="font-mono text-sm font-bold text-[#1a1c1b] dark:text-white">
              {formatNumberDisplay(totalSRP, 2, 2)}
            </p>
          </div>
        )}

        <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-slate-800">
          <span className="text-gray-500 text-[10px] font-semibold dark:text-slate-400">
            Customer WT
          </span>
          <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
            {formatNumberDisplay(customerWeight)} G
          </p>
        </div>

        <div className="rounded-lg bg-white p-2.5 shadow-sm dark:bg-slate-800">
          <span className="text-gray-500 text-[10px] font-semibold dark:text-slate-400">
            Previous Due
          </span>
          <p className="font-mono text-gray-700 text-sm font-bold dark:text-slate-300">
            {formatNumberDisplay(previousDue)} G
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 p-2.5 shadow-sm dark:bg-amber-950/40">
          <span className="text-[10px] font-bold text-[#785600] dark:text-amber-400">
            Total Balance Due
          </span>
          <p className="font-mono text-sm font-extrabold text-[#785600] dark:text-amber-300">
            {formatNumberDisplay(newBalance)} G
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingSummaryCard;
