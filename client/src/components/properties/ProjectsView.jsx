import { Building2, Plus } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/hooks/useFetch';
import { propertiesService } from '@/services/properties.service';
import { ProjectCard } from './ProjectCard';
import { ProjectFormDialog } from './ProjectFormDialog';

export function ProjectsView() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const { data, error, reload } = useFetch((signal) => propertiesService.listProjects(signal), []);

  let content;
  if (error && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data)
    content = (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  else if (!data.items.length)
    content = (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={Building2}
          title="No projects yet"
          description="Create a project, add its buildings, then release units for sale."
          action={<Button onClick={() => setCreateOpen(true)}><Plus />New project</Button>}
        />
      </div>
    );
  else
    content = (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((project) => (
          <ProjectCard key={project._id} project={project} href={`/admin/properties/${project._id}`} />
        ))}
      </div>
    );

  return (
    <>
      <PageHeader
        title="Properties"
        description="Projects, buildings and units. Sales sees the same inventory, read-only."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New project
          </Button>
        }
      />
      {content}
      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(project) => router.push(`/admin/properties/${project._id}`)}
      />
    </>
  );
}
