import React, {useMemo} from 'react';
import {Column} from '@/components/Forms/Table/GenericTable';
import {formatNumberDisplay, hasMeltingStatus} from './boxUtils';
import {evaluateLossDetails} from '@/utils/lossReportHelper';
import BoxHistoryGroupedTable from './BoxHistoryGroupedTable';

interface HistoryBoxProps {
  historyData: any[];
  historyTotals: {
    totalTar: number;
    totalChain: number;
    totalScrap: number;
    totalLoss: number;
  };
  historyLoading: boolean;
  dateRange: Date[];
  historyColumns: Column<any>[];
}

const HistoryBox: React.FC<HistoryBoxProps> = ({
  historyData,
  historyTotals,
  historyLoading,
  dateRange,
  historyColumns,
}) => {
  const {totalExpected, totalDiff} = useMemo(() => {
    let exp = 0;
    let diff = 0;
    historyData.forEach((item: any) => {
      if (!hasMeltingStatus(item)) {
        const lossVal =
          item?.loss ?? (item?.tarWeight || 0) - (item?.chainWeight || 0);
        const details = evaluateLossDetails(
          item?.tarWeight,
          item?.purity,
          lossVal,
          undefined,
          'box',
        );
        exp += details.expectedLoss;
        diff += details.diffLoss;
      }
    });
    return {
      totalExpected: Math.round(exp * 1000) / 1000,
      totalDiff: Math.round(diff * 1000) / 1000,
    };
  }, [historyData]);

  return (
    <div>
      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Tar
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(historyTotals.totalTar)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Chain Weight
            </span>
            <span className="text-lg font-bold text-black dark:text-blue-400">
              {formatNumberDisplay(historyTotals.totalChain)} G
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
              Total Expected Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(totalExpected)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Actual Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-red-400">
              {formatNumberDisplay(historyTotals.totalLoss)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Diff Loss
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

      {/* Grouped History Table */}
      <BoxHistoryGroupedTable
        data={historyData}
        isLoading={historyLoading}
      />
    </div>
  );
};

export default HistoryBox;
