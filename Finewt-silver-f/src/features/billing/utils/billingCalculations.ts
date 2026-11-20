/**
 * Pure calculation utilities for Billing and Bill Edit
 * Preserves 100% of the existing mathematical formulas.
 */

export interface BillingItemCalc {
  grossWt: number;
  purity: number;
  wastage?: number;
  srp?: number;
  fineWt?: number;
}

export const calculateItemFineWeight = (
  grossWt: number,
  purity: number,
): number => {
  if (!grossWt || grossWt <= 0 || !purity || purity <= 0) return 0;
  return Number(((grossWt * purity) / 100).toFixed(3));
};

export const calculateBillingTotals = (
  items: Array<{
    grossWeight?: number;
    grossWt?: number;
    finWt?: number;
    fineWt?: number;
    srp?: number;
  }>,
  customerWeight: number = 0,
  previousDue: number = 0,
) => {
  const totalGrossWt = items.reduce(
    (sum, it) => sum + Number(it.grossWeight ?? it.grossWt ?? 0),
    0,
  );
  const totalFineWt = items.reduce(
    (sum, it) => sum + Number(it.finWt ?? it.fineWt ?? 0),
    0,
  );
  const totalSRP = items.reduce((sum, it) => sum + Number(it.srp ?? 0), 0);

  const netPayableFine = Math.max(0, totalFineWt - Number(customerWeight || 0));
  const newBalance = Number((previousDue + netPayableFine).toFixed(3));

  return {
    totalGrossWt: Number(totalGrossWt.toFixed(3)),
    totalFineWt: Number(totalFineWt.toFixed(3)),
    totalSRP: Number(totalSRP.toFixed(2)),
    netPayableFine: Number(netPayableFine.toFixed(3)),
    newBalance,
  };
};
