import { CuttingEntry } from './cuttingUtils';
import { StockCardItem } from './AddCuttingStockModal';
import { DEFAULT_DEMO_CUTTING_STOCK } from './cuttingDataHelpers';

export const calculateCuttingInlineChange = (
  entry: CuttingEntry,
  field:
    | 'chainGiven'
    | 'chainReceived'
    | 'scrap'
    | 'purity'
    | 'itemId'
    | 'item'
    | 'description'
    | 'stamp'
    | 'size'
    | 'qtyGiven'
    | 'qtyReceived',
  value: string,
  itemsList: any[],
): CuttingEntry => {
  const updated = { ...entry };

  if (field === 'description') {
    updated.descriptionRaw = value;
    updated.description = value;
  } else if (field === 'stamp') {
    updated.stampRaw = value;
    updated.stamp = value;
  } else if (field === 'size') {
    updated.sizeRaw = value;
    updated.size = value;
  } else if (field === 'qtyGiven') {
    updated.qtyGivenRaw = value;
    updated.qtyGiven = parseInt(value, 10) || 0;
  } else if (field === 'qtyReceived') {
    updated.qtyReceivedRaw = value;
    updated.qtyReceived = parseInt(value, 10) || 0;
  } else if (field === 'itemId') {
    updated.itemId = value;
    const matchedItem = itemsList?.find(
      (it: any) => String(it.id || it._id) === String(value),
    );
    if (matchedItem) {
      updated.item = matchedItem.name || matchedItem.item || value;
    }
  } else if (field === 'item') {
    updated.item = value;
    const matchedItem = itemsList?.find(
      (it: any) =>
        String(it.name || it.item || '').trim().toLowerCase() ===
        String(value).trim().toLowerCase(),
    );
    if (matchedItem) {
      updated.itemId = matchedItem.id || matchedItem._id || value;
    }
  } else if (field === 'chainGiven') {
    updated.chainGivenRaw = value;
    if (value === '' || value === '.' || value === '-') {
      updated.chainGiven = 0;
    } else {
      const numValue = parseFloat(value);
      updated.chainGiven = isNaN(numValue) ? 0 : numValue;
    }
  } else if (field === 'chainReceived') {
    updated.chainReceivedRaw = value;
    if (value === '' || value === '.' || value === '-') {
      updated.chainReceived = 0;
    } else {
      const numValue = parseFloat(value);
      updated.chainReceived = isNaN(numValue) ? 0 : numValue;
    }
    const autoScrap = Math.max(
      0,
      Math.round(
        (Number(updated.chainGiven || 0) - updated.chainReceived) * 1000,
      ) / 1000,
    );
    updated.scrap = autoScrap;
    updated.scrapRaw = autoScrap > 0 ? autoScrap.toString() : '';
  } else if (field === 'scrap') {
    updated.scrapRaw = value;
    if (value === '' || value === '.' || value === '-') {
      updated.scrap = 0;
    } else {
      const numValue = parseFloat(value);
      updated.scrap = isNaN(numValue) ? 0 : numValue;
    }
  } else if (field === 'purity') {
    updated.purityRaw = value;
    if (value === '' || value === '.' || value === '-') {
      updated.purity = 0;
    } else {
      const numValue = parseFloat(value);
      updated.purity = isNaN(numValue) ? 0 : numValue;
    }
  }

  const givenAmount = Number(updated.chainGiven || 0);
  const receivedAmount = Number(updated.chainReceived || 0);
  const scrapAmount = Number(updated.scrap || 0);

  updated.loss = Math.max(
    0,
    Math.round((givenAmount - receivedAmount - scrapAmount) * 1000) / 1000,
  );

  updated.isDirty = true;
  return updated;
};

export const syncCuttingToSolderingStorage = (entry: CuttingEntry) => {
  try {
    const existingSoldering = localStorage.getItem(
      'chain_soldering_process_entries_v2',
    );
    const parsedSoldering = existingSoldering ? JSON.parse(existingSoldering) : [];
    const newSolderingEntry = {
      id: `soldering-${Date.now()}`,
      srNo: parsedSoldering.length + 1,
      dateTime: new Date().toISOString(),
      purity: Number(entry.purity || 0),
      designName: entry.item || entry.description || '',
      design: entry.item || entry.description || '',
      stamp: entry.stamp || '',
      size: entry.size || '',
      qty: entry.qtyReceived || entry.qtyGiven || 0,
      qtyGiven: entry.qtyReceived || entry.qtyGiven || 0,
      netWeightGiven: entry.chainReceived || 0,
      status: 'pending',
    };
    localStorage.setItem(
      'chain_soldering_process_entries_v2',
      JSON.stringify([newSolderingEntry, ...parsedSoldering]),
    );
    localStorage.setItem(
      'chain_soldering_process_entries_v1',
      JSON.stringify([newSolderingEntry, ...parsedSoldering]),
    );

    const existingCards = localStorage.getItem('chain_soldering_stock_cards_v2');
    const parsedCards = existingCards ? JSON.parse(existingCards) : [];
    const newCard = {
      id: `soldering-card-${Date.now()}`,
      purity: Number(entry.purity || 0),
      stamp: entry.stamp || `SD-${Math.round(entry.purity || 0)}`,
      totalWeight: entry.chainReceived || 0,
      availableWeight: entry.chainReceived || 0,
      design: entry.item || entry.description || '',
      description: entry.item || entry.description || '',
      qty: entry.qtyReceived || entry.qtyGiven || 0,
      size: entry.size || '',
    };
    localStorage.setItem(
      'chain_soldering_stock_cards_v2',
      JSON.stringify([newCard, ...parsedCards]),
    );
  } catch (e) {}
};

export const calculateCuttingStockList = (
  cuttingStockData: any,
  itemsList: any[],
  sizes: any[],
): StockCardItem[] => {
  let localCards: any[] = [];
  try {
    const stored = localStorage.getItem('chain_cutting_stock_cards_v1');
    if (stored) localCards = JSON.parse(stored);
  } catch (e) {}

  const rawList = Array.isArray((cuttingStockData as any)?.data)
    ? (cuttingStockData as any).data
    : Array.isArray(cuttingStockData)
      ? cuttingStockData
      : [];

  const mapped = rawList
    .map((stock: any) => {
      const item = itemsList.find(
        (i: any) => String(i.id || i._id) === String(stock.itemId),
      );
      const size = sizes.find(
        (s: any) => String(s.id || s._id) === String(stock.sizeId),
      );
      const isGold =
        (stock.sizeId === null && stock.purity === null) ||
        (item?.name?.toLowerCase().includes('gold') && stock.sizeId === null);
      if (isGold) return null;

      const itemName =
        stock.design ||
        stock.item?.name ||
        stock.itemName ||
        item?.name ||
        item?.item ||
        (size as any)?.item?.name ||
        (size as any)?.itemName ||
        'N/A';
      const sizeName = stock.size?.size || stock.sizeName || size?.size || '-';
      const purity =
        stock.purity !== undefined && stock.purity !== null
          ? Number(stock.purity)
          : 0;
      const weight = Number(
        stock.chainWeight !== undefined && stock.chainWeight !== null
          ? stock.chainWeight
          : stock.weight !== undefined && stock.weight !== null
            ? stock.weight
            : stock.chainGiven || 0,
      );

      if (weight <= 0) return null;

      return {
        id: stock.id,
        itemId:
          stock.itemId ||
          (size as any)?.itemId ||
          (size as any)?.item?.id ||
          item?.id,
        sizeId: stock.sizeId,
        itemName,
        design: stock.design || itemName,
        description: stock.description,
        stamp: stock.stamp || stock.Stamp,
        qty: stock.qty,
        sizeName,
        purity,
        weight,
      };
    })
    .filter(Boolean) as StockCardItem[];

  const combined = [
    ...localCards.map((c: any) => ({
      id: c.id,
      itemId: c.itemId,
      sizeId: c.sizeId,
      itemName: c.design || c.description || c.itemName || 'Cutting Item',
      design: c.design || c.description,
      description: c.description,
      stamp: c.stamp || c.Stamp,
      qty: c.qty,
      sizeName: c.size || c.sizeName || '-',
      purity: Number(c.purity || 0),
      weight: Number(c.availableWeight ?? c.totalWeight ?? c.weight ?? 0),
      sourceProcess: c.sourceProcess || c.source || '',
    })),
    ...mapped,
  ];

  if (combined.length > 0) return combined;
  return DEFAULT_DEMO_CUTTING_STOCK;
};
