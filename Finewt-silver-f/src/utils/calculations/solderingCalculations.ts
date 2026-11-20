/**
 * Soldering & Joint Process Calculation Formulas
 * Centralized calculation utility - change here to update all Soldering/Joint calculations app-wide.
 */

export const calculateSolderingLoss = (
  chainGiven: number,
  chainReceived: number,
  scrap: number,
): number => {
  const output = Number(chainReceived || 0) + Number(scrap || 0);
  return Number((Number(chainGiven || 0) - output).toFixed(3));
};

export const calculateJointLoss = (
  chainGiven: number,
  chainReceived: number,
  scrap: number,
): number => {
  const output = Number(chainReceived || 0) + Number(scrap || 0);
  return Number((Number(chainGiven || 0) - output).toFixed(3));
};
