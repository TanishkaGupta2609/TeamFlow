import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import Input from './Input';

export const SearchInput = forwardRef(({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search projects, tasks, members...',
  className,
  ...props
}, ref) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <Input
      ref={ref}
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      leftIcon={<Search className="w-4 h-4 text-charcoal-secondary" />}
      rightIcon={
        value ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-charcoal-secondary hover:text-charcoal p-1 focus:outline-none"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null
      }
      className={className}
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
