import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {evaluateLossDetails} from '@/utils/lossReportHelper';
// ======================================================
// Interfaces
// ======================================================

export interface SolderingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  createdAt?: string;
  solderingId?: string | null;
  item: string;
  size: string;
  purity: string;
  basePurity?: number;
  fine: number;
  chainWeight: number;
  chainReceived: number;
  powder: number;
  increase: number;
  scrap: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainReceivedRaw?: string;
  powderRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  fineRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
  isDirty?: boolean;
  status?: string;
  process?: string;
  isMelting?: boolean;
  meltingStatus?: boolean;
}

export interface SolderingCardForm {
  id: string;
  itemId?: string;
  sizeId: string;
  purity: string;
  chainWeight: string;
  fine?: string;
  isSaving?: boolean;
}

// ======================================================
// Helper Functions
// ======================================================
export const createNewSolderingCard = (
  initial?: Partial<SolderingCardForm>,
): SolderingCardForm => ({
  id: `soldering-card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  itemId: initial?.itemId || '',
  sizeId: initial?.sizeId || '',
  purity: initial?.purity || '',
  chainWeight: initial?.chainWeight || '',
  fine: initial?.fine || '',
});

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

export const getCurrentWeekRange = () => {
  const { fromDate, toDate } = getCurrentAppWeekRange();
  return { monday: fromDate, sunday: toDate };
};

export const formatDate = (dateString: string) => {
  if (!dateString) {
    return { date: '-', time: '-' };
  }
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

export const truncateTo3DecimalsStr = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const str = num.toString();
  if (str.includes('.')) {
    const [intPart, decPart] = str.split('.');
    const truncatedDec = decPart.slice(0, 3);
    const res = `${intPart}.${truncatedDec}`.replace(/\.?0+$/, '');
    return res || '0';
  }
  return str;
};

export const formatNumber = (value: any) => {
  return truncateTo3DecimalsStr(value);
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

export const formatPurityDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0.00';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
};

export const toNumber = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

// ======================================================
// Print Function
// ======================================================
export const printSolderingHistory = (
  filteredData: any[],
  fromDate: Date | null,
  toDate: Date | null,
  getpdfheaderdata: any,
) => {
  if (!filteredData || filteredData.length === 0) {
    return false; // Indicating no data
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

  interface PrintHistoryGroup {
    groupKey: string;
    date: string;
    time: string;
    rows: any[];
  }

  const groups: PrintHistoryGroup[] = [];
  const groupMap = new Map<string, PrintHistoryGroup>();

  filteredData.forEach((item) => {
    const groupKey = item.solderingId ?? item.id;
    const { date, time } = formatDate(item.createdAt);

    if (!groupMap.has(groupKey)) {
      const newGroup: PrintHistoryGroup = { groupKey, date, time, rows: [] };
      groupMap.set(groupKey, newGroup);
      groups.push(newGroup);
    }

    groupMap.get(groupKey)!.rows.push(item);
  });

  let globalSrNo = 0;
  const rows = groups
    .map((group) => {
      globalSrNo++;
      const groupSrNo = globalSrNo;
      const rowCount = group.rows.length;

      return group.rows
        .map((item: any, rowIndex: number) => {
          const { date: proceedDate, time: proceedTime } = formatDate(
            item?.updatedAt || item?.createdAt,
          );
          const isMelting = hasMeltingStatus(item);
          const details = evaluateLossDetails(
            item,
            item?.purity,
            item?.loss,
            undefined,
            'soldering',
          );

          const srCell =
            rowIndex === 0
              ? `<td rowspan="${rowCount}" style="border:1px solid #000;padding:2px;text-align:center;font-size:10px;font-weight:bold;color:#785600;vertical-align:middle;background-color:#fff;">
                  ${groupSrNo}
                </td>`
              : '';

          const dateCell =
            rowIndex === 0
              ? `<td rowspan="${rowCount}" style="border:1px solid #000;padding:2px;text-align:center;font-size:10px;color:#000;vertical-align:middle;white-space:nowrap;background-color:#fff;">
                  <div style="font-weight:bold;font-size:10px;color:#000;">${group.date}</div>
                  ${group.time ? `<div style="font-size:9px;color:#000;">${group.time}</div>` : ''}
                </td>`
              : '';

          return `
          <tr style="${isMelting ? 'opacity:0.6;background-color:#fafafa;' : ''}">
            ${srCell}
            ${dateCell}
            <td style="border:1px solid #000;padding:2px;text-align:center;font-size:10px;color:#000;">
              ${getSizeName(item?.size)}
            </td>
            <td style="border:1px solid #000;padding:2px;text-align:center;font-size:10px;color:#000;">
              ${item?.purity || '-'}%
            </td>
            ${
              isMelting
                ? `<td colspan="8" style="border:1px solid #000;padding:2px;text-align:center;font-weight:bold;font-size:10px;color:#785600;background-color:#fffbeb;">Melting</td>`
                : `
                <td style="border:1px solid #000;padding:2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">
                  ${formatNumber(item?.chainWeight)}
                </td>
                <td style="border:1px solid #000;padding:2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">
                  ${formatNumber(item?.chainReceived)}
                </td>
                <td style="border:1px solid #000;padding:2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">
                  ${formatNumber(item?.powder)}
                </td>
                <td style="border:1px solid #000;padding:2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">
                  ${formatNumberDisplay(item?.increase)}%
                </td>
                <td style="border:1px solid #000;padding:2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">
                  ${formatNumber(item?.scrap)}
                </td>
                <td style="border:1px solid #000;padding:2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">
                  ${formatNumberDisplay(details.expectedLoss)}
                </td>
                <td style="border:1px solid #000;padding:2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">
                  ${formatNumberDisplay(details.actualLoss)}
                </td>
                <td style="border:1px solid #000;padding:2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">
                  ${details.diffLoss > 0 ? `+${formatNumberDisplay(details.diffLoss)}` : formatNumberDisplay(details.diffLoss)}
                </td>
              `
            }
            <td style="border:1px solid #000;padding:2px;text-align:center;font-size:10px;color:#000;">
              ${item?.timeTaken || '-'}
            </td>
            <td style="border:1px solid #000;padding:2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
              ${proceedDate} ${proceedTime}
            </td>
          </tr>
        `;
        })
        .join('');
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

  // Calculate totals
  const totals = filteredData.reduce(
    (acc: any, item: any) => {
      if (!hasMeltingStatus(item)) {
        acc.chainWeight += Number(item?.chainWeight || 0);
        acc.chainReceived += Number(item?.chainReceived || 0);
        acc.powder += Number(item?.powder || 0);
        acc.scrap += Number(item?.scrap || 0);
        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          undefined,
          'soldering',
        );
        acc.expectedLoss += Number(details.expectedLoss || 0);
        acc.actualLoss += Number(details.actualLoss || 0);
        acc.diffLoss += Number(details.diffLoss || 0);
      }
      return acc;
    },
    {
      chainWeight: 0,
      chainReceived: 0,
      powder: 0,
      scrap: 0,
      expectedLoss: 0,
      actualLoss: 0,
      diffLoss: 0,
    },
  );

  printContainer.innerHTML = `
     <div style="width:100%;box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;">
        <!-- Header Section -->
        <div style="width:100%;text-align:center;margin:0 0 4px 0;padding:0;">
          <div style="display:flex;justify-space:between;align-items:center;margin:0 0 2px 0;padding:0;">
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

        <!-- Title -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 6px 0;padding:0;">
          <div style="font-size:10px;color:#333;font-weight:600;flex:1;text-align:left;">
            Total: <strong>${filteredData.length}</strong>
          </div>
          <h2 style="margin:0;font-size:15px;color:#000;padding:0;font-weight:bold;text-align:center;flex:2;letter-spacing:0.5px;">
            Soldering History Report
          </h2>
          <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
            ${fromDate && toDate
              ? `From: ${new Date(fromDate).toLocaleDateString('en-IN')} &nbsp; To: ${new Date(toDate).toLocaleDateString('en-IN')}`
              : ''
            }
          </div>
        </div>

        <!-- Table -->
        <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;table-layout:fixed;">
          <colgroup>
            <col style="width: 4%;" />
            <col style="width: 10%;" />
            <col style="width: 6%;" />
            <col style="width: 6%;" />
            <col style="width: 8%;" />
            <col style="width: 8%;" />
            <col style="width: 7%;" />
            <col style="width: 6%;" />
            <col style="width: 7%;" />
            <col style="width: 8%;" />
            <col style="width: 8%;" />
            <col style="width: 8%;" />
            <col style="width: 6%;" />
            <col style="width: 8%;" />
          </colgroup>
          <thead>
            <tr style="background:#785600;color:white;font-weight:600;">
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Sr</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Date & Time</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Size</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Purity %</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Chain Given</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Chain Rec</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Powder</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Inc %</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Scrap</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Expected Loss</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Actual Loss</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Diff Loss</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Gold Aging</th>
              <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Proceed</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background:#f7f5f0;font-weight:bold;">
              <td colspan="4" style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;font-weight:bold;color:#000;">Total</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.chainWeight)}</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.chainReceived)}</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.powder)}</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumber(totals.scrap)}</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.expectedLoss)}</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totals.actualLoss)}</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${totals.diffLoss > 0 ? `+${formatNumberDisplay(totals.diffLoss)}` : formatNumberDisplay(totals.diffLoss)}</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
              <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;color:#000;">-</td>
            </tr>
          </tfoot>
        </table>
     </div>
    `;

  const style = document.createElement('style');
  style.textContent = `
    @page {
      size: A4 portrait;
      margin: 6mm 5mm;
    }
    @media print {
      body > *:not(#print-container) { display: none !important; }
      #print-container, #print-container * { visibility: visible !important; }
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
      #print-container tr { page-break-inside: avoid !important; }
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
// Table Columns Definitions (Separated in ./solderingColumns.tsx)
// ======================================================

export {
  getHistorySolderingColumns,
  getSolderingColumns,
} from './solderingColumns';

