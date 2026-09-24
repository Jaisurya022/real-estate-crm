import { Plus, SearchX, UsersRound } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Button } from '@/components/ui/button';
import { useFetch } from '@/hooks/useFetch';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { leadsService } from '@/services/leads.service';
import { LeadFilters } from './LeadFilters';
import { LeadFormDialog } from './LeadFormDialog';
import { LeadsTable } from './LeadsTable';
import { StageTabs } from './StageTabs';

const PAGE_SIZE = 20;
const DEFAULT_FILTERS = { q: '', stage: 'all', followUp: 'all', source: 'all', assignedTo: 'all', page: '1' };
// Filters in the toolbar (the stage has its own tabs).
const TOOLBAR_FILTERS = ['q', 'followUp', 'source', 'assignedTo'];

/** Leads list shared by both portals. Admins see everyone's leads and can filter by owner. */
export function LeadsListView({ portal }) {
  const router = useRouter();
  const isAdmin = portal === 'admin';
  const basePath = `/${portal}/leads`;
  const [createOpen, setCreateOpen] = useState(false);

  const { filters, setFilters, ready, hasActiveFilters } = useUrlFilters(DEFAULT_FILTERS);
  const { members } = useTeamMembers({ enabled: isAdmin });

  const { data, loading, error, reload } = useFetch(
    (signal) => leadsService.list({ ...filters, limit: PAGE_SIZE }, signal),
    [JSON.stringify(filters)],
    { enabled: ready },
  );

  const hasToolbarFilters = TOOLBAR_FILTERS.some((key) => filters[key] !== DEFAULT_FILTERS[key]);
  const clearToolbarFilters = () => setFilters({ q: '', followUp: 'all', source: 'all', assignedTo: 'all' });
  const clearFilters = () => setFilters({ q: '', stage: 'all', followUp: 'all', source: 'all', assignedTo: 'all' });

  let content;
  if (error && !data) {
    content = <ErrorState error={error} onRetry={reload} />;
  } else if (!data) {
    content = <TableSkeleton />;
  } else if (data.items.length === 0) {
    content = hasActiveFilters ? (
      <EmptyState
        icon={SearchX}
        title="No leads match these filters"
        description="Try a different search or clear the filters."
        action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
      />
    ) : (
      <EmptyState
        icon={UsersRound}
        title={isAdmin ? 'No leads yet' : 'No leads assigned to you yet'}
        description="Add walk-ins and enquiries here so follow-ups never slip."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Add lead
          </Button>
        }
      />
    );
  } else {
    content = (
      <>
        <LeadsTable leads={data.items} basePath={basePath} showAssignee={isAdmin} dimmed={loading} />
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          pageSize={PAGE_SIZE}
          label="leads"
          onPageChange={(page) => setFilters({ page: String(page) })}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Leads' : 'My leads'}
        description={isAdmin ? 'Every enquiry across the team.' : 'Leads assigned to you.'}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Add lead
          </Button>
        }
      />

      <StageTabs counts={data?.stageCounts} active={filters.stage} onChange={(stage) => setFilters({ stage })} />

      <div className="overflow-hidden rounded-xl border bg-card">
        <LeadFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearToolbarFilters}
          hasActiveFilters={hasToolbarFilters}
          isAdmin={isAdmin}
          members={members}
        />
        {content}
      </div>

      <LeadFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        canAssign={isAdmin}
        members={members}
        leadBasePath={basePath}
        onSaved={(lead) => router.push(`${basePath}/${lead._id}`)}
      />
    </>
  );
}
