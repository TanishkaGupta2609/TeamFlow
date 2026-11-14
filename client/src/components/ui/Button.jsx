import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export const Button = forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-btn transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-forest text-white hover:bg-forest-hover active:bg-forest-dark focus-visible:ring-forest shadow-sm',
    secondary: 'bg-forest-secondary text-white hover:bg-forest active:bg-forest-dark focus-visible:ring-forest-secondary shadow-sm',
    outline: 'border border-border text-charcoal bg-white hover:bg-ivory active:bg-ivory-muted focus-visible:ring-forest shadow-subtle',
    ghost: 'text-charcoal hover:bg-forest/5 active:bg-forest/10 focus-visible:ring-forest',
    destructive: 'bg-status-danger text-white hover:opacity-90 active:opacity-100 focus-visible:ring-status-danger shadow-sm',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
