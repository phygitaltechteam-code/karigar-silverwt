import React from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {
  CategoryGroup,
  formatNumberDisplay,
  renderItemDisplayName,
} from './realTimeGoldUtils';

interface RealTimeManufacturingPanelProps {
  processGroups: CategoryGroup[];
  processTotals: {gross: number; fine: number; count: number};
  expandedRows: Set<string>;
  toggleRow: (id: string) => void;
}

export const RealTimeManufacturingPanel: React.FC<
  RealTimeManufacturingPanelProps
> = ({processGroups, processTotals, expandedRows, toggleRow}) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
        <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">
          MANUFACTURING Stock
        </span>
      </div>
      <div className="flex flex-1 flex-col overflow-x-auto">
        <table className="w-full text-center text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-black dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <th className="w-8 px-2 py-2.5 text-center text-black dark:text-white"></th>
              <th className="px-3 py-2.5 text-center text-black dark:text-white">
                Process
              </th>
              <th className="px-3 py-2.5 text-center text-black dark:text-white">
                Gross WT (G)
              </th>
              <th className="px-3 py-2.5 text-center text-black dark:text-white">
                Fine WT (G)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
            {processGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-xs font-semibold text-black dark:text-slate-300"
                >
                  No manufacturing data found.
                </td>
              </tr>
            ) : (
              processGroups.map((group) => {
                const isExpanded = expandedRows.has(group.id);
                return (
                  <React.Fragment key={group.id}>
                    <tr
                      onClick={() => toggleRow(group.id)}
                      className={`cursor-pointer transition-colors ${
                        isExpanded
                          ? 'bg-[#785600]/10 dark:bg-amber-900/20'
                          : 'hover:bg-[#785600]/5 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-2 py-2.5 text-center">
                        <div className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#785600]/10 text-black dark:bg-amber-400/20 dark:text-amber-400">
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-black dark:text-white">
                        {group.name}
                      </td>
                      <td className="font-mono px-3 py-2.5 text-center font-bold text-black dark:text-white">
                        {formatNumberDisplay(group.totalGrossWeight)}
                      </td>
                      <td className="font-mono px-3 py-2.5 text-center font-bold text-black dark:text-white">
                        {formatNumberDisplay(group.totalFineWeight)}
                      </td>
                    </tr>

                    {isExpanded &&
                      group.items.map((item, itemIdx) => (
                        <tr
                          key={item.id || `${group.id}-${itemIdx}`}
                          className="border-b border-[#d3c4af]/10 bg-[#fcfbf9]/60 text-xs hover:bg-[#f5f3ef] dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-2 py-2 text-center font-semibold text-black dark:text-slate-300">
                            {itemIdx + 1}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-black dark:text-slate-200">
                            {renderItemDisplayName(item)}
                          </td>
                          <td className="font-mono px-3 py-2 text-center font-semibold text-black dark:text-slate-200">
                            {formatNumberDisplay(item.grossWeight)}
                          </td>
                          <td className="font-mono px-3 py-2 text-center font-bold text-black dark:text-slate-200">
                            {formatNumberDisplay(item.fineWeight)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
              <td
                colSpan={2}
                className="px-3 py-2.5 text-center font-black text-black dark:text-white"
              >
                Total Process
              </td>
              <td className="font-mono px-3 py-2.5 text-center font-black text-black dark:text-white">
                {formatNumberDisplay(processTotals.gross)}
              </td>
              <td className="font-mono px-3 py-2.5 text-center font-black text-black dark:text-white">
                {formatNumberDisplay(processTotals.fine)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
