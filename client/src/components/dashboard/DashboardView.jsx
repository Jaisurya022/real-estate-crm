import Link from 'next/link';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { formatINRCompact } from '@/lib/format';
import { dashboardService } from '@/services/dashboard.service';
import { FollowUpsPanel } from './FollowUpsPanel';
import { InventorySnapshot } from './InventorySnapshot';
import { PipelineChart } from './PipelineChart';
import { RecentBookings } from './RecentBookings';
import { SummaryStrip } from './SummaryStrip';
import { TeamPanel } from './TeamPanel';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const today = () => new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

function DashboardSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Admin "Overview" and sales "My day" share one data endpoint (scoped by role
 * on the server) but lead with different things: admins see the business,
 * sales employees see who to call today.
 */
export function DashboardView({ portal }) {
  const { user } = useAuth();
  const isAdmin = portal === 'admin';
  const leadsPath = `/${portal}/leads`;
  const { data, error, reload } = useFetch((signal) => dashboardService.get(signal), []);

  const firstName = user?.name?.split(' ')[0];
  const header = (
    <PageHeader
      title={`${greeting()}, ${firstName}`}
      description={
        data && !isAdmin
          ? `${today()}. You have ${data.summary.followUpsToday} follow-up${data.summary.followUpsToday === 1 ? '' : 's'} today${data.summary.overdueFollowUps ? ` and ${data.summary.overdueFollowUps} overdue` : ''}.`
          : today()
      }
    />
  );

  if (error && !data) {
    return (
      <>
        {header}
        <ErrorState error={error} onRetry={reload} />
      </>
    );
  }
  if (!data) {
    return (
      <>
        {header}
        <DashboardSkeleton />
      </>
    );
  }

  const { summary, pipeline, followUps, recentBookings, inventory, team } = data;

  // Leads that need someone's attention link straight to the filtered list.
  const attentionLink = (count, label, query) =>
    count > 0 && (
      <>
        {' · '}
        <Link href={`${leadsPath}?${query}`} className="font-medium text-warning underline-offset-2 hover:underline">
          {count} {label}
        </Link>
      </>
    );

  const summaryItems = [
    {
      label: isAdmin ? 'Open leads' : 'My open leads',
      value: summary.openLeads,
      detail: (
        <>
          {summary.newThisWeek} new this week
          {isAdmin && attentionLink(summary.unassignedLeads, 'unassigned', 'assignedTo=unassigned')}
        </>
      ),
    },
    {
      label: 'Follow-ups today',
      value: summary.followUpsToday,
      detail: (
        <>
          {summary.overdueFollowUps ? `${summary.overdueFollowUps} overdue` : 'Nothing overdue'}
          {attentionLink(summary.noFollowUp, 'with no follow-up', 'followUp=none')}
        </>
      ),
      tone: summary.followUpsToday ? 'text-warning' : undefined,
    },
    {
      label: 'Bookings this month',
      value: summary.bookingsThisMonth.count,
      detail: `${formatINRCompact(summary.bookingsThisMonth.value)} in sales`,
    },
    {
      label: 'Win rate',
      value: summary.winRate,
      format: (n) => `${Math.round(n)}%`,
      detail: 'Booked out of booked + lost',
    },
  ];

  const projectHref = (project) => (isAdmin ? `/admin/properties/${project._id}` : `/sales/inventory?project=${project._id}`);

  return (
    <>
      {header}
      <div className="grid gap-6">
        <SummaryStrip items={summaryItems} />

        {isAdmin ? (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <PipelineChart pipeline={pipeline} leadsPath={leadsPath} />
              <FollowUpsPanel followUps={followUps} overdueCount={summary.overdueFollowUps} leadsPath={leadsPath} showOwner />
            </div>
            <TeamPanel team={team ?? []} />
            <div className="grid gap-6 lg:grid-cols-2">
              <RecentBookings bookings={recentBookings} bookingsPath="/admin/bookings" leadsPath={leadsPath} />
              <InventorySnapshot inventory={inventory} projectHref={projectHref} />
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <FollowUpsPanel followUps={followUps} overdueCount={summary.overdueFollowUps} leadsPath={leadsPath} />
              <PipelineChart pipeline={pipeline} leadsPath={leadsPath} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <RecentBookings bookings={recentBookings} bookingsPath="/sales/bookings" leadsPath={leadsPath} />
              <InventorySnapshot inventory={inventory} projectHref={projectHref} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
