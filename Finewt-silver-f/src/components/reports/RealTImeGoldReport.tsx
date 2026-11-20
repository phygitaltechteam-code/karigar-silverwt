import React, {useState, useEffect, useMemo} from 'react';
import {Search, Printer, Loader2} from 'lucide-react';
import {useGetHeader} from '@/lib/api/headerapi';
import {useGetRealTimeGold} from '@/lib/api/realtimegold';
import {collectWorkInProgress} from '@/utils/manufacturingStock';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {
  CategoryGroup,
  buildCategoryGroups,
  calculateAvgPurity,
} from './realtime/realTimeGoldUtils';
import {printRealTimeGoldReport} from './realtime/printRealTimeGoldReport';
import {RealTimeSummaryCards} from './realtime/RealTimeSummaryCards';
import {RealTimeStockPanel} from './realtime/RealTimeStockPanel';
import {RealTimeManufacturingPanel} from './realtime/RealTimeManufacturingPanel';
import {RealTimeCustomerDuePanel} from './realtime/RealTimeCustomerDuePanel';

// ======================================================
// MAIN COMPONENT
// ======================================================
const RealTimeGoldReport: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const {data: goldData, isLoading, isError, refetch} = useGetRealTimeGold();

  const rawData = useMemo(() => {
    const server: any = (goldData as any)?.data || goldData || {};
    // Stages kept in the browser are added to the server data (Galai comes from the server)
    const processes: Record<string, any[]> = { ...(server.processes || {}) };
    collectWorkInProgress().forEach((w) => {
      const key = w.stage.toLowerCase();
      (processes[key] = processes[key] || []).push({
        id: w.id,
        name: `${w.design || w.stage}${w.stamp ? ` · ${w.stamp}` : ''} (${w.kind === 'In process' ? 'in process' : 'stock card'})`,
        grossWeight: w.weight,
        fineWeight: Math.round(((w.weight * (w.purity || 0)) / 100) * 1000) / 1000,
        purity: w.purity,
      });
    });
    if (!goldData && Object.keys(processes).length === 0) return null;
    return { ...server, processes };
  }, [goldData]);

  const summaryFromApi = useMemo(() => {
    return rawData?.summary || null;
  }, [rawData]);

  const categoryGroups = useMemo(() => {
    return buildCategoryGroups(rawData);
  }, [rawData]);

  // Open every category / process by default: each group opens the first time it appears
  const seenIds = React.useRef<Set<string>>(new Set());
  useEffect(() => {
    const fresh = categoryGroups.map((g) => g.id).filter((id) => !seenIds.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => seenIds.current.add(id));
    setExpandedRows((prev) => new Set([...prev, ...fresh]));
  }, [categoryGroups]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return categoryGroups;

    const term = searchTerm.toLowerCase();

    return categoryGroups
      .map((group) => {
        const groupNameMatch = group.name.toLowerCase().includes(term);
        const matchingItems = group.items.filter((item) =>
          item.name.toLowerCase().includes(term),
        );

        if (groupNameMatch) return group;

        if (matchingItems.length > 0) {
          return {
            ...group,
            items: matchingItems,
            totalGrossWeight: matchingItems.reduce(
              (s, i) => s + i.grossWeight,
              0,
            ),
            totalFineWeight: matchingItems.reduce(
              (s, i) => s + i.fineWeight,
              0,
            ),
            count: matchingItems.length,
          };
        }

        return null;
      })
      .filter((g): g is CategoryGroup => g !== null);
  }, [categoryGroups, searchTerm]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const matchIds = filteredGroups.map((g) => g.id);
      setExpandedRows(new Set(matchIds));
    }
  }, [searchTerm, filteredGroups]);

  const stockGroups = useMemo(() => {
    return filteredGroups.filter(
      (g) => g.type === 'Stock' && g.id !== 'client-due',
    );
  }, [filteredGroups]);

  const processGroups = useMemo(() => {
    return filteredGroups.filter((g) => g.type === 'Process');
  }, [filteredGroups]);

  const clientDueGroup = useMemo(() => {
    return filteredGroups.find((g) => g.id === 'client-due');
  }, [filteredGroups]);

  const stockTotals = useMemo(() => {
    const gross = stockGroups.reduce((s, g) => s + g.totalGrossWeight, 0);
    const fine = stockGroups.reduce((s, g) => s + g.totalFineWeight, 0);
    return {gross, fine, count: stockGroups.reduce((s, g) => s + g.count, 0)};
  }, [stockGroups]);

  const processTotals = useMemo(() => {
    const gross = processGroups.reduce((s, g) => s + g.totalGrossWeight, 0);
    const fine = processGroups.reduce((s, g) => s + g.totalFineWeight, 0);
    return {gross, fine, count: processGroups.reduce((s, g) => s + g.count, 0)};
  }, [processGroups]);

  const clientDueTotal = useMemo(() => {
    const fine = clientDueGroup ? clientDueGroup.totalFineWeight : 0;
    return {fine, count: clientDueGroup ? clientDueGroup.count : 0};
  }, [clientDueGroup]);

  const grandTotals = useMemo(() => {
    const totalGrossWeight = stockTotals.gross + processTotals.gross;
    const totalFineWeight =
      stockTotals.fine + processTotals.fine + clientDueTotal.fine;
    const totalItems =
      stockTotals.count + processTotals.count + clientDueTotal.count;

    const apiGrandGross = Number(summaryFromApi?.grandTotalWeight || 0);
    const apiGrandFine = Number(summaryFromApi?.grandTotalFineWeight || 0);

    const grandTotalWeight = apiGrandGross || totalGrossWeight;
    const grandTotalFineWeight = apiGrandFine || totalFineWeight;

    return {
      totalGrossWeight,
      totalFineWeight,
      totalItems,
      grandTotalWeight,
      grandTotalFineWeight,
      avgPurity: calculateAvgPurity(grandTotalWeight, grandTotalFineWeight),
    };
  }, [stockTotals, processTotals, clientDueTotal, summaryFromApi]);

  const handlePrint = () => {
    printRealTimeGoldReport({
      headerInfo: getpdfheaderdata?.data?.data || {},
      filteredGroups,
      grandTotals,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#785600]" />
          <p className="mt-4 text-[#785600] dark:text-amber-400">
            Loading Real Time Gold Report...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load Real Time Gold Report.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d4200]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12 dark:bg-slate-950">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 border-b border-[#d3c4af]/30 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader title="Real Time Gold Dashboard" />

          {/* Right Controls: Search & Print */}
          <div className="flex w-full flex-nowrap items-center justify-end gap-2 sm:w-auto">
            {/* Search */}
            <div className="relative min-w-0 flex-1 sm:w-44 sm:flex-none md:w-52">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Print Button */}
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

      {/* Main Content Area */}
      <div className="space-y-4 p-3 sm:p-4 md:p-6">
        {/* Simple Summary Cards */}
        <RealTimeSummaryCards grandTotals={grandTotals} />

        {/* 3 Horizontal Column Layout */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {/* 1. GOLD & STOCK Panel */}
          <RealTimeStockPanel
            stockGroups={stockGroups}
            stockTotals={stockTotals}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
          />

          {/* 2. PROCESS Panel */}
          <RealTimeManufacturingPanel
            processGroups={processGroups}
            processTotals={processTotals}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
          />

          {/* 3. CLIENT DUE Panel */}
          <RealTimeCustomerDuePanel
            clientDueGroup={clientDueGroup}
            clientDueTotal={clientDueTotal}
          />
        </div>
      </div>
    </div>
  );
};

export default RealTimeGoldReport;
