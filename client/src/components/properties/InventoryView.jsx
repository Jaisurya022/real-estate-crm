import { Building2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/hooks/useFetch';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { cn } from '@/lib/utils';
import { propertiesService } from '@/services/properties.service';
import { BuildingInventory } from './BuildingInventory';
import { ProjectSummary } from './ProjectSummary';
import { InventoryBar } from './UnitStatus';

/** Sales view of live availability: pick a project, browse its towers, book a unit. */
export function InventoryView() {
  const { filters, setFilters, ready } = useUrlFilters({ project: '' });
  const projects = useFetch((signal) => propertiesService.listProjects(signal), []);
  const projectId = filters.project || projects.data?.items[0]?._id;

  const detail = useFetch((signal) => propertiesService.getProject(projectId, signal), [projectId], {
    enabled: ready && Boolean(projectId),
  });

  const refreshAll = () => {
    detail.reload();
    projects.reload();
  };

  let body;
  if (projects.error && !projects.data) body = <ErrorState error={projects.error} onRetry={projects.reload} />;
  else if (!projects.data) body = <Skeleton className="h-96" />;
  else if (!projects.data.items.length)
    body = (
      <div className="rounded-xl border bg-card">
        <EmptyState icon={Building2} title="No projects on sale yet" description="Your admin will add projects and units here." />
      </div>
    );
  else
    body = (
      <>
        <div role="tablist" aria-label="Projects" className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.items.map((project) => {
            const selected = project._id === projectId;
            return (
              <button
                key={project._id}
                role="tab"
                aria-selected={selected}
                onClick={() => setFilters({ project: project._id })}
                className={cn(
                  'rounded-xl border bg-card p-4 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                  selected ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/40',
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{project.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{project.city}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  {project.stats.available} of {project.stats.total} available
                </p>
                <InventoryBar stats={project.stats} className="mt-3 h-1.5" />
              </button>
            );
          })}
        </div>

        {detail.error && !detail.data ? (
          <ErrorState error={detail.error} onRetry={detail.reload} />
        ) : !detail.data || detail.data.project._id !== projectId ? (
          <Skeleton className="h-96" />
        ) : (
          <>
            <ProjectSummary buildings={detail.data.buildings} />
            <BuildingInventory
              project={detail.data.project}
              buildings={detail.data.buildings}
              canManage={false}
              leadBasePath="/sales/leads"
              onChanged={refreshAll}
            />
          </>
        )}
      </>
    );

  return (
    <>
      <PageHeader title="Inventory" description="Live availability. Tap a unit to see details or book it for one of your leads." />
      {body}
    </>
  );
}
