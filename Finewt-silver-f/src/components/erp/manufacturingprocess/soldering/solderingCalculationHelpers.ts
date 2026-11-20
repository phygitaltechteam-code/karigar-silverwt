import { SolderingEntry, truncate3Dec, SolderingCardForm } from './solderingUtils';

export const calculateSolderingInlineChange = (
  entry: SolderingEntry,
  field: 'chainReceived' | 'scrap' | 'purity' | 'description' | 'Description' | 'Description (तपशील)',
  value: string,
): SolderingEntry => {
  const updated = { ...entry };

  if (field === 'description' || field === 'Description' || field === 'Description (तपशील)') {
    updated.descriptionRaw = value;
    updated.description = value;
  } else if (field === 'purity') {
    updated.purityRaw = value;
    updated.purity = value;
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      updated.basePurity = parsed;
    }
  } else if (field === 'chainReceived') {
    updated.chainReceivedRaw = value;
    if (value === '' || value === '.' || value === '-') {
      updated.chainReceived = 0;
    } else {
      const numValue = parseFloat(value);
      updated.chainReceived = isNaN(numValue) ? 0 : numValue;
    }
  } else if (field === 'scrap') {
    updated.scrapRaw = value;
    if (value === '' || value === '.' || value === '-') {
      updated.scrap = 0;
    } else {
      const numValue = parseFloat(value);
      updated.scrap = isNaN(numValue) ? 0 : numValue;
    }
  }

  if ((field === 'chainReceived' || field === 'scrap') && entry.chainWeight > 0) {
    const autoPowder = Math.max(
      0,
      truncate3Dec(updated.chainReceived + updated.scrap - entry.chainWeight),
    );
    updated.powder = autoPowder;
    updated.powderRaw = autoPowder > 0 ? autoPowder.toString() : '0';
  }

  if (updated.powder > 0 && updated.chainReceived > 0) {
    updated.increase = truncate3Dec(
      (updated.powder / (updated.chainReceived + updated.scrap)) * 100,
    );
  } else {
    updated.increase = 0;
  }

  const baseP =
    entry.basePurity !== undefined && entry.basePurity > 0
      ? entry.basePurity
      : parseFloat(entry.purityRaw || entry.purity || '0') || 0;

  if (baseP > 0) {
    const newPurity = Math.max(0, truncate3Dec(baseP - updated.increase));
    updated.purity = newPurity.toString();
    updated.purityRaw = newPurity.toString();
  }

  updated.isDirty = true;
  return updated;
};

export const saveJointPolishingCard = (entry: SolderingEntry) => {
  try {
    const existingPolishing = localStorage.getItem('chain_polishing_process_entries_v2');
    const parsedPolishing = existingPolishing ? JSON.parse(existingPolishing) : [];
    const newPolishingEntry = {
      id: `polishing-${Date.now()}`,
      srNo: parsedPolishing.length + 1,
      dateTime: new Date().toISOString(),
      purity: Number(entry.purity || 0),
      stamp: entry.stamp || (entry as any).Stamp || '',
      designName: (entry as any).design || (entry as any).designName || '',
      netWeightGiven: entry.chainReceived || 0,
      status: 'pending',
    };
    localStorage.setItem('chain_polishing_process_entries_v2', JSON.stringify([newPolishingEntry, ...parsedPolishing]));
    localStorage.setItem('chain_polishing_process_entries_v1', JSON.stringify([newPolishingEntry, ...parsedPolishing]));
  } catch (e) {}
};

export const saveCuttingStockCard = (
  entry: SolderingEntry,
  currentStockCards: any[],
) => {
  const newStockCard = {
    id: `soldering-stock-${Date.now()}`,
    purity: Number(entry.purity) || 92.5,
    Stamp: entry.stamp || (entry as any).Stamp || entry.description || (entry as any).Description || `${entry.purity}%`,
    availableWeight: entry.chainReceived || entry.chainWeight || 0,
    totalWeight: entry.chainReceived || entry.chainWeight || 0,
  };
  const updatedCards = [newStockCard, ...currentStockCards];
  try {
    localStorage.setItem('chain_soldering_stock_cards_v2', JSON.stringify(updatedCards));
  } catch (e) {}
  return updatedCards;
};

export const buildSolderingPayloads = (
  modalCards: SolderingCardForm[],
  sizes: any[],
  selectedBoxForModal: any,
  selectedStamp: string,
  selectedKarigar: string,
  selectedDesign: string,
  currentRate: string | number,
) => {
  return modalCards.map((card) => {
    const chainWeightVal = parseFloat(card.chainWeight) || 0;
    const purityVal = parseFloat(card.purity) || 0;
    const fineVal = truncate3Dec((chainWeightVal * purityVal) / 100);
    const selectedSize = sizes.find(
      (s: any) => String(s.id || s._id) === String(card.sizeId),
    );
    return {
      sizeId: card.sizeId || (sizes.length > 0 ? String(sizes[0].id || (sizes[0] as any)._id) : 'size-1'),
      size: selectedSize?.size || selectedBoxForModal?.size || 'Standard',
      purity: purityVal ? Number(purityVal) : 0,
      fine: fineVal,
      chainWeight: chainWeightVal,
      stamp: selectedStamp || card.stamp || 'BH-925',
      karigar: selectedKarigar || '',
      design: selectedDesign || '',
      ratePerDesign: Number(currentRate) || 120,
      description: selectedDesign || '',
    };
  });
};

export const createLocalSolderingEntries = (
  allPayloads: any[],
  currentEntriesCount: number,
  selectedDesign: string,
): SolderingEntry[] => {
  return allPayloads.map((payload, idx) => ({
    id: `soldering-local-${Date.now()}-${idx}`,
    srNo: currentEntriesCount + idx + 1,
    solderingId: `sold-group-${Date.now()}`,
    dateTime: new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(/,/g, ''),
    createdAt: new Date().toISOString(),
    item: payload.design || 'Gold Chain',
    design: payload.design || selectedDesign || 'Gold Chain',
    designName: selectedDesign || payload.design || 'Gold Chain',
    size: payload.size || 'Standard',
    purity: payload.purity ? String(payload.purity) : '92.5',
    stamp: payload.stamp || 'BH-925',
    description: payload.description || payload.design || '',
    descriptionRaw: payload.description || payload.design || '',
    karigar: payload.karigar || '',
    chainWeight: payload.chainWeight,
    chainReceived: payload.chainWeight,
    chainReceivedRaw: String(payload.chainWeight),
    powder: 0,
    increase: 0,
    scrap: 0,
    loss: 0,
    ratePerDesign: payload.ratePerDesign,
    fine: payload.fine,
    isEditing: true,
    isSaved: false,
    isDirty: true,
  }));
};
