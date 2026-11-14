import React from 'react';
import { cn } from '../../utils';

export const StatusBadge = ({
  status = 'active',
  label,
  size = 'md',
  className,
}) => {
  const normalized = String(status).toLowerCase().replace(/\s+/g, '_');

  const configs = {
    active: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
      defaultLabel: 'Active',
    },
    in_progress: {
      bg: 'bg-forest/10 text-forest border-forest/20',
      dot: 'bg-forest',
      defaultLabel: 'In Progress',
    },
    completed: {
      bg: 'bg-emerald-50 text-status-success border-emerald-200',
      dot: 'bg-status-success',
      defaultLabel: 'Completed',
    },
    planning: {
      bg: 'bg-sage-light text-sage-dark border-sage-border',
      dot: 'bg-sage-dark',
      defaultLabel: 'Planning',
    },
    todo: {
      bg: 'bg-ivory-muted text-charcoal-secondary border-border',
      dot: 'bg-charcoal-secondary',
      defaultLabel: 'To Do',
    },
    review: {
      bg: 'bg-amber-light text-amber-dark border-amber-accent/30',
      dot: 'bg-amber-accent',
      defaultLabel: 'In Review',
    },
    on_hold: {
      bg: 'bg-amber-light text-amber-dark border-amber-accent/30',
      dot: 'bg-amber-dark',
      defaultLabel: 'On Hold',
    },
    blocked: {
      bg: 'bg-status-dangerBg text-status-danger border-status-danger/20',
      dot: 'bg-status-danger',
      defaultLabel: 'Blocked',
    },
    cancelled: {
      bg: 'bg-stone-100 text-stone-600 border-stone-200',
      dot: 'bg-stone-400',
      defaultLabel: 'Cancelled',
    },
  };

  const config = configs[normalized] || {
    bg: 'bg-ivory-muted text-charcoal-secondary border-border',
    dot: 'bg-charcoal-secondary',
    defaultLabel: status,
  };

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
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};

export default StatusBadge;
