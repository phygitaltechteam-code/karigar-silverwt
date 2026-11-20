import React, { useState, useEffect } from 'react';
import { Search, Printer, Plus } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import GenericButton from '../Forms/Buttons/GenericButton';
import { useDeleteBill, useGetBill } from '@/lib/api/bill';
import { useGetHeader } from '@/lib/api/headerapi';
import { printReceipt } from '@/utils/printReceipt';
import { useGetProfileData, useActivateKey } from '@/lib/api/profile';
import GenericWeeklyDatePicker from '../Forms/DatePicker/GenericWeeklyDatePicker';
import { getCurrentAppWeekRange } from '@/utils/weekRangeUtils';

import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import PasswordConfirmModal from '@/components/common/PasswordConfirmModal';
import {
  ReceiptData,
  BillGroup,
  formatNumberWithDecimals,
} from './billing/billingTypes';
import { printBillingTableReport } from './billing/printBillingReport';
import { BillingSummaryCards } from './billing/BillingSummaryCards';
import { BillingSubscriptionModal } from './billing/BillingSubscriptionModal';
import { ManufacturingItemPickerModal } from './billing/ManufacturingItemPickerModal';
import { getBillingColumns } from './billing/billingColumns';

const Billing: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [billingGroups, setBillingGroups] = useState<BillGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BILL' | 'DRAFT'>(
    'ALL',
  );

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);
  const [showManufacturingItemPicker, setShowManufacturingItemPicker] =
    useState<BillGroup | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<BillGroup | null>(null);

  // Profile data & subscription expiry validation
  const checkexpiration = useGetProfileData();
  const profileData = checkexpiration?.data?.data || checkexpiration?.data;
  const expiryDate = profileData?.expiryDate;
  const storedKey = profileData?.key;

  const [enteredKey, setEnteredKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const activateKeyMutation = useActivateKey();

  // Check if current date is past expiryDate
  const isExpired = Boolean(
    expiryDate && new Date() > new Date(expiryDate) && !isUnlocked,
  );

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = enteredKey.trim().toUpperCase();
    if (!cleanKey) {
      setKeyError('Please enter your license / activation key');
      return;
    }

    activateKeyMutation.mutate(
      { key: cleanKey },
      {
        onSuccess: () => {
          setIsUnlocked(true);
          setKeyError('');
          setEnteredKey('');
          checkexpiration.refetch();
        },
        onError: (err: any) => {
          if (storedKey && cleanKey === storedKey.trim().toUpperCase()) {
            setIsUnlocked(true);
            setKeyError('');
            toast.success('License verified successfully!');
            checkexpiration.refetch();
          } else {
            const errorMsg =
              err?.message ||
              'Invalid key. Please contact your admin for a valid renewal key.';
            setKeyError(errorMsg);
          }
        },
      },
    );
  };

  const deleteClient = useDeleteBill();
  const [isLoading, setIsLoading] = useState(true);

  // Default date range based on admin week configuration
  const getCurrentWeekRange = () => {
    const { fromDate, toDate, fromStr, toStr } = getCurrentAppWeekRange();
    return {
      monday: fromDate,
      sunday: toDate,
      fromStr,
      toStr,
    };
  };

  const {
    monday: defaultMonday,
    sunday: defaultSunday,
    fromStr,
    toStr,
  } = getCurrentWeekRange();

  const [fromDate, setFromDate] = useState<Date[]>([defaultMonday]);
  const [toDate, setToDate] = useState<Date[]>([defaultSunday]);
  const [dateRange, setDateRange] = useState({
    from: fromStr,
    to: toStr,
  });

  const { data: billData, isLoading: billLoading } = useGetBill();

  const setDefaultDateRange = () => {
    const { monday, sunday, fromStr: fStr, toStr: tStr } = getCurrentWeekRange();
    setDateRange({
      from: fStr,
      to: tStr,
    });
    setFromDate([monday]);
    setToDate([sunday]);
  };

  useEffect(() => {
    setDefaultDateRange();

    const handleWeekCycleUpdate = () => {
      setDefaultDateRange();
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, []);

  // Process API data - Group items by bill
  useEffect(() => {
   

    if (billData && Array.isArray(billData)) {
      const groups: BillGroup[] = billData.map(
        (receipt: ReceiptData, index: number) => {
          const rawDate = receipt.createdAt || receipt.receiptDate;
          let formattedDate = '-';
          if (rawDate) {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0');
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const year = dateObj.getFullYear();
              let hours = dateObj.getHours();
              const minutes = String(dateObj.getMinutes()).padStart(2, '0');
              const ampm = hours >= 12 ? 'pm' : 'am';
              hours = hours % 12;
              hours = hours ? hours : 12;
              const formattedHours = String(hours).padStart(2, '0');
              formattedDate = `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
            }
          }

          // Map all items
          const items =
            receipt.receiptItems?.map((item) => ({
              itemId:
                item.itemID || (item as any).itemId || item.item?.id || '',
              sizeId:
                item.sizeID || (item as any).sizeId || item.size?.id || '',
              item: item.item?.name || 'N/A',
              size: item.size?.size || 'N/A',
              purity: item.purity || 0,
              availableQty:
                (item as any).availableQty || (item as any).quantity || 0,
              finWt: item.fineWeight || 0,
              srp: item.srp || 0,
              grossWeight: item.grossWeight || 0,
              laborRate: (item as any).laborRate || (item as any).labor || 0,
              laborType: (item as any).laborType || 'GRAM',
            })) || [];

          // Calculate totals
          const totalFinWt = items.reduce((sum, i) => sum + i.finWt, 0);
          const totalSRP = items.reduce((sum, i) => sum + i.srp, 0);

          // Join items with line breaks for display
          const displayItems = items.map((i) => i.item).join('\n');
          const displaySizes = items.map((i) => i.size).join('\n');
          const displayPurity = items
            .map((i) => formatNumberWithDecimals(i.purity) + '%')
            .join('\n');
          const displayFinWt = items
            .map((i) => formatNumberWithDecimals(i.finWt))
            .join('\n');
          const displaySRP = items
            .map((i) => {
              // Wastage as entered on the bill (grams)
              return `${formatNumberWithDecimals(i.srp)} G`;
            })
            .join('\n');

          const billNumber =
            receipt.billNumber ||
            (receipt as any).billNo ||
            `BILL-${String(index + 1).padStart(4, '0')}`;

          return {
            id: receipt.id,
            srNo: index + 1,
            dateTime: formattedDate,
            billNo: billNumber,
            clientName: receipt.client?.fullName || 'N/A',
            phoneNumber: receipt.client?.phoneNumber || 'N/A',
            receive: receipt.customerWeight || 0,
            advanceItems: Array.isArray((receipt as any).advanceItems) ? (receipt as any).advanceItems : [],
            remainingWeight: Number(receipt.remainingWeight || 0),
            totalBill:
              (receipt as any).totalBill !== undefined &&
                (receipt as any).totalBill !== null
                ? Number((receipt as any).totalBill)
                : receipt.remainingWeight || 0,
            pending:
              (receipt as any).totalBill !== undefined &&
                (receipt as any).totalBill !== null
                ? Number((receipt as any).totalBill)
                : receipt.remainingWeight || 0,
            dueBalance:
              (receipt as any).dueBalance !== undefined &&
                (receipt as any).dueBalance !== null &&
                !isNaN(Number((receipt as any).dueBalance))
                ? Number((receipt as any).dueBalance)
                : receipt.client?.due !== undefined &&
                  receipt.client?.due !== null
                  ? Number(receipt.client.due)
                  : Number(receipt.client?.openingBalance) || 0,
            type:
              (receipt.type as 'DRAFT' | 'BILL') ||
              (receipt.remainingWeight === 0 ? 'BILL' : 'DRAFT'),
            createdAt: receipt.createdAt || receipt.receiptDate,
            items: items,
            displayItems: displayItems,
            displaySizes: displaySizes,
            displayPurity: displayPurity,
            displayFinWt: displayFinWt,
            displaySRP: displaySRP,
            totalFinWt: totalFinWt,
            totalSRP: totalSRP,
          };
        },
      );

      setBillingGroups(groups);
    } else {
      setBillingGroups([]);
    }
    setIsLoading(false);
  }, [billData, billLoading]);

  // Filter entries
  const filteredGroups = billingGroups.filter((group) => {
    const matchesSearch =
      group.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.phoneNumber.includes(searchTerm) ||
      group.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.items.some((item) =>
        item.item.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesStatus = statusFilter === 'ALL' || group.type === statusFilter;

    let matchesDate = true;
    if (isTrial && !isDateFilterActive) {
      matchesDate = true;
    } else if (dateRange.from || dateRange.to) {
      const rawDate = group.createdAt || group.dateTime;
      if (rawDate) {
        const entryDate = new Date(rawDate);
        if (!isNaN(entryDate.getTime())) {
          if (dateRange.from) {
            const from = new Date(dateRange.from + 'T00:00:00');
            if (entryDate < from) matchesDate = false;
          }
          if (dateRange.to) {
            const to = new Date(dateRange.to + 'T23:59:59.999');
            if (entryDate > to) matchesDate = false;
          }
        }
      }
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Totals
  const totalFinWt = filteredGroups.reduce(
    (sum, group) => sum + group.totalFinWt,
    0,
  );
  const totalSRP = filteredGroups.reduce(
    (sum, group) => sum + group.totalSRP,
    0,
  );
  const totalReceive = filteredGroups.reduce(
    (sum, group) => sum + group.receive,
    0,
  );
  const totalPending = filteredGroups.reduce(
    (sum, group) =>
      sum +
      (group.remainingWeight !== undefined
        ? group.remainingWeight
        : group.pending),
    0,
  );

  // Print Receipt
  const handlePrintReceipt = (group: BillGroup) => {
    if (!group) return;
    const finalTotalBill = (group as any).totalBill ?? group.pending;
    printReceipt(
      {
        clientName: group.clientName,
        phoneNumber: group.phoneNumber,
        dateTime: group.dateTime,
        items: group.items,
        totalFineWt: group.totalFinWt,
        receive: group.receive,
        advanceItems: group.advanceItems,
        dueBalance: group.dueBalance,
        totalBill: finalTotalBill,
        remainingBalance: finalTotalBill,
      },
      getpdfheaderdata,
    );
  };

  // Delete Draft Bill - Open Password Modal First
  const handleDelete = (group: BillGroup) => {
    setBillToDelete(group);
    setPasswordModalOpen(true);
  };

  // Called after password is verified
  const handlePasswordVerified = () => {
    setPasswordModalOpen(false);
    setDeleteModalOpen(true);
  };

  // Confirm Delete Draft Bill
  const handleConfirmDelete = () => {
    if (!billToDelete) return;

    deleteClient.mutate(billToDelete.id, {
      onSuccess: () => {
        setBillingGroups((prev) =>
          prev.filter((e) => e.id !== billToDelete.id),
        );
        toast.success(`Bill ${billToDelete.billNo} deleted successfully`);
        setDeleteModalOpen(false);
        setBillToDelete(null);
      },
      onError: (error: any) => {
        console.error('Delete bill error:', error);
        toast.error(error?.response?.data?.message || 'Failed to delete bill');
      },
    });
  };

  const handleSendToManufacturing = (group: BillGroup) => {
    if (!group.items || group.items.length === 0) {
      toast.error('No items found in this bill');
      return;
    }

    const itemsToSend = group.items.map((item) => ({
      itemId: item.itemId || '',
      sizeId: item.sizeId || '',
      itemName: item.item,
      sizeName: item.size,
      grossWt: item.grossWeight,
      purity: item.purity,
      fine: item.finWt,
    }));

    sessionStorage.setItem(
      'manufacturing_billing_prefill',
      JSON.stringify(itemsToSend),
    );
    toast.success(
      `Sending ${itemsToSend.length} item${itemsToSend.length > 1 ? 's' : ''} to Tar Department...`,
    );
    navigate({ to: '/manufacturingprocess/process' });
  };

  const handleSelectManufacturingItem = (item: any) => {
    sessionStorage.setItem(
      'manufacturing_billing_prefill',
      JSON.stringify([
        {
          itemId: item.itemId || '',
          sizeId: item.sizeId || '',
          itemName: item.item,
          sizeName: item.size,
          grossWt: item.grossWeight,
          purity: item.purity,
          fine: item.finWt,
        },
      ]),
    );
    setShowManufacturingItemPicker(null);
    toast.success(
      `Sending ${item.item} (${item.grossWeight}g) to Tar Department...`,
    );
    navigate({ to: '/manufacturingprocess/process' });
  };

  const handleSendAllManufacturingItems = (group: BillGroup) => {
    handleSendToManufacturing(group);
    setShowManufacturingItemPicker(null);
  };

  const handleRowClick = (item: BillGroup) => {
    navigate({ to: `/billiupdate/${item.id}` });
  };

  const { columns, renderActions } = getBillingColumns(
    handlePrintReceipt,
    handleDelete,
    deleteClient.isPending,
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-4 border-[#785600] border-t-transparent"></div>
          <p className="text-[#4f4535] dark:text-slate-400">
            Loading billing entries...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Header & Add Bill Button */}
        <div className="mb-3 hidden md:mb-4 md:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PageHeader title="Billing" />
            </div>
            <GenericButton
              type="button"
              className="hidden md:inline-flex"
              onClick={() => navigate({ to: '/receipt/addreciept' })}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Add Bill</span>
            </GenericButton>
          </div>
        </div>

        {/* Summary Cards */}
        <BillingSummaryCards
          totalFinWt={totalFinWt}
          totalSRP={totalSRP}
          totalReceive={totalReceive}
          totalPending={totalPending}
        />

        {/* Search, Date Filter & Print */}
        <div className="no-scrollbar -mx-3 mb-3 flex flex-nowrap items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-visible">
          <div className="relative min-w-[170px] flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              autoComplete="off"
              data-lpignore="true"
              type="search"
              placeholder="Search client, phone, bill no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <GenericWeeklyDatePicker
              id="from-date-billing"
              placeholder="DD/MM/YYYY"
              mode="from"
              initialDates={
                dateRange.from ? [new Date(dateRange.from + 'T00:00:00')] : []
              }
              onDateChange={(dates) => {
                if (isTrial) setIsDateFilterActive(true);
                if (dates && dates.length > 0) {
                  const d = dates[0];
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  setDateRange((prev) => ({
                    ...prev,
                    from: `${year}-${month}-${day}`,
                  }));
                  setFromDate([d]);
                } else {
                  setDateRange((prev) => ({
                    ...prev,
                    from: '',
                  }));
                  setFromDate([]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />

            <GenericWeeklyDatePicker
              id="to-date-billing"
              placeholder="DD/MM/YYYY"
              mode="to"
              initialDates={
                dateRange.to ? [new Date(dateRange.to + 'T00:00:00')] : []
              }
              onDateChange={(dates) => {
                if (isTrial) setIsDateFilterActive(true);
                if (dates && dates.length > 0) {
                  const d = dates[0];
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  setDateRange((prev) => ({
                    ...prev,
                    to: `${year}-${month}-${day}`,
                  }));
                  setToDate([d]);
                } else {
                  setDateRange((prev) => ({
                    ...prev,
                    to: '',
                  }));
                  setToDate([]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'BILL' | 'DRAFT')
              }
              className="h-[38px] rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#1a1c1b] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="ALL">All Status</option>
              <option value="BILL">Bill (Completed)</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          <GenericButton
            onClick={() => {
              if (filteredGroups.length === 0) {
                toast.error('No records to print');
                return;
              }
              printBillingTableReport(
                filteredGroups,
                fromDate,
                toDate,
                getpdfheaderdata,
              );
            }}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </GenericButton>
        </div>

        {/* Phones: one card per bill */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {filteredGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d3c4af]/50 bg-white px-4 py-10 text-center text-sm text-[#4f4535] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              No billing entries found for the selected filters.
            </div>
          ) : (
            filteredGroups.map((g) => {
              const isDraft = g.type === 'DRAFT';
              const pendingWt = g.remainingWeight !== undefined ? g.remainingWeight : g.pending;
              return (
                <div
                  key={g.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(g)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRowClick(g);
                  }}
                  className="rounded-xl border border-[#d3c4af]/30 bg-white p-3 shadow-sm active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#785600] dark:text-amber-400">{g.billNo}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isDraft
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}
                        >
                          {isDraft ? 'Draft' : 'Bill'}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-sm font-semibold text-[#1a1c1b] dark:text-white">{g.clientName}</div>
                      <div className="text-xs text-[#817563] dark:text-slate-400">
                        {g.phoneNumber} · {g.dateTime}
                      </div>
                    </div>
                    <div className="-mr-1 shrink-0">{renderActions(g, 0)}</div>
                  </div>
                  <div className="mt-2 truncate text-xs text-[#4f4535] dark:text-slate-300">
                    {g.items.map((i) => i.item).filter(Boolean).join(', ') || '-'}
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5 rounded-lg bg-[#f9f9f7] p-2 text-center dark:bg-slate-800">
                    {[
                      ['Fine', g.totalFinWt],
                      ['Wastage', g.totalSRP],
                      ['Receive', g.receive],
                      ['Pending', pendingWt],
                    ].map(([label, v]) => (
                      <div key={label as string} className="min-w-0">
                        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#817563] dark:text-slate-400">{label}</div>
                        <div className="font-mono truncate text-xs font-bold text-[#1a1c1b] dark:text-white">
                          {formatNumberWithDecimals(Number(v) || 0)} G
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tablet / desktop table */}
        <div className="hidden md:block">
        <GenericTable<BillGroup>
          data={filteredGroups}
          columns={columns}
          onSave={(item) => console.log('Save:', item)}
          emptyMessage="No billing entries found for the selected filters."
          isLoading={false}
          renderActions={renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
          onRowClick={handleRowClick}
        />
        </div>

        {/* Subscription Expired Modal */}
        <BillingSubscriptionModal
          isExpired={isExpired}
          profileData={profileData}
          expiryDate={expiryDate}
          enteredKey={enteredKey}
          setEnteredKey={setEnteredKey}
          keyError={keyError}
          setKeyError={setKeyError}
          handleKeySubmit={handleKeySubmit}
          isPending={activateKeyMutation.isPending}
        />

        {/* Manufacturing Item Picker Modal */}
        <ManufacturingItemPickerModal
          showManufacturingItemPicker={showManufacturingItemPicker}
          onClose={() => setShowManufacturingItemPicker(null)}
          onSelectItem={handleSelectManufacturingItem}
          onSendAll={handleSendAllManufacturingItems}
        />

        {/* Password Verification Modal before Delete */}
        <PasswordConfirmModal
          isOpen={passwordModalOpen}
          onClose={() => {
            setPasswordModalOpen(false);
            setBillToDelete(null);
          }}
          onSuccess={handlePasswordVerified}
          title="Admin Password Required"
          Description={`Please enter admin password to delete bill ${billToDelete?.billNo || ''}`}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setBillToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Bill"
          itemIdentifier={billToDelete?.billNo}
          isLoading={deleteClient.isPending}
        />
      </div>
    </div>
  );
};

export default Billing;
