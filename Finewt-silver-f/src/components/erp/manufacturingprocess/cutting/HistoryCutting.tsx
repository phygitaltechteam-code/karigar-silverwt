import React, {useMemo} from 'react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {
  formatNumberDisplay,
  hasMeltingStatus,
  getHistoryCuttingColumns,
  toNumber,
} from './cuttingUtils';
import {AlertRule} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

interface HistoryCuttingProps {
  filteredData?: any[];
  historyData?: any[];
  historyTotals?: {
    totalGiven: number;
    totalReceived: number;
    totalScrap: number;
    totalLoss: number;
  };
  historyLoading?: boolean;
  dateRange?: Date[];
  historyColumns?: Column<any>[];
  alertRules?: AlertRule[];
}

const HistoryCutting: React.FC<HistoryCuttingProps> = ({
  filteredData,
  historyData,
  historyTotals,
  historyLoading = false,
  dateRange = [],
  historyColumns,
  alertRules,
}) => {
  const data = filteredData || historyData || [];
  const columns = useMemo(
    () => historyColumns || getHistoryCuttingColumns(alertRules),
    [historyColumns, alertRules],
  );

  const computedTotals = useMemo(() => {
    if (historyTotals) return historyTotals;
    return data.reduce(
      (acc: any, item: any) => ({
        totalGiven:
          acc.totalGiven + toNumber(item?.chainGiven || item?.chainWeight),
        totalReceived: acc.totalReceived + toNumber(item?.chainReceived),
        totalScrap: acc.totalScrap + toNumber(item?.scrap),
        totalLoss: acc.totalLoss + toNumber(item?.loss),
      }),
      {totalGiven: 0, totalReceived: 0, totalScrap: 0, totalLoss: 0},
    );
  }, [data, historyTotals]);

  const {totalExpected, totalDiff} = useMemo(() => {
    let exp = 0;
    let diff = 0;
    data.forEach((item: any) => {
      if (!hasMeltingStatus(item)) {
        const details = evaluateLossDetails(
          item?.chainWeight ?? item?.chainGiven,
          item?.purity,
          item?.loss,
          alertRules,
          'cutting',
        );
        exp += details.expectedLoss;
        diff += details.diffLoss;
      }
    });
    return {
      totalExpected: Math.round(exp * 1000) / 1000,
      totalDiff: Math.round(diff * 1000) / 1000,
    };
  }, [data, alertRules]);

  return (
    <div>
      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Chain Given
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(computedTotals.totalGiven)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Chain Received
            </span>
            <span className="text-lg font-bold text-black dark:text-blue-400">
              {formatNumberDisplay(computedTotals.totalReceived)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Scrap
            </span>
            <span className="text-lg font-bold text-black dark:text-green-400">
              {formatNumberDisplay(computedTotals.totalScrap)} G
            </span>
          </div>
        </div>
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
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Actual Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-red-400">
              {formatNumberDisplay(computedTotals.totalLoss)} G
            </span>
          </div>
        </div>
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

      {/* History Table */}
      <GenericTable
        data={data}
        columns={columns}
        emptyMessage={
          dateRange.length === 2 && dateRange[0] && dateRange[1]
            ? `No history records found for the selected date range (${new Date(
                dateRange[0],
              ).toLocaleDateString('en-IN')} to ${new Date(
                dateRange[1],
              ).toLocaleDateString('en-IN')})`
            : 'No history records found.'
        }
        isLoading={historyLoading}
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

export default HistoryCutting;
