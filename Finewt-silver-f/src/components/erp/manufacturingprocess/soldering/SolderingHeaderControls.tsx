import React from 'react';
import { ChevronRight, ChevronDown, Printer, Search } from 'lucide-react';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

interface SolderingHeaderControlsProps {
  showHistory: boolean;
  tableSearchTerm: string;
  setTableSearchTerm: (value: string) => void;
  historySearchTerm: string;
  setHistorySearchTerm: (value: string) => void;
  fromDate: Date | null;
  setFromDate: (date: Date | null) => void;
  toDate: Date | null;
  setToDate: (date: Date | null) => void;
  isTrial: boolean;
  setIsDateFilterActive: (active: boolean) => void;
  handlePrintHistory: () => void;
  toggleHistory: () => void;
}

export const SolderingHeaderControls: React.FC<SolderingHeaderControlsProps> = ({
  showHistory,
  tableSearchTerm,
  setTableSearchTerm,
  historySearchTerm,
  setHistorySearchTerm,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  isTrial,
  setIsDateFilterActive,
  handlePrintHistory,
  toggleHistory,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
          {showHistory ? 'Soldering History' : 'Soldering Department'}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!showHistory && (
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
            <input
              autoComplete="off"
              data-lpignore="true"
              type="search"
              placeholder="Search design, stamp, karigar..."
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-1.5 pl-9 pr-3 text-xs text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        )}

        {showHistory && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-48 md:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
              autoComplete="off"
              data-lpignore="true"
                type="search"
                placeholder="Search history..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <GenericWeeklyDatePicker
              id="from-date-box"
              placeholder="DD/MM/YYYY"
              mode="from"
              initialDates={fromDate ? [fromDate] : []}
              onDateChange={(dates) => {
                if (isTrial) setIsDateFilterActive(true);
                if (dates && dates.length > 0) {
                  const selected = new Date(dates[0]);
                  selected.setHours(0, 0, 0, 0);
                  setFromDate(selected);
                } else {
                  setFromDate(null);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />

            <GenericWeeklyDatePicker
              id="to-date-box"
              placeholder="DD/MM/YYYY"
              mode="to"
              initialDates={toDate ? [toDate] : []}
              onDateChange={(dates) => {
                if (isTrial) setIsDateFilterActive(true);
                if (dates && dates.length > 0) {
                  const selected = new Date(dates[0]);
                  selected.setHours(23, 59, 59, 999);
                  setToDate(selected);
                } else {
                  setToDate(null);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />
          </div>
        )}

        {showHistory && (
          <GenericButton size="sm"
            type="button"
            onClick={handlePrintHistory}
            variant="primary"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </GenericButton>
        )}

        <GenericButton size="sm"
          type="button"
          onClick={toggleHistory}
          variant="primary"
        >
          {showHistory ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span>{showHistory ? 'Show Soldering' : 'History'}</span>
        </GenericButton>
      </div>
    </div>
  );
};
export default SolderingHeaderControls;
