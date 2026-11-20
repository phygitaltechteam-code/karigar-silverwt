/**
 * Tar Process Calculation Formulas
 * Centralized calculation utility - change here to update all Tar calculations app-wide.
 */

export const calculateTarFine = (grossWt: number, purity: number): number => {
  if (!grossWt || !purity || grossWt <= 0 || purity <= 0) return 0;
  return Number(((grossWt * purity) / 100).toFixed(3));
};

export const calculateTarLoss = (
  grossWt: number,
  tarReceived: number,
  scrap: number,
): number => {
  const output = Number(tarReceived || 0) + Number(scrap || 0);
  return Number((Number(grossWt || 0) - output).toFixed(3));
};

export const calculateTarTotals = (
  rows: Array<{
    grosswt?: number;
    fine?: number;
    tar?: number;
    scrap?: number;
    loss?: number;
  }>,
) => {
  const totalGross = rows.reduce((sum, r) => sum + Number(r.grosswt || 0), 0);
  const totalFine = rows.reduce((sum, r) => sum + Number(r.fine || 0), 0);
  const totalTar = rows.reduce((sum, r) => sum + Number(r.tar || 0), 0);
  const totalScrap = rows.reduce((sum, r) => sum + Number(r.scrap || 0), 0);
  const totalLoss = rows.reduce((sum, r) => sum + Number(r.loss || 0), 0);

  return {
    totalGross: Number(totalGross.toFixed(3)),
    totalFine: Number(totalFine.toFixed(3)),
    totalTar: Number(totalTar.toFixed(3)),
    totalScrap: Number(totalScrap.toFixed(3)),
    totalLoss: Number(totalLoss.toFixed(3)),
  };
};
