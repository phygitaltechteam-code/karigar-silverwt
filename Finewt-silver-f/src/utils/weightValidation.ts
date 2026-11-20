/**
 * Gold Weight Validation & Formatting Utilities
 * Strictly enforces 3 decimal places in Gold Weight (Grams)
 * Example Valid: 1.250 g, 25.785 g, 0.005 g
 * Example Invalid: 1.2345 (more than 3 decimals), negative values, non-numbers
 */

// Regex for strictly matching numbers with max 3 decimal places
export const GRAM_WEIGHT_REGEX = /^\d+(\.\d{1,3})?$/;

export interface WeightValidationResult {
  isValid: boolean;
  error?: string;
  parsedValue?: number;
}

/**
 * Validates a gold weight input string or number
 */
export function validateWeightGram(
  value: string | number,
  fieldName = 'Weight',
): WeightValidationResult {
  if (value === undefined || value === null || String(value).trim() === '') {
    return {isValid: false, error: `${fieldName} is required`};
  }

  const strVal = String(value).trim();

  // Check numeric
  const num = Number(strVal);
  if (isNaN(num)) {
    return {isValid: false, error: `${fieldName} must be a valid number`};
  }

  // Check negative
  if (num <= 0) {
    return {isValid: false, error: `${fieldName} must be greater than 0.000 g`};
  }

  // Check min value (0.001)
  if (num < 0.001) {
    return {isValid: false, error: `${fieldName} minimum is 0.001 g`};
  }

  // Check max value (99999.999)
  if (num > 99999.999) {
    return {isValid: false, error: `${fieldName} maximum is 99999.999 g`};
  }

  // Check decimal precision using regex
  if (!GRAM_WEIGHT_REGEX.test(strVal)) {
    return {
      isValid: false,
      error: `${fieldName} supports a maximum of 3 decimal places (e.g., 12.500 g)`,
    };
  }

  return {isValid: true, parsedValue: Number(num.toFixed(3))};
}

/**
 * Formats any number to fixed 3 decimal places string (e.g. 1.25 -> "1.250")
 */
export function formatGram(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0.000';
  const num = Number(val);
  if (isNaN(num)) return '0.000';
  return num.toFixed(3);
}

/**
 * Formats weight with unit for display (e.g. "12.500 g")
 */
export function formatGramWithUnit(
  val: number | string | undefined | null,
): string {
  return `${formatGram(val)} g`;
}

/**
 * Box Department Formula: Balance = Weight - Loss
 */
export function calculateBoxBalance(weight: number, loss: number): number {
  const bal = Math.max(0, weight - loss);
  return Number(bal.toFixed(3));
}

/**
 * Soldering Department Formula: Output = Received + Solder - Loss
 */
export function calculateSolderingOutput(
  received: number,
  solder: number,
  loss: number,
): number {
  const out = Math.max(0, received + solder - loss);
  return Number(out.toFixed(3));
}

/**
 * Joint Department Formula: Output = Received - Loss
 */
export function calculateJointOutput(received: number, loss: number): number {
  const out = Math.max(0, received - loss);
  return Number(out.toFixed(3));
}

/**
 * Cutting Department Formula: Output = Weight - Loss
 */
export function calculateCuttingOutput(weight: number, loss: number): number {
  const out = Math.max(0, weight - loss);
  return Number(out.toFixed(3));
}
