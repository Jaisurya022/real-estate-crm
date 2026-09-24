import { Ban, CircleCheck, Handshake, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/hooks/useFetch';
import { bookingRef, formatDate, formatINR, formatPhone } from '@/lib/format';
import { propertiesService } from '@/services/properties.service';
import { UnitStatusBadge } from './UnitStatus';

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums">{children}</dd>
    </div>
  );
}

/** Unit card opened from the inventory chart: details, booking info and actions. */
export function UnitDetailDialog({ unitId, onOpenChange, canManage, onBook, onEdit, onChanged, leadBasePath }) {
  const [saving, setSaving] = useState(false);
  const { data, loading, error, setData } = useFetch((signal) => propertiesService.getUnit(unitId, signal), [unitId], {
    enabled: Boolean(unitId),
  });

  const unit = data?.unit;
  const booking = data?.booking;
  const ready = unit && unit._id === unitId && !loading;

  const toggleBlocked = async () => {
    const status = unit.status === 'blocked' ? 'available' : 'blocked';
    setSaving(true);
    try {
      const { unit: updated } = await propertiesService.updateUnit(unit._id, { status });
      setData((current) => ({ ...current, unit: { ...current.unit, status: updated.status } }));
      toast.success(status === 'blocked' ? `Unit ${unit.unitNumber} blocked` : `Unit ${unit.unitNumber} is available again`);
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(unitId)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {ready ? `${unit.building?.name} ${unit.unitNumber}` : 'Unit'}
            {ready && <UnitStatusBadge status={unit.status} />}
          </DialogTitle>
          <DialogDescription>{ready ? `${unit.project?.name}, ${unit.project?.city}` : 'Loading unit details'}</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {!ready && !error && <Skeleton className="h-28" />}

        {ready && (
          <>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border p-4 sm:grid-cols-3">
              <Fact label="Type">{unit.type}</Fact>
              <Fact label="Floor">{unit.floor === 0 ? 'Ground' : unit.floor}</Fact>
              <Fact label="Area">{unit.areaSqft.toLocaleString('en-IN')} sq ft</Fact>
              <Fact label="Price">{formatINR(unit.price)}</Fact>
              <Fact label="Per sq ft">{formatINR(Math.round(unit.price / unit.areaSqft))}</Fact>
            </dl>

            {booking && (
              <div className="rounded-lg bg-booked-soft px-4 py-3 text-sm">
                <p className="font-medium text-booked">
                  Booked {formatDate(booking.createdAt)}
                  {booking.salesOwner && `, sold by ${booking.salesOwner.name}`}
                </p>
                {booking.lead ? (
                  <p className="mt-1">
                    {leadBasePath ? (
                      <Link href={`${leadBasePath}/${booking.lead._id}`} className="font-medium hover:underline">
                        {booking.lead.name}
                      </Link>
                    ) : (
                      booking.lead.name
                    )}
                    <span className="text-muted-foreground">, {formatPhone(booking.lead.phone)}, {bookingRef(booking._id)}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-muted-foreground">Customer details are visible to the owner and admins.</p>
                )}
              </div>
            )}
            {unit.status === 'blocked' && (
              <p className="rounded-lg bg-blocked-soft px-4 py-3 text-sm text-muted-foreground">
                Held back by management and not open for booking.
              </p>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              {canManage && unit.status === 'booked' ? (
                // A booked unit is what the customer signed up for, so it's locked.
                <p className="self-center text-xs text-muted-foreground">Cancel the booking to edit this unit.</p>
              ) : canManage ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(unit)}>
                    <Pencil />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleBlocked} loading={saving}>
                    {unit.status === 'blocked' ? <CircleCheck /> : <Ban />}
                    {unit.status === 'blocked' ? 'Unblock' : 'Block'}
                  </Button>
                </div>
              ) : (
                <span />
              )}
              {unit.status === 'available' && (
                <Button size="sm" onClick={() => onBook(unit)}>
                  <Handshake />
                  Book this unit
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
