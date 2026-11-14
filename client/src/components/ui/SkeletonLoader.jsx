import React from 'react';
import { cn } from '../../utils';

export const SkeletonLoader = ({
  variant = 'text',
  width,
  height,
  className,
  count = 1,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full shrink-0';
      case 'card':
        return 'rounded-card h-32 w-full';
      case 'button':
        return 'rounded-btn h-10 w-24';
      case 'input':
        return 'rounded-input h-10 w-full';
      case 'text':
      default:
        return 'rounded h-4 w-full';
    }
  };

  const elements = Array.from({ length: count }, (_, idx) => (
    <div
      key={idx}
      style={{
        width: width,
        height: height,
      }}
      className={cn(
        'bg-border/60 animate-pulse',
        getVariantStyles(),
        className
      )}
    />
  ));

  if (count === 1) return elements[0];

  return <div className="space-y-2">{elements}</div>;
};

export default SkeletonLoader;
