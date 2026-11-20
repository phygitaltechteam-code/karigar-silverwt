import React, {useEffect, useRef, useState} from 'react';
import flatpickr from 'flatpickr';
import {Calendar, X} from 'lucide-react';
import 'flatpickr/dist/flatpickr.min.css';
import {getSavedWeekCycle} from '@/utils/weekRangeUtils';

interface GenericWeeklyDatePickerProps {
  id: string;
  placeholder?: string;
  onDateChange?: (dates: Date[]) => void;
  label?: string;
  required?: boolean;
  className?: string;
  initialDates?: Date[];
  mode?: 'from' | 'to';
}

const GenericWeeklyDatePicker: React.FC<GenericWeeklyDatePickerProps> = ({
  id,
  placeholder = 'DD/MM/YYYY',
  onDateChange,
  label,
  required = false,
  className = '',
  initialDates = [],
  mode = 'from',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrInstanceRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Initialize selectedDate from initialDates
  useEffect(() => {
    if (initialDates && initialDates.length > 0) {
      let date: Date | null = null;
      if (mode === 'from') {
        date = initialDates[0] || null;
      } else if (mode === 'to') {
        date =
          initialDates.length > 1
            ? initialDates[1] || null
            : initialDates[0] || null;
      }
      setSelectedDate(date);
    } else {
      setSelectedDate(null);
    }
  }, [initialDates, mode]);

  const formatDateForDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleClearDate = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedDate(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    if (flatpickrInstanceRef.current) {
      flatpickrInstanceRef.current.clear();
      // Don't call setDate here, just clear
    }

    onDateChange?.([]);
  };

  // Initialize Flatpickr - runs only once
  useEffect(() => {
    if (!inputRef.current) return;

    const {startDay} = getSavedWeekCycle();

    const fp = flatpickr(inputRef.current, {
      mode: 'single',
      dateFormat: 'd/m/Y',
      locale: {
        firstDayOfWeek: startDay as any, // Start week on configured day (0 for Sun, 1 for Mon, etc.)
      },
      onChange: (dates) => {
        if (dates && dates.length > 0) {
          const selected = dates[0];
          setSelectedDate(selected);

          if (inputRef.current) {
            inputRef.current.value = formatDateForDisplay(selected);
          }

          onDateChange?.(dates);
        }
      },
      monthSelectorType: 'static',
      position: 'auto',
      static: false,
      appendTo: document.body,
      disableMobile: false,
      prevArrow:
        '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
      nextArrow:
        '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0 0 5.4z" /></svg>',
    });

    flatpickrInstanceRef.current = fp;

    // Set initial value if there is a selected date
    if (selectedDate) {
      inputRef.current.value = formatDateForDisplay(selectedDate);
      fp.setDate(selectedDate, false);
    }

    const handleCycleChange = (e: any) => {
      if (fp && e.detail && typeof e.detail.startDay === 'number') {
        fp.set('locale', {firstDayOfWeek: e.detail.startDay});
      }
    };
    window.addEventListener('app_week_cycle_changed', handleCycleChange);

    return () => {
      window.removeEventListener('app_week_cycle_changed', handleCycleChange);
      fp.destroy();
      flatpickrInstanceRef.current = null;
    };
  }, []);

  // Update flatpickr when selectedDate changes from parent
  useEffect(() => {
    if (!inputRef.current || !flatpickrInstanceRef.current) return;

    if (selectedDate) {
      inputRef.current.value = formatDateForDisplay(selectedDate);
      flatpickrInstanceRef.current.setDate(selectedDate, false);
    } else {
      inputRef.current.value = '';
      flatpickrInstanceRef.current.clear();
    }
  }, [selectedDate]);

  const hasValue = selectedDate !== null;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-[9px] font-bold uppercase text-[#4f4535] dark:text-slate-400 sm:text-[10px]"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={placeholder}
          readOnly
          className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 pr-12 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:px-3 sm:py-2 sm:pr-14 sm:text-sm"
        />

        {/* Clear Button */}
        {hasValue && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleClearDate}
            className="text-gray-400 absolute inset-y-0 right-8 z-20 flex items-center justify-center px-1 transition-colors hover:text-red-500 sm:right-9"
            title="Clear date"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}

        {/* Calendar Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex items-center sm:right-3">
          <Calendar className="h-3.5 w-3.5 text-[#817563] sm:h-4 sm:w-4" />
        </div>
      </div>
    </div>
  );
};

export default GenericWeeklyDatePicker;
