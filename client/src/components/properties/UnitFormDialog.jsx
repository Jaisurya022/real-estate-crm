import { useEffect } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/common/FormAlert';
import { FormField, fieldProps } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@/hooks/useForm';
import { UNIT_TYPES } from '@/lib/constants';
import { formatINRCompact } from '@/lib/format';
import { propertiesService } from '@/services/properties.service';

const toValues = (unit) => ({
  unitNumber: unit?.unitNumber ?? '',
  floor: unit?.floor ?? '',
  type: unit?.type ?? '2BHK',
  areaSqft: unit?.areaSqft ?? '',
  price: unit?.price ?? '',
});

/** Create one unit, or edit a unit's details. Availability is changed from the unit dialog. */
export function UnitFormDialog({ open, onOpenChange, building, unit, onSaved }) {
  const isEdit = Boolean(unit);
  const { values, errors, formError, submitting, field, reset, submit } = useForm(toValues(unit));

  useEffect(() => {
    if (open) reset(toValues(unit));
  }, [open, unit, reset]);

  const handleSubmit = submit(async (form) => {
    const { unit: saved } = isEdit
      ? await propertiesService.updateUnit(unit._id, form)
      : await propertiesService.createUnit({ ...form, building: building._id });
    toast.success(isEdit ? `Unit ${saved.unitNumber} saved` : `Unit ${saved.unitNumber} added`);
    onOpenChange(false);
    onSaved?.(saved);
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit unit ${unit.unitNumber}` : `Add a unit to ${building?.name}`}</DialogTitle>
          <DialogDescription>
            {isEdit && unit.status === 'booked'
              ? 'Price changes here don\u2019t affect the existing booking, which keeps its agreed price.'
              : `${building?.name} has ${building?.totalFloors} floors. Use 0 for the ground floor.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormAlert message={formError} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <FormField id="unit-number" label="Unit number" error={errors.unitNumber}>
              <Input {...fieldProps('unit-number', errors.unitNumber)} {...field('unitNumber')} placeholder="1203" autoFocus />
            </FormField>
            <FormField id="unit-floor" label="Floor" error={errors.floor}>
              <Input {...fieldProps('unit-floor', errors.floor)} {...field('floor')} type="number" min="0" inputMode="numeric" />
            </FormField>
            <FormField id="unit-type" label="Type" error={errors.type} className="col-span-2 sm:col-span-1">
              <Select value={values.type} onValueChange={field('type').onChange}>
                <SelectTrigger id="unit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="unit-area" label="Area (sq ft)" error={errors.areaSqft}>
              <Input {...fieldProps('unit-area', errors.areaSqft)} {...field('areaSqft')} type="number" min="1" inputMode="numeric" />
            </FormField>
            <FormField id="unit-price" label="Price" error={errors.price} hint={Number(values.price) > 0 ? formatINRCompact(Number(values.price)) : 'In rupees'}>
              <Input {...fieldProps('unit-price', errors.price)} {...field('price')} type="number" min="0" step="10000" inputMode="numeric" />
            </FormField>
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save unit' : 'Add unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
