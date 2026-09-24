import { CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fromDateTimeLocal, toDateTimeLocal } from '@/lib/format';
import { cn } from '@/lib/utils';
import { leadsService } from '@/services/leads.service';

function daysFromNow(days, hour = 11) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return toDateTimeLocal(date);
}

const QUICK_PICKS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
];

/** Log a call/visit note and (optionally) set the next follow-up in one step. */
export function NoteComposer({ lead, onAdded }) {
  const [message, setMessage] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const closed = lead.stage === 'Booked' || lead.stage === 'Lost';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('Write a note first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { message: message.trim() };
      if (followUp) payload.nextFollowUpAt = fromDateTimeLocal(followUp);
      const result = await leadsService.addNote(lead._id, payload);
      setMessage('');
      setFollowUp('');
      toast.success(followUp ? 'Note added and follow-up scheduled' : 'Note added');
      onAdded(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <FormField id="note" error={error}>
        <Textarea
          id="note"
          rows={3}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setError('');
          }}
          placeholder="What happened on the call or visit?"
          aria-label="Note"
          aria-invalid={error ? true : undefined}
        />
      </FormField>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {closed ? (
          <p className="text-xs text-muted-foreground">Follow-ups are off for {lead.stage.toLowerCase()} leads.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
            <span className="mr-1 text-sm text-muted-foreground">Next follow-up</span>
            {QUICK_PICKS.map((pick) => {
              const value = daysFromNow(pick.days);
              return (
                <button
                  key={pick.label}
                  type="button"
                  onClick={() => setFollowUp(followUp === value ? '' : value)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                    followUp === value ? 'border-primary bg-accent text-accent-foreground' : 'hover:bg-muted',
                  )}
                >
                  {pick.label}
                </button>
              );
            })}
            <Input
              type="datetime-local"
              value={followUp}
              onChange={(event) => setFollowUp(event.target.value)}
              className="h-7 w-auto px-2 text-xs"
              aria-label="Pick a follow-up date and time"
            />
          </div>
        )}
        <Button type="submit" size="sm" loading={saving} className="self-end sm:self-auto">
          Add note
        </Button>
      </div>
    </form>
  );
}
