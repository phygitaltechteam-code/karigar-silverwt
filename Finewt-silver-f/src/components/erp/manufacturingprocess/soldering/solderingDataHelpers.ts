import { SolderingEntry, truncate3Dec } from './solderingUtils';

export const DEFAULT_DEMO_SOLDERING: SolderingEntry[] = [];

export const mapSolderingApiData = (solderingData: any[]): SolderingEntry[] => {
  return solderingData.map((soldering: any, index: number) => {
    const itemName = soldering.item?.name || soldering.itemId || 'N/A';
    const sizeName = soldering.size?.size || soldering.sizeId || 'N/A';
    const chainWeight = soldering.chainWeight || 0;
    const purity = soldering.purity;
    const scrap = soldering.scrap || 0;
    const fine =
      soldering.fine !== undefined && soldering.fine !== null
        ? soldering.fine
        : truncate3Dec((chainWeight * (parseFloat(purity) || 0)) / 100);
    const chainReceived = soldering.chainReceived || 0;
    const powder =
      chainReceived > 0
        ? Math.max(0, truncate3Dec(chainReceived + scrap - chainWeight))
        : soldering.powder || 0;
    const increase =
      powder > 0 && chainReceived > 0
        ? truncate3Dec((powder / (chainReceived + scrap)) * 100)
        : soldering.increase || 0;

    const isSaved =
      soldering.isCompleted === true &&
      soldering.chainReceived !== null &&
      soldering.chainReceived !== undefined;

    const basePurity = parseFloat(soldering.purity) || 0;
    return {
      id: soldering.id,
      srNo: index + 1,
      createdAt: soldering.createdAt,
      solderingId: soldering.solderingId ?? null,
      dateTime: new Date(soldering.createdAt)
        .toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        .replace(/,/g, ''),
      item: itemName,
      design: soldering.design || soldering.designName || soldering.description || itemName,
      designName: soldering.designName || soldering.design || soldering.description || itemName,
      size: sizeName,
      purity: soldering.purity || '',
      stamp: soldering.stamp || soldering.Stamp || (soldering.purity ? `BH-${Math.round(parseFloat(soldering.purity))}` : 'BH-925'),
      description: soldering.description || soldering.Description || soldering.design || '',
      descriptionRaw: soldering.descriptionRaw || soldering.DescriptionRaw || soldering.description || soldering.Description || soldering.design || '',
      karigar: soldering.karigar || soldering.karigarName || '',
      loss: Math.max(
        0,
        Math.round(
          (chainWeight - chainReceived - (soldering.scrap || 0)) * 1000,
        ) / 1000,
      ),
      ratePerDesign: soldering.ratePerDesign || soldering.rate || 120,
      basePurity: basePurity,
      fine: fine,
      chainWeight: chainWeight,
      chainReceived: chainReceived,
      powder: powder,
      increase: increase,
      scrap: soldering.scrap || 0,
      isEditing: !isSaved,
      isSaved: isSaved,
      chainReceivedRaw: soldering.chainReceived
        ? soldering.chainReceived.toString()
        : '',
      powderRaw: soldering.powder ? soldering.powder.toString() : '',
      scrapRaw: soldering.scrap ? soldering.scrap.toString() : '',
      purityRaw:
        soldering.purity !== null && soldering.purity !== undefined
          ? soldering.purity.toString()
          : '',
      fineRaw: fine > 0 ? fine.toString() : '',
      itemId: soldering.itemId,
      sizeId: soldering.sizeId,
      isCompleted: soldering.isCompleted || false,
      isDirty: false,
      status: soldering.status,
      process: soldering.process,
      isMelting: soldering.isMelting,
      meltingStatus: soldering.meltingStatus,
    };
  });
};

export const filterSolderingHistoryData = (
  rawHistory: any[],
  fromDate: Date | null,
  toDate: Date | null,
  searchTerm: string,
  isTrial: boolean,
  isDateFilterActive: boolean,
): any[] => {
  let filtered = rawHistory;

  if (isTrial && !isDateFilterActive) {
    // Bypass date filtering for trial
  } else if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    filtered = filtered.filter((item: SolderingEntry) => {
      const itemDate = new Date(
        item.updatedAt || item.proceedDateTime || item.createdAt || 0,
      );
      return itemDate >= from;
    });
  }

  if (!(isTrial && !isDateFilterActive) && toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter((item: any) => {
      const itemDate = new Date(item.createdAt);
      return itemDate <= to;
    });
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
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
      const chainGivenStr = String(item?.chainWeight || '').toLowerCase();
      const chainRecStr = String(item?.chainReceived || '').toLowerCase();
      const powderStr = String(item?.powder || '').toLowerCase();
      const scrapStr = String(item?.scrap || '').toLowerCase();
      const purityStr = String(item?.purity || '').toLowerCase();

      return (
        itemName.includes(term) ||
        sizeName.includes(term) ||
        dateStr.includes(term) ||
        chainGivenStr.includes(term) ||
        chainRecStr.includes(term) ||
        powderStr.includes(term) ||
        scrapStr.includes(term) ||
        purityStr.includes(term)
      );
    });
  }

  return filtered;
};
