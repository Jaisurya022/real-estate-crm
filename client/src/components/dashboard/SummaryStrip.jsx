import { AnimatedNumber } from '@/components/common/AnimatedNumber';
import { cn } from '@/lib/utils';

/**
 * Key numbers in a single bordered strip with dividers.
 * item: { label, value, format?, detail?, tone? }
 */
export function SummaryStrip({ items }) {
  return (
    // gap-px over a border-coloured background draws the dividers at every breakpoint.
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card px-4 py-4 sm:px-5">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className={cn('mt-1.5 font-display text-[1.75rem] leading-none font-semibold tabular-nums', item.tone)}>
            {item.value === null ? '—' : <AnimatedNumber value={item.value} format={item.format} />}
          </dd>
          {item.detail && <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>}
        </div>
      ))}
    </dl>
  );
}
