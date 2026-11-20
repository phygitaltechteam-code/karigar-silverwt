import { confirmAction } from '@/utils/confirmAction';
import toast from 'react-hot-toast';
import { Column } from '@/components/Forms/Table/GenericTable';
import { Flame, Layers, Save, RotateCcw } from 'lucide-react';
import React from 'react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {
  checkProcessLossAlert,
  getProcessLossColorClass,
  AlertRule,
} from '@/lib/api/alertmanagement';

export interface TarEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  fine: number;
  tar: number;
  scrap: number;
  loss: number;
  purity: number;
  grosswt: number;
  isSaved: boolean;
  tarRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  grosswtRaw?: string;
  isDirty?: boolean;
  isMeltingLoading?: boolean;
  status?: string;
  process?: string;
  isMelting?: boolean;
  meltingStatus?: boolean;
}

export interface TarCardForm {
  id: string;
  grossWt: string;
  purity: string;
  fine: string;
  isSaving?: boolean;
}

export const createNewCard = (initial?: Partial<TarCardForm>): TarCardForm => ({
  id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  grossWt: initial?.grossWt || '',
  purity: initial?.purity || '',
  fine: initial?.fine || '',
});

export const hasMeltingStatus = (item: any): boolean => {
  const s = String(item?.status || item?.process || '').toUpperCase();
  return (
    s === 'MELTING' || item?.isMelting === true || item?.meltingStatus === true
  );
};

export const formatDate = (dateString: string) => {
  if (!dateString) return { date: '-', time: '-' };
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

export const formatDateTime = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatNumber = (value: unknown): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(toNumber(value));
};

export const formatNumberDisplay = (value: unknown): string => {
  return formatNumber(value);
};

import { evaluateLossDetails } from '@/utils/lossReportHelper';

export const printTarHistory = (
  filteredData: any[],
  dateRange: Date[],
  getpdfheaderdata: any,
) => {
  if (!filteredData || filteredData.length === 0) {
    toast.error(
      'No history records available to print for the selected date range',
    );
    return;
  }

  // Create a hidden div for printing
  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';
  printContainer.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: 100%;
          background: white;
          padding: 4px;
          z-index: 9999;
      `;
  document.body.appendChild(printContainer);

  // Build the table rows - Compact with minimum padding
  const rows = filteredData
    .map((item: any, index: number) => {
      const { date, time } = formatDate(item?.createdAt);
      const { date: proceedDate, time: proceedTime } = formatDate(
        item?.updatedAt,
      );
      const isMelting = hasMeltingStatus(item);
      const grossVal = toNumber(item?.grosswt > 0 ? item?.grosswt : item?.fine);
      const lossDetails = evaluateLossDetails(
        grossVal,
        item?.purity || 0,
        item?.loss || 0,
        'tar',
        item?.expectedLoss,
      );

      // Calculate totals
      const totals = filteredData.reduce(
        (acc: any, item: any) => {
          if (!hasMeltingStatus(item)) {
            acc.fine += Number(item?.fine || 0);
            acc.tar += Number(item?.tar || 0);
            acc.scrap += Number(item?.scrap || 0);
            const grossVal = toNumber(item?.grosswt > 0 ? item?.grosswt : item?.fine);
            const lossDetails = evaluateLossDetails(
              grossVal,
              item?.purity || 0,
              item?.loss || 0,
              'tar',
              item?.expectedLoss,
            );
            acc.expectedLoss += Number(lossDetails.expectedLoss || 0);
            acc.actualLoss += Number(lossDetails.actualLoss || 0);
            acc.diffLoss += Number(lossDetails.diffLoss || 0);
          }
          return acc;
        },
        { fine: 0, tar: 0, scrap: 0, expectedLoss: 0, actualLoss: 0, diffLoss: 0 },
      );

      return `
                  <tr style="${isMelting ? 'opacity:0.75;background-color:#fffbeb;' : ''}">
                      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${index + 1}</td>
                      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                          ${date} ${time}
                      </td>
                      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumber(item?.fine)}</td>
                      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumber(item?.purity)}%</td>
                      ${isMelting
          ? `<td colspan="5" style="border:1px solid #333;padding:3px 2px;text-align:center;font-weight:bold;font-size:11px;color:#785600;background-color:#fffbeb;">Melting</td>`
          : `
                          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumber(item?.tar)}</td>
                          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumber(item?.scrap)}</td>
                          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumber(lossDetails.expectedLoss)}</td>
                          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumber(lossDetails.actualLoss)}</td>
                          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${lossDetails.diffLoss > 0 ? `+${formatNumber(lossDetails.diffLoss)}` : formatNumber(lossDetails.diffLoss)}</td>
                        `
        }
                      <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
                          ${proceedDate} ${proceedTime}
                      </td>
                  </tr>
              `;
    })
    .join('');

  const headerInfo =
    getpdfheaderdata?.data?.data ||
    (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
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
  const invocationColor = headerInfo.invocationColor || '#a84b20';
  const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
  const descriptionColor = headerInfo.descriptionColor || '#8b451f';
  const proprietorColor = headerInfo.proprietorColor || '#a84b20';
  const phoneColor = headerInfo.phoneColor || '#a84b20';
  const factoryFontSize = headerInfo.factoryFontSize
    ? `${headerInfo.factoryFontSize}px`
    : '20px';
  const descriptionFontSize = headerInfo.descriptionFontSize
    ? `${headerInfo.descriptionFontSize}px`
    : '9px';
  const proprietorFontSize = headerInfo.proprietorFontSize
    ? `${headerInfo.proprietorFontSize}px`
    : '9px';
  const phoneFontSize = headerInfo.phoneFontSize
    ? `${headerInfo.phoneFontSize}px`
    : '9px';

  // Set the content with PDF Header - Full width, clean borders
  printContainer.innerHTML = `
    <div style="width:100%;box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;">
      <!-- PDF Header -->
      <div style="width:100%;text-align:center;margin:0 0 4px 0;padding:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
          <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
          <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
          <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
        </div>
        <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">
          ${description}
        </div>
        <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
          ${proprietorName}&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
        </div>
        <div style="border-bottom:2px solid ${factoryNameColor};margin:3px 0 5px 0;"></div>
      </div>

      <!-- Title and Date Range in one line -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 6px 0;padding:0;">
        <div style="font-size:10px;color:#333;font-weight:600;flex:1;text-align:left;">
          Total: <strong>${filteredData.length}</strong>
        </div>
        <h2 style="margin:0;font-size:15px;color:#000;padding:0;font-weight:bold;text-align:center;flex:2;letter-spacing:0.5px;">
          Tar History Report
        </h2>
        <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
          ${dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]
      ? `From: ${new Date(dateRange[0]).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(dateRange[1]).toLocaleDateString('en-IN')}`
      : ''
    }
        </div>
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;table-layout:fixed;">
        <colgroup>
          <col style="width: 4%;" />
          <col style="width: 14%;" />
          <col style="width: 9%;" />
          <col style="width: 8%;" />
          <col style="width: 9%;" />
          <col style="width: 8%;" />
          <col style="width: 11%;" />
          <col style="width: 11%;" />
          <col style="width: 10%;" />
          <col style="width: 16%;" />
        </colgroup>
        <thead>
          <tr style="background:#785600;color:white;font-weight:600;">
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Sr</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Date & Time</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Fine</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Purity %</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Tar</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Scrap</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Expected Loss</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Actual Loss</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Diff Loss</th>
            <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Proceed</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr style="background:#f7f5f0;font-weight:bold;">
            <td colspan="2" style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;font-weight:bold;color:#000;">Total</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.fine)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.tar)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.scrap)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.expectedLoss)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.actualLoss)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${totals.diffLoss > 0 ? `+${formatNumber(totals.diffLoss)}` : formatNumber(totals.diffLoss)}</td>
            <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  // Add print styles
  const style = document.createElement('style');
  style.textContent = `
    @page {
      size: A4 portrait;
      margin: 6mm 5mm;
    }
    @media print {
      body > *:not(#print-container) {
        display: none !important;
      }
      #print-container, #print-container * {
        visibility: visible !important;
      }
      #print-container {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
      }
      #print-container tr {
        page-break-inside: avoid !important;
      }
      #print-container thead tr,
      #print-container thead tr th {
        background: #785600 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container tfoot tr,
      #print-container tfoot tr td {
        background: #f7f5f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
  document.head.appendChild(style);

  // Trigger print
  setTimeout(() => {
    window.print();

    // Clean up after print
    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 1000);
  }, 500);
};

export const getHistoryTarColumns = (
  alertRules?: AlertRule[],
): Column<any>[] => [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => {
        const { date, time } = formatDate(item.createdAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'fine',
      header: 'Fine (लगड)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.fine)} G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.purity)}%
        </span>
      ),
    },
    {
      key: 'grosswt',
      header: 'Gross Wt (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 5 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return (
            <div className="flex items-center justify-center py-0.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Melting
              </span>
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.grosswt)} G
          </span>
        );
      },
    },
    {
      key: 'tar',
      header: 'Tar (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.tar)} G
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.scrap)} G
          </span>
        );
      },
    },
    {
      key: 'expectedLoss',
      header: 'Expected Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        const grossVal = toNumber(item.grosswt > 0 ? item.grosswt : item.fine);
        const lossDetails = evaluateLossDetails(
          grossVal,
          item.purity,
          item.loss,
          'tar',
          item.expectedLoss,
          alertRules ? { tar: alertRules } : undefined,
        );
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(lossDetails.expectedLoss)} G
          </span>
        );
      },
    },
    {
      key: 'actualLoss',
      header: 'Actual Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        return (
          <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
            {formatNumber(item.loss)} G
          </span>
        );
      },
    },
    {
      key: 'diffLoss',
      header: 'Diff Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) return null;
        const grossVal = toNumber(item.grosswt > 0 ? item.grosswt : item.fine);
        const lossDetails = evaluateLossDetails(
          grossVal,
          item.purity,
          item.loss,
          'tar',
          item.expectedLoss,
          alertRules ? { tar: alertRules } : undefined,
        );
        return (
          <span className={`font-mono text-sm ${lossDetails.colorClass}`}>
            {formatNumber(lossDetails.diffLoss)} G
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
        const { date, time } = formatDate(item.updatedAt);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {time}
            </span>
          </div>
        );
      },
    },
  ];

export const getTarColumns = (
  getScaleProps: (index: number, field: any) => any,
  handleInlineChange: (index: number, field: any, value: string) => void,
  handleSaveClick: (index: number) => void,
  handleMelting: (item: TarEntry) => void,
  hasEditableValues: (entry: TarEntry) => boolean,
  isLoading: boolean,
  isSubmitting: boolean,
  alertRules?: AlertRule[],
  handleRevert?: (item: TarEntry) => void,
  revertLoadingIds?: Record<string, boolean>,
): Column<TarEntry>[] => [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'fine',
      header: 'Fine (लगड)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.fine)} G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <div className="bg-gray-50/50 flex w-24 items-center justify-center gap-1 whitespace-nowrap px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/50">
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)}%
          </span>
        </div>
      ),
    },
    {
      key: 'grosswt',
      header: 'GrossWt (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 3 : 1),
      render: (item, index) => {
        if (hasMeltingStatus(item)) {
          return (
            <div className="flex items-center justify-center py-0.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Melting
              </span>
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.grosswt)}
          </span>
        );
      },
    },
    {
      key: 'tar',
      header: 'Tar (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item, index) => {
        if (!item.isSaved) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={
                  item.tarRaw !== undefined
                    ? item.tarRaw
                    : item.tar === 0
                      ? ''
                      : item.tar
                }
                {...getScaleProps(index, 'tar')}
                onChange={(e) => handleInlineChange(index, 'tar', e.target.value)}
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-right"
              />
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.tar)} G
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item, index) => {
        if (!item.isSaved) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
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
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-right"
              />
            </div>
          );
        }

        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)}
          </span>
        );
      },
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => {
        const hasValues = hasEditableValues(item);
        const grossVal = toNumber(item.grosswt > 0 ? item.grosswt : item.fine);
        const alertCheck = checkProcessLossAlert(
          grossVal,
          item.purity,
          item.loss,
          alertRules,
          hasValues,
        );

        const hasAlert = Boolean(alertRules && alertRules.length > 0 && alertCheck);
        if (!hasAlert) {
          return (
            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
              {formatNumber(item.loss)} G
            </span>
          );
        }

        const colorClass = getProcessLossColorClass(alertCheck);
        const expectedLoss = alertCheck?.maxAllowedLoss || alertCheck?.baseLoss || 0;
        const diff = alertCheck?.diff || 0;

        return (
          <div className="flex flex-col items-center justify-center">
            <span className={`font-mono text-sm font-semibold ${colorClass}`}>
              Act: {formatNumber(item.loss)} G
            </span>
            <div className="mt-0.5 flex flex-col items-center text-[10px] leading-tight text-gray-500 dark:text-slate-400">
              <span>Exp: {formatNumber(expectedLoss)} G</span>
              <span
                className={
                  diff > 0
                    ? 'font-semibold text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-slate-400'
                }
              >
                Diff: {diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)} G
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item: TarEntry, index: number) => {
        if (hasMeltingStatus(item)) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Melting
            </span>
          );
        }

        const isReverting = Boolean(item.id && revertLoadingIds?.[item.id]);

        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* Box Button - Only show if entry is not saved and has editable values */}
            {!item.isSaved && hasEditableValues(item) && (
              <button
                type="button"
                onClick={() => handleSaveClick(index)}
                disabled={isLoading || isSubmitting || isReverting}
                className="rounded-lg bg-[#785600] px-3.5 py-1 text-xs font-bold text-white transition-all hover:bg-[#5c4200] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                title="Move to Box"
              >
                Box
              </button>
            )}

            {/* Melting Button - Always visible for all entries */}
            <button
              type="button"
              onClick={async () => {
                const confirmed = await confirmAction(
                  'Confirm Melting',
                  'Are you sure you want to send this item to melting?',
                );
                if (confirmed) {
                  handleMelting(item);
                }
              }}
              disabled={isLoading || isSubmitting || isReverting}
              className="rounded-lg border border-amber-300 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400"
              title="Send to Melting"
            >
              <Flame className="h-3.5 w-3.5" />
            </button>

            {/* Revert Button */}
            {handleRevert && item.id && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await confirmAction(
                    'Confirm Revert',
                    'Are you sure you want to revert this item?',
                  );
                  if (confirmed) {
                    handleRevert(item);
                  }
                }}
                disabled={isLoading || isSubmitting || isReverting}
                className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
                title="Revert Tar"
              >
                {isReverting ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        );
      },
    },
  ];
