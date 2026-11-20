import React from 'react';
import {X, Factory} from 'lucide-react';
import {BillGroup} from './billingTypes';

interface ManufacturingItemPickerModalProps {
  showManufacturingItemPicker: BillGroup | null;
  onClose: () => void;
  onSelectItem: (item: any) => void;
  onSendAll: (group: BillGroup) => void;
}

export const ManufacturingItemPickerModal: React.FC<
  ManufacturingItemPickerModalProps
> = ({showManufacturingItemPicker, onClose, onSelectItem, onSendAll}) => {
  if (!showManufacturingItemPicker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
                Select Item for Manufacturing
              </h3>
              <p className="text-xs text-[#817563] dark:text-slate-400">
                Bill #{showManufacturingItemPicker.billNo} •{' '}
                {showManufacturingItemPicker.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 rounded-lg p-1.5 transition-colors dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-2.5 overflow-y-auto p-4">
          <p className="mb-2 text-xs text-[#4f4535] dark:text-slate-300">
            Click on an item to send its details (Item, Size, Gross Weight,
            Purity) to the <strong>Tar Department</strong>:
          </p>
          {showManufacturingItemPicker.items.map((it, idx) => (
            <button
              key={idx}
              onClick={() => onSelectItem(it)}
              className="flex w-full items-center justify-between rounded-lg border border-[#d3c4af]/30 bg-[#fbfaf8] p-3.5 text-left transition-all hover:border-amber-400/50 hover:bg-amber-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60"
            >
              <div>
                <div className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                  {it.item}{' '}
                  <span className="text-xs font-normal text-[#817563] dark:text-slate-400">
                    ({it.size})
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#4f4535] dark:text-slate-300">
                  <span>
                    Gross:{' '}
                    <strong className="font-mono">{it.grossWeight}g</strong>
                  </span>
                  <span>
                    Purity: <strong className="font-mono">{it.purity}%</strong>
                  </span>
                  <span>
                    Fine:{' '}
                    <strong className="font-mono text-[#785600] dark:text-amber-400">
                      {it.finWt}g
                    </strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Send</span>
                <Factory className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[#d3c4af]/20 p-3.5 dark:border-slate-700">
          <button
            onClick={() => onSendAll(showManufacturingItemPicker)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            <Factory className="h-4 w-4" />
            <span>
              Send All ({showManufacturingItemPicker.items.length} Items)
            </span>
          </button>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 rounded-lg px-4 py-2 text-xs font-medium text-[#4f4535] transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManufacturingItemPickerModal;
