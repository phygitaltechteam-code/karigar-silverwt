import toast from 'react-hot-toast';

/**
 * Received + scrap can never be more than the weight given to the karigar.
 * Returns true (and shows a message) when the entered value would exceed it,
 * so the caller can ignore the keystroke.
 */
export const exceedsGiven = (
  given: number | string | undefined,
  received: number | string | undefined,
  scrap: number | string | undefined = 0,
  allowance: number | string | undefined = 0,
): boolean => {
  const g = (Number(given) || 0) + (Number(allowance) || 0);
  if (g <= 0) return false;
  const total = (Number(received) || 0) + (Number(scrap) || 0);
  if (total > g + 0.0005) {
    toast.error(
      `Received + scrap (${Math.round(total * 1000) / 1000} G) cannot be more than given weight (${Math.round(g * 1000) / 1000} G)`,
      { id: 'exceeds-given' },
    );
    return true;
  }
  return false;
};
