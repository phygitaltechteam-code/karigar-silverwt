import { useNavigate, useParams } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Printer, Calendar } from 'lucide-react';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { useReactToPrint } from 'react-to-print';
import PDFHeader from '@/components/Forms/Common/PDFHeader';
import { Route } from '@/routes/_app/stock/stockreport.$d';
import { useGetStockReport } from '@/lib/api/reportapi';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericDatePicker from '@/components/Forms/DatePicker/GenericDatePicker';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { getCurrentAppWeekRange } from '@/utils/weekRangeUtils';

interface StockReportEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: string;
  remark: string;
  wt: number;
  amount?: number;
}

interface ApiDataItem {
  id: string;
  adminId: string;
  itemId: string;
  sizeId: string | null;
  purity: number;
  remark: string;
  weight: number;
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

interface ApiResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: {
    history: ApiDataItem[];
  };
  errors: null;
}

export default function StockReport() {
  const navigate = useNavigate();
  const routeParams = Route.useParams();
  const rawParams = useParams({ strict: false }) as {
    d?: string;
    id?: string;
    $d?: string;
  };
  const d =
    routeParams?.d || rawParams?.d || rawParams?.id || rawParams?.$d || '';
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
  }, []);
  const printRef = useRef<HTMLDivElement>(null);
  const { data: stockData, isLoading, isError, refetch } = useGetStockReport(d);

  const getpdfheaderdata = useGetHeader();

  // State for transformed data
  const [reportData, setReportData] = useState<StockReportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Transform API data to match our table structure
  useEffect(() => {
    if (stockData) {
      const responseData = stockData as ApiResponse;

      if (responseData?.history && Array.isArray(responseData.history)) {
        const transformedData: StockReportEntry[] = responseData.history.map(
          (item: ApiDataItem, index: number) => {
            // Format date
            const date = new Date(item.createdAt);
            const formattedDate = date.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const formattedTime = date.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            // Use the actual remark from API
            const remark = item.remark || 'N/A';
            const itemName = item.item?.name || '';
            const isItemGold =
              itemName.toLowerCase().includes('gold') ||
              item.sizeId === null ||
              !item.size?.size;

            return {
              id: item.id,
              srNo: index + 1,
              dateTime: `${formattedDate} ${formattedTime}`,
              item: isItemGold ? 'Gold' : itemName || 'Unknown Item',
              size: isItemGold ? '-' : item.size?.size || 'N/A',
              purity: isItemGold
                ? '100'
                : item.purity
                  ? item.purity.toString()
                  : 'N/A',
              remark: remark,
              wt: item.weight || 0,
            };
          },
        );
        setReportData(transformedData);
      }
      setLoading(false);
    }
  }, [stockData]);

  // Check if current report is for Gold
  const isGold =
    reportData.length > 0 &&
    reportData.every(
      (entry) =>
        entry.item.toLowerCase().includes('gold') ||
        entry.size === '-' ||
        entry.size === 'N/A',
    );

  // Filter data based on search term and date range
  const filteredData = reportData.filter((entry) => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.purity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.remark.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.wt.toString().includes(searchTerm);

    // Date range filter
    let matchesDate = true;

    if (isTrial && !isDateFilterActive) {
      matchesDate = true;
    } else if (fromDate || toDate) {
      // Parse DD/MM/YYYY from entry.dateTime.
      const dateParts = entry.dateTime.split(' ')[0].split('/');

      if (dateParts.length === 3) {
        const entryDate = new Date(
          Number(dateParts[2]),
          Number(dateParts[1]) - 1,
          Number(dateParts[0]),
        );

        entryDate.setHours(12, 0, 0, 0);

        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);

          if (entryDate < from) {
            matchesDate = false;
          }
        }

        if (toDate && matchesDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);

          if (entryDate > to) {
            matchesDate = false;
          }
        }
      }
    }

    return matchesSearch && matchesDate;
  });

  // Calculate totals
  const totalWt = filteredData.reduce((sum, entry) => sum + entry.wt, 0);
  const totalEntries = filteredData.length;

  // Format number with 3 decimals
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
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

  // Reset to configured week
  const handleResetDates = () => {
    const { monday, sunday } = getDefaultWeekRange();
    setFromDate(monday);
    setToDate(sunday);
  };

  // Get remark color - handles any remark string
  const getRemarkColor = (remark: string) => {
    const remarkLower = remark?.toLowerCase() || '';

    if (remarkLower.includes('inward')) {
      return ' text-green-700 dark:bg-green-900/30 dark:text-green-400';
    } else if (remarkLower.includes('outward')) {
      return ' text-red-700 dark:bg-red-900/30 dark:text-red-400';
    } else if (
      remarkLower.includes('scale') ||
      remarkLower.includes('manufactured')
    ) {
      return ' text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    } else if (remarkLower.includes('received')) {
      return ' text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    } else if (remarkLower.includes('given')) {
      return ' text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    } else if (remarkLower.includes('sale')) {
      return ' text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    } else if (remarkLower.includes('settle')) {
      return ' text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    } else if (remarkLower.includes('advance')) {
      return 'text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    } else {
      return ' text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Table columns (Hide Item and Size when isGold)
  const columns: Column<StockReportEntry>[] = [
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
    ...(!isGold
      ? [
        {
          key: 'item',
          header: 'Item',
          render: (item: StockReportEntry) => (
            <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
              {item.item}
            </span>
          ),
        },
        {
          key: 'size',
          header: 'Size',
          render: (item: StockReportEntry) => (
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {item.size}
            </span>
          ),
        },
      ]
      : []),
    {
      key: 'purity',
      header: 'Purity',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {isGold ? '100 %' : `${item.purity} %`}
        </span>
      ),
    },
    {
      key: 'remark',
      header: 'Remark',
      render: (item) => (
        <span
          className={`px-2 py-1 text-xs font-medium ${getRemarkColor(item.remark)}`}
        >
          {item.remark}
        </span>
      ),
    },
    {
      key: 'wt',
      header: 'WT (G)',
      render: (item) => (
        <span className="font-bold text-black dark:text-white">
          {item.wt > 0 ? '+' : ''}
          {formatNumber(item.wt)} G
        </span>
      ),
    },
  ];

  // Print handler - Full A4 with PDF Header
  const handlePrint = () => {
    if (!filteredData || filteredData.length === 0) {
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

    // Build the table rows matching ClientReport exactly
    const rows = filteredData
      .map((item, index) => {
        return `
          <tr>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${index + 1}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:10px;color:#000;white-space:nowrap;">${item.dateTime}</td>
            ${!isGold ? `<td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${item.item}${item.size && item.size !== '-' && item.size !== 'N/A' ? ` (${item.size})` : ''}</td>` : ''}
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">${isGold ? '100%' : item.purity ? `${item.purity}%` : '-'}</td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-size:11px;color:#000;">
              ${item.remark || '-'}
            </td>
            <td style="border:1px solid #000;padding:1px 2px;text-align:center;font-family:monospace;font-size:11px;color:${item.wt > 0 ? '#16a34a' : item.wt < 0 ? '#dc2626' : '#000'};">
              ${item.wt > 0 ? '+' : ''}${formatNumber(item.wt)}
            </td>
          </tr>
        `;
      })
      .join('');

    // Calculate total
    const totalWt = filteredData.reduce((sum, item) => sum + item.wt, 0);

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
      headerInfo.Description||
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
      ? `${headerInfo.DescriptionFontSize}px`
      : '9px';
    const proprietorFontSize = headerInfo.proprietorFontSize
      ? `${headerInfo.proprietorFontSize}px`
      : '9px';
    const phoneFontSize = headerInfo.phoneFontSize
      ? `${ headerInfo.phoneFontSize } px`
      : '9px';

    const fromDateStr = formatDateForDisplay(fromDate);
    const toDateStr = formatDateForDisplay(toDate);

    // Set the content with PDF Header matching ClientReport
    printContainer.innerHTML = `
    <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;" >
        <!--Header Section-->
    <div>
      <!-- PDF Header -->
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

      <!-- Title and Date Range in one line -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
        <div style="flex:1;"></div>
        <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
          ${isGold ? 'Gold Stock Report.' : 'Stock Report.'}
        </h2>
        <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
          ${fromDateStr && toDateStr ? `From: ${fromDateStr} &nbsp; To: ${toDateStr}` : ''}
        </div>
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
        <thead>
          <tr style="background:#785600;color:white;font-weight:600;">
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:5%;">Sr</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:${isGold ? '25%' : '18%'};">Date & Time</th>
            ${!isGold ? `<th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:25%;">Item (Size)</th>` : ''}
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:${isGold ? '15%' : '12%'};">Purity</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:${isGold ? '35%' : '25%'};">Remark</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;width:${isGold ? '20%' : '15%'};">WT (G)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr style="background:#fef3c7;font-weight:bold;font-size:11px;">
            <td colspan="${isGold ? '4' : '5'}" style="border:1px solid #000;padding:2px 4px;text-align:right;color:#000;">TOTAL:</td>
            <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;color:#000;">
              ${formatNumber(totalWt)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
      </div >
    `;

    // Add print styles matching ClientReport
    const style = document.createElement('style');
    style.textContent = `
  @page {
    margin: 3mm;
  }
  @media print {
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
      width: 100% !important;
      height: 100% !important;
      background: white!important;
      padding: 4px!important;
      overflow: auto!important;
      z-index: 9999!important;
      -webkit-print-color-adjust: exact!important;
      print-color-adjust: exact!important;
    }
    #print-container table {
      width: 100% !important;
      border-collapse: collapse!important;
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
    #print-container tfoot tr {
      background: #fef3c7!important;
      -webkit-print-color-adjust: exact!important;
      print-color-adjust: exact!important;
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

  // Show loading state
  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#785600]"></div>
          <p className="mt-4 text-[#785600] dark:text-amber-400">
            Loading stock report...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 text-5xl text-red-500">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
            Error Loading Report
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Failed to fetch stock report data.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-white hover:bg-[#5d4200]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (reportData.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-5xl">📦</div>
            <h3 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
              No Stock Records Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              No stock records found for this item.
            </p>
            <button
              onClick={() => navigate({to: '/Stocks/stockpage'})}
              className="mt-4 rounded-lg bg-[#785600] px-4 py-2 text-white hover:bg-[#5d4200]"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <button
              onClick={() => navigate({to: '/Stocks/stockpage'})}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Stock Report
            </h2>
          </div>

          {/* Right side - Search, Date Pickers and Print Button */}
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            {/* Search Bar */}
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

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <GenericWeeklyDatePicker
                id="from-date-box"
                mode="from"
                placeholder="DD/MM/YYYY"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={handleFromDateChange}
                className="w-32 sm:w-36 md:w-40"
              />
              <GenericWeeklyDatePicker
                id="to-date-box"
                mode="to"
                placeholder="DD/MM/YYYY"
                initialDates={toDate ? [toDate] : []}
                onDateChange={handleToDateChange}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#785600] font-medium text-white transition-colors hover:bg-[#5d4200] h-9 px-4 text-xs sm:text-[13px]"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4 md:px-6">
        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Total Weight
              </span>
              <span className="text-lg font-bold text-black">
                {formatNumber(totalWt)} G
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Total Entries
              </span>
              <span className="text-lg font-bold text-black">
                {totalEntries}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={filteredData}
            columns={columns}
            onSave={(item) => console.log('Save:', item)}
            emptyMessage={
              searchTerm || fromDate || toDate
                ? 'No stock entries found matching your filters.'
                : 'No stock entries found.'
            }
            isLoading={isLoading || loading}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      </div>
    </div>
  );
}
