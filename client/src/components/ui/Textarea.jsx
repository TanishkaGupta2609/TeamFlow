import React, { forwardRef, useState } from 'react';
import { cn } from '../../utils';
import FormField from './FormField';

export const Textarea = forwardRef(({
  id,
  label,
  error,
  helperText,
  required,
  maxLength,
  showCount = false,
  rows = 4,
  className,
  wrapperClassName,
  disabled = false,
  onChange,
  value,
  defaultValue,
  ...props
}, ref) => {
  const [charCount, setCharCount] = useState(
    (value !== undefined ? String(value) : defaultValue ? String(defaultValue) : '').length
  );

  const handleChange = (e) => {
    setCharCount(e.target.value.length);
    if (onChange) onChange(e);
  };

  const textareaElement = (
    <div className="relative">
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={!!error}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={cn(
          'w-full p-3 bg-white text-charcoal text-sm rounded-input border transition-colors duration-150 resize-y',
          'placeholder:text-charcoal-secondary/50',
          'focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest',
          'disabled:bg-ivory disabled:text-charcoal-secondary disabled:cursor-not-allowed',
          error
            ? 'border-status-danger text-status-danger focus:border-status-danger focus:ring-status-danger'
            : 'border-border hover:border-charcoal-secondary/60',
          className
        )}
        {...props}
      />
      {showCount && maxLength && (
        <div className="absolute right-2.5 bottom-2.5 text-[11px] text-charcoal-secondary/70 bg-white/90 px-1 rounded">
          {charCount}/{maxLength}
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
        {textareaElement}
      </FormField>
    );
  }

  return textareaElement;
});

Textarea.displayName = 'Textarea';

export default Textarea;
