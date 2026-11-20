import React from 'react';
import {Printer} from 'lucide-react';

export interface ReportExportButtonProps {
  onClick: () => void;
  label?: string;
  loading?: boolean;
  className?: string;
}

export const ReportExportButton: React.FC<ReportExportButtonProps> = ({
  onClick,
  label = 'Print',
  loading = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-[#785600] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#5d4200] active:scale-95 disabled:opacity-60 sm:py-2 sm:text-sm ${className}`}
      title="Print / Save PDF"
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      <span>{label}</span>
    </button>
  );
};

export default ReportExportButton;
