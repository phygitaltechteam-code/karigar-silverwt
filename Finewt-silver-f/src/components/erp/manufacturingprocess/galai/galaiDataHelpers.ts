import { calculateExpectedFine } from './galaiUtils';

export const filterGalaiHistoryData = (
  rawHistory: any[],
  fromDate: Date | null,
  toDate: Date | null,
  historySearchTerm: string,
  isTrial: boolean,
  isDateFilterActive: boolean,
): any[] => {
  let filtered = [...rawHistory].sort((a: any, b: any) => {
    const dateA = new Date(
      a.updatedAt || a.proceedDateTime || a.updated_at || a.createdAt || 0,
    ).getTime();
    const dateB = new Date(
      b.updatedAt || b.proceedDateTime || b.updated_at || b.createdAt || 0,
    ).getTime();
    return dateB - dateA;
  });

  if (isTrial && !isDateFilterActive) {
    // Bypass date filtering for trial
  } else if (fromDate && toDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    filtered = filtered.filter((item: any) => {
      const itemDate = new Date(
        item.updatedAt || item.proceedDateTime || item.createdAt || 0,
      );
      return itemDate >= from && itemDate <= to;
    });
  } else if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    filtered = filtered.filter((item: any) => {
      const itemDate = new Date(
        item.updatedAt || item.proceedDateTime || item.createdAt || 0,
      );
      return itemDate >= from;
    });
  } else if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter((item: any) => {
      const itemDate = new Date(
        item.updatedAt || item.proceedDateTime || item.createdAt || 0,
      );
      return itemDate <= to;
    });
  }

  filtered = filtered.filter((item: any) => {
    if (historySearchTerm.trim()) {
      const query = historySearchTerm.toLowerCase();
      const particular = (
        item.particular ||
        item.description ||
        ''
      ).toLowerCase();
      const grossStr = String(
        item.grossWeight ?? item.grossWt ?? item.weight ?? '',
      );
      const purityStr = String(item.purity || '');
      const fineStr = String(item.fineWeight ?? item.fineWt ?? '');
      const dateStr = (
        item.updatedAt ||
        item.proceedDateTime ||
        item.createdAt ||
        ''
      ).toLowerCase();
      return (
        particular.includes(query) ||
        grossStr.includes(query) ||
        purityStr.includes(query) ||
        fineStr.includes(query) ||
        dateStr.includes(query)
      );
    }
    return true;
  });

  return filtered;
};

export const calculateGalaiHistoryTotals = (data: any[]) => {
  return data.reduce(
    (acc: any, item: any) => {
      const gross = Number(
        item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
      );
      const purity = Number(item.purity ?? 0);
      const expected = Number(
        item.expected ??
          item.expectedFine ??
          calculateExpectedFine(gross, purity),
      );
      const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
      const loss =
        item.loss !== undefined && item.loss !== null
          ? Number(item.loss)
          : fine > 0
            ? Math.max(0, Math.round((expected - fine) * 1000) / 1000)
            : 0;
      return {
        totalGross: acc.totalGross + gross,
        totalExpected: acc.totalExpected + expected,
        totalFine: acc.totalFine + fine,
        totalLoss: acc.totalLoss + loss,
      };
    },
    { totalGross: 0, totalExpected: 0, totalFine: 0, totalLoss: 0 },
  );
};
