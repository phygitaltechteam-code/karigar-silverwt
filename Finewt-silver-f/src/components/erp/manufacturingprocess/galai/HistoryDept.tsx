import React from 'react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {
  formatDate,
  formatNumberDisplay,
  calculateExpectedFine,
  GalaiLossCell,
} from './galaiUtils';
import {AlertRule} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

interface HistoryDeptProps {
  historyData: any[];
  historyTotals: {
    totalGross: number;
    totalExpected: number;
    totalFine: number;
    totalLoss: number;
  };
  historyLoading: boolean;
  alertRules?: AlertRule[];
  onPrint?: () => void;
}

const HistoryDept: React.FC<HistoryDeptProps> = ({
  historyData,
  historyTotals,
  historyLoading,
  alertRules,
  onPrint,
}) => {
  // History columns strictly matching active Galai Process table
  const historyColumns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        const {date, time} = formatDate(
          item.createdAt || item.dateTime || item.created_at,
        );
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <div className="flex items-center justify-center">
          <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
            {formatNumberDisplay(item.purity)}%
          </span>
        </div>
      ),
    },
    {
      key: 'fineWeight',
      header: 'Net Wt Given (G)',
      render: (item) => (
        <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
          {formatNumberDisplay(item.grossWt ?? item.grossWeight ?? item.expectedFine ?? 0)} G
        </span>
      ),
    },
    {
      key: 'netWeight',
      header: 'Net Wt Received (G)',
      render: (item) => (
        <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
          {formatNumberDisplay(item.netWeight ?? item.fineWeight ?? item.fineWt ?? 0)} G
        </span>
      ),
    },
    {
      key: 'scrapWeight',
      header: 'Scrap (G)',
      render: (item) => (
        <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
          {formatNumberDisplay(item.scrapWeight ?? item.scrapWt ?? 0)} G
        </span>
      ),
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => (
        <GalaiLossCell
          given={Number(item.grossWt ?? item.grossWeight ?? item.expectedFine ?? 0)}
          purity={Number(item.purity ?? 0)}
          loss={Number(item.loss ?? 0)}
          alertRules={alertRules}
          expectedLoss={(item as any).expectedLoss}
        />
      ),
    },
  ];

  const computedLossTotals = React.useMemo(() => {
    let totalExpected = 0;
    let totalDiff = 0;
    historyData.forEach((item) => {
      const gross = Number(
        item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
      );
      const purity = Number(item.purity ?? 0);
      const expectedFine = Number(
        item.expected ??
          item.expectedFine ??
          calculateExpectedFine(gross, purity),
      );
      const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
      const loss =
        item.loss !== undefined && item.loss !== null
          ? Number(item.loss)
          : fine > 0
            ? Math.max(0, Math.round((expectedFine - fine) * 1000) / 1000)
            : 0;
      const details =
        alertRules && alertRules.length > 0
          ? evaluateLossDetails(gross, purity, loss, alertRules, 'Galai')
          : evaluateLossDetails(gross, purity, loss, 'Galai', (item as any).expectedLoss);
      totalExpected += details.expectedLoss;
      totalDiff += details.diffLoss;
    });
    return {totalExpected, totalDiff};
  }, [historyData, alertRules]);

  return (
    <div className="space-y-4">
      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Gross Wt
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {formatNumberDisplay(historyTotals.totalGross)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Fine Wt
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {formatNumberDisplay(historyTotals.totalFine)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Expected Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
              {formatNumberDisplay(computedLossTotals.totalExpected)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Actual Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-white">
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
              className="text-lg font-bold text-black dark:text-white"
            >
              {formatNumberDisplay(computedLossTotals.totalDiff)} G
            </span>
          </div>
        </div>
      </div>

      <GenericTable
        data={historyData}
        columns={historyColumns}
        emptyMessage="No Galai history found."
        isLoading={historyLoading}
        showSrNo={true}
        srNoLabel="Sr No."
      />
    </div>
  );
};

export default HistoryDept;
