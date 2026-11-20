/**
 * Box Process Calculation Formulas
 * Centralized calculation utility - change here to update all Box calculations app-wide.
 */

export const calculateBoxLoss = (
  boxGiven: number,
  boxReceived: number,
  scrap: number,
): number => {
  const output = Number(boxReceived || 0) + Number(scrap || 0);
  return Number((Number(boxGiven || 0) - output).toFixed(3));
};

export const calculateBoxTotals = (
  rows: Array<{
    boxGiven?: number;
    boxReceived?: number;
    scrap?: number;
    loss?: number;
  }>,
) => {
  const totalGiven = rows.reduce((sum, r) => sum + Number(r.boxGiven || 0), 0);
  const totalReceived = rows.reduce(
    (sum, r) => sum + Number(r.boxReceived || 0),
    0,
  );
  const totalScrap = rows.reduce((sum, r) => sum + Number(r.scrap || 0), 0);
  const totalLoss = rows.reduce((sum, r) => sum + Number(r.loss || 0), 0);

  return {
    totalGiven: Number(totalGiven.toFixed(3)),
    totalReceived: Number(totalReceived.toFixed(3)),
    totalScrap: Number(totalScrap.toFixed(3)),
    totalLoss: Number(totalLoss.toFixed(3)),
  };
};
