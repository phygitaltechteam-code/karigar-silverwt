import toast from 'react-hot-toast';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {AlertRule} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';


// ======================================================
// Interfaces
// ======================================================
export interface KundaEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: number;
  chainGiven: number;
  kundaGiven: number;
  chainReceived: number;
  scrap: number;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
  kundaGivenRaw?: string;
  chainReceivedRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
  isDirty?: boolean;
  status?: string;
  process?: string;
  isMelting?: boolean;
  meltingStatus?: boolean;
}

// ======================================================
// Helper Functions
// ======================================================
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

export const getDefaultWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

export const formatDate = (dateString: string) => {
  if (!dateString) return {date: '-', time: '-'};
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

// ======================================================
// Print Function
// ======================================================
export const printSKundaHistory = (
  filteredData: any[],
  dateRange: Date[],
  getpdfheaderdata: any,
  alertRules?: AlertRule[],
) => {
  if (!filteredData || filteredData.length === 0) {
    toast.error(
      'No history records available to print for the selected date range',
    );
    return false;
  }

  const totals = filteredData.reduce(
    (acc: any, item: any) => {
      if (hasMeltingStatus(item)) return acc;
      const inputVal =
        toNumber(item?.chainWeight || item?.chainGiven || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );
      acc.chainGiven += toNumber(item?.chainWeight || item?.chainGiven || 0);
      acc.kundaGiven += toNumber(item?.kundaGiven || item?.kunda || 0);
      acc.chainReceived += toNumber(item?.chainReceived || 0);
      acc.scrap += toNumber(item?.scrap || 0);
      acc.expectedLoss += toNumber(details.expectedLoss || 0);
      acc.actualLoss += toNumber(details.actualLoss || 0);
      acc.diffLoss += toNumber(details.diffLoss || 0);
      return acc;
    },
    {
      chainGiven: 0,
      kundaGiven: 0,
      chainReceived: 0,
      scrap: 0,
      expectedLoss: 0,
      actualLoss: 0,
      diffLoss: 0,
    },
  );

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container-history';
  printContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 100%;
    background: white;
    padding: 0;
    z-index: 9999;
  `;
  document.body.appendChild(printContainer);

  const rows = filteredData
    .map((item: any, index: number) => {
      const {date, time} = formatDate(item?.createdAt);
      const {date: proceedDate, time: proceedTime} = formatDate(
        item?.updatedAt,
      );
      const isMelting = hasMeltingStatus(item);
      const inputVal =
        toNumber(item?.chainGiven || item?.chainWeight || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );

      return `
      <tr style="${isMelting ? 'opacity:0.6;background-color:#fafafa;' : ''}">
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:8px;color:#000;">${index + 1}</td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:7.5px;color:#000;white-space:nowrap;">
          ${date} ${time}
        </td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:8px;color:#000;">${getItemName(item?.item)}</td>
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:8px;color:#000;">${getSizeName(item?.size)}</td>
        ${
          isMelting
            ? `<td colspan="8" style="border:1px solid #333;padding:3px 2px;text-align:center;font-weight:bold;font-size:8.5px;color:#785600;background-color:#fffbeb;">Melting</td>`
            : `
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.chainWeight || item?.chainGiven)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.kundaGiven || item?.kunda || 0)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.chainReceived)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(details.expectedLoss)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(details.actualLoss)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:8px;color:${details.diffLoss > 0 ? '#dc2626' : details.diffLoss < 0 ? '#16a34a' : '#000'};font-weight:bold;">${details.diffLoss > 0 ? '+' : ''}${formatNumberDisplay(details.diffLoss)}</td>
          <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatPurityDisplay(item?.purity)}%</td>
        `
        }
        <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:7.5px;color:#000;white-space:nowrap;">
          ${proceedDate} ${proceedTime}
        </td>
      </tr>
    `;
    })
    .join('');

  const formatDateForDisplay = (date: Date | null | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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

  printContainer.innerHTML = `
    <div style="width:100%;box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;">
      <div>
        <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
            <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">
            ${description}
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
            ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
          </div>
          <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;"></div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
          <div style="flex:1;"></div>
          <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
            S Kunda History Report
          </h2>
          <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
            From: ${formatDateForDisplay(dateRange[0]) || 'Start'} 
            &nbsp;&nbsp; To: ${formatDateForDisplay(dateRange[1]) || 'End'}
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;table-layout:fixed;">
          <colgroup>
            <col style="width: 3%;" />
            <col style="width: 10%;" />
            <col style="width: 9%;" />
            <col style="width: 8%;" />
            <col style="width: 8%;" />
            <col style="width: 8%;" />
            <col style="width: 8%;" />
            <col style="width: 7%;" />
            <col style="width: 8%;" />
            <col style="width: 8%;" />
            <col style="width: 7%;" />
            <col style="width: 6%;" />
            <col style="width: 10%;" />
          </colgroup>
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Sr</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Date & Time</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Item</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Size</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Chain Given</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">S/Kunda Given</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Chain Received</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Scrap</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Expected Loss</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Actual Loss</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Diff Loss</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Purity</th>
              <th style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:7.5px;">Proceed Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot style="background:#f7f5f0;font-weight:bold;">
            <tr>
              <td colspan="4" style="border:1px solid #333;padding:4px 3px;text-align:right;font-size:8px;font-weight:bold;color:#000;">Total:</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-family:monospace;font-size:8px;color:#000;font-weight:bold;">${formatNumberDisplay(totals.chainGiven)}</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-family:monospace;font-size:8px;color:#000;font-weight:bold;">${formatNumberDisplay(totals.kundaGiven)}</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-family:monospace;font-size:8px;color:#000;font-weight:bold;">${formatNumberDisplay(totals.chainReceived)}</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-family:monospace;font-size:8px;color:#000;font-weight:bold;">${formatNumberDisplay(totals.scrap)}</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-family:monospace;font-size:8px;color:#000;font-weight:bold;">${formatNumberDisplay(totals.expectedLoss)}</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-family:monospace;font-size:8px;color:#000;font-weight:bold;">${formatNumberDisplay(totals.actualLoss)}</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-family:monospace;font-size:8px;color:${totals.diffLoss > 0 ? '#dc2626' : totals.diffLoss < 0 ? '#16a34a' : '#000'};font-weight:bold;">${totals.diffLoss > 0 ? '+' : ''}${formatNumberDisplay(totals.diffLoss)}</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-size:8px;color:#000;">-</td>
              <td style="border:1px solid #333;padding:4px 3px;text-align:center;font-size:8px;color:#000;">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @page { size: A4 portrait; margin: 6mm 5mm; }
    @media print {
      body > *:not(#print-container, #print-container-history) { display: none !important; }
      #print-container, #print-container *,
      #print-container-history, #print-container-history * { visibility: visible !important; }
      #print-container, #print-container-history {
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
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: fixed !important;
      }
      tr { page-break-inside: avoid !important; }
      thead tr, thead tr th {
        background: #785600 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      tfoot tr, tfoot tr td {
        background: #f7f5f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
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

  return true;
};

// ======================================================
// Columns Definition (Separated in ./sKundaColumns.tsx)
// ======================================================

export {
  getHistorySKundaColumns,
  getSKundaColumns,
} from './sKundaColumns';

