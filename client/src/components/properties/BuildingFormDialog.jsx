import { useEffect } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/common/FormAlert';
import { FormField, fieldProps } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from '@/hooks/useForm';
import { propertiesService } from '@/services/properties.service';

const toValues = (building) => ({ name: building?.name ?? '', totalFloors: building?.totalFloors ?? '' });

export function BuildingFormDialog({ open, onOpenChange, projectId, building, onSaved }) {
  const isEdit = Boolean(building);
  const { errors, formError, submitting, field, reset, submit } = useForm(toValues(building));

  useEffect(() => {
    if (open) reset(toValues(building));
  }, [open, building, reset]);

  const handleSubmit = submit(async (form) => {
    const { building: saved } = isEdit
      ? await propertiesService.updateBuilding(building._id, form)
      : await propertiesService.createBuilding(projectId, form);
    toast.success(isEdit ? 'Building saved' : `${saved.name} added`);
    onOpenChange(false);
    onSaved?.(saved);
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit building' : 'Add a building'}</DialogTitle>
          <DialogDescription>A tower, block or villa phase inside this project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormAlert message={formError} />
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <FormField id="building-name" label="Name" error={errors.name}>
              <Input {...fieldProps('building-name', errors.name)} {...field('name')} placeholder="Tower C" autoFocus />
            </FormField>
            <FormField id="building-floors" label="Floors" error={errors.totalFloors}>
              <Input {...fieldProps('building-floors', errors.totalFloors)} {...field('totalFloors')} type="number" min="1" max="100" inputMode="numeric" />
            </FormField>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save building' : 'Add building'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
