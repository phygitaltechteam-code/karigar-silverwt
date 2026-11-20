import React from 'react';
import {CategoryGroup, formatNumberDisplay} from './realTimeGoldUtils';

interface RealTimeCustomerDuePanelProps {
  clientDueGroup?: CategoryGroup;
  clientDueTotal: {fine: number; count: number};
}

export const RealTimeCustomerDuePanel: React.FC<
  RealTimeCustomerDuePanelProps
> = ({clientDueGroup, clientDueTotal}) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
        <span className="text-xs font-black uppercase tracking-widest text-black dark:text-white">
          Customer DUE
        </span>
      </div>
      <div className="flex flex-1 flex-col overflow-x-auto">
        <table className="w-full text-center text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-black dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <th className="w-8 px-2 py-2.5 text-center text-black dark:text-white">
                Sr.
              </th>
              <th className="px-3 py-2.5 text-center text-black dark:text-white">
                Client Name
              </th>
              <th className="px-3 py-2.5 text-center text-black dark:text-white">
                Due WT (G)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
            {clientDueGroup && clientDueGroup.items.length > 0 ? (
              clientDueGroup.items.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                >
                  <td className="px-2 py-2.5 text-center text-xs font-semibold text-black dark:text-slate-300">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-black dark:text-white">
                    {item.name}
                  </td>
                  <td className="font-mono px-3 py-2.5 text-center font-bold text-black dark:text-white">
                    {formatNumberDisplay(item.fineWeight)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-xs font-semibold text-black dark:text-slate-300"
                >
                  No client due records found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
              <td
                colSpan={2}
                className="px-3 py-2.5 text-center font-black text-black dark:text-white"
              >
                Total Due
              </td>
              <td className="font-mono px-3 py-2.5 text-center font-black text-black dark:text-white">
                {formatNumberDisplay(clientDueTotal.fine)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
