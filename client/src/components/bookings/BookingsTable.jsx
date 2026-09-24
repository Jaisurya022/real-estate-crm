import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bookingRef, formatDate, formatINRCompact, formatPhone } from '@/lib/format';
import { cn } from '@/lib/utils';
import { BookingStatusBadge, unitLabel } from './BookingStatusBadge';

export function BookingsTable({ bookings, leadBasePath, canCancel, onCancel, dimmed }) {
  return (
    <Table className={cn('transition-opacity', dimmed && 'opacity-60')}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Booking</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead className="text-right">Agreed price</TableHead>
          <TableHead className="hidden text-right md:table-cell">Received</TableHead>
          <TableHead className="hidden lg:table-cell">Sales owner</TableHead>
          <TableHead>Status</TableHead>
          {canCancel && <TableHead className="w-0"><span className="sr-only">Actions</span></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking._id}>
            <TableCell>
              <p className="font-medium tabular-nums">{bookingRef(booking._id)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(booking.createdAt)}</p>
            </TableCell>
            <TableCell>
              {booking.lead ? (
                <Link href={`${leadBasePath}/${booking.lead._id}`} className="font-medium hover:underline">
                  {booking.lead.name}
                </Link>
              ) : (
                '—'
              )}
              <p className="text-xs text-muted-foreground tabular-nums">{formatPhone(booking.lead?.phone)}</p>
            </TableCell>
            <TableCell>
              <p>{unitLabel(booking)}, {booking.unit?.type}</p>
              <p className="text-xs text-muted-foreground">{booking.project?.name}</p>
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatINRCompact(booking.agreedPrice)}</TableCell>
            <TableCell className="hidden text-right tabular-nums md:table-cell">{formatINRCompact(booking.bookingAmount)}</TableCell>
            <TableCell className="hidden lg:table-cell">
              {booking.salesOwner?.name ?? '—'}
              {/* Admins sometimes book on a rep's behalf (e.g. to approve a bigger discount). */}
              {booking.bookedBy && booking.salesOwner && booking.bookedBy._id !== booking.salesOwner._id && (
                <span className="block text-xs text-muted-foreground">via {booking.bookedBy.name}</span>
              )}
            </TableCell>
            <TableCell>
              <BookingStatusBadge status={booking.status} />
              {booking.status === 'cancelled' && booking.cancelReason && (
                <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground" title={booking.cancelReason}>
                  {booking.cancelReason}
                </p>
              )}
            </TableCell>
            {canCancel && (
              <TableCell>
                {booking.status === 'confirmed' && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onCancel(booking)}>
                    Cancel
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
