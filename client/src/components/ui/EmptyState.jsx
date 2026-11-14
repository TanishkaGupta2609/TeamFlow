import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '../../utils';

export const EmptyState = ({
  icon,
  title = 'No items found',
  description = 'Get started by creating your first item or adjusting your filters.',
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-border bg-white/60',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-forest/5 text-forest flex items-center justify-center mb-4">
        {icon || <FolderOpen className="w-6 h-6 stroke-[1.5]" />}
      </div>
      <h3 className="font-heading font-bold text-base text-charcoal">
        {title}
      </h3>
      <p className="text-xs text-charcoal-secondary max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
