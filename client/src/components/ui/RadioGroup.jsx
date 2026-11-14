import React from 'react';
import { cn } from '../../utils';

export const RadioGroup = ({
  name,
  label,
  options = [],
  value,
  onChange,
  disabled = false,
  className,
  orientation = 'vertical',
}) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <span className="text-xs font-semibold text-charcoal">{label}</span>}
      <div
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {options.map((option) => {
          const isChecked = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <label
              key={option.value}
              className={cn(
                'inline-flex items-start gap-2.5 cursor-pointer select-none',
                isDisabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => !isDisabled && onChange && onChange(option.value)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border transition-all flex items-center justify-center',
                    isChecked
                      ? 'border-forest bg-white'
                      : 'border-border bg-white hover:border-charcoal-secondary',
                    isDisabled && 'bg-ivory'
                  )}
                >
                  {isChecked && (
                    <div className="w-2 h-2 rounded-full bg-forest" />
                  )}
                </div>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-charcoal">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-charcoal-secondary">{option.description}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default RadioGroup;
