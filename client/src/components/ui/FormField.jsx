import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils';

export const FormField = ({
  id,
  label,
  error,
  helperText,
  required = false,
  className,
  children,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-charcoal flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-status-danger ml-1">*</span>}
          </span>
        </label>
      )}

      {children}

      {error ? (
        <p className="text-xs text-status-danger flex items-center gap-1 mt-0.5" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-charcoal-secondary mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormField;
