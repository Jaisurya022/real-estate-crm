import { Handshake } from 'lucide-react';
import Link from 'next/link';
import { unitLabel } from '@/components/bookings/BookingStatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Panel } from '@/components/common/Panel';
import { formatINRCompact, timeAgo } from '@/lib/format';

export function RecentBookings({ bookings, bookingsPath, leadsPath }) {
  return (
    <Panel
      title="Recent bookings"
      flush
      actions={
        <Link href={bookingsPath} className="text-sm text-primary hover:underline">
          View all
        </Link>
      }
    >
      {bookings.length === 0 ? (
        <EmptyState icon={Handshake} title="No bookings yet" description="Confirmed bookings will appear here." />
      ) : (
        <ul className="divide-y">
          {bookings.map((booking) => (
            <li key={booking._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
              <div className="min-w-0">
                <Link href={`${leadsPath}/${booking.lead?._id}`} className="font-medium hover:underline">
                  {booking.lead?.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {booking.project?.name}, {unitLabel(booking)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-medium tabular-nums">{formatINRCompact(booking.agreedPrice)}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(booking.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
