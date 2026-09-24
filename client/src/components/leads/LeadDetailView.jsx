import { Ban, Handshake, Pencil, SearchX } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';
import { BookingDialog } from '@/components/bookings/BookingDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetch } from '@/hooks/useFetch';
import { formatPhone } from '@/lib/format';
import { leadsService } from '@/services/leads.service';
import { ActivityTimeline } from './ActivityTimeline';
import { LeadBookings } from './LeadBookings';
import { LeadFormDialog } from './LeadFormDialog';
import { LeadInfoPanel } from './LeadInfoPanel';
import { LostLeadDialog } from './LostLeadDialog';
import { NoteComposer } from './NoteComposer';
import { StageBadge } from './StageBadge';
import { StageStepper } from './StageStepper';

function DetailSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export function LeadDetailView({ portal }) {
  const router = useRouter();
  const { id } = router.query;
  const isAdmin = portal === 'admin';
  const listPath = `/${portal}/leads`;

  const { data, error, reload, setData } = useFetch((signal) => leadsService.get(id, signal), [id], {
    enabled: Boolean(id),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [lostError, setLostError] = useState('');
  const [pendingStage, setPendingStage] = useState(null);

  if (error && !data) {
    return error.status === 404 ? (
      <EmptyState
        icon={SearchX}
        title="Lead not found"
        description="It may have been reassigned to someone else."
        action={<Button variant="outline" onClick={() => router.push(listPath)}>Back to leads</Button>}
      />
    ) : (
      <ErrorState error={error} onRetry={reload} />
    );
  }
  if (!data) return <DetailSkeleton />;

  const { lead, activities, bookings } = data;
  const isBooked = lead.stage === 'Booked';
  const isLost = lead.stage === 'Lost';
  // Every sale needs an owner, so unassigned leads are assigned before booking.
  const isUnassigned = !lead.assignedTo;

  /** Show the updated lead immediately, then refresh the timeline in the background. */
  const applyLead = (updated) => {
    setData((current) => ({ ...current, lead: updated }));
    reload();
  };

  const changeStage = async (stage, lostReason) => {
    setPendingStage(stage);
    try {
      const { lead: updated } = await leadsService.changeStage(lead._id, { stage, lostReason });
      toast.success(stage === 'Lost' ? 'Marked as lost' : `Moved to ${stage}`);
      applyLead(updated);
      return true;
    } catch (err) {
      if (stage === 'Lost') setLostError(err.fieldErrors.lostReason ?? err.message);
      else toast.error(err.message);
      return false;
    } finally {
      setPendingStage(null);
    }
  };

  const confirmLost = async (reason) => {
    setLostError('');
    if (await changeStage('Lost', reason)) setLostOpen(false);
  };

  return (
    <>
      <PageHeader
        backHref={listPath}
        backLabel={isAdmin ? 'Leads' : 'My leads'}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {lead.name}
            <StageBadge stage={lead.stage} className="text-sm" />
          </span>
        }
        description={`${formatPhone(lead.phone)}${lead.assignedTo ? `, handled by ${lead.assignedTo.name}` : ', not assigned yet'}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit details
            </Button>
            {!isLost && (
              <Button
                onClick={() => setBookOpen(true)}
                disabled={isUnassigned}
                title={isUnassigned ? 'Assign this lead to a sales employee first' : undefined}
              >
                <Handshake />
                Book a unit
              </Button>
            )}
          </>
        }
      />

      <Panel className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <StageStepper
              stage={lead.stage}
              onSelect={(stage) => changeStage(stage)}
              disabled={isBooked || Boolean(pendingStage)}
              pendingStage={pendingStage}
            />
          </div>
          {!isLost && !isBooked && (
            <Button variant="ghost" size="sm" className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive lg:self-center" onClick={() => { setLostError(''); setLostOpen(true); }}>
              <Ban />
              Mark as lost
            </Button>
          )}
        </div>
        {isBooked && (
          <p className="mt-3 text-sm text-muted-foreground">
            Booked. To change the stage, an admin has to cancel the booking first.
          </p>
        )}
        {isLost && (
          <p className="mt-3 text-sm">
            <span className="font-medium text-destructive">Lost:</span> {lead.lostReason}.{' '}
            <span className="text-muted-foreground">Pick a stage above to reopen this lead.</span>
          </p>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          <Panel title="Log an interaction">
            <NoteComposer
              lead={lead}
              onAdded={({ activity, lead: updated }) => {
                setData((current) => ({ ...current, lead: updated, activities: [activity, ...current.activities] }));
                // The first note on a New lead moves it to Contacted; fetch that timeline entry too.
                if (updated.stage !== lead.stage) {
                  toast.success(`Moved to ${updated.stage}`);
                  reload();
                }
              }}
            />
          </Panel>
          <Panel title="Activity">
            <ActivityTimeline activities={activities} />
          </Panel>
        </div>

        <div className="grid content-start gap-4">
          <LeadInfoPanel lead={lead} canAssign={isAdmin} onChanged={applyLead} />
          <LeadBookings
            bookings={bookings}
            canBook={!isLost && !isUnassigned}
            emptyHint={!isLost && isUnassigned ? 'Assign this lead to a sales employee to book a unit.' : undefined}
          />
        </div>
      </div>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} leadBasePath={listPath} onSaved={applyLead} />
      <BookingDialog open={bookOpen} onOpenChange={setBookOpen} lead={lead} onBooked={reload} />
      <LostLeadDialog open={lostOpen} onOpenChange={setLostOpen} onConfirm={confirmLost} loading={pendingStage === 'Lost'} error={lostError} />
    </>
  );
}
