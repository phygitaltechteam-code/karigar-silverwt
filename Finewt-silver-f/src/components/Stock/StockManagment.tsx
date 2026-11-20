import React, { useState, useEffect, useMemo } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import { useGetItems } from '@/lib/api/items';
import { useGetSizes } from '@/lib/api/sizes';
import { useGetAllStock, useUpdateStock } from '@/lib/api/stockmanagement';
import { useCreateStock } from '@/lib/api/stock';
import { useScaleFocus } from '@/lib/hooks/useScaleFocus';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema for validation
const StockSchema = z
  .object({
    itemId: z.string().min(1, 'Please select an item'),
    sizeId: z.string().optional(),
    purity: z.string().optional(),
    stockQty: z.union([z.string(), z.number()]).refine((val) => {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Please enter a valid quantity'),
    stockType: z.string().min(1, 'Please select stock type'),
    note: z.string().optional(),
  });

type StockFormData = z.infer<typeof StockSchema>;

const StockManagment: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from API
  const { data: items = [] } = useGetItems();
  const { data: sizes = [] } = useGetSizes();
  const { data: stockData = [], refetch: refetchStock } = useGetAllStock();
  const updateStock = useUpdateStock();
  const createStock = useCreateStock();

  useEffect(() => {
    refetchStock();
  }, [refetchStock]);

  // Form state
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [remainingStock, setRemainingStock] = useState<number>(0);
  const [stockId, setStockId] = useState<string>('');

  // React Hook Form
  const methods = useForm<StockFormData>({
    resolver: zodResolver(StockSchema),
    defaultValues: {
      itemId: '',
      sizeId: '',
      purity: '',
      stockQty: '',
      stockType: 'INWARD',
      note: '',
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = methods;

  // Watch all form values
  const watchedItemId = watch('itemId');
  const watchedSizeId = watch('sizeId');
  const watchedPurity = watch('purity');
  const watchedStockQty = watch('stockQty');
  const watchedStockType = watch('stockType');

  // Weighing Scale focus hook
  const scaleFocus = useScaleFocus((weight) => {
    setValue('stockQty', String(weight), {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  // Stock type options
  const stockTypeOptions = [
    { label: 'Add Stock (INWARD)', value: 'INWARD' },
    { label: 'Less Stock (OUTWARD)', value: 'OUTWARD' },
  ];

  // Get item options - all items available
  const itemOptions = useMemo(() => {
    return items.map((item: any) => ({
      label: item.name,
      value: item.id,
    }));
  }, [items]);

  // Get size options - all sizes available
  const sizeOptions = useMemo(() => {
    return [
      { label: 'None / No Size', value: '' },
      ...sizes.map((s: any) => ({
        label: s.size,
        value: s.id,
      })),
    ];
  }, [sizes]);

  const selectedItemObj = items.find((i: any) => i.id === watchedItemId);
  const isGold = selectedItemObj?.name?.trim().toLowerCase().includes('gold');
  // SILVER with no size at 100% (or purity left blank) is the fine silver row used by Galai
  const isFineSilverItem = selectedItemObj?.name?.trim().toLowerCase() === 'silver';
  const isFineSilverEntry = (sizeId?: string | null, purity?: number | null) =>
    isFineSilverItem &&
    !sizeId &&
    (purity === null || purity === undefined || Math.abs(purity - 100) < 0.001);
  const isFineSilverStock = (s: any) =>
    !s.sizeId &&
    (s.purity === null || s.purity === undefined || Math.abs(Number(s.purity) - 100) < 0.001);

  // Clear size and purity when Gold is selected
  useEffect(() => {
    if (!watchedItemId) {
      setCurrentStock(0);
      setRemainingStock(0);
      setStockId('');
      return;
    }

    if (isGold) {
      setValue('sizeId', '');
      setValue('purity', '');
    }
  }, [watchedItemId, isGold, setValue]);

  // Automatically find current stock when Item, Size, or Purity changes
  useEffect(() => {
    if (watchedItemId) {
      const enteredPurityNum =
        watchedPurity !== undefined &&
          watchedPurity !== null &&
          watchedPurity.trim() !== '' &&
          !isNaN(Number(watchedPurity))
          ? Number(watchedPurity)
          : null;

      const matchingStock = stockData.find((s: any) => {
        if (s.itemId !== watchedItemId) return false;

        // For Gold: match without sizeId and purity
        if (isGold) {
          return !s.sizeId || s.sizeId === null;
        }

        if (isFineSilverEntry(watchedSizeId, enteredPurityNum)) {
          return isFineSilverStock(s);
        }

        // For non-gold: match with size and purity
        const matchSize = watchedSizeId
          ? s.sizeId === watchedSizeId
          : !s.sizeId || s.sizeId === null;

        const stockPurityNum =
          s.purity !== null &&
            s.purity !== undefined &&
            s.purity !== '' &&
            !isNaN(Number(s.purity))
            ? Number(s.purity)
            : null;

        const matchPurity =
          enteredPurityNum !== null
            ? stockPurityNum !== null &&
            Math.abs(stockPurityNum - enteredPurityNum) < 0.0001
            : stockPurityNum === null || stockPurityNum === 0;

        return matchSize && matchPurity;
      });

      if (matchingStock) {
        const wt = Number(matchingStock.weight || 0);
        setCurrentStock(wt);
        setStockId(matchingStock.id || '');
      } else {
        setCurrentStock(0);
        setStockId('');
      }
    } else {
      setCurrentStock(0);
      setRemainingStock(0);
      setStockId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedItemId, watchedSizeId, watchedPurity, stockData, isGold, isFineSilverItem]);

  // Calculate remaining/total stock when quantity changes
  useEffect(() => {
    const qty = parseFloat(String(watchedStockQty)) || 0;
    if (watchedStockType === 'INWARD') {
      setRemainingStock(currentStock + qty);
    } else {
      setRemainingStock(Math.max(0, currentStock - qty));
    }
  }, [watchedStockQty, watchedStockType, currentStock]);

  // Handle save
  const onSubmit = async (data: StockFormData) => {
    if (!isGold && !isFineSilverItem && (!data.purity || data.purity.trim() === '')) {
      toast.error('Purity is required');
      return;
    }

    const stockQty =
      typeof data.stockQty === 'number'
        ? data.stockQty
        : parseFloat(data.stockQty) || 0;

    // For Gold: set sizeId and purity to null
    // For non-Gold: use the values from form
    const finalSizeId = isGold ? null : data.sizeId || null;
    const finalPurity = isGold
      ? null
      : data.purity && data.purity.trim() !== '' && !isNaN(Number(data.purity))
        ? parseFloat(data.purity)
        : null;

    // Check if matching stock exists
    const matchingStock = stockData.find((s: any) => {
      if (s.itemId !== data.itemId) return false;

      // For Gold: match without sizeId and purity
      if (isGold) {
        return !s.sizeId || s.sizeId === null;
      }

      if (isFineSilverEntry(finalSizeId, finalPurity)) {
        return isFineSilverStock(s);
      }

      // For non-gold: match with size and purity
      const matchSize = finalSizeId
        ? s.sizeId === finalSizeId
        : !s.sizeId || s.sizeId === null;

      const stockPurityNum =
        s.purity !== null && s.purity !== undefined && !isNaN(Number(s.purity))
          ? Number(s.purity)
          : null;

      const matchPurity =
        finalPurity !== null
          ? stockPurityNum !== null &&
          Math.abs(stockPurityNum - finalPurity) < 0.001
          : stockPurityNum === null || stockPurityNum === 0;

      return matchSize && matchPurity;
    });

    const targetStockId = stockId || matchingStock?.id;

    if (data.stockType === 'OUTWARD') {
      if (!targetStockId) {
        toast.error('No existing stock found for selected item to reduce');
        return;
      }
      if (stockQty > currentStock) {
        toast.error(`Insufficient stock! Current stock: ${currentStock} G`);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (data.stockType === 'INWARD') {
        const payload: any = {
          itemId: data.itemId,
          sizeId: finalSizeId,
          purity: finalPurity,
          stockQty: stockQty,
          weight: currentStock + stockQty,
          type: 'INWARD',
          note: data.note || '',
        };

        if (targetStockId) {
          payload.id = targetStockId;
          await updateStock.mutateAsync({ id: targetStockId, data: payload });
        } else {
          // If no existing stock record, create new entry
          await createStock.mutateAsync({
            itemId: data.itemId,
            sizeId: finalSizeId || '',
            purity: finalPurity || 0,
            weight: stockQty,
            type: 'INWARD',
            note: data.note || '',
            stockQty: stockQty,
          });
        }

        toast.success('Stock added successfully!');
      } else {
        // OUTWARD
        const newStock = Math.max(0, currentStock - stockQty);
        const payload: any = {
          id: targetStockId,
          itemId: data.itemId,
          weight: newStock,
          stockQty: stockQty,
          type: 'OUTWARD',
          note: data.note || '',
          sizeId: finalSizeId,
          purity: finalPurity,
        };

        await updateStock.mutateAsync({ id: targetStockId, data: payload });
        toast.success('Stock reduced successfully!');
      }

      await refetchStock();
      reset({
        itemId: '',
        sizeId: '',
        purity: '',
        stockQty: '',
        stockType: 'INWARD',
        note: '',
      });
      setCurrentStock(0);
      setRemainingStock(0);
      setStockId('');
      setIsLoading(false);

      navigate({ to: '/Stocks/stockpage' });
    } catch (error) {
      console.error('Error saving stock:', error);
      toast.error('Failed to save stock entry');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 md:px-8 md:py-6">
        {/* Header with Back and Title */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: '/Stocks/stockpage' })}
              className="flex flex-shrink-0 items-center gap-1 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs font-medium sm:text-sm">Back</span>
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h1 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Inward / Outward Stock
            </h1>
          </div>
        </div>

        {/* Form Section */}
        <div className="mx-auto rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-[#4f4535] dark:text-slate-400">
            {watchedStockType === 'INWARD'
              ? 'Add Stock (INWARD)'
              : 'Less Stock (OUTWARD)'}
          </h3>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Item Dropdown - Select any item */}
                <GenericDropdown
                  name="itemId"
                  label="Item"
                  options={itemOptions}
                  placeholder="Select Item"
                  control={control}
                  required
                  error={errors.itemId?.message}
                />

                {/* Size Dropdown - Hidden for GOLD */}
                {!isGold && (
                  <GenericDropdown
                    name="sizeId"
                    label="Size"
                    required
                    options={sizeOptions.filter((opt) => opt.value !== '')}
                    placeholder="Select Size"
                    control={control}
                    error={errors.sizeId?.message}
                  />
                )}

                {/* Purity Input Field - Hidden for GOLD */}
                {!isGold && (
                  <div>
                    <GenericInputField
                      name="purity"
                      label="Purity (%)"
                      type="text"
                      inputMode="decimal"
                      decimalScale={2}
                      value={watchedPurity || ''}
                      onChange={(e) => {
                        setValue('purity', e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      placeholder="e.g. 91.60"
                      suffix="%"
                      className="font-mono"
                    />
                    {errors.purity && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.purity.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Stock Type Dropdown */}
                <GenericDropdown
                  name="stockType"
                  label="Stock Type"
                  options={stockTypeOptions}
                  placeholder="Select Stock Type"
                  control={control}
                  required
                  error={errors.stockType?.message}
                />

                {/* Stock Quantity */}
                <div>
                  <GenericInputField
                    name="stockQty"
                    label="Quantity (G)"
                    required
                    type="text"
                    inputMode="decimal"
                    decimalScale={3}
                    value={
                      watchedStockQty !== undefined && watchedStockQty !== null
                        ? String(watchedStockQty)
                        : ''
                    }
                    onFocus={scaleFocus.onFocus}
                    onBlur={scaleFocus.onBlur}
                    onChange={(e) => {
                      setValue('stockQty', e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    placeholder="0.000"
                    suffix="G"
                    className="font-mono"
                  />
                  {errors.stockQty && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.stockQty.message}
                    </p>
                  )}
                </div>

                {/* Current & Total Stock */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
                      Current Stock
                    </label>
                    <div className="bg-gray-100 mt-1 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                      {currentStock.toFixed(3)} G
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
                      Total Stock
                    </label>
                    <div
                      className={`mt-1 rounded-lg px-3 py-2 text-left text-sm font-semibold ${remainingStock < 0
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                    >
                      {remainingStock.toFixed(3)} G
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="md:col-span-2">
                  <GenericInputField
                    name="note"
                    label="Note (Optional)"
                    type="text"
                    placeholder="Add a note (optional)"
                    onChange={(e) => setValue('note', e.target.value)}
                    value={watch('note') || ''}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <GenericButton
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 !bg-[#785600] !px-6 !py-2.5 !text-sm !text-white hover:!bg-[#5d4200]"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Stock'}
                </GenericButton>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default StockManagment;
