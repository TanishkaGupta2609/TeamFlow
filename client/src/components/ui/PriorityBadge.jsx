import React from 'react';
import { ArrowDown, ArrowRight, ArrowUp, AlertCircle } from 'lucide-react';
import { cn } from '../../utils';

export const PriorityBadge = ({
  priority = 'medium',
  label,
  size = 'md',
  className,
}) => {
  const normalized = String(priority).toLowerCase();

  const configs = {
    low: {
      bg: 'bg-sage-light text-sage-dark border-sage-border',
      icon: <ArrowDown className="w-3 h-3 text-sage-dark" />,
      defaultLabel: 'Low',
    },
    medium: {
      bg: 'bg-forest/10 text-forest border-forest/20',
      icon: <ArrowRight className="w-3 h-3 text-forest" />,
      defaultLabel: 'Medium',
    },
    high: {
      bg: 'bg-amber-light text-amber-dark border-amber-accent/30',
      icon: <ArrowUp className="w-3 h-3 text-amber-dark" />,
      defaultLabel: 'High',
    },
    urgent: {
      bg: 'bg-status-dangerBg text-status-danger border-status-danger/30 font-semibold',
      icon: <AlertCircle className="w-3 h-3 text-status-danger" />,
      defaultLabel: 'Urgent',
    },
  };

  const config = configs[normalized] || configs.medium;

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.bg,
        sizes[size],
        className
      )}
    >
      <span className="shrink-0">{config.icon}</span>
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};

export default PriorityBadge;
