import { cn } from '@/lib/utils';

export function BookingStatusBadge({ status }) {
  const confirmed = status === 'confirmed';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
        confirmed ? 'bg-available-soft text-available' : 'bg-muted text-muted-foreground line-through decoration-1',
      )}
    >
      {confirmed ? 'Confirmed' : 'Cancelled'}
    </span>
  );
}

/** "Palm Grove Residences, Tower A 702" */
export const unitLabel = (booking) =>
  `${booking.unit?.building?.name ?? ''} ${booking.unit?.unitNumber ?? ''}`.trim();
