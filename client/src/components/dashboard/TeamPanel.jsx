import Link from 'next/link';
import { EmptyState } from '@/components/common/EmptyState';
import { Panel } from '@/components/common/Panel';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatINRCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Who is carrying how much, and who is slipping on follow-ups. */
export function TeamPanel({ team }) {
  return (
    <Panel title="Team" description="Open workload and closed bookings per person" flush>
      {team.length === 0 ? (
        <EmptyState title="No sales employees yet" description="Add your team from the Team page." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4 sm:pl-5">Name</TableHead>
              <TableHead className="text-right">Open leads</TableHead>
              <TableHead className="text-right">Overdue</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="pr-4 text-right sm:pr-5">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map((person) => (
              <TableRow key={person._id}>
                <TableCell className="pl-4 sm:pl-5">
                  <Link href={`/admin/leads?assignedTo=${person._id}`} className="flex items-center gap-2 font-medium hover:underline">
                    <UserAvatar name={person.name} className="size-6 text-[10px]" />
                    {person.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">{person.openLeads}</TableCell>
                <TableCell className={cn('text-right tabular-nums', person.overdue > 0 && 'font-medium text-destructive')}>
                  {person.overdue}
                </TableCell>
                <TableCell className="text-right tabular-nums">{person.bookings}</TableCell>
                <TableCell className="pr-4 text-right tabular-nums sm:pr-5">{formatINRCompact(person.value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
