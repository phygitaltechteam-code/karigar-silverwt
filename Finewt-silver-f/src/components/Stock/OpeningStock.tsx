import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, X, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { useGetItems, Item } from '@/lib/api/items';
import { useGetSizes, Size } from '@/lib/api/sizes';
import {
  useCreateStock,
  useUpdateStock,
  useDeleteStock,
  useGetStock,
} from '@/lib/api/stock';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { z } from 'zod';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

// Zod Schema for validation
const OpeningStockSchema = z.object({
  itemId: z.string().min(1, 'Please select an item'),
  sizeId: z.string().optional(),
  grams: z
    .number()
    .min(0.001, 'Please enter a valid weight in grams')
    .optional(),
  purity: z
    .number()
    .min(1, 'Please enter purity percentage')
    .max(100, 'Purity cannot exceed 100%'),
});

type OpeningStockFormData = z.infer<typeof OpeningStockSchema>;

interface OpeningStockEntry {
  id: string;
  srNo: number;
  item: string;
  design: string;
  Stamp?: string;
  stamp?: string;
  purity: number;
  grams: number;
  isEditing?: boolean;
  isSaved?: boolean;
  gramsRaw?: string;
  purityRaw?: string;
  itemId?: string;
  sizeId?: string;
  isGoldRow?: boolean;
}

const EMPTY_ITEMS: Item[] = [];
const EMPTY_SIZES: Size[] = [];
const EMPTY_STOCK: any[] = [];

const OpeningStock: React.FC = () => {
  const navigate = useNavigate();
  const [openingEntries, setOpeningEntries] = useState<OpeningStockEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch items and sizes from API
  const { data: rawItems, isLoading: itemsLoading } = useGetItems();
  const { data: rawSizes, isLoading: sizesLoading } = useGetSizes();

  // Fetch existing stock data
  const { data: rawStockData, isLoading: stockLoading, refetch } = useGetStock();

  const items = rawItems || EMPTY_ITEMS;
  const sizes = rawSizes || EMPTY_SIZES;
  const stockData = Array.isArray(rawStockData)
    ? rawStockData
    : (rawStockData as any)?.data || EMPTY_STOCK;

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Mutation hooks
  const createStock = useCreateStock();
  const updateStock = useUpdateStock();
  const deleteStock = useDeleteStock();

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'grams'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  // Initialize with existing stock data or empty row
  useEffect(() => {
    if (itemsLoading || sizesLoading || stockLoading) {
      return;
    }

    if (stockData && stockData.length > 0) {
      const entries: OpeningStockEntry[] = stockData.map(
        (stock: any, index: number) => {
          const item = items.find((i: any) => i.id === stock.itemId);
          const size = sizes.find((s: any) => s.id === stock.sizeId);

          // The default fine silver row: SILVER item, no size, no purity (= 100%)
          const isGold =
            item?.name?.trim().toLowerCase() === 'silver' &&
            !stock.sizeId &&
            (stock.purity === null || stock.purity === undefined);

          // Handle null values with fallbacks
          const weight = stock.weight ? Number(stock.weight) : 0;
          const purity = stock.purity ? Number(stock.purity) : 0;

          return {
            id: stock.id,
            srNo: index + 1,
            item: item?.name || '',
            design: stock.design || '',
            Stamp: stock.stamp || '',
            size: isGold ? '-' : size?.size || '',
            purity: isGold ? 100 : purity,
            grams: weight,
            isEditing: false,
            isSaved: true,
            gramsRaw: weight ? formatNumberDisplay(weight, 3) : '0',
            purityRaw: isGold
              ? '100'
              : purity
                ? formatNumberDisplay(purity, 3)
                : '',
            itemId: stock.itemId || '',
            sizeId: stock.sizeId || '',
            isGoldRow: isGold,
          };
        },
      );

      // Keep Gold row on top if present, followed by other inventory items
      const goldEntries = entries.filter((e) => e.isGoldRow);
      const otherEntries = entries.filter((e) => !e.isGoldRow);
      const sortedEntries = [...goldEntries, ...otherEntries].map((e, idx) => ({
        ...e,
        srNo: idx + 1,
      }));

      setOpeningEntries(sortedEntries);
    } else {
      const defaultEntries: OpeningStockEntry[] = [
        {
          id: 'os-default-1',
          srNo: 1,
          item: 'Silver',
          size: '-',
          purity: 50.0,
          grams: 250.0,
          gramsRaw: '250.000',
          purityRaw: '50.00',
          isSaved: true,
        },
        {
          id: 'os-default-2',
          srNo: 2,
          item: 'Silver',
          size: '20"',
          purity: 92.5,
          grams: 141.5,
          gramsRaw: '141.500',
          purityRaw: '92.50',
          isSaved: true,
        },
        {
          id: 'os-default-3',
          srNo: 3,
          item: 'Silver',
          size: '22"',
          purity: 92.5,
          grams: 269.2,
          gramsRaw: '269.200',
          purityRaw: '92.50',
          isSaved: true,
        },
        {
          id: 'os-default-4',
          srNo: 4,
          item: 'Silver',
          size: '-',
          purity: 99.9,
          grams: 500.0,
          gramsRaw: '500.000',
          purityRaw: '99.90',
          isSaved: true,
        },
        {
          id: 'os-default-5',
          srNo: 5,
          item: 'Silver',
          size: '24"',
          purity: 75.0,
          grams: 180.0,
          gramsRaw: '180.000',
          purityRaw: '75.00',
          isSaved: true,
        },
      ];
      setOpeningEntries(defaultEntries);
    }
  }, [
    rawStockData,
    rawItems,
    rawSizes,
    itemsLoading,
    sizesLoading,
    stockLoading,
  ]);

  // Filter data based on search term (memoized)
  const filteredData = useMemo(() => {
    if (!searchTerm) return openingEntries;
    const term = searchTerm.toLowerCase();
    return openingEntries.filter(
      (item) =>
        item.item.toLowerCase().includes(term) ||
        item.size.toLowerCase().includes(term) ||
        item.purity.toString().includes(term),
    );
  }, [openingEntries, searchTerm]);

  // Validate form data - Skip validation for gold row
  const validateEntry = (entry: OpeningStockEntry): boolean => {
    // Skip validation for gold row
    if (isGoldRow(entry)) {
      return true;
    }

    try {
      OpeningStockSchema.parse({
        itemId: entry.itemId || '',
        sizeId: entry.sizeId || '',
        grams: entry.grams || 0,
        purity:
          typeof entry.purity === 'string'
            ? parseFloat(entry.purity)
            : entry.purity || 0,
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      }
      return false;
    }
  };

  // Handle row edit toggle
  const handleRowEdit = (indexOrId: number | string) => {
    setOpeningEntries((prev) =>
      prev.map((entry, i) => {
        const isMatch =
          typeof indexOrId === 'number'
            ? i === indexOrId
            : entry.id === indexOrId;
        if (isMatch) {
          return {
            ...entry,
            isEditing: !entry.isEditing,
            gramsRaw: entry.grams !== 0 ? entry.grams.toString() : '',
            purityRaw: entry.purity ? entry.purity.toString() : '',
          };
        }
        return entry;
      }),
    );
  };

  // Handle inline field change
  const handleInlineChange = (
    indexOrId: number | string,
    field: 'item' | 'size' | 'purity' | 'grams' | 'itemId' | 'sizeId',
    value: string,
  ) => {
    setOpeningEntries((prev) =>
      prev.map((entry, i) => {
        const isMatch =
          typeof indexOrId === 'number'
            ? i === indexOrId
            : entry.id === indexOrId;
        if (isMatch) {
          const updated = { ...entry };

          if (field === 'item') {
            updated.item = value;
            const foundItem = items.find((item) => item.name === value);
            updated.itemId = foundItem?.id || '';
          } else if (field === 'size') {
            updated.size = value;
            const foundSize = sizes.find((size) => size.size === value);
            updated.sizeId = foundSize?.id || '';
          } else if (field === 'itemId') {
            updated.itemId = value;
            const foundItem = items.find((item) => item.id === value);
            updated.item = foundItem?.name || '';
          } else if (field === 'sizeId') {
            updated.sizeId = value;
            const foundSize = sizes.find((size) => size.id === value);
            updated.size = foundSize?.size || '';
          } else if (field === 'purity') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            const parts = sanitized.split('.');
            const formatted =
              parts.length > 2
                ? `${parts[0]}.${parts.slice(1).join('')}`
                : sanitized;
            updated.purity = parseFloat(formatted) || 0;
            updated.purityRaw = formatted;
          } else if (field === 'grams') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            const parts = sanitized.split('.');
            let formatted =
              parts.length > 2
                ? `${parts[0]}.${parts.slice(1).join('')}`
                : sanitized;

            if (
              formatted.includes('.') &&
              formatted.split('.')[1]?.length > 3
            ) {
              formatted = `${formatted.split('.')[0]}.${formatted.split('.')[1].slice(0, 3)}`;
            }

            updated.gramsRaw = formatted;
            if (formatted === '' || formatted === '.' || formatted === '-') {
              updated.grams = 0;
            } else {
              const numValue = parseFloat(formatted);
              updated.grams = isNaN(numValue) ? 0 : numValue;
            }
          }

          return updated;
        }
        return entry;
      }),
    );
  };

  // Helper function to format numbers up to 3 decimal places without unnecessary TRIALing zeros
  // (e.g. 1.200000000000003 -> "1.2", 1.233 -> "1.233", 92 -> "92")
  const formatNumberDisplay = (
    value: number | string | null | undefined,
    maxDecimals: number = 3,
  ): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return '-';
    if (num === 0) return '0';

    const fixed = num.toFixed(maxDecimals);
    return parseFloat(fixed).toString();
  };

  const formatGrams = (value: number | string | null | undefined): string => {
    return formatNumberDisplay(value, 3);
  };

  // Handle row save - Create or Update
  const handleRowSave = async (indexOrId: number | string) => {
    const entry =
      typeof indexOrId === 'number'
        ? openingEntries[indexOrId]
        : openingEntries.find((e) => e.id === indexOrId);

    if (!entry) return;

    // Validate using Zod schema (skips validation for gold row)
    if (!validateEntry(entry)) {
      return;
    }

    let stockDataPayload;

    // For gold row, only send id and weight
    if (isGoldRow(entry)) {
      stockDataPayload = {
        id: entry.id,
        weight: entry.grams || 0,
      };
    } else {
      stockDataPayload = {
        itemId: entry.itemId || '',
        sizeId: entry.sizeId || null,
        design: entry.design?.trim() || null,
        stamp: (entry.Stamp || entry.stamp || '').trim() || null,
        weight: entry.grams || 0,
        purity:
          typeof entry.purity === 'string'
            ? parseFloat(entry.purity)
            : entry.purity || 0,
      };
    }

    try {
      if (entry.isSaved) {
        await updateStock.mutateAsync({ id: entry.id, data: stockDataPayload });
      } else {
        const result = await createStock.mutateAsync(stockDataPayload);
        entry.id = result.id;
      }

      setOpeningEntries((prev) =>
        prev.map((s) => {
          if (s.id === entry.id) {
            return {
              ...s,
              isEditing: false,
              isSaved: true,
              gramsRaw: formatNumberDisplay(entry.grams || 0, 3),
              purityRaw: isGoldRow(entry)
                ? ''
                : formatNumberDisplay(entry.purity || 0, 3),
            };
          }
          return s;
        }),
      );

      await refetch();
    } catch (error: any) {
      console.error('Error saving opening stock:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to save opening stock',
      );
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<OpeningStockEntry | null>(
    null,
  );

  // Handle delete click
  const handleDelete = (indexOrId: number | string) => {
    const entry =
      typeof indexOrId === 'number'
        ? openingEntries[indexOrId]
        : openingEntries.find((e) => e.id === indexOrId);

    if (!entry) return;

    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      if (entryToDelete.isSaved) {
        await deleteStock.mutateAsync(entryToDelete.id);
      }

      // Remove the deleted row immediately from the local table
      setOpeningEntries((prev) =>
        prev
          .filter((e) => e.id !== entryToDelete.id)
          .map((e, i) => ({
            ...e,
            srNo: i + 1,
          })),
      );

      setDeleteModalOpen(false);
      setEntryToDelete(null);
    } catch (error: any) {
      console.error('Error deleting opening stock:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to delete opening stock',
      );
    }
  };

  // Handle add new row (prepends to the beginning so it shows first)
  const handleAddRow = () => {
    const newEntry: OpeningStockEntry = {
      id: `opening-${Date.now()}`,
      srNo: 1,
      item: '',
      size: '',
      purity: 0,
      grams: 0,
      isEditing: true,
      isSaved: false,
      gramsRaw: '',
      purityRaw: '',
      itemId: '',
      sizeId: '',
      isGoldRow: false,
    };
    setOpeningEntries((prev) =>
      [newEntry, ...prev].map((entry, idx) => ({
        ...entry,
        srNo: idx + 1,
      })),
    );
  };

  // Check if a row is the gold row
  const isGoldRow = (entry: OpeningStockEntry) => {
    return Boolean(
      entry.isGoldRow,
    );
  };

  // Handle cancel adding new unsaved row
  const handleCancelAddRow = (id: string) => {
    setOpeningEntries((prev) =>
      prev
        .filter((e) => e.id !== id)
        .map((e, idx) => ({
          ...e,
          srNo: idx + 1,
        })),
    );
  };

  // Custom action renderer for GenericTable with matching theme
  const renderActions = (item: OpeningStockEntry) => {
    // When a row is newly added and not saved yet: only show Save and Cancel option
    if (!item.isSaved) {
      return (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => handleRowSave(item.id)}
            disabled={createStock.isPending || updateStock.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleCancelAddRow(item.id)}
            className="text-gray-500 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-red-50 hover:text-red-600 active:scale-[0.98] dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // For already saved rows, do not show Edit or Delete
    return null;
  };

  // Define columns for GenericTable: Item, Design, Stamp (शिक्का), Purity (%), Weight (G)
  const columns: Column<OpeningStockEntry>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (item) => {
        if (isGoldRow(item) && item.isSaved) {
          return (
            <span className="font-medium text-[#785600] dark:text-amber-400">
              SILVER
            </span>
          );
        }
        if (item.isEditing) {
          return (
            <select
              value={item.itemId || (item.item === 'Silver' ? 'silver-item' : '')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'silver-item') {
                  setOpeningEntries((prev) =>
                    prev.map((row) =>
                      row.id === item.id ? { ...row, itemId: 'silver-item', item: 'Silver' } : row,
                    ),
                  );
                } else {
                  handleInlineChange(item.id, 'itemId' as any, val);
                }
              }}
              className="w-28 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select Item</option>
              <option value="silver-item">Silver</option>
              {items &&
                items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          );
        }
        return (
          <span className="font-medium text-[#1a1c1b] dark:text-white">
            {item.item || 'Silver'}
          </span>
        );
      },
    },
    {
      key: 'design',
      header: 'Design',
      render: (item) => {
        if (isGoldRow(item) && item.isSaved) {
          return <span className="text-[#4f4535] dark:text-slate-400">-</span>;
        }
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.design || ''}
              onChange={(e) =>
                setOpeningEntries((prev) =>
                  prev.map((row) =>
                    row.id === item.id ? { ...row, design: e.target.value } : row,
                  ),
                )
              }
              placeholder="Design"
              className="w-28 rounded border border-[#b8a892] bg-white px-2 py-1 text-sm text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          );
        }
        return (
          <span className="text-[#1a1c1b] dark:text-white">{item.design || '-'}</span>
        );
      },
    },
    {
      key: 'Stamp',
      header: 'Stamp (शिक्का)',
      render: (item) => {
        if (isGoldRow(item) && item.isSaved) {
          return <span className="text-[#4f4535] dark:text-slate-400">-</span>;
        }
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.Stamp || ''}
              onChange={(e) =>
                setOpeningEntries((prev) =>
                  prev.map((row) =>
                    row.id === item.id ? { ...row, Stamp: e.target.value } : row,
                  ),
                )
              }
              placeholder="Stamp (शिक्का)"
              className="w-24 rounded border border-[#b8a892] bg-white px-2 py-1 text-sm text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          );
        }
        return (
          <span className="text-[#1a1c1b] dark:text-white">{item.Stamp || item.stamp || (item as any)['Stamp (शिक्का)'] || '-'}</span>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item) => {
        if (isGoldRow(item)) {
          return (
            <span className="font-mono font-medium text-[#785600] dark:text-amber-400">
              100%
            </span>
          );
        }
        if (item.isEditing) {
          return (
            <div className="inline-block w-28">
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={2}
                value={
                  item.purityRaw !== undefined
                    ? item.purityRaw
                    : item.purity
                      ? item.purity.toString()
                      : ''
                }
                onChange={(e) =>
                  handleInlineChange(item.id, 'purity' as any, e.target.value)
                }
                placeholder="e.g., 98"
                suffix="%"
                compact
                className="font-mono text-right"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity, 3)} %
          </span>
        );
      },
    },
    {
      key: 'grams',
      header: 'Weight (G)',
      render: (item, index) => {
        if (item.isEditing) {
          const actualIndex = openingEntries.findIndex((e) => e.id === item.id);
          const targetIndex = actualIndex >= 0 ? actualIndex : index;
          return (
            <div className="inline-block w-28">
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={
                  item.gramsRaw !== undefined
                    ? item.gramsRaw
                    : item.grams === 0
                      ? ''
                      : item.grams
                }
                {...getScaleProps(targetIndex, 'grams')}
                onChange={(e) =>
                  handleInlineChange(item.id, 'grams' as any, e.target.value)
                }
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-right"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatGrams(item.grams || 0)} G
          </span>
        );
      },
    },
  ];

  const isSubmitting =
    createStock.isPending || updateStock.isPending || deleteStock.isPending;

  const hasUnsavedRows = useMemo(() => {
    return openingEntries.some((entry) => !entry.isSaved);
  }, [openingEntries]);

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header with Title, Search and Add Button */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <button
              onClick={() => navigate({ to: '/Stocks/stockpage' })}
              className="flex flex-shrink-0 items-center gap-1 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs font-medium sm:text-sm">Back</span>
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Opening Stock
            </h2>
          </div>

          {/* Search and Add Button - Same Line */}
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search by item, size or purity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Add Button */}
            <GenericButton type="button" onClick={handleAddRow}>
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{' '}
              <span className="xs:inline hidden">Add Row</span>
              <span className="xs:hidden">Add Row</span>
            </GenericButton>
          </div>
        </div>
      </div>
      <div className="px-3 pb-4 sm:px-4 md:px-6">
        {/* Generic Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={filteredData}
            columns={columns}
            onSave={(item) => handleRowSave(item.id)}
            emptyMessage="No opening stock entries found. Click 'Add Row' to create one."
            isLoading={isSubmitting}
            renderActions={hasUnsavedRows ? renderActions : undefined}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setEntryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Opening Stock"
        itemIdentifier={
          entryToDelete
            ? `${entryToDelete.item}${entryToDelete.size && entryToDelete.size !== '-' ? ` (${entryToDelete.size})` : ''}`
            : undefined
        }
        isLoading={deleteStock.isPending}
      />
    </div>
  );
};

export default OpeningStock;
