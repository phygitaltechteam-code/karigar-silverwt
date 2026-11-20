import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Loader2, FileText, Save, Printer } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import PageHeader from '@/components/Forms/Common/PageHeader';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetClients } from '@/lib/api/client';
import { useGetItems } from '@/lib/api/items';
import { useGetStock } from '@/lib/api/stock';
import { useGetSizes } from '@/lib/api/sizes';
import toast from 'react-hot-toast';
import { useGetQuantity, useGetBillByid, useBillUpdate } from '@/lib/api/bill';
import { Route } from '@/routes/_app/billiupdate.$id';
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
import { Barcode128 } from '@/components/common/Barcode128';
import BillPaymentSummary from '@/components/erp/billing/BillPaymentSummary';
import StockErrorModal from '@/components/erp/billing/StockErrorModal';

const BillEdit: React.FC = () => {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);

  const [formData, setFormData] = useState<ReceiptFormData>({
    clientId: '',
    clientName: '',
    remainingWeight: 0,
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
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [billType, setBillType] = useState<'DRAFT' | 'BILL'>('DRAFT');
  const [billNo, setBillNo] = useState<string>('');
  const [savedRemaining, setSavedRemaining] = useState<number | null>(null);
  const [savedAdvance, setSavedAdvance] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState<'draft' | 'bill' | null>(
    null,
  );
  const isSubmittingRef = useRef(false);

  // Advance table state – default single silver item row
  const [advanceItems, setAdvanceItems] = useState<AdvanceItem[]>([
    { srNo: 1, item: 'Silver Chock', purity: '', grossWt: '', fineWt: '' },
  ]);

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
  const { data: billResponse, isLoading: isBillLoading } = useGetBillByid(id);

  // API hooks
  const getpdfheaderdata = useGetHeader();
  const getQuantity = useGetQuantity();
  const updateBill = useBillUpdate();

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<keyof ReceiptItem>(
    (index, field, weight) => {
      handleItemChange(index, field, weight);
    },
  );

  // Separate scale hook for the Advance table (Gross Wt column)
  const { getScaleProps: getAdvanceScaleProps } = useTableScaleFocus<string>(
    (index, _field, weight) => {
      handleAdvanceItemChange(index, 'grossWt', String(Math.round(weight * 1000) / 1000));
    },
  );

  // Refs for debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialStockFetchedRef = useRef(false);
  const loadedBillIdRef = useRef<string | null>(null);

  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: `item-${Date.now()}`,
      srNo: formData.items.length + 1,
      item: '',
      size: '',
      design: '',
      Stamp: '',
      purity: '',
      availableQty: '',
      grossWt: '',
      wastage: '',
      srp: '',
      fineWt: 0,
      laborRate: '',
      isLoadingQty: false,
      itemId: '',
      sizeId: '',
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  useEffect(() => {
    if (!billResponse) return;

    let billData = billResponse;
    if (billResponse.data && typeof billResponse.data === 'object') {
      billData = billResponse.data;
    }
    if (billResponse.bill && typeof billResponse.bill === 'object') {
      billData = billResponse.bill;
    }

    if (!billData || !billData.id) {
      if (formData.items.length === 0) {
        handleAddItem();
      }
      return;
    }

    if (loadedBillIdRef.current === billData.id && isDataLoaded) {
      return;
    }
    loadedBillIdRef.current = billData.id;
    initialStockFetchedRef.current = false;

    const receiptItems =
      billData.receiptItems || billData.items || billData.billItems || [];

    let itemsList: ReceiptItem[] = [];
    if (receiptItems.length > 0) {
      itemsList = receiptItems.map((item: any, index: number) => {
        const purity =
          item.purity !== undefined && item.purity !== null ? item.purity : '';
        const grossWt =
          item.grossWeight !== undefined && item.grossWeight !== null
            ? item.grossWeight
            : item.grossWt !== undefined && item.grossWt !== null
              ? item.grossWt
              : '';
        const rawSrp =
          item.srp !== undefined && item.srp !== null ? item.srp : '';
        const laborRate =
          item.laborRate !== undefined && item.laborRate !== null
            ? item.laborRate
            : '';

        const grossWtNum = Number(grossWt) || 0;
        // Wastage is stored and entered in grams
        const srp = rawSrp;
        void grossWtNum;

        let fineWt = item.fineWeight ?? item.fineWt ?? item.finWt;
        if (
          fineWt === undefined ||
          fineWt === null ||
          fineWt === 0 ||
          fineWt === ''
        ) {
          const p = Number(purity) || 0;
          const g = Number(grossWt) || 0;
          const s = Number(srp) || 0;
          fineWt = p && g ? calculateFineWeight(p, g, s) : 0;
        } else {
          fineWt = Number(fineWt);
        }

        return {
          id: item.id || `item-${Date.now()}-${index}`,
          srNo: index + 1,
          item: item.item?.name || item.itemName || item.name || '',
          size: item.size?.size || item.sizeName || item.size || '',
          purity: purity,
          availableQty:
            item.availableQty !== undefined && item.availableQty !== null
              ? item.availableQty
              : '',
          grossWt: grossWt,
          wastage: '',
          srp: srp,
          fineWt: Math.round(fineWt * 1000) / 1000,
          laborRate: laborRate,
          laborType: item.laborType === 'AMOUNT' ? 'AMOUNT' : 'GRAM',
          isLoadingQty: false,
          itemId: item.itemID || item.itemId || item.item?.id || '',
          sizeId: item.sizeID || item.sizeId || item.size?.id || '',
          design: item.design || '',
          stamp: item.stamp || '',
          'Stamp (शिक्का)': item.stamp || '',
          productCode: item.productCode || undefined,
        } as any;
      });
    }

    const initialTotalFine = updateTotalFine(itemsList);
    const bNumber =
      billData.billNumber ||
      billData.billNo ||
      (billData as any).receiptNo ||
      '';
    setBillNo(bNumber);

    if (
      billData.remainingWeight !== undefined &&
      billData.remainingWeight !== null
    ) {
      setSavedRemaining(Number(billData.remainingWeight));
    }

    const initialSavedAdv = Number(
      billData.customerWeight ??
      billData.advance ??
      billData.receivedWeight ??
      0,
    );
    setSavedAdvance(initialSavedAdv);

    const mappedData = {
      clientId:
        billData.clientID || billData.clientId || billData.client?.id || '',
      clientName:
        billData.client?.fullName ||
        billData.clientName ||
        billData.client?.fullname ||
        '',
      date: billData.receiptDate
        ? new Date(billData.receiptDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      // Keep the saved advance so editing a draft does not drop it
      customerWeight: initialSavedAdv > 0 ? String(initialSavedAdv) : '',
      totalFine: initialTotalFine,
    };

    const savedAdvanceRows = Array.isArray((billData as any).advanceItems)
      ? (billData as any).advanceItems
      : [];
    if (savedAdvanceRows.length > 0) {
      setAdvanceItems(
        savedAdvanceRows.map((r: any, i: number) => ({
          srNo: i + 1,
          item: r.item || '',
          purity: r.purity ? String(r.purity) : '',
          grossWt: r.grossWt ? String(r.grossWt) : '',
          fineWt: r.fineWt ? String(r.fineWt) : '',
        })),
      );
    }

    setFormData((prev) => ({
      ...prev,
      clientId: mappedData.clientId,
      clientName: mappedData.clientName,
      date: mappedData.date,
      customerWeight: mappedData.customerWeight,
      totalFine: mappedData.totalFine,
      items: itemsList.length > 0 ? itemsList : prev.items,
    }));

    const currentType =
      (billData.type as 'DRAFT' | 'BILL') ||
      (billData.remainingWeight === 0 ? 'BILL' : 'DRAFT');
    setBillType(currentType);
    setIsDataLoaded(true);
  }, [billResponse, isDataLoaded]);

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }

    const updatedItems = formData.items.filter((_, i) => i !== index);
    updatedItems.forEach((item, idx) => {
      item.srNo = idx + 1;
    });
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalFine: updateTotalFine(updatedItems),
    }));
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

    const currentItem = updatedItems[index];
    if (field === 'purity' || field === 'grossWt' || field === 'srp') {
      const purity = Number(currentItem.purity) || 0;
      const grossWt = Number(currentItem.grossWt) || 0;
      const srp = Number(currentItem.srp) || 0;

      currentItem.fineWt = calculateFineWeight(purity, grossWt, srp);
    }

    const newTotalFine = updateTotalFine(updatedItems);

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalFine: newTotalFine,
    }));

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

  // Handle changes inside the Advance table
  /* Add advance row (same as Receipt page) */
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

  /* Remove advance row + renumber (same as Receipt page) */
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

  const handleAdvanceItemChange = (
    index: number,
    field: 'purity' | 'grossWt' | 'fineWt',
    value: string,
  ) => {
    setAdvanceItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: value };
        // Auto-recalculate fine wt only when purity or grossWt changes
        if (field !== 'fineWt') {
          const purity = Number(field === 'purity' ? value : next.purity) || 0;
          const grossWt = Number(field === 'grossWt' ? value : next.grossWt) || 0;
          next.fineWt = String(Math.round((purity / 100) * grossWt * 1000) / 1000);
        }
        return next;
      }),
    );
  };

  useEffect(() => {
    if (
      !isDataLoaded ||
      !formData.clientId ||
      formData.items.length === 0 ||
      initialStockFetchedRef.current
    ) {
      return;
    }

    initialStockFetchedRef.current = true;
    formData.items.forEach((item, index) => {
      const purityNum = Number(item.purity) || 0;
      if (item.item && item.size && purityNum > 0) {
        fetchQuantity(index, item.item, item.size, purityNum);
      }
    });
  }, [isDataLoaded, formData.clientId, formData.items.length]);

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

  const calculateTotalGrossWt = () => {
    return formData.items.reduce(
      (total, item) => total + (Number(item.grossWt) || 0),
      0,
    );
  };

  const calculateRemainingWeight = () => {
    const client = clients.find((c: any) => c.id === formData.clientId);
    const dueBalance = getClientDueBalance(client);
    const totalAdvance = Number(formData.customerWeight) || 0;
    const totalFineWeight =
      formData.totalFine !== undefined && formData.totalFine !== ''
        ? Number(formData.totalFine) || 0
        : formData.items.reduce(
          (sum, item) => sum + (Number(item.fineWt) || 0),
          0,
        );
    const remaining = totalFineWeight + dueBalance - totalAdvance;
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

    const advance = Number(formData.customerWeight) || 0;

    const resolvedTotalBill =
      resolvedBill?.totalBill !== undefined &&
        resolvedBill?.totalBill !== null &&
        !isNaN(Number(resolvedBill.totalBill))
        ? Number(resolvedBill.totalBill)
        : rawBillData?.totalBill !== undefined &&
          rawBillData?.totalBill !== null &&
          !isNaN(Number(rawBillData.totalBill))
          ? Number(rawBillData.totalBill)
          : Number(
            resolvedBill?.remainingBalance ??
            resolvedBill?.remainingWeight ??
            resolvedBill?.pending ??
            calculateRemainingWeight(),
          ) || 0;

    const itemsList =
      Array.isArray(resolvedBill?.items) &&
        resolvedBill.items.length > 0 &&
        resolvedBill.items[0]?.item
        ? resolvedBill.items
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
      Number(resolvedBill?.totalFineWt ?? resolvedBill?.totalFinWt) ||
      itemsList.reduce(
        (sum: number, i: any) => sum + (Number(i.finWt) || 0),
        0,
      );

    printReceipt(
      {
        clientName:
          resolvedBill?.clientName ||
          formData.clientName ||
          client?.fullName ||
          'N/A',
        phoneNumber: resolvedBill?.phoneNumber || client?.phoneNumber || 'N/A',
        dateTime: resolvedBill?.dateTime || dateStr,
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
    if (isSubmittingRef.current || updateBill.isPending) {
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
          itemId:
            items.find((i: any) => i.name === item.item)?.id || item.itemId,
          itemName: item.item,
          sizeId:
            sizes.find((s: any) => s.size === item.size)?.id || item.sizeId,
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
        })),
        customerWeight: Number(
          Number(formData.customerWeight || 0).toFixed(3),
        ),
        advanceItems: advancePayload(),
        dueBalance: Number(Number(clientDue || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        remainingBalance: Number(Number(remainingWeight || 0).toFixed(3)),
        totalBill: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'DRAFT',
      };

      await updateBill.mutateAsync({
        id: id,
        data: billData,
      });

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
    if (isSubmittingRef.current || updateBill.isPending) {
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
          itemId:
            items.find((i: any) => i.name === item.item)?.id || item.itemId,
          itemName: item.item,
          sizeId:
            sizes.find((s: any) => s.size === item.size)?.id || item.sizeId,
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
        })),
        customerWeight: Number(
          Number(formData.customerWeight || 0).toFixed(3),
        ),
        advanceItems: advancePayload(),
        dueBalance: Number(Number(clientDue || 0).toFixed(3)),
        remainingWeight: Number(Number(remainingWeight || 0).toFixed(3)),
        remainingBalance: Number(Number(remainingWeight || 0).toFixed(3)),
        totalBill: Number(Number(remainingWeight || 0).toFixed(3)),
        totalWeight: Number(Number(totalGrossWt || 0).toFixed(3)),
        type: 'BILL',
      };

      const response = await updateBill.mutateAsync({
        id: id,
        data: billData,
      });

      setTimeout(() => {
        handlePrintReceipt(response?.data || billData);
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

  const isReadOnly = billType === 'BILL';

  // Available Qty from current stock. A completed bill's own grams were already
  // taken out of stock, so they are added back for this bill's rows.
  const { data: rawStock = [] } = useGetStock();
  useEffect(() => {
    const stockList: any[] = Array.isArray(rawStock)
      ? rawStock
      : Array.isArray((rawStock as any)?.data)
        ? (rawStock as any).data
        : [];
    if (stockList.length === 0 || formData.items.length === 0) return;
    let changed = false;
    const next = formData.items.map((row: any) => {
      if (row.availableQty !== '' && row.availableQty !== undefined && row.availableQty !== null) return row;
      const itemId = row.itemId || items.find((i: any) => i.name === row.item)?.id;
      const p = Number(row.purity) || 0;
      const st = stockList.find(
        (x: any) =>
          x.itemId === itemId &&
          (Math.abs(Number(x.purity ?? 100) - p) < 0.001),
      );
      const own = billType === 'BILL' ? Number(row.grossWt) || 0 : 0;
      changed = true;
      return {
        ...row,
        availableQty: Math.round(((Number(st?.weight) || 0) + own) * 1000) / 1000,
      };
    });
    if (changed) setFormData((prev) => ({ ...prev, items: next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawStock, formData.items.length, billType]);
  const rawBillData =
    billResponse?.data && typeof billResponse.data === 'object'
      ? billResponse.data
      : (billResponse as any);

  const savedDue =
    rawBillData?.dueBalance !== undefined &&
      rawBillData?.dueBalance !== null &&
      !isNaN(Number(rawBillData.dueBalance))
      ? Number(rawBillData.dueBalance)
      : null;

  const savedRemainingWt =
    (rawBillData?.remainingBalance !== undefined &&
      rawBillData?.remainingBalance !== null &&
      !isNaN(Number(rawBillData.remainingBalance))
      ? Number(rawBillData.remainingBalance)
      : null) ??
    (rawBillData?.remainingWeight !== undefined &&
      rawBillData?.remainingWeight !== null &&
      !isNaN(Number(rawBillData.remainingWeight))
      ? Number(rawBillData.remainingWeight)
      : null) ??
    (rawBillData?.client?.openingBalance !== undefined &&
      rawBillData?.client?.openingBalance !== null &&
      !isNaN(Number(rawBillData.client.openingBalance))
      ? Number(rawBillData.client.openingBalance)
      : null) ??
    (rawBillData?.openingBalance !== undefined &&
      rawBillData?.openingBalance !== null &&
      !isNaN(Number(rawBillData.openingBalance))
      ? Number(rawBillData.openingBalance)
      : null);

  const savedTotalBill =
    rawBillData?.totalBill !== undefined &&
      rawBillData?.totalBill !== null &&
      !isNaN(Number(rawBillData.totalBill))
      ? Number(rawBillData.totalBill)
      : null;

  const effectiveTotalBill =
    isReadOnly && savedTotalBill !== null
      ? savedTotalBill
      : isReadOnly && savedRemainingWt !== null
        ? savedRemainingWt
        : remainingBalance;

  const effectiveDueBalance =
    isReadOnly && savedDue !== null ? savedDue : clientDue;
  const effectiveRemainingBalance =
    isReadOnly && savedRemainingWt !== null
      ? savedRemainingWt
      : remainingBalance;

  if (isBillLoading && !isDataLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-[#785600]" />
          <p className="text-sm text-[#4f4535] dark:text-slate-400">
            Loading bill details...
          </p>
        </div>
      </div>
    );
  }

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
              title={
                isReadOnly
                  ? `View Bill ${billNo ? `- ${billNo}` : ''}`
                  : `Edit Bill ${billNo ? `- ${billNo}` : ''}`
              }
              subtitle={
                isReadOnly
                  ? 'View completed bill details'
                  : 'Update items and bill details'
              }
            />
          </div>

          {/* Top Right Print Receipt Button */}
          <GenericButton
            type="button"
            onClick={() => handlePrintReceipt()}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </GenericButton>
        </div>

        {/* Client Selection Header */}
        <BillClientHeader
          rightSlot={
            formData.items.some((it: any) => it.productCode) ? (
              <>
                <label className="mb-2 block text-sm font-semibold text-[#4f4535] dark:text-slate-300">
                  Product Barcodes
                </label>
                <div className="flex flex-wrap gap-3">
                  {formData.items
                    .filter((it: any) => it.productCode)
                    .map((it: any) => (
                      <div
                        key={it.id}
                        className="flex flex-col items-center gap-0.5 rounded-md border border-[#d3c4af]/30 px-2 py-1 text-[11px] dark:border-slate-700"
                      >
                        <Barcode128 value={it.productCode} height={28} />
                        <span className="font-semibold text-[#1a1c1b] dark:text-white">
                          {[it.item, it.design, it.stamp].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            ) : undefined
          }
          clients={clients as any[]}
          selectedClientId={formData.clientId}
          clientName={formData.clientName}
          isReadOnly={isReadOnly}
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
          isReadOnly={isReadOnly}
          onItemChange={handleItemChange}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          getScaleProps={getScaleProps}
        />

        {/* Payment Summary */}
        <BillPaymentSummary
          totalFine={formData.totalFine}
          customerWeight={formData.customerWeight}
          savedAdvance={savedAdvance}
          dueBalance={effectiveDueBalance}
          totalBill={effectiveTotalBill}
          remainingBalance={effectiveRemainingBalance}
          isReadOnly={isReadOnly}
          onCustomerWeightChange={handleCustomerWeightChange}
          advanceItems={advanceItems}
          availableItems={items}
          onAdvanceItemChange={handleAdvanceItemChange}
          getAdvanceScaleProps={getAdvanceScaleProps}
          onAddAdvanceItem={handleAddAdvanceItem}
          onRemoveAdvanceItem={handleRemoveAdvanceItem}
        />

        {/* Action Buttons (only for draft / edit mode) */}
        {!isReadOnly && (
          <div className="sticky bottom-16 z-20 border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-3 md:bottom-0 md:p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-row justify-end gap-2 [&>*]:flex-1 md:gap-3 md:[&>*]:flex-none">
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
                {submittingType === 'draft' ? 'Updating...' : 'Update as Draft'}
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
                {submittingType === 'bill'
                  ? 'Updating...'
                  : 'Update & Print Bill'}
              </GenericButton>
            </div>
          </div>
        )}
      </div>

      {/* Insufficient Stock Modal */}
      <StockErrorModal
        isOpen={showStockErrorModal}
        onClose={() => setShowStockErrorModal(false)}
        onSaveAsDraft={() => {
          setShowStockErrorModal(false);
          void handleSaveAsDraft();
        }}
        isSubmitting={isSubmitting || updateBill.isPending}
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

export default BillEdit;
