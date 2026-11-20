import React from 'react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {formatNumberDisplay, hasMeltingStatus, toNumber} from './tarUtils';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

interface HistoryTarProps {
  historyData: any[];
  historyTotals: {
    totalFine: number;
    totalTar: number;
    totalScrap: number;
    totalLoss: number;
    totalEntries: number;
  };
  tarHistoryLoading: boolean;
  dateRange: Date[];
  historyColumns: Column<any>[];
}

const HistoryTar: React.FC<HistoryTarProps> = ({
  historyData,
  historyTotals,
  tarHistoryLoading,
  dateRange,
  historyColumns,
}) => {
  const computedLossTotals = React.useMemo(() => {
    let totalExpected = 0;
    let totalDiff = 0;
    historyData.forEach((item) => {
      if (hasMeltingStatus(item)) return;
      const grossVal = toNumber(item.grosswt > 0 ? item.grosswt : item.fine);
      const details = evaluateLossDetails(
        grossVal,
        item.purity || 0,
        item.loss || 0,
        'tar',
        item.expectedLoss,
      );
      totalExpected += details.expectedLoss;
      totalDiff += details.diffLoss;
    });
    return {totalExpected, totalDiff};
  }, [historyData]);

  return (
    <div>
      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Fine
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(historyTotals.totalFine)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Tar
            </span>
            <span className="text-lg font-bold text-black dark:text-blue-400">
              {formatNumberDisplay(historyTotals.totalTar)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Scrap
            </span>
            <span className="text-lg font-bold text-black dark:text-green-400">
              {formatNumberDisplay(historyTotals.totalScrap)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Expected Loss
            </span>
            <span className="text-gray-800 dark:text-gray-200 text-lg font-bold">
              {formatNumberDisplay(computedLossTotals.totalExpected)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Actual Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-red-400">
              {formatNumberDisplay(historyTotals.totalLoss)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Diff Loss
            </span>
            <span
              className={`text-lg font-bold ${
                computedLossTotals.totalDiff > 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {formatNumberDisplay(computedLossTotals.totalDiff)} G
            </span>
          </div>
        </div>
      </div>

      {/* History Table */}
      <GenericTable
        data={historyData}
        columns={historyColumns}
        emptyMessage={
          dateRange.length === 2 && dateRange[0] && dateRange[1]
            ? `No history records found for the selected date range (${new Date(dateRange[0]).toLocaleDateString('en-IN')} to ${new Date(dateRange[1]).toLocaleDateString('en-IN')})`
            : 'No history records found. Complete a tar process to see history.'
        }
        isLoading={tarHistoryLoading}
        showSrNo={true}
        srNoLabel="Sr No."
        className="shadow-sm"
        rowClassName={(item: any) =>
          hasMeltingStatus(item)
            ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
            : ''
        }
      />
    </div>
  );
};

export default HistoryTar;
