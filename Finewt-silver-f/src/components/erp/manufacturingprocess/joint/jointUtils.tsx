import { confirmAction } from '@/utils/confirmAction';
import React from 'react';
import { Column } from '@/components/Forms/Table/GenericTable';
import { Flame, Layers, Save, RotateCcw } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import toast from 'react-hot-toast';
import { AlertRule } from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';

export interface JointEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: number;
  basePurity?: number;
  chainWeight: number;
  chainReceived: number;
  powder: number;
  increase: number;
  powderReceived: number;
  srp: number;
  scrap: number;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
  powderReceivedRaw?: string;
  powderRaw?: string;
  srpRaw?: string;
  purityRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
  isDirty?: boolean;
  status?: string;
  process?: string;
  isMelting?: boolean;
  meltingStatus?: boolean;
}

export const getItemName = (item: any): string => {
  if (!item) return '-';
  if (typeof item === 'string') return item;
  if (item.name) return item.name;
  return '-';
};

export const getSizeName = (size: any): string => {
  if (!size) return '-';
  if (typeof size === 'string') return size;
  if (size.size) return size.size;
  return '-';
};

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
    date: date
      .toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/,/g, ''),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const truncate3Dec = (
  val: number | string | undefined | null,
): number => {
  if (val === undefined || val === null || val === '') return 0;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!Number.isFinite(num) || isNaN(num)) return 0;
  const str = num.toString();
  if (str.includes('.')) {
    const [intPart, decPart] = str.split('.');
    return Number(`${intPart}.${decPart.slice(0, 3)}`);
  }
  return num;
};

export const truncateTo2DecimalsStr = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const str = num.toString();
  if (str.includes('.')) {
    const [intPart, decPart] = str.split('.');
    const truncatedDec = decPart.slice(0, 2);
    const res = `${intPart}.${truncatedDec}`.replace(/\.?0+$/, '');
    return res || '0';
  }
  return str;
};

export const formatNumberDisplay = (value: unknown): string => {
  return truncateTo2DecimalsStr(value);
};

export const printJointHistory = (
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

  // Calculate totals
  const totals = filteredData.reduce(
    (acc: any, item: any) => {
      if (!hasMeltingStatus(item)) {
        acc.chainReceived += Number(item?.chainReceived || item?.chainWeight || 0);
        acc.powderReceived += Number(item?.powderReceived || 0);
        acc.powder += Number(item?.powder || 0);
        acc.scrap += Number(item?.scrap || 0);
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          undefined,
          'joint',
        );
        acc.expectedLoss += Number(details.expectedLoss || 0);
        acc.actualLoss += Number(details.actualLoss || 0);
        acc.diffLoss += Number(details.diffLoss || 0);
      }
      return acc;
    },
    {
      chainReceived: 0,
      powderReceived: 0,
      powder: 0,
      scrap: 0,
      expectedLoss: 0,
      actualLoss: 0,
      diffLoss: 0,
    },
  );

  const rows = filteredData
    .map((item: any, index: number) => {
      const { date, time } = formatDate(item?.createdAt);
      const { date: proceedDate, time: proceedTime } = formatDate(
        item?.updatedAt,
      );
      const isMelting = hasMeltingStatus(item);
      const details = evaluateLossDetails(
        item,
        item?.purity,
        item?.loss,
        undefined,
        'joint',
      );

      return `
      <tr style="${isMelting ? 'opacity:0.75;background-color:#fffbeb;' : ''}">
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${index + 1}</td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
          ${date} ${time}
        </td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${getSizeName(item?.size)}</td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${formatNumberDisplay(item?.purity)}%</td>
        ${isMelting
          ? `<td colspan="8" style="border:1px solid #333;padding:3px 2px;text-align:center;font-weight:bold;font-size:11px;color:#785600;background-color:#fffbeb;">Melting</td>`
          : `
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(item?.chainReceived || item?.chainWeight)}</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(item?.powderReceived)}</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(item?.powder)}</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(item?.increase)}%</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(details.expectedLoss)}</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(details.actualLoss)}</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${details.diffLoss > 0 ? `+${formatNumberDisplay(details.diffLoss)}` : formatNumberDisplay(details.diffLoss)}</td>
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
  const description = headerInfo.description || 'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
  const invocationColor = headerInfo.invocationColor || '#a84b20';
  const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
  const DescriptionColor = headerInfo.DescriptionColor || '#8b451f';
  const proprietorColor = headerInfo.proprietorColor || '#a84b20';
  const phoneColor = headerInfo.phoneColor || '#a84b20';
  const factoryFontSize = headerInfo.factoryFontSize
    ? `${headerInfo.factoryFontSize}px`
    : '20px';
  const DescriptionFontSize = headerInfo.DescriptionFontSize
    ? `${headerInfo.DescriptionFontSize
}px`
    : '9px';
  const proprietorFontSize = headerInfo.proprietorFontSize
    ? `${ headerInfo.proprietorFontSize } px`
    : '9px';
  const phoneFontSize = headerInfo.phoneFontSize
    ? `${ headerInfo.phoneFontSize } px`
    : '9px';

  // Set the content with PDF Header - Full width, clean borders
  printContainer.innerHTML = `
  <div style="width:100%;box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;" >
            <!--Header Section-->
            <div style="width:100%;text-align:center;margin:0 0 4px 0;padding:0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
                    <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
                    <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
                    <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
                </div>
                <div style="margin:1px 0 0 0;padding:0;font-size:${DescriptionFontSize};font-weight:bold;color:${DescriptionColor};line-height:1.2;">
                    ${Description}
                </div>
                <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
                    ${proprietorName}&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
                </div>
                <div style="border-bottom:2px solid ${factoryNameColor};margin:3px 0 5px 0;"></div>
            </div>

            <!--Title and Date Range in one line-->
            <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 6px 0;padding:0;">
                <div style="font-size:10px;color:#333;font-weight:600;flex:1;text-align:left;">
                    Total: <strong>${filteredData.length}</strong>
                </div>
                <h2 style="margin:0;font-size:15px;color:#000;padding:0;font-weight:bold;text-align:center;flex:2;letter-spacing:0.5px;">
                    Joint History Report
                </h2>
                <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
                    ${dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]
                      ? `From: ${new Date(dateRange[0]).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(dateRange[1]).toLocaleDateString('en-IN')}`
                      : ''
                    }
                </div>
            </div>

            <!--Table -->
  <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;table-layout:fixed;">
    <colgroup>
      <col style="width: 3%;" />
      <col style="width: 12%;" />
      <col style="width: 7%;" />
      <col style="width: 6%;" />
      <col style="width: 8%;" />
      <col style="width: 8%;" />
      <col style="width: 8%;" />
      <col style="width: 7%;" />
      <col style="width: 7%;" />
      <col style="width: 10%;" />
      <col style="width: 10%;" />
      <col style="width: 8%;" />
      <col style="width: 13%;" />
    </colgroup>
    <thead>
      <tr style="background:#785600;color:white;font-weight:600;">
        <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Sr</th>
        <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Date & Time</th>
        <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Size</th>
        <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Purity %</th>
        <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Chain Given</th>
        <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Chain Rec</th>
        <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Powder Given</th>
        <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Inc %</th>
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
        <td colspan="4" style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;font-weight:bold;color:#000;">Total</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.chainReceived)}</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.powder)}</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.scrap)}</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.expectedLoss)}</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.actualLoss)}</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${totals.diffLoss > 0 ? `+${formatNumberDisplay(totals.diffLoss)}` : formatNumberDisplay(totals.diffLoss)}</td>
        <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
      </tr>
    </tfoot>
  </table>
        </div >
  `;

  const style = document.createElement('style');
  style.textContent = `
@page {
  size: A4 portrait;
  margin: 6mm 5mm;
}
@media print {
  body > *: not(#print-container) { display: none!important; }
  #print-container, #print-container * { visibility: visible!important; }
  #print-container {
    position: absolute!important;
    left: 0!important;
    top: 0!important;
    width: 100% !important;
    margin: 0!important;
    padding: 0!important;
    background: white!important;
    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }
  #print-container table {
    width: 100% !important;
    border-collapse: collapse!important;
    table-layout: fixed!important;
  }
  #print-container tr { page -break-inside: avoid!important; }
  #print-container thead tr,
    #print-container thead tr th {
    background: #785600!important;
    color: white!important;
    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }
  #print-container tfoot tr,
    #print-container tfoot tr td {
    background: #f7f5f0!important;
    -webkit-print-color-adjust: exact!important;
    print-color-adjust: exact!important;
  }
}
`;
  document.head.appendChild(style);

  setTimeout(() => {
    window.print();
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

export const getHistoryJointColumns = (
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
            <span className="text-sm text-[#1a1c1b] dark:text-white">{time}</span>
          </div>
        );
      },
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {getSizeName(item?.size)}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)} %
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 8 : 1),
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
            {formatNumberDisplay(item.chainReceived || item.chainWeight)} G
          </span>
        );
      },
    },
    {
      key: 'powderReceived',
      header: 'Chain Received (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.powderReceived)} G
          </span>
        );
      },
    },
    {
      key: 'powder',
      header: 'Powder Given (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.powder)} G
          </span>
        );
      },
    },
    {
      key: 'increase',
      header: 'Increase %',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.increase)} %
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)} G
          </span>
        );
      },
    },
    {
      key: 'expectedLoss',
      header: 'Expected Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'joint',
        );
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(details.expectedLoss)} G
          </span>
        );
      },
    },
    {
      key: 'actualLoss',
      header: 'Actual Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'joint',
        );
        return (
          <span className={`font-mono text-sm ${ details.colorClass } `}>
            {formatNumberDisplay(details.actualLoss)} G
          </span>
        );
      },
    },
    {
      key: 'diffLoss',
      header: 'Diff Loss (G)',
      colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
      render: (item) => {
        if (hasMeltingStatus(item)) {
          return null;
        }
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'joint',
        );
        const isPositive = details.diffLoss > 0;
        const isNegative = details.diffLoss < 0;
        return (
          <span
            className={`font-mono text-sm ${
  isPositive
    ? 'font-semibold text-red-600 dark:text-red-400'
    : isNegative
      ? 'font-semibold text-emerald-600 dark:text-emerald-400'
      : 'text-[#1a1c1b] dark:text-white'
} `}
          >
            {isPositive
              ? `+ ${ formatNumberDisplay(details.diffLoss) } `
              : formatNumberDisplay(details.diffLoss)}{' '}
            G
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

export const getJointColumns = (
  getScaleProps: any,
  handleInlineChange: any,
  handleSaveClick: any,
  handleMelting: any,
  handleRevert: any,
  isLoading: boolean,
  isSubmitting: boolean,
  meltingLoadingIds: Set<string>,
  revertLoadingIds: Set<string>,
  hasEditableValues: (entry: JointEntry) => boolean,
): Column<JointEntry>[] => [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const cleanDateTime = (item.dateTime || '').replace(/,/g, '');
        const parts = cleanDateTime ? cleanDateTime.split(' ') : ['', ''];
        const datePart = (parts[0] || '').replace(/,/g, '');
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
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {typeof item?.size === 'object'
            ? (item?.size?.size ?? '-')
            : (item?.size ?? '-')}
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
      key: 'chainWeight',
      header: 'Chain Given (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainReceived || item.chainWeight)} G
        </span>
      ),
    },
    {
      key: 'powderReceived',
      header: 'Chain Received (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                name={`jointPowderReceived - ${ index } `}
                type="text"
                inputMode="decimal"
                decimalScale={3}
                autoFocus={index === 0}
                value={
                  item.powderReceivedRaw !== undefined
                    ? item.powderReceivedRaw
                    : item.powderReceived === 0
                      ? ''
                      : item.powderReceived
                }
                {...getScaleProps(index, 'powderReceived')}
                onChange={(e) =>
                  handleInlineChange(index, 'powderReceived', e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const scrapInput = document.querySelector<HTMLInputElement>(
                      `input[name = "jointScrap-${index}"]`,
                    );
                    if (scrapInput) {
                      scrapInput.focus();
                      scrapInput.select();
                    } else {
                      handleSaveClick(index);
                    }
                  }
                }}
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-center"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.powderReceived)} G
          </span>
        );
      },
    },
    {
      key: 'powder',
      header: 'Powder Given(G)',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.powder)} G
        </span>
      ),
    },

    {
      key: 'increase',
      header: 'Increase %',

      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.increase)} %
        </span>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                name={`jointScrap - ${ index } `}
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
                    handleSaveClick(index);
                  }
                }}
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-center"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)} G
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item: JointEntry, index: number) => {
        const isMeltingLoading = meltingLoadingIds.has(item.id);
        const isRevertLoading = revertLoadingIds?.has(item.id) ?? false;

        return (
          <div className="flex items-center justify-center gap-1.5">
            {!item.isSaved && hasEditableValues(item) && (
              <button
                type="button"
                onClick={() => handleSaveClick(index)}
                disabled={
                  isLoading || isSubmitting || isMeltingLoading || isRevertLoading
                }
                className="rounded-lg bg-[#785600] px-3.5 py-1 text-xs font-bold text-white transition-all hover:bg-[#5c4200] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                title="Proceed to Cutting"
              >
                Cutting
              </button>
            )}

            {/* Melting Button */}
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
              disabled={
                isLoading || isSubmitting || isMeltingLoading || isRevertLoading
              }
              className="rounded-lg border border-amber-300 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400"
              title="Send to Melting"
            >
              {isMeltingLoading ? (
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
                <Flame className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Revert Button */}
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
              disabled={
                isLoading || isSubmitting || isMeltingLoading || isRevertLoading
              }
              className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
              title="Revert Joint"
            >
              {isRevertLoading ? (
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
          </div>
        );
      },
    } as Column<JointEntry>,
  ];
