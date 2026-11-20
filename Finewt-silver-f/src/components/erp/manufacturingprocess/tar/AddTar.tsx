import React, {useState, useEffect} from 'react';
import {
  Plus,
  Save,
  X,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Printer,
  Trash2,
  Layers,
  AlertCircle,
  Flame,
  Search,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {Column, GenericTable} from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useTar,
  useCreateTar,
  useSaveTar,
  Tar,
  useGetTarHistory,
  useAddMelting,
  useRevertTar,
} from '@/lib/api/tar';
import {
  useGetProcessAlert,
  checkProcessLossAlert,
  AlertRule,
} from '@/lib/api/alertmanagement';
import {useGetStock} from '@/lib/api/stock';
import {useGetItems} from '@/lib/api/items';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import {useGetHeader} from '@/lib/api/headerapi';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';

import {
  TarEntry,
  TarCardForm,
  createNewCard,
  formatDate,
  formatDateTime,
  formatNumberDisplay,
  hasMeltingStatus,
  printTarHistory,
  getTarColumns,
  getHistoryTarColumns,
  toNumber,
} from './tarUtils';

import HistoryTar from './HistoryTar';
import AddTarModal from './AddTarModal';

interface AddTarProps {
  showBack?: boolean;
}

const AddTar: React.FC<AddTarProps> = ({showBack = false}) => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [tarEntries, setTarEntries] = useState<TarEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTarCompleted, setIsTarCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');
  const [revertLoadingIds, setRevertLoadingIds] = useState<
    Record<string, boolean>
  >({});
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  const getDefaultWeekRange = () => {
    const {fromDate, toDate} = getCurrentAppWeekRange();
    return [fromDate, toDate];
  };

  const [dateRange, setDateRange] = useState<Date[]>(() =>
    getDefaultWeekRange(),
  );

  const accessType = localStorage.getItem('admin_access_type')?.toUpperCase();
  const isTrial = accessType === 'TRIAL';
  const [isDateFilterActive, setIsDateFilterActive] = useState(!isTrial);

  useEffect(() => {
    const handleWeekCycleUpdate = () => {
      setDateRange(getDefaultWeekRange());
    };
    window.addEventListener('app_week_cycle_changed', handleWeekCycleUpdate);
    return () => {
      window.removeEventListener(
        'app_week_cycle_changed',
        handleWeekCycleUpdate,
      );
    };
  }, []);

  const [modalCards, setModalCards] = useState<TarCardForm[]>([
    createNewCard(),
  ]);

  const [selectedDate, setSelectedDate] = useState({
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    hour: new Date().getHours(),
    minute: new Date().getMinutes(),
  });

  const {data: tarData = [], isLoading: tarLoading, refetch} = useTar();
  const {
    data: tarHistory = [],
    isLoading: tarHistoryLoading,
    refetch: refetchHistory,
  } = useGetTarHistory();
  const revertTar = useRevertTar();

  const handleRevert = async (item: TarEntry) => {
    if (!item.id) return;
    try {
      setRevertLoadingIds((prev) => ({...prev, [item.id]: true}));
      await revertTar.mutateAsync(item.id);
      await refetch();
    } catch (error: any) {
      console.error('Error reverting tar entry:', error);
    } finally {
      setRevertLoadingIds((prev) => ({...prev, [item.id]: false}));
    }
  };

  // Query tar alert threshold rules
  const {data: tarAlertRaw} = useGetProcessAlert('tar');

  const alertRules: AlertRule[] = React.useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(tarAlertRaw) && tarAlertRaw.length > 0) {
      list = tarAlertRaw;
    } else if (tarAlertRaw && typeof tarAlertRaw === 'object') {
      if (Array.isArray((tarAlertRaw as any).data)) {
        list = (tarAlertRaw as any).data;
      } else if ((tarAlertRaw as any).grossWt !== undefined) {
        list = [tarAlertRaw];
      }
    }

    if (list.length === 0) {
      try {
        const saved = localStorage.getItem(
          'chain_alert_management_settings_v2',
        );
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.tar) && parsed.tar.length > 0) {
            list = parsed.tar;
          }
        }
      } catch (e) {}
    }

    return list;
  }, [tarAlertRaw]);

  // Mutation hooks
  const createTar = useCreateTar();
  const saveTar = useSaveTar();

  // Fetch stock and items data
  const {data: rawStockData = []} = useGetStock();
  const {data: rawItemsData = []} = useGetItems();
  const submitMelting = useAddMelting();

  const handleMelting = async (entry: TarEntry) => {
    setTarEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? {...e, isMeltingLoading: true} : e)),
    );

    try {
      const result = await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: entry.purity,
          grosswt: entry.grosswt || entry.fine,
          fine: entry.fine,
          meltingWeight: entry.grosswt || entry.fine,
          status: 'processing',
        },
      });
      await refetch();
    } catch (error: any) {
      console.error('Error in melting:', error);
      const errorMessage =
        error?.response?.data?.message || 'Failed to process melting';
      toast.error(errorMessage);
    } finally {
      // Clear loading state for this specific row
      setTarEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? {...e, isMeltingLoading: false} : e,
        ),
      );
    }
  };
  const stockList = Array.isArray(rawStockData)
    ? rawStockData
    : (rawStockData as any)?.data || [];

  const itemsList = Array.isArray(rawItemsData)
    ? rawItemsData
    : (rawItemsData as any)?.data || [];

  const goldItemIds = React.useMemo(() => {
    return itemsList
      .filter((it: any) => {
        const name = (it?.name || '').trim().toLowerCase();
        return name === 'gold' || name.includes('gold');
      })
      .map((it: any) => it.id);
  }, [itemsList]);

  // Helper to get total gold available
  const getGoldAvailableWeight = (): number => {
    if (!stockList || stockList.length === 0) return 0;

    // 1. Try matching by Gold item ID from items API
    let goldMatches = stockList.filter((s: any) => {
      if (goldItemIds.length > 0 && s.itemId) {
        return goldItemIds.includes(s.itemId);
      }
      const itemName = (
        typeof s.item === 'string' ? s.item : s.item?.name || s.itemName || ''
      )
        .trim()
        .toLowerCase();
      return itemName === 'gold' || itemName.includes('gold');
    });

    // 2. If no match by name/id yet, raw gold in stock has sizeId: null
    if (goldMatches.length === 0) {
      goldMatches = stockList.filter(
        (s: any) => !s.sizeId || s.sizeId === null,
      );
    }

    const total = goldMatches.reduce((sum: number, s: any) => {
      const wt = Number(s.weight ?? s.grams ?? s.stockQty ?? 0);
      return sum + (isNaN(wt) ? 0 : wt);
    }, 0);

    return Math.round(total * 1000) / 1000;
  };

  // Scale hooks for modal and table
  const {getScaleProps: getModalScaleProps} = useTableScaleFocus<
    'grossWt' | 'fine'
  >((cardIndex, field, weight) => {
    handleCardChange(cardIndex, field, weight.toString());
  });

  const {getScaleProps} = useTableScaleFocus<'tar' | 'scrap'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  // Filter and sort history by Proceed Date & Time
  const getFilteredHistory = () => {
    let filtered = Array.isArray(tarHistory?.data)
      ? tarHistory.data
      : Array.isArray(tarHistory)
        ? tarHistory
        : [];

    // Sort descending by Proceed Date & Time
    filtered = [...filtered].sort((a: any, b: any) => {
      const dateA = new Date(
        a.updatedAt || a.proceedDateTime || a.updated_at || a.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        b.updatedAt || b.proceedDateTime || b.updated_at || b.createdAt || 0,
      ).getTime();
      return dateB - dateA;
    });

    if (isTrial && !isDateFilterActive) {
      // Bypass date filtering for trial initial load
    } else if (dateRange && dateRange.length > 0) {
      if (dateRange[0]) {
        const from = new Date(dateRange[0]);
        from.setHours(0, 0, 0, 0);
        filtered = filtered.filter((item: any) => {
          const dateVal =
            item?.updatedAt ||
            item?.proceedDateTime ||
            item?.updated_at ||
            item?.createdAt;
          if (!dateVal) return false;
          const itemDate = new Date(dateVal);
          if (Number.isNaN(itemDate.getTime())) return false;
          return itemDate >= from;
        });
      }
      if (dateRange[1]) {
        const to = new Date(dateRange[1]);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((item: any) => {
          const dateVal =
            item?.updatedAt ||
            item?.proceedDateTime ||
            item?.updated_at ||
            item?.createdAt;
          if (!dateVal) return false;
          const itemDate = new Date(dateVal);
          if (Number.isNaN(itemDate.getTime())) return false;
          return itemDate <= to;
        });
      }
    }

    if (historySearchTerm.trim()) {
      const term = historySearchTerm.toLowerCase();
      filtered = filtered.filter((item: any) => {
        const itemName = (
          typeof item?.item === 'object'
            ? item?.item?.name || item?.item?.item || ''
            : item?.item || ''
        ).toLowerCase();
        const sizeName = (
          typeof item?.size === 'object'
            ? item?.size?.size || item?.size?.name || ''
            : item?.size || ''
        ).toLowerCase();
        const dateStr = (
          item?.updatedAt ||
          item?.proceedDateTime ||
          item?.updated_at ||
          item?.createdAt ||
          ''
        ).toLowerCase();
        const fineStr = String(item?.fine || '').toLowerCase();
        const tarStr = String(item?.tar || '').toLowerCase();
        const scrapStr = String(item?.scrap || '').toLowerCase();
        const grossStr = String(
          item?.grosswt ?? item?.grossWt ?? '',
        ).toLowerCase();
        const purityStr = String(item?.purity || '').toLowerCase();

        return (
          itemName.includes(term) ||
          sizeName.includes(term) ||
          dateStr.includes(term) ||
          fineStr.includes(term) ||
          tarStr.includes(term) ||
          scrapStr.includes(term) ||
          grossStr.includes(term) ||
          purityStr.includes(term)
        );
      });
    }

    return filtered;
  };

  // Calculate history totals
  const filteredHistory = getFilteredHistory();

  const historyTotals = filteredHistory.reduce(
    (
      acc: {
        totalFine: number;
        totalTar: number;
        totalScrap: number;
        totalLoss: number;
        totalEntries: number;
      },
      item: any,
    ) => ({
      totalFine: acc.totalFine + toNumber(item?.fine),
      totalTar: acc.totalTar + toNumber(item?.tar),
      totalScrap: acc.totalScrap + toNumber(item?.scrap),
      totalLoss: acc.totalLoss + toNumber(item?.loss ?? item?.lossWeight),
      totalEntries: acc.totalEntries + 1,
    }),
    {
      totalFine: 0,
      totalTar: 0,
      totalScrap: 0,
      totalLoss: 0,
      totalEntries: 0,
    },
  );

  // Initialize with existing tar data
  useEffect(() => {
    if (!tarLoading) {
      const rawTarList = Array.isArray(tarData)
        ? tarData
        : Array.isArray((tarData as any)?.data)
          ? (tarData as any).data
          : [];

      if (rawTarList.length > 0) {
        const entries: TarEntry[] = rawTarList.map((tar: any, index: any) => {
          let sizeValue = tar.size;
          if (typeof tar.size === 'object' && tar.size !== null) {
            sizeValue =
              tar.size.size || tar.size.name || JSON.stringify(tar.size);
          }

          let itemValue = tar.item;
          if (typeof tar.item === 'object' && tar.item !== null) {
            itemValue =
              tar.item.name || tar.item.item || JSON.stringify(tar.item);
          }

          if (tar.isSaved) {
            setIsTarCompleted(true);
          }
          const formattedDateTime = tar.createdAt
            ? formatDateTime(new Date(tar.createdAt))
            : '-';

          return {
            id: tar.id,
            srNo: index + 1,
            dateTime: formattedDateTime,
            item: itemValue,
            size: sizeValue,
            fine: toNumber(tar.fine),
            tar: toNumber(tar.tar),
            scrap: toNumber(tar.scrap),
            loss: toNumber(tar.loss ?? tar.lossWeight),
            purity: toNumber(tar.purity),
            grosswt: toNumber(tar.grosswt ?? tar.grossWt),
            isSaved: tar.isSaved || false,
            tarRaw: toNumber(tar.tar) > 0 ? String(tar.tar) : '',
            scrapRaw: toNumber(tar.scrap) > 0 ? String(tar.scrap) : '',
            purityRaw: toNumber(tar.purity) > 0 ? String(tar.purity) : '',
            grosswtRaw:
              toNumber(tar.grosswt ?? tar.grossWt) > 0
                ? String(tar.grosswt ?? tar.grossWt)
                : '',
            itemId: tar.itemId || '',
            sizeId: tar.sizeId || '',
            isDirty: false,
            status: tar.status,
            process: tar.process,
            isMelting: tar.isMelting,
            meltingStatus: tar.meltingStatus,
          };
        });
        setTarEntries(entries);
      } else {
        setTarEntries([]);
      }
    }
  }, [tarData, tarLoading]);

  // Check if Tar is completed when entries change
  useEffect(() => {
    const hasSaved = tarEntries.some((entry) => entry.isSaved === true);
    if (hasSaved) {
      setIsTarCompleted(true);
    }
  }, [tarEntries]);

  const handleCardChange = (
    cardIndex: number,
    field: 'itemId' | 'sizeId' | 'grossWt' | 'purity' | 'fine',
    value: string,
  ) => {
    setModalCards((prev) =>
      prev.map((card, idx) => {
        if (idx !== cardIndex) return card;

        if (field === 'fine' || field === 'purity') {
          const sanitized = value.replace(/[^0-9.]/g, '');
          const nextCard = {...card, [field]: sanitized};
          const fineNum = parseFloat(
            field === 'fine' ? sanitized : card.fine,
          );
          const purityNum = parseFloat(
            field === 'purity' ? sanitized : card.purity,
          );
          if (
            !isNaN(fineNum) &&
            !isNaN(purityNum) &&
            fineNum > 0 &&
            purityNum > 0
          ) {
            const autoGross =
              Math.round(((fineNum * purityNum) / 100) * 1000) / 1000;
            nextCard.grossWt = autoGross.toString();
          }
          return nextCard;
        } else if (field === 'grossWt') {
          const sanitized = value.replace(/[^0-9.]/g, '');
          return {...card, grossWt: sanitized};
        } else {
          return {...card, [field]: value};
        }
      }),
    );
  };

  const handleRemoveCard = (cardIndex: number) => {
    setModalCards((prev) => {
      const next = prev.filter((_, idx) => idx !== cardIndex);
      if (next.length === 0) {
        setIsModalOpen(false);
        return [createNewCard()];
      }
      return next;
    });
  };

  const handleOpenModal = () => {
    if (isTarCompleted) {
      toast.error(
        'Tar process is already completed. You cannot add more entries.',
      );
      return;
    }
    const now = new Date();
    setSelectedDate({
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      hour: now.getHours(),
      minute: now.getMinutes(),
    });
    setModalCards([createNewCard()]);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (cardIndex: number) => {
    const card = modalCards[cardIndex];
    if (!card) return;

    const fineValue = parseFloat(card.fine) || 0;
    const grossWtValue = parseFloat(card.grossWt) || 0;
    const purityValue = parseFloat(card.purity) || 0;

    if (fineValue <= 0) {
      toast.error(
        `Please enter a valid fine weight for Process Item #${cardIndex + 1}`,
      );
      return;
    }

    setModalCards((prev) =>
      prev.map((c, idx) => (idx === cardIndex ? {...c, isSaving: true} : c)),
    );

    try {
      const {day, month, year, hour, minute} = selectedDate;
      const date = new Date(year, month - 1, day, hour, minute);
      const dateTimeStr = formatDateTime(date);
      const grossVal = grossWtValue > 0 ? grossWtValue : fineValue;

      const payload = {
        itemId: '',
        sizeId: '',
        grosswt: grossVal,
        grossWt: grossVal,
        fine: fineValue,
        item: '',
        size: '',
        tar: 0,
        scrap: 0,
        loss: 0,
        purity: purityValue,
        isSaved: false,
        dateTime: dateTimeStr,
      };

      const result = await createTar.mutateAsync(payload);

      const newEntry: TarEntry = {
        id: result?.data?.id || Date.now().toString(),
        srNo: tarEntries.length + 1,
        dateTime: dateTimeStr,

        fine: fineValue,
        tar: 0,
        scrap: 0,
        loss: 0,
        purity: purityValue,
        grosswt: grossVal,
        isSaved: false,
        tarRaw: '',
        scrapRaw: '',
        purityRaw: purityValue > 0 ? String(purityValue) : '',
        grosswtRaw: grossVal > 0 ? String(grossVal) : '',
      };

      setTarEntries((prev) => [...prev, newEntry]);

      // Remove this card from modal, leaving any other cards untouched
      setModalCards((prev) => {
        const next = prev.filter((_, idx) => idx !== cardIndex);
        if (next.length === 0) {
          setIsModalOpen(false);
          return [createNewCard()];
        }
        return next;
      });

      await refetch();
    } catch (error: any) {
      console.error('Error saving tar:', error);

      // Show the exact backend error when stock is insufficient.
      const backendMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        '';

      if (
        typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('insufficient stock')
      ) {
        setStockErrorMessage(backendMessage);
        setShowStockErrorModal(true);
        setModalCards((prev) =>
          prev.map((c, idx) =>
            idx === cardIndex ? {...c, isSaving: false} : c,
          ),
        );
        return;
      }

      toast.error(backendMessage || 'Failed to save tar entry');
      setModalCards((prev) =>
        prev.map((c, idx) => (idx === cardIndex ? {...c, isSaving: false} : c)),
      );
    }
  };

  const handleInlineChange = (
    index: number,
    field: 'tar' | 'scrap' | 'purity' | 'grosswt',
    value: string,
  ) => {
    setTarEntries((prev) =>
      prev.map((entry, i) => {
        if (i === index) {
          const updated = {...entry};

          if (field === 'grosswt') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            updated.grosswtRaw = sanitized;
            if (sanitized === '' || sanitized === '.' || sanitized === '-') {
              updated.grosswt = 0;
            } else {
              const numValue = parseFloat(sanitized);
              updated.grosswt = isNaN(numValue) ? 0 : numValue;
            }
          } else if (field === 'tar') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            updated.tarRaw = sanitized;
            if (sanitized === '' || sanitized === '.' || sanitized === '-') {
              updated.tar = 0;
            } else {
              const numValue = parseFloat(sanitized);
              updated.tar = isNaN(numValue) ? 0 : numValue;
            }
          } else if (field === 'scrap') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            updated.scrapRaw = sanitized;
            if (sanitized === '' || sanitized === '.' || sanitized === '-') {
              updated.scrap = 0;
            } else {
              const numValue = parseFloat(sanitized);
              updated.scrap = isNaN(numValue) ? 0 : numValue;
            }
          } else if (field === 'purity') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            updated.purityRaw = sanitized;
            if (sanitized === '' || sanitized === '.' || sanitized === '-') {
              updated.purity = 0;
            } else {
              const numValue = parseFloat(sanitized);
              updated.purity = isNaN(numValue) ? 0 : numValue;
            }
          }
          // Formula: Loss = Gross Wt - Tar - Scrap
          const grossVal = toNumber(
            updated.grosswt > 0 ? updated.grosswt : updated.fine,
          );
          const tarVal = toNumber(updated.tar);
          const scrapVal = toNumber(updated.scrap);
          updated.loss = Math.max(
            0,
            Math.round((grossVal - tarVal - scrapVal) * 1000) / 1000,
          );

          console.log(`[Tar Field Change - Row #${index + 1}]`, {
            fieldChanged: field,
            newValue: value,
            grossWeight: grossVal,
            purity: updated.purity,
            tar: tarVal,
            scrap: scrapVal,
            calculatedLoss: updated.loss,
            formula: `${grossVal} (Gross) - ${tarVal} (Tar) - ${scrapVal} (Scrap) = ${updated.loss} G (Loss)`,
          });

          updated.isDirty = true;
          return updated;
        }
        return entry;
      }),
    );
  };

  const handleSaveClick = (index: number) => {
    const entry = tarEntries[index];

    if (!entry.tar || entry.tar < 0) {
      toast.error('Please enter a valid tar weight');
      return;
    }

    if (!entry.purity || entry.purity <= 0) {
      toast.error('Please enter purity (टंच)');
      return;
    }

    if (entry.loss < 0) {
      toast.error(
        'Loss cannot be negative. (Tar + Scrap) must be less than or equal to Gross Weight.',
      );
      return;
    }

    setSaveIndex(index);
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = tarEntries[index];

    setIsLoading(true);

    try {
      await saveTar.mutateAsync({
        id: entry.id,
        data: {
          id: entry.id,
          fine: Number(entry.fine),
          item: entry.item || '',
          size: entry.size || '',
          tar: Number(entry.tar),
          scrap: Number(entry.scrap),
          purity: Number(entry.purity),
          loss: Number(entry.loss),
          isSaved: true,
        },
      });

      setTarEntries((prev) =>
        prev.map((s, i) => (i === index ? {...s, isSaved: true} : s)),
      );

      setIsTarCompleted(true);

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();

      // navigate({
      //   to: '/manufacturingprocess/process',
      //   state: { selectedTab: 'box' },
      // });
    } catch (error: any) {
      console.error('Error saving tar:', error);
      const backendMessage =
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : error?.response?.data?.message) ||
        error?.response?.data?.error ||
        error?.data?.message ||
        error?.message ||
        '';

      if (
        typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('insufficient stock')
      ) {
        setStockErrorMessage(backendMessage);
        setShowStockErrorModal(true);
        setIsLoading(false);
        setShowConfirmModal(false);
        setSaveIndex(null);
        return;
      }

      toast.error(backendMessage || 'Failed to save tar entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  };

  const hasEditableValues = (entry: TarEntry): boolean => {
    return Boolean(entry.isDirty);
  };

  const isSubmitting = createTar.isPending || saveTar.isPending;

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      refetch();
    } else {
      setShowHistory(true);
      refetchHistory();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Tar History' : 'Tar Management'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!showHistory && (
            <GenericButton size="sm"
              type="button"
              onClick={handleOpenModal}
              variant="primary"
            >
              <Plus className="h-4 w-4" />
              <span>Add Tar</span>
            </GenericButton>
          )}

          {showHistory && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Search History */}
              <div className="relative w-full sm:w-48 md:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                <input
              autoComplete="off"
              data-lpignore="true"
                  type="search"
                  placeholder="Search history..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* From Date - Defaults to Monday */}
              <div className="w-32 sm:w-36 md:w-40">
                <GenericWeeklyDatePicker
                  id="from-date-tar"
                  placeholder="DD/MM/YYYY"
                  mode="from"
                  initialDates={dateRange}
                  onDateChange={(dates) => {
                    if (isTrial) setIsDateFilterActive(true);
                    if (dates && dates.length > 0) {
                      const from = new Date(dates[0]);
                      from.setHours(0, 0, 0, 0);
                      setDateRange((prev) => [from, prev[1] || from]);
                    } else {
                      setDateRange((prev) => [undefined as any, prev[1]]);
                    }
                  }}
                  className="w-full"
                />
              </div>

              {/* To Date - Defaults to Sunday */}
              <div className="w-32 sm:w-36 md:w-40">
                <GenericWeeklyDatePicker
                  id="to-date-tar"
                  placeholder="DD/MM/YYYY"
                  mode="to"
                  initialDates={dateRange}
                  onDateChange={(dates) => {
                    if (isTrial) setIsDateFilterActive(true);
                    if (dates && dates.length > 0) {
                      const to = new Date(dates[0]);
                      to.setHours(23, 59, 59, 999);
                      setDateRange((prev) => [prev[0] || to, to]);
                    } else {
                      setDateRange((prev) => [prev[0], undefined as any]);
                    }
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Print History Button */}
          {showHistory && (
            <GenericButton size="sm"
              type="button"
              onClick={() =>
                printTarHistory(
                  getFilteredHistory(),
                  dateRange,
                  getpdfheaderdata,
                )
              }
              variant="primary"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          )}

          {/* History Toggle Button */}
          <GenericButton size="sm"
            type="button"
            onClick={toggleHistory}
            variant="primary"
          >
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Tar' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Table Section */}
      {!showHistory ? (
        <div>
          <GenericTable<TarEntry>
            data={tarEntries}
            columns={getTarColumns(
              getScaleProps,
              handleInlineChange,
              handleSaveClick,
              handleMelting,
              hasEditableValues,
              tarLoading,
              isSubmitting,
              alertRules,
              handleRevert,
              revertLoadingIds,
            )}
            emptyMessage="No tar entries found. Click 'Add Tar' to create one."
            isLoading={tarLoading || isSubmitting}
            showSrNo={true}
            srNoLabel="Sr No."
            rowClassName={(item) =>
              hasMeltingStatus(item)
                ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
                : ''
            }
          />
        </div>
      ) : (
        <HistoryTar
          historyData={getFilteredHistory()}
          historyTotals={historyTotals}
          tarHistoryLoading={tarHistoryLoading}
          dateRange={dateRange}
          historyColumns={getHistoryTarColumns(alertRules)}
        />
      )}

      {/* Add Modal */}
      <AddTarModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalCards={modalCards}
        handleRemoveCard={handleRemoveCard}
        handleCardChange={handleCardChange}
        getModalScaleProps={getModalScaleProps}
        getGoldAvailableWeight={getGoldAvailableWeight}
        handleSaveCard={handleSaveCard}
      />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Save
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this tar entry? This will move to
                the{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  Box Department
                </strong>
                .
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSaveIndex(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <GenericButton size="sm"
                  onClick={confirmSave}
                  disabled={isLoading}
                  variant="primary"
                >
                  {isLoading ? 'Saving...' : 'Confirm & Continue'}
                </GenericButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Stock Modal */}
      {showStockErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-[#d3c4af]/20 bg-red-50/80 px-5 py-3.5 dark:border-slate-700 dark:bg-red-950/30">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-[#1a1c1b] dark:text-white">
                Insufficient Stock
              </h3>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs leading-relaxed text-[#4f4535] dark:text-slate-300">
                {stockErrorMessage ||
                  'Not enough stock available to add this tar entry.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#d3c4af]/20 bg-[#f9f9f7] px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setShowStockErrorModal(false)}
                className="rounded-lg bg-[#785600] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 dark:bg-amber-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTar;
