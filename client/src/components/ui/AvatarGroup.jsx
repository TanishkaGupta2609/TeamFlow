import React from 'react';
import Avatar from './Avatar';
import { cn } from '../../utils';

export const AvatarGroup = ({
  users = [],
  max = 4,
  size = 'sm',
  className,
}) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const overlapSizes = {
    xs: '-space-x-1.5',
    sm: '-space-x-2',
    md: '-space-x-2.5',
    lg: '-space-x-3',
    xl: '-space-x-4',
  };

  const badgeSizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div className={cn('flex items-center', overlapSizes[size], className)}>
      {visibleUsers.map((user, idx) => (
        <div key={user.id || idx} className="ring-2 ring-white rounded-full">
          <Avatar
            src={user.src || user.avatar}
            name={user.name}
            size={size}
            status={user.status}
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'ring-2 ring-white rounded-full bg-ivory text-charcoal font-heading font-semibold flex items-center justify-center border border-border select-none shrink-0',
            badgeSizes[size]
          )}
          title={`${remainingCount} more members`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
