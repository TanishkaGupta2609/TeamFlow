import React, { forwardRef } from 'react';
import { cn } from '../../utils';
import FormField from './FormField';

export const Input = forwardRef(({
  id,
  label,
  error,
  helperText,
  required,
  leftIcon,
  rightIcon,
  className,
  wrapperClassName,
  disabled = false,
  type = 'text',
  ...props
}, ref) => {
  const inputElement = (
    <div className="relative flex items-center">
      {leftIcon && (
        <div className="absolute left-3 text-charcoal-secondary pointer-events-none flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(
          'w-full h-10 px-3 bg-white text-charcoal text-sm rounded-input border transition-colors duration-150',
          'placeholder:text-charcoal-secondary/50',
          'focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest',
          'disabled:bg-ivory disabled:text-charcoal-secondary disabled:cursor-not-allowed',
          error
            ? 'border-status-danger text-status-danger focus:border-status-danger focus:ring-status-danger'
            : 'border-border hover:border-charcoal-secondary/60',
          leftIcon ? 'pl-9' : 'pl-3',
          rightIcon ? 'pr-9' : 'pr-3',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 text-charcoal-secondary flex items-center justify-center">
          {rightIcon}
        </div>
      )}
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
        {inputElement}
      </FormField>
    );
  }

  return inputElement;
});

Input.displayName = 'Input';

export default Input;
