import React, {useEffect, useRef, useState} from 'react';
import flatpickr from 'flatpickr';
import {Calendar, X} from 'lucide-react';
import 'flatpickr/dist/flatpickr.min.css';

interface GenericDatePickerProps {
  id: string;
  placeholder?: string;
  dateFormat?: string;
  initialDate?: Date | string;
  onDateChange?: (selectedDate: Date[]) => void;
  label?: string;
  required?: boolean;
  className?: string;
  value?: string;
}

const GenericDatePicker: React.FC<GenericDatePickerProps> = ({
  id,
  placeholder = 'DD/MM/YYYY',
  dateFormat = 'd/m/Y',
  initialDate,
  onDateChange,
  label,
  required = false,
  className = '',
  value,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrInstanceRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (initialDate) {
      return typeof initialDate === 'string'
        ? new Date(initialDate)
        : initialDate;
    }
    if (value) {
      return new Date(value);
    }
    return null;
  });

  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle clear date
  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Clear the input value
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    // Clear flatpickr instance
    if (flatpickrInstanceRef.current) {
      flatpickrInstanceRef.current.clear();
      flatpickrInstanceRef.current.setDate(null);
    }

    setSelectedDate(null);

    // Notify parent with empty array
    onDateChange?.([]);
  };

  useEffect(() => {
    if (!inputRef.current) return;

    // Set initial value
    if (selectedDate && inputRef.current) {
      inputRef.current.value = formatDateForDisplay(selectedDate);
    }

    const fp = flatpickr(inputRef.current, {
      mode: 'single',
      defaultDate: selectedDate || initialDate || value || undefined,
      dateFormat: dateFormat,
      onChange: (dates) => {
        if (dates && dates.length > 0) {
          setSelectedDate(dates[0]);
          if (inputRef.current) {
            inputRef.current.value = formatDateForDisplay(dates[0]);
          }
          onDateChange?.(dates);
        }
      },
      monthSelectorType: 'static',
      position: 'auto',
      static: false,
      appendTo: document.body,
      prevArrow:
        '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
      nextArrow:
        '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0l5.4 5.4z" /></svg>',
    });

    flatpickrInstanceRef.current = fp;

    return () => {
      fp.destroy();
      flatpickrInstanceRef.current = null;
    };
  }, []);

  // Update when initialDate or value changes externally
  useEffect(() => {
    if (!inputRef.current) return;

    const date = initialDate || value;
    if (date) {
      const newDate = typeof date === 'string' ? new Date(date) : date;

      // Only update if the date is different
      if (selectedDate && newDate.getTime() === selectedDate.getTime()) {
        return;
      }

      setSelectedDate(newDate);

      if (inputRef.current) {
        inputRef.current.value = formatDateForDisplay(newDate);
      }

      if (flatpickrInstanceRef.current) {
        flatpickrInstanceRef.current.setDate(newDate);
      }
    }
  }, [initialDate, value]);

  const hasValue = selectedDate !== null || value || initialDate;

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
          className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 pr-12 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          placeholder={placeholder}
          readOnly
        />

        {/* Clear button - shows only when there's a value */}
        {hasValue && (
          <button
            type="button"
            onClick={handleClearDate}
            className="text-gray-400 absolute inset-0 left-auto right-8 flex items-center transition-colors hover:text-red-500"
            title="Clear date"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}

        {/* Calendar icon */}
        <div className="pointer-events-none absolute inset-0 left-auto right-3 flex items-center">
          <Calendar className="h-4 w-4 text-[#817563]" />
        </div>
      </div>
    </div>
  );
};

export default GenericDatePicker;
