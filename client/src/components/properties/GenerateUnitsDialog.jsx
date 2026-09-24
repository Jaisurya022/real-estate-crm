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

const initialValues = (building) => ({
  fromFloor: '1',
  toFloor: String(building?.totalFloors ?? ''),
  unitsPerFloor: '4',
  type: '2BHK',
  areaSqft: '',
  basePrice: '',
  floorRise: '',
});

/** Creates a whole block of units at once, with an optional per-floor price premium. */
export function GenerateUnitsDialog({ open, onOpenChange, building, onGenerated }) {
  const { values, errors, formError, submitting, field, reset, submit } = useForm(initialValues(building));

  useEffect(() => {
    if (open) reset(initialValues(building));
  }, [open, building, reset]);

  const from = Number(values.fromFloor);
  const to = Number(values.toFloor);
  const perFloor = Number(values.unitsPerFloor);
  const count = to >= from && perFloor > 0 ? (to - from + 1) * perFloor : 0;
  const base = Number(values.basePrice);
  const rise = Number(values.floorRise) || 0;
  const priceRange =
    base > 0 && count ? `${formatINRCompact(base + rise * from)} to ${formatINRCompact(base + rise * to)}` : null;

  const handleSubmit = submit(async (form) => {
    const { created, skipped } = await propertiesService.generateUnits(building._id, form);
    toast.success(
      skipped ? `${created} units added. ${skipped} already existed and were skipped.` : `${created} units added to ${building.name}`,
    );
    onOpenChange(false);
    onGenerated?.();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add floors of units</DialogTitle>
          <DialogDescription>
            Units are numbered by floor and position (floor 12, unit 3 is 1203). Existing numbers are skipped.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormAlert message={formError} />
          <div className="grid grid-cols-3 gap-4">
            <FormField id="gen-from" label="From floor" error={errors.fromFloor}>
              <Input {...fieldProps('gen-from', errors.fromFloor)} {...field('fromFloor')} type="number" min="0" inputMode="numeric" />
            </FormField>
            <FormField id="gen-to" label="To floor" error={errors.toFloor}>
              <Input {...fieldProps('gen-to', errors.toFloor)} {...field('toFloor')} type="number" min="0" inputMode="numeric" />
            </FormField>
            <FormField id="gen-per" label="Per floor" error={errors.unitsPerFloor}>
              <Input {...fieldProps('gen-per', errors.unitsPerFloor)} {...field('unitsPerFloor')} type="number" min="1" max="20" inputMode="numeric" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="gen-type" label="Type" error={errors.type}>
              <Select value={values.type} onValueChange={field('type').onChange}>
                <SelectTrigger id="gen-type">
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
            <FormField id="gen-area" label="Area (sq ft)" error={errors.areaSqft}>
              <Input {...fieldProps('gen-area', errors.areaSqft)} {...field('areaSqft')} type="number" min="1" inputMode="numeric" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="gen-price" label="Base price" error={errors.basePrice} hint={base > 0 ? formatINRCompact(base) : 'Price on floor 0'}>
              <Input {...fieldProps('gen-price', errors.basePrice)} {...field('basePrice')} type="number" min="0" step="10000" inputMode="numeric" />
            </FormField>
            <FormField id="gen-rise" label="Floor rise" optional error={errors.floorRise} hint="Added per floor">
              <Input {...fieldProps('gen-rise', errors.floorRise)} {...field('floorRise')} type="number" min="0" step="5000" inputMode="numeric" placeholder="50000" />
            </FormField>
          </div>

          {count > 0 && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm">
              Creates up to <strong className="tabular-nums">{count}</strong> units
              {priceRange && <>, priced {priceRange}</>}.
            </p>
          )}

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={!count}>
              Add units
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
