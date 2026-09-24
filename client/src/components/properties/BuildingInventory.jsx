import { Building2, Layers, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BookingDialog } from '@/components/bookings/BookingDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/hooks/useFetch';
import { UNIT_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { propertiesService } from '@/services/properties.service';
import { GenerateUnitsDialog } from './GenerateUnitsDialog';
import { InventoryChart } from './InventoryChart';
import { UnitDetailDialog } from './UnitDetailDialog';
import { UnitFormDialog } from './UnitFormDialog';
import { StatusLegend } from './UnitStatus';

/**
 * Building tabs + inventory chart + every unit action (view, book, and for
 * admins: add, generate, edit, block). `onChanged` lets the parent refresh stats.
 */
export function BuildingInventory({ project, buildings, canManage, leadBasePath, onChanged }) {
  const [buildingId, setBuildingId] = useState(buildings[0]?._id ?? null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [openUnitId, setOpenUnitId] = useState(null);
  const [bookingUnit, setBookingUnit] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  // Keep a valid selection when buildings are added or the project changes.
  useEffect(() => {
    if (!buildings.some((b) => b._id === buildingId)) setBuildingId(buildings[0]?._id ?? null);
  }, [buildings, buildingId]);

  const building = buildings.find((b) => b._id === buildingId);

  const { data, error, loading, reload } = useFetch(
    (signal) => propertiesService.listUnits({ building: buildingId, limit: 500 }, signal),
    [buildingId],
    { enabled: Boolean(buildingId) },
  );
  const units = data?.items ?? [];

  const refresh = () => {
    reload();
    onChanged?.();
  };

  if (!buildings.length) {
    return (
      <EmptyState
        icon={Building2}
        title="No buildings yet"
        description={canManage ? 'Add a tower or villa phase, then add its units.' : 'Units will appear here once buildings are added.'}
      />
    );
  }

  let chart;
  if (error && !data) chart = <ErrorState error={error} onRetry={reload} />;
  else if (!data || (loading && data.items[0]?.building?._id !== buildingId)) chart = <Skeleton className="mx-auto h-80 w-full max-w-md" />;
  else if (!units.length)
    chart = (
      <EmptyState
        icon={Layers}
        title={`${building.name} has no units yet`}
        description={canManage ? 'Add floors of units in one go, or add a single unit.' : 'Check back once inventory is released.'}
        action={
          canManage && (
            <Button onClick={() => setGenerateOpen(true)}>
              <Layers />
              Add floors of units
            </Button>
          )
        }
      />
    );
  else
    chart = (
      <InventoryChart
        building={building}
        units={units}
        highlight={typeFilter === 'all' ? null : (unit) => unit.type === typeFilter}
        onSelectUnit={(unit) => setOpenUnitId(unit._id)}
      />
    );

  const typesInBuilding = UNIT_TYPES.filter((type) => units.some((unit) => unit.type === type));

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Buildings" className="flex gap-1 overflow-x-auto">
          {buildings.map((b) => {
            const selected = b._id === buildingId;
            return (
              <button
                key={b._id}
                role="tab"
                aria-selected={selected}
                onClick={() => setBuildingId(b._id)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                  selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                )}
              >
                <span className="block font-medium">{b.name}</span>
                <span className="block text-xs text-muted-foreground tabular-nums">
                  {b.stats?.available ?? 0} of {b.stats?.total ?? 0} available
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger size="sm" className="w-36" aria-label="Highlight unit type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {typesInBuilding.map((type) => (
                <SelectItem key={type} value={type}>
                  Highlight {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && building && (
            <>
              <Button size="sm" variant="outline" onClick={() => setAddUnitOpen(true)}>
                <Plus />
                Unit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGenerateOpen(true)}>
                <Layers />
                Floors
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="px-3 py-6 sm:px-6">{chart}</div>
      <div className="border-t px-4 py-3">
        <StatusLegend />
      </div>

      <UnitDetailDialog
        unitId={openUnitId}
        onOpenChange={(open) => !open && setOpenUnitId(null)}
        canManage={canManage}
        leadBasePath={leadBasePath}
        onBook={(unit) => {
          setOpenUnitId(null);
          setBookingUnit(unit);
        }}
        onEdit={(unit) => {
          setOpenUnitId(null);
          setEditingUnit(unit);
        }}
        onChanged={refresh}
      />
      <BookingDialog
        open={Boolean(bookingUnit)}
        onOpenChange={(open) => !open && setBookingUnit(null)}
        unit={bookingUnit ? { ...bookingUnit, project } : null}
        onBooked={refresh}
      />
      {canManage && building && (
        <>
          <UnitFormDialog
            open={addUnitOpen || Boolean(editingUnit)}
            onOpenChange={(open) => {
              if (!open) {
                setAddUnitOpen(false);
                setEditingUnit(null);
              }
            }}
            building={building}
            unit={editingUnit}
            onSaved={refresh}
          />
          <GenerateUnitsDialog open={generateOpen} onOpenChange={setGenerateOpen} building={building} onGenerated={refresh} />
        </>
      )}
    </div>
  );
}
