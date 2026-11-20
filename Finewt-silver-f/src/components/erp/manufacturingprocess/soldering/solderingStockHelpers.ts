import { truncate3Dec } from './solderingUtils';

export const isSizeMatch = (
  sizes: any[],
  bSizeId: any,
  bSizeName: any,
  targetSizeId: string,
): boolean => {
  if (!targetSizeId) return false;
  const targetStr = String(targetSizeId).trim().toLowerCase();
  const bIdStr = String(bSizeId || '').trim().toLowerCase();
  const bNameStr = String(bSizeName || '').trim().toLowerCase();

  if ((bIdStr && bIdStr === targetStr) || (bNameStr && bNameStr === targetStr))
    return true;

  const matchedSizeObj = sizes.find(
    (s: any) =>
      String(s.id || s._id || '').toLowerCase() === targetStr ||
      String(s.size || '').trim().toLowerCase() === targetStr,
  );

  if (matchedSizeObj) {
    const matchId = String(
      matchedSizeObj.id || matchedSizeObj._id || '',
    ).toLowerCase();
    const matchName = String(matchedSizeObj.size || '').trim().toLowerCase();
    if (bIdStr && bIdStr === matchId) return true;
    if (bNameStr && bNameStr === matchName) return true;
  }

  return false;
};

export const getPuritiesForSize = (
  boxCards: any[],
  boxStockList: any[],
  boxData: any,
  sizes: any[],
  availablePurities: number[],
  sizeId?: string,
): number[] => {
  if (!sizeId) {
    return availablePurities;
  }
  const pSet = new Set<number>();
  boxCards.forEach((c) => {
    if (
      isSizeMatch(sizes, c.sizeId, c.size, sizeId) &&
      c.purity &&
      c.purity > 0 &&
      c.totalWeight > 0
    ) {
      pSet.add(c.purity);
    }
  });

  if (pSet.size === 0) {
    boxStockList.forEach((b: any) => {
      const bSizeId = b.sizeId || b.size?.id;
      const bSizeName = typeof b.size === 'string' ? b.size : b.size?.size;
      const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
      const p = Number(b.purity || 0);
      if (isSizeMatch(sizes, bSizeId, bSizeName, sizeId) && wt > 0 && p > 0) {
        pSet.add(p);
      }
    });
  }

  // Also check boxData
  if (pSet.size === 0) {
    const bList = Array.isArray((boxData as any)?.data)
      ? (boxData as any).data
      : Array.isArray(boxData)
        ? boxData
        : [];
    bList.forEach((s: any) => {
      const sSizeId = s.sizeId || s.size?.id;
      const sSizeName = typeof s.size === 'string' ? s.size : s.size?.size;
      const p = Number(s.purity || 0);
      if (isSizeMatch(sizes, sSizeId, sSizeName, sizeId) && p > 0) {
        pSet.add(p);
      }
    });
  }

  // If no size-specific purity found, fallback to all available purities
  if (pSet.size === 0) {
    return availablePurities;
  }

  return Array.from(pSet).sort((a, b) => b - a);
};

export const getAvailableBoxQty = (
  boxCards: any[],
  boxStockList: any[],
  boxData: any,
  sizes: any[],
  sizeId?: string,
  purity?: string,
): number => {
  const pNum = purity && parseFloat(purity) > 0 ? parseFloat(purity) : null;

  // 1. Check boxCards for specific size + purity match first
  if (boxCards.length > 0) {
    if (sizeId) {
      const specificMatches = boxCards.filter(
        (c) =>
          isSizeMatch(sizes, c.sizeId, c.size, sizeId) &&
          (pNum === null || Number(c.purity) === pNum),
      );
      if (specificMatches.length > 0) {
        const cardTotal = specificMatches.reduce(
          (sum, c) => sum + (Number(c.totalWeight) || 0),
          0,
        );
        if (cardTotal > 0) return truncate3Dec(cardTotal);
      }
    }

    // Fallback: match by purity in boxCards
    const purityMatches = boxCards.filter(
      (c) => pNum === null || Number(c.purity) === pNum,
    );
    if (purityMatches.length > 0) {
      const cardTotal = purityMatches.reduce(
        (sum, c) => sum + (Number(c.totalWeight) || 0),
        0,
      );
      if (cardTotal > 0) return truncate3Dec(cardTotal);
    }

    // Global fallback: any card total in boxCards
    const allCardsTotal = boxCards.reduce(
      (sum, c) => sum + (Number(c.totalWeight) || 0),
      0,
    );
    if (allCardsTotal > 0) return truncate3Dec(allCardsTotal);
  }

  // 2. Check boxStockList
  if (boxStockList.length > 0) {
    if (sizeId) {
      const specificMatches = boxStockList.filter((b: any) => {
        const bSizeId = b.sizeId || b.size?.id;
        const bSizeName = typeof b.size === 'string' ? b.size : b.size?.size;
        const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
        const bP = Number(b.purity || b.tar?.purity || 0);
        return (
          isSizeMatch(sizes, bSizeId, bSizeName, sizeId) &&
          (pNum === null || bP === pNum) &&
          wt > 0
        );
      });
      if (specificMatches.length > 0) {
        const total = specificMatches.reduce((sum: number, b: any) => {
          const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
          return sum + (isNaN(wt) ? 0 : wt);
        }, 0);
        if (total > 0) return truncate3Dec(total);
      }
    }

    const purityMatches = boxStockList.filter((b: any) => {
      const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
      const bP = Number(b.purity || b.tar?.purity || 0);
      return (pNum === null || bP === pNum) && wt > 0;
    });
    if (purityMatches.length > 0) {
      const total = purityMatches.reduce((sum: number, b: any) => {
        const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
        return sum + (isNaN(wt) ? 0 : wt);
      }, 0);
      if (total > 0) return truncate3Dec(total);
    }
  }

  // 3. Check boxData
  const bDataList = Array.isArray((boxData as any)?.data)
    ? (boxData as any).data
    : Array.isArray(boxData)
      ? boxData
      : [];
  if (bDataList.length > 0) {
    const purityMatches = bDataList.filter((b: any) => {
      const wt = Number(b.chainWeight || b.tarWeight || 0);
      const bP = Number(b.purity || 0);
      return (pNum === null || bP === pNum) && wt > 0;
    });
    if (purityMatches.length > 0) {
      const total = purityMatches.reduce((sum: number, b: any) => {
        const wt = Number(b.chainWeight || b.tarWeight || 0);
        return sum + (isNaN(wt) ? 0 : wt);
      }, 0);
      if (total > 0) return truncate3Dec(total);
    }
  }

  return 0;
};

export const getRowRemainingAvailable = (
  modalCards: any[],
  selectedBoxForModal: any,
  getAvailableQtyFn: (sizeId?: string, purity?: string) => number,
  cardIndex: number,
  sizeId?: string,
  purity?: string,
): number => {
  let totalStock = 0;
  if (selectedBoxForModal && Number(selectedBoxForModal.totalWeight) > 0) {
    totalStock = Number(selectedBoxForModal.totalWeight);
  } else {
    const targetPurity =
      purity || (modalCards[0]?.purity ? String(modalCards[0].purity) : '');
    totalStock = getAvailableQtyFn(sizeId, targetPurity);
  }

  if (totalStock <= 0) return 0;

  let usedBeforeThisRow = 0;
  for (let i = 0; i < cardIndex; i++) {
    const c = modalCards[i];
    if (c && c.chainWeight) {
      usedBeforeThisRow += parseFloat(c.chainWeight) || 0;
    }
  }

  return Math.max(0, truncate3Dec(totalStock - usedBeforeThisRow));
};

export const calculateBoxCards = (boxStockList: any[], sizes: any[]) => {
  return boxStockList
    .map((item: any) => {
      const sizeLabel =
        item.size?.size ||
        (typeof item.size === 'string' ? item.size : '') ||
        'Box';

      const matchedSize = sizes.find(
        (s: any) =>
          String(s.id || s._id) === String(item.sizeId || item.size?.id) ||
          String(s.size).trim().toLowerCase() === sizeLabel.trim().toLowerCase(),
      );

      const realSizeId =
        matchedSize?.id || matchedSize?._id || item.sizeId || item.size?.id || sizeLabel;
      const p = Number(item.purity || 0);
      const wt = Number(item.tarWeight || item.chainWeight || item.weight || 0);
      return {
        id: item.id,
        sizeId: String(realSizeId),
        size: matchedSize?.size || sizeLabel,
        purity: p,
        Stamp: item.Stamp || (p > 0 ? `${p}%` : '92.5'),
        totalWeight: truncate3Dec(wt),
      };
    })
    .filter((c: any) => c.totalWeight > 0);
};

export const calculateAvailablePurities = (boxCards: any[], boxData: any) => {
  const pSet = new Set<number>();
  boxCards.forEach((c) => {
    if (c.purity && c.purity > 0) pSet.add(c.purity);
  });
  const bList = Array.isArray((boxData as any)?.data)
    ? (boxData as any).data
    : Array.isArray(boxData)
      ? boxData
      : [];
  bList.forEach((s: any) => {
    const p = Number(s.purity || 0);
    if (p > 0 && s.sizeId) pSet.add(p);
  });
  return Array.from(pSet).sort((a, b) => b - a);
};

export const getSolderingAlertRules = (solderingAlertRaw: any) => {
  let list: any[] = [];
  if (Array.isArray(solderingAlertRaw) && solderingAlertRaw.length > 0) {
    list = solderingAlertRaw;
  } else if (solderingAlertRaw && typeof solderingAlertRaw === 'object') {
    if (Array.isArray((solderingAlertRaw as any).data)) {
      list = (solderingAlertRaw as any).data;
    } else if ((solderingAlertRaw as any).grossWt !== undefined) {
      list = [solderingAlertRaw];
    }
  }

  if (list.length === 0) {
    try {
      const saved = localStorage.getItem('chain_alert_management_settings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.soldering) && parsed.soldering.length > 0) {
          list = parsed.soldering;
        }
      }
    } catch (e) {}
  }

  return list;
};

