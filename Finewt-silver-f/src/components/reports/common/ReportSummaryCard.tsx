import React from 'react';

export interface ReportSummaryCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}

export const ReportSummaryCard: React.FC<ReportSummaryCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  className = '',
  valueClassName = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-[#d3c4af]/20 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      <div className="flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
          {title}
        </span>
        <span
          className={`text-base font-black text-[#1a1c1b] dark:text-white sm:text-lg ${valueClassName}`}
        >
          {value}{' '}
          {unit ? <span className="text-xs font-semibold">{unit}</span> : null}
        </span>
        {subtitle && (
          <span className="mt-0.5 text-[10px] text-[#817563] dark:text-slate-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default ReportSummaryCard;
