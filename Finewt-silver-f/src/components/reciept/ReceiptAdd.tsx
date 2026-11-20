import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Loader2, FileText, Save } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetClients } from '@/lib/api/client';
import { useGetItems } from '@/lib/api/items';
import { useGetSizes } from '@/lib/api/sizes';
import { useGetStock } from '@/lib/api/stock';
import { Barcode128 } from '@/components/common/Barcode128';
import toast from 'react-hot-toast';
import { useGetQuantity, useBill } from '@/lib/api/bill';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { printReceipt } from '@/utils/printReceipt';
import AddClientModal from '@/components/Client/AddClientModal';
import { AdvanceItem } from '@/components/erp/billing/BillPaymentSummary';

import {
  ReceiptItem,
  ReceiptFormData,
  calculateFineWeight,
  calculateSrpFineWeight,
  updateTotalFine,
  getClientDueBalance,
} from '@/components/erp/billing/billFormTypes';
import BillClientHeader from '@/components/erp/billing/BillClientHeader';
import BillItemsTable from '@/components/erp/billing/BillItemsTable';
import BillPaymentSummary from '@/components/erp/billing/BillPaymentSummary';
import StockErrorModal from '@/components/erp/billing/StockErrorModal';

const ReceiptAdd: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReceiptFormData>({
    clientId: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    customerWeight: 0,
    totalFine: 0,
    goldInfo: {
      karat: '22K',
      rate: 0,
      weight: 0,
      totalAmount: 0,
    },
  });
  const [showClientModal, setShowClientModal] = useState(false);
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState<'draft' | 'bill' | null>(
    null,
  );
  const isSubmittingRef = useRef(false);

  // Advance table state – default single silver item row
  const [advanceItems, setAdvanceItems] = useState<AdvanceItem[]>([
    { srNo: 1, item: 'Silver Chock', purity: '', grossWt: '', fineWt: 0 },
  ]);

  // Refs for debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data from API
  const { data: clients = [], refetch: refetchClients } = useGetClients();
  const { data: rawItems = [] } = useGetItems();
  const items = useMemo(
    () =>
      (Array.isArray(rawItems) ? rawItems : []).filter((item: any) => {
        const name = item?.name?.trim().toLowerCase() || '';
        return name !== 'gold';
      }),
    [rawItems],
  );
  const { data: sizes = [] } = useGetSizes();

  const getpdfheaderdata = useGetHeader();
  const getQuantity = useGetQuantity();
  const savebill = useBill();

  const { getScaleProps } = useTableScaleFocus<keyof ReceiptItem>(
    (index, field, weight) => {
      handleItemChange(index, field, weight);
    },
  );

  // Separate scale hook for the Advance table (Gross Wt column)
  const { getScaleProps: getAdvanceScaleProps } = useTableScaleFocus<string>(
    (index, _field, weight) => {
      handleAdvanceItemChange(
        index,
        'grossWt',
        String(Math.round(weight * 1000) / 1000),
      );
    },
  );

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      srNo: formData.items.length + 1,
      item: '',
      size: '',
      purity: '',
      availableQty: '',
      grossWt: '',
      wastage: '',
      srp: '',
      fineWt: 0,
      laborRate: '',
      isLoadingQty: false,
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }

    const updatedItems = formData.items.filter((_, i) => i !== index);
    updatedItems.forEach((item, idx) => {
      item.srNo = idx + 1;
    });
    setFormData({
      ...formData,
      items: updatedItems,
    });
    toast.success('Item removed');
  };

  const fetchQuantity = async (
    index: number,
    item: string,
    size: string,
    purity: number,
  ) => {
    if (!item || !purity || purity <= 0) {
      return;
    }

    const selectedItem = items.find((i: any) => i.name === item);
    // Billing has no size: stock of every size for this item/purity counts
    const selectedSize = size ? sizes.find((s: any) => s.size === size) : undefined;

    if (!selectedItem) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((entry, i) =>
        i === index ? { ...entry, isLoadingQty: true } : entry,
      ),
    }));

    try {
      const response = await getQuantity.mutateAsync({
        customerId: formData.clientId,
        itemId: selectedItem.id,
        sizeId: selectedSize?.id,
        purity: purity,
      });

      let weight = 0;
      if (
        response?.data?.weight !== undefined &&
        response.data.weight !== null
      ) {
        weight = Number(response.data.weight);
      } else if (response?.weight !== undefined && response.weight !== null) {
        weight = Number(response.weight);
      } else if (
        response?.data?.quantity !== undefined &&
        response.data.quantity !== null
      ) {
        weight = Number(response.data.quantity);
      } else if (
        response?.quantity !== undefined &&
        response.quantity !== null
      ) {
        weight = Number(response.quantity);
      }

      let srpVal: string | number = '';
      if (
        response?.data?.srp !== undefined &&
        response.data.srp !== null
      ) {
        srpVal = response.data.srp;
      } else if (response?.srp !== undefined && response.srp !== null) {
        srpVal = response.srp;
      }

      setFormData((prev) => {
        const updatedItems = prev.items.map((entry, i) => {
          if (i === index) {
            const newSrp =
              entry.srp !== undefined && entry.srp !== null && entry.srp !== ''
                ? entry.srp
                : srpVal !== ''
                  ? String(srpVal)
                  : '';
            const grossWtNum = Number(entry.grossWt) || 0;
            const srpNum = Number(newSrp) || 0;
            const fineWt = calculateFineWeight(purity, grossWtNum, srpNum);
            return {
              ...entry,
              availableQty:
                !isNaN(weight) && weight >= 0 ? weight : entry.availableQty,
              srp: newSrp,
              fineWt: Math.round(fineWt * 1000) / 1000,
              isLoadingQty: false,
            };
          }
          return entry;
        });

        return {
          ...prev,
          items: updatedItems,
          totalFine: updateTotalFine(updatedItems),
        };
      });
    } catch (error: any) {
      console.error('Error fetching quantity:', error);
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((entry, i) =>
          i === index ? { ...entry, isLoadingQty: false } : entry,
        ),
      }));
    }
  };

  // Stock rows (Opening Stock / Inward) used to fill design, stamp, purity and available qty
  const { data: rawStock = [] } = useGetStock();
  const stockList: any[] = useMemo(
    () =>
      Array.isArray(rawStock)
        ? rawStock
        : Array.isArray((rawStock as any)?.data)
          ? (rawStock as any).data
          : [],
    [rawStock],
  );
  const findStockRow = (itemName: string, purity?: number) => {
    const itemObj = items.find((i: any) => i.name === itemName);
    if (!itemObj) return null;
    const rows = stockList.filter((st: any) => st.itemId === itemObj.id);
    if (purity !== undefined && purity > 0) {
      return rows.find((st: any) => Math.abs(Number(st.purity ?? 100) - purity) < 0.001) || null;
    }
    return rows.find((st: any) => Number(st.weight) > 0) || rows[0] || null;
  };

  // Scan a product barcode (PRD-XXXXXXXX from the Stocks page) to fill a bill row
  const [scanCode, setScanCode] = useState('');
  const [showScanList, setShowScanList] = useState(false);
  const scanBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (scanBoxRef.current && !scanBoxRef.current.contains(e.target as Node)) setShowScanList(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  // Products in stock (with weight), searchable by code, item, design, stamp or purity
  const scanOptions = useMemo(() => {
    const q = scanCode.trim().toLowerCase();
    return stockList
      // Loose stock has no product ID: bill it by choosing the item in the row
      .filter((st: any) => Number(st.weight) > 0 && st.kind !== 'LOOSE')
      .map((st: any) => {
        const itemName = items.find((i: any) => i.id === st.itemId)?.name || '';
        const code = /^[0-9a-f-]{36}$/i.test(String(st.id))
          ? `PRD-${String(st.id).slice(0, 8).toUpperCase()}`
          : String(st.id);
        return { st, code, itemName };
      })
      .filter(({ st, code, itemName }: any) =>
        !q
          ? true
          : [code, itemName, st.design, st.stamp, String(st.purity ?? 100)]
              .filter(Boolean)
              .some((v: string) => String(v).toLowerCase().includes(q)),
      )
      .slice(0, 30);
  }, [scanCode, stockList, items]);
  const [lastGenerated, setLastGenerated] = useState<{ code: string; label: string } | null>(null);
  const handleScanProduct = (raw: string) => {
    const code = raw.trim().toLowerCase().replace(/^prd-/, '');
    if (!code) return;
    const stockRow = stockList.find(
      (st: any) => st.kind !== 'LOOSE' && String(st.id).toLowerCase().startsWith(code),
    );
    if (!stockRow) {
      toast.error(`No stock found for ${raw.trim()}`);
      return;
    }
    const itemObj = items.find((i: any) => i.id === stockRow.itemId);
    const filled: any = {
      productCodeSource: 'stock',
      productCode: /^[0-9a-f-]{36}$/i.test(String(stockRow.id))
        ? `PRD-${String(stockRow.id).slice(0, 8).toUpperCase()}`
        : String(stockRow.id),
      item: itemObj?.name || '',
      design: stockRow.design || '',
      stamp: stockRow.stamp || '',
      purity: String(stockRow.purity ?? 100),
      availableQty: Math.round((Number(stockRow.weight) || 0) * 1000) / 1000,
    };
    setFormData((prev) => {
      const emptyIndex = prev.items.findIndex((r: any) => !r.item);
      const list =
        emptyIndex >= 0
          ? prev.items.map((r, i) => (i === emptyIndex ? { ...r, ...filled } : r))
          : [
              ...prev.items,
              {
                id: `item-${Date.now()}`,
                srNo: prev.items.length + 1,
                size: '',
                grossWt: '',
                wastage: '',
                srp: '',
                fineWt: 0,
                laborRate: '',
                isLoadingQty: false,
                ...filled,
              } as ReceiptItem,
            ];
      return { ...prev, items: list };
    });
    setLastGenerated({ code: filled.productCode, label: [filled.item, filled.design, filled.stamp].filter(Boolean).join(' · ') });
    toast.success(`Added ${filled.item}${filled.design ? ` (${filled.design})` : ''}`);
    setScanCode('');
  };

  // Custom product (not from stock): give the newest row without an ID a new product ID
  const handleGenerateProductId = () => {
    const rows = formData.items;
    let index = -1;
    // Newest row with an item that was not scanned from stock (stock rows keep their stock code)
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].item && (rows[i] as any).productCodeSource !== 'stock') {
        index = i;
        break;
      }
    }
    if (index < 0) {
      toast.error(
        rows.some((r) => r.item)
          ? 'Scanned stock items already have their product code. Add a custom item row first.'
          : 'Select an item in a row first, then generate its ID.',
      );
      return;
    }
    const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const code = `PRD-${hex}`;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((r, i) =>
        i === index ? ({ ...r, productCode: code, productCodeSource: 'generated' } as any) : r,
      ),
    }));
    setLastGenerated({ code, label: `${rows[index].item || 'Custom product'} (row ${index + 1})` });
    toast.success(`Product ID ${code} generated for row ${index + 1}`);
  };

  const handleItemChange = (
    index: number,
    field: keyof ReceiptItem,
    value: any,
  ) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];

    if (
      field === 'grossWt' ||
      field === 'availableQty' ||
      field === 'purity' ||
      field === 'srp' ||
      field === 'laborRate' ||
      field === 'wastage'
    ) {
      const strValue =
        value === null || value === undefined ? '' : String(value);
      if (strValue.includes('.')) {
        const decimalPlaces = strValue.split('.')[1]?.length || 0;
        if (decimalPlaces > 3) {
          toast.error(`${field} can have maximum 3 decimal places`);
          return;
        }
      }
      updatedItems[index] = {
        ...item,
        [field]: strValue,
      };
    } else {
      updatedItems[index] = {
        ...item,
        [field]: value,
      };
    }

    // Fill design, stamp, purity and available qty from Stock
    if (field === 'item' || field === 'purity') {
      const row = updatedItems[index] as any;
      const purityNum = field === 'purity' ? Number(row.purity) || 0 : undefined;
      const stockRow = findStockRow(row.item, purityNum);
      if (stockRow) {
        const stockPurity = stockRow.purity ?? 100;
        updatedItems[index] = {
          ...row,
          design: row.design || stockRow.design || '',
          stamp: row.stamp || stockRow.stamp || '',
          ...(field === 'item' ? { purity: String(stockPurity) } : {}),
          availableQty: Math.round((Number(stockRow.weight) || 0) * 1000) / 1000,
        };
      } else {
        updatedItems[index] = { ...row, availableQty: 0 };
      }
    }

    // Recalculate fine weight for the changed item
    const currentItem = updatedItems[index];
    if (field === 'item') {
      const purity = Number(currentItem.purity) || 0;
      currentItem.fineWt = calculateFineWeight(
        purity,
        Number(currentItem.grossWt) || 0,
        Number(currentItem.srp) || 0,
      );
    }
    if (field === 'purity' || field === 'grossWt' || field === 'srp') {
      const purity = Number(currentItem.purity) || 0;
      const grossWt = Number(currentItem.grossWt) || 0;
      const srp = Number(currentItem.srp) || 0;

      currentItem.fineWt = calculateFineWeight(purity, grossWt, srp);
    }

    // Update total fine
    const newTotalFine = updateTotalFine(updatedItems);

    setFormData({
      ...formData,
      items: updatedItems,
      totalFine: newTotalFine,
    });

    // Fetch quantity if purity, item, or size changed
    if (field === 'purity' || field === 'item' || field === 'size') {
      const currentItem = updatedItems[index];
      const purityNum = Number(currentItem.purity) || 0;
      if (currentItem.item && purityNum > 0) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          fetchQuantity(index, currentItem.item, currentItem.size, purityNum);
        }, 300);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleAdvanceItemChange = (
    index: number,
    field: 'item' | 'purity' | 'grossWt' | 'fineWt',
    value: string,
  ) => {
    setAdvanceItems((prev) => {
      const updated = prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: value };

        // Only recalculate fineWt if purity or grossWt changed
        if (field === 'purity' || field === 'grossWt') {
          const purity = Number(next.purity) || 0;
          const grossWt = Number(next.grossWt) || 0;
          next.fineWt =
            String(Math.round((purity / 100) * grossWt * 1000) / 1000);
        }
        return next;
      });
      return updated;
    });
  };

  /* ── NEW: Add advance row ── */
  const handleAddAdvanceItem = () => {
    setAdvanceItems((prev) => [
      ...prev,
      {
        srNo: prev.length + 1,
        item: '',
        purity: '',
        grossWt: '',
        fineWt: '',
      },
    ]);
  };

  /* ── NEW: Remove advance row + renumber ── */
  const handleRemoveAdvanceItem = (index: number) => {
    setAdvanceItems((prev) => {
      if (prev.length <= 1) {
        toast.error('At least one advance row is required');
        return prev;
      }
      return prev
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, srNo: i + 1 }));
    });
  };

  // Initialize with one empty item if empty
  useEffect(() => {
    if (formData.items.length === 0) {
      handleAddItem();
    }
  }, []);

  const validateAllItems = (): boolean => {
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.item) {
        toast.error(`Please select item for row ${i + 1}`);
        return false;
      }
      if (!item.purity || Number(item.purity) <= 0) {
        toast.error(`Please enter valid purity for row ${i + 1}`);
        return false;
      }
      if (!item.grossWt || Number(item.grossWt) <= 0) {
        toast.error(`Please enter valid gross weight for row ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  // Advance field = fine total of the Advance table (when the table has values)
  const advanceTableSum = useMemo(
    () =>
      Math.round(
        advanceItems.reduce((s, r) => s + (Number(r.fineWt) || 0), 0) * 1000,
      ) / 1000,
    [advanceItems],
  );
  const prevAdvanceSum = useRef(0);
  useEffect(() => {
    if (advanceTableSum > 0 || prevAdvanceSum.current > 0) {
      setFormData((prev: any) => ({
        ...prev,
        customerWeight: advanceTableSum > 0 ? String(advanceTableSum) : '',
      }));
    }
    prevAdvanceSum.current = advanceTableSum;
  }, [advanceTableSum]);

  // Advance rows sent with the bill
  const advancePayload = () =>
    advanceItems
      .filter((r) => Number(r.grossWt) > 0 || Number(r.fineWt) > 0)
      .map((r) => ({
        item: r.item || '',
        purity: Number(r.purity) || 0,
        grossWt: Number(r.grossWt) || 0,
        fineWt: Number(r.fineWt) || 0,
      }));

  const handleCustomerWeightChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    if (value.includes('-')) return;
    if (Number(value) < 0) return;
    setFormData((prev) => ({ ...prev, customerWeight: value }));
  };

  const handleTotalFineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, totalFine: value }));
  };

  const calculateTotalGrossWt = () => {
    return formData.items.reduce(
      (total, item) => total + (Number(item.grossWt) || 0),
      0,
    );
  };

  const calculateRemainingWeight = () => {
    const client = clients.find((c: any) => c.id === formData.clientId);
    const dueBalance = getClientDueBalance(client);
    const advance = Number(formData.customerWeight) || 0;
    const totalFineWeight =
      formData.totalFine !== undefined && formData.totalFine !== ''
        ? Number(formData.totalFine) || 0
        : formData.items.reduce(
          (sum, item) => sum + (Number(item.fineWt) || 0),
          0,
        );
    // Remaining Balance = Total Fine Wt + Due Balance - Advance
    const remaining = totalFineWeight + dueBalance - advance;
    return Math.round(remaining * 1000) / 1000;
  };

  const handlePrintReceipt = (responseData?: any) => {
    const client = clients.find((c: any) => c.id === formData.clientId);
    const resolvedBill = responseData?.data || responseData || {};

    const rawDue = resolvedBill.dueBalance;
    const clientDue =
      rawDue !== undefined && rawDue !== null && !isNaN(Number(rawDue))
        ? Number(rawDue)
        : getClientDueBalance(client);

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours() % 12 || 12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'pm' : 'am'}`;

    const advance =
      Number(
        resolvedBill.customerWeight ??
        resolvedBill.receive ??
        formData.customerWeight,
      ) || 0;

    const resolvedTotalBill =
      resolvedBill.totalBill !== undefined &&
        resolvedBill.totalBill !== null &&
        !isNaN(Number(resolvedBill.totalBill))
        ? Number(resolvedBill.totalBill)
        : Number(
          resolvedBill.remainingBalance ??
          resolvedBill.remainingWeight ??
          resolvedBill.pending ??
          calculateRemainingWeight(),
        ) || 0;

    const itemsList =
      Array.isArray(resolvedBill.items) &&
        resolvedBill.items.length > 0 &&
        (resolvedBill.items[0]?.item || resolvedBill.items[0]?.itemName)
        ? resolvedBill.items.map((i: any) => ({
          item: i.item || i.itemName || '-',
          size: i.size || '-',
          purity: Number(i.purity) || 0,
          grossWeight: Number(i.grossWeight ?? i.grossWt ?? 0),
          srp: Number(i.srp || 0),
          finWt: Number(i.fineWeight ?? i.fineWt ?? i.finWt ?? 0),
          laborRate: Number(i.laborRate || 0),
          laborType: i.laborType,
        }))
        : formData.items.map((item) => ({
          item: item.item || '-',
          size: item.size || '-',
          purity: Number(item.purity) || 0,
          grossWeight: Number(item.grossWt) || 0,
          srp: Number(item.srp) || 0,
          finWt: Number(item.fineWt) || 0,
          laborRate: Number(item.laborRate) || 0,
          laborType: (item as any).laborType === 'AMOUNT' ? 'AMOUNT' : 'GRAM',
          design: (item as any).design || undefined,
          stamp: (item as any).stamp || (item as any)['Stamp (शिक्का)'] || undefined,
          productCode: (item as any).productCode || undefined,
        }));

    const totalFineWt =
      Number(resolvedBill.totalFineWt ?? resolvedBill.totalFinWt) ||
      itemsList.reduce(
        (sum: number, i: any) => sum + (Number(i.finWt) || 0),
        0,
      );

    printReceipt(
      {
        clientName:
          resolvedBill.clientName ||
          formData.clientName ||
          client?.fullName ||
          'N/A',
        phoneNumber: resolvedBill.phoneNumber || client?.phoneNumber || 'N/A',
        dateTime: resolvedBill.dateTime || dateStr,
        items: itemsList,
        totalFineWt,
        receive: advance,
        advanceItems: advancePayload(),
        dueBalance: clientDue,
        totalBill: resolvedTotalBill,
        remainingBalance: resolvedTotalBill,
      },
      getpdfheaderdata,
    );
  };

  // Save as Draft
  const handleSaveAsDraft = async () => {
    if (isSubmittingRef.current || savebill.isPending) {
      return;
    }

    if (!formData.clientId || !formData.clientName) {
      toast.error('Please select a client');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmittingType('draft');

    try {
      const selectedClientObj = clients.find(
        (client: any) => client.id === formData.clientId,
      );
      const clientDue = getClientDueBalance(selectedClientObj);
      const totalGrossWt = calculateTotalGrossWt();
      const remainingWeight = calculateRemainingWeight();

      const billData = {
        clientId: formData.clientId,
        receiptDate: formData.date,
        items: formData.items.map((item) => ({
          itemId: items.find((i: any) => i.name === item.item)?.id,
          itemName: item.item,
          sizeId: sizes.find((s: any) => s.size === item.size)?.id,
          size: item.size,
          purity: Number(item.purity) || 0,
          availableQty: Number(item.availableQty) || 0,
          grossWeight: Number(Number(item.grossWt || 0).toFixed(3)),
          srp: calculateSrpFineWeight(
            Number(item.grossWt || 0),
            Number(item.srp || 0),
          ),
          fineWeight: Number(Number(item.fineWt || 0).toFixed(3)),
          laborRate: Number(item.laborRate) || 0,
          laborType: (item as any).laborType === 'AMOUNT' ? 'AMOUNT' : 'GRAM',
          design: (item as any).design || undefined,
          stamp: (item as any).stamp || (item as any)['Stamp (शिक्का)'] || undefined,
          productCode: (item as any).productCode || undefined,
        })),
        customerWeight: Number(Number(formData.customerWeight || 0).toFixed(3)),
        advanceItems: advancePayload(),
        dueBalance: Number(Number(clientDue || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        remainingBalance: Number(Number(remainingWeight || 0).toFixed(3)),
        totalBill: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'DRAFT',
      };

      await savebill.mutateAsync(billData);
      navigate({ to: '/billing' });
    } catch (error) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmittingType(null);
      console.error('Error saving draft:', error);
    }
  };

  // Save as Completed Bill
  const handleSaveReceipt = async () => {
    if (isSubmittingRef.current || savebill.isPending) {
      return;
    }

    if (!formData.clientId || !formData.clientName) {
      toast.error('Please select a client');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!validateAllItems()) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmittingType('bill');

    try {
      const selectedClientObj = clients.find(
        (client: any) => client.id === formData.clientId,
      );
      const clientDue = getClientDueBalance(selectedClientObj);
      const totalGrossWt = calculateTotalGrossWt();
      const remainingWeight = calculateRemainingWeight();

      const billData = {
        clientId: formData.clientId,
        receiptDate: formData.date,
        items: formData.items.map((item) => ({
          itemId: items.find((i: any) => i.name === item.item)?.id,
          itemName: item.item,
          sizeId: sizes.find((s: any) => s.size === item.size)?.id,
          size: item.size,
          purity: Number(item.purity) || 0,
          availableQty: Number(item.availableQty) || 0,
          grossWeight: Number(Number(item.grossWt || 0).toFixed(3)),
          srp: calculateSrpFineWeight(
            Number(item.grossWt || 0),
            Number(item.srp || 0),
          ),
          fineWeight: Number(Number(item.fineWt || 0).toFixed(3)),
          laborRate: Number(item.laborRate) || 0,
          laborType: (item as any).laborType === 'AMOUNT' ? 'AMOUNT' : 'GRAM',
          design: (item as any).design || undefined,
          stamp: (item as any).stamp || (item as any)['Stamp (शिक्का)'] || undefined,
          productCode: (item as any).productCode || undefined,
        })),
        customerWeight: Number(Number(formData.customerWeight || 0).toFixed(3)),
        advanceItems: advancePayload(),
        dueBalance: Number(Number(clientDue || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        remainingBalance: Number(Number(remainingWeight || 0).toFixed(3)),
        totalBill: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'BILL',
      };

      const response = await savebill.mutateAsync(billData);
      const savedData = response?.data || response || billData;

      setTimeout(() => {
        handlePrintReceipt(savedData);
      }, 500);

      setTimeout(() => {
        navigate({ to: '/billing' });
      }, 1500);
    } catch (error: any) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      setSubmittingType(null);
      console.error('Error saving receipt:', error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        '';

      if (
        typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('insufficient stock')
      ) {
        setShowStockErrorModal(true);
      }
    }
  };

  const selectedClientObj = clients.find(
    (client: any) => client.id === formData.clientId,
  );
  const clientDue = getClientDueBalance(selectedClientObj);
  const remainingBalance = calculateRemainingWeight();

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/billing' })}
              className="flex flex-shrink-0 items-center gap-2 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <PageHeader
              title="Create Bill"
              subtitle="Add items and generate bill"
            />
          </div>
        </div>

        {/* Client Selection Header */}
        <BillClientHeader
          rightSlot={
            <>
              <label className="mb-1.5 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                Scan Product
              </label>
              <div className="flex items-start gap-2">
              <div ref={scanBoxRef} className="relative flex-1">
                <input
              autoComplete="off"
              data-lpignore="true"
                  type="search"
                  value={scanCode}
                  onChange={(e) => {
                    setScanCode(e.target.value);
                    setShowScanList(true);
                  }}
                  onFocus={() => setShowScanList(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleScanProduct(scanCode);
                      setShowScanList(false);
                    }
                  }}
                  placeholder="Scan barcode or search product (code, item, design, stamp)"
                  className="h-8 w-full rounded-md border border-[#d3c4af]/30 bg-white px-2 py-1 font-mono text-sm text-[#1a1c1b] outline-none placeholder:text-[#817563] hover:border-[#785600]/50 focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {showScanList && (
                  <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[#d3c4af]/40 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {scanOptions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[#817563]">No products in stock match.</div>
                    ) : (
                      scanOptions.map(({ st, code, itemName }: any) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            handleScanProduct(code);
                            setShowScanList(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 border-b border-[#d3c4af]/20 px-4 py-2.5 text-left text-sm hover:bg-[#785600]/5 dark:border-slate-800 dark:hover:bg-slate-800"
                        >
                          <span className="min-w-0">
                            <span className="block font-semibold text-[#1a1c1b] dark:text-white">
                              {itemName || '-'}
                              {st.design ? ` · ${st.design}` : ''}
                              {st.stamp ? ` · ${st.stamp}` : ''}
                            </span>
                            <span className="block font-mono text-[11px] text-[#785600]">{code}</span>
                          </span>
                          <span className="shrink-0 text-right font-mono text-xs text-[#4f4535] dark:text-slate-300">
                            {Number(st.purity ?? 100)}% · {Math.round(Number(st.weight) * 1000) / 1000} G
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleGenerateProductId}
                title="Generate a product ID for a custom product row"
                className="shrink-0 rounded-md bg-gradient-to-br from-[#785600] to-[#986d00] font-bold text-white shadow-sm hover:opacity-90 h-9 px-4 text-xs sm:text-[13px]"
              >
                Generate ID
              </button>
              </div>
              {lastGenerated && (
                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-md border border-[#d3c4af]/30 bg-white px-3 py-2 text-xs text-[#4f4535] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Barcode128 value={lastGenerated.code} height={32} />
                  <span className="font-semibold text-[#1a1c1b] dark:text-white">{lastGenerated.label}</span>
                </div>
              )}
            </>
          }
          clients={clients as any[]}
          selectedClientId={formData.clientId}
          onSelectClient={(client: any) => {
            setFormData((prev) => ({
              ...prev,
              clientId: client.id,
              clientName: client.fullName || client.fullname || '',
            }));
          }}
          onClearClient={() => {
            setFormData((prev) => ({
              ...prev,
              clientId: '',
              clientName: '',
            }));
          }}
          onAddNewClient={() => setShowClientModal(true)}
        />

        {/* Items Table Section */}
        <BillItemsTable
          items={formData.items}
          availableItems={items}
          availableSizes={sizes}
          onItemChange={handleItemChange}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          getScaleProps={getScaleProps}
        />

        {/* Payment Summary */}
        <BillPaymentSummary
          totalFine={formData.totalFine}
          customerWeight={formData.customerWeight}
          dueBalance={clientDue}
          totalBill={remainingBalance}
          remainingBalance={remainingBalance}
          onCustomerWeightChange={handleCustomerWeightChange}
          onTotalFineChange={handleTotalFineChange}
          advanceItems={advanceItems}
          availableItems={items}
          onAdvanceItemChange={handleAdvanceItemChange}
          getAdvanceScaleProps={getAdvanceScaleProps}
          onAddAdvanceItem={handleAddAdvanceItem}
          onRemoveAdvanceItem={handleRemoveAdvanceItem}
        />

        {/* Action Buttons */}
        <div className="sticky bottom-16 z-20 border-t border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-2.5 md:bottom-0 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex flex-row justify-end gap-2 [&>*]:flex-1 md:[&>*]:flex-none">
            <GenericButton
              type="button"
              onClick={handleSaveAsDraft}
              disabled={submittingType === 'draft'}
              variant="secondary"
            >
              {submittingType === 'draft' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              {submittingType === 'draft' ? 'Saving...' : 'Save as Draft'}
            </GenericButton>

            <GenericButton
              type="button"
              onClick={handleSaveReceipt}
              disabled={submittingType === 'bill'}
            >
              {submittingType === 'bill' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {submittingType === 'bill' ? 'Saving...' : 'Save & Print Bill'}
            </GenericButton>
          </div>
        </div>
      </div>

      {/* Insufficient Stock Modal */}
      <StockErrorModal
        isOpen={showStockErrorModal}
        onClose={() => setShowStockErrorModal(false)}
        onSaveAsDraft={() => {
          setShowStockErrorModal(false);
          void handleSaveAsDraft();
        }}
        isSubmitting={isSubmitting || savebill.isPending}
      />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSuccess={async () => {
          const refetched = await refetchClients();
          const allClients = (refetched?.data as any[]) || [];
          if (allClients.length > 0) {
            const lastClient = allClients[allClients.length - 1];
            if (lastClient) {
              setFormData((prev) => ({
                ...prev,
                clientId: lastClient.id,
                clientName: lastClient.fullName || lastClient.fullname || '',
              }));
            }
          }
        }}
      />
    </div>
  );
};

export default ReceiptAdd;