import React from 'react';

export interface TabItem<K extends string = string> {
  id: K;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * The app's one tab style (same as the Manufacturing Process tabs):
 * underline + light gold background on the active tab, scrolls sideways on phones.
 */
function TabBar<K extends string>({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: TabItem<K>[];
  active: K;
  onChange: (id: K) => void;
  className?: string;
}) {
  return (
    <div className={`no-scrollbar overflow-x-auto border-b border-[#d3c4af]/20 dark:border-slate-700 ${className}`}>
      <nav className="flex min-w-max flex-nowrap gap-1 pb-1" role="tablist" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`group relative flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'border-[#785600] bg-[#785600]/5 text-[#785600] dark:border-[#986d00] dark:bg-[#986d00]/10 dark:text-[#986d00]'
                  : 'border-transparent text-[#4f4535] hover:bg-[#785600]/5 dark:text-slate-400 dark:hover:bg-[#986d00]/10'
              }`}
            >
              {tab.icon && (
                <span className={isActive ? 'text-[#785600] dark:text-[#986d00]' : 'text-[#4f4535] dark:text-slate-400'}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default TabBar;
