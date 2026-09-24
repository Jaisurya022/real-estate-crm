import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormField } from '@/components/common/FormField';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const COMMON_REASONS = ['Budget mismatch', 'Bought elsewhere', 'Location not suitable', 'Not reachable', 'Plan postponed'];

export function LostLeadDialog({ open, onOpenChange, onConfirm, loading, error }) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setLocalError('');
    }
  }, [open]);

  const pickReason = (value) => {
    setReason(value);
    setLocalError('');
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setLocalError('Add a short reason for losing this lead.');
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mark this lead as lost?"
      description="Follow-ups are cleared. You can reopen the lead later by picking a stage."
      confirmLabel="Mark as lost"
      variant="destructive"
      loading={loading}
      onConfirm={handleConfirm}
    >
      <div className="flex flex-wrap gap-1.5">
        {COMMON_REASONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => pickReason(option)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              reason === option ? 'border-primary bg-accent text-accent-foreground' : 'hover:bg-muted',
            )}
          >
            {option}
          </button>
        ))}
      </div>
      <FormField id="lost-reason" label="Reason" error={localError || error}>
        <Textarea
          id="lost-reason"
          rows={2}
          value={reason}
          onChange={(event) => pickReason(event.target.value)}
          placeholder="Why didn't this lead go ahead?"
          aria-invalid={localError || error ? true : undefined}
        />
      </FormField>
    </ConfirmDialog>
  );
}
