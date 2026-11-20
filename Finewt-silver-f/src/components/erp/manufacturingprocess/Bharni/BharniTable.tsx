import React from 'react';
import LossAlertBadge from '../shared/LossAlertBadge';
import { CheckCircle } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import ScaleWeightField from '@/components/common/ScaleWeightField';
import {
  COLUMNS,
  BharniRowGroup,
  formatNumberDisplay,
} from './bharniUtils';

interface BharniTableProps {
  groups: BharniRowGroup[];
  showHistory: boolean;
  handleBatchDescriptionChange: (groupKey: string, newDesc: string) => void;
  handleBatchStampChange: (groupKey: string, newStamp: string) => void;
  handleInlineChange: (
    index: number,
    field: 'description' | 'netWeightReceived' | 'scrap' | 'rateRs',
    value: string,
  ) => void;
  handleProcessPart: (originalIndex: number) => void;
}

export const BharniTable: React.FC<BharniTableProps> = ({
  groups,
  showHistory,
  handleBatchDescriptionChange,
  handleBatchStampChange,
  handleInlineChange,
  handleProcessPart,
}) => {
  let globalSrNo = 0;

  return (
    <div className="w-full overflow-x-auto border border-[#d3c4af]/30 shadow-sm dark:border-slate-700">
      <table
        className="w-full border-collapse text-sm"
        style={{ tableLayout: 'fixed', minWidth: '1500px' }}
      >
        <colgroup>
          {COLUMNS.map((c, i) => (
            <col key={i} style={{ width: c.width }} />
          ))}
        </colgroup>

        {/* Table Header */}
        <thead>
          <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-[0.12em] text-white">
            {COLUMNS.map((c, i) => (
              <th
                key={i}
                className="border border-[#6a4c00]/30 px-2 py-3 text-center font-semibold"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
          {groups.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="py-12 text-center text-[#817563] dark:text-slate-400"
              >
                {showHistory
                  ? 'No history records found for Bharni process.'
                  : 'No active bharni process records found. Select a Silver Stock card above to process Bharni entries.'}
              </td>
            </tr>
          ) : (
            groups.map((group) => {
              globalSrNo++;
              const groupSrNo = globalSrNo;
              const rowCount = group.rows.length;

              return (
                <React.Fragment key={group.groupKey}>
                  {group.rows.map(
                    ({ entry: item, originalIndex: index }, rowIndex) => (
                      <tr
                        key={item.id}
                        className={`transition-colors duration-150 ${
                          item.isCompleted
                            ? 'bg-white dark:bg-slate-900'
                            : 'bg-[#fdfcfa] dark:bg-slate-900/60'
                        } hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50`}
                      >
                        {/* 1. Sr No. - Group RowSpan */}
                        {rowIndex === 0 && (
                          <td
                            rowSpan={rowCount}
                            className="border-r border-[#d3c4af]/30 bg-white px-2 py-3 text-center text-sm font-bold text-[#785600] align-middle dark:border-slate-700/50 dark:bg-slate-900 dark:text-amber-400"
                          >
                            {groupSrNo}
                          </td>
                        )}

                        {/* 2. Date & Time - Group RowSpan */}
                        {rowIndex === 0 && (
                          <td
                            rowSpan={rowCount}
                            className="border-r border-[#d3c4af]/30 bg-white px-2 py-3 text-center text-sm text-[#1a1c1b] align-middle dark:border-slate-700/50 dark:bg-slate-900 dark:text-white"
                          >
                            <div className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                              {group.date}
                            </div>
                            {group.time && (
                              <div className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                                {group.time}
                              </div>
                            )}
                          </td>
                        )}

                        {/* 3. Purity % - Group RowSpan */}
                        {rowIndex === 0 && (
                          <td
                            rowSpan={rowCount}
                            className="border-r border-[#d3c4af]/30 bg-white px-2 py-3 text-center align-middle dark:border-slate-700/50 dark:bg-slate-900"
                          >
                            <span className="font-mono text-xs font-bold text-[#785600] dark:text-amber-400">
                              {formatNumberDisplay(group.purity)}%
                            </span>
                          </td>
                        )}

                        {/* 4. Stamp (शिक्का) - Group RowSpan */}
                        {rowIndex === 0 && (
                          <td
                            rowSpan={rowCount}
                            className="border-r border-[#d3c4af]/30 bg-white px-2 py-3 text-center text-xs text-[#1a1c1b] align-middle dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-200"
                          >
                            <div className="w-full min-w-0">
                              <GenericInputField
                                type="text"
                                value={group.stamp || ''}
                                onChange={(e) =>
                                  handleBatchStampChange(group.groupKey, e.target.value)
                                }
                                placeholder="Stamp"
                                className="text-center text-xs"
                                compact
                              />
                            </div>
                          </td>
                        )}

                        {/* 5. Total Net Wt (G) - Group RowSpan */}
                        {rowIndex === 0 && (
                          <td
                            rowSpan={rowCount}
                            className="border-r border-[#d3c4af]/30 bg-white px-2 py-3 text-center align-middle dark:border-slate-700/50 dark:bg-slate-900"
                          >
                            <span className="font-mono text-xs font-bold text-[#1a1c1b] dark:text-white">
                              {formatNumberDisplay(group.totalBatchWeight)} G
                            </span>
                          </td>
                        )}

                        {/* 6. Description (तपशील) - Group RowSpan with editable input */}
                        {rowIndex === 0 && (
                          <td
                            rowSpan={rowCount}
                            className="border-r border-[#d3c4af]/30 bg-white px-2 py-2 text-center align-middle dark:border-slate-700/50 dark:bg-slate-900"
                          >
                            <div className="w-full min-w-0">
                              <GenericInputField
                                type="text"
                                value={group.description || ''}
                                onChange={(e) =>
                                  handleBatchDescriptionChange(
                                    group.groupKey,
                                    e.target.value,
                                  )
                                }
                                placeholder="Description (तपशील)"
                                className="font-mono text-left w-full text-xs"
                                compact
                              />
                            </div>
                          </td>
                        )}

                        {/* 7. Design (डिझाइन) - Group RowSpan */}
                        {rowIndex === 0 && (
                          <td
                            rowSpan={rowCount}
                            className="border-r border-[#d3c4af]/30 bg-white px-2 py-3 text-center text-xs font-medium text-[#1a1c1b] align-middle dark:border-slate-700/50 dark:bg-slate-900 dark:text-slate-200"
                          >
                            {group.design || '-'}
                          </td>
                        )}

                        {/* 8. Part No */}
                        <td className="border-r border-[#d3c4af]/20 px-2 py-2.5 text-center dark:border-slate-700/50">
                          {item.partNo ? (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-[#785600] dark:bg-amber-950/40 dark:text-amber-400">
                              Part {item.partNo}
                            </span>
                          ) : (
                            <span className="text-xs text-[#4f4535] dark:text-slate-400">-</span>
                          )}
                        </td>

                        {/* 9. Karigar */}
                        <td className="border-r border-[#d3c4af]/20 px-2 py-2.5 text-center dark:border-slate-700/50">
                          <span className="text-xs font-semibold text-[#785600] dark:text-amber-400">
                            {item.karigar || 'Unassigned'}
                          </span>
                        </td>

                        {/* 10. Given Net Wt (G) */}
                        <td className="border-r border-[#d3c4af]/20 px-2 py-2.5 text-center dark:border-slate-700/50">
                          <span className="font-mono text-xs font-bold text-[#1a1c1b] dark:text-white">
                            {formatNumberDisplay(item.netWeightGiven)} G
                          </span>
                        </td>

                        {/* 11. Net Wt Received (G) — Editable */}
                        <td className="border-r border-[#d3c4af]/20 px-1 py-1.5 text-center dark:border-slate-700/50">
                          {!item.isCompleted ? (
                            <div className="w-full min-w-0">
                              <ScaleWeightField
                                onScaleWeight={(w) =>
                                  handleInlineChange(index, 'netWeightReceived', String(w))
                                }
                                name={`bharniNetWeightReceived-${index}`}
                                type="text"
                                inputMode="decimal"
                                decimalScale={3}
                                value={
                                  item.netWeightReceivedRaw !== undefined
                                    ? item.netWeightReceivedRaw
                                    : item.netWeightReceived || ''
                                }
                                onChange={(e) =>
                                  handleInlineChange(
                                    index,
                                    'netWeightReceived',
                                    e.target.value,
                                  )
                                }
                                placeholder="0.000"
                                suffix="G"
                                compact
                                className="font-mono text-right text-xs"
                              />
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
                              {formatNumberDisplay(item.netWeightReceived)} G
                            </span>
                          )}
                        </td>

                        {/* 12. Scrap (G) — Editable */}
                        <td className="border-r border-[#d3c4af]/20 px-1 py-1.5 text-center dark:border-slate-700/50">
                          {!item.isCompleted ? (
                            <div className="w-full min-w-0">
                              <GenericInputField
                                name={`bharniScrap-${index}`}
                                type="text"
                                inputMode="decimal"
                                decimalScale={3}
                                value={
                                  item.scrapRaw !== undefined
                                    ? item.scrapRaw
                                    : item.scrap || ''
                                }
                                onChange={(e) =>
                                  handleInlineChange(
                                    index,
                                    'scrap',
                                    e.target.value,
                                  )
                                }
                                placeholder="0.000"
                                suffix="G"
                                compact
                                className="font-mono text-right text-xs"
                              />
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
                              {formatNumberDisplay(item.scrap)} G
                            </span>
                          )}
                        </td>

                        {/* 13. Loss (G) */}
                        <td className="border-r border-[#d3c4af]/20 px-1.5 py-2 text-center dark:border-slate-700/50">
                          {(() => {
                            const loss = Math.max(
                              0,
                              Math.round(
                                (item.netWeightGiven -
                                  (item.netWeightReceived || 0) -
                                  (item.scrap || 0)) *
                                  1000,
                              ) / 1000,
                            );
                            return (
                              <div className="flex flex-col items-center">
                                <span className="font-mono text-xs text-[#1a1c1b] dark:text-slate-200">
                                  {formatNumberDisplay(loss)} G
                                </span>
                                <LossAlertBadge stage="bharni" given={item.netWeightGiven} purity={Number((item as any).purity) || 0} loss={loss} />
                              </div>
                            );
                          })()}
                        </td>

                        {/* 14. Rate (Rs) */}
                        <td className="border-r border-[#d3c4af]/20 px-1.5 py-2 text-center dark:border-slate-700/50">
                          {(() => {
                            const ratePerKg = item.ratePerKg || Number((item as any).rate) || 0;
                            const wt = item.netWeightGiven || 0;
                            const computedRate = Math.round(
                              (wt / 1000) * ratePerKg,
                            );
                            const isSelf =
                              String(item.karigar || '').trim().toLowerCase() === 'self';
                            const isDone = item.status === 'soldering' || item.isCompleted;
                            // Self rows: the rate amount is typed in
                            if (isSelf && !isDone) {
                              return (
                                <div className="w-full min-w-0">
                                  <GenericInputField
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      (item as any).rateRsRaw !== undefined
                                        ? (item as any).rateRsRaw
                                        : item.rateRs
                                          ? String(item.rateRs)
                                          : ''
                                    }
                                    onChange={(e) =>
                                      handleInlineChange(index, 'rateRs', e.target.value)
                                    }
                                    placeholder="0"
                                    suffix="₹"
                                    compact
                                    className="font-mono text-right text-xs"
                                  />
                                </div>
                              );
                            }
                            return (
                              <span className="font-mono text-xs text-[#1a1c1b] dark:text-slate-200">
                                ₹{' '}
                                {(
                                  item.rateRs ?? computedRate
                                ).toLocaleString('en-IN')}
                              </span>
                            );
                          })()}
                        </td>

                        {/* 15. Action */}
                        <td className="px-1.5 py-1.5 text-center">
                          {item.status === 'soldering' || item.isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800 dark:bg-green-950/40 dark:text-green-300">
                              <CheckCircle className="h-3 w-3" />
                              <span>Soldering</span>
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleProcessPart(index)}
                                title="Save to Stock Cards"
                                className="rounded-lg bg-[#785600] px-3.5 py-1 text-xs font-bold text-white transition-all hover:bg-[#5c4200] dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
