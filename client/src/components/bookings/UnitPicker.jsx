import { FormField } from '@/components/common/FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFetch } from '@/hooks/useFetch';
import { UNIT_TYPES } from '@/lib/constants';
import { formatINRCompact } from '@/lib/format';
import { propertiesService } from '@/services/properties.service';

/**
 * Project -> type -> available unit. Only available units are listed, and the
 * list is re-fetched after a booking conflict via `refreshKey`.
 */
export function UnitPicker({ projectId, onProjectChange, type, onTypeChange, unitId, onUnitChange, refreshKey, error }) {
  const { data: projects } = useFetch((signal) => propertiesService.listProjects(signal), []);
  const { data: units, loading } = useFetch(
    (signal) => propertiesService.listUnits({ project: projectId, type, status: 'available', limit: 500 }, signal),
    [projectId, type, refreshKey],
    { enabled: Boolean(projectId) },
  );

  const items = units?.items ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
      <FormField id="booking-project" label="Project">
        <Select value={projectId} onValueChange={onProjectChange}>
          <SelectTrigger id="booking-project">
            <SelectValue placeholder="Pick a project" />
          </SelectTrigger>
          <SelectContent>
            {(projects?.items ?? []).map((project) => (
              <SelectItem key={project._id} value={project._id}>
                {project.name}, {project.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField id="booking-type" label="Type">
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger id="booking-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {UNIT_TYPES.map((unitType) => (
              <SelectItem key={unitType} value={unitType}>
                {unitType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        id="booking-unit"
        label="Unit"
        error={error}
        className="sm:col-span-2"
        hint={projectId && !loading ? `${items.length} available` : undefined}
      >
        <Select value={unitId} onValueChange={(id) => onUnitChange(items.find((unit) => unit._id === id))} disabled={!projectId || loading}>
          <SelectTrigger id="booking-unit" aria-invalid={error ? true : undefined}>
            <SelectValue placeholder={!projectId ? 'Pick a project first' : loading ? 'Loading units' : items.length ? 'Pick a unit' : 'No available units'} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {items.map((unit) => (
              <SelectItem key={unit._id} value={unit._id}>
                {unit.building?.name} {unit.unitNumber}, {unit.type}, {unit.areaSqft} sq ft, {formatINRCompact(unit.price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
}
