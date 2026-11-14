import React, { forwardRef, useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../utils';

export const Checkbox = forwardRef(({
  id,
  label,
  description,
  checked = false,
  indeterminate = false,
  disabled = false,
  onChange,
  className,
  ...props
}, ref) => {
  const localRef = useRef(null);
  const resolvedRef = ref || localRef;

  useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate, resolvedRef]);

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-start gap-2.5 cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          ref={resolvedRef}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'w-4 h-4 rounded border transition-colors flex items-center justify-center',
            checked || indeterminate
              ? 'bg-forest border-forest text-white'
              : 'bg-white border-border hover:border-charcoal-secondary',
            disabled && 'bg-ivory border-border text-charcoal-secondary'
          )}
        >
          {indeterminate ? (
            <Minus className="w-3 h-3 stroke-[3]" />
          ) : checked ? (
            <Check className="w-3 h-3 stroke-[3]" />
          ) : null}
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && <span className="text-xs font-semibold text-charcoal">{label}</span>}
          {description && (
            <span className="text-xs text-charcoal-secondary">{description}</span>
          )}
        </div>
      )}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
