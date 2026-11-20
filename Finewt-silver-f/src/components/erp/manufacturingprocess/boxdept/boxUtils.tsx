import { AlertRule } from '@/lib/api/alertmanagement';
import { evaluateLossDetails } from '@/utils/lossReportHelper';
import toast from 'react-hot-toast';


export interface BoxEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: any;
  purity: number;
  tarWeight: number;
  chainWeight: number;
  scrap: number;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
  purityRaw?: string;
  chainWeightRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  isCompleted?: boolean;
  isDirty?: boolean;
  status?: string;
  process?: string;
  isMelting?: boolean;
  meltingStatus?: boolean;
}

export interface BoxCardForm {
  id: string;
  purity: string;
  tarWeight: string;
  chainWeight: string;
  scrap: string;
  isSaving?: boolean;
}

export const createNewBoxCard = (
  initial?: Partial<BoxCardForm>,
): BoxCardForm => ({
  id: `box-card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  purity: initial?.purity || '',
  scrap: initial?.scrap || '',
  tarWeight: initial?.tarWeight || '',
  chainWeight: initial?.chainWeight || '',
});

// Helper functions for safely extracting values
export const getItemName = (item: any): string => {
  if (!item) return '-';
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item.name) return String(item.name);
  return '-';
};



export const hasMeltingStatus = (item: any): boolean => {
  const s = String(item?.status || item?.process || '').toUpperCase();
  return (
    s === 'MELTING' || item?.isMelting === true || item?.meltingStatus === true
  );
};

export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// Helper function for 3 decimal formatted numbers (NO TRIALing zeroes)
export const truncate3Dec = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.trunc(num * 1000) / 1000;
};

export const formatNumberDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const str = num.toFixed(3);
  return str.replace(/\.?0+$/, '');
};

export const formatPurityDisplay = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '0.00';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
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

export const formatNumber = (value: any) => {
  if (value === null || value === undefined) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toFixed(0);
};

export const printBoxHistory = (
  filteredData: any[],
  dateRangeOrFromDate: any,
  toDateOrHeader?: any,
  pdfHeaderData?: any,
) => {
  let dateRange: any[] = [];
  let getpdfheaderdata = pdfHeaderData;

  if (Array.isArray(dateRangeOrFromDate)) {
    dateRange = dateRangeOrFromDate;
    getpdfheaderdata = toDateOrHeader;
  } else {
    dateRange = [dateRangeOrFromDate, toDateOrHeader];
    getpdfheaderdata = pdfHeaderData;
  }

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

  // Group by breakId matching BoxHistoryGroupedTable
  const breakMap = new Map<string, any[]>();
  const orderedGroups: { type: 'break' | 'single'; id: string; items: any[] }[] = [];

  filteredData.forEach((item) => {
    const bId = item?.breakId;
    if (bId) {
      if (!breakMap.has(bId)) {
        const groupItems: any[] = [];
        breakMap.set(bId, groupItems);
        orderedGroups.push({ type: 'break', id: bId, items: groupItems });
      }
      breakMap.get(bId)!.push(item);
    } else {
      orderedGroups.push({
        type: 'single',
        id: item?.id || String(Math.random()),
        items: [item],
      });
    }
  });

  // Calculate totals
  let totalTarWeight = 0;
  let totalChainWeight = 0;
  let totalScrap = 0;
  let totalExpectedLoss = 0;
  let totalActualLoss = 0;
  let totalDiffLoss = 0;

  orderedGroups.forEach((group) => {
    const maxTarWeight = Math.max(
      ...group.items.map((i) => Number(i.tarWeight || 0)),
    );
    totalTarWeight += maxTarWeight;
    group.items.forEach((item) => {
      if (!hasMeltingStatus(item)) {
        totalChainWeight += Number(item?.chainWeight || 0);
        totalScrap += Number(item?.scrap || 0);
        const lossVal =
          item?.loss ?? (Number(item?.tarWeight || 0) - Number(item?.chainWeight || 0));
        const details = evaluateLossDetails(
          item?.tarWeight,
          item?.purity,
          lossVal,
          undefined,
          'box',
        );
        totalExpectedLoss += Number(details.expectedLoss || 0);
        totalActualLoss += Number(details.actualLoss || 0);
        totalDiffLoss += Number(details.diffLoss || 0);
      }
    });
  });

  const rows = orderedGroups
    .map((group, groupIdx) => {
      const rowCount = group.items.length;
      const first = group.items[0] || {};
      const maxTarWeight = Math.max(
        ...group.items.map((i) => Number(i.tarWeight || 0)),
      );
      const { date, time } = formatDate(first?.createdAt);
      const isEven = groupIdx % 2 === 0;
      const groupBg = isEven ? '#ffffff' : '#faf8f5';

      return group.items
        .map((subItem: any, idx: number) => {
          const isFirst = idx === 0;
          const isMelting = hasMeltingStatus(subItem);
          const { date: proceedDate, time: proceedTime } = formatDate(
            subItem?.updatedAt,
          );
          const lossVal =
            subItem?.loss ??
            (Number(subItem?.tarWeight || 0) - Number(subItem?.chainWeight || 0));
          const details = evaluateLossDetails(
            subItem?.tarWeight || maxTarWeight,
            subItem?.purity || first?.purity,
            lossVal,
            undefined,
            'box',
          );

          return `
            <tr style="background-color:${isMelting ? '#fffbeb' : groupBg};">
              ${isFirst
                ? `
                <td rowspan="${rowCount}" style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;font-weight:600;color:#000;vertical-align:middle;">
                  ${groupIdx + 1}
                </td>
                <td rowspan="${rowCount}" style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;vertical-align:middle;">
                  ${date} ${time}
                </td>
                <td rowspan="${rowCount}" style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;vertical-align:middle;">
                  ${formatPurityDisplay(first?.purity)}%
                </td>
                <td rowspan="${rowCount}" style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;vertical-align:middle;">
                  ${formatNumberDisplay(maxTarWeight)}
                </td>
                `
                : ''
              }
              ${isMelting
                ? `<td colspan="5" style="border:1px solid #333;padding:3px 2px;text-align:center;font-weight:bold;font-size:11px;color:#785600;background-color:#fffbeb;">Melting</td>`
                : `
                <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(subItem?.chainWeight)}</td>
                <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(subItem?.scrap)}</td>
                <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(details.expectedLoss)}</td>
                <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${formatNumberDisplay(details.actualLoss)}</td>
                <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-family:monospace;font-size:10px;color:#000;">${details.diffLoss > 0 ? `+${formatNumberDisplay(details.diffLoss)}` : formatNumberDisplay(details.diffLoss)}</td>
                `
              }
              <td style="border:1px solid #333;padding:3px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;vertical-align:middle;">
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
        Total: <strong>${orderedGroups.length} Groups</strong> (${filteredData.length} entries)
      </div>
      <h2 style="margin:0;font-size:15px;color:#000;padding:0;font-weight:bold;text-align:center;flex:2;letter-spacing:0.5px;">
        Box History Report
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
        <col style="width: 8%;" />
        <col style="width: 8%;" />
        <col style="width: 9%;" />
        <col style="width: 8%;" />
        <col style="width: 11%;" />
        <col style="width: 11%;" />
        <col style="width: 11%;" />
        <col style="width: 16%;" />
      </colgroup>
      <thead>
        <tr style="background:#785600;color:white;font-weight:600;">
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Sr</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Date & Time</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Purity %</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Tar</th>
          <th style="border:1px solid #785600;padding:4px 2px;text-align:center;font-size:10px;">Chain Wt</th>
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
          <td colspan="3" style="border:1px solid #333;padding:4px 2px;text-align:center;font-size:10px;font-weight:bold;color:#000;">Total</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totalTarWeight)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totalChainWeight)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totalScrap)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totalExpectedLoss)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${formatNumberDisplay(totalActualLoss)}</td>
          <td style="border:1px solid #333;padding:4px 2px;text-align:center;font-family:monospace;font-size:10px;font-weight:bold;color:#000;">${totalDiffLoss > 0 ? `+${formatNumberDisplay(totalDiffLoss)}` : formatNumberDisplay(totalDiffLoss)}</td>
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

// ======================================================
// Table Columns Definitions (Separated in ./boxColumns.tsx)
// ======================================================

export {
  isSplitRow,
  getParentId,
  getHistoryBoxColumns,
  getBoxColumns,
} from './boxColumns';

