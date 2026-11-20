import toast from 'react-hot-toast';
import { AlertRule } from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';


export interface CuttingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  stamp?: string;
  stampRaw?: string;
  description?: string;
  descriptionRaw?: string;
  size: string;
  sizeRaw?: string;
  purity: number;
  purityRaw?: string;
  chainWeight: number;
  chainGiven: number;
  chainGivenRaw?: string;
  qtyGiven?: number;
  qtyGivenRaw?: string;
  qtyReceived?: number;
  qtyReceivedRaw?: string;
  chainReceived: number;
  chainReceivedRaw?: string;
  scrap: number;
  scrapRaw?: string;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
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

export const calculateLoss = (
  chainGiven: number,
  chainReceived: number,
  scrap: number = 0,
): number => {
  return Math.max(
    0,
    Math.round((chainGiven - chainReceived - scrap) * 1000) / 1000,
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

export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// Indian format, maximum 3 decimals and NO TRIALing zeros.
export const formatNumberDisplay = (value: unknown): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(toNumber(value));
};

export const formatPurityDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0.00';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
};

export const formatNoTRIALingZeros3Dec = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const str = num.toString();
  const parts = str.split('.');
  if (parts.length === 1) return parts[0];
  const dec = parts[1].slice(0, 3).replace(/0+$/, '');
  return dec ? `${parts[0]}.${dec}` : parts[0];
};

export const formatPurityNoTrailingZeros = (value: unknown): string => {
  const num = toNumber(value);
  if (num === 0) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(num);
};

export const hasMeltingStatus = (item: any): boolean => {
  const s = String(item?.status || item?.process || '').toUpperCase();
  return (
    s === 'MELTING' || item?.isMelting === true || item?.meltingStatus === true
  );
};

// ======================================================
// Table Columns Definitions (Separated in ./cuttingColumns.tsx)
// ======================================================

export {
  getHistoryCuttingColumns,
  getCuttingColumns,
} from './cuttingColumns';


export const printCuttingHistory = (
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

  // Calculate totals
  const totals = filteredData.reduce(
    (acc: any, item: any) => {
      if (!hasMeltingStatus(item)) {
        acc.chainGiven += Number(item?.chainWeight ?? item?.chainGiven ?? 0);
        acc.chainReceived += Number(item?.chainReceived || 0);
        acc.scrap += Number(item?.scrap || 0);
        const details = evaluateLossDetails(
          item?.chainWeight ?? item?.chainGiven,
          item?.purity,
          item?.loss,
          undefined,
          'cutting',
        );
        acc.expectedLoss += Number(details.expectedLoss || 0);
        acc.actualLoss += Number(details.actualLoss || 0);
        acc.diffLoss += Number(details.diffLoss || 0);
      }
      return acc;
    },
    {
      chainGiven: 0,
      chainReceived: 0,
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
        item?.chainWeight ?? item?.chainGiven,
        item?.purity,
        item?.loss,
        undefined,
        'cutting',
      );

      return `
      <tr style="${isMelting ? 'opacity:0.75;background-color:#fffbeb;' : ''}">
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${index + 1}</td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
          ${date} ${time}
        </td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${getItemName(item?.item)}</td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;">${getSizeName(item?.size)}</td>
        ${isMelting
          ? `<td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatPurityDisplay(item?.purity)}%</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(item?.chainWeight ?? item?.chainGiven)}</td>
            <td colspan="5" style="border:1px solid #333;padding:3px 2px;text-align:center;font-weight:bold;font-size:11px;color:#785600;background-color:#fffbeb;">Melting</td>`
          : `
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatPurityDisplay(item?.purity)}%</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(item?.chainWeight ?? item?.chainGiven)}</td>
            <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(item?.chainReceived)}</td>
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
        Cutting History Report
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
        <col style="width: 13%;" />
        <col style="width: 8%;" />
        <col style="width: 7%;" />
        <col style="width: 7%;" />
        <col style="width: 8%;" />
        <col style="width: 8%;" />
        <col style="width: 7%;" />
        <col style="width: 11%;" />
        <col style="width: 11%;" />
        <col style="width: 8%;" />
        <col style="width: 14%;" />
      </colgroup>
      <thead>
        <tr style="background:#785600;color:white;font-weight:600;">
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Sr</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Date & Time</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Item</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Size</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Purity %</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Chain Given</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Chain Rec</th>
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
          <td colspan="5" style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;font-weight:bold;color:#000;">Total</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.chainGiven)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.chainReceived)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.scrap)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.expectedLoss)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.actualLoss)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${totals.diffLoss > 0 ? `+${formatNumberDisplay(totals.diffLoss)}` : formatNumberDisplay(totals.diffLoss)}</td>
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
