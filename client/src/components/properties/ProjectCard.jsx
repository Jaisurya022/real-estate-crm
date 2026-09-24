import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatINRCompact } from '@/lib/format';
import { InventoryBar } from './UnitStatus';

export function ProjectCard({ project, href }) {
  const { stats } = project;
  const soldPct = stats.total ? Math.round((stats.booked / stats.total) * 100) : 0;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border bg-card p-5 transition-colors outline-none hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg leading-snug font-semibold group-hover:text-primary">{project.name}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{[project.location, project.city].filter(Boolean).join(', ')}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{project.status}</span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-3xl leading-none font-semibold tabular-nums">{stats.available}</p>
          <p className="mt-1 text-xs text-muted-foreground">of {stats.total} units available</p>
        </div>
        <div className="text-right text-sm">
          <p className="tabular-nums">
            {stats.available === 0 ? 'Sold out' : stats.startingPrice ? `From ${formatINRCompact(stats.startingPrice)}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            {project.buildingCount} building{project.buildingCount === 1 ? '' : 's'}, {soldPct}% booked
          </p>
        </div>
      </div>

      <InventoryBar stats={stats} className="mt-4" />
    </Link>
  );
}
