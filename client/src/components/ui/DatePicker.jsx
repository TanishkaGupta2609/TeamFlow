import React, { forwardRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import Input from './Input';

export const DatePicker = forwardRef(({
  id,
  label,
  error,
  helperText,
  required,
  ...props
}, ref) => {
  return (
    <Input
      ref={ref}
      id={id}
      type="date"
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      leftIcon={<CalendarIcon className="w-4 h-4 text-charcoal-secondary" />}
      {...props}
    />
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;
