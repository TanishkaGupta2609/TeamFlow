import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize,
  className,
}) => {
  const getPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-xs text-charcoal-secondary',
        className
      )}
    >
      {totalItems !== undefined && (
        <div>
          Showing{' '}
          <span className="font-semibold text-charcoal">
            {Math.min((currentPage - 1) * (pageSize || 10) + 1, totalItems)}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-charcoal">
            {Math.min(currentPage * (pageSize || 10), totalItems)}
          </span>{' '}
          of <span className="font-semibold text-charcoal">{totalItems}</span> results
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-md border border-border bg-white text-charcoal hover:bg-ivory disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPages().map((page, index) =>
          page === '...' ? (
            <span key={`dots-${index}`} className="px-2 py-1 text-charcoal-secondary select-none">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-8 h-8 px-2 flex items-center justify-center rounded-md font-medium text-xs transition-colors',
                currentPage === page
                  ? 'bg-forest text-white shadow-subtle'
                  : 'bg-white border border-border text-charcoal hover:bg-ivory'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-md border border-border bg-white text-charcoal hover:bg-ivory disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
