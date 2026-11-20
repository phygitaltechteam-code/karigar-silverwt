import React, { useState } from 'react';
import { Controller, Control, useFormContext } from 'react-hook-form';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface GenericDropdownProps {
  name?: string;
  label?: string;
  options: Option[];
  defaultOption?: string;
  placeholder?: string;
  control?: Control<Record<string, unknown>> | any;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
  icon?: React.ReactNode;
  darkMode?: boolean;
}

const GenericDropdownBody: React.FC<{
  label?: string;
  options: Option[];
  defaultOption?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: any;
  icon?: React.ReactNode;
  darkMode?: boolean;
  name?: string;
}> = ({
  label,
  options,
  defaultOption = '',
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  className = '',
  error,
  icon,
  darkMode = false,
  name,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;
  const selectedOption = options?.find((opt) => opt.value === value);

  const labelClasses = darkMode
    ? 'mb-2 block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400'
    : 'mb-2 block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#4f4535]';

  const inputClasses = darkMode
    ? `
      w-full appearance-none rounded-lg border border-slate-700/50 bg-slate-800/50 
      px-4 py-2.5 text-sm text-slate-200 outline-none transition-all duration-200
      placeholder:text-slate-600 placeholder:text-sm
      ${icon ? 'pl-10' : 'pl-4'}
      pr-10
      ${
        hasError
          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
          : 'focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'
      }
      ${
        disabled
          ? 'cursor-not-allowed bg-slate-900/50 text-slate-500'
          : 'cursor-pointer hover:border-amber-500/30'
      }
      ${isFocused && !hasError ? 'border-amber-500/50 ring-2 ring-amber-500/20' : ''}
    `
    : `
      w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-[#1a1c1b] 
      outline-none transition-all duration-200
      placeholder:text-[#817563] placeholder:text-sm
      ${icon ? 'pl-10' : 'pl-4'}
      pr-10
      ${
        hasError
          ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/10'
          : 'border-[#d3c4af]/30 focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10'
      }
      ${
        disabled
          ? 'cursor-not-allowed bg-[#f4f4f2] text-[#817563]'
          : 'cursor-pointer hover:border-[#785600]/50'
      }
      ${isFocused && !hasError ? 'border-[#785600] ring-2 ring-[#785600]/10' : ''}
    `;

  const iconClasses = darkMode
    ? 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-500'
    : 'absolute left-3 top-1/2 -translate-y-1/2 text-[#817563]';

  const arrowClasses = darkMode
    ? 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-200'
    : 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] transition-transform duration-200';

  const errorClasses = darkMode
    ? 'mt-1.5 text-[11px] text-red-400'
    : 'mt-1.5 text-[11px] text-[#ba1a1a]';

  const helperClasses = darkMode
    ? 'mt-1.5 text-[10px] text-slate-500'
    : 'mt-1.5 text-[10px] text-[#817563]';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="ml-1 text-[#ba1a1a]">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && <div className={iconClasses}>{icon}</div>}

        <select
          name={name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          disabled={disabled}
          className={inputClasses}
        >
          <option value="" disabled hidden>
            {placeholder || defaultOption || `Select ${label || 'option'}`}
          </option>
          {options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className={
                darkMode
                  ? 'bg-slate-800 text-slate-200'
                  : 'bg-white text-[#1a1c1b]'
              }
            >
              {option.label}
            </option>
          ))}
        </select>

        <span className={arrowClasses}>
          <ChevronDown
            className={`h-4 w-4 ${isFocused ? 'rotate-180' : ''}`}
          />
        </span>
      </div>

      {hasError && (
        <p className={errorClasses}>
          {typeof error === 'string' ? error : error?.message || `Please select a valid ${label?.toLowerCase() || 'option'}`}
        </p>
      )}
    </div>
  );
};

const GenericDropdown: React.FC<GenericDropdownProps> = (props) => {
  const formContext = useFormContext();
  const effectiveControl = props.control || formContext?.control;

  if (effectiveControl && props.name) {
    return (
      <Controller
        name={props.name}
        control={effectiveControl}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <GenericDropdownBody
            {...props}
            value={props.value !== undefined ? props.value : (value || '')}
            onChange={(val) => {
              onChange(val);
              if (props.onChange) props.onChange(val);
            }}
            onBlur={onBlur}
            error={props.error || error}
          />
        )}
      />
    );
  }

  return (
    <GenericDropdownBody
      {...props}
      value={props.value || ''}
      onChange={(val) => {
        if (props.onChange) props.onChange(val);
      }}
    />
  );
};

export default GenericDropdown;
