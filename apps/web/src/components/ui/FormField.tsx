'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-xs font-bold text-foreground">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={`w-full rounded-2xl border bg-background px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500/50 focus:ring-red-500/30'
              : 'border-input focus:ring-primary/30'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-[11px] font-semibold text-red-500">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
