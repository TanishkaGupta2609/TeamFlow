import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils';
import FormField from './FormField';

export const Select = forwardRef(({
  id,
  label,
  error,
  helperText,
  required,
  options = [],
  placeholder = 'Select an option',
  className,
  wrapperClassName,
  disabled = false,
  children,
  ...props
}, ref) => {
  const selectElement = (
    <div className="relative flex items-center">
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          'w-full h-10 pl-3 pr-9 bg-white text-charcoal text-sm rounded-input border appearance-none transition-colors duration-150',
          'focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest cursor-pointer',
          'disabled:bg-ivory disabled:text-charcoal-secondary disabled:cursor-not-allowed',
          error
            ? 'border-status-danger text-status-danger focus:border-status-danger focus:ring-status-danger'
            : 'border-border hover:border-charcoal-secondary/60',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
      </select>
      <div className="absolute right-3 text-charcoal-secondary pointer-events-none flex items-center justify-center">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );

  if (label || error || helperText) {
    return (
      <FormField
        id={id}
        label={label}
        error={error}
        helperText={helperText}
        required={required}
        className={wrapperClassName}
      >
        {selectElement}
      </FormField>
    );
  }

  return selectElement;
});

Select.displayName = 'Select';

export default Select;
