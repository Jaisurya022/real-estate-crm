import { MoreHorizontal, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { usersService } from '@/services/users.service';
import { MemberFormDialog } from './MemberFormDialog';

export function TeamView() {
  const { user: me } = useAuth();
  const { data, error, reload } = useFetch((signal) => usersService.list({}, signal), []);
  const [formMember, setFormMember] = useState(undefined); // undefined = closed, null = new, object = edit
  const [toggling, setToggling] = useState(null);
  const [saving, setSaving] = useState(false);

  const confirmToggle = async () => {
    const activate = !toggling.isActive;
    setSaving(true);
    try {
      const { unassignedLeads } = await usersService.update(toggling._id, { isActive: activate });
      toast.success(
        activate
          ? `${toggling.name} can sign in again`
          : unassignedLeads
            ? `${toggling.name} deactivated. ${unassignedLeads} open lead${unassignedLeads === 1 ? '' : 's'} moved to Unassigned.`
            : `${toggling.name} deactivated`,
      );
      setToggling(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  let content;
  if (error && !data) content = <ErrorState error={error} onRetry={reload} />;
  else if (!data) content = <TableSkeleton columns={4} rows={4} />;
  else if (!data.items.length) content = <EmptyState icon={Users} title="No team members" />;
  else
    content = (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Open leads</TableHead>
            <TableHead className="hidden md:table-cell">Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-0"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((member) => {
            const isSelf = member._id === me?._id;
            return (
              <TableRow key={member._id} className={cn(!member.isActive && 'text-muted-foreground')}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={member.name} className={cn(!member.isActive && 'opacity-50')} />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {member.name}
                        {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{member.role === 'admin' ? 'Admin' : 'Sales employee'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {member.openLeads ? (
                    <Link href={`/admin/leads?assignedTo=${member._id}`} className="hover:underline">
                      {member.openLeads}
                    </Link>
                  ) : (
                    0
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(member.createdAt)}</TableCell>
                <TableCell>
                  <span className={cn('inline-flex items-center gap-1.5 text-xs', member.isActive ? 'text-available' : 'text-muted-foreground')}>
                    <span className={cn('size-1.5 rounded-full', member.isActive ? 'bg-available' : 'bg-blocked')} />
                    {member.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setFormMember(member)}>Edit</DropdownMenuItem>
                      {!isSelf && (
                        <DropdownMenuItem
                          variant={member.isActive ? 'destructive' : 'default'}
                          onSelect={() => setToggling(member)}
                        >
                          {member.isActive ? 'Deactivate' : 'Reactivate'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );

  return (
    <>
      <PageHeader
        title="Team"
        description="Who can sign in, and how many open leads each person is carrying."
        actions={
          <Button onClick={() => setFormMember(null)}>
            <Plus />
            Add member
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl border bg-card">{content}</div>

      <MemberFormDialog
        open={formMember !== undefined}
        onOpenChange={(open) => !open && setFormMember(undefined)}
        member={formMember ?? null}
        isSelf={formMember?._id === me?._id}
        onSaved={reload}
      />
      <ConfirmDialog
        open={Boolean(toggling)}
        onOpenChange={(open) => !open && setToggling(null)}
        title={toggling?.isActive ? `Deactivate ${toggling?.name}?` : `Reactivate ${toggling?.name}?`}
        description={
          toggling?.isActive
            ? `They'll be signed out right away. Their ${toggling.openLeads} open lead${toggling.openLeads === 1 ? '' : 's'} will move to Unassigned so nothing is dropped.`
            : 'They will be able to sign in again. Reassign leads to them from the Leads page.'
        }
        confirmLabel={toggling?.isActive ? 'Deactivate' : 'Reactivate'}
        variant={toggling?.isActive ? 'destructive' : 'default'}
        loading={saving}
        onConfirm={confirmToggle}
      />
    </>
  );
}
