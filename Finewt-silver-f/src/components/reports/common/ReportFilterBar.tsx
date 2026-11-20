import React from 'react';
import {Search, ArrowLeft} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';

export interface ReportFilterBarProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backUrl,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search report...',
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 border-b border-[#d3c4af]/30 bg-white/95 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title Area */}
        <div className="flex items-center gap-2.5">
          {showBackButton && (
            <button
              onClick={() =>
                backUrl ? navigate({to: backUrl as any}) : window.history.back()
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d3c4af]/40 bg-white text-[#785600] transition-colors hover:bg-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[#817563] dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Action & Filter Controls */}
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          {onSearchChange && (
            <div className="relative w-full sm:w-44 md:w-52">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder={searchPlaceholder}
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default ReportFilterBar;
