import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  Calendar,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';
import { formatNumberDisplay } from '../boxdept/boxUtils';

interface BoxRevertModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxHistoryData: any[];
  isLoading: boolean;
  onRevertSelected: (ids: string[]) => Promise<void>;
  refetchHistory?: () => void;
}

const formatDateDisplay = (dateString?: string) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const time = d
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();
  return `${day}/${month}/${year} ${time}`;
};

export const BoxRevertModal: React.FC<BoxRevertModalProps> = ({
  isOpen,
  onClose,
  boxHistoryData,
  isLoading,
  onRevertSelected,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Raw list
  const historyList = useMemo(() => {
    const list = Array.isArray(boxHistoryData)
      ? boxHistoryData
      : Array.isArray((boxHistoryData as any)?.data)
        ? (boxHistoryData as any).data
        : Array.isArray((boxHistoryData as any)?.history)
          ? (boxHistoryData as any).history
          : [];
    if (list.length === 0) return [];
    return [...list].sort((a: any, b: any) => {
      const dateA = new Date(
        a.updatedAt || a.proceedDateTime || a.updated_at || a.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        b.updatedAt || b.proceedDateTime || b.updated_at || b.createdAt || 0,
      ).getTime();
      return dateB - dateA;
    });
  }, [boxHistoryData]);

  // Filter list by search term
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return historyList;
    const term = searchTerm.toLowerCase().trim();
    return historyList.filter((item: any) => {
      const purityStr = String(item.purity ?? '');
      const weightStr = String(
        item.chainWeight ??
          item.tarWeight ??
          item.grossWeight ??
          item.weight ??
          '',
      );
      const itemName = String(
        item.item?.name ?? item.item ?? item.particular ?? '',
      ).toLowerCase();
      const sizeName = String(item.size?.size ?? item.size ?? '').toLowerCase();
      const dateStr = String(
        item.createdAt ?? item.updatedAt ?? item.dateTime ?? '',
      ).toLowerCase();

      return (
        purityStr.includes(term) ||
        weightStr.includes(term) ||
        itemName.includes(term) ||
        sizeName.includes(term) ||
        dateStr.includes(term) ||
        `box ${purityStr}%`.includes(term) ||
        `box${purityStr}%`.includes(term)
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
      toast.error('Please select at least one Box entry to revert');
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

  const isAllSelected =
    selectedIds.size === filteredList.length && filteredList.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#785600]/10 text-[#785600] dark:bg-amber-400/10 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
                Revert Box History
              </h3>
              <p className="text-xs text-[#4f4535] dark:text-slate-400">
                Select completed Box records to revert back to active Box process
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Actions Bar (Matching reference design) */}
        <div className="flex flex-col gap-3 border-b border-[#d3c4af]/20 px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              autoComplete="off"
              data-lpignore="true"
              type="search"
              placeholder="Search by purity, weight, size, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#d3c4af]/40 bg-white py-2 pl-10 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563]/70 focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>

          {/* Selection counter & Select All button */}
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-sm font-medium text-[#817563] dark:text-slate-400">
              {selectedIds.size} of {filteredList.length} selected
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#785600] transition-opacity hover:opacity-80 dark:text-amber-400"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="h-4 w-4 text-[#785600] dark:text-amber-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 text-[#785600] dark:text-amber-400" />
                  <span>Select All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* List of Entries (Matching reference item card design) */}
        <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#785600] border-t-transparent dark:border-amber-400"></div>
              <span className="mt-3 text-sm">Loading Box history...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d3c4af]/40 py-12 text-center text-gray-400 dark:border-slate-700 dark:text-slate-500">
              No Box history records found.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredList.map((item: any, index: number) => {
                const id = String(item._id || item.id || `box-${index}`);
                const isSelected = selectedIds.has(id);
                const purity = item.purity ?? 0;
                const weight = Number(
                  item.chainWeight ??
                    item.tarWeight ??
                    item.grossWeight ??
                    item.weight ??
                    0,
                );
                const sizeName = typeof item.size === 'object' ? item.size?.size : item.size;
                const titleText = sizeName
                  ? `${sizeName} ${purity}% (${formatNumberDisplay(weight)}G)`
                  : `Box ${purity}% (${formatNumberDisplay(weight)}G)`;
                const formattedDate = formatDateDisplay(
                  item.createdAt || item.updatedAt || item.dateTime,
                );

                return (
                  <div
                    key={id}
                    onClick={() => toggleSelect(id)}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition-all ${
                      isSelected
                        ? 'border-[#785600] bg-amber-50/50 shadow-sm ring-1 ring-[#785600]/30 dark:border-amber-400 dark:bg-amber-950/30'
                        : 'border-[#d3c4af]/30 bg-white hover:border-[#785600]/40 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    {/* Left: Checkbox & Item Label */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by card click
                        className="h-4 w-4 rounded border-[#d3c4af] text-[#785600] focus:ring-[#785600] dark:border-slate-600"
                      />
                      <span className="text-base font-semibold text-[#1a1c1b] dark:text-white">
                        {titleText}
                      </span>
                    </div>

                    {/* Right: Date & Time */}
                    <div className="flex items-center gap-2 text-sm text-[#817563] dark:text-slate-400">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-[#817563] dark:text-slate-400" />
                      <span className="whitespace-nowrap font-medium">{formattedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#d3c4af]/20 bg-gray-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <GenericButton size="sm"
            type="button"
            onClick={handleRevert}
            variant="primary"
            disabled={selectedIds.size === 0 || isSubmitting}
          >
            <RotateCcw
              className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`}
            />
            <span>
              {isSubmitting
                ? 'Reverting...'
                : `Revert Selected (${selectedIds.size})`}
            </span>
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default BoxRevertModal;
