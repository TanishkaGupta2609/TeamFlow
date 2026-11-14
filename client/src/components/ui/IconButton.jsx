import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export const IconButton = forwardRef(({
  icon,
  'aria-label': ariaLabel,
  className,
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-btn transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-forest text-white hover:bg-forest-hover active:bg-forest-dark focus-visible:ring-forest shadow-sm',
    secondary: 'bg-forest-secondary text-white hover:bg-forest active:bg-forest-dark focus-visible:ring-forest-secondary shadow-sm',
    outline: 'border border-border text-charcoal bg-white hover:bg-ivory active:bg-ivory-muted focus-visible:ring-forest shadow-subtle',
    ghost: 'text-charcoal-secondary hover:text-charcoal hover:bg-forest/5 active:bg-forest/10 focus-visible:ring-forest',
    destructive: 'text-status-danger hover:bg-status-dangerBg focus-visible:ring-status-danger',
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : icon}
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton;
