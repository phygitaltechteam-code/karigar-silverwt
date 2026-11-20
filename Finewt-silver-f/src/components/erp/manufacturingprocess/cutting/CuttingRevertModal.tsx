import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  Calendar,
  Flame,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';
import {
  formatNumberDisplay,
  formatPurityDisplay,
  getItemName,
  getSizeName,
  hasMeltingStatus,
} from './cuttingUtils';

interface CuttingRevertModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyData: any[];
  isLoading: boolean;
  onRevertSelected: (ids: string[]) => Promise<void>;
  refetchHistory?: () => void;
}

export const CuttingRevertModal: React.FC<CuttingRevertModalProps> = ({
  isOpen,
  onClose,
  historyData,
  isLoading,
  onRevertSelected,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalize list to show only the last (latest) entry
  const historyList = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(historyData)) {
      list = historyData;
    } else if (historyData && typeof historyData === 'object') {
      const d =
        (historyData as any).data ??
        (historyData as any).history ??
        historyData;
      if (Array.isArray(d)) {
        list = d;
      } else if (d && typeof d === 'object' && (d.id || d._id)) {
        list = [d];
      }
    }
    if (list.length === 0) return [];
    const sorted = [...list].sort((a: any, b: any) => {
      const dateA = new Date(
        a.updatedAt || a.proceedDateTime || a.updated_at || a.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        b.updatedAt || b.proceedDateTime || b.updated_at || b.createdAt || 0,
      ).getTime();
      return dateB - dateA;
    });
    return sorted.slice(0, 1);
  }, [historyData]);

  // Pre-select the last entry when historyList loads
  useEffect(() => {
    if (historyList.length > 0) {
      const firstId = String(historyList[0]._id || historyList[0].id || '');
      if (firstId) {
        setSelectedIds(new Set([firstId]));
      }
    } else {
      setSelectedIds(new Set());
    }
  }, [historyList]);

  // Filter list by search term
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return historyList;
    const term = searchTerm.toLowerCase().trim();
    return historyList.filter((item: any) => {
      const purityStr = String(item.purity ?? '');
      const weightStr = String(
        item.chainWeight ?? item.chainGiven ?? item.weight ?? '',
      );
      const itemName = getItemName(item?.item).toLowerCase();
      const sizeName = getSizeName(item?.size).toLowerCase();
      const dateStr = String(
        item.createdAt ?? item.updatedAt ?? item.dateTime ?? '',
      ).toLowerCase();

      return (
        purityStr.includes(term) ||
        weightStr.includes(term) ||
        itemName.includes(term) ||
        sizeName.includes(term) ||
        dateStr.includes(term)
      );
    });
  }, [historyList, searchTerm]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length && filteredList.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set<string>();
      filteredList.forEach((item: any) => {
        const id = item._id || item.id;
        if (id) allIds.add(String(id));
      });
      setSelectedIds(allIds);
    }
  };

  const handleRevert = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one Cutting entry to revert');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRevertSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    } catch (err) {
      console.error('Error during revert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                Revert Cutting History
              </h3>
              <p className="text-xs text-[#4f4535] dark:text-slate-400">
                Select last completed Cutting record to revert back to active Cutting process
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col gap-2.5 border-b border-[#d3c4af]/15 bg-gray-50/70 px-6 py-3 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoComplete="off"
              data-lpignore="true"
              type="search"
              placeholder="Search by purity, weight, item, size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-gray-400 focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              {selectedIds.size} of {filteredList.length} selected
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#785600] hover:underline dark:text-amber-400"
            >
              {selectedIds.size === filteredList.length &&
                filteredList.length > 0 ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Select All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* List of Entries */}
        <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#785600] border-t-transparent dark:border-amber-400"></div>
              <span className="mt-3 text-sm">Loading Cutting history...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d3c4af]/40 py-12 text-center text-gray-400 dark:border-slate-700 dark:text-slate-500">
              No Cutting history records found.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredList.map((item: any, index: number) => {
                const id = String(item._id || item.id || `cutting-${index}`);
                const isSelected = selectedIds.has(id);
                const purity = item.purity ?? 0;
                const chainGiven = item.chainWeight ?? item.chainGiven ?? 0;
                const chainReceived = item.chainReceived ?? 0;
                const scrap = item.scrap ?? 0;
                const rawItemName = getItemName(item?.item);
                const itemName =
                  rawItemName !== '-'
                    ? rawItemName
                    : item?.itemName || 'Cutting Stock';
                const rawSizeName = getSizeName(item?.size);
                const sizeName =
                  rawSizeName !== '-'
                    ? rawSizeName
                    : item?.sizeName || (typeof item?.size === 'string' ? item.size : '-');
                const isMelting = hasMeltingStatus(item);
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                  : item.dateTime || '-';

                return (
                  <div
                    key={id}
                    onClick={() => toggleSelect(id)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all ${isSelected
                        ? 'border-[#785600] bg-amber-50/80 shadow-sm ring-2 ring-[#785600]/20 dark:border-amber-400 dark:bg-amber-950/40'
                        : 'border-[#d3c4af]/30 bg-white hover:border-[#785600]/50 hover:bg-gray-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/80'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${isSelected
                            ? 'bg-[#785600] text-white dark:bg-amber-500'
                            : 'border border-gray-300 dark:border-slate-600'
                          }`}
                      >
                        {isSelected && <CheckSquare className="h-4 w-4" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                          {itemName} {formatPurityDisplay(purity)}% ({formatNumberDisplay(chainGiven)}G)
                        </span>
                        {isMelting && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <Flame className="h-3 w-3 text-amber-600" />
                            Melting
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#d3c4af]/20 px-6 py-4 dark:border-slate-800">
          <GenericButton size="sm"
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
          >
            Cancel
          </GenericButton>
          <GenericButton size="sm"
            type="button"
            onClick={handleRevert}
            variant="primary"
            disabled={isSubmitting || selectedIds.size === 0}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            <RotateCcw className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'Reverting...' : 'Revert Selected'}</span>
          </GenericButton>
        </div>
      </div>
    </div>
  );
};
