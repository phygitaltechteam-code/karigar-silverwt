import { CuttingEntry, calculateLoss } from './cuttingUtils';
import { StockCardItem } from './AddCuttingStockModal';

export const DEFAULT_DEMO_CUTTING_STOCK: StockCardItem[] = [];

export const DEFAULT_DEMO_CUTTING_ENTRIES: CuttingEntry[] = [];

export const mapCuttingApiData = (rawCuttingList: any[]): CuttingEntry[] => {
  const nonGoldCuttingList = rawCuttingList.filter((cutting: any) => {
    const itemName = String(
      cutting.item?.name || cutting.item || cutting.itemId || '',
    )
      .trim()
      .toLowerCase();
    return itemName !== 'gold' && !itemName.includes('gold');
  });

  return nonGoldCuttingList.map((cutting: any, index: number) => {
    const itemName =
      (typeof cutting.item === 'object'
        ? cutting.item?.name || cutting.item?.item
        : typeof cutting.item === 'string'
          ? cutting.item
          : '') ||
      cutting.itemName ||
      cutting.itemId ||
      'N/A';

    const sizeName =
      (typeof cutting.size === 'object'
        ? cutting.size?.size
        : typeof cutting.size === 'string'
          ? cutting.size
          : '') ||
      cutting.sizeName ||
      cutting.sizeId ||
      'N/A';

    const itemId =
      cutting.itemId ||
      (typeof cutting.item === 'object'
        ? cutting.item?.id || cutting.item?._id
        : typeof cutting.item === 'string'
          ? cutting.item
          : '');

    const sizeId =
      cutting.sizeId ||
      (typeof cutting.size === 'object'
        ? cutting.size?.id || cutting.size?._id
        : typeof cutting.size === 'string'
          ? cutting.size
          : '');

    const chainGiven =
      cutting.chainWeight !== undefined && cutting.chainWeight !== null
        ? cutting.chainWeight
        : cutting.chainGiven || 0;
    const chainReceived = cutting.chainReceived || 0;
    const scrap = cutting.scrap || 0;

    const isSaved =
      Boolean(cutting.isCompleted) === true ||
      String(cutting.status || '').toLowerCase() === 'completed';

    let calculatedLoss = 0;
    if (
      isSaved ||
      (cutting.chainReceived !== null &&
        cutting.chainReceived !== undefined &&
        cutting.chainReceived > 0)
    ) {
      calculatedLoss = calculateLoss(chainGiven, chainReceived, scrap);
    }

    return {
      id: cutting.id,
      srNo: index + 1,
      dateTime: new Date(cutting.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      item: itemName,
      size: sizeName,
      purity: cutting.purity || '',
      chainWeight: chainGiven,
      chainGiven: chainGiven,
      chainReceived: chainReceived,
      scrap: scrap,
      loss: calculatedLoss,
      isEditing: !isSaved,
      isSaved: isSaved,
      chainGivenRaw: cutting.chainGiven ? cutting.chainGiven.toString() : '',
      chainReceivedRaw: cutting.chainReceived
        ? cutting.chainReceived.toString()
        : '',
      scrapRaw: cutting.scrap ? cutting.scrap.toString() : '',
      purityRaw:
        cutting.purity !== null &&
        cutting.purity !== undefined &&
        cutting.purity !== ''
          ? String(parseFloat(Number(cutting.purity).toFixed(2)))
          : '',
      itemId: itemId,
      sizeId: sizeId,
      isCompleted: cutting.isCompleted || false,
      isDirty: false,
      status: cutting.status,
      process: cutting.process,
      isMelting: cutting.isMelting,
      meltingStatus: cutting.meltingStatus,
    };
  });
};

export const filterCuttingHistoryData = (
  rawHistory: any[],
  dateRange: Date[],
  searchTerm: string,
  isTrial: boolean,
  isDateFilterActive: boolean,
): any[] => {
  let list = rawHistory.filter((cutting: any) => {
    const itemName = String(
      cutting.item?.name || cutting.item || cutting.itemId || '',
    )
      .trim()
      .toLowerCase();
    return itemName !== 'gold' && !itemName.includes('gold');
  });

  list = [...list].sort((a: any, b: any) => {
    const dateA = new Date(
      a.updatedAt || a.proceedDateTime || a.updated_at || a.createdAt || 0,
    ).getTime();
    const dateB = new Date(
      b.updatedAt || b.proceedDateTime || b.updated_at || b.createdAt || 0,
    ).getTime();
    return dateB - dateA;
  });

  if (isTrial && !isDateFilterActive) {
    // Bypass
  } else if (dateRange && dateRange.length > 0) {
    const [fromRaw, toRaw] = dateRange;
    const from = fromRaw ? new Date(fromRaw) : null;
    if (from) from.setHours(0, 0, 0, 0);
    const to = toRaw ? new Date(toRaw) : null;
    if (to) to.setHours(23, 59, 59, 999);

    list = list.filter((item: any) => {
      const dateVal =
        item?.updatedAt ||
        item?.proceedDateTime ||
        item?.updated_at ||
        item?.createdAt;
      if (!dateVal) return false;
      const itemDate = new Date(dateVal);
      if (Number.isNaN(itemDate.getTime())) return false;

      if (from && to) {
        return itemDate >= from && itemDate <= to;
      }
      if (from) {
        return itemDate >= from;
      }
      if (to) {
        return itemDate <= to;
      }
      return true;
    });
  }

  if (searchTerm.trim()) {
    const searchLower = searchTerm.trim().toLowerCase();
    list = list.filter((item: any) => {
      const itemName = (item?.itemName || item?.item || '').toLowerCase();
      const purity = (item?.purity?.toString() || '').toLowerCase();
      const size = (item?.size?.toString() || '').toLowerCase();
      const chainGiven = (
        item?.chainGiven?.toString() ||
        item?.chainWeight?.toString() ||
        ''
      ).toLowerCase();
      const chainReceived = (item?.chainReceived?.toString() || '').toLowerCase();
      const scrap = (item?.scrap?.toString() || '').toLowerCase();
      const loss = (item?.loss?.toString() || '').toLowerCase();
      const status = (item?.status || '').toLowerCase();

      return (
        itemName.includes(searchLower) ||
        purity.includes(searchLower) ||
        size.includes(searchLower) ||
        chainGiven.includes(searchLower) ||
        chainReceived.includes(searchLower) ||
        scrap.includes(searchLower) ||
        loss.includes(searchLower) ||
        status.includes(searchLower)
      );
    });
  }

  return list;
};
