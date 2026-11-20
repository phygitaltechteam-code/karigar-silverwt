import React, {useState, useEffect, useMemo, useRef} from 'react';
import {X, Search, Loader2, Save, Package} from 'lucide-react';
import toast from 'react-hot-toast';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {useGetStock} from '@/lib/api/stock';
import {useGetItems} from '@/lib/api/items';
import {useGetSizes} from '@/lib/api/sizes';

// ======================================================
// INTERFACES
// ======================================================
interface StockItem {
  id: string;
  itemId: string;
  sizeId: string | null;
  itemName: string;
  sizeName: string;
  weight: number;
  purity: number | null;
  displayName: string;
  searchableText: string;
}

interface SkundaAddInStockProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: {id: string; weight: number}) => void;
}

// ======================================================
// HELPER FUNCTIONS
// ======================================================
const formatNumberDisplay = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const str = num.toFixed(3);
  return str.replace(/\.?0+$/, '');
};

// ======================================================
// MAIN COMPONENT
// ======================================================
const SkundaAddInStock: React.FC<SkundaAddInStockProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [enterWeight, setEnterWeight] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch stock, items, and sizes data
  const {data: stockData, isLoading: stockLoading, refetch} = useGetStock();
  const {data: items = [], isLoading: itemsLoading} = useGetItems();
  const {data: sizes = [], isLoading: sizesLoading} = useGetSizes();

  const isLoading = stockLoading || itemsLoading || sizesLoading;

  // Map and filter stock items using item and size names
  const filteredStocks = useMemo(() => {
    if (!stockData || !Array.isArray(stockData)) return [];

    const term = searchTerm.trim().toLowerCase();

    const mappedStocks: StockItem[] = stockData.map((stock: any) => {
      const item = items.find((i: any) => i.id === stock.itemId);
      const size = sizes.find((s: any) => s.id === stock.sizeId);

      const isGold =
        (stock.sizeId === null && stock.purity === null) ||
        (item?.name?.toLowerCase().includes('gold') && stock.sizeId === null);

      const itemName = item?.name || (isGold ? 'Gold' : 'Unknown Item');
      const sizeName = isGold ? 'Gold' : size?.size || '-';
      const purity = isGold ? 100 : stock.purity ? Number(stock.purity) : null;
      const purityDisplay = purity ? `${purity}%` : '';

      const displayName = `${itemName}${sizeName !== '-' && sizeName !== 'Gold' ? ` (${sizeName})` : ''}${purityDisplay ? ` (${purityDisplay})` : ''}`;

      return {
        id: stock.id,
        itemId: stock.itemId,
        sizeId: stock.sizeId,
        itemName: itemName,
        sizeName: sizeName,
        weight: Number(stock.weight || 0),
        purity: purity,
        displayName: displayName,
        searchableText:
          `${itemName} ${sizeName} ${purity || ''} ${stock.weight || ''}`.toLowerCase(),
      };
    });

    // Filter out items with size 'S' or '(s)' in the name
    let filtered = mappedStocks.filter((stock: StockItem) => {
      const sizeClean = stock.sizeName.trim().toLowerCase();
      if (sizeClean === 's' || sizeClean === '(s)') return false;
      if (stock.displayName.toLowerCase().includes('(s)')) return false;
      return true;
    });

    if (term) {
      filtered = filtered.filter(
        (stock: StockItem) =>
          stock.searchableText.includes(term) ||
          stock.displayName.toLowerCase().includes(term),
      );
    }

    return filtered.sort((a: StockItem, b: StockItem) => {
      if (a.weight > 0 && b.weight === 0) return -1;
      if (a.weight === 0 && b.weight > 0) return 1;
      return a.itemName.localeCompare(b.itemName);
    });
  }, [stockData, items, sizes, searchTerm]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setIsDropdownOpen(false);
      setSelectedStock(null);
      setEnterWeight('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle stock selection
  const handleSelectStock = (stock: StockItem) => {
    setSelectedStock(stock);
    setIsDropdownOpen(false);
    setSearchTerm(stock.displayName);
    setEnterWeight(stock.weight > 0 ? formatNumberDisplay(stock.weight) : '');
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedStock) {
      toast.error('Please select a stock item');
      return;
    }

    const weightToAdd = parseFloat(enterWeight);
    if (isNaN(weightToAdd) || weightToAdd <= 0) {
      toast.error('Please enter a valid weight greater than 0');
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSuccess) {
        await onSuccess({
          id: selectedStock.id,
          stockId: selectedStock.id,
          weight: weightToAdd,
        });
      }

      await refetch();
      onClose();
    } catch (error: any) {
      console.error('Error adding stock:', error);
      toast.error(error?.message || 'Failed to add stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 w-full max-w-3xl rounded-2xl border border-[#d3c4af]/40 bg-white shadow-2xl duration-150 dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#785600]/20 bg-[#785600] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/20 p-1.5">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide">
                Add Stock Inward
              </h3>
              <p className="text-xs font-medium text-amber-100">
                Select stock item and enter inward weight
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 p-3">
          {/* Single-line Form Grid: Select Stock Item | Available Qty | Add Weight */}
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
            {/* 1. Searchable Dropdown - 6 cols */}
            <div className="relative md:col-span-6" ref={dropdownRef}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Select Stock Item <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div
                  className={`flex items-center rounded-lg border ${
                    isDropdownOpen
                      ? 'border-[#785600] ring-2 ring-[#785600]/20'
                      : 'border-[#d3c4af]/30'
                  } bg-white transition-all dark:border-slate-700 dark:bg-slate-800`}
                >
                  <Search className="ml-3 h-4 w-4 flex-shrink-0 text-[#817563] dark:text-slate-400" />
                  <input
              autoComplete="off"
              data-lpignore="true"
                    type="search"
                    placeholder="Search by item, size, purity..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                      if (
                        selectedStock &&
                        e.target.value !== selectedStock.displayName
                      ) {
                        setSelectedStock(null);
                        setEnterWeight('');
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full bg-transparent px-3 py-2 text-sm text-[#1a1c1b] outline-none placeholder:text-[#817563] dark:text-white dark:placeholder:text-slate-400"
                    disabled={isLoading}
                  />
                  {isLoading && (
                    <Loader2 className="mr-3 h-4 w-4 flex-shrink-0 animate-spin text-[#785600]" />
                  )}
                </div>

                {/* Dropdown List */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#d3c4af]/30 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    {filteredStocks.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[#4f4535] dark:text-slate-400">
                        {searchTerm.trim()
                          ? `No stocks found matching "${searchTerm}"`
                          : 'No stocks available'}
                      </div>
                    ) : (
                      filteredStocks.map((stock: StockItem) => (
                        <div
                          key={stock.id}
                          onClick={() => handleSelectStock(stock)}
                          className={`cursor-pointer border-b border-[#d3c4af]/10 px-4 py-2.5 transition-colors last:border-0 dark:border-slate-700/50 ${
                            selectedStock?.id === stock.id
                              ? 'bg-[#785600]/15 font-semibold dark:bg-slate-700'
                              : 'hover:bg-[#785600]/10 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-[#1a1c1b] dark:text-white">
                              {stock.displayName}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#785600] dark:text-amber-400">
                              {formatNumberDisplay(stock.weight)} G
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Available Weight - 3 cols */}
            <div className="md:col-span-3">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Available Qty (G)
              </label>
              <GenericInputField
                type="text"
                readOnly
                decimalScale={3}
                value={
                  selectedStock
                    ? formatNumberDisplay(selectedStock.weight)
                    : '0'
                }
                suffix="G"
                compact
                className="font-mono cursor-not-allowed font-bold text-[#785600] dark:text-amber-400"
              />
            </div>

            {/* 3. Add Weight Input - 3 cols */}
            <div className="md:col-span-3">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                Add Weight (G) <span className="text-red-500">*</span>
              </label>
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={enterWeight}
                onChange={(e) => setEnterWeight(e.target.value)}
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-[#d3c4af]/20 pt-1 dark:border-slate-700">
            <button
              onClick={handleSave}
              disabled={
                !selectedStock ||
                !enterWeight ||
                parseFloat(enterWeight) <= 0 ||
                isSubmitting
              }
              className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Add Stock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkundaAddInStock;
