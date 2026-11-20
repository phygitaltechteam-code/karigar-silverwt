import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';
import {
  hasMeltingStatus,
  formatNumberDisplay,
  formatDate,
  toNumber,
} from './solderingUtils';
import { AlertRule } from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';

interface HistorySolderingProps {
  filteredData: any[];
  historyLoading: boolean;
  fromDate: Date | null;
  toDate: Date | null;
  alertRules?: AlertRule[];
}

interface HistoryGroup {
  groupKey: string;
  date: string;
  time: string;
  rows: any[];
}

function groupHistoryData(data: any[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  const groupMap = new Map<string, HistoryGroup>();

  data.forEach((item) => {
    const groupKey = item.solderingId ?? item.id;
    const { date, time } = formatDate(item.createdAt);

    if (!groupMap.has(groupKey)) {
      const newGroup: HistoryGroup = { groupKey, date, time, rows: [] };
      groupMap.set(groupKey, newGroup);
      groups.push(newGroup);
    }

    groupMap.get(groupKey)!.rows.push(item);
  });

  return groups;
}

const HISTORY_COLUMNS = [
  { label: 'Sr No.', width: '4%' },
  { label: 'Date & Time', width: '8%' },
  { label: 'Size', width: '6%' },
  { label: 'Purity % (टंच)', width: '6%' },
  { label: 'Chain Given (G)', width: '8%' },
  { label: 'Chain Received (G)', width: '8%' },
  { label: 'Powder Given (G)', width: '7%' },
  { label: 'Increase %', width: '6%' },
  { label: 'Scrap (स्क्रॅप)', width: '7%' },
  { label: 'Expected Loss (G)', width: '8%' },
  { label: 'Actual Loss (G)', width: '8%' },
  { label: 'Diff Loss (G)', width: '8%' },
  { label: 'Gold Aging', width: '7%' },
  { label: 'Proceed Date & Time', width: '9%' },
];

const HistorySoldering: React.FC<HistorySolderingProps> = ({
  filteredData,
  historyLoading,
  fromDate,
  toDate,
  alertRules,
}) => {
  const groups = useMemo(() => groupHistoryData(filteredData), [filteredData]);

  const {
    totalChainWeight,
    totalChainReceived,
    totalPowder,
    totalScrap,
    totalExpected,
    totalActual,
    totalDiff,
  } = useMemo(() => {
    let chainWt = 0;
    let chainRec = 0;
    let powder = 0;
    let scrap = 0;
    let exp = 0;
    let act = 0;
    let diff = 0;

    filteredData.forEach((item: any) => {
      if (!hasMeltingStatus(item)) {
        chainWt += toNumber(item?.chainWeight);
        chainRec += toNumber(item?.chainReceived);
        powder += toNumber(item?.powder);
        scrap += toNumber(item?.scrap);

        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'soldering',
        );
        exp += details.expectedLoss;
        act += details.actualLoss;
        diff += details.diffLoss;
      }
    });

    return {
      totalChainWeight: Math.round(chainWt * 1000) / 1000,
      totalChainReceived: Math.round(chainRec * 1000) / 1000,
      totalPowder: Math.round(powder * 1000) / 1000,
      totalScrap: Math.round(scrap * 1000) / 1000,
      totalExpected: Math.round(exp * 1000) / 1000,
      totalActual: Math.round(act * 1000) / 1000,
      totalDiff: Math.round(diff * 1000) / 1000,
    };
  }, [filteredData, alertRules]);

  let globalSrNo = 0;

  return (
    <div>
      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Chain Given
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(totalChainWeight)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Chain Rec
            </span>
            <span className="text-lg font-bold text-black dark:text-blue-400">
              {formatNumberDisplay(totalChainReceived)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Powder
            </span>
            <span className="text-lg font-bold text-black dark:text-purple-400">
              {formatNumberDisplay(totalPowder)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Scrap
            </span>
            <span className="text-lg font-bold text-black dark:text-green-400">
              {formatNumberDisplay(totalScrap)} G
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
              {formatNumberDisplay(totalActual)} G
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

      {/* History Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-[#d3c4af]/30 shadow-sm dark:border-slate-700">
        <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed', minWidth: '1100px' }}>
          <colgroup>
            {HISTORY_COLUMNS.map((c, i) => (
              <col key={i} style={{ width: c.width }} />
            ))}
          </colgroup>

          {/* Header */}
          <thead>
            <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-[0.15em] text-white">
              {HISTORY_COLUMNS.map((c, i) => (
                <th
                  key={i}
                  className="border border-[#6a4c00]/30 px-3 py-3 text-center font-semibold lg:px-4"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
            {historyLoading ? (
              <tr>
                <td colSpan={HISTORY_COLUMNS.length} className="py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#785600] border-t-transparent" />
                    <span className="ml-3 text-sm text-[#785600] dark:text-amber-400">Loading history...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={HISTORY_COLUMNS.length} className="py-12 text-center text-[#817563] dark:text-slate-400">
                  {fromDate && toDate
                    ? `No history records found for the selected date range (${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()})`
                    : 'No history records found. Complete a soldering process to see history.'}
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                globalSrNo++;
                const groupSrNo = globalSrNo;
                const rowCount = group.rows.length;

                return (
                  <React.Fragment key={group.groupKey}>
                    {group.rows.map((item, rowIndex) => {
                      const isMelting = hasMeltingStatus(item);
                      const lossDetails = evaluateLossDetails(
                        item,
                        item?.purity,
                        item?.loss,
                        alertRules,
                        'soldering',
                      );

                      return (
                        <tr
                          key={item.id || rowIndex}
                          className={`transition-colors duration-150 ${
                            isMelting
                              ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
                              : 'bg-white hover:bg-[#f4f4f2]/50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Sr No. - rowSpan for group */}
                          {rowIndex === 0 && (
                            <td
                              rowSpan={rowCount}
                              className="border-r border-[#d3c4af]/30 bg-white px-3 py-3 text-center text-sm font-bold text-[#785600] align-middle dark:border-slate-700/50 dark:bg-slate-900 dark:text-amber-400"
                            >
                              {groupSrNo}
                            </td>
                          )}

                          {/* Date & Time - rowSpan for group */}
                          {rowIndex === 0 && (
                            <td
                              rowSpan={rowCount}
                              className="border-r border-[#d3c4af]/30 bg-white px-3 py-3 text-center text-sm text-[#1a1c1b] align-middle dark:border-slate-700/50 dark:bg-slate-900 dark:text-white"
                            >
                              <div className="font-semibold text-sm text-[#1a1c1b] dark:text-white">
                                {group.date}
                              </div>
                              {group.time && (
                                <div className="text-sm font-normal text-[#1a1c1b] dark:text-white">
                                  {group.time}
                                </div>
                              )}
                            </td>
                          )}

                          {/* Size */}
                          <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center text-sm text-[#1a1c1b] dark:border-slate-700/50 dark:text-white">
                            {typeof item?.size === 'object'
                              ? item.size?.size ?? '-'
                              : item?.size ?? item?.sizeName ?? '-'}
                          </td>

                          {/* Purity */}
                          <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                              {formatNumberDisplay(item.purity)}%
                            </span>
                          </td>

                          {isMelting ? (
                            <td colSpan={8} className="px-3 py-3 text-center">
                              <div className="flex items-center justify-center">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                  Melting
                                </span>
                              </div>
                            </td>
                          ) : (
                            <>
                              {/* Chain Given */}
                              <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                                <span className="font-mono text-sm font-medium text-[#1a1c1b] dark:text-white">
                                  {formatNumberDisplay(item.chainWeight)} G
                                </span>
                              </td>

                              {/* Chain Received */}
                              <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                                  {formatNumberDisplay(item.chainReceived)} G
                                </span>
                              </td>

                              {/* Powder */}
                              <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                                  {formatNumberDisplay(item.powder)} G
                                </span>
                              </td>

                              {/* Increase */}
                              <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                                  {formatNumberDisplay(item.increase)} %
                                </span>
                              </td>

                              {/* Scrap */}
                              <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                                  {formatNumberDisplay(item.scrap)} G
                                </span>
                              </td>

                              {/* Expected Loss */}
                              <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                                <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                                  {formatNumberDisplay(lossDetails.expectedLoss)} G
                                </span>
                              </td>

                              {/* Actual Loss */}
                              <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                                <span className={`font-mono text-sm ${lossDetails.colorClass}`}>
                                  {formatNumberDisplay(lossDetails.actualLoss)} G
                                </span>
                              </td>

                              {/* Diff Loss */}
                              <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                                <span className={`font-mono text-sm ${lossDetails.colorClass}`}>
                                  {lossDetails.diffLoss > 0
                                    ? `+${formatNumberDisplay(lossDetails.diffLoss)}`
                                    : formatNumberDisplay(lossDetails.diffLoss)}{' '}
                                  G
                                </span>
                              </td>
                            </>
                          )}

                          {/* Gold Aging */}
                          <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                              {item?.timeTaken || '-'}
                            </span>
                          </td>

                          {/* Proceed Date & Time */}
                          <td className="px-3 py-3 text-center">
                            {(() => {
                              const { date: pDate, time: pTime } = formatDate(
                                item.updatedAt || item.createdAt,
                              );
                              return (
                                <div className="flex flex-col items-center">
                                  <span className="text-sm text-[#1a1c1b] dark:text-white">
                                    {pDate}
                                  </span>
                                  {pTime && (
                                    <span className="text-sm text-[#1a1c1b] dark:text-white">
                                      {pTime}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorySoldering;
