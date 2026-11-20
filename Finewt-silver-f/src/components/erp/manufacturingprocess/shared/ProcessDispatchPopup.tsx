import React, { useState, useEffect, useMemo } from 'react';
import { X, Layers, Plus, Trash2, ArrowRight } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import ScaleWeightField from '@/components/common/ScaleWeightField';
import GenericDropDown from '@/components/Forms/DropDown/GenericDropDown';
import toast from 'react-hot-toast';
import { useGetItems } from '@/lib/api/items';
import {
  extendTrack,
  trackOf,
  findStageCard,
  findStageRow,
  formatTrack,
  formatTrackShort,
} from '@/utils/processTrack';
import {
  useGetKarigars,
  useGetAllProcessRates,
  processRateFor,
  ProcessRates,
} from '@/lib/api/karigar';
import { useGetDesigns } from '@/lib/api/design';
import { useGetSizes } from '@/lib/api/sizes';
import {
  dispatchFromCardApi,
  finishedToStockApi,
  isServerId,
  SERVER_STAGES,
} from '@/lib/api/manufacturing';

// ----------------------------------------------------------------
// Types & Data
// ----------------------------------------------------------------
export interface ProcessDispatchItem {
  id: string;
  purity: number;
  availableWeight: number;
  Stamp?: string;
  stamp?: string;
  designName?: string;
  design?: string;
  description?: string;
  partNo?: string;
  qty?: string | number;
  size?: string;
}

export interface DynamicBharniRow {
  id: string;
  partNo: string;
  weight: string;
  karigar: string;
  rate: string;
}

export interface DynamicCuttingRow {
  id: string;
  size: string;
  qty: string;
}

export interface ProcessDispatchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: ProcessDispatchItem[];
  nextProcessOptions: string[];
  onSuccess: (payload: ProcessDispatchPayload) => void;
  /** Optional override for showing design dropdown */
  showDesign?: boolean;
}

export interface ProcessDispatchPayload {
  selectedKarigar: string;
  rate: string;
  selectedProcess: string;
  weight: number;
  itemId: string;
  purity: number;
  Stamp?: string;
  stamp?: string;
  designName?: string;
  design?: string;
  description?: string;
  partNo?: string;
  size?: string;
  qty?: string | number;
  sourceProcess?: string;
  multipleRows?: any[];
  /** Stages this item has passed through, including the one sending it */
  processTrack?: string[];
}

/** Pre-configured process-specific karigars with default rates */
export const PROCESS_KARIGARS: Record<
  string,
  { id: string; name: string; defaultRate: number }[]
> = {
  Stock: [{ id: '1', name: 'Stock Master', defaultRate: 0 }],
  Packaging: [{ id: '1', name: 'Self Packaging', defaultRate: 0 }],
};


export const formatNumberWithCommas = (
  value: number | string | undefined,
  decimals = 3,
): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return value.toString();
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/** Karigars for a process: Karigar Master first, then older saved/default lists */
export function getKarigarsForProcess(
  processName: string,
  masterKarigars: { id: string; name: string; processType?: string; rate?: string }[] = [],
  processRates?: ProcessRates,
) {
  // A karigar's own rate wins; otherwise the process common rate from the Karigar Master
  const commonRate = processRateFor(processRates, processName);
  const pKey = processName.trim();
  const lowerKey = pKey.toLowerCase();
  let baseList: { id: string; name: string; defaultRate: number }[] = masterKarigars
    .filter((k) => String(k.processType || '').toLowerCase() === lowerKey)
    .map((k) => ({ id: k.id, name: k.name, defaultRate: Number(k.rate) || commonRate }));

  if (baseList.length > 0) {
    const selfObj = { id: 'self', name: 'Self', defaultRate: 0 };
    return [selfObj, ...baseList.filter((k) => k.name.toLowerCase() !== 'self')];
  }

  try {
    const customStorage = localStorage.getItem(`chain_${lowerKey}_karigars_v1`);
    if (customStorage) {
      const parsed = JSON.parse(customStorage);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseList = parsed.map((k: any, idx: number) => ({
          id: k.id || `k-${idx}`,
          name: k.name,
          defaultRate: Number(k.rate) || 0,
        }));
      }
    }
  } catch (e) {
    // fallback
  }

  if (baseList.length === 0) {
    baseList =
      PROCESS_KARIGARS[pKey] ||
      PROCESS_KARIGARS[
      Object.keys(PROCESS_KARIGARS).find(
        (k) => k.toLowerCase() === lowerKey,
      ) || ''
      ] || [];
  }

  // Ensure 'Self' option is always present as the first option with defaultRate: 0
  const selfObj = { id: 'self', name: 'Self', defaultRate: 0 };
  const others = baseList.filter((k) => k.name.toLowerCase() !== 'self');
  return [selfObj, ...others];
}

/** Map of process name -> localStorage table keys */
export const PROCESS_TABLE_MAP: Record<string, string[]> = {
  Melting: ['chain_melting_process_entries_v2', 'chain_melting_process_entries_v1'],
  Company: ['chain_company_process_entries_v2', 'chain_company_process_entries_v1'],
  Press: ['chain_press_process_entries_v2', 'chain_press_process_entries_v1'],
  Sutt: ['chain_sutt_process_entries_v2', 'chain_sutt_process_entries_v1'],
  Wash: ['chain_wash_process_entries_v2', 'chain_wash_process_entries_v1'],
  Cutting: ['chain_cutting_process_entries_v2', 'chain_cutting_process_entries_v1'],
  Bharni: ['chain_bharni_process_entries_v2', 'chain_bharni_process_entries_v1'],
  Soldering: ['chain_soldering_process_entries_v2', 'chain_soldering_process_entries_v1'],
  Polishing: ['chain_polishing_process_entries_v2', 'chain_polishing_process_entries_v1'],
  Meena: ['chain_meena_process_entries_v2', 'chain_meena_process_entries_v1'],
  Tass: ['chain_tass_process_entries_v2', 'chain_tass_process_entries_v1'],
  Vibrator: ['chain_vibrator_process_entries_v2', 'chain_vibrator_process_entries_v1'],
  Stock: ['chain_stock_entries_v2', 'chain_stock_master_items'],
  Packaging: ['chain_packaging_entries_v2'],
};

/** Dispatch stock to a configured next process table */
export function dispatchToProcess(payload: ProcessDispatchPayload): void {
  if (SERVER_STAGES.has(payload.selectedProcess)) return;
  try {
    const tableNames =
      PROCESS_TABLE_MAP[payload.selectedProcess] || [
        `chain_${payload.selectedProcess.toLowerCase()}_process_entries_v2`,
      ];
    const key = payload.selectedProcess.toLowerCase();
    const processTrack = payload.processTrack || [];
    // Bharni groups rows by batch; without an id, two sends in the same minute
    // (same purity/stamp) would merge into one group, so Bharni always gets one
    const batchId =
      payload.multipleRows &&
      (payload.multipleRows.length > 1 || payload.selectedProcess === 'Bharni')
        ? `${key}-batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        : undefined;
    // The popup shows the rate as an amount for this weight; stage tables expect ₹ per kg
    const ratePerKg = (amount: unknown, wt: number) => {
      const a = parseFloat(String(amount ?? '')) || 0;
      return wt > 0 ? Math.round(((a * 1000) / wt) * 100) / 100 : 0;
    };

    // If multiple rows are provided (for Bharni or Cutting dynamic rows)
    const entriesToAdd =
      payload.multipleRows && payload.multipleRows.length > 0
        ? payload.multipleRows.map((r, idx) => ({
          id: `${key}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          srNo: 1,
          dateTime: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          createdAt: new Date().toISOString(),
          purity: payload.purity,
          Stamp: r.stamp || payload.Stamp || payload.stamp || '',
          stamp: r.stamp || payload.Stamp || payload.stamp || '',
          grossWt: parseFloat(r.weight) || 0,
          netWeight: parseFloat(r.weight) || 0,
          netWeightGiven: parseFloat(r.weight) || 0,
          chainWeight: parseFloat(r.weight) || 0,
          chainGiven: parseFloat(r.weight) || 0,
          karigar: r.karigar || payload.selectedKarigar,
          rate: r.rate !== undefined && r.rate !== '' ? r.rate : ratePerKg(payload.rate, payload.weight),
          designName: r.design || payload.designName || payload.design || '',
          design: r.design || payload.designName || payload.design || '',
          size: r.size || payload.size || '',
          qty: r.qty || payload.qty || '',
          qtyGiven: r.qty || payload.qty || '',
          partNo: r.partNo || payload.partNo || '',
          particular:
            r.design ||
            r.stamp ||
            r.description ||
            payload.designName ||
            payload.design ||
            payload.Stamp ||
            `${payload.selectedProcess} Item`,
          description:
            r.description ||
            payload.description ||
            payload.designName ||
            payload.design ||
            payload.Stamp ||
            `${payload.selectedProcess} Item`,
          expectedFine:
            Math.round(
              (parseFloat(r.weight) || 0) * (payload.purity / 100) * 1000,
            ) / 1000,
          fineWeight: 0,
          scrapWeight: 0,
          loss: 0,
          status: 'pending',
          isCompleted: false,
          isEditing: true,
          isSaved: false,
          sourceProcess: payload.sourceProcess || '',
          processTrack,
          ...(batchId ? { batchId } : {}),
        }))
        : [
          {
            id: `${key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            srNo: 1,
            dateTime: new Date().toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            createdAt: new Date().toISOString(),
            purity: payload.purity,
            Stamp: payload.Stamp || payload.stamp || '',
            stamp: payload.Stamp || payload.stamp || '',
            grossWt: payload.weight,
            netWeight: payload.weight,
            netWeightGiven: payload.weight,
            chainWeight: payload.weight,
            chainGiven: payload.weight,
            karigar: payload.selectedKarigar,
            rate: ratePerKg(payload.rate, payload.weight),
            designName: payload.designName || payload.design || '',
            design: payload.designName || payload.design || '',
            size: payload.size || '',
            qty: payload.qty || '',
            qtyGiven: payload.qty || '',
            partNo: payload.partNo || '',
            particular:
              payload.designName ||
              payload.design ||
              payload.Stamp ||
              payload.description ||
              `${payload.selectedProcess} Item`,
            description:
              payload.description ||
              payload.designName ||
              payload.design ||
              payload.Stamp ||
              `${payload.selectedProcess} Item`,
            expectedFine:
              Math.round(payload.weight * (payload.purity / 100) * 1000) /
              1000,
            fineWeight: 0,
            scrapWeight: 0,
            loss: 0,
            status: 'pending',
            isCompleted: false,
            isEditing: true,
            isSaved: false,
            sourceProcess: payload.sourceProcess || '',
            processTrack,
          },
        ];

    tableNames.forEach((tableName) => {
      try {
        const existing = localStorage.getItem(tableName);
        const currentEntries = existing ? JSON.parse(existing) : [];
        const updated = [
          ...entriesToAdd.map((e, idx) => ({
            ...e,
            srNo: currentEntries.length + idx + 1,
          })),
          ...currentEntries,
        ];
        localStorage.setItem(tableName, JSON.stringify(updated));
      } catch (err) { }
    });

    // The item goes into the next process TABLE only. That process creates its own
    // stock card when the row is saved there (no card is created on dispatch).
  } catch (e) { }
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
const ProcessDispatchPopup: React.FC<ProcessDispatchPopupProps> = ({
  isOpen,
  onClose,
  title,
  items,
  nextProcessOptions = [],
  onSuccess,
  showDesign: propShowDesign,
}) => {
  const [selectedProcess, setSelectedProcess] = useState('');
  const [selectedKarigar, setSelectedKarigar] = useState('');
  const [rate, setRate] = useState('');
  const [stamp, setStamp] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDesign, setSelectedDesign] = useState('');
  // Wash picks a size (from the Size Master) instead of a design
  const [selectedSize, setSelectedSize] = useState('');
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic rows for Sutt -> Bharni
  const [bharniRows, setBharniRows] = useState<DynamicBharniRow[]>([
    { id: `bharni-row-1`, partNo: '', weight: '', karigar: 'Self', rate: '0' },
  ]);

  // Dynamic rows for Cutting Size & Quantity Breakdown
  const [cuttingRows, setCuttingRows] = useState<DynamicCuttingRow[]>([
    { id: `cutting-row-1`, size: '', qty: '' },
  ]);

  const { data: rawItemsData = [] } = useGetItems();
  const { data: masterKarigars = [] } = useGetKarigars();
  const { data: processRates } = useGetAllProcessRates();
  const { data: masterDesigns = [] } = useGetDesigns();
  const { data: rawSizesData = [] } = useGetSizes();
  const masterSizes: string[] = useMemo(() => {
    const list = Array.isArray((rawSizesData as any)?.data)
      ? (rawSizesData as any).data
      : Array.isArray(rawSizesData)
        ? rawSizesData
        : [];
    return list.map((sz: any) => String(sz.size || sz.name || '').trim()).filter(Boolean);
  }, [rawSizesData]);

  const itemsList = useMemo(() => {
    const list = Array.isArray((rawItemsData as any)?.data)
      ? (rawItemsData as any).data
      : Array.isArray(rawItemsData)
        ? rawItemsData
        : [];
    return list;
  }, [rawItemsData]);

  const item = items[0] ?? null;

  // Route so far, shown in the header (same rule as when sending)
  const headerTrack = useMemo(() => {
    if (!item) return [] as string[];
    const st = title.replace(/\s*Process$/i, '').trim();
    const rec = isServerId(item.id)
      ? { processTrack: [st] }
      : findStageCard(st, item.id) || findStageRow(st, item.id) || item;
    return extendTrack(trackOf(rec), st);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, title, isOpen]);

  // Designs available only for: Bharni, Soldering, Polishing, Vibrator
  const isDesignProcess = useMemo(() => {
    if (propShowDesign !== undefined) return propShowDesign;
    return ['Bharni', 'Soldering', 'Polishing', 'Vibrator', 'Tass', 'Meena'].includes(
      selectedProcess,
    );
  }, [selectedProcess, propShowDesign]);

  const isStockOrPackagingProcess = useMemo(() => {
    return ['Stock', 'Packaging'].includes(selectedProcess);
  }, [selectedProcess]);

  // Stages with their own tab in the Design Master only offer their own designs
  const DESIGN_MASTER_STAGES = ['BHARNI', 'CUTTING', 'POLISHING', 'SOLDERING', 'VIBRATOR'];
  const targetDesignKey = (selectedProcess || '').trim().toUpperCase();
  const hasOwnDesigns = DESIGN_MASTER_STAGES.includes(targetDesignKey);

  const designOptions = useMemo(() => {
    const set = new Set<string>();
    if (hasOwnDesigns) {
      masterDesigns
        .filter((d) => String(d.process || '').toUpperCase() === targetDesignKey)
        .forEach((d) => d.name && set.add(d.name));
    } else {
      if (item?.designName) set.add(item.designName);
      itemsList.forEach((it: any) => {
        const name = String(it.name || it.item || '').trim();
        if (name && name.toLowerCase() !== 'gold') set.add(name);
      });
      masterDesigns.forEach((d) => d.name && set.add(d.name));
    }
    return Array.from(set).map((d) => ({ value: d, label: d }));
  }, [itemsList, item?.designName, masterDesigns, hasOwnDesigns, targetDesignKey]);

  // A design carried over from the previous stage that is not in this stage's list is cleared
  useEffect(() => {
    if (!hasOwnDesigns || !selectedDesign) return;
    if (!designOptions.some((o) => o.value === selectedDesign)) setSelectedDesign('');
  }, [hasOwnDesigns, designOptions, selectedDesign]);

  const sizeOptions = useMemo(() => {
    return masterSizes.map((sz) => ({ value: sz, label: sz }));
  }, [masterSizes]);

  // Karigars list dynamically based on target selectedProcess
  const karigarsList = useMemo(() => {
    if (!selectedProcess) return [];
    return getKarigarsForProcess(selectedProcess, masterKarigars, processRates);
  }, [selectedProcess, masterKarigars, processRates]);

  const karigarOptions = useMemo(() => {
    return karigarsList.map((k) => ({
      value: k.name,
      label: k.name,
    }));
  }, [karigarsList]);

  // Find selected karigar object and base rate per KG
  const selectedKarigarObj = useMemo(() => {
    return karigarsList.find((x) => x.name === selectedKarigar);
  }, [karigarsList, selectedKarigar]);

  const baseKarigarRate = selectedKarigarObj ? selectedKarigarObj.defaultRate : 0;

  // Handle process change
  const handleProcessChange = (proc: string) => {
    setSelectedProcess(proc);
    const kList = getKarigarsForProcess(proc, masterKarigars, processRates);
    if (kList.length > 0) {
      const firstK = kList[0];
      setSelectedKarigar(firstK.name);
      if (firstK.name.toLowerCase() === 'self') {
        setRate('0');
      } else {
        const numWt = parseFloat(weight) || 0;
        if (firstK.defaultRate > 0 && numWt > 0) {
          setRate(((firstK.defaultRate * numWt) / 1000).toFixed(2));
        } else {
          setRate(firstK.defaultRate.toString());
        }
      }
    } else {
      setSelectedKarigar('');
      setRate('');
    }
  };

  const handleKarigarChange = (kName: string) => {
    setSelectedKarigar(kName);
    if (kName.toLowerCase() === 'self') {
      setRate('0');
      return;
    }
    const k = karigarsList.find((x) => x.name === kName);
    if (k) {
      const numWt = parseFloat(weight) || 0;
      if (k.defaultRate > 0 && numWt > 0) {
        setRate(((k.defaultRate * numWt) / 1000).toFixed(2));
      } else {
        setRate(k.defaultRate.toString());
      }
    }
  };

  const handleWeightChange = (newWt: string) => {
    if (newWt === '' || /^\d*\.?\d{0,3}$/.test(newWt)) {
      setWeight(newWt);
      if (selectedKarigar && selectedKarigar.toLowerCase() !== 'self') {
        const k = karigarsList.find((x) => x.name === selectedKarigar);
        const baseRate = k ? k.defaultRate : 0;
        const numWt = parseFloat(newWt) || 0;
        if (baseRate > 0 && numWt > 0) {
          setRate(((baseRate * numWt) / 1000).toFixed(2));
        } else if (baseRate > 0) {
          setRate(baseRate.toString());
        }
      }
    }
  };

  const handleDesignChange = (designVal: string) => {
    setSelectedDesign(designVal);
  };

  // Reset/Initialize state when opening
  const nextProcessOptionsKey = nextProcessOptions.join(',');
  const itemId = item?.id || '';

  useEffect(() => {
    if (!isOpen) {
      setSelectedProcess('');
      setSelectedKarigar('');
      setRate('');
      setStamp('');
      setDescription('');
      setSelectedDesign('');
      setSelectedSize('');
      setWeight('');
      setBharniRows([{ id: `bharni-row-1`, partNo: '', weight: '', karigar: 'Self', rate: '0' }]);
      setCuttingRows([
        { id: `cutting-row-1`, size: '', qty: '' },
      ]);
      return;
    }

    const initialProc =
      nextProcessOptions.length === 1 ? nextProcessOptions[0] : '';
    let kName = '';
    let kRate = '';

    if (initialProc) {
      setSelectedProcess(initialProc);
      const kList = getKarigarsForProcess(initialProc, masterKarigars, processRates);
      if (kList.length > 0) {
        const firstK = kList[0];
        kName = firstK.name;
        if (firstK.name.toLowerCase() === 'self') {
          kRate = '0';
        } else {
          const numWt = item?.availableWeight ? Number(item.availableWeight) : 0;
          if (firstK.defaultRate > 0 && numWt > 0) {
            kRate = ((firstK.defaultRate * numWt) / 1000).toFixed(2);
          } else {
            kRate = firstK.defaultRate.toString();
          }
        }
      }
    } else {
      setSelectedProcess('');
    }

    setSelectedKarigar(kName);
    setRate(kRate);

    if (item) {
      setStamp(item.Stamp || item.stamp || '');
      setDescription(item.description || item.designName || item.design || '');
      setSelectedDesign(item.designName || item.design || item.description || '');
      setSelectedSize(item.size ? String(item.size) : '');
      setWeight(item.availableWeight ? item.availableWeight.toString() : '');
      setBharniRows([
        {
          id: `bharni-row-1`,
          partNo: '',
          weight: item.availableWeight ? item.availableWeight.toString() : '',
          karigar: 'Self',
          rate: '0',
        },
      ]);
      setCuttingRows([
        {
          id: `cutting-row-1`,
          size: item.size || '',
          qty: item.qty ? String(item.qty) : '',
        },
      ]);
    }
  }, [isOpen, nextProcessOptionsKey, itemId]);

  // Bharni Row handlers
  const handleAddBharniRow = () => {
    const defaultKarigar = karigarsList.length > 0 ? karigarsList[0].name : 'Self';
    const defaultRate =
      karigarsList.length > 0 && karigarsList[0].name.toLowerCase() !== 'self'
        ? karigarsList[0].defaultRate.toString()
        : '0';
    setBharniRows((prev) => [
      ...prev,
      {
        id: `bharni-row-${Date.now()}-${Math.random()}`,
        partNo: '',
        weight: '',
        karigar: defaultKarigar,
        rate: defaultRate,
      },
    ]);
  };

  const handleRemoveBharniRow = (id: string) => {
    setBharniRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );
  };

  const handleUpdateBharniRow = (
    id: string,
    field: keyof DynamicBharniRow,
    val: string,
  ) => {
    if (field === 'weight' && val !== '' && !/^\d*\.?\d{0,3}$/.test(val)) return;
    if (field === 'rate' && val !== '' && !/^\d*\.?\d{0,2}$/.test(val)) return;
    setBharniRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === 'karigar') {
          const kObj = karigarsList.find((k) => k.name === val);
          const newRate =
            val.toLowerCase() === 'self'
              ? '0'
              : kObj
                ? kObj.defaultRate.toString()
                : r.rate;
          return { ...r, karigar: val, rate: newRate };
        }
        return { ...r, [field]: val };
      }),
    );
  };

  // Cutting Row handlers
  const handleAddCuttingRow = () => {
    setCuttingRows((prev) => [
      ...prev,
      {
        id: `cutting-row-${Date.now()}-${Math.random()}`,
        size: masterSizes[prev.length % (masterSizes.length || 1)] || '',
        qty: '1',
      },
    ]);
  };

  const handleRemoveCuttingRow = (id: string) => {
    setCuttingRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );
  };

  const handleUpdateCuttingRow = (
    id: string,
    field: keyof DynamicCuttingRow,
    val: string,
  ) => {
    if (field === 'qty' && val !== '' && !/^\d*$/.test(val)) return;
    setCuttingRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    );
  };

  // Compute total weight
  const totalBharniWeight = useMemo(() => {
    return bharniRows.reduce(
      (sum, r) => sum + (parseFloat(r.weight) || 0),
      0,
    );
  }, [bharniRows]);

  // Send a server-side stock card to the next process (weight is checked and deducted there)
  const sendCardToServer = async (payload: ProcessDispatchPayload) => {
    const karigarIdOf = (name?: string) => {
      const k = getKarigarsForProcess(payload.selectedProcess, masterKarigars, processRates).find(
        (x) => x.name === name,
      );
      return k && isServerId(k.id) ? k.id : undefined;
    };
    const rowDetails = (r: any) => ({
      design: r.design || '',
      designName: r.design || '',
      description: r.description || '',
      partNo: r.partNo || '',
      size: r.size || '',
      qty: r.qty || '',
      qtyGiven: r.qty || '',
    });
    await dispatchFromCardApi({
      cardId: payload.itemId,
      toProcess: payload.selectedProcess,
      weight: payload.weight,
      karigarId: karigarIdOf(payload.selectedKarigar),
      karigarName: payload.selectedKarigar,
      rate: payload.weight > 0 ? Math.round(((Number(payload.rate) || 0) * 100000) / payload.weight) / 100 : 0,
      stamp: payload.Stamp || payload.stamp || undefined,
      particular: payload.designName || payload.description || undefined,
      details: rowDetails({
        design: payload.designName,
        description: payload.description,
        partNo: payload.partNo,
        size: payload.size,
        qty: payload.qty,
      }),
      rows: payload.multipleRows?.map((r: any) => ({
        weight: parseFloat(r.weight) || 0,
        karigarId: karigarIdOf(r.karigar),
        karigarName: r.karigar || payload.selectedKarigar,
        rate: Number(r.rate ?? payload.rate) || 0,
        stamp: r.stamp || undefined,
        particular: r.design || r.description || undefined,
        details: rowDetails(r),
      })),
    });
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedProcess) {
      toast.error('Please select a Target Process.');
      return;
    }
    if (!isStockOrPackagingProcess && selectedProcess !== 'Bharni' && !selectedKarigar) {
      toast.error('Please select a Karigar.');
      return;
    }
    if (!item) {
      toast.error('No item selected.');
      return;
    }

    const available = Number(item.availableWeight) || 0;

    let finalWeight = 0;
    let multipleRowsData: any[] | undefined = undefined;

    if (selectedProcess === 'Bharni') {
      finalWeight = totalBharniWeight;
      if (finalWeight <= 0) {
        toast.error('Please enter valid weights for Bharni rows.');
        return;
      }
      if (finalWeight > available) {
        toast.error(`Total weight (${finalWeight}g) exceeds Available (${available}g).`);
        return;
      }
      if (!selectedDesign) {
        toast.error('Please select a Design.');
        return;
      }
      multipleRowsData = bharniRows.map((r) => ({
        design: selectedDesign,
        partNo: r.partNo,
        weight: r.weight,
        karigar: r.karigar || 'Self',
        rate: r.rate || '0',
        stamp: stamp || item.Stamp || '',
        description: description || '',
      }));
    } else if (selectedProcess === 'Cutting') {
      finalWeight = parseFloat(weight) || 0;
      if (finalWeight <= 0) {
        toast.error('Given Wt must be greater than 0.');
        return;
      }
      if (finalWeight > available) {
        toast.error(`Given Wt cannot exceed Available Qty (${available}g).`);
        return;
      }
      // One Cutting row for the given weight; several sizes are kept as a breakdown
      // (one row per size would repeat the full weight on every row)
      const sizeRows = cuttingRows.filter((r) => String(r.size || '').trim() || String(r.qty || '').trim());
      const totalQty = sizeRows.reduce((s, r) => s + (parseInt(String(r.qty), 10) || 0), 0);
      multipleRowsData = [
        {
          stamp: stamp || item.Stamp || item.stamp || '',
          description: description || '',
          design: selectedDesign || item.designName || item.design || description || '',
          size:
            sizeRows.length > 1
              ? sizeRows.map((r) => `${r.size || '-'}${r.qty ? ` × ${r.qty}` : ''}`).join(', ')
              : sizeRows[0]?.size || '',
          qty: totalQty > 0 ? totalQty : sizeRows[0]?.qty || '',
          weight: finalWeight,
        },
      ];
    } else {
      finalWeight = parseFloat(weight) || 0;
      if (finalWeight <= 0) {
        toast.error('Given Wt must be greater than 0.');
        return;
      }
      if (finalWeight > available) {
        toast.error(`Given Wt cannot exceed Available Qty (${available}g).`);
        return;
      }
    }

    // Track so far: the source card's (or row's) track plus the sending stage
    const sourceStage = title.replace(/\s*Process$/i, '').trim();
    const sourceRecord =
      isServerId(item.id)
        ? { processTrack: [sourceStage] }
        : findStageCard(sourceStage, item.id) || findStageRow(sourceStage, item.id) || item;
    const trackSoFar = extendTrack(trackOf(sourceRecord), sourceStage);

    setIsSubmitting(true);
    try {
      const payload: ProcessDispatchPayload = {
        processTrack: trackSoFar,
        selectedKarigar:
          selectedKarigar ||
          (selectedProcess === 'Stock'
            ? 'Stock Master'
            : selectedProcess === 'Packaging'
              ? 'Self Packaging'
              : 'Self'),
        rate: isStockOrPackagingProcess ? '0' : rate,
        selectedProcess,
        weight: finalWeight,
        itemId: item.id,
        purity: item.purity,
        Stamp: stamp || item.Stamp || item.stamp || '',
        stamp: stamp || item.Stamp || item.stamp || '',
        description: description || item.description || item.designName || item.design || '',
        designName: selectedDesign || item.designName || item.design || description || item.description || '',
        design: selectedDesign || item.designName || item.design || description || item.description || '',
        qty: item.qty || (cuttingRows.length > 0 ? cuttingRows[0].qty : undefined),
        size:
          selectedSize ||
          item.size ||
          (cuttingRows.length > 0 ? cuttingRows[0].size : undefined),
        sourceProcess: title,
        multipleRows: multipleRowsData,
      };

      if (isServerId(item.id)) {
        await sendCardToServer(payload);
      }
      // Finished goods to Stock: Inward on the Stocks page, item = design name
      if (selectedProcess === 'Stock') {
        const designName = (payload.designName || payload.description || '').trim();
        if (!designName) {
          toast.error('Please select a Design to add this to Stock.');
          setIsSubmitting(false);
          return;
        }
        await finishedToStockApi({
          designName,
          size: payload.size ? String(payload.size) : undefined,
          stamp: payload.Stamp || payload.stamp || undefined,
          purity: Number(payload.purity) || 0,
          weight: payload.weight,
          sourceProcess: title.replace(/\s*Process$/i, ''),
          processTrack: trackSoFar,
          kind: 'LOOSE',
        });
      }
      dispatchToProcess(payload);
      onSuccess(payload);
      toast.success(
        selectedProcess === 'Stock'
          ? 'Sent to Loose Stock (Stocks page → Loose Stock tab)'
          : `Successfully sent to ${selectedProcess} Process!`,
      );
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const processOptions = nextProcessOptions.map((opt) => ({
    value: opt,
    label: opt === 'Stock' ? 'Loose Stock' : opt,
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-xl flex max-h-[90vh] flex-col rounded-2xl border border-[#d3c4af]/30 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                Process Dispatch
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-[#4f4535] dark:text-slate-300">
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  Track:
                </span>
                <span className="font-semibold">
                  {headerTrack.length > 0
                    ? formatTrack(headerTrack)
                    : `From ${title.replace(' Process', '')} Process`}
                </span>
                {selectedProcess && (
                  <>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedProcess === 'Stock' ? 'Loose Stock' : selectedProcess}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Step 1: Select Process First */}
          <div className="rounded-xl border border-[#d3c4af]/40 bg-[#fdfbf7] p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
              1. Select Target Process <span className="text-red-500">*</span>
            </label>
            {nextProcessOptions.length === 1 ? (
              <div className="flex items-center justify-between rounded-lg border border-[#d3c4af]/50 bg-amber-50/50 px-3 py-2 text-xs font-bold text-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300">
                <span>{nextProcessOptions[0]} Process</span>
                <span className="text-[10px] font-normal uppercase tracking-wider text-[#a08447]">
                  (Direct Next Step)
                </span>
              </div>
            ) : (
              <GenericDropDown
                options={processOptions}
                value={selectedProcess}
                onChange={handleProcessChange}
                placeholder="Choose Next Process..."
                className="w-full text-xs font-semibold"
              />
            )}
          </div>

          {/* After Process Selection: Show Purity, Weight Info & Form Fields */}
          {selectedProcess ? (
            <div className="rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 space-y-3.5">
              {/* Purity & Available Weight Banner */}
              {item && (
                <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-[#785600] dark:bg-amber-900/30 dark:text-amber-300">
                  <span className="font-bold">
                    Purity: {item.purity}%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleWeightChange(item.availableWeight.toString());
                      if (bharniRows.length === 1) {
                        handleUpdateBharniRow(bharniRows[0].id, 'weight', item.availableWeight.toString());
                      }
                      if (cuttingRows.length === 1) {
                        setCuttingRows([
                          {
                            ...cuttingRows[0],
                            qty: cuttingRows[0].qty || '1',
                          },
                        ]);
                      }
                    }}
                    className="flex items-center gap-1 font-bold underline hover:opacity-80 cursor-pointer"
                    title="Click to fill all available weight"
                  >
                    Available:{' '}
                    {formatNumberWithCommas(item.availableWeight, 3)} G
                  </button>
                </div>
              )}

              {/* Same confirmation summary for every target process */}
              {item && !isStockOrPackagingProcess && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-xs sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="min-w-0">
                    <span className="block text-[10px] text-gray-500">Design</span>
                    <span className="block truncate font-semibold text-[#1a1c1b] dark:text-white">
                      {selectedDesign || item.designName || item.design || item.description || '-'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-gray-500">Stamp</span>
                    <span className="block truncate font-mono font-semibold text-[#1a1c1b] dark:text-white">
                      {stamp || item.stamp || item.Stamp || '-'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-gray-500">Size</span>
                    <span className="block truncate font-semibold text-[#1a1c1b] dark:text-white">
                      {selectedSize || item.size || '-'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] text-gray-500">Qty</span>
                    <span className="block truncate font-semibold text-[#1a1c1b] dark:text-white">
                      {item.qty ? `${item.qty} Pcs` : '-'}
                    </span>
                  </div>
                </div>
              )}

              {/* ---------------- Case A: Sutt -> Bharni Multi-Row ---------------- */}
              {selectedProcess === 'Bharni' ? (
                <div className="space-y-3">
                  {/* Common Design, Stamp & Description */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        Design <span className="text-red-500">*</span>
                      </label>
                      <GenericDropDown
                        options={designOptions}
                        value={selectedDesign}
                        onChange={(val) => setSelectedDesign(val)}
                        placeholder="Select Design"
                        className="w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        Stamp
                      </label>
                      <GenericInputField
                        type="text"
                        value={stamp}
                        onChange={(e) => setStamp(e.target.value)}
                        placeholder="e.g. 92.5"
                        compact
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        Description
                      </label>
                      <GenericInputField
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                        compact
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* BHARNI ITEMS BREAKDOWN Table */}
                  <div className="space-y-2 pt-1 border-t border-[#d3c4af]/20">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                      BHARNI ITEMS BREAKDOWN
                    </h5>

                    <div className="overflow-x-auto rounded-xl border border-[#d3c4af]/30 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900/50">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f7f5f0] text-[#4f4535] dark:bg-slate-800/80 dark:text-slate-300 border-b border-[#d3c4af]/20">
                          <tr>
                            <th className="py-2.5 px-2.5 text-center text-[10px] font-bold uppercase tracking-wider w-10">
                              SR NO.
                            </th>
                            <th className="py-2.5 px-2.5 text-[10px] font-bold uppercase tracking-wider">
                              PART NO
                            </th>

                            <th className="py-2.5 px-2.5 text-[10px] font-bold uppercase tracking-wider">
                              BHARNI KARIGAR
                            </th>
                            <th className="py-2.5 px-2.5 text-[10px] font-bold uppercase tracking-wider w-28">
                              WEIGHT (G)
                            </th>
                            <th className="py-2.5 px-2.5 text-[10px] font-bold uppercase tracking-wider w-24">
                              RATE (RS)
                            </th>
                            <th className="py-2.5 px-2.5 text-center text-[10px] font-bold uppercase tracking-wider w-16">
                              ACTION
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
                          {bharniRows.map((r, idx) => (
                            <tr
                              key={r.id}
                              className="hover:bg-amber-50/20 dark:hover:bg-slate-800/50"
                            >
                              <td className="py-2.5 px-2.5 text-center font-bold text-[#785600] dark:text-amber-400">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-2.5">
                                <GenericInputField
                                  type="text"
                                  value={r.partNo}
                                  onChange={(e) =>
                                    handleUpdateBharniRow(r.id, 'partNo', e.target.value)
                                  }
                                  placeholder="Part No"
                                  compact
                                  className="text-xs"
                                />
                              </td>

                              <td className="py-2 px-2.5">
                                <GenericDropDown
                                  options={karigarOptions}
                                  value={r.karigar || 'Self'}
                                  onChange={(val) =>
                                    handleUpdateBharniRow(r.id, 'karigar', val)
                                  }
                                  placeholder="Select Karigar"
                                  className="w-full text-xs"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <GenericInputField
                                  type="text"
                                  inputMode="decimal"
                                  value={r.weight}
                                  onChange={(e) =>
                                    handleUpdateBharniRow(r.id, 'weight', e.target.value)
                                  }
                                  placeholder="0.000"
                                  suffix="G"
                                  compact
                                  className="font-mono font-bold text-xs"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <GenericInputField
                                  type="text"
                                  inputMode="decimal"
                                  value={r.rate}
                                  onChange={(e) =>
                                    handleUpdateBharniRow(r.id, 'rate', e.target.value)
                                  }
                                  placeholder="0"
                                  compact
                                  className="font-mono text-xs"
                                />
                              </td>
                              <td className="py-2.5 px-2.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {idx === bharniRows.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={handleAddBharniRow}
                                      className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                                      title="Add Item"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  )}
                                  {bharniRows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveBharniRow(r.id)}
                                      className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                      title="Remove Item"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-[#785600] dark:bg-amber-950/30 dark:text-amber-300">
                      <span>Total Bharni Wt:</span>
                      <span>{formatNumberWithCommas(totalBharniWeight, 3)} G</span>
                    </div>
                  </div>
                </div>
              ) : selectedProcess === 'Cutting' ? (
                /* ---------------- Case B: Cutting Process Layout ---------------- */
                <div className="space-y-3">
                  {/* Row 1: Karigar + Given Wt + Rate on ONE LINE */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.3fr_1fr_1fr]">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        {selectedProcess} Karigar <span className="text-red-500">*</span>
                      </label>
                      <GenericDropDown
                        options={karigarOptions}
                        value={selectedKarigar}
                        onChange={handleKarigarChange}
                        placeholder={`Select Karigar`}
                        className="w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        Given Wt (G) <span className="text-red-500">*</span>
                      </label>
                      <ScaleWeightField
                        onScaleWeight={(w) => handleWeightChange(String(w))}
                        type="text"
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => handleWeightChange(e.target.value)}
                        placeholder="0.000"
                        suffix="G"
                        compact
                        className="font-mono font-bold text-black dark:text-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Rate (Rs)
                        </label>
                        {baseKarigarRate > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400" title="Fixed Base Rate per KG">
                            ₹{baseKarigarRate}/KG
                          </span>
                        )}
                      </div>
                      <GenericInputField
                        type="text"
                        inputMode="decimal"
                        value={rate}
                        onChange={(e) => {
                          if (
                            e.target.value === '' ||
                            /^\d*\.?\d{0,2}$/.test(e.target.value)
                          )
                            setRate(e.target.value);
                        }}
                        placeholder="e.g. 15"
                        compact
                        className="font-mono"
                      />
                    </div>
                  </div>

                  {/* Row 2: Stamp & Description */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        Stamp
                      </label>
                      <GenericInputField
                        type="text"
                        value={stamp}
                        onChange={(e) => setStamp(e.target.value)}
                        placeholder="e.g. 92.5"
                        compact
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                        Description
                      </label>
                      <GenericInputField
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description"
                        compact
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* SIZE & QUANTITY BREAKDOWN Table */}
                  <div className="space-y-2 pt-1 border-t border-[#d3c4af]/20">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                      SIZE &amp; QUANTITY BREAKDOWN
                    </h5>

                    <div className="overflow-x-auto rounded-xl border border-[#d3c4af]/30 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900/50">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f7f5f0] text-[#4f4535] dark:bg-slate-800/80 dark:text-slate-300 border-b border-[#d3c4af]/20">
                          <tr>
                            <th className="py-2.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider w-14">
                              SR NO.
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                              SIZE SELECT
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                              QTY ENTER
                            </th>
                            <th className="py-2.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider w-16">
                              ACTION
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d3c4af]/15 dark:divide-slate-800">
                          {cuttingRows.map((r, idx) => (
                            <tr
                              key={r.id}
                              className="hover:bg-[#fbfaf8] dark:hover:bg-slate-800/40"
                            >
                              <td className="py-2 px-3 text-center font-bold text-[#785600] dark:text-amber-400">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <GenericDropDown
                                  options={sizeOptions}
                                  value={r.size}
                                  onChange={(val) =>
                                    handleUpdateCuttingRow(r.id, 'size', val)
                                  }
                                  placeholder="Size"
                                  className="w-full text-xs"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <GenericInputField
                                  type="text"
                                  inputMode="numeric"
                                  value={r.qty}
                                  onChange={(e) =>
                                    handleUpdateCuttingRow(
                                      r.id,
                                      'qty',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Qty"
                                  compact
                                  className="text-xs font-mono font-medium"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {idx === cuttingRows.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={handleAddCuttingRow}
                                      className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                                      title="Add Size"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  )}
                                  {cuttingRows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveCuttingRow(r.id)
                                      }
                                      className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                      title="Remove Size"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* ---------------- Case C & D: Standard or Design Transfers ---------------- */
                <div className="space-y-3">
                  {isStockOrPackagingProcess ? (
                    <div className="space-y-3">
                      {/* Summary Badges of Item Data Received */}
                      <div className="rounded-xl border border-amber-200/60 bg-amber-500/10 p-3.5 text-xs dark:border-amber-700/40 dark:bg-amber-950/30">
                        <div className="mb-2 flex items-center justify-between border-b border-amber-200/50 pb-2 dark:border-amber-800/40">
                          <span className="font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
                            📦 Received Item Summary for {selectedProcess}
                          </span>
                          <span className="font-mono font-bold text-black dark:text-white">
                            {formatNumberWithCommas(weight || item?.availableWeight || 0)} G
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="text-[10px] text-gray-500 block">Design:</span>
                            <span className="font-semibold text-[#1a1c1b] dark:text-white truncate block">
                              {selectedDesign || item?.designName || item?.design || item?.description || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 block">Stamp:</span>
                            <span className="font-mono font-semibold text-[#1a1c1b] dark:text-white block">
                              {stamp || item?.stamp || item?.Stamp || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 block">Purity:</span>
                            <span className="font-mono font-semibold text-[#1a1c1b] dark:text-white block">
                              {item ? item.purity : '-'}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 block">Qty & Size:</span>
                            <span className="font-medium text-[#1a1c1b] dark:text-white block">
                              {item?.qty ? `${item.qty} Pcs` : '-'}{item?.size ? ` (${item.size})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                          Weight to Send to Stock (G) <span className="text-red-500">*</span>
                        </label>
                        <ScaleWeightField
                          onScaleWeight={(w) => handleWeightChange(String(w))}
                          type="text"
                          inputMode="decimal"
                          value={weight}
                          onChange={(e) => handleWeightChange(e.target.value)}
                          placeholder="0.000"
                          suffix="G"
                          compact
                          className="font-mono font-bold text-black dark:text-white text-base"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Stamp (शिक्का)
                          </label>
                          <GenericInputField
                            type="text"
                            value={stamp}
                            onChange={(e) => setStamp(e.target.value)}
                            placeholder="e.g. 92.5"
                            compact
                            className="text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Description (तपशील)
                          </label>
                          <GenericInputField
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            compact
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : isDesignProcess ? (
                    <>
                      {/* Row 1: Karigar -> Given Wt -> Rate on ONE LINE */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            {selectedProcess} Karigar <span className="text-red-500">*</span>
                          </label>
                          <GenericDropDown
                            options={karigarOptions}
                            value={selectedKarigar}
                            onChange={handleKarigarChange}
                            placeholder={`Select Karigar`}
                            className="w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Given Wt (G) <span className="text-red-500">*</span>
                          </label>
                          <ScaleWeightField
                            onScaleWeight={(w) => handleWeightChange(String(w))}
                            type="text"
                            inputMode="decimal"
                            value={weight}
                            onChange={(e) => handleWeightChange(e.target.value)}
                            placeholder="0.000"
                            suffix="G"
                            compact
                            className="font-mono font-bold text-black dark:text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Rate (Rs)
                            </label>
                            {baseKarigarRate > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400" title="Fixed Base Rate per KG">
                                ₹{baseKarigarRate}/KG
                              </span>
                            )}
                          </div>
                          <GenericInputField
                            type="text"
                            inputMode="decimal"
                            value={rate}
                            onChange={(e) => {
                              if (
                                e.target.value === '' ||
                                /^\d*\.?\d{0,2}$/.test(e.target.value)
                              )
                                setRate(e.target.value);
                            }}
                            placeholder="e.g. 15"
                            compact
                            className="font-mono"
                          />
                        </div>
                      </div>

                      {/* Row 2: Design -> Stamp -> Description */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {selectedProcess === 'Wash' ? (
                          <div>
                            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Size
                            </label>
                            <GenericDropDown
                              options={sizeOptions}
                              value={selectedSize}
                              onChange={(val) => setSelectedSize(String(val))}
                              placeholder="Select Size"
                              className="w-full text-xs"
                            />
                          </div>
                        ) : (
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Design
                          </label>
                          <GenericDropDown
                            options={designOptions}
                            value={selectedDesign}
                            onChange={handleDesignChange}
                            placeholder="Select Design"
                            className="w-full text-xs"
                          />
                        </div>
                        )}
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Stamp
                          </label>
                          <GenericInputField
                            type="text"
                            value={stamp}
                            onChange={(e) => setStamp(e.target.value)}
                            placeholder="e.g. 92.5"
                            compact
                            className="text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Description
                          </label>
                          <GenericInputField
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            compact
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Row 1: Karigar + Given Wt + Rate on ONE LINE */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.3fr_1fr_1fr]">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            {selectedProcess} Karigar <span className="text-red-500">*</span>
                          </label>
                          <GenericDropDown
                            options={karigarOptions}
                            value={selectedKarigar}
                            onChange={handleKarigarChange}
                            placeholder={`Select Karigar`}
                            className="w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Given Wt (G) <span className="text-red-500">*</span>
                          </label>
                          <ScaleWeightField
                            onScaleWeight={(w) => handleWeightChange(String(w))}
                            type="text"
                            inputMode="decimal"
                            value={weight}
                            onChange={(e) => handleWeightChange(e.target.value)}
                            placeholder="0.000"
                            suffix="G"
                            compact
                            className="font-mono font-bold text-black dark:text-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Rate (Rs)
                            </label>
                            {baseKarigarRate > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400" title="Fixed Base Rate per KG">
                                ₹{baseKarigarRate}/KG
                              </span>
                            )}
                          </div>
                          <GenericInputField
                            type="text"
                            inputMode="decimal"
                            value={rate}
                            onChange={(e) => {
                              if (
                                e.target.value === '' ||
                                /^\d*\.?\d{0,2}$/.test(e.target.value)
                              )
                                setRate(e.target.value);
                            }}
                            placeholder="e.g. 15"
                            compact
                            className="font-mono"
                          />
                        </div>
                      </div>

                      {/* Row 2: Stamp & Description */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Stamp
                          </label>
                          <GenericInputField
                            type="text"
                            value={stamp}
                            onChange={(e) => setStamp(e.target.value)}
                            placeholder="e.g. 92.5"
                            compact
                            className="text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                            Description
                          </label>
                          <GenericInputField
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            compact
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#d3c4af]/50 p-6 text-center text-xs text-[#817563] dark:border-slate-700 dark:text-slate-400">
              Please select a Target Process above to load process-specific fields and Karigars.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#d3c4af]/20 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedProcess}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50 cursor-pointer h-9 px-4 text-xs sm:text-[13px]"
          >
            <Plus className="h-4 w-4" />
            <span>
              {isSubmitting
                ? 'Saving...'
                : selectedProcess
                  ? `Save & Send to ${selectedProcess}`
                  : 'Select Process to Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessDispatchPopup;