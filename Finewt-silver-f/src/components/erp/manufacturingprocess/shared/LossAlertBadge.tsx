import React from 'react';
import {
  useGetProcessAlert,
  checkProcessLossAlert,
  ProcessLossAlertResult,
} from '@/lib/api/alertmanagement';

/**
 * Expected / Diff loss for a row from the stage's Alert Management rules, shown
 * under the actual loss the user entered.
 * Expected = rule loss scaled to the given weight + the rule's adjustment %.
 * Diff = actual - expected (red when over, green when within).
 * Shows nothing when the stage has no rule.
 */
interface Props {
  stage: string;
  given: number;
  purity: number;
  loss: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(n || 0);

/** Expected loss (with adjustment) and signed diff for one entry. */
export const lossBreakdown = (alert: ProcessLossAlertResult | null) => {
  if (!alert) return null;
  const expected = alert.maxAllowedLoss || alert.baseLoss || 0;
  const diff = Math.round((alert.actualLoss - expected) * 1000) / 1000;
  return { expected, diff, base: alert.baseLoss, adj: alert.adjustmentPercent };
};

export const useStageAlertRules = (stage: string): any[] => {
  const { data } = useGetProcessAlert(stage);
  return Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];
};

export const LossAlertBadge: React.FC<Props> = ({ stage, given, purity, loss }) => {
  const rules = useStageAlertRules(stage);
  const alert = checkProcessLossAlert(Number(given) || 0, Number(purity) || 0, Number(loss) || 0, rules, true);
  const b = lossBreakdown(alert);
  if (!b) return null;
  const hasLoss = (Number(loss) || 0) > 0;
  const diffTone = !hasLoss
    ? 'text-gray-500'
    : b.diff > 0
      ? 'text-red-600'
      : 'text-emerald-600';
  return (
    <div
      className="mt-0.5 flex flex-col items-center whitespace-nowrap text-[10px] font-medium leading-tight text-gray-600 dark:text-slate-400"
      title={`Rule loss ${fmt(b.base)} G + ${b.adj}% adjustment = ${fmt(b.expected)} G expected`}
    >
      <span>Exp: {fmt(b.expected)} G</span>
      <span className={`font-semibold ${diffTone}`}>
        Diff: {hasLoss ? `${b.diff > 0 ? '+' : ''}${fmt(b.diff)} G` : '-'}
      </span>
    </div>
  );
};

export default LossAlertBadge;
