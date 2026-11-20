import React, {useState, useMemo} from 'react';
import {
  X,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  Calendar,
  Tag,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';

interface TarRevertModalProps {
  isOpen: boolean;
  onClose: () => void;
  tarHistoryData: any[];
  isLoading: boolean;
  onRevertSelected: (ids: string[]) => Promise<void>;
  refetchHistory?: () => void;
}

export const TarRevertModal: React.FC<TarRevertModalProps> = ({
  isOpen,
  onClose,
  tarHistoryData,
  isLoading,
  onRevertSelected,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalize list to show only the last (latest) entry
  const historyList = useMemo(() => {
    const list = Array.isArray(tarHistoryData)
      ? tarHistoryData
      : Array.isArray((tarHistoryData as any)?.data)
        ? (tarHistoryData as any).data
        : Array.isArray((tarHistoryData as any)?.history)
          ? (tarHistoryData as any).history
          : [];
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
  }, [tarHistoryData]);

  // Filter list by search term
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return historyList;
    const term = searchTerm.toLowerCase().trim();
    return historyList.filter((item: any) => {
      const purityStr = String(item.purity ?? item.tanch ?? '');
      const weightStr = String(
        item.tarWeight ??
          item.tar ??
          item.grossWeight ??
          item.weight ??
          item.fine ??
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
        `tar ${purityStr}%`.includes(term) ||
        `tar${purityStr}%`.includes(term)
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
      toast.error('Please select at least one Tar entry to revert');
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
                Revert Tar History
              </h3>
              <p className="text-xs text-[#4f4535] dark:text-slate-400">
                Select completed Tar records to revert back to active Tar
                process
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg p-1.5 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-gray-50/70 flex flex-col gap-2.5 border-b border-[#d3c4af]/15 px-6 py-3 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="text-gray-400 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              autoComplete="off"
              data-lpignore="true"
              type="search"
              placeholder="Search by purity, weight, size, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="placeholder:text-gray-400 w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] focus:border-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-gray-500 text-xs font-medium dark:text-slate-400">
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
            <div className="text-gray-500 flex flex-col items-center justify-center py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#785600] border-t-transparent dark:border-amber-400"></div>
              <span className="mt-3 text-sm">Loading Tar history...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-gray-400 rounded-xl border border-dashed border-[#d3c4af]/40 py-12 text-center dark:border-slate-700 dark:text-slate-500">
              No Tar history records found.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredList.map((item: any, index: number) => {
                const id = String(item._id || item.id || `tar-${index}`);
                const isSelected = selectedIds.has(id);
                const purity = item.purity ?? item.tanch ?? 0;
                const weight = Number(
                  item.tarWeight ??
                    item.tar ??
                    item.grossWeight ??
                    item.weight ??
                    item.fine ??
                    0,
                );
                const itemName =
                  item.item?.name ?? item.item ?? item.particular;
                const sizeName = item.size?.size ?? item.size;
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
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                      isSelected
                        ? 'border-[#785600] bg-amber-50/80 shadow-sm ring-2 ring-[#785600]/20 dark:border-amber-400 dark:bg-amber-950/40'
                        : 'hover:bg-gray-50/50 border-[#d3c4af]/30 bg-white hover:border-[#785600]/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by container click
                        className="border-gray-300 h-4 w-4 rounded text-[#785600] focus:ring-[#785600] dark:border-slate-600"
                      />
                      <span className="font-mono whitespace-nowrap text-sm font-bold text-black dark:text-white">
                        Tar {purity}% ({weight.toFixed(3)}G)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {(itemName || sizeName) && (
                        <div className="flex items-center gap-1.5 text-xs text-[#4f4535] dark:text-slate-300">
                          {itemName && (
                            <span className="bg-gray-100 inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 font-medium dark:bg-slate-700">
                              <Tag className="text-gray-400 h-3 w-3" />
                              {itemName}
                            </span>
                          )}
                          {sizeName && (
                            <span className="whitespace-nowrap rounded bg-amber-100 px-2 py-0.5 font-semibold text-[#785600] dark:bg-amber-950/60 dark:text-amber-300">
                              {sizeName}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-gray-500 flex items-center gap-1 whitespace-nowrap text-xs dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50/50 flex items-center justify-between border-t border-[#d3c4af]/20 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg border px-4 py-2 text-sm font-semibold dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
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
