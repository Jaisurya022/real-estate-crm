import { UNIT_STATUS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function UnitStatusBadge({ status, className }) {
  const meta = UNIT_STATUS[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium', meta.soft, meta.text, className)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export function StatusLegend({ className }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
      {Object.entries(UNIT_STATUS).map(([key, meta]) => (
        <li key={key} className="flex items-center gap-1.5">
          <span className={cn('size-2.5 rounded-sm', meta.dot)} />
          {meta.label}
        </li>
      ))}
    </ul>
  );
}

/** Stacked bar of available / booked / blocked units. */
export function InventoryBar({ stats, className }) {
  const total = stats?.total ?? 0;
  if (!total) return <div className={cn('h-2 rounded-full bg-muted', className)} />;
  const pct = (n) => `${((n ?? 0) / total) * 100}%`;
  return (
    <div className={cn('flex h-2 overflow-hidden rounded-full bg-muted', className)} role="img" aria-label={`${stats.available} available, ${stats.booked} booked, ${stats.blocked} blocked`}>
      <span className="bg-available" style={{ width: pct(stats.available) }} />
      <span className="bg-booked" style={{ width: pct(stats.booked) }} />
      <span className="bg-blocked" style={{ width: pct(stats.blocked) }} />
    </div>
  );
}
