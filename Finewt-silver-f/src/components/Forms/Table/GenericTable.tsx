// components/Common/GenericTable.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Edit,
  Trash2,
  Save,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

export interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode | string;
  render?: (item: T, index: number) => React.ReactNode;
  editable?: boolean;
  inputType?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  colSpan?: (item: T, index: number) => number;
  rowSpan?: (item: T, index: number) => number;
  /** Card mode on phones: this field takes the full card width */
  mobileFull?: boolean;
}

export interface GenericTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSave?: (item: T, index: number) => void;
  onEdit?: (item: T, index: number) => void;
  onDelete?: (item: T, index: number) => void;
  onAdd?: () => void;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  title?: string;
  addButtonLabel?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  renderActions?: (item: T, index: number) => React.ReactNode;
  customActions?: (item: T, index: number) => React.ReactNode;
  showEdit?: boolean;
  showDelete?: boolean;
  enableInlineEdit?: boolean;
  showSrNo?: boolean;
  srNoLabel?: string;
  rowClassName?: (item: T, index: number) => string;
  rowTextColor?: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
  hoverColor?: string;
  evenRowColor?: string;
  oddRowColor?: string;
  selectedRowColor?: string;
  pagination?: boolean;
  pageSize?: number;
  itemsPerPage?: number;
  showPagination?: boolean;
  /** On phones (below md) show each row as a card (label + value, two per line) instead of the table */
  mobileCards?: boolean;
}

const getPageNumbers = (current: number, total: number) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export function GenericTable<T extends { id?: string | number }>({
  data,
  columns,
  onSave,
  onEdit,
  onDelete,
  onAdd,
  searchPlaceholder = 'Search...',
  searchFields = [],
  title,
  addButtonLabel = 'Add New',
  emptyMessage = 'No entries found',
  isLoading = false,
  renderActions,
  customActions,
  showEdit = false,
  showDelete = false,
  enableInlineEdit = false,
  showSrNo = false,
  srNoLabel = 'Sr No.',
  rowClassName,
  rowTextColor,
  onRowClick,
  hoverColor = 'hover:bg-[#f4f4f2]/50 dark:hover:bg-slate-800/50',
  evenRowColor = 'bg-white dark:bg-slate-900',
  oddRowColor = 'bg-[#f8f6f4] dark:bg-slate-800/60',
  selectedRowColor = 'bg-[#785600]/5 dark:bg-amber-900/10',
  pagination = true,
  pageSize = 15,
  itemsPerPage,
  showPagination = true,
  mobileCards = false,
}: GenericTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<T>>({});
  const [tableData, setTableData] = useState<T[]>(data);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const effectivePageSize = itemsPerPage || pageSize || 15;
  const isPaginationEnabled = pagination !== false && showPagination !== false;

  // Update tableData only when inline edit mode is active and data changes
  useEffect(() => {
    if (enableInlineEdit) {
      setTableData(data);
    }
  }, [data, enableInlineEdit]);

  // Reset pagination when search term or data count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data.length]);

  const sourceData = enableInlineEdit ? tableData : data;

  const handleEdit = (item: T, index: number) => {
    if (enableInlineEdit) {
      setEditingIndex(index);
      setEditData({ ...item });
    }
    if (onEdit) onEdit(item, index);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditData({});
  };

  const handleSave = (item: T, index: number) => {
    const updatedItem = { ...item, ...editData };
    if (onSave) onSave(updatedItem, index);
    setEditingIndex(null);
    setEditData({});
  };

  const handleFieldChange = (key: string, value: any) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRowClick = (item: T, index: number) => {
    setSelectedRowIndex(index);
    if (onRowClick) {
      onRowClick(item, index);
    }
  };

  const filteredData = useMemo(() => {
    if (searchFields.length > 0 && searchTerm) {
      const term = searchTerm.toLowerCase();
      return sourceData.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(term);
        }),
      );
    }
    return sourceData;
  }, [sourceData, searchFields, searchTerm]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));

  // Ensure current page is within valid range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    if (!isPaginationEnabled) return filteredData;
    const start = (currentPage - 1) * effectivePageSize;
    return filteredData.slice(start, start + effectivePageSize);
  }, [filteredData, currentPage, effectivePageSize, isPaginationEnabled]);

  const getValue = (item: T, key: string | keyof T) => {
    if (typeof key === 'string' && key.includes('.')) {
      const parts = key.split('.');
      let value: any = item;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      return value;
    }
    return item[key as keyof T];
  };

  const getCellValue = (item: T, column: Column<T>, index: number) => {
    if (column.render) {
      return column.render(item, index);
    }
    return getValue(item, column.key);
  };

  const isEditing = (index: number) =>
    editingIndex === index && enableInlineEdit;

  const showActionsColumn =
    renderActions ||
    customActions ||
    showEdit ||
    showDelete ||
    (enableInlineEdit && (onEdit || onDelete));

  // Get all columns including SR No if enabled
  const allColumns = showSrNo
    ? [
      {
        key: '__srNo' as keyof T,
        header: srNoLabel,
        align: 'center' as const,
        width: '60px',
        className: 'text-center font-semibold text-white dark:text-[#986d00]',
        render: (_: T, pageIndex: number) => {
          const actualSr = isPaginationEnabled
            ? (currentPage - 1) * effectivePageSize + pageIndex + 1
            : pageIndex + 1;
          return (
            <span className="text-xs font-semibold text-[#1a1c1b] dark:text-[#986d00] sm:text-sm">
              {actualSr}
            </span>
          );
        },
      },
      ...columns,
    ]
    : columns;

  const getColumnAlign = (column: Column<T>) => {
    return column.align || 'center';
  };

  const getRowColor = (item: T, index: number) => {
    if (rowClassName) {
      return rowClassName(item, index);
    }

    if (selectedRowIndex === index) {
      return selectedRowColor;
    }

    return index % 2 === 0 ? evenRowColor : oddRowColor;
  };

  const getRowTextColorClass = (item: T, index: number) => {
    if (rowTextColor) {
      return rowTextColor(item, index);
    }
    return 'text-[#1a1c1b] dark:text-white';
  };

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div>
        {/* Header with Title, Search and Add Button */}
        {(title || onAdd || searchFields.length > 0) && (
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {title && (
              <h2 className="text-xl font-bold text-[#1a1c1b] dark:text-white">
                {title}
              </h2>
            )}

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {searchFields.length > 0 && (
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                  <input
              autoComplete="off"
              data-lpignore="true"
                    type="search"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:w-64"
                  />
                </div>
              )}

              {onAdd && (
                <GenericButton type="button" onClick={onAdd} variant="primary">
                  <span className="text-lg leading-none">+</span>
                  {addButtonLabel}
                </GenericButton>
              )}
            </div>
          </div>
        )}

        {/* Phones: one card per row (only when mobileCards) */}
        {mobileCards && (
          <div className="flex flex-col gap-2.5 md:hidden">
            {paginatedData.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d3c4af]/50 bg-white px-4 py-8 text-center text-sm text-[#4f4535] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              paginatedData.map((item, pageIndex) => {
                const actualIndex = isPaginationEnabled
                  ? (currentPage - 1) * effectivePageSize + pageIndex
                  : pageIndex;
                return (
                  <div
                    key={(item as any)?.id ?? actualIndex}
                    onClick={onRowClick ? () => onRowClick(item, actualIndex) : undefined}
                    className="rounded-xl border border-[#d3c4af]/30 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#f4f4f2] pb-2 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                        {showSrNo ? `${srNoLabel} ${actualIndex + 1}` : ''}
                      </span>
                      {renderActions && <div onClick={(e) => e.stopPropagation()}>{renderActions(item, actualIndex)}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                      {columns.map((column, ci) => (
                        <div key={ci} className={`min-w-0 ${column.mobileFull ? 'col-span-2' : ''}`}>
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#817563] dark:text-slate-400">
                            {column.header}
                          </div>
                          <div className="min-w-0 text-sm text-[#1a1c1b] dark:text-white [&>div]:!w-full [&_input]:!w-full [&_input]:!min-w-0 [&_select]:!w-full">
                            {getCellValue(item, column, actualIndex) as React.ReactNode}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Table */}
        <div className={`border border-[#d3c4af]/10 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${mobileCards ? 'hidden md:block' : ''}`}>
          {/* Full height (page scrolls); only scrolls sideways when the table is wider than the screen */}
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-[#785600] to-[#986d00] text-xs uppercase tracking-[0.15em] text-white">
                  {allColumns.map((column, idx) => (
                    <th
                      key={idx}
                      className={`px-3 py-3 font-semibold lg:px-4 ${column.className || ''}`}
                      style={{ width: column.width, textAlign: getColumnAlign(column) }}
                    >
                      {column.header}
                    </th>
                  ))}
                  {showActionsColumn && (
                    <th className="px-3 py-3 text-center font-semibold text-white lg:px-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f2] dark:divide-slate-700">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={allColumns.length + (showActionsColumn ? 1 : 0)}
                      className="py-12 text-center text-[#4f4535] dark:text-slate-400"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, pageIndex) => {
                    const actualIndex = isPaginationEnabled
                      ? (currentPage - 1) * effectivePageSize + pageIndex
                      : pageIndex;
                    const isItemEditing = isEditing(actualIndex);
                    const rowColor = getRowColor(item, actualIndex);
                    const textColor = getRowTextColorClass(item, actualIndex);
                    const isClickable = !!onRowClick;

                    return (
                      <tr
                        key={item.id || actualIndex}
                        className={`group transition-colors duration-150 ${rowColor} ${hoverColor} ${isClickable ? 'cursor-pointer' : ''} ${isItemEditing ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                        onClick={() => handleRowClick(item, actualIndex)}
                      >
                        {allColumns.map((column, colIdx) => {
                          if (column.colSpan) {
                            const span = column.colSpan(item, actualIndex);
                            if (span === 0) return null;
                          }
                          if (column.rowSpan) {
                            const rspan = column.rowSpan(item, actualIndex);
                            if (rspan === 0) return null;
                          }
                          const value = getCellValue(item, column, actualIndex);
                          const isEditable = column.editable && isItemEditing;
                          const align = getColumnAlign(column);
                          const colSpanVal = column.colSpan
                            ? column.colSpan(item, actualIndex)
                            : undefined;
                          const rowSpanVal = column.rowSpan
                            ? column.rowSpan(item, actualIndex)
                            : undefined;

                          return (
                            <td
                              key={colIdx}
                              colSpan={
                                colSpanVal && colSpanVal > 1
                                  ? colSpanVal
                                  : undefined
                              }
                              rowSpan={
                                rowSpanVal && rowSpanVal > 1
                                  ? rowSpanVal
                                  : undefined
                              }
                              className={`px-3 py-3 text-sm lg:px-4 ${textColor} ${column.className || ''}`}
                              style={{ textAlign: align }}
                            >
                              {isEditable ? (
                                column.inputType === 'select' &&
                                  column.options ? (
                                  <select
                                    value={
                                      (editData[
                                        column.key as keyof T
                                      ] as string) ||
                                      (value as string) ||
                                      ''
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        column.key as string,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                                  >
                                    <option value="">Select</option>
                                    {column.options.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={column.inputType || 'text'}
                                    value={
                                      (editData[
                                        column.key as keyof T
                                      ] as string) ||
                                      (value as string) ||
                                      ''
                                    }
                                    onChange={(e) =>
                                      handleFieldChange(
                                        column.key as string,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
                                    placeholder={`Enter ${typeof column.header === 'string' ? column.header.toLowerCase() : 'value'}`}
                                  />
                                )
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}

                        {/* Actions */}
                        {showActionsColumn && (
                          <td
                            className="px-3 py-3 text-center lg:px-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isItemEditing ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSave(item, actualIndex)}
                                  className="rounded-lg bg-emerald-600 p-1.5 text-white transition-colors hover:bg-emerald-700"
                                  title="Save"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="rounded-lg text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20 h-9 px-4 text-xs sm:text-[13px]"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                {renderActions ? (
                                  renderActions(item, actualIndex)
                                ) : (
                                  <>
                                    {showEdit && onEdit && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEdit(item, actualIndex);
                                        }}
                                        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
                                        title="Edit"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                    )}
                                    {showDelete && onDelete && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDelete(item, actualIndex);
                                        }}
                                        className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                    {customActions &&
                                      customActions(item, actualIndex)}
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer & Pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-[#4f4535] dark:text-slate-400 sm:flex-row">
          <div>
            {totalItems > 0 ? (
              isPaginationEnabled ? (
                <span>
                  Showing{' '}
                  <strong className="font-semibold text-[#1a1c1b] dark:text-white">
                    {(currentPage - 1) * effectivePageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="font-semibold text-[#1a1c1b] dark:text-white">
                    {Math.min(currentPage * effectivePageSize, totalItems)}
                  </strong>{' '}
                  of{' '}
                  <strong className="font-semibold text-[#1a1c1b] dark:text-white">{totalItems}</strong>
                </span>
              ) : (
                <span>
                  Showing {filteredData.length} of {sourceData.length} entries
                </span>
              )
            ) : null}
          </div>

          {isPaginationEnabled && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d3c4af]/30 bg-white text-[#785600] transition-colors hover:bg-[#785600]/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d3c4af]/30 bg-white text-[#785600] transition-colors hover:bg-[#785600]/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {getPageNumbers(currentPage, totalPages).map((pageNum, idx) =>
                pageNum === '...' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 py-1 text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => setCurrentPage(Number(pageNum))}
                    className={`flex h-8 min-w-[32px] items-center justify-center rounded-md px-2 text-xs font-medium transition-colors ${currentPage === pageNum
                        ? 'bg-gradient-to-br from-[#785600] to-[#986d00] text-white shadow-sm'
                        : 'border border-[#d3c4af]/30 bg-white text-[#1a1c1b] hover:bg-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                      }`}
                  >
                    {pageNum}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d3c4af]/30 bg-white text-[#785600] transition-colors hover:bg-[#785600]/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d3c4af]/30 bg-white text-[#785600] transition-colors hover:bg-[#785600]/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
