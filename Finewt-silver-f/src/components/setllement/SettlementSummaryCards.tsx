import React from 'react';
import {Users, Clock, CheckCircle, Wallet} from 'lucide-react';
import {formatNumber} from './settlementUtils';

interface SettlementSummaryCardsProps {
  totalClients: number;
  totalPending: number;
  totalSettled: number;
  netBalance: number;
}

export const SettlementSummaryCards: React.FC<SettlementSummaryCardsProps> = ({
  totalClients,
  totalPending,
  totalSettled,
  netBalance,
}) => {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 lg:grid-cols-4">
      {/* TOTAL CLIENTS */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Clients
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {totalClients}
            </span>
          </div>
          <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-blue-700/30 dark:bg-blue-900/30">
            <Users className="h-4 w-4 text-[#785600] dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* PENDING SETTLEMENTS */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Pending Settlements
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {totalPending}
            </span>
          </div>
          <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-yellow-700/30 dark:bg-yellow-900/30">
            <Clock className="h-4 w-4 text-[#785600] dark:text-yellow-400" />
          </div>
        </div>
      </div>

      {/* SETTLED */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Settled
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {totalSettled}
            </span>
          </div>
          <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-green-700/30 dark:bg-green-900/30">
            <CheckCircle className="h-4 w-4 text-[#785600] dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* NET BALANCE */}
      <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Net Balance
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {formatNumber(netBalance)} G
            </span>
          </div>
          <div className="rounded-full border border-[#785600]/20 bg-[#785600]/10 p-2 dark:border-amber-700/30 dark:bg-amber-900/30">
            <Wallet className="h-4 w-4 text-[#785600] dark:text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
