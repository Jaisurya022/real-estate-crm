import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormAlert } from '@/components/common/FormAlert';
import { FormField } from '@/components/common/FormField';
import { Textarea } from '@/components/ui/textarea';
import { bookingsService } from '@/services/bookings.service';
import { unitLabel } from './BookingStatusBadge';

export function CancelBookingDialog({ booking, onOpenChange, onCancelled }) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReason('');
    setReasonError('');
    setFormError('');
  }, [booking]);

  const handleConfirm = async () => {
    if (reason.trim().length < 3) {
      setReasonError('Add a short reason for the cancellation.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await bookingsService.cancel(booking._id, reason.trim());
      toast.success(`Booking cancelled. Unit ${unitLabel(booking)} is available again.`);
      onOpenChange(false);
      onCancelled?.();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(booking)}
      onOpenChange={onOpenChange}
      title="Cancel this booking?"
      description={
        booking
          ? `Unit ${unitLabel(booking)} goes back on sale and ${booking.lead?.name} returns to Negotiation.`
          : undefined
      }
      confirmLabel="Cancel booking"
      variant="destructive"
      loading={saving}
      onConfirm={handleConfirm}
    >
      <FormAlert message={formError} />
      <FormField id="cancel-reason" label="Reason" error={reasonError}>
        <Textarea
          id="cancel-reason"
          rows={2}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setReasonError('');
          }}
          placeholder="Loan not approved, customer withdrew"
        />
      </FormField>
    </ConfirmDialog>
  );
}
