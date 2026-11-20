import React, {useEffect, useRef, useState} from 'react';
import {Controller, useFormContext} from 'react-hook-form';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  name: string;
  label?: string;
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  singleSelect?: boolean;
  value?: string[];
  onChange?: (values: string[]) => void;
}

const CustomMultiSelectDropdown: React.FC<MultiSelectProps> = ({
  name,
  label,
  options,
  disabled = false,
  placeholder = 'Select options',
  className,
  singleSelect = false,
  value: externalValue,
  onChange: externalOnChange,
}) => {
  const formContext = useFormContext();
  const control = formContext?.control;
  const errors = formContext?.formState?.errors || {};

  const [isOpen, setIsOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState<string[]>(externalValue || []);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalSelected(externalValue);
    }
  }, [externalValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderDropdownBody = (selectedValues: string[], handleChange: (vals: string[]) => void) => (
    <div className="relative w-full">
      <div
        className={`mt-1 flex min-h-[38px] cursor-pointer flex-wrap items-center gap-1 rounded-md border border-stroke bg-transparent px-2 py-1 text-sm text-black transition focus-within:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${className || ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        {selectedValues.length > 0 ? (
          selectedValues.map((val) => {
            const option = options.find((o) => o.value === val);

            return (
              <span
                key={val}
                className="bg-gray-200 text-gray-800 flex items-center gap-1 rounded px-2 py-0.5 text-xs dark:bg-blue-600 dark:text-white"
              >
                {option?.label || val}
                {!disabled && (
                  <button
                    type="button"
                    className="text-gray-500 ml-1 hover:text-red-500 dark:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = selectedValues.filter((id) => id !== val);
                      handleChange(updated);
                    }}
                  >
                    ✕
                  </button>
                )}
              </span>
            );
          })
        ) : (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-stroke bg-white shadow-md dark:border-form-strokedark dark:bg-slate-900">
          {options
            .filter((opt) => !selectedValues.includes(opt.value))
            .map((opt) => (
              <div
                key={opt.value}
                className="hover:bg-gray-100 cursor-pointer px-3 py-2 text-sm dark:hover:bg-blue-700"
                onClick={() => {
                  const newValue = singleSelect
                    ? [opt.value]
                    : [...selectedValues, opt.value];

                  handleChange(newValue);

                  if (singleSelect) {
                    setIsOpen(false);
                  }
                }}
              >
                {opt.label}
              </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label className="mb-1.5 block text-sm text-black dark:text-white">
          {label}
        </label>
      )}

      {control ? (
        <Controller
          name={name}
          control={control}
          render={({field}) => {
            const selectedValues: string[] = field.value || [];
            return renderDropdownBody(selectedValues, (vals) => field.onChange(vals));
          }}
        />
      ) : (
        renderDropdownBody(internalSelected, (vals) => {
          setInternalSelected(vals);
          if (externalOnChange) externalOnChange(vals);
        })
      )}

      {errors[name] && (
        <p className="mt-1 text-sm text-red-500">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
};

export default CustomMultiSelectDropdown;
