import { useEffect } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/common/FormAlert';
import { FormField, fieldProps } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@/hooks/useForm';
import { PROJECT_STATUS } from '@/lib/constants';
import { propertiesService } from '@/services/properties.service';

const toValues = (project) => ({
  name: project?.name ?? '',
  city: project?.city ?? '',
  location: project?.location ?? '',
  status: project?.status ?? 'Under construction',
  description: project?.description ?? '',
});

export function ProjectFormDialog({ open, onOpenChange, project, onSaved }) {
  const isEdit = Boolean(project);
  const { values, errors, formError, submitting, field, reset, submit } = useForm(toValues(project));

  useEffect(() => {
    if (open) reset(toValues(project));
  }, [open, project, reset]);

  const handleSubmit = submit(async (form) => {
    const { project: saved } = isEdit
      ? await propertiesService.updateProject(project._id, form)
      : await propertiesService.createProject(form);
    toast.success(isEdit ? 'Project saved' : `${saved.name} created`);
    onOpenChange(false);
    onSaved?.(saved);
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>Add buildings and units after the project is created.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormAlert message={formError} />
          <FormField id="project-name" label="Project name" error={errors.name}>
            <Input {...fieldProps('project-name', errors.name)} {...field('name')} autoFocus />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="project-city" label="City" error={errors.city}>
              <Input {...fieldProps('project-city', errors.city)} {...field('city')} />
            </FormField>
            <FormField id="project-location" label="Locality" optional error={errors.location}>
              <Input {...fieldProps('project-location', errors.location)} {...field('location')} />
            </FormField>
          </div>
          <FormField id="project-status" label="Status" error={errors.status}>
            <Select value={values.status} onValueChange={field('status').onChange}>
              <SelectTrigger id="project-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="project-description" label="Description" optional error={errors.description}>
            <Textarea {...fieldProps('project-description', errors.description)} {...field('description')} rows={3} />
          </FormField>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save project' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
