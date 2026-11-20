import React, {useMemo} from 'react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {
  getHistorySKundaColumns,
  hasMeltingStatus,
  formatNumberDisplay,
  toNumber,
} from './sKundaUtils';
import {AlertRule} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

interface HistorySKundaProps {
  filteredData: any[];
  historyTotals: {
    totalGiven: number;
    totalKundaGiven: number;
    totalReceived: number;
    totalScrap: number;
    totalLoss: number;
  };
  historyLoading: boolean;
  alertRules?: AlertRule[];
  historyColumns?: Column<any>[];
}

const HistorySKunda: React.FC<HistorySKundaProps> = ({
  filteredData,
  historyTotals,
  historyLoading,
  alertRules,
  historyColumns,
}) => {
  const columns = useMemo(
    () => historyColumns || getHistorySKundaColumns(alertRules),
    [historyColumns, alertRules],
  );

  const {totalExpected, totalDiff} = useMemo(() => {
    let exp = 0;
    let diff = 0;
    filteredData.forEach((item: any) => {
      if (!hasMeltingStatus(item)) {
        const inputVal =
          toNumber(item?.chainGiven || item?.chainWeight || 0) +
          toNumber(item?.kundaGiven || item?.kunda || 0);
        const details = evaluateLossDetails(
          inputVal,
          item?.purity,
          item?.loss,
          alertRules,
          'skunda',
        );
        exp += details.expectedLoss;
        diff += details.diffLoss;
      }
    });
    return {
      totalExpected: Math.round(exp * 1000) / 1000,
      totalDiff: Math.round(diff * 1000) / 1000,
    };
  }, [filteredData, alertRules]);

  return (
    <div>
      {/* Summary Cards - History Totals */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {/* Chain Given */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Chain Given
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(historyTotals.totalGiven)} G
            </span>
          </div>
        </div>

        {/* S/Kunda Given */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              S/Kunda Given
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-500">
              {formatNumberDisplay(historyTotals.totalKundaGiven)} G
            </span>
          </div>
        </div>

        {/* Chain Received */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Chain Received
            </span>
            <span className="text-lg font-bold text-black dark:text-blue-400">
              {formatNumberDisplay(historyTotals.totalReceived)} G
            </span>
          </div>
        </div>

        {/* Scrap */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Scrap
            </span>
            <span className="text-lg font-bold text-black dark:text-green-400">
              {formatNumberDisplay(historyTotals.totalScrap)} G
            </span>
          </div>
        </div>

        {/* Expected Loss */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Expected Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-300">
              {formatNumberDisplay(totalExpected)} G
            </span>
          </div>
        </div>

        {/* Actual Loss */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Actual Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-red-400">
              {formatNumberDisplay(historyTotals.totalLoss)} G
            </span>
          </div>
        </div>

        {/* Diff Loss */}
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Diff Loss
            </span>
            <span
              className={`text-lg font-bold ${
                totalDiff > 0
                  ? 'text-red-600 dark:text-red-400'
                  : totalDiff < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-black dark:text-slate-300'
              }`}
            >
              {totalDiff > 0
                ? `+${formatNumberDisplay(totalDiff)}`
                : formatNumberDisplay(totalDiff)}{' '}
              G
            </span>
          </div>
        </div>
      </div>

      <GenericTable
        data={filteredData}
        columns={columns}
        emptyMessage="No history records found for the selected date range."
        isLoading={historyLoading}
        showSrNo={true}
        srNoLabel="Sr No."
        className="shadow-sm"
        rowClassName={(item) =>
          hasMeltingStatus(item)
            ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
            : ''
        }
      />
    </div>
  );
};

export default HistorySKunda;
