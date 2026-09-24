import { formatINRCompact } from '@/lib/format';

/** Key numbers for a project in one strip (dividers via gap-px over a border-coloured background). */
export function ProjectSummary({ buildings }) {
  const totals = buildings.reduce(
    (sum, b) => ({
      total: sum.total + (b.stats?.total ?? 0),
      available: sum.available + (b.stats?.available ?? 0),
      booked: sum.booked + (b.stats?.booked ?? 0),
      blocked: sum.blocked + (b.stats?.blocked ?? 0),
    }),
    { total: 0, available: 0, booked: 0, blocked: 0 },
  );
  const prices = buildings.map((b) => b.stats?.startingPrice).filter(Boolean);
  const from = prices.length ? Math.min(...prices) : null;

  const items = [
    { label: 'Units', value: totals.total },
    { label: 'Available', value: totals.available, className: 'text-available' },
    { label: 'Booked', value: totals.booked, className: 'text-booked' },
    { label: 'Blocked', value: totals.blocked, className: 'text-blocked' },
    { label: 'Starting at', value: from ? formatINRCompact(from) : '—' },
  ];

  return (
    <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-5">
      {items.map((item, index) => (
        <div key={item.label} className={`bg-card px-4 py-3 sm:px-5 ${index === items.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className={`mt-1 font-display text-xl font-semibold tabular-nums ${item.className ?? ''}`}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
