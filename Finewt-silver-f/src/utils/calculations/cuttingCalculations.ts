/**
 * Cutting & S/Kunda Process Calculation Formulas
 * Centralized calculation utility - change here to update all Cutting & S/Kunda calculations app-wide.
 */

export const calculateCuttingLoss = (
  chainGiven: number,
  chainReceived: number,
  scrap: number,
): number => {
  const output = Number(chainReceived || 0) + Number(scrap || 0);
  return Number((Number(chainGiven || 0) - output).toFixed(3));
};

export const calculateSKundaLoss = (
  chainGiven: number,
  kundaGiven: number,
  chainReceived: number,
  scrap: number,
): number => {
  const totalGiven = Number(chainGiven || 0) + Number(kundaGiven || 0);
  const totalReceived = Number(chainReceived || 0) + Number(scrap || 0);
  return Number((totalGiven - totalReceived).toFixed(3));
};
