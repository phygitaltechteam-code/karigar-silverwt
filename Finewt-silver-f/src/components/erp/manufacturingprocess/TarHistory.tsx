import React, {useState} from 'react';
import {ArrowLeft, Filter, X, Download} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {useGetTarHistory} from '@/lib/api/tar';
import toast from 'react-hot-toast';
import {
  useGetProcessAlert,
  checkProcessLossAlert,
  getProcessLossColorClass,
} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

interface TarHistoryProps {
  onBack?: () => void;
}

const TarHistory: React.FC<TarHistoryProps> = ({onBack}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);

  // Fetch tar history data
  const {data: tarHistory = [], isLoading, refetch} = useGetTarHistory();
  const {data: alertRules} = useGetProcessAlert('tar');

  // Get unique items and sizes for filter
  const uniqueItems = React.useMemo(() => {
    const items = new Map();
    tarHistory.forEach((tar: any) => {
      if (tar.item && tar.item.id) {
        items.set(tar.item.id, tar.item.name);
      }
    });
    return Array.from(items.entries()).map(([id, name]) => ({id, name}));
  }, [tarHistory]);

  const uniqueSizes = React.useMemo(() => {
    const sizes = new Map();
    tarHistory.forEach((tar: any) => {
      if (tar.size && tar.size.id) {
        sizes.set(tar.size.id, tar.size.size);
      }
    });
    return Array.from(sizes.entries()).map(([id, size]) => ({id, size}));
  }, [tarHistory]);

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format number helper
  const formatNumber = (value: any) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toFixed(3);
  };

  // Filter data based on search and filters
  const filteredData = React.useMemo(() => {
    const rawList = Array.isArray(tarHistory)
      ? tarHistory
      : Array.isArray((tarHistory as any)?.data)
        ? (tarHistory as any).data
        : [];
    let filtered = rawList;

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((tar: any) => {
        const itemName = tar.item?.name?.toLowerCase() || '';
        const sizeValue = tar.size?.size?.toLowerCase() || '';
        const fine = tar.fine?.toString() || '';
        const tarWeight = tar.tar?.toString() || '';
        const purity = tar.purity?.toString() || '';

        return (
          itemName.includes(search) ||
          sizeValue.includes(search) ||
          fine.includes(search) ||
          tarWeight.includes(search) ||
          purity.includes(search)
        );
      });
    }

    // Item filter
    if (selectedItem) {
      filtered = filtered.filter((tar: any) => tar.item?.id === selectedItem);
    }

    // Size filter
    if (selectedSize) {
      filtered = filtered.filter((tar: any) => tar.size?.id === selectedSize);
    }

    return filtered;
  }, [tarHistory, searchTerm, selectedItem, selectedSize]);

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate({
        to: '/manufacturingprocess/process',
        state: {selectedTab: 'box'},
      });
    }
  };

  // Handle export
  const handleExport = () => {
    try {
      const headers = [
        'Sr No.',
        'Date',
        'Item',
        'Size',
        'Fine',
        'Tar',
        'Scrap',
        'Loss',
        'Purity %',
      ];
      const rows = filteredData.map((tar: any, index: number) => [
        index + 1,
        formatDate(tar.createdAt),
        tar.item?.name || '-',
        tar.size?.size || '-',
        formatNumber(tar.fine),
        formatNumber(tar.tar),
        formatNumber(tar.scrap),
        formatNumber(tar.loss),
        formatNumber(tar.purity),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], {type: 'text/csv'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tar-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('History exported successfully!');
    } catch (error) {
      toast.error('Failed to export history');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedItem('');
    setSelectedSize('');
    setShowFilter(false);
  };

  // Define table columns (removed status column)
  const columns: Column<any>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (item) => (
        <div className="flex flex-col items-center">
          <span className="text-sm text-[#1a1c1b] dark:text-white">
            {formatDate(item.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.item?.name || '-'}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.size?.size || '-'}
        </span>
      ),
    },
    {
      key: 'fine',
      header: 'Fine (लगड)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.fine)}
        </span>
      ),
    },
    {
      key: 'tar',
      header: 'Tar (तार)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.tar)}
        </span>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.scrap)}
        </span>
      ),
    },
    {
      key: 'expectedLoss',
      header: 'Expected Loss',
      render: (item) => {
        const inputVal = parseFloat(
          String(item.grosswt || item.grossWeight || item.fine || 0),
        );
        const details = evaluateLossDetails(
          inputVal,
          item.purity,
          item.loss,
          alertRules,
          'tar',
        );
        return (
          <span className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-300">
            {formatNumber(details.expectedLoss)}
          </span>
        );
      },
    },
    {
      key: 'actualLoss',
      header: 'Actual Loss',
      render: (item) => {
        const inputVal = parseFloat(
          String(item.grosswt || item.grossWeight || item.fine || 0),
        );
        const details = evaluateLossDetails(
          inputVal,
          item.purity,
          item.loss,
          alertRules,
          'tar',
        );
        return (
          <span
            className={`font-mono text-sm font-semibold ${details.lossColorClass}`}
          >
            {formatNumber(details.actualLoss)}
          </span>
        );
      },
    },
    {
      key: 'diffLoss',
      header: 'Diff Loss',
      render: (item) => {
        const inputVal = parseFloat(
          String(item.grosswt || item.grossWeight || item.fine || 0),
        );
        const details = evaluateLossDetails(
          inputVal,
          item.purity,
          item.loss,
          alertRules,
          'tar',
        );
        const isPositive = details.diffLoss > 0;
        const isNegative = details.diffLoss < 0;
        return (
          <span
            className={`font-mono text-sm font-bold ${
              isPositive
                ? 'text-red-600 dark:text-red-400'
                : isNegative
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {isPositive
              ? `+${formatNumber(details.diffLoss)}`
              : formatNumber(details.diffLoss)}
          </span>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.purity)}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              {onBack && (
                <button
                  onClick={handleBack}
                  className="rounded-lg p-1.5 transition-colors hover:bg-[#f4f4f2] dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-5 w-5 text-[#4f4535] dark:text-slate-400" />
                </button>
              )}
              <h1 className="truncate text-sm font-bold text-[#1a1c1b] dark:text-white sm:text-base md:text-lg">
                Tar History
              </h1>
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {filteredData.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`rounded-lg p-2 transition-colors ${
                  showFilter || searchTerm || selectedItem || selectedSize
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'hover:bg-[#f4f4f2] dark:hover:bg-slate-800'
                }`}
              >
                <Filter className="h-4 w-4" />
              </button>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={filteredData.length === 0}
                className="rounded-lg p-2 transition-colors hover:bg-[#f4f4f2] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="rounded-lg p-2 transition-colors hover:bg-[#f4f4f2] disabled:opacity-50 dark:hover:bg-slate-800"
              >
                <svg
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Filter Section */}
          {showFilter && (
            <div className="mt-3 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800/50">
              <div className="flex flex-wrap items-end gap-3">
                {/* Search Input */}
                <div className="min-w-[150px] flex-1">
                  <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
                    Search
                  </label>
                  <input
              autoComplete="off"
              data-lpignore="true"
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by item, size..."
                    className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {/* Item Filter */}
                <div className="min-w-[120px] flex-1">
                  <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
                    Item
                  </label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">All Items</option>
                    {uniqueItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Filter */}
                <div className="min-w-[120px] flex-1">
                  <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
                    Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full rounded-lg border-0 bg-[#f4f4f2] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">All Sizes</option>
                    {uniqueSizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || selectedItem || selectedSize) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="px-3 py-4 sm:px-4 md:px-6">
        <GenericTable
          data={filteredData}
          columns={columns}
          emptyMessage={
            tarHistory.length === 0
              ? 'No history records found. Complete a tar process to see history.'
              : 'No matching records found. Try adjusting your filters.'
          }
          isLoading={isLoading}
          showSrNo={true}
          srNoLabel="Sr No."
          className="shadow-sm"
        />
      </div>
    </div>
  );
};

export default TarHistory;
