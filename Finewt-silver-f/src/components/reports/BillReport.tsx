import {useNavigate} from '@tanstack/react-router';
import {useState, useRef} from 'react';
import {ArrowLeft, Search, Printer} from 'lucide-react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {useReactToPrint} from 'react-to-print';
import PDFHeader from '@/components/Forms/Common/PDFHeader';

interface BillEntry {
  id: string;
  srNo: number;
  dateTime: string;
  billNo: string;
  item: string;
  size: string;
  remark: 'Advance' | 'Settle' | 'Sale';
  wt: number;
}

export default function BillReport() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Mock data - Replace with actual API data
  const [reportData, setReportData] = useState<BillEntry[]>([
    {
      id: '1',
      srNo: 1,
      dateTime: '12/12/2024 10:30 AM',
      billNo: 'BILL-001',
      item: 'Gold Ring',
      size: '18',
      remark: 'Sale',
      wt: 5.2,
    },
    {
      id: '2',
      srNo: 2,
      dateTime: '12/12/2024 11:45 AM',
      billNo: 'BILL-002',
      item: 'Silver Necklace',
      size: '20',
      remark: 'Advance',
      wt: 15.5,
    },
    {
      id: '3',
      srNo: 3,
      dateTime: '13/12/2024 09:15 AM',
      billNo: 'BILL-003',
      item: 'Gold Chain',
      size: '22',
      remark: 'Settle',
      wt: 8.75,
    },
    {
      id: '4',
      srNo: 4,
      dateTime: '13/12/2024 02:30 PM',
      billNo: 'BILL-004',
      item: 'Diamond Earrings',
      size: '16',
      remark: 'Settle',
      wt: 3.2,
    },
    {
      id: '5',
      srNo: 5,
      dateTime: '14/12/2024 11:00 AM',
      billNo: 'BILL-005',
      item: 'Gold Bracelet',
      size: '19',
      remark: 'Sale',
      wt: 12.3,
    },
  ]);

  // Filter data based on search term
  const filteredData = searchTerm
    ? reportData.filter(
        (entry) =>
          entry.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.size.includes(searchTerm) ||
          entry.remark.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.wt.toString().includes(searchTerm),
      )
    : reportData;

  // Calculate totals
  const totalWt = filteredData.reduce((sum, entry) => sum + entry.wt, 0);
  const totalAdvance = filteredData
    .filter((d) => d.remark === 'Advance')
    .reduce((sum, d) => sum + d.wt, 0);
  const totalSettle = filteredData
    .filter((d) => d.remark === 'Settle')
    .reduce((sum, d) => sum + d.wt, 0);
  const totalSale = filteredData
    .filter((d) => d.remark === 'Sale')
    .reduce((sum, d) => sum + d.wt, 0);

  // Format number with 3 decimals
  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toFixed(3);
    return str.replace(/\.?0+$/, '');
  };

  // Get remark color
  const getRemarkColor = (remark: string) => {
    switch (remark) {
      case 'Advance':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Settle':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Sale':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Table columns
  const columns: Column<BillEntry>[] = [
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
      key: 'billNo',
      header: 'Bill No',
      render: (item) => (
        <span className="text-sm font-medium text-[#785600] dark:text-amber-400">
          {item.billNo}
        </span>
      ),
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.item}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.size}
        </span>
      ),
    },
    {
      key: 'remark',
      header: 'Remark',
      render: (item) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${getRemarkColor(item.remark)}`}
        >
          {item.remark}
        </span>
      ),
    },
    {
      key: 'wt',
      header: 'WT (G)',
      render: (item) => (
        <span className="font-mono text-sm font-bold text-[#1a1c1b] dark:text-white">
          {formatNumber(item.wt)}
        </span>
      ),
    },
  ];

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bill-Report`,
    pageStyle: `
      @page { 
        size: A4 landscape; 
        margin: 10mm; 
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        #report-print { 
          page-break-inside: avoid; 
          break-inside: avoid; 
        }
        .no-print { 
          display: none !important; 
        }
      }
    `,
  });

  // Print Preview Component
  const PrintPreview = () => (
    <div
      className="font-sans mx-auto max-w-full bg-white p-6"
      ref={printRef}
      id="report-print"
      style={{width: '297mm', minHeight: '210mm'}}
    >
      <PDFHeader />
      <div className="my-3 border-b-2 border-[#c43d5c]" />

      <div className="mb-4 text-center">
        <h2 className="text-gray-800 text-lg font-bold">Bill Report</h2>
        <p className="text-gray-500 text-xs">
          Generated: {new Date().toLocaleString()}
        </p>
      </div>

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-white">
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">
              Sr
            </th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">
              Date & Time
            </th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">
              Bill No
            </th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">
              Item
            </th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">
              Size
            </th>
            <th className="border border-[#785600] px-2 py-1.5 text-left font-semibold">
              Remark
            </th>
            <th className="border border-[#785600] px-2 py-1.5 text-right font-semibold">
              WT (G)
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((entry, index) => (
            <tr
              key={entry.id}
              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              <td className="border-gray-300 border px-2 py-1.5 text-center">
                {index + 1}
              </td>
              <td className="border-gray-300 border px-2 py-1.5">
                {entry.dateTime}
              </td>
              <td className="border-gray-300 border px-2 py-1.5">
                {entry.billNo}
              </td>
              <td className="border-gray-300 border px-2 py-1.5">
                {entry.item}
              </td>
              <td className="border-gray-300 border px-2 py-1.5">
                {entry.size}
              </td>
              <td className="border-gray-300 border px-2 py-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    entry.remark === 'Advance'
                      ? 'bg-blue-100 text-blue-700'
                      : entry.remark === 'Settle'
                        ? 'bg-green-100 text-green-700'
                        : entry.remark === 'Mand'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {entry.remark}
                </span>
              </td>
              <td className="border-gray-300 font-mono border px-2 py-1.5 text-right">
                {formatNumber(entry.wt)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td
              colSpan={6}
              className="border-gray-300 border px-2 py-1.5 text-right"
            >
              Total:
            </td>
            <td className="border-gray-300 font-mono border px-2 py-1.5 text-right">
              {formatNumber(totalWt)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-3 border-t-2 border-[#785600] pt-2 text-center">
        <p className="text-gray-500 text-xs">
          This is a system-generated report
        </p>
        <div className="text-gray-400 mt-0.5 flex justify-center gap-3 text-[10px]">
          <span>Powered by Matoshree Gold</span>
          <span>|</span>
          <span>Generated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <button
              onClick={() => navigate({to: '/billing'})}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Bill Report
            </h2>
          </div>

          {/* Right side - Search and Print Button */}
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search by bill, item, size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Print Button */}
            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#785600] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200]"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print Report</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-4 md:px-6">
        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Total Weight
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(totalWt)} G
              </span>
              <span className="text-[9px] text-[#4f4535] dark:text-slate-400">
                {filteredData.length} entries
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Advance
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(totalAdvance)} G
              </span>
              <span className="text-[9px] text-[#4f4535] dark:text-slate-400">
                {filteredData.filter((d) => d.remark === 'Advance').length}{' '}
                entries
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Settle
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(totalSettle)} G
              </span>
              <span className="text-[9px] text-[#4f4535] dark:text-slate-400">
                {filteredData.filter((d) => d.remark === 'Settle').length}{' '}
                entries
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Sale
              </span>
              <span className="text-lg font-bold text-black dark:text-white">
                {formatNumber(totalSale)} G
              </span>
              <span className="text-[9px] text-[#4f4535] dark:text-slate-400">
                {filteredData.filter((d) => d.remark === 'Sale').length} entries
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
            emptyMessage="No bill entries found."
            isLoading={false}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      </div>

      {/* Hidden Print Component */}
      <div className="hidden">
        <PrintPreview />
      </div>
    </div>
  );
}
