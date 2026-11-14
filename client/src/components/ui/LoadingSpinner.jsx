import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export const LoadingSpinner = ({
  size = 'md',
  color = 'forest',
  label,
  className,
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colors = {
    forest: 'text-forest',
    white: 'text-white',
    amber: 'text-amber-accent',
    muted: 'text-charcoal-secondary',
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)} role="status">
      <Loader2 className={cn('animate-spin shrink-0', sizes[size], colors[color])} />
      {label && <span className="text-xs text-charcoal-secondary">{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default LoadingSpinner;
