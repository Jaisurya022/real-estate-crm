import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime, fromDateTimeLocal, toDateTimeLocal, tomorrowAt } from '@/lib/format';
import { leadsService } from '@/services/leads.service';
import { FollowUpLabel } from './FollowUpLabel';

export function FollowUpControl({ lead, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const closed = lead.stage === 'Booked' || lead.stage === 'Lost';

  const startEditing = () => {
    setValue(lead.nextFollowUpAt ? toDateTimeLocal(lead.nextFollowUpAt) : tomorrowAt(11));
    setError('');
    setEditing(true);
  };

  const save = async (nextValue) => {
    setSaving(true);
    setError('');
    try {
      const { lead: updated } = await leadsService.update(lead._id, { nextFollowUpAt: fromDateTimeLocal(nextValue) });
      toast.success(nextValue ? 'Follow-up scheduled' : 'Follow-up cleared');
      setEditing(false);
      onChanged(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (closed) return <span className="text-sm text-muted-foreground">Closed lead</span>;

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          <FollowUpLabel date={lead.nextFollowUpAt} />
          {lead.nextFollowUpAt && <p className="text-xs text-muted-foreground">{formatDateTime(lead.nextFollowUpAt)}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={startEditing}>
          {lead.nextFollowUpAt ? 'Reschedule' : 'Schedule'}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Input type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)} aria-label="Next follow-up" aria-invalid={error ? true : undefined} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => save(value)} loading={saving} disabled={!value}>
          Save
        </Button>
        {lead.nextFollowUpAt && (
          <Button size="sm" variant="ghost" onClick={() => save('')} disabled={saving}>
            Clear
          </Button>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing(false)} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
