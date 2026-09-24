import { motion } from 'motion/react';
import { LEAD_STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/** Pipeline tabs with live counts. Counts respect every filter except the stage itself. */
export function StageTabs({ counts, active, onChange }) {
  const total = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : null;
  const tabs = [{ value: 'all', label: 'All', count: total }, ...LEAD_STAGES.map((stage) => ({ value: stage, label: stage, count: counts?.[stage] ?? 0 }))];

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label="Lead stage" className="flex min-w-max gap-1 border-b">
        {tabs.map((tab) => {
          const selected = active === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.value)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 pt-1 pb-2.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:text-foreground',
                selected ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {counts && (
                <span className={cn('rounded px-1.5 text-xs tabular-nums', selected ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {tab.count}
                </span>
              )}
              {selected && (
                <motion.span layoutId="stage-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
