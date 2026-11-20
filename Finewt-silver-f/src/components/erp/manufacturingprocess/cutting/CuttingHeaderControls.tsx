import React from 'react';
import { ChevronRight, ChevronDown, Printer, Search } from 'lucide-react';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

interface CuttingHeaderControlsProps {
  showHistory: boolean;
  historySearchTerm: string;
  setHistorySearchTerm: (value: string) => void;
  dateRange: Date[];
  setDateRange: React.Dispatch<React.SetStateAction<Date[]>>;
  isTrial: boolean;
  setIsDateFilterActive: (active: boolean) => void;
  handlePrint: () => void;
  toggleHistory: () => void;
}

export const CuttingHeaderControls: React.FC<CuttingHeaderControlsProps> = ({
  showHistory,
  historySearchTerm,
  setHistorySearchTerm,
  dateRange,
  setDateRange,
  isTrial,
  setIsDateFilterActive,
  handlePrint,
  toggleHistory,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 [&>*:first-child]:mr-auto">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
          {showHistory ? 'Cutting History' : 'Cutting Department'}
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showHistory && (
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
        )}

        {showHistory && (
          <div className="flex flex-wrap items-center gap-2">
            <GenericWeeklyDatePicker
              id="from-date-box"
              placeholder="DD/MM/YYYY"
              mode="from"
              initialDates={dateRange}
              onDateChange={(dates) => {
                if (isTrial) setIsDateFilterActive(true);
                if (dates && dates.length > 0) {
                  const from = new Date(dates[0]);
                  from.setHours(0, 0, 0, 0);
                  setDateRange((prev) => [from, prev[1] || from]);
                } else {
                  setDateRange((prev) => [undefined as any, prev[1]]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />

            <GenericWeeklyDatePicker
              id="to-date-box"
              placeholder="DD/MM/YYYY"
              mode="to"
              initialDates={dateRange}
              onDateChange={(dates) => {
                if (isTrial) setIsDateFilterActive(true);
                if (dates && dates.length > 0) {
                  const to = new Date(dates[0]);
                  to.setHours(23, 59, 59, 999);
                  setDateRange((prev) => [prev[0] || to, to]);
                } else {
                  setDateRange((prev) => [prev[0], undefined as any]);
                }
              }}
              className="w-32 sm:w-36 md:w-40"
            />
          </div>
        )}

        {showHistory && (
          <GenericButton size="sm"
            type="button"
            onClick={handlePrint}
            variant="primary"
          >
            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Print</span>
          </GenericButton>
        )}

        <GenericButton size="sm"
          type="button"
          onClick={toggleHistory}
          variant="primary"
        >
          {showHistory ? (
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
          <span>{showHistory ? 'Show Cutting' : 'History'}</span>
        </GenericButton>
      </div>
    </div>
  );
};

export default CuttingHeaderControls;
