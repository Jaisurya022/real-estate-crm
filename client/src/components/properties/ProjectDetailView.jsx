import { Building2, Pencil, SearchX } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/hooks/useFetch';
import { propertiesService } from '@/services/properties.service';
import { BuildingFormDialog } from './BuildingFormDialog';
import { BuildingInventory } from './BuildingInventory';
import { ProjectFormDialog } from './ProjectFormDialog';
import { ProjectSummary } from './ProjectSummary';

export function ProjectDetailView() {
  const router = useRouter();
  const { projectId } = router.query;
  const [editOpen, setEditOpen] = useState(false);
  const [buildingOpen, setBuildingOpen] = useState(false);

  const { data, error, reload } = useFetch((signal) => propertiesService.getProject(projectId, signal), [projectId], {
    enabled: Boolean(projectId),
  });

  if (error && !data) {
    return error.status === 404 ? (
      <EmptyState icon={SearchX} title="Project not found" action={<Button variant="outline" onClick={() => router.push('/admin/properties')}>All projects</Button>} />
    ) : (
      <ErrorState error={error} onRetry={reload} />
    );
  }
  if (!data) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const { project, buildings } = data;

  return (
    <>
      <PageHeader
        backHref="/admin/properties"
        backLabel="Properties"
        title={project.name}
        description={`${[project.location, project.city].filter(Boolean).join(', ')}. ${project.status}.`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit project
            </Button>
            <Button onClick={() => setBuildingOpen(true)}>
              <Building2 />
              Add building
            </Button>
          </>
        }
      />
      <ProjectSummary buildings={buildings} />
      <BuildingInventory project={project} buildings={buildings} canManage leadBasePath="/admin/leads" onChanged={reload} />

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} onSaved={reload} />
      <BuildingFormDialog open={buildingOpen} onOpenChange={setBuildingOpen} projectId={project._id} onSaved={reload} />
    </>
  );
}
