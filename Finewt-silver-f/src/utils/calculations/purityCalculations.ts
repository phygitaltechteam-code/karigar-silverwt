/**
 * Purity Upgrade & Average Purity Calculation Formulas
 * Centralized calculation utility - change here to update purity formulas app-wide.
 */

export const calculateAveragePurity = (
  totalFineWeight: number,
  totalGrossWeight: number,
  decimals: number = 2,
): string => {
  if (
    !totalGrossWeight ||
    totalGrossWeight <= 0 ||
    !totalFineWeight ||
    totalFineWeight <= 0
  ) {
    return '0.00';
  }
  const purity = (Number(totalFineWeight) / Number(totalGrossWeight)) * 100;
  return purity.toFixed(decimals);
};

export const calculatePureGoldToAdd = (
  currentWeight: number,
  currentPurity: number,
  targetPurity: number,
): number => {
  if (
    !currentWeight ||
    !currentPurity ||
    !targetPurity ||
    currentWeight <= 0 ||
    currentPurity <= 0 ||
    targetPurity <= 0 ||
    targetPurity <= currentPurity ||
    targetPurity >= 100
  ) {
    return 0;
  }
  // Formula: Pure Gold = CurrentWeight * (TargetPurity - CurrentPurity) / (100 - TargetPurity)
  const result =
    (currentWeight * (targetPurity - currentPurity)) / (100 - targetPurity);
  return Number(result.toFixed(3));
};
