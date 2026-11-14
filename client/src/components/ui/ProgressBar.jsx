import React from 'react';
import { cn } from '../../utils';

export const ProgressBar = ({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  variant = 'forest',
  size = 'md',
  className,
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const variants = {
    forest: 'bg-forest',
    amber: 'bg-amber-accent',
    sage: 'bg-sage-dark',
    success: 'bg-status-success',
    danger: 'bg-status-danger',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-charcoal">{label}</span>}
          {showPercentage && (
            <span className="font-semibold text-charcoal-secondary">{percentage}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-border rounded-full overflow-hidden', sizes[size])}>
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ width: `${percentage}%` }}
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            variants[variant] || variants.forest
          )}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
