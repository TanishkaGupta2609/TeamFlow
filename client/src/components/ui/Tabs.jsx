import React, { useState } from 'react';
import { cn } from '../../utils';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pill',
  className,
}) => {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || '');
  const currentTab = activeTab !== undefined ? activeTab : internalActive;

  const handleTabClick = (tabId) => {
    if (activeTab === undefined) {
      setInternalActive(tabId);
    }
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        role="tablist"
        className={cn(
          'flex items-center overflow-x-auto no-scrollbar',
          variant === 'pill'
            ? 'p-1 bg-ivory-muted/70 rounded-lg border border-border inline-flex w-fit'
            : 'border-b border-border w-full gap-6'
        )}
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          if (variant === 'pill') {
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 whitespace-nowrap select-none',
                  isActive
                    ? 'bg-white text-forest shadow-card'
                    : 'text-charcoal-secondary hover:text-charcoal hover:bg-white/50',
                  tab.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      isActive ? 'bg-forest/10 text-forest' : 'bg-border text-charcoal-secondary'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          // Line variant
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap select-none',
                isActive
                  ? 'border-forest text-forest'
                  : 'border-transparent text-charcoal-secondary hover:text-charcoal hover:border-border',
                tab.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ivory text-charcoal-secondary font-bold border border-border">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Render active tab content if provided */}
      {tabs.find((t) => t.id === currentTab)?.content && (
        <div role="tabpanel" className="animate-in fade-in duration-150">
          {tabs.find((t) => t.id === currentTab)?.content}
        </div>
      )}
    </div>
  );
};

export default Tabs;
