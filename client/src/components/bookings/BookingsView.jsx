import { Handshake, Plus, SearchX } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/common/SearchInput';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFetch } from '@/hooks/useFetch';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { bookingsService } from '@/services/bookings.service';
import { BookingDialog } from './BookingDialog';
import { BookingsTable } from './BookingsTable';
import { CancelBookingDialog } from './CancelBookingDialog';

const PAGE_SIZE = 20;
const DEFAULT_FILTERS = { q: '', status: 'confirmed', page: '1' };

export function BookingsView({ portal }) {
  const isAdmin = portal === 'admin';
  const [newOpen, setNewOpen] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const { filters, setFilters, ready, hasActiveFilters } = useUrlFilters(DEFAULT_FILTERS);
  const { data, loading, error, reload } = useFetch(
    (signal) => bookingsService.list({ ...filters, limit: PAGE_SIZE }, signal),
    [JSON.stringify(filters)],
    { enabled: ready },
  );

  let content;
  if (error && !data) {
    content = <ErrorState error={error} onRetry={reload} />;
  } else if (!data) {
    content = <TableSkeleton columns={6} />;
  } else if (data.items.length === 0) {
    content =
      filters.q || filters.status !== 'all' ? (
        <EmptyState
          icon={SearchX}
          title="No bookings match"
          description={filters.status === 'confirmed' ? 'Try "All bookings" to include cancelled ones.' : 'Try a different search.'}
        />
      ) : (
        <EmptyState
          icon={Handshake}
          title="No bookings yet"
          description="When a customer confirms a unit, book it here so nobody else can sell it."
          action={<Button onClick={() => setNewOpen(true)}><Plus />New booking</Button>}
        />
      );
  } else {
    content = (
      <>
        <BookingsTable
          bookings={data.items}
          leadBasePath={`/${portal}/leads`}
          canCancel={isAdmin}
          onCancel={setCancelling}
          dimmed={loading}
        />
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          pageSize={PAGE_SIZE}
          label="bookings"
          onPageChange={(page) => setFilters({ page: String(page) })}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Bookings"
        description={isAdmin ? 'All confirmed and cancelled bookings. Only admins can cancel.' : 'Bookings for your leads.'}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus />
            New booking
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row">
          <SearchInput value={filters.q} onChange={(q) => setFilters({ q })} placeholder="Search customer or phone" className="sm:w-72" />
          <Select value={filters.status} onValueChange={(status) => setFilters({ status })}>
            <SelectTrigger className="sm:w-44" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="all">All bookings</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="self-start sm:ml-auto sm:self-center" onClick={() => setFilters({ q: '', status: 'confirmed' })}>
              Reset
            </Button>
          )}
        </div>
        {content}
      </div>

      <BookingDialog open={newOpen} onOpenChange={setNewOpen} onBooked={reload} />
      <CancelBookingDialog booking={cancelling} onOpenChange={(open) => !open && setCancelling(null)} onCancelled={reload} />
    </>
  );
}
