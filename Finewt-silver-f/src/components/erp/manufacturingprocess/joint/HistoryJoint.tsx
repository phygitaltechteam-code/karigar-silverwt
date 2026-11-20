import React, {useMemo} from 'react';
import {GenericTable} from '@/components/Forms/Table/GenericTable';
import {
  getHistoryJointColumns,
  hasMeltingStatus,
  formatNumberDisplay,
} from './jointUtils';
import {AlertRule} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

interface HistoryJointProps {
  filteredData: any[];
  historyLoading: boolean;
  dateRange: Date[];
  historyTotals: {
    totalGiven: number;
    totalReceived: number;
    totalPowder: number;
    totalPowderReceived: number;
    totalScrap: number;
    totalLoss: number;
  };
  alertRules?: AlertRule[];
}

const HistoryJoint: React.FC<HistoryJointProps> = ({
  filteredData,
  historyLoading,
  dateRange,
  historyTotals,
  alertRules,
}) => {
  const historyColumns = useMemo(
    () => getHistoryJointColumns(alertRules),
    [alertRules],
  );

  const {totalExpected, totalDiff} = useMemo(() => {
    let exp = 0;
    let diff = 0;
    filteredData.forEach((item: any) => {
      if (!hasMeltingStatus(item)) {
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'joint',
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
      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Chain Given
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(historyTotals.totalGiven)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Chain Received
            </span>
            <span className="text-lg font-bold text-black dark:text-blue-400">
              {formatNumberDisplay(historyTotals.totalReceived)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Powder Given
            </span>
            <span className="text-lg font-bold text-black dark:text-purple-400">
              {formatNumberDisplay(historyTotals.totalPowder)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Powder Received
            </span>
            <span className="text-lg font-bold text-black dark:text-indigo-400">
              {formatNumberDisplay(historyTotals.totalPowderReceived)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              SCRP
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

      <GenericTable
        data={filteredData}
        columns={historyColumns}
        emptyMessage={
          dateRange.length === 2
            ? `No history records found for the selected date range (${new Date(dateRange[0]).toLocaleDateString('en-IN')} to ${new Date(dateRange[1]).toLocaleDateString('en-IN')})`
            : 'No history records found. Complete a joint process to see history.'
        }
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

export default HistoryJoint;
