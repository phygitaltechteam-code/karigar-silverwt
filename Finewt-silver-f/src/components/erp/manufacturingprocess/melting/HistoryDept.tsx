import React from 'react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {
  formatDate,
  formatNumberDisplay,
  calculateExpectedFine,
} from './meltingUtils';
import {AlertRule} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

import {Printer} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

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
  // History columns
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
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'particular',
      header: 'Particular',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.particular || 'Scrap Melting'}
        </span>
      ),
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.grossWeight ?? item.grossWt ?? item.weight)}{' '}
          G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      ),
    },
    {
      key: 'expectedFine',
      header: 'Expected Fine (G)',
      render: (item) => {
        const gross = Number(
          item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
        );
        const purity = Number(item.purity ?? 0);
        const expected = Number(
          item.expected ??
            item.expectedFine ??
            calculateExpectedFine(gross, purity),
        );
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(expected)} G
          </span>
        );
      },
    },
    {
      key: 'fineWeight',
      header: 'Net Wt Given (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.fineWeight ?? item.fineWt ?? 0)} G
        </span>
      ),
    },
    {
      key: 'expectedLoss',
      header: 'Expected Loss (G)',
      render: (item) => {
        const gross = Number(
          item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
        );
        const purity = Number(item.purity ?? 0);
        const expected = Number(
          item.expected ??
            item.expectedFine ??
            calculateExpectedFine(gross, purity),
        );
        const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
        const loss =
          fine > 0
            ? Math.max(0, Math.round((expected - fine) * 1000) / 1000)
            : item.loss !== undefined && item.loss !== null
              ? Number(item.loss)
              : 0;
        const lossDetails = evaluateLossDetails(
          gross,
          purity,
          loss,
          'melting',
          (item as any).expectedLoss,
        );

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(lossDetails.expectedLoss)} G
          </span>
        );
      },
    },
    {
      key: 'actualLoss',
      header: 'Actual Loss (G)',
      render: (item) => {
        const gross = Number(
          item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
        );
        const purity = Number(item.purity ?? 0);
        const expected = Number(
          item.expected ??
            item.expectedFine ??
            calculateExpectedFine(gross, purity),
        );
        const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
        const loss =
          fine > 0
            ? Math.max(0, Math.round((expected - fine) * 1000) / 1000)
            : item.loss !== undefined && item.loss !== null
              ? Number(item.loss)
              : 0;

        return (
          <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
            {formatNumberDisplay(loss)} G
          </span>
        );
      },
    },
    {
      key: 'diffLoss',
      header: 'Diff Loss (G)',
      render: (item) => {
        const gross = Number(
          item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
        );
        const purity = Number(item.purity ?? 0);
        const expected = Number(
          item.expected ??
            item.expectedFine ??
            calculateExpectedFine(gross, purity),
        );
        const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
        const loss =
          fine > 0
            ? Math.max(0, Math.round((expected - fine) * 1000) / 1000)
            : item.loss !== undefined && item.loss !== null
              ? Number(item.loss)
              : 0;
        const lossDetails = evaluateLossDetails(
          gross,
          purity,
          loss,
          'melting',
          (item as any).expectedLoss,
        );

        return (
          <span className={`font-mono text-sm ${lossDetails.colorClass}`}>
            {formatNumberDisplay(lossDetails.diffLoss)} G
          </span>
        );
      },
    },
    {
      key: 'timeTaken',
      header: 'Gold Aging',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item?.timeTaken || '-'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Proceed Date & Time',
      render: (item) => {
        const {date, time} = formatDate(
          item.updatedAt ||
            item.updated_at ||
            item.proceedDateTime ||
            item.proceedDate ||
            item.createdAt,
        );
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
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
        fine > 0
          ? Math.max(0, Math.round((expectedFine - fine) * 1000) / 1000)
          : item.loss !== undefined && item.loss !== null
            ? Number(item.loss)
            : 0;
      const details = evaluateLossDetails(
        gross,
        purity,
        loss,
        'melting',
        (item as any).expectedLoss,
      );
      totalExpected += details.expectedLoss;
      totalDiff += details.diffLoss;
    });
    return {totalExpected, totalDiff};
  }, [historyData]);

  return (
    <div className="space-y-4">
      {onPrint && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Melting History Report ({historyData.length} records)
          </span>
          <GenericButton size="sm"
            type="button"
            onClick={onPrint}
            variant="primary"
            className="flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </GenericButton>
        </div>
      )}

      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Gross Wt
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(historyTotals.totalGross)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Fine Wt
            </span>
            <span className="text-lg font-bold text-black dark:text-green-400">
              {formatNumberDisplay(historyTotals.totalFine)} G
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

      <GenericTable
        data={historyData}
        columns={historyColumns}
        emptyMessage="No melting history found."
        isLoading={historyLoading}
        showSrNo={true}
        srNoLabel="Sr No."
      />
    </div>
  );
};

export default HistoryDept;
