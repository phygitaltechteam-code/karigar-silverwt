import { useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Printer,
} from 'lucide-react';
import { useGetManufacturingData } from '@/lib/api/reportapi';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericWeeklyDatePicker from '../Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { getCurrentAppWeekRange } from '@/utils/weekRangeUtils';
import { evaluateLossDetails } from '@/utils/lossReportHelper';
import ProcessFlowReport from './ProcessFlowReport';

interface ManufacturingItem {
  id: string;
  dateTime: string;
  weight: number;
  scrap: number;
  loss: number;
  expectedLoss: number;
  actualLoss: number;
  diffLoss: number;
  colorClass: string;
  currentWeight: number;
  createdAt: string;
}

interface ManufacturingGroup {
  groupId: string;
  srNo: number;
  item: string;
  size: string;
  purity: number;
  items: ManufacturingItem[];
}

interface ApiResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: {
    totals: {
      totalWeight: number;
      totalScrap: number;
      totalLoss: number;
      currentWeight: number;
    };
    history: ApiDataItem[];
  };
  errors: null;
}

interface ApiDataItem {
  id: string;
  adminId: string;
  itemId: string;
  sizeId: string | null;
  purity: number;
  weight: number;
  scrap: number;
  loss: number;
  currentWeight: number;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    name: string;
    adminId: string;
    createdAt: string;
    updatedAt: string;
  };
  size: {
    id: string;
    size: string;
    adminId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export default function ManufacturingReport() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

  const getDefaultWeekRange = () => {
    const { fromDate, toDate } = getCurrentAppWeekRange();
    return { monday: fromDate, sunday: toDate };
  };

  const [fromDate, setFromDate] = useState<Date | null>(
    () => getDefaultWeekRange().monday,
  );
  const [toDate, setToDate] = useState<Date | null>(
    () => getDefaultWeekRange().sunday,
  );

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      if (isTrial) return;
      const { monday, sunday } = getDefaultWeekRange();
      setFromDate(monday);
      setToDate(sunday);
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, [isTrial]);
  const { data: manufacturingData } = useGetManufacturingData();
  const getpdfheaderdata = useGetHeader();

  // 1. Filter raw history by Date Range and group by Item + Size + Purity
  const allGroups = useMemo<ManufacturingGroup[]>(() => {
    if (!manufacturingData) return [];
    const responseData = manufacturingData as
      | ApiResponse
      | { data?: { history?: ApiDataItem[] }; history?: ApiDataItem[] };

    const historyList: ApiDataItem[] =
      (responseData as any)?.data?.history ||
      (responseData as any)?.history ||
      (Array.isArray(responseData) ? responseData : []);

    if (!Array.isArray(historyList) || historyList.length === 0) {
      return [];
    }

    // Filter by date range directly on createdAt
    const filteredHistory = historyList.filter((item: ApiDataItem) => {
      if (isTrial && !isDateFilterActive) return true;

      const createdAt = new Date(item.createdAt);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (createdAt < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (createdAt > to) return false;
      }
      return true;
    });

    // Group by exact Item + Size + Purity combination
    const groupedMap: {
      [key: string]: {
        item: string;
        size: string;
        purity: number;
        items: ApiDataItem[];
      };
    } = {};

    filteredHistory.forEach((item: ApiDataItem) => {
      const itemName = item.item?.name || 'Unknown Item';
      const sizeName = item.size?.size || 'N/A';
      const purityValue = item.purity || 0;
      const groupKey = `${item.itemId || itemName}|${item.sizeId || sizeName}|${purityValue}`;

      if (!groupedMap[groupKey]) {
        groupedMap[groupKey] = {
          item: itemName,
          size: sizeName,
          purity: purityValue,
          items: [],
        };
      }
      groupedMap[groupKey].items.push(item);
    });

    const groups: ManufacturingGroup[] = [];
    let srNo = 1;
    let groupId = 0;

    Object.keys(groupedMap).forEach((key) => {
      const groupData = groupedMap[key];
      groupId++;

      // Sort items within group by createdAt descending (newest first)
      const sortedItems = [...groupData.items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const items: ManufacturingItem[] = sortedItems.map((item) => {
        const date = new Date(item.createdAt);
        const formattedDate = !isNaN(date.getTime())
          ? date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          : '';
        const formattedTime = !isNaN(date.getTime())
          ? date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
          : '';

        const itemWeight = Number(item.weight) || 0;
        const itemScrap = Number(item.scrap) || 0;
        const itemCurrentWeight = Number(item.currentWeight) || 0;
        const calculatedLoss = Math.max(
          0,
          Math.round((itemWeight - itemScrap - itemCurrentWeight) * 1000) /
          1000,
        );
        const itemLoss =
          item.loss !== undefined && item.loss !== null && item.loss !== 0
            ? Number(item.loss)
            : calculatedLoss;

        const rawExpectedLoss =
          (item as any).expectedLoss !== undefined &&
            (item as any).expectedLoss !== null
            ? Number((item as any).expectedLoss)
            : undefined;

        const lossDetails = evaluateLossDetails(
          itemWeight,
          groupData.purity || item.purity || 0,
          itemLoss,
          groupData.item,
          rawExpectedLoss,
        );

        return {
          id: item.id,
          dateTime: `${formattedDate} ${formattedTime}`.trim(),
          weight: itemWeight,
          scrap: itemScrap,
          loss: lossDetails.actualLoss,
          expectedLoss: lossDetails.expectedLoss,
          actualLoss: lossDetails.actualLoss,
          diffLoss: lossDetails.diffLoss,
          colorClass: lossDetails.colorClass,
          currentWeight: itemCurrentWeight,
          createdAt: item.createdAt,
        };
      });

      groups.push({
        groupId: `group-${groupId}`,
        srNo: srNo++,
        item: groupData.item,
        size: groupData.size,
        purity: groupData.purity,
        items,
      });
    });

    return groups;
  }, [manufacturingData, fromDate, toDate]);

  // 2. Search filter applied across groups
  const filteredGroups = useMemo<ManufacturingGroup[]>(() => {
    if (!searchTerm) return allGroups;
    const query = searchTerm.toLowerCase();

    return allGroups.filter((group) => {
      const matchHeader =
        group.item.toLowerCase().includes(query) ||
        group.size.toLowerCase().includes(query) ||
        group.purity.toString().includes(query) ||
        group.srNo.toString().includes(query);

      if (matchHeader) return true;

      return group.items.some(
        (item) =>
          item.dateTime.toLowerCase().includes(query) ||
          item.weight.toString().includes(query) ||
          item.scrap.toString().includes(query) ||
          item.loss.toString().includes(query) ||
          item.expectedLoss.toString().includes(query) ||
          item.diffLoss.toString().includes(query) ||
          item.currentWeight.toString().includes(query),
      );
    });
  }, [allGroups, searchTerm]);

  // 3. Overall Totals for metrics cards
  const filteredTotals = useMemo(() => {
    let totalWeight = 0;
    let totalScrap = 0;
    let totalLoss = 0;
    let totalExpectedLoss = 0;
    let totalActualLoss = 0;
    let totalDiffLoss = 0;
    let currentWeight = 0;

    filteredGroups.forEach((group) => {
      group.items.forEach((item) => {
        totalWeight += item.weight;
        totalScrap += item.scrap;
        totalLoss += item.loss;
        totalExpectedLoss += item.expectedLoss;
        totalActualLoss += item.actualLoss;
        totalDiffLoss += item.diffLoss;
        currentWeight += item.currentWeight;
      });
    });

    return {
      totalWeight,
      totalScrap,
      totalLoss,
      totalExpectedLoss,
      totalActualLoss,
      totalDiffLoss,
      currentWeight,
    };
  }, [filteredGroups]);

  // 4. All groups on one page (no pagination)
  const currentGroups = filteredGroups;

  // Rows for the table: one per entry, group fields span the group's rows
  const tableRows = useMemo(
    () =>
      currentGroups.flatMap((group: any, groupIndex: number) =>
        group.items.map((item: any, itemIndex: number) => ({
          ...item,
          id: item.id,
          group,
          groupIndex,
          isFirst: itemIndex === 0,
          span: group.items.length,
        })),
      ),
    [currentGroups],
  );

  const cellText = 'font-mono whitespace-nowrap text-sm text-[#1a1c1b] dark:text-white';
  const reportColumns: Column<any>[] = [
    {
      key: 'srNo',
      header: 'Sr No.',
      align: 'center',
      rowSpan: (r: any) => (r.isFirst ? r.span : 0),
      className: 'align-middle border-r border-[#f4f4f2] dark:border-slate-700',
      render: (r: any) => <span className="font-bold text-[#1a1c1b] dark:text-white">{r.group.srNo}</span>,
    },
    {
      key: 'item',
      header: 'Item (Size) (Purity)',
      align: 'center',
      rowSpan: (r: any) => (r.isFirst ? r.span : 0),
      className: 'align-middle border-r border-[#f4f4f2] dark:border-slate-700',
      render: (r: any) => (
        <div className="font-bold text-[#1a1c1b] dark:text-white">
          <div>{r.group.item}</div>
          <div>
            {r.group.size !== 'N/A' ? `(${r.group.size})` : ''}
            {r.group.size !== 'N/A' && r.group.purity > 0 ? ' ' : ''}
            {r.group.purity > 0 ? `(${formatNumber(r.group.purity)}%)` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'dateTime',
      header: 'Date & Time',
      align: 'center',
      render: (r: any) => (
        <div className="whitespace-nowrap text-sm font-medium text-[#1a1c1b] dark:text-white">
          <div>{String(r.dateTime || '').split(' ')[0]}</div>
          <div>{String(r.dateTime || '').split(' ').slice(1).join(' ')}</div>
        </div>
      ),
    },
    { key: 'weight', header: 'Wt. (G)', align: 'center', render: (r: any) => <span className={cellText}>{formatNumber(r.weight)} G</span> },
    { key: 'scrap', header: 'Scrap (G)', align: 'center', render: (r: any) => <span className={cellText}>{formatNumber(r.scrap)} G</span> },
    { key: 'expectedLoss', header: 'Expected Loss (G)', align: 'center', render: (r: any) => <span className={cellText}>{formatNumber(r.expectedLoss)} G</span> },
    {
      key: 'actualLoss',
      header: 'Actual Loss (G)',
      align: 'center',
      render: (r: any) => (
        <span className="font-mono whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">
          {formatNumber(r.actualLoss)} G
        </span>
      ),
    },
    {
      key: 'diffLoss',
      header: 'Diff Loss (G)',
      align: 'center',
      render: (r: any) => (
        <span className={`font-mono whitespace-nowrap text-sm ${r.colorClass || ''}`}>{formatNumber(r.diffLoss)} G</span>
      ),
    },
    { key: 'currentWeight', header: 'Current Wt. (G)', align: 'center', render: (r: any) => <span className={cellText}>{formatNumber(r.currentWeight)} G</span> },
  ];

  // Format number with 3 decimals
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(2);
    return str.replace(/\.?0+$/, '');
  };

  // Format date for display
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Handle From Date
  const handleFromDateChange = (selectedDates: Date[]) => {
    if (isTrial) setIsDateFilterActive(true);
    if (selectedDates && selectedDates.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(0, 0, 0, 0);
      setFromDate(selected);
    } else {
      setFromDate(null);
    }
  };

  // Handle To Date
  const handleToDateChange = (selectedDates: Date[]) => {
    if (isTrial) setIsDateFilterActive(true);
    if (selectedDates && selectedDates.length > 0) {
      const selected = new Date(selectedDates[0]);
      selected.setHours(23, 59, 59, 999);
      setToDate(selected);
    } else {
      setToDate(null);
    }
  };

  const fromInitialDates = useMemo(
    () => (fromDate ? [fromDate] : []),
    [fromDate],
  );
  const toInitialDates = useMemo(() => (toDate ? [toDate] : []), [toDate]);

  const handlePrint = () => {
    if (!filteredGroups || filteredGroups.length === 0) {
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

    let rows = '';
    filteredGroups.forEach((group) => {
      group.items.forEach((item, index) => {
        const isFirst = index === 0;
        rows += `
          <tr>
            ${isFirst
            ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;font-weight:bold;vertical-align:middle;" rowspan="${group.items.length}">${group.srNo}</td>`
            : ''
          }
            ${isFirst
            ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;font-weight:bold;vertical-align:middle;" rowspan="${group.items.length}">
                    ${group.item} ${group.size !== 'N/A' ? `(${group.size})` : ''} ${group.purity > 0 ? `(${group.purity}%)` : ''}
                  </td>`
            : ''
          }
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">
              ${item.dateTime}
            </td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.scrap)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.expectedLoss)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;font-weight:bold;color:#b91c1c;">${formatNumber(item.actualLoss)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;font-weight:bold;color:#c2410c;">${formatNumber(item.diffLoss)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.weight)}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:#000;">${formatNumber(item.currentWeight)}</td>
          </tr>
        `;
      });
    });

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
    const Description =
      headerInfo.Description ||
      'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers =
      headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
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

    printContainer.innerHTML = `
    <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;" >
        <div>
          <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
              <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
              <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
              <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
            </div>
            
            <div style="margin:1px 0 0 0;padding:0;font-size:${DescriptionFontSize};font-weight:bold;color:${DescriptionColor};line-height:1.2;">
              ${Description}
            </div>
            
            <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
              ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
            </div>
            <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;"></div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
            <div style="flex:1;"></div>
            <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
              Manufacturing Report
            </h2>
            ${fromDate || toDate
        ? `
            <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
              ${fromDate ? `From: ${formatDateForDisplay(fromDate)}` : ''} 
              ${fromDate && toDate ? '&nbsp;&nbsp;' : ''}
              ${toDate ? `To: ${formatDateForDisplay(toDate)}` : ''}
            </div>
            `
        : `<div style="flex:1;"></div>`
      }
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;">
            <thead>
              <tr style="background:#785600;color:white;font-weight:600;">
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Sr</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Item (Size) (Purity)</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;white-space:nowrap;">Date & Time</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Scrap</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Expected Loss</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Actual Loss</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Diff Loss</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Wt(g)</th>
                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;">Current Wt</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>

        <div style="width:100%;margin-top:auto;padding-top:4px;">
          <div style="border-top:1px solid #785600;padding-top:2px;text-align:center;">
            <p style="margin:0;font-size:7px;color:#000;">
              This is a computer generated report
            </p>
            <div style="margin-top:1px;font-size:6.5px;color:#000;display:flex;justify-content:center;gap:10px;">
              <span>Powered by Matoshree Gold</span>
              <span>|</span>
              <span>Generated: ${new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })} ${new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}</span>
            </div>
          </div>
        </div>
      </div >
    `;

    const style = document.createElement('style');
    style.textContent = `
  @page {
    size: A4 portrait;
    margin: 0;
  }
  @media print {
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
    }
    body * {
      visibility: hidden;
    }
    #print-container, #print-container * {
      visibility: visible;
    }
    #print-container {
      position: fixed!important;
      left: 0!important;
      top: 0!important;
      width: 210mm!important;
      height: 297mm!important;
      background: white!important;
      padding: 4px!important;
      overflow: auto!important;
      z-index: 9999!important;
      -webkit-print-color-adjust: exact!important;
      print-color-adjust: exact!important;
    }
    #print-container table {
      width: 100% !important;
    }
    #print-container tr {
      page -break-inside: avoid!important;
    }
    #print-container thead tr {
      background: #785600!important;
      color: white!important;
      -webkit-print-color-adjust: exact!important;
      print-color-adjust: exact!important;
    }
    #print-container thead tr th {
      background: #785600!important;
      color: white!important;
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



  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3 md:px-6 lg:flex-row">
          <div className="flex w-full min-w-0 items-center gap-2 lg:w-auto">
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Manufacturing Report
            </h2>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3 lg:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GenericWeeklyDatePicker
                id="from-date-box"
                placeholder="DD/MM/YYYY"
                mode="from"
                initialDates={fromInitialDates}
                onDateChange={handleFromDateChange}
                className="w-32 sm:w-36 md:w-40"
              />

              <GenericWeeklyDatePicker
                id="to-date-box"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={toInitialDates}
                onDateChange={handleToDateChange}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>

            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4 md:px-6">
        {/* Galai → Packaging: loss, scrap and rate per process for the same dates */}
        <ProcessFlowReport
          fromDate={isTrial && !isDateFilterActive ? null : fromDate}
          toDate={isTrial && !isDateFilterActive ? null : toDate}
          header={
            (getpdfheaderdata as any)?.data?.data ||
            (getpdfheaderdata as any)?.data ||
            undefined
          }
        />

        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Total Weight
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.totalWeight)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Total Scrap
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.totalScrap)} G
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Expected Loss
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.totalExpectedLoss)} G
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Actual Loss
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.totalActualLoss)} G
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Diff Loss
              </span>
              <span
                className="text-lg font-bold text-black dark:text-white"
              >
                {formatNumber(filteredTotals.totalDiffLoss)} G
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Current Weight
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(filteredTotals.currentWeight)} G
              </span>
            </div>
          </div>
        </div>

        {/* Table (shared GenericTable; Sr No. and Item span the rows of a group) */}
        <>
          <div className="-mx-3 sm:-mx-4 md:mx-0">
            <GenericTable<any>
              data={tableRows}
              columns={reportColumns}
              pagination={false}
              emptyMessage={
                searchTerm || fromDate || toDate
                  ? 'No manufacturing entries found matching your filters.'
                  : 'No manufacturing entries found.'
              }
              rowClassName={(row: any) =>
                row.groupIndex % 2 === 0
                  ? 'bg-white dark:bg-slate-900'
                  : 'bg-[#f8f6f4] dark:bg-slate-800/60'
              }
            />
          </div>

          </>
      </div>
    </div>
  );
}
