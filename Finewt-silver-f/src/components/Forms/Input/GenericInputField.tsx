import React, { forwardRef } from 'react';

interface InputProps {
  name?: string;
  label?: string;
  type?: string;
  compact?: boolean;

  inputMode?:
  | 'text'
  | 'numeric'
  | 'decimal'
  | 'search'
  | 'email'
  | 'tel'
  | 'url'
  | 'none';

  placeholder?: string;
  disabled?: boolean;
  defaultValue?: string | number;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
  value?: string | number;

  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  suffix?: React.ReactNode;
  suffixClassName?: string;

  step?: string | number;
  min?: number | string;
  max?: number | string;

  decimalScale?: number;
  allowNegative?: boolean;
  autoFocus?: boolean;
}

const GenericInputField = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      name,
      label,
      type = 'text',
      compact = false,
      inputMode,
      placeholder,
      disabled = false,
      defaultValue,
      required = false,
      className = '',
      readOnly = false,
      value,
      onChange,
      onBlur,
      onFocus,
      onKeyDown,
      suffix,
      suffixClassName = '',
      step,
      min,
      max,
      decimalScale,
      allowNegative = false,
      autoFocus = false,
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Merge forwarded ref and internal ref
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref],
    );

    React.useEffect(() => {
      if (autoFocus && !disabled && !readOnly) {
        const timer = setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [autoFocus, disabled, readOnly]);

    const isReadOnly = readOnly || disabled;
    const isDecimalInput = decimalScale !== undefined;

    const baseInputClasses = `
      w-full min-w-0 rounded-lg
      border border-[#d3c4af]/30
      bg-white
      ${compact ? 'h-8 px-2 py-1 text-sm font-medium rounded-md' : 'h-10 px-3 py-2 text-sm font-medium'}
      text-[#1a1c1b]
      placeholder:text-[#817563]
      outline-none
      transition-all duration-200
      focus:border-[#785600]
      focus:ring-2 focus:ring-[#785600]/10
      dark:bg-slate-800
      dark:text-white
      dark:border-slate-700
      dark:placeholder:text-slate-500

      ${isReadOnly
        ? 'border-[#c5b497] bg-[#eae3d5] text-black shadow-inner dark:border-slate-600 dark:bg-slate-800 dark:text-amber-400 cursor-default font-mono font-semibold'
        : 'hover:border-[#785600]/50'
      }

      ${suffix ? (compact ? 'pr-6' : 'pr-8') : ''}
      ${className}
    `;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isDecimalInput) {
        const inputValue = e.target.value;

        if (inputValue === '') {
          onChange?.(e);
          return;
        }

        if (allowNegative && (inputValue === '-' || inputValue === '+')) {
          onChange?.(e);
          return;
        }

        const validPattern = allowNegative ? /^[-+]?\d*\.?\d*$/ : /^\d*\.?\d*$/;
        if (!validPattern.test(inputValue)) return;

        const parts = inputValue.split('.');
        if (parts.length > 2) return;

        const decimalPart = parts[1];
        if (decimalPart !== undefined && decimalPart.length > decimalScale!) {
          return;
        }

        onChange?.(e);
      } else {
        onChange?.(e);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isDecimalInput) {
        if (e.ctrlKey || e.metaKey) {
          onKeyDown?.(e);
          return;
        }

        const invalidKeys = allowNegative ? ['e', 'E'] : ['e', 'E', '+', '-'];

        if (invalidKeys.includes(e.key)) {
          e.preventDefault();
          return;
        }

        const allowedKeys = [
          'Backspace',
          'Delete',
          'Tab',
          'Escape',
          'Enter',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
        ];

        if (allowedKeys.includes(e.key)) {
          // allowed
        } else if (e.key === '.') {
          const input = e.target as HTMLInputElement;
          const currentValue = input.value;
          const isTextSelected =
            input.selectionStart !== null &&
            input.selectionEnd !== null &&
            input.selectionStart !== input.selectionEnd;

          if (currentValue.includes('.') && !isTextSelected) {
            e.preventDefault();
          }
        } else if (allowNegative && (e.key === '-' || e.key === '+')) {
          const input = e.target as HTMLInputElement;
          const currentValue = input.value;
          const isTextSelected =
            input.selectionStart !== null &&
            input.selectionEnd !== null &&
            input.selectionStart !== input.selectionEnd;

          if (input.selectionStart !== 0 && !isTextSelected) {
            e.preventDefault();
          } else if (
            (currentValue.startsWith('-') || currentValue.startsWith('+')) &&
            !isTextSelected
          ) {
            e.preventDefault();
          }
        } else if (!/^\d$/.test(e.key)) {
          e.preventDefault();
        }
      }

      onKeyDown?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Only clear truly invalid lone symbols — never reformat a valid typed value
      if (isDecimalInput && e.target.value) {
        if (e.target.value === '-' || e.target.value === '+' || e.target.value === '.') {
          e.target.value = '';
          if (onChange) {
            const changeEvent = {
              ...e,
              target: { ...e.target, value: '' },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(changeEvent);
          }
        }
      }
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
    };

    const inputElement = (
      <input
        ref={setRefs}
        id={name}
        name={name}
        type={isDecimalInput ? 'text' : type}
        inputMode={isDecimalInput ? 'decimal' : inputMode}
        placeholder={placeholder}
        className={baseInputClasses}
        disabled={disabled}
        defaultValue={defaultValue}
        value={value ?? ''}
        readOnly={readOnly}
        required={required}
        autoFocus={autoFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        step={step}
        min={min}
        max={max}
      />
    );

    return (
      <div className="w-full min-w-0">
        {label && (
          <label
            htmlFor={name}
            className="mb-1.5 block text-sm font-medium text-[#1a1c1b] dark:text-white"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        {suffix ? (
          <div className="relative min-w-0">
            {inputElement}

            <div
              className={`absolute right-2 top-1/2 -translate-y-1/2 select-none text-xs font-semibold text-[#4f4535] dark:text-slate-400 ${suffixClassName} `}
            >
              {suffix}
            </div>
          </div>
        ) : (
          inputElement
        )}
      </div>
    );
  },
);

GenericInputField.displayName = 'GenericInputField';

export default GenericInputField;
