/**
 * Pure table formatters to format API data before passing to GenericTable
 * without embedding business logic inside table render methods.
 */

export const formatNumberDisplay = (
  value: unknown,
  minDecimals: number = 3,
  maxDecimals: number = 3,
): string => {
  if (value === null || value === undefined || value === '') return '0.000';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
};

export const formatIndianDate = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatIndianDateTime = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} ${timeStr}`;
};

export const calculateAveragePurity = (
  totalGross: number,
  totalFine: number,
  decimals: number = 2,
): string => {
  if (!totalGross || totalGross <= 0 || !totalFine || totalFine <= 0) {
    return '0.00';
  }
  const purity = (totalFine / totalGross) * 100;
  return purity.toFixed(decimals);
};

export const formatPurityPercentage = (purity: unknown): string => {
  if (
    purity === null ||
    purity === undefined ||
    purity === '' ||
    purity === 'N/A'
  ) {
    return '-';
  }
  const str = String(purity).trim();
  if (str.includes('%')) return str;
  const num = Number(str);
  if (!Number.isFinite(num)) return str;
  return `${num.toFixed(2)}%`;
};
