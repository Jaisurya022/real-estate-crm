import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/common/FormAlert';
import { FormField, fieldProps } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@/hooks/useForm';
import { LEAD_SOURCES, UNIT_TYPES } from '@/lib/constants';
import { formatINRCompact, fromDateTimeLocal, tomorrowAt } from '@/lib/format';
import { leadsService } from '@/services/leads.service';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  source: 'Walk-in',
  budget: '',
  preferredUnitType: 'none',
  assignedTo: 'unassigned',
  nextFollowUpAt: '',
  note: '',
};

function toFormValues(lead) {
  if (!lead) return { ...EMPTY, nextFollowUpAt: tomorrowAt(11) };
  return {
    ...EMPTY,
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? '',
    source: lead.source,
    budget: lead.budget ?? '',
    preferredUnitType: lead.preferredUnitType ?? 'none',
  };
}

/** Create a lead, or edit an existing lead's details (stage and owner have their own controls). */
export function LeadFormDialog({ open, onOpenChange, lead, canAssign = false, members = [], leadBasePath, onSaved }) {
  const isEdit = Boolean(lead);
  const { values, errors, formError, submitting, field, reset, submit } = useForm(toFormValues(lead));
  const [duplicateLeadId, setDuplicateLeadId] = useState(null);

  useEffect(() => {
    if (!open) return;
    reset(toFormValues(lead));
    setDuplicateLeadId(null);
  }, [open, lead, reset]);

  const handleSubmit = submit(async (form) => {
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      source: form.source,
      budget: form.budget,
      preferredUnitType: form.preferredUnitType === 'none' ? '' : form.preferredUnitType,
    };

    try {
      let saved;
      if (isEdit) {
        ({ lead: saved } = await leadsService.update(lead._id, payload));
        toast.success('Lead details saved');
      } else {
        if (canAssign) payload.assignedTo = form.assignedTo === 'unassigned' ? '' : form.assignedTo;
        if (form.nextFollowUpAt) payload.nextFollowUpAt = fromDateTimeLocal(form.nextFollowUpAt);
        if (form.note.trim()) payload.note = form.note.trim();
        ({ lead: saved } = await leadsService.create(payload));
        toast.success(`${saved.name} added to leads`);
      }
      onOpenChange(false);
      onSaved?.(saved);
    } catch (error) {
      setDuplicateLeadId(error.details?.find?.((detail) => detail.leadId)?.leadId ?? null);
      throw error;
    }
  });

  const budgetHint = Number(values.budget) > 0 ? formatINRCompact(Number(values.budget)) : 'Total budget in rupees';

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit lead details' : 'Add a lead'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update contact and requirement details.'
              : 'Leads are checked by phone number, so the same buyer is never added twice.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormAlert message={formError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="lead-name" label="Full name" error={errors.name}>
              <Input {...fieldProps('lead-name', errors.name)} {...field('name')} autoFocus />
            </FormField>
            <FormField id="lead-phone" label="Phone" error={errors.phone}>
              <Input {...fieldProps('lead-phone', errors.phone)} {...field('phone')} type="tel" inputMode="tel" placeholder="98400 12345" />
            </FormField>
          </div>
          {duplicateLeadId && leadBasePath && (
            <Link href={`${leadBasePath}/${duplicateLeadId}`} className="-mt-2 text-sm font-medium text-primary hover:underline">
              Open the existing lead
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="lead-email" label="Email" optional error={errors.email}>
              <Input {...fieldProps('lead-email', errors.email)} {...field('email')} type="email" />
            </FormField>
            <FormField id="lead-source" label="Source" error={errors.source}>
              <Select value={values.source} onValueChange={field('source').onChange}>
                <SelectTrigger id="lead-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="lead-budget" label="Budget" optional error={errors.budget} hint={budgetHint}>
              <Input {...fieldProps('lead-budget', errors.budget)} {...field('budget')} type="number" min="0" step="100000" inputMode="numeric" placeholder="8000000" />
            </FormField>
            <FormField id="lead-type" label="Looking for" optional error={errors.preferredUnitType}>
              <Select value={values.preferredUnitType} onValueChange={field('preferredUnitType').onChange}>
                <SelectTrigger id="lead-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not sure yet</SelectItem>
                  {UNIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {!isEdit && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {canAssign && (
                  <FormField id="lead-owner" label="Assign to" error={errors.assignedTo}>
                    <Select value={values.assignedTo} onValueChange={field('assignedTo').onChange}>
                      <SelectTrigger id="lead-owner">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Leave unassigned</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member._id} value={member._id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
                <FormField id="lead-followup" label="First follow-up" optional error={errors.nextFollowUpAt}>
                  <Input {...fieldProps('lead-followup', errors.nextFollowUpAt)} {...field('nextFollowUpAt')} type="datetime-local" />
                </FormField>
              </div>
              <FormField id="lead-note" label="Note" optional error={errors.note}>
                <Textarea {...fieldProps('lead-note', errors.note)} {...field('note')} rows={3} placeholder="What did they ask about?" />
              </FormField>
            </>
          )}

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save details' : 'Add lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
