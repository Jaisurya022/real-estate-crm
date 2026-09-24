import Link from 'next/link';
import { Panel } from '@/components/common/Panel';
import { InventoryBar, StatusLegend } from '@/components/properties/UnitStatus';

export function InventorySnapshot({ inventory, projectHref }) {
  return (
    <Panel title="Inventory" description={`${inventory.totals.available} units open for booking`}>
      <ul className="grid gap-4">
        {inventory.projects.map((project) => {
          const stats = { ...project, total: project.available + project.booked + project.blocked };
          return (
            <li key={project._id}>
              <Link href={projectHref(project)} className="group block text-sm outline-none">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium group-hover:underline">{project.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {project.available} of {stats.total} open
                  </span>
                </div>
                <InventoryBar stats={stats} />
              </Link>
            </li>
          );
        })}
      </ul>
      <StatusLegend className="mt-5" />
    </Panel>
  );
}
