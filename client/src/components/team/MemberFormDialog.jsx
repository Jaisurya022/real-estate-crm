import { useEffect } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/common/FormAlert';
import { FormField, fieldProps } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@/hooks/useForm';
import { usersService } from '@/services/users.service';

const toValues = (member) => ({
  name: member?.name ?? '',
  email: member?.email ?? '',
  role: member?.role ?? 'sales',
  password: '',
});

/** Add a team member, or edit name/role and optionally set a new password. */
export function MemberFormDialog({ open, onOpenChange, member, isSelf, onSaved }) {
  const isEdit = Boolean(member);
  const { values, errors, formError, submitting, field, reset, submit } = useForm(toValues(member));

  useEffect(() => {
    if (open) reset(toValues(member));
  }, [open, member, reset]);

  const handleSubmit = submit(async (form) => {
    if (isEdit) {
      const payload = { name: form.name };
      if (!isSelf) payload.role = form.role;
      if (form.password) payload.password = form.password;
      const { unassignedLeads } = await usersService.update(member._id, payload);
      toast.success(
        unassignedLeads
          ? `Team member saved. ${unassignedLeads} open lead${unassignedLeads === 1 ? '' : 's'} moved to Unassigned.`
          : 'Team member saved',
      );
    } else {
      await usersService.create(form);
      toast.success(`${form.name} can now sign in`);
    }
    onOpenChange(false);
    onSaved?.();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${member.name}` : 'Add a team member'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Leave the password empty to keep the current one.' : 'Share the email and password with them so they can sign in.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormAlert message={formError} />
          <FormField id="member-name" label="Full name" error={errors.name}>
            <Input {...fieldProps('member-name', errors.name)} {...field('name')} autoFocus />
          </FormField>
          {!isEdit && (
            <FormField id="member-email" label="Work email" error={errors.email}>
              <Input {...fieldProps('member-email', errors.email)} {...field('email')} type="email" autoComplete="off" />
            </FormField>
          )}
          <FormField
            id="member-role"
            label="Role"
            error={errors.role}
            hint={
              isSelf
                ? "You can't change your own role."
                : member?.role === 'sales' && values.role === 'admin'
                  ? 'Their open leads will move to Unassigned.'
                  : undefined
            }
          >
            <Select value={values.role} onValueChange={field('role').onChange} disabled={isSelf}>
              <SelectTrigger id="member-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            id="member-password"
            label={isEdit ? 'New password' : 'Password'}
            optional={isEdit}
            error={errors.password}
            hint="At least 8 characters"
          >
            <Input {...fieldProps('member-password', errors.password)} {...field('password')} type="password" autoComplete="new-password" />
          </FormField>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save changes' : 'Add member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
