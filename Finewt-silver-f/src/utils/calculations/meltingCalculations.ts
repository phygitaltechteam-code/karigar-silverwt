/**
 * Melting Process Calculation Formulas
 * Centralized calculation utility - change here to update all melting calculations app-wide.
 */

export const calculateExpectedFine = (
  grossWt: number,
  purity: number,
): number => {
  if (!grossWt || !purity || grossWt <= 0 || purity <= 0) return 0;
  return Math.round(((grossWt * purity) / 100) * 1000) / 1000;
};

export const calculateMeltingLoss = (
  expectedFine: number,
  actualFineWeight: number,
): number => {
  if (actualFineWeight <= 0) return 0;
  return Number((expectedFine - actualFineWeight).toFixed(3));
};

export const calculateMeltingTotals = (
  rows: Array<{
    grossWt?: number;
    expectedFine?: number;
    fineWeight?: number;
    loss?: number;
  }>,
) => {
  const totalGross = rows.reduce((acc, r) => acc + Number(r.grossWt || 0), 0);
  const totalExpectedFine = rows.reduce(
    (acc, r) => acc + Number(r.expectedFine || 0),
    0,
  );
  const totalFine = rows.reduce((acc, r) => acc + Number(r.fineWeight || 0), 0);
  const totalLoss = rows.reduce((acc, r) => acc + Number(r.loss || 0), 0);

  return {
    totalGross: Number(totalGross.toFixed(3)),
    totalExpectedFine: Number(totalExpectedFine.toFixed(3)),
    totalFine: Number(totalFine.toFixed(3)),
    totalLoss: Number(totalLoss.toFixed(3)),
  };
};
