import React from 'react';
import { Flame, Scissors, Hammer, RotateCcw, Calendar } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { confirmAction } from '@/utils/confirmAction';
import {
  SolderingEntry,
  formatNumberDisplay,
  formatPurityDisplay,
} from './solderingUtils';

interface SolderingTableProps {
  data: SolderingEntry[];
  isLoading: boolean;
  isSubmitting: boolean;
  meltingLoadingIds: Set<string>;
  revertLoadingIds: Set<string>;
  getScaleProps: (index: number, field: any) => any;
  handleInlineChange: (index: number, field: 'chainReceived' | 'scrap' | 'purity' | 'Description (तपशील)', value: string) => void;
  handleSaveClick: (index: number, action: 'joint' | 'cutting') => void;
  handleMelting: (item: SolderingEntry) => void;
  handleRevert: (item: SolderingEntry) => void;
  hasEditableValues: (entry: SolderingEntry) => boolean;
}

interface RowGroup {
  groupKey: string;
  date: string;
  time: string;
  rows: { entry: SolderingEntry; originalIndex: number }[];
}

function groupEntries(data: SolderingEntry[]): RowGroup[] {
  const groups: RowGroup[] = [];
  const groupMap = new Map<string, RowGroup>();

  data.forEach((entry, originalIndex) => {
    // Group by solderingId (batch parent). Rows with no solderingId are standalone.
    const groupKey = entry.solderingId ?? entry.id;

    const cleanDateTime = (entry.dateTime || '').replace(/,/g, '');
    const parts = cleanDateTime ? cleanDateTime.split(' ') : ['', ''];
    const date = (parts[0] || '').replace(/,/g, '');
    const time = parts.slice(1).join(' ') || '';

    if (!groupMap.has(groupKey)) {
      const newGroup: RowGroup = { groupKey, date, time, rows: [] };
      groupMap.set(groupKey, newGroup);
      groups.push(newGroup);
    }

    groupMap.get(groupKey)!.rows.push({ entry, originalIndex });
  });

  return groups;
}

const COLUMNS = [
  { label: 'Sr No.', width: '4%' },
  { label: 'Date & Time', width: '9%' },
  { label: 'Purity % (टंच)', width: '7%' },
  { label: 'Stamp (शिक्का)', width: '7%' },
  { label: 'Net Wt Given (G)', width: '9%' },
  { label: 'Description (तपशील)', width: '15%' },
  { label: 'Karigar', width: '8%' },
  { label: 'Net Wt Received (G)', width: '9%' },
  { label: 'Scrap (G)', width: '7%' },
  { label: 'Loss (G)', width: '7%' },
  { label: 'Rate (Rs)', width: '6%' },
  { label: 'Action', width: '12%' },
];

const SolderingTable: React.FC<SolderingTableProps> = ({
  data,
  isLoading,
  isSubmitting,
  meltingLoadingIds,
  revertLoadingIds,
  getScaleProps,
  handleInlineChange,
  handleSaveClick,
  handleMelting,
  handleRevert,
  hasEditableValues,
}) => {
  const groups = React.useMemo(() => groupEntries(data), [data]);

  let globalSrNo = 0;

  return (
    <div className="w-full overflow-x-auto  border border-[#d3c4af]/30 shadow-sm dark:border-slate-700">
      <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed', minWidth: '1050px' }}>
        <colgroup>
          {COLUMNS.map((c, i) => (
            <col key={i} style={{ width: c.width }} />
          ))}
        </colgroup>

        {/* Header */}
        <thead>
          <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-[0.15em] text-white">
            {COLUMNS.map((c, i) => (
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
          {groups.map((group) => {
            globalSrNo++;
            const groupSrNo = globalSrNo;
            const rowCount = group.rows.length;

            return (
              <React.Fragment key={group.groupKey}>
                {group.rows.map(({ entry: item, originalIndex: index }, rowIndex) => {
                  const isMeltingLoading = meltingLoadingIds.has(item.id);
                  const isRevertLoading = revertLoadingIds.has(item.id);
                  const anyLoading = isLoading || isSubmitting || isMeltingLoading || isRevertLoading;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-150 ${item.isSaved ? 'bg-white dark:bg-slate-900' : 'bg-[#fdfcfa] dark:bg-slate-900/60'
                        } hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50`}
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
                          <div className="text-sm font-normal text-[#1a1c1b] dark:text-white">
                            {group.date}
                          </div>
                          {group.time && (
                            <div className="text-sm font-normal text-[#1a1c1b] dark:text-white">
                              {group.time}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Purity */}
                      <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
                          {formatPurityDisplay(item.purity)}%
                        </span>
                      </td>

                      {/* Stamp (शिक्का) */}
                      <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                        <span className="text-sm font-normal text-[#1a1c1b] dark:text-slate-200">
                          {(item as any)['Stamp (शिक्का)'] || item.stamp || '-'}
                        </span>
                      </td>

                      {/* Net Wt Given (Chain Given) */}
                      <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                        <span className="font-mono text-sm font-medium text-[#1a1c1b] dark:text-white">
                          {formatNumberDisplay(item.chainWeight)} G
                        </span>
                      </td>

                      {/* Description (तपशील) (तपशील) */}
                      <td className="border-r border-[#d3c4af]/20 px-2 py-1.5 text-center dark:border-slate-700/50">
                        <div className="inline-block w-48 min-w-[160px]">
                          <GenericInputField
                            type="text"
                            value={
                              item.descriptionRaw !== undefined
                                ? item.descriptionRaw
                                : item.description || ''
                            }
                          onChange={(e) =>
                            handleInlineChange(index, 'Description (तपशील)', e.target.value)
                          }
                          placeholder="Description (तपशील)"
                          className="font-mono text-left w-full"
                          compact
                          />
                        </div>
                      </td>

                      {/* Karigar */}
                      <td className="border-r border-[#d3c4af]/20 px-3 py-3 text-center dark:border-slate-700/50">
                        <span className="text-sm font-semibold text-[#785600] dark:text-amber-400">
                          {item.karigar || (item as any).karigarName || 'Unassigned'}
                        </span>
                      </td>

                      {/* Net Wt Received (Chain Received) — editable input */}
                      <td className="border-r border-[#d3c4af]/20 px-1 py-1.5 text-center dark:border-slate-700/50">
                        {item.isEditing ? (
                          <div
                            className="inline-block w-28"
                            onClick={() => {
                              const el = document.querySelector<HTMLInputElement>(
                                `input[name="chainReceived-${index}"]`,
                              );
                              if (el) { el.focus(); }
                            }}
                          >
                            <GenericInputField
                              name={`chainReceived-${index}`}
                              type="text"
                              inputMode="decimal"
                              decimalScale={3}
                              autoFocus={index === 0}
                              value={
                                item.chainReceivedRaw !== undefined
                                  ? item.chainReceivedRaw
                                  : item.chainReceived === 0
                                    ? ''
                                    : item.chainReceived
                              }
                              {...getScaleProps(index, 'chainReceived')}
                              onChange={(e) =>
                                handleInlineChange(index, 'chainReceived', e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const scrapEl = document.querySelector<HTMLInputElement>(
                                    `input[name="scrap-${index}"]`,
                                  );
                                  if (scrapEl) { scrapEl.focus(); }
                                  else handleSaveClick(index, 'cutting');
                                }
                              }}
                              placeholder="0.000"
                              suffix="G"
                              compact
                              className="cursor-text text-right font-mono text-xs"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
                            {formatNumberDisplay(item.chainReceived)} G
                          </span>
                        )}
                      </td>

                      {/* Scrap — editable input */}
                      <td className="border-r border-[#d3c4af]/20 px-1 py-1.5 text-center dark:border-slate-700/50">
                        {item.isEditing ? (
                          <div className="inline-block w-24">
                            <GenericInputField
                              name={`scrap-${index}`}
                              type="text"
                              inputMode="decimal"
                              decimalScale={3}
                              value={
                                item.scrapRaw !== undefined
                                  ? item.scrapRaw
                                  : item.scrap === 0
                                    ? ''
                                    : item.scrap
                              }
                              {...getScaleProps(index, 'scrap')}
                              onChange={(e) =>
                                handleInlineChange(index, 'scrap', e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveClick(index, 'cutting');
                                }
                              }}
                              placeholder="0.000"
                              suffix="G"
                              compact
                              className="text-right font-mono text-xs"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
                            {formatNumberDisplay(item.scrap)} G
                          </span>
                        )}
                      </td>

                      {/* Loss (G) */}
                      <td className="border-r border-[#d3c4af]/20 px-2 py-2 text-center dark:border-slate-700/50">
                        {(() => {
                          const loss = Math.max(
                            0,
                            Math.round(
                              ((item.chainWeight || 0) -
                                (item.chainReceived || 0) -
                                (item.scrap || 0)) *
                              1000,
                            ) / 1000,
                          );
                          return (
                            <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
                              {formatNumberDisplay(loss)} G
                            </span>
                          );
                        })()}
                      </td>

                      {/* Rate (Rs) */}
                      <td className="border-r border-[#d3c4af]/20 px-2 py-2 text-center dark:border-slate-700/50">
                        <span className="font-mono text-xs text-[#1a1c1b] dark:text-white">
                          {(() => {
                            const ratePerDesign = (item as any).ratePerDesign || (item as any).rate || 120;
                            const wt = item.chainWeight || 0;
                            const rs = Math.round((wt / 1000) * Number(ratePerDesign) * 100) / 100;
                            return `₹ ${rs.toLocaleString('en-IN')}`;
                          })()}
                        </span>
                      </td>

                      {/* Actions */}
                      {/* Action */}
                      <td className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaveClick(index, 'cutting')}
                          disabled={anyLoading}
                          className="rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#5c4200] cursor-pointer"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SolderingTable;
