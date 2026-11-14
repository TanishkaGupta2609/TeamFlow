import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';
import EmptyState from './EmptyState';
import { cn } from '../../utils';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
  emptyAction,
  sortColumn,
  sortDirection = 'asc',
  onSort,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  className,
}) => {
  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < data.length;

  const handleHeaderSort = (col) => {
    if (!col.sortable || !onSort) return;
    if (sortColumn === col.key) {
      onSort(col.key, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(col.key, 'asc');
    }
  };

  return (
    <div className={cn('w-full overflow-hidden rounded-xl border border-border bg-white shadow-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="bg-ivory border-b border-border text-charcoal-secondary uppercase tracking-wider font-semibold">
              {onSelectAll && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-border text-forest focus:ring-forest cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => handleHeaderSort(col)}
                  className={cn(
                    'px-4 py-3 font-semibold text-charcoal select-none',
                    col.sortable && 'cursor-pointer hover:bg-ivory-muted/70 transition-colors',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      col.align === 'right' && 'justify-end',
                      col.align === 'center' && 'justify-center'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-charcoal-secondary">
                        {sortColumn === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-forest" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-forest" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={`loading-${rIdx}`} className="bg-white">
                  {onSelectAll && (
                    <td className="px-4 py-3 text-center">
                      <SkeletonLoader variant="text" width="16px" height="16px" className="mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={`loading-${rIdx}-${cIdx}`} className="px-4 py-3">
                      <SkeletonLoader variant="text" width={cIdx === 0 ? '70%' : '50%'} height="14px" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectAll ? 1 : 0)}
                  className="px-4 py-8 text-center"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => {
                const rowKey = row[keyField] || rowIdx;
                const isSelected = selectedIds.includes(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      'transition-colors duration-100 hover:bg-forest/5',
                      isSelected ? 'bg-forest/5' : 'bg-white'
                    )}
                  >
                    {onSelectRow && (
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow(rowKey, e.target.checked)}
                          className="rounded border-border text-forest focus:ring-forest cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-charcoal',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center'
                        )}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
