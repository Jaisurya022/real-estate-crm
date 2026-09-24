import { BookingStatusBadge, unitLabel } from '@/components/bookings/BookingStatusBadge';
import { Panel } from '@/components/common/Panel';
import { bookingRef, formatDate, formatINRCompact } from '@/lib/format';

export function LeadBookings({ bookings, canBook, emptyHint }) {
  return (
    <Panel title="Bookings" flush={bookings.length > 0}>
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {emptyHint ?? (canBook ? 'No units booked yet.' : 'Reopen this lead to book a unit.')}
        </p>
      ) : (
        <ul className="divide-y">
          {bookings.map((booking) => (
            <li key={booking._id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  {booking.project?.name}, {unitLabel(booking)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bookingRef(booking._id)}, {formatDate(booking.createdAt)}, {formatINRCompact(booking.agreedPrice)}
                </p>
                {booking.status === 'cancelled' && booking.cancelReason && (
                  <p className="mt-1 text-xs text-muted-foreground">Cancelled: {booking.cancelReason}</p>
                )}
              </div>
              <BookingStatusBadge status={booking.status} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
