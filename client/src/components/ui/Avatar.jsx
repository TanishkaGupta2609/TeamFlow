import React, { useState } from 'react';
import { cn } from '../../utils';

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  status,
  className,
}) => {
  const [hasError, setHasError] = useState(false);

  // Extract initials
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2',
  };

  const statusColors = {
    online: 'bg-status-success',
    offline: 'bg-charcoal-secondary',
    busy: 'bg-status-danger',
    away: 'bg-amber-accent',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0', className)}>
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className={cn('rounded-full object-cover border border-border shadow-subtle', sizes[size])}
        />
      ) : (
        <div
          title={name}
          className={cn(
            'rounded-full bg-forest text-white font-heading font-semibold flex items-center justify-center border border-border shadow-subtle select-none',
            sizes[size]
          )}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-white',
            statusSizes[size],
            statusColors[status] || 'bg-charcoal-secondary'
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
