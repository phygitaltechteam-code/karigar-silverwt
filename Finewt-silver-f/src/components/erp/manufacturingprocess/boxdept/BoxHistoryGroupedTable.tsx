import React, { useMemo } from 'react';
import { evaluateLossDetails } from '@/utils/lossReportHelper';
import { formatNumberDisplay, hasMeltingStatus } from './boxUtils';
import { useGetProcessAlert, AlertRule } from '@/lib/api/alertmanagement';
import { Flame } from 'lucide-react';

interface BoxHistoryGroupedTableProps {
  data: any[];
  isLoading?: boolean;
}

interface GroupedHistoryItem {
  id: string;
  srNo: number;
  dateTime: string;
  purity: number;
  tarWeight: number;
  items: any[];
  proceedDateTime?: string;
  timeTaken?: string;
}

export const BoxHistoryGroupedTable: React.FC<BoxHistoryGroupedTableProps> = ({
  data,
  isLoading,
}) => {
  const { data: boxAlertRaw } = useGetProcessAlert('box');

  const alertRules: AlertRule[] = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(boxAlertRaw) && boxAlertRaw.length > 0) {
      list = boxAlertRaw;
    } else if (boxAlertRaw && typeof boxAlertRaw === 'object') {
      if (Array.isArray((boxAlertRaw as any).data)) {
        list = (boxAlertRaw as any).data;
      } else if ((boxAlertRaw as any).grossWt !== undefined) {
        list = [boxAlertRaw];
      }
    }
    return list;
  }, [boxAlertRaw]);

  const groupedData: GroupedHistoryItem[] = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const breakMap = new Map<string, any[]>();
    const orderedGroups: { type: 'break' | 'single'; id: string; items: any[] }[] = [];

    data.forEach((item) => {
      const bId = item?.breakId;
      if (bId) {
        if (!breakMap.has(bId)) {
          const groupItems: any[] = [];
          breakMap.set(bId, groupItems);
          orderedGroups.push({ type: 'break', id: bId, items: groupItems });
        }
        breakMap.get(bId)!.push(item);
      } else {
        orderedGroups.push({
          type: 'single',
          id: item?.id || String(Math.random()),
          items: [item],
        });
      }
    });

    return orderedGroups.map((group, index) => {
      const items = group.items;
      const first = items[0] || {};
      const maxTarWeight = Math.max(
        ...items.map((i) => Number(i.tarWeight || 0)),
      );

      const createdDateVal = first.createdAt;
      const proceedDateVal =
        first.updatedAt || first.proceedDateTime || first.updated_at;

      const formattedCreatedDate = createdDateVal
        ? new Date(createdDateVal).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        : '-';

      const formattedProceedDate = proceedDateVal
        ? new Date(proceedDateVal).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        : formattedCreatedDate;

      const calculateGoldAging = () => {
        if (first.timeTaken && first.timeTaken !== '-') return first.timeTaken;
        if (!createdDateVal || !proceedDateVal) return '-';
        const start = new Date(createdDateVal).getTime();
        const end = new Date(proceedDateVal).getTime();
        if (isNaN(start) || isNaN(end) || end < start) return '0h 0m';
        const diffMinutes = Math.floor((end - start) / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        if (days > 0) return `${days}d ${remHours}h ${minutes}m`;
        return `${hours}h ${minutes}m`;
      };

      return {
        id: group.id,
        srNo: index + 1,
        dateTime: formattedCreatedDate,
        purity: Number(first.purity || 0),
        tarWeight: maxTarWeight,
        items,
        proceedDateTime: formattedProceedDate,
        timeTaken: calculateGoldAging(),
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-[#f9f9f7] dark:bg-slate-950">
        <div className="overflow-hidden border border-[#d3c4af]/10 bg-white p-8 text-center text-[#4f4535] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Loading history data...
        </div>
      </div>
    );
  }

  if (groupedData.length === 0) {
    return (
      <div className="bg-[#f9f9f7] dark:bg-slate-950">
        <div className="overflow-hidden border border-[#d3c4af]/10 bg-white p-12 text-center text-[#4f4535] shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No history records found.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="overflow-hidden border border-[#d3c4af]/10 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-[0.15em] text-white">
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  SR NO
                </th>
                <th className="border-r border-[#d3c4af]/20 px-4 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  DATE & TIME
                </th>
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  PURITY (%)
                </th>
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  TAR WEIGHT (G)
                </th>
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  CHAIN WEIGHT (G)
                </th>
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  SCRAP (G)
                </th>
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  EXPECTED LOSS (G)
                </th>
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  ACTUAL LOSS (G)
                </th>
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  DIFF LOSS (G)
                </th>
                <th className="border-r border-[#d3c4af]/20 px-3 py-3 font-semibold dark:border-slate-700/60 lg:px-4">
                  GOLD AGING
                </th>
                <th className="px-3 py-3 font-semibold lg:px-4">
                  PROCEED DATE & TIME
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
              {groupedData.map((group, groupIdx) => {
                const rowCount = group.items.length;
                const rowBg =
                  groupIdx % 2 === 0
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-[#f8f6f4] dark:bg-slate-800/60';

                return group.items.map((subItem, idx) => {
                  const isFirst = idx === 0;
                  const isLastInGroup = idx === rowCount - 1;

                  const lossVal =
                    subItem?.loss ??
                    (subItem?.tarWeight || 0) - (subItem?.chainWeight || 0);
                  const details = evaluateLossDetails(
                    subItem?.tarWeight || group.tarWeight,
                    subItem?.purity || group.purity,
                    lossVal,
                    alertRules,
                    'box',
                  );

                  const isMelting = hasMeltingStatus(subItem);

                  return (
                    <tr
                      key={subItem.id || `${group.id}-${idx}`}
                      className={`group transition-colors duration-150 ${rowBg} hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50`}
                    >
                      {/* Left columns - Spanned vertically across all items in group */}
                      {isFirst && (
                        <>
                          <td
                            rowSpan={rowCount}
                            className="border-b border-r border-[#d3c4af]/20 px-3 py-3 text-xs font-semibold text-[#1a1c1b] align-middle dark:border-slate-700 dark:text-[#986d00] sm:text-sm lg:px-4"
                          >
                            {group.srNo}
                          </td>
                          <td
                            rowSpan={rowCount}
                            className="border-b border-r border-[#d3c4af]/20 px-4 py-3 text-sm text-[#1a1c1b] align-middle dark:border-slate-700 dark:text-white lg:px-4"
                          >
                            {group.dateTime}
                          </td>
                          <td
                            rowSpan={rowCount}
                            className="border-b border-r border-[#d3c4af]/20 px-3 py-3 font-mono text-sm text-[#1a1c1b] align-middle dark:border-slate-700 dark:text-white lg:px-4"
                          >
                            {formatNumberDisplay(group.purity)}%
                          </td>
                          <td
                            rowSpan={rowCount}
                            className="border-b border-r border-[#d3c4af]/20 px-3 py-3 font-mono text-sm font-semibold text-[#1a1c1b] align-middle dark:border-slate-700 dark:text-amber-400 lg:px-4"
                          >
                            {formatNumberDisplay(group.tarWeight)} G
                          </td>
                        </>
                      )}

                      {/* Right columns - Individual sub-row values */}
                      {isMelting ? (
                        <td
                          colSpan={5}
                          className={`border-r border-[#d3c4af]/20 px-3 py-3 dark:border-slate-700 lg:px-4 ${
                            !isLastInGroup
                              ? 'border-b border-[#f4f4f2] dark:border-slate-800'
                              : 'border-b border-[#d3c4af]/20 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-center py-0.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              Melting
                            </span>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td
                            className={`border-r border-[#d3c4af]/20 px-3 py-3 font-mono text-sm text-[#1a1c1b] dark:border-slate-700 dark:text-white lg:px-4 ${
                              !isLastInGroup
                                ? 'border-b border-[#f4f4f2] dark:border-slate-800'
                                : 'border-b border-[#d3c4af]/20 dark:border-slate-700'
                            }`}
                          >
                            {formatNumberDisplay(subItem.chainWeight)} G
                          </td>
                          <td
                            className={`border-r border-[#d3c4af]/20 px-3 py-3 font-mono text-sm text-[#1a1c1b] dark:border-slate-700 dark:text-white lg:px-4 ${
                              !isLastInGroup
                                ? 'border-b border-[#f4f4f2] dark:border-slate-800'
                                : 'border-b border-[#d3c4af]/20 dark:border-slate-700'
                            }`}
                          >
                            {formatNumberDisplay(subItem.scrap)} G
                          </td>
                          <td
                            className={`border-r border-[#d3c4af]/20 px-3 py-3 font-mono text-sm text-[#1a1c1b] dark:border-slate-700 dark:text-white lg:px-4 ${
                              !isLastInGroup
                                ? 'border-b border-[#f4f4f2] dark:border-slate-800'
                                : 'border-b border-[#d3c4af]/20 dark:border-slate-700'
                            }`}
                          >
                            {formatNumberDisplay(details.expectedLoss)} G
                          </td>
                          <td
                            className={`border-r border-[#d3c4af]/20 px-3 py-3 font-mono text-sm dark:border-slate-700 lg:px-4 ${details.colorClass} ${
                              !isLastInGroup
                                ? 'border-b border-[#f4f4f2] dark:border-slate-800'
                                : 'border-b border-[#d3c4af]/20 dark:border-slate-700'
                            }`}
                          >
                            {formatNumberDisplay(details.actualLoss)} G
                          </td>
                          <td
                            className={`border-r border-[#d3c4af]/20 px-3 py-3 font-mono text-sm dark:border-slate-700 lg:px-4 ${
                              details.diffLoss > 0
                                ? 'font-semibold text-red-600 dark:text-red-400'
                                : details.diffLoss < 0
                                  ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                                  : 'text-[#1a1c1b] dark:text-white'
                            } ${
                              !isLastInGroup
                                ? 'border-b border-[#f4f4f2] dark:border-slate-800'
                                : 'border-b border-[#d3c4af]/20 dark:border-slate-700'
                            }`}
                          >
                            {details.diffLoss > 0
                              ? `+${formatNumberDisplay(details.diffLoss)}`
                              : formatNumberDisplay(details.diffLoss)}{' '}
                            G
                          </td>
                        </>
                      )}

                      {/* Gold Aging & Proceed Date - Individual per row */}
                      <td
                        className={`border-r border-[#d3c4af]/20 px-3 py-3 text-sm text-[#1a1c1b] dark:border-slate-700 dark:text-slate-300 lg:px-4 ${
                          !isLastInGroup
                            ? 'border-b border-[#f4f4f2] dark:border-slate-800'
                            : 'border-b border-[#d3c4af]/20 dark:border-slate-700'
                        }`}
                      >
                        {(() => {
                          if (subItem.timeTaken && subItem.timeTaken !== '-') return subItem.timeTaken;
                          const created = subItem.createdAt || group.dateTime;
                          const proceed = subItem.updatedAt || subItem.proceedDateTime || subItem.updated_at || group.proceedDateTime;
                          if (!created || !proceed) return '-';
                          const start = new Date(created).getTime();
                          const end = new Date(proceed).getTime();
                          if (isNaN(start) || isNaN(end) || end < start) return '0h 0m';
                          const diffMinutes = Math.floor((end - start) / (1000 * 60));
                          const hours = Math.floor(diffMinutes / 60);
                          const minutes = diffMinutes % 60;
                          const days = Math.floor(hours / 24);
                          const remHours = hours % 24;
                          if (days > 0) return `${days}d ${remHours}h ${minutes}m`;
                          return `${hours}h ${minutes}m`;
                        })()}
                      </td>
                      <td
                        className={`px-3 py-3 text-sm text-[#1a1c1b] dark:border-slate-700 dark:text-slate-300 lg:px-4 ${
                          !isLastInGroup
                            ? 'border-b border-[#f4f4f2] dark:border-slate-800'
                            : 'border-b border-[#d3c4af]/20 dark:border-slate-700'
                        }`}
                      >
                        {(() => {
                          const dateVal = subItem.updatedAt || subItem.proceedDateTime || subItem.updated_at || group.proceedDateTime;
                          if (!dateVal) return '-';
                          return new Date(dateVal).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });
                        })()}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BoxHistoryGroupedTable;
