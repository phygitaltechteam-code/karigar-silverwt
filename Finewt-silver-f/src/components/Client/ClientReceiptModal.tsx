import React from 'react';
import { X, Printer, CheckCircle, FileText } from 'lucide-react';
import {
  ClientReceiptData,
  printClientReceipt,
} from '@/utils/printClientReceipt';
import { useGetHeader } from '@/lib/api/headerapi';

interface ClientReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ClientReceiptData | null;
}

const formatNumber = (val: any, decimals: number = 3): string => {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  const str = num.toFixed(decimals);
  return str.replace(/\.?0+$/, '');
};

const ClientReceiptModal: React.FC<ClientReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  const getpdfheaderdata = useGetHeader();

  if (!isOpen || !receiptData) return null;

  const headerInfo =
    getpdfheaderdata?.data?.data ||
    (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {}) ||
    {};

  const leftInvocation =
    headerInfo.leftInvocation ||
    headerInfo.leftInovation ||
    '॥ श्री गणेश प्रसन्न ॥';
  const rightInvocation =
    headerInfo.rightInvocation ||
    headerInfo.rightInovation ||
    '॥ श्री साई प्रसन्न ॥';
  const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
  const description =
    headerInfo.description ||
    'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';

  const dateFormatted =
    receiptData.dateStr ||
    receiptData.dateTime ||
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const hasItems = receiptData.items && receiptData.items.length > 0;

  const handlePrint = () => {
    printClientReceipt(receiptData, getpdfheaderdata);
  };

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl duration-150 dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#d3c4af]/20 bg-[#785600] px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/20 p-1.5">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Client Receipt Preview</h3>
              <p className="text-xs text-amber-100">
                Receipt for {receiptData.clientName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-white/30 active:scale-95"
              title="Print Receipt"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Receipt Paper View */}
        <div className="bg-gray-50/50 flex-1 overflow-y-auto p-4 dark:bg-slate-950/40 sm:p-5">
          <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
            {/* Header / Letterhead */}
            <div className="border-b border-[#785600] pb-2 text-center">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#a84b20]">
                <span>{leftInvocation}</span>
                <span className="text-base font-black text-[#785600] dark:text-amber-400 sm:text-lg">
                  {factoryName}
                </span>
                <span>{rightInvocation}</span>
              </div>
              <p className="mt-0.5 text-[9px] font-medium text-[#8b451f] dark:text-slate-300">
                {description}
              </p>
              <p className="mt-0.5 text-[9px] font-bold text-[#a84b20]">
                {proprietorName} &nbsp;|&nbsp; {phoneNumbers}
              </p>
            </div>

            {/* Badge & Bill No */}
            <div className="relative mb-2 mt-3 text-center">
              <span className="inline-block rounded bg-[#785600] px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                {receiptData.transactionType === 'give'
                  ? 'GIVE RECEIPT'
                  : receiptData.transactionType === 'receive'
                    ? 'PAYMENT RECEIPT'
                    : 'CLIENT RECEIPT'}
              </span>
              {receiptData.billNumber && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold text-[#785600] dark:text-amber-400">
                  Bill No: {receiptData.billNumber}
                </span>
              )}
            </div>

            {/* Client Info & Date */}
            <div className="mb-2 rounded-lg border border-[#d3c4af]/30 bg-[#faf9f6] p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#1a1c1b] dark:text-white">
                    <span className="font-semibold text-[#4f4535] dark:text-slate-400">
                      Client:
                    </span>{' '}
                    {receiptData.clientName || 'N/A'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-[#4f4535] dark:text-slate-300">
                    {receiptData.phoneNumber && (
                      <div>
                        <strong className="text-[#4f4535] dark:text-slate-400">
                          Phone:
                        </strong>{' '}
                        {receiptData.phoneNumber}
                      </div>
                    )}
                    {receiptData.address && (
                      <div>
                        <strong className="text-[#4f4535] dark:text-slate-400">
                          Address:
                        </strong>{' '}
                        {receiptData.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="whitespace-nowrap text-right text-[11px] text-[#4f4535] dark:text-slate-300">
                  <div>
                    <strong>Date:</strong> {dateFormatted}
                  </div>
                  {receiptData.remark && !hasItems && (
                    <div className="mt-0.5 font-semibold text-[#785600]">
                      <strong>Remark:</strong> {receiptData.remark}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table (3 Columns: Item, Purity, Fine Wt) */}
            {(() => {
              const displayItems =
                receiptData.items && receiptData.items.length > 0
                  ? receiptData.items
                  : [
                    {
                      item: 'Gold',
                      purity: '100%',
                      fineWeight: receiptData.amount ?? 0,
                      weight: receiptData.amount ?? 0,
                    },
                  ];

              return (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse border border-[#d3c4af]/30 text-[11px] dark:border-slate-700">
                    <thead>
                      <tr className="bg-[#785600] text-white">
                        <th className="border border-[#785600] p-1.5 text-left">
                          Item
                        </th>
                        <th className="w-24 border border-[#785600] p-1.5 text-center">
                          Purity
                        </th>
                        <th className="w-28 border border-[#785600] p-1.5 text-right">
                          Fine Wt
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((item, idx) => {
                        const isGold = (item.item || 'Gold')
                          .toLowerCase()
                          .includes('gold');
                        const purityStr =
                          item.purity != null && item.purity !== ''
                            ? String(item.purity).includes('%')
                              ? item.purity
                              : `${item.purity}%`
                            : isGold
                              ? '100%'
                              : '100%';
                        const fineVal =
                          item.fineWeight ??
                          item.weight ??
                          receiptData.amount ??
                          0;

                        return (
                          <tr
                            key={idx}
                            className="border-b border-[#d3c4af]/20 dark:border-slate-800"
                          >
                            <td className="p-1.5 font-bold text-[#1a1c1b] dark:text-white">
                              {item.item || 'Gold'}
                              {item.size ? ` (${item.size})` : ''}
                            </td>
                            <td className="p-1.5 text-center text-[#1a1c1b] dark:text-slate-300">
                              {purityStr}
                            </td>
                            <td className="font-mono p-1.5 text-right font-bold text-[#785600] dark:text-amber-400">
                              {formatNumber(Math.abs(Number(fineVal)))} G
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Transaction / Balance Card */}
            <div className="ml-auto mt-3 max-w-xs rounded-lg border border-[#d3c4af]/30 bg-[#fcfbf9] p-3 dark:border-slate-700 dark:bg-slate-800/60">
              {receiptData.previousBalance !== undefined && (
                <div className="flex justify-between border-b border-dashed border-[#d3c4af]/30 py-0.5 pb-1 text-xs text-[#4f4535] dark:text-slate-400">
                  <span>Previous Due Balance:</span>
                  <span className="font-mono font-bold text-[#1a1c1b] dark:text-white">
                    {formatNumber(receiptData.previousBalance)} G
                  </span>
                </div>
              )}
              {receiptData.amount !== undefined && (
                <div className="flex justify-between py-1 text-xs text-[#4f4535] dark:text-slate-400">
                  <span>
                    {receiptData.transactionType === 'give'
                      ? 'Given Weight (+):'
                      : receiptData.transactionType === 'receive'
                        ? 'Received Weight (-):'
                        : 'Total Weight:'}
                  </span>
                  <span
                    className={`font-mono font-bold ${receiptData.transactionType === 'give'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-green-600 dark:text-green-400'
                      }`}
                  >
                    {receiptData.transactionType === 'give'
                      ? '+'
                      : receiptData.transactionType === 'receive'
                        ? '-'
                        : ''}
                    {formatNumber(receiptData.amount)} G
                  </span>
                </div>
              )}
              {receiptData.newBalance !== undefined && (
                <div className="flex justify-between border-t border-[#785600] pt-1.5 text-xs font-bold text-[#785600] dark:text-amber-400">
                  <span>New Due Balance:</span>
                  <span className="font-mono">
                    {formatNumber(receiptData.newBalance)} G
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#d3c4af]/20 p-3.5 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] h-9 px-4 text-xs sm:text-[13px]"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientReceiptModal;
