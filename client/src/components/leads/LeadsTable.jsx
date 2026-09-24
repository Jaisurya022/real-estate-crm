import Link from 'next/link';
import { useRouter } from 'next/router';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatINRCompact, formatPhone } from '@/lib/format';
import { cn } from '@/lib/utils';
import { FollowUpLabel } from './FollowUpLabel';
import { StageBadge } from './StageBadge';

export function LeadsTable({ leads, basePath, showAssignee, dimmed }) {
  const router = useRouter();

  return (
    <Table className={cn('transition-opacity', dimmed && 'opacity-60')}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Lead</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Next follow-up</TableHead>
          <TableHead className="hidden md:table-cell">Looking for</TableHead>
          {showAssignee && <TableHead className="hidden lg:table-cell">Assigned to</TableHead>}
          <TableHead className="hidden xl:table-cell">Source</TableHead>
          <TableHead className="hidden sm:table-cell">Added</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => {
          const href = `${basePath}/${lead._id}`;
          const closed = lead.stage === 'Booked' || lead.stage === 'Lost';
          return (
            <TableRow key={lead._id} className="cursor-pointer" onClick={() => router.push(href)}>
              <TableCell>
                <Link href={href} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                  {lead.name}
                </Link>
                <p className="text-xs text-muted-foreground tabular-nums">{formatPhone(lead.phone)}</p>
              </TableCell>
              <TableCell>
                <StageBadge stage={lead.stage} />
              </TableCell>
              <TableCell>
                {closed ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <FollowUpLabel date={lead.nextFollowUpAt} />
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="tabular-nums">{formatINRCompact(lead.budget)}</span>
                {lead.preferredUnitType && <span className="text-muted-foreground">, {lead.preferredUnitType}</span>}
              </TableCell>
              {showAssignee && (
                <TableCell className="hidden lg:table-cell">
                  {lead.assignedTo ? (
                    <span className="flex items-center gap-2">
                      <UserAvatar name={lead.assignedTo.name} className="size-6 text-[10px]" />
                      {lead.assignedTo.name}
                    </span>
                  ) : (
                    <span className="text-warning">Unassigned</span>
                  )}
                </TableCell>
              )}
              <TableCell className="hidden text-muted-foreground xl:table-cell">{lead.source}</TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(lead.createdAt)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
