import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Printer,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useGetHeader } from '@/lib/api/headerapi';
import { useGetDayReport, DayReportData } from '@/lib/api/dayreport';
import GenericDatePicker from '@/components/Forms/DatePicker/GenericDatePicker';
import { evaluateLossDetails } from '@/utils/lossReportHelper';

// ======================================================
// HELPER FUNCTIONS
// ======================================================
const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatNumberDisplay = (value: unknown, decimals = 3): string => {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';

  return num.toFixed(decimals);
};

export interface ProcessItemDetail {
  id: string;
  item: string;
  size: string;
  purity: number | null;
  grossweight: number;
  fineweight: number;
  isCompleted?: boolean;
  name?: string;
}

export interface ProcessGroup {
  id: string;
  processName: string;
  items: ProcessItemDetail[];
  totalGrossWeight: number;
  totalFineWeight: number;
  count: number;
}

export interface BillItemDetail {
  id: string;
  billNumber: string;
  clientName: string;
  itemSummary: string;
  totalWeight: number;
  customerWeight: number;
  remainingWeight: number;
  items: any[];
}

export interface LossItemDetail {
  id: string;
  processName: string;
  loss: number;
  expectedLoss: number;
  actualLoss: number;
  diffLoss: number;
  colorClass?: string;
  createdAt?: string;
}

export interface StockItemDetail {
  id: string;
  item: string;
  size: string;
  purity: number | null;
  grossweight: number;
  fineweight: number;
}

export interface ClientDueEntry {
  id: string;
  paid: number;
  remark: string;
  createdAt?: string;
}

export interface ClientDueDetail {
  clientName: string;
  totalDue: number;
  count: number;
  entries: ClientDueEntry[];
}

const DayReport: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(
    new Set(),
  );
  const [expandedClientDue, setExpandedClientDue] = useState<Set<string>>(
    new Set(),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const formattedDateParam = useMemo(() => {
    if (!selectedDate) return null;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Single API call for all Day Report data with date parameter
  const { data: apiResponse, isLoading: reportLoading } =
    useGetDayReport(formattedDateParam);

  // Safely extract raw report data
  const reportData: DayReportData | null = useMemo(() => {
    if (!apiResponse) return null;
    if ((apiResponse as any)?.data?.data) return (apiResponse as any).data.data;
    if ((apiResponse as any)?.data) return (apiResponse as any).data;
    return apiResponse as any;
  }, [apiResponse]);

  const summary = reportData?.summary || {
    totalProcessWeight: 0,
    totalProcessFineWeight: 0,
    totalDuePaidWeight: 0,
    totalLossWeight: 0,
    totalLossFineWeight: 0,
    totalStockInwardWeight: 0,
    totalStockOutwardWeight: 0,
    totalBillsWeight: 0,
    totalBillsCustomerWeight: 0,
    totalBillsRemainingWeight: 0,
    counts: {
      process: 0,
      clientDuePaid: 0,
      loss: 0,
      stockInward: 0,
      stockOutward: 0,
      bills: 0,
    },
    byProcess: {},
  };

  // 1. Grouped Process Data
  const processGroups: ProcessGroup[] = useMemo(() => {
    if (!reportData) return [];

    const processDefs: Array<{ key: string; label: string }> = [
      { key: 'tar', label: 'Tar Process' },
      { key: 'box', label: 'Box Process' },
      { key: 'soldering', label: 'Soldering Process' },
      { key: 'joint', label: 'Joint Process' },
      { key: 'cutting', label: 'Cutting Process' },
      { key: 'kunda', label: 'Kunda Process' },
      { key: 'melting', label: 'Melting Process' },
    ];

    const groups: ProcessGroup[] = [];

    if (reportData.process) {
      processDefs.forEach(({ key, label }) => {
        const rawItems = (reportData.process as any)?.[key];
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const items: ProcessItemDetail[] = rawItems.map(
            (it: any, idx: number) => {
              const purityVal =
                it.purity !== undefined && it.purity !== null
                  ? toNumber(it.purity)
                  : null;
              const gw = toNumber(
                it.weight ?? it.grossweight ?? it.grossWeight ?? 0,
              );
              const fw =
                it.fineWeight !== undefined || it.fineweight !== undefined
                  ? toNumber(it.fineWeight ?? it.fineweight ?? 0)
                  : purityVal !== null
                    ? (gw * purityVal) / 100
                    : gw;

              return {
                id: it.id || `${key}-${idx}`,
                item: it.itemName || it.item || it.name || '-',
                size: it.size || '-',
                purity: purityVal,
                grossweight: gw,
                fineweight: fw,
                isCompleted: it.isCompleted,
                name: it.name,
              };
            },
          );

          const totalGrossWeight = items.reduce(
            (sum, i) => sum + i.grossweight,
            0,
          );
          const totalFineWeight = items.reduce(
            (sum, i) => sum + i.fineweight,
            0,
          );

          groups.push({
            id: `process-${key}`,
            processName: label,
            items,
            totalGrossWeight,
            totalFineWeight,
            count: items.length,
          });
        }
      });
    }

    // Fallback to processList or process.all
    const fallbackList = reportData.processList || reportData.process?.all;
    if (
      groups.length === 0 &&
      Array.isArray(fallbackList) &&
      fallbackList.length > 0
    ) {
      const groupMap: Record<string, { label: string; items: any[] }> = {
        tar: { label: 'Tar Process', items: [] },
        box: { label: 'Box Process', items: [] },
        soldering: { label: 'Soldering Process', items: [] },
        joint: { label: 'Joint Process', items: [] },
        cutting: { label: 'Cutting Process', items: [] },
        kunda: { label: 'Kunda Process', items: [] },
        melting: { label: 'Melting Process', items: [] },
        other: { label: 'Other Process', items: [] },
      };

      fallbackList.forEach((it: any) => {
        const pName = (it.processName || it.name || '').toUpperCase();
        if (pName.includes('TAR')) groupMap.tar.items.push(it);
        else if (pName.includes('BOX')) groupMap.box.items.push(it);
        else if (pName.includes('SOLDER')) groupMap.soldering.items.push(it);
        else if (pName.includes('JOINT')) groupMap.joint.items.push(it);
        else if (pName.includes('CUTTING')) groupMap.cutting.items.push(it);
        else if (pName.includes('KUNDA')) groupMap.kunda.items.push(it);
        else if (pName.includes('MELTING')) groupMap.melting.items.push(it);
        else groupMap.other.items.push(it);
      });

      Object.entries(groupMap).forEach(([k, val]) => {
        if (val.items.length > 0) {
          const items: ProcessItemDetail[] = val.items.map(
            (it: any, idx: number) => {
              const purityVal =
                it.purity !== undefined && it.purity !== null
                  ? toNumber(it.purity)
                  : null;
              const gw = toNumber(
                it.weight ?? it.grossweight ?? it.grossWeight ?? 0,
              );
              const fw =
                it.fineWeight !== undefined || it.fineweight !== undefined
                  ? toNumber(it.fineWeight ?? it.fineweight ?? 0)
                  : purityVal !== null
                    ? (gw * purityVal) / 100
                    : gw;

              return {
                id: it.id || `all-${k}-${idx}`,
                item: it.itemName || it.item || it.name || '-',
                size: it.size || '-',
                purity: purityVal,
                grossweight: gw,
                fineweight: fw,
                isCompleted: it.isCompleted,
                name: it.name,
              };
            },
          );

          const totalGrossWeight = items.reduce(
            (sum, i) => sum + i.grossweight,
            0,
          );
          const totalFineWeight = items.reduce(
            (sum, i) => sum + i.fineweight,
            0,
          );

          groups.push({
            id: `process-${k}`,
            processName: val.label,
            items,
            totalGrossWeight,
            totalFineWeight,
            count: items.length,
          });
        }
      });
    }

    return groups;
  }, [reportData]);

  const toggleProcess = (id: string) => {
    setExpandedProcesses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleClientDue = (clientName: string) => {
    setExpandedClientDue((prev) => {
      const next = new Set(prev);
      if (next.has(clientName)) {
        next.delete(clientName);
      } else {
        next.add(clientName);
      }
      return next;
    });
  };

  // 2. Client Due Grouped by Client (Collapsible)
  const groupedClientDue = useMemo<ClientDueDetail[]>(() => {
    const rawList =
      reportData?.clientDuePaid ||
      reportData?.settlement ||
      reportData?.clientDue;
    if (!rawList || !Array.isArray(rawList)) return [];

    const map = new Map<string, ClientDueDetail>();

    rawList.forEach((s: any, idx: number) => {
      const cName = (s.clientName || s.name || 'Unknown Client').trim();
      const paidVal = toNumber(
        s.duePaid ??
        s.weight ??
        s.grossweight ??
        s.fineweight ??
        Math.abs(s.due ?? 0),
      );
      const entry: ClientDueEntry = {
        id: s.id || `settle-${idx}`,
        paid: paidVal,
        remark: s.remark || 'Client Due',
        createdAt: s.createdAt,
      };

      if (!map.has(cName)) {
        map.set(cName, {
          clientName: cName,
          totalDue: paidVal,
          count: 1,
          entries: [entry],
        });
      } else {
        const existing = map.get(cName)!;
        existing.totalDue += paidVal;
        existing.count += 1;
        existing.entries.push(entry);
      }
    });

    return Array.from(map.values());
  }, [
    reportData?.clientDuePaid,
    reportData?.settlement,
    reportData?.clientDue,
  ]);

  // 3. Loss Items
  const todayLossItems: LossItemDetail[] = useMemo(() => {
    const rawLoss =
      reportData?.lossList ||
      reportData?.losses ||
      (reportData?.loss as any)?.list ||
      (reportData?.loss as any)?.all ||
      (reportData?.loss as any)?.process?.all ||
      (Array.isArray(reportData?.loss) ? reportData.loss : []);

    if (!rawLoss || !Array.isArray(rawLoss)) return [];

    return rawLoss.map((item: any, idx: number) => {
      const particularStr =
        item.processName ||
        (typeof item.item === 'object' ? item.item?.name : item.item) ||
        item.itemName ||
        item.name ||
        'Process Loss';

      const weight = toNumber(
        item.weight ??
        item.grossweight ??
        item.grossWeight ??
        item.chainWeight ??
        item.chainGiven ??
        0,
      );
      const purity =
        item.purity !== undefined && item.purity !== null
          ? toNumber(item.purity)
          : 0;
      const actualLossVal = toNumber(
        item.actualLoss ?? item.loss ?? item.lossWeight ?? item.weight ?? 0,
      );
      const rawExpectedLoss =
        item.expectedLoss !== undefined && item.expectedLoss !== null
          ? toNumber(item.expectedLoss)
          : undefined;

      const lossDetails = evaluateLossDetails(
        weight,
        purity,
        actualLossVal,
        particularStr,
        rawExpectedLoss,
      );

      return {
        id: item.id || `loss-${idx}`,
        processName: particularStr,
        loss: lossDetails.actualLoss,
        expectedLoss: lossDetails.expectedLoss,
        actualLoss: lossDetails.actualLoss,
        diffLoss: lossDetails.diffLoss,
        colorClass: lossDetails.colorClass,
        createdAt: item.createdAt,
      };
    });
  }, [reportData?.loss, reportData?.lossList, reportData?.losses]);

  // 4. Stock Inward Items
  const stockInwardItems: StockItemDetail[] = useMemo(() => {
    const rawInward =
      reportData?.stock?.inward ||
      (reportData as any)?.stockInward ||
      reportData?.newStock;
    if (!rawInward || !Array.isArray(rawInward)) return [];

    return rawInward.map((it: any, idx: number) => {
      const purityVal =
        it.purity !== undefined && it.purity !== null
          ? toNumber(it.purity)
          : null;
      const gw = toNumber(it.weight ?? it.grossweight ?? it.grossWeight ?? 0);
      const fw =
        it.fineWeight !== undefined || it.fineweight !== undefined
          ? toNumber(it.fineWeight ?? it.fineweight ?? 0)
          : purityVal !== null
            ? (gw * purityVal) / 100
            : gw;

      return {
        id: it.id || `inward-${idx}`,
        item: it.itemName || it.item || it.name || '-',
        size: it.size || '-',
        purity: purityVal,
        grossweight: gw,
        fineweight: fw,
      };
    });
  }, [
    reportData?.stock?.inward,
    (reportData as any)?.stockInward,
    reportData?.newStock,
  ]);

  // 5. Stock Outward Items
  const stockOutwardItems: StockItemDetail[] = useMemo(() => {
    const rawOutward =
      reportData?.stock?.outward || (reportData as any)?.stockOutward;
    if (!rawOutward || !Array.isArray(rawOutward)) return [];

    return rawOutward.map((it: any, idx: number) => {
      const purityVal =
        it.purity !== undefined && it.purity !== null
          ? toNumber(it.purity)
          : null;
      const gw = toNumber(it.weight ?? it.grossweight ?? it.grossWeight ?? 0);
      const fw =
        it.fineWeight !== undefined || it.fineweight !== undefined
          ? toNumber(it.fineWeight ?? it.fineweight ?? 0)
          : purityVal !== null
            ? (gw * purityVal) / 100
            : gw;

      return {
        id: it.id || `outward-${idx}`,
        item: it.itemName || it.item || it.name || '-',
        size: it.size || '-',
        purity: purityVal,
        grossweight: gw,
        fineweight: fw,
      };
    });
  }, [reportData?.stock?.outward, (reportData as any)?.stockOutward]);

  // 6. Bills Items
  const billsList: BillItemDetail[] = useMemo(() => {
    if (!reportData?.bills || !Array.isArray(reportData.bills)) return [];
    return reportData.bills.map((b: any, idx: number) => {
      const rawItems =
        Array.isArray(b.items) && b.items.length > 0
          ? b.items
          : b.item || b.itemName || b.name
            ? [b]
            : [];

      const itemDescription =
        rawItems.length > 0
          ? rawItems
            .map((it: any) => {
              const name =
                (typeof it.item === 'object' ? it.item?.name : it.item) ||
                it.itemName ||
                it.name ||
                '-';
              const sizeStr =
                typeof it.size === 'object' ? it.size?.size : it.size;
              const size = sizeStr && sizeStr !== '-' ? ` (${sizeStr})` : '';
              const purityVal =
                it.purity !== undefined &&
                  it.purity !== null &&
                  it.purity !== ''
                  ? it.purity
                  : null;
              const purity = purityVal !== null ? ` (${purityVal}%)` : '';
              return `${name}${size}${purity}`;
            })
            .join(', ')
          : '-';

      return {
        id: b.id || `bill-${idx}`,
        billNumber: b.billNumber || `BILL-${idx + 1}`,
        clientName:
          (typeof b.client === 'object'
            ? b.client?.fullName || b.client?.name
            : b.clientName) ||
          b.name ||
          '-',
        itemSummary: itemDescription,
        totalWeight: toNumber(b.totalWeight ?? b.grossweight ?? b.weight ?? 0),
        customerWeight: toNumber(b.customerWeight ?? 0),
        remainingWeight: toNumber(
          b.remainingWeight ?? b.fineWeight ?? b.fineweight ?? 0,
        ),
        items: rawItems,
      };
    });
  }, [reportData?.bills]);

  // Filter by search term
  const filteredProcessGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return processGroups;

    return processGroups
      .map((group) => {
        const matchesGroup = group.processName.toLowerCase().includes(term);
        const matchingItems = group.items.filter(
          (it) =>
            it.item.toLowerCase().includes(term) ||
            it.size.toLowerCase().includes(term) ||
            (it.purity !== null && it.purity.toString().includes(term)) ||
            it.grossweight.toString().includes(term) ||
            it.fineweight.toString().includes(term),
        );

        if (matchesGroup) return group;
        if (matchingItems.length > 0) {
          return {
            ...group,
            items: matchingItems,
            totalGrossWeight: matchingItems.reduce(
              (sum, i) => sum + i.grossweight,
              0,
            ),
            totalFineWeight: matchingItems.reduce(
              (sum, i) => sum + i.fineweight,
              0,
            ),
            count: matchingItems.length,
          };
        }
        return null;
      })
      .filter((g): g is ProcessGroup => g !== null);
  }, [processGroups, searchTerm]);

  const filteredClientDue = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return groupedClientDue;
    return groupedClientDue.filter(
      (c) =>
        c.clientName.toLowerCase().includes(term) ||
        c.totalDue.toString().includes(term) ||
        c.entries.some(
          (e) =>
            e.remark.toLowerCase().includes(term) ||
            e.paid.toString().includes(term),
        ),
    );
  }, [groupedClientDue, searchTerm]);

  const filteredLoss = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return todayLossItems;
    return todayLossItems.filter(
      (l) =>
        (l.processName || (l as any).particular || '')
          .toLowerCase()
          .includes(term) ||
        l.loss.toString().includes(term) ||
        l.expectedLoss.toString().includes(term) ||
        l.actualLoss.toString().includes(term) ||
        l.diffLoss.toString().includes(term),
    );
  }, [todayLossItems, searchTerm]);

  const filteredStockInward = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return stockInwardItems;
    return stockInwardItems.filter(
      (it) =>
        it.item.toLowerCase().includes(term) ||
        it.size.toLowerCase().includes(term) ||
        (it.purity !== null && it.purity.toString().includes(term)) ||
        it.grossweight.toString().includes(term) ||
        it.fineweight.toString().includes(term),
    );
  }, [stockInwardItems, searchTerm]);

  const filteredStockOutward = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return stockOutwardItems;
    return stockOutwardItems.filter(
      (it) =>
        it.item.toLowerCase().includes(term) ||
        it.size.toLowerCase().includes(term) ||
        (it.purity !== null && it.purity.toString().includes(term)) ||
        it.grossweight.toString().includes(term) ||
        it.fineweight.toString().includes(term),
    );
  }, [stockOutwardItems, searchTerm]);

  const filteredBills = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return billsList;
    return billsList.filter(
      (b) =>
        b.billNumber.toLowerCase().includes(term) ||
        b.clientName.toLowerCase().includes(term) ||
        b.itemSummary.toLowerCase().includes(term) ||
        b.totalWeight.toString().includes(term) ||
        b.remainingWeight.toString().includes(term),
    );
  }, [billsList, searchTerm]);

  // Dynamic Totals
  const processTotals = useMemo(() => {
    const gross = filteredProcessGroups.reduce(
      (sum, g) => sum + g.totalGrossWeight,
      0,
    );
    const fine = filteredProcessGroups.reduce(
      (sum, g) => sum + g.totalFineWeight,
      0,
    );
    const count = filteredProcessGroups.reduce((sum, g) => sum + g.count, 0);
    return { gross, fine, count };
  }, [filteredProcessGroups]);

  const settlementTotals = useMemo(() => {
    const total = filteredClientDue.reduce((sum, i) => sum + i.totalDue, 0);
    return { total, count: filteredClientDue.length };
  }, [filteredClientDue]);

  const lossTotals = useMemo(() => {
    const total = filteredLoss.reduce((sum, i) => sum + i.loss, 0);
    const expected = filteredLoss.reduce(
      (sum, i) => sum + (i.expectedLoss || 0),
      0,
    );
    const actual = filteredLoss.reduce(
      (sum, i) => sum + (i.actualLoss || 0),
      0,
    );
    const diff = filteredLoss.reduce((sum, i) => sum + (i.diffLoss || 0), 0);
    return {
      total,
      expected,
      actual,
      diff,
      count: filteredLoss.length,
    };
  }, [filteredLoss]);

  const stockInwardTotals = useMemo(() => {
    const gross = filteredStockInward.reduce(
      (sum, i) => sum + i.grossweight,
      0,
    );
    const fine = filteredStockInward.reduce((sum, i) => sum + i.fineweight, 0);
    return { gross, fine, count: filteredStockInward.length };
  }, [filteredStockInward]);

  const stockOutwardTotals = useMemo(() => {
    const gross = filteredStockOutward.reduce(
      (sum, i) => sum + i.grossweight,
      0,
    );
    const fine = filteredStockOutward.reduce((sum, i) => sum + i.fineweight, 0);
    return { gross, fine, count: filteredStockOutward.length };
  }, [filteredStockOutward]);

  // Print Handler
  const handlePrint = () => {
    const headerInfo = getpdfheaderdata?.data?.data || {};
    const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
    const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
    const phoneNumbers =
      headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
    const leftInvocation = headerInfo.leftInvocation || '॥ श्री गणेश प्रसन्न ॥';
    const rightInvocation =
      headerInfo.rightInvocation || '॥ श्री साई प्रसन्न ॥';
    const Description =
      headerInfo.Description ||
      'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
    const invocationColor = headerInfo.invocationColor || '#a84b20';
    const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
    const DescriptionColor = headerInfo.DescriptionColor || '#8b451f';
    const proprietorColor = headerInfo.proprietorColor || '#a84b20';
    const phoneColor = headerInfo.phoneColor || '#a84b20';
    const factoryFontSize = headerInfo.factoryFontSize
      ? `${headerInfo.factoryFontSize}px`
      : '20px';
    const DescriptionFontSize = headerInfo.DescriptionFontSize
      ? `${headerInfo.DescriptionFontSize}px`
      : '9px';
    const proprietorFontSize = headerInfo.proprietorFontSize
      ? `${ headerInfo.proprietorFontSize } px`
      : '9px';
    const phoneFontSize = headerInfo.phoneFontSize
      ? `${ headerInfo.phoneFontSize } px`
      : '9px';

    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';

    // 1. Process Groups Tables HTML
    let processTablesHtml = '';
    filteredProcessGroups.forEach((group) => {
      const rowsHtml = group.items
        .map(
          (item, idx) => `
    <tr style="border-bottom:1px solid #785600;" >
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${idx + 1}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.item || item.name || '-'} ${item.size ? `(${item.size})` : ''}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${formatNumberDisplay(item.grossweight)}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.purity !== null ? formatNumberDisplay(item.purity, 2) + '%' : '-'}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;">${formatNumberDisplay(item.fineweight)}</td>
                </tr >
  `,
        )
        .join('');

      processTablesHtml += `
  <div style="margin-bottom:8px;page-break-inside:avoid;" >
                    <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:700;">${group.processName}</span>
                        <span style="font-size:8.5px;color:#000;">Gross: <b>${formatNumberDisplay(group.totalGrossWeight)} G</b> | Fine: <b>${formatNumberDisplay(group.totalFineWeight)} G</b> | Items: <b>${group.count}</b></span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
                        <thead>
                            <tr style="background:#785600;color:white;font-weight:600;">
                                <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
                                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Item (Size)</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Gross WT (G)</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:65px;text-align:center;font-size:8px;color:white;">Purity</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Fine WT (G)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml || `<tr><td colspan="5" style="border:1px solid #785600;padding:4px;text-align:center;font-size:8px;color:#666;">No items</td></tr>`}
                        </tbody>
                    </table>
                </div >
  `;
    });

    // 2. Loss Table HTML
    let lossTableHtml = '';
    if (filteredLoss.length > 0) {
      const lossRows = filteredLoss
        .map(
          (item, idx) => `
  <tr style="border-bottom:1px solid #785600;" >
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${idx + 1}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.processName || (item as any).particular || 'Loss'}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${formatNumberDisplay(item.expectedLoss)} G</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;color:#b91c1c;">${formatNumberDisplay(item.actualLoss)} G</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;${item.diffLoss > 0 ? 'color:#b91c1c;' : 'color:#15803d;'}">${formatNumberDisplay(item.diffLoss)} G</td>
                </tr >
  `,
        )
        .join('');

      lossTableHtml = `
  <div style="margin-bottom:8px;page-break-inside:avoid;" >
                    <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:700;">Today's Loss</span>
                        <span style="font-size:8.5px;color:#000;">Expected: <b>${formatNumberDisplay(lossTotals.expected)} G</b> | Actual: <b>${formatNumberDisplay(lossTotals.actual)} G</b> | Diff: <b>${formatNumberDisplay(lossTotals.diff)} G</b> | Items: <b>${lossTotals.count}</b></span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
                        <thead>
                            <tr style="background:#785600;color:white;font-weight:600;">
                                <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
                                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Process / Particular</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:75px;text-align:center;font-size:8px;color:white;">Expected Loss (G)</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:75px;text-align:center;font-size:8px;color:white;">Actual Loss (G)</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:75px;text-align:center;font-size:8px;color:white;">Difference (G)</th>
                            </tr>
                        </thead>
                        <tbody>${lossRows}</tbody>
                    </table>
                </div >
  `;
    }

    // 3. Stock Inward Table HTML
    let stockInwardHtml = '';
    if (filteredStockInward.length > 0) {
      const inwardRows = filteredStockInward
        .map(
          (item, idx) => `
  <tr style="border-bottom:1px solid #785600;" >
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${idx + 1}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.item} ${item.size ? `(${item.size})` : ''}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${formatNumberDisplay(item.grossweight)}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.purity !== null ? formatNumberDisplay(item.purity, 2) + '%' : '-'}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;">${formatNumberDisplay(item.fineweight)}</td>
                </tr >
  `,
        )
        .join('');

      stockInwardHtml = `
  <div style="margin-bottom:8px;page-break-inside:avoid;" >
                    <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:700;">Stock Inward</span>
                        <span style="font-size:8.5px;color:#000;">Gross: <b>${formatNumberDisplay(stockInwardTotals.gross)} G</b> | Fine: <b>${formatNumberDisplay(stockInwardTotals.fine)} G</b> | Items: <b>${stockInwardTotals.count}</b></span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
                        <thead>
                            <tr style="background:#785600;color:white;font-weight:600;">
                                <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
                                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Item (Size)</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Gross WT (G)</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:65px;text-align:center;font-size:8px;color:white;">Purity</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Fine WT (G)</th>
                            </tr>
                        </thead>
                        <tbody>${inwardRows}</tbody>
                    </table>
                </div >
  `;
    }

    // 4. Stock Outward Table HTML
    let stockOutwardHtml = '';
    if (filteredStockOutward.length > 0) {
      const outwardRows = filteredStockOutward
        .map(
          (item, idx) => `
  <tr style="border-bottom:1px solid #785600;" >
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${idx + 1}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.item} ${item.size ? `(${item.size})` : ''}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${formatNumberDisplay(item.grossweight)}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.purity !== null ? formatNumberDisplay(item.purity, 2) + '%' : '-'}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;">${formatNumberDisplay(item.fineweight)}</td>
                </tr >
  `,
        )
        .join('');

      stockOutwardHtml = `
  <div style="margin-bottom:8px;page-break-inside:avoid;" >
                    <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:700;">Stock Outward</span>
                        <span style="font-size:8.5px;color:#000;">Gross: <b>${formatNumberDisplay(stockOutwardTotals.gross)} G</b> | Fine: <b>${formatNumberDisplay(stockOutwardTotals.fine)} G</b> | Items: <b>${stockOutwardTotals.count}</b></span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
                        <thead>
                            <tr style="background:#785600;color:white;font-weight:600;">
                                <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
                                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Item (Size)</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Gross WT (G)</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:65px;text-align:center;font-size:8px;color:white;">Purity</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:80px;text-align:center;font-size:8px;color:white;">Fine WT (G)</th>
                            </tr>
                        </thead>
                        <tbody>${outwardRows}</tbody>
                    </table>
                </div >
  `;
    }

    // 5. Client Due / Settlement Table HTML
    let clientDueHtml = '';
    if (filteredClientDue.length > 0) {
      const dueRows = filteredClientDue
        .map(
          (item, idx) => `
  <tr style="border-bottom:1px solid #785600;" >
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${idx + 1}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:600;">${item.clientName}</td>
                    <td style="border:1px solid #785600;padding:2px 3px;text-align:center;color:#000;font-size:8.5px;font-weight:bold;">${formatNumberDisplay(item.totalDue)} G</td>
                </tr >
  `,
        )
        .join('');

      clientDueHtml = `
  <div style="margin-bottom:8px;page-break-inside:avoid;" >
                    <div style="background:#fff8e6;padding:3px 6px;font-weight:bold;font-size:9.5px;border:1px solid #785600;border-bottom:none;color:#785600;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:700;">Customer Settlement</span>
                        <span style="font-size:8.5px;color:#000;">Total Settlement: <b>${formatNumberDisplay(settlementTotals.total)} G</b> | Clients: <b>${settlementTotals.count}</b></span>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:8.5px;margin:0;padding:0;">
                        <thead>
                            <tr style="background:#785600;color:white;font-weight:600;">
                                <th style="border:1px solid #785600;padding:2px 3px;width:32px;text-align:center;font-size:8px;color:white;">Sr. No</th>
                                <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:8px;color:white;">Client Name</th>
                                <th style="border:1px solid #785600;padding:2px 3px;width:100px;text-align:center;font-size:8px;color:white;">Settlement (G)</th>
                            </tr>
                        </thead>
                        <tbody>${dueRows}</tbody>
                    </table>
                </div >
  `;
    }

    printContainer.innerHTML = `
  <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;" >
                <div>
                    <!-- Factory Header -->
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

                    <!-- Title & Date -->
                    <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
                        <div style="flex:1;"></div>
                        <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
                            Daily Report
                        </h2>
                        <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
                            Date: ${selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    </div>

                    <!-- Day Summary Overview Box -->
                    <div style="display:flex;justify-content:space-around;background:#fff8e6;border:1px solid #785600;padding:5px;margin-bottom:8px;font-size:9.5px;font-weight:bold;color:#000;">
                        <div>Process Gross: <span style="color:#785600;">${formatNumberDisplay(processTotals.gross)} G</span></div>
                        <div>Process Fine: <span style="color:#785600;">${formatNumberDisplay(processTotals.fine)} G</span></div>
                        <div>Total Loss: <span style="color:#b91c1c;">${formatNumberDisplay(lossTotals.total)} G</span></div>
                        <div>Inward Fine: <span style="color:#785600;">${formatNumberDisplay(stockInwardTotals.fine)} G</span></div>
                        <div>Customer Settlement: <span style="color:#785600;">${formatNumberDisplay(settlementTotals.total)} G</span></div>
                    </div>

                    <!-- Tables -->
                    <div style="display:flex;gap:10px;width:100%;align-items:flex-start;">
                        <!-- Column 1 -->
                        <div style="flex:1;display:flex;flex-direction:column;">
                            ${processTablesHtml}
                        </div>
                        <!-- Column 2 -->
                        <div style="flex:1;display:flex;flex-direction:column;">
                            ${lossTableHtml}
                            ${clientDueHtml}
                        </div>
                        <!-- Column 3 -->
                        <div style="flex:1;display:flex;flex-direction:column;">
                            ${stockInwardHtml}
                            ${stockOutwardHtml}
                        </div>
                    </div>
                </div>

                <!--Footer -->
  <div style="width:100%;margin-top:auto;padding-top:4px;">
    <div style="border-top:1px solid #785600;padding-top:2px;text-align:center;">
      <p style="margin:0;font-size:7px;color:#000;">
        This is a computer generated report
      </p>
      <div style="margin-top:1px;font-size:6.5px;color:#000;display:flex;justify-content:center;gap:10px;">
        <span>Powered by Matoshree Gold</span>
        <span>|</span>
        <span>Generated: ${new Date().toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          },
        )} ${new Date().toLocaleTimeString('en-IN', {
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
    document.body.appendChild(printContainer);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (document.body.contains(printContainer))
          document.body.removeChild(printContainer);
        if (document.head.contains(style)) document.head.removeChild(style);
      }, 1000);
    }, 300);
  };

  if (reportLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#785600]" />
          <p className="mt-4 font-semibold text-[#785600] dark:text-amber-400">
            Loading Daily Report...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12 dark:bg-slate-950">
      {/* Top Sticky Header - Like RealTimeGoldReport */}
      <div className="sticky top-0 z-30 border-b border-[#d3c4af]/30 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-4 md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-headline text-xl font-black italic tracking-tight text-[#1a1a2e] dark:text-white sm:text-2xl lg:text-3xl">
              Daily Report
            </h1>
            <p className="text-xs text-[#4f4535] dark:text-slate-400">
              {selectedDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex w-full flex-nowrap items-center gap-2 lg:w-auto lg:justify-end">
            <GenericDatePicker
              id="day-report-date-picker"
              initialDate={selectedDate}
              onDateChange={(dates) => {
                if (dates && dates[0]) {
                  setSelectedDate(dates[0]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />

            <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f4535]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#4f4535] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-[#785600] font-semibold text-white transition-colors hover:bg-[#5d4200] h-9 px-4 text-xs sm:text-[13px]"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {/* 1. TODAY'S PROCESS & TODAY'S LOSS Panel */}
          <div className="flex flex-col gap-4">
            {/* TODAY'S PROCESS */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                  Today's Process
                </span>
              </div>
              <div className="flex flex-1 flex-col overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="w-7 px-2 py-2.5 text-center"></th>
                      <th className="px-3 py-2.5">Process / Item</th>
                      <th className="px-3 py-2.5 text-right">Gross (G)</th>
                      <th className="px-3 py-2.5 text-right">Fine (G)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                    {filteredProcessGroups.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-xs text-[#4f4535] dark:text-slate-400"
                        >
                          No process records found.
                        </td>
                      </tr>
                    ) : (
                      filteredProcessGroups.map((group) => {
                        const isExpanded = expandedProcesses.has(group.id);
                        return (
                          <React.Fragment key={group.id}>
                            <tr
                              onClick={() => toggleProcess(group.id)}
                              className={`cursor-pointer transition-colors ${
  isExpanded
    ? 'bg-[#785600]/10 dark:bg-amber-900/20'
    : 'hover:bg-[#785600]/5 dark:hover:bg-slate-800/40'
} `}
                            >
                              <td className="px-2 py-2.5 text-center">
                                <div className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#785600]/10 text-[#785600] dark:bg-amber-400/20 dark:text-amber-400">
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                                {group.processName}
                              </td>
                              <td className="font-mono px-3 py-2.5 text-right font-bold text-[#1a1c1b] dark:text-slate-100">
                                {formatNumberDisplay(group.totalGrossWeight)}
                              </td>
                              <td className="font-mono px-3 py-2.5 text-right font-bold text-[#785600] dark:text-amber-400">
                                {formatNumberDisplay(group.totalFineWeight)}
                              </td>
                            </tr>

                            {isExpanded &&
                              group.items.map((item, idx) => (
                                <tr
                                  key={item.id || `${ group.id } -${ idx } `}
                                  className="border-b border-[#d3c4af]/10 bg-[#fcfbf9]/60 text-xs hover:bg-[#f5f3ef] dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                                >
                                  <td className="px-2 py-2 text-center text-[#817563] dark:text-slate-400">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2 pl-6 text-slate-700 dark:text-slate-300">
                                    <span>{item.item || '-'}</span>
                                    {item.size && item.size !== '-' && (
                                      <span className="text-[#4f4535] dark:text-slate-400">
                                        {' '}
                                        ({item.size})
                                      </span>
                                    )}
                                    {item.purity !== null && (
                                      <span className="font-medium text-[#785600] dark:text-amber-400">
                                        {' '}
                                        ({item.purity}%)
                                      </span>
                                    )}
                                  </td>
                                  <td className="font-mono px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                                    {formatNumberDisplay(item.grossweight)}
                                  </td>
                                  <td className="font-mono px-3 py-2 text-right font-semibold text-[#785600] dark:text-amber-400">
                                    {formatNumberDisplay(item.fineweight)}
                                  </td>
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                      <td
                        colSpan={2}
                        className="px-3 py-2.5 text-[#1a1c1b] dark:text-white"
                      >
                        Total Process
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(processTotals.gross)}
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#785600] dark:text-amber-400">
                        {formatNumberDisplay(processTotals.fine)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TODAY'S LOSS - Placed after Today's Process */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                  Today's Loss
                </span>
              </div>
              <div className="flex flex-1 flex-col overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="w-7 px-2 py-2.5 text-center"></th>
                      <th className="px-3 py-2.5">Particular</th>
                      <th className="px-3 py-2.5 text-right">Expected (G)</th>
                      <th className="px-3 py-2.5 text-right">
                        Actual Loss (G)
                      </th>
                      <th className="px-3 py-2.5 text-right">Difference (G)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                    {filteredLoss.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-center text-xs text-[#4f4535] dark:text-slate-400"
                        >
                          No loss records found.
                        </td>
                      </tr>
                    ) : (
                      filteredLoss.map((l, idx) => (
                        <tr
                          key={l.id || idx}
                          className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-2 py-2.5 text-center text-[#817563] dark:text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                            {l.processName}
                          </td>
                          <td className="font-mono px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">
                            {formatNumberDisplay(l.expectedLoss)}
                          </td>
                          <td className="font-mono px-3 py-2.5 text-right font-semibold text-red-600 dark:text-red-400">
                            {formatNumberDisplay(l.actualLoss)}
                          </td>
                          <td
                            className={`font-mono px-3 py-2.5 text-right font-bold ${
  l.diffLoss > 0
  ? 'text-red-600 dark:text-red-400'
  : 'text-green-600 dark:text-green-400'
} `}
                          >
                            {formatNumberDisplay(l.diffLoss)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                      <td
                        colSpan={2}
                        className="px-3 py-2.5 text-[#1a1c1b] dark:text-white"
                      >
                        Total Loss
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#1a1c1b] dark:text-slate-200">
                        {formatNumberDisplay(lossTotals.expected)}
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-red-600 dark:text-red-400">
                        {formatNumberDisplay(lossTotals.actual)}
                      </td>
                      <td
                        className={`font-mono px-3 py-2.5 text-right ${
  lossTotals.diff > 0
  ? 'text-red-600 dark:text-red-400'
  : 'text-green-600 dark:text-green-400'
} `}
                      >
                        {formatNumberDisplay(lossTotals.diff)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* 2. MIDDLE COLUMN - Customer Settlement & Bills */}
          <div className="flex flex-col gap-4">
            {/* TODAY'S CUSTOMER SETTLEMENT */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                  Today's Customer Settlement
                </span>
              </div>
              <div className="flex flex-1 flex-col overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="w-7 px-2 py-2.5 text-center"></th>
                      <th className="px-3 py-2.5">Client Name</th>
                      <th className="px-3 py-2.5 text-right">Due (G)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                    {filteredClientDue.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-6 text-center text-xs text-[#4f4535] dark:text-slate-400"
                        >
                          No due records found.
                        </td>
                      </tr>
                    ) : (
                      filteredClientDue.map((client) => {
                        const isExpanded = expandedClientDue.has(
                          client.clientName,
                        );
                        return (
                          <React.Fragment key={client.clientName}>
                            <tr
                              onClick={() => toggleClientDue(client.clientName)}
                              className={`cursor-pointer transition-colors ${
  isExpanded
    ? 'bg-[#785600]/10 dark:bg-amber-900/20'
    : 'hover:bg-[#785600]/5 dark:hover:bg-slate-800/40'
} `}
                            >
                              <td className="px-2 py-2.5 text-center">
                                <div className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#785600]/10 text-[#785600] dark:bg-amber-400/20 dark:text-amber-400">
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                  <span>{client.clientName}</span>
                                </div>
                              </td>
                              <td className="font-mono px-3 py-2.5 text-right font-bold text-[#785600] dark:text-amber-400">
                                {formatNumberDisplay(client.totalDue)}
                              </td>
                            </tr>

                            {isExpanded &&
                              client.entries.map((entry, idx) => (
                                <tr
                                  key={entry.id || idx}
                                  className="border-b border-[#d3c4af]/10 bg-[#fcfbf9]/60 text-xs hover:bg-[#f5f3ef] dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                                >
                                  <td className="px-2 py-2 text-center text-[#817563] dark:text-slate-400">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2 pl-6 text-slate-700 dark:text-slate-300">
                                    {entry.remark || 'Client Due'}
                                    {entry.createdAt && (
                                      <span className="ml-2 text-[10px] text-[#4f4535] dark:text-slate-400">
                                        {new Date(
                                          entry.createdAt,
                                        ).toLocaleTimeString('en-IN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </td>
                                  <td className="font-mono px-3 py-2 text-right font-semibold text-[#785600] dark:text-amber-400">
                                    {formatNumberDisplay(entry.paid)}
                                  </td>
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                      <td
                        colSpan={2}
                        className="px-3 py-2.5 text-[#1a1c1b] dark:text-white"
                      >
                        Total Settlement
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#785600] dark:text-amber-400">
                        {formatNumberDisplay(settlementTotals.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TODAY'S BILLS - Placed after Customer Settlement */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                  Today's Bills
                </span>
              </div>
              <div className="flex flex-1 flex-col overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="w-7 px-2 py-2.5 text-center"></th>
                      <th className="px-3 py-2.5">Bill / Client / Items</th>
                      <th className="px-3 py-2.5 text-right">Total (G)</th>
                      <th className="px-3 py-2.5 text-right">Remaining (G)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-xs text-[#4f4535] dark:text-slate-400"
                        >
                          No bills records found.
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((b, idx) => (
                        <tr
                          key={b.id || idx}
                          className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-2 py-2.5 text-center text-[#817563] dark:text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-[#1a1c1b] dark:text-slate-200">
                              {b.billNumber}
                            </div>
                            {b.clientName && b.clientName !== '-' && (
                              <div className="text-[11px] font-semibold text-[#785600] dark:text-amber-400">
                                {b.clientName}
                              </div>
                            )}
                            {b.itemSummary && b.itemSummary !== '-' && (
                              <div className="text-[11px] text-[#4f4535] dark:text-slate-400">
                                {b.itemSummary}
                              </div>
                            )}
                          </td>
                          <td className="font-mono px-3 py-2.5 text-right text-[#1a1c1b] dark:text-slate-100">
                            {formatNumberDisplay(b.totalWeight)}
                          </td>
                          <td className="font-mono px-3 py-2.5 text-right font-bold text-[#785600] dark:text-amber-400">
                            {formatNumberDisplay(b.remainingWeight)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                      <td
                        colSpan={2}
                        className="px-3 py-2.5 text-[#1a1c1b] dark:text-white"
                      >
                        Total Bills
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(summary.totalBillsWeight)}
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#785600] dark:text-amber-400">
                        {formatNumberDisplay(summary.totalBillsRemainingWeight)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* 3. RIGHT COLUMN - Stock Inward & Stock Outward */}
          <div className="flex flex-col gap-4">
            {/* TODAY'S STOCK INWARD */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                  Today's Stock Inward
                </span>
              </div>
              <div className="flex flex-1 flex-col overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="w-7 px-2 py-2.5 text-center"></th>
                      <th className="px-3 py-2.5">Item</th>
                      <th className="px-3 py-2.5 text-right">Gross (G)</th>
                      <th className="px-3 py-2.5 text-right">Fine (G)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                    {filteredStockInward.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-xs text-[#4f4535] dark:text-slate-400"
                        >
                          No stock inward records found.
                        </td>
                      </tr>
                    ) : (
                      filteredStockInward.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-2 py-2.5 text-center text-[#817563] dark:text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                            <span>{item.item || '-'}</span>
                            {item.size && item.size !== '-' && (
                              <span className="text-[#4f4535] dark:text-slate-400">
                                {' '}
                                ({item.size})
                              </span>
                            )}
                            {item.purity !== null && (
                              <span className="font-medium text-[#785600] dark:text-amber-400">
                                {' '}
                                ({item.purity}%)
                              </span>
                            )}
                          </td>
                          <td className="font-mono px-3 py-2.5 text-right text-[#1a1c1b] dark:text-slate-100">
                            {formatNumberDisplay(item.grossweight)}
                          </td>
                          <td className="font-mono px-3 py-2.5 text-right font-bold text-[#785600] dark:text-amber-400">
                            {formatNumberDisplay(item.fineweight)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                      <td
                        colSpan={2}
                        className="px-3 py-2.5 text-[#1a1c1b] dark:text-white"
                      >
                        Total Inward
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(stockInwardTotals.gross)}
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#785600] dark:text-amber-400">
                        {formatNumberDisplay(stockInwardTotals.fine)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TODAY'S STOCK OUTWARD */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 text-center dark:bg-slate-800/60">
                <span className="text-xs font-black uppercase tracking-widest text-[#1a1c1b] dark:text-white">
                  Today's Stock Outward
                </span>
              </div>
              <div className="flex flex-1 flex-col overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/30 bg-[#f4f1ea]/40 text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="w-7 px-2 py-2.5 text-center"></th>
                      <th className="px-3 py-2.5">Item</th>
                      <th className="px-3 py-2.5 text-right">Gross (G)</th>
                      <th className="px-3 py-2.5 text-right">Fine (G)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                    {filteredStockOutward.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-xs text-[#4f4535] dark:text-slate-400"
                        >
                          No stock outward records found.
                        </td>
                      </tr>
                    ) : (
                      filteredStockOutward.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-[#785600]/5 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-2 py-2.5 text-center text-[#817563] dark:text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-[#1a1c1b] dark:text-slate-200">
                            <span>{item.item || '-'}</span>
                            {item.size && item.size !== '-' && (
                              <span className="text-[#4f4535] dark:text-slate-400">
                                {' '}
                                ({item.size})
                              </span>
                            )}
                            {item.purity !== null && (
                              <span className="font-medium text-[#785600] dark:text-amber-400">
                                {' '}
                                ({item.purity}%)
                              </span>
                            )}
                          </td>
                          <td className="font-mono px-3 py-2.5 text-right text-[#1a1c1b] dark:text-slate-100">
                            {formatNumberDisplay(item.grossweight)}
                          </td>
                          <td className="font-mono px-3 py-2.5 text-right font-bold text-[#785600] dark:text-amber-400">
                            {formatNumberDisplay(item.fineweight)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#d3c4af]/30 bg-[#f4f1ea]/70 font-bold dark:bg-slate-800/70">
                      <td
                        colSpan={2}
                        className="px-3 py-2.5 text-[#1a1c1b] dark:text-white"
                      >
                        Total Outward
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#1a1c1b] dark:text-white">
                        {formatNumberDisplay(stockOutwardTotals.gross)}
                      </td>
                      <td className="font-mono px-3 py-2.5 text-right text-[#785600] dark:text-amber-400">
                        {formatNumberDisplay(stockOutwardTotals.fine)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayReport;
