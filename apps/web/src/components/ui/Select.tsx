'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className = '', id, ...props }, ref) => {
    const fieldId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-xs font-bold text-foreground">
          {label}
        </label>
        <select
          ref={ref}
          id={fieldId}
          className={`w-full rounded-2xl border bg-background px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-input focus:ring-primary/30'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
