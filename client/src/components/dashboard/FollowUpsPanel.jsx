import { CalendarCheck, Phone } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/common/EmptyState';
import { Panel } from '@/components/common/Panel';
import { FollowUpLabel } from '@/components/leads/FollowUpLabel';
import { StageBadge } from '@/components/leads/StageBadge';
import { Button } from '@/components/ui/button';

export function FollowUpsPanel({ followUps, overdueCount, leadsPath, showOwner, className }) {
  return (
    <Panel
      title="Follow-ups due"
      description="Overdue first, then today"
      className={className}
      flush
      actions={
        overdueCount > 0 && (
          <Button asChild variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Link href={`${leadsPath}?followUp=overdue`}>{overdueCount} overdue</Link>
          </Button>
        )
      }
    >
      {followUps.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="All caught up" description="No follow-ups are due today." />
      ) : (
        <ul className="divide-y">
          {followUps.map((lead) => (
            <li key={lead._id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`${leadsPath}/${lead._id}`} className="truncate font-medium hover:underline">
                    {lead.name}
                  </Link>
                  <StageBadge stage={lead.stage} />
                </div>
                <p className="mt-0.5 text-xs">
                  <FollowUpLabel date={lead.nextFollowUpAt} />
                  {showOwner && (
                    <span className="text-muted-foreground">, {lead.assignedTo?.name ?? 'unassigned'}</span>
                  )}
                </p>
              </div>
              <Button asChild variant="outline" size="icon-sm" aria-label={`Call ${lead.name}`}>
                <a href={`tel:${lead.phone}`}>
                  <Phone />
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
