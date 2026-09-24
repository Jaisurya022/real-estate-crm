import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormAlert } from '@/components/common/FormAlert';
import { FormField, fieldProps } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { BOOKING_RULES, ROLES, bookingLimits } from '@/lib/constants';
import { formatINR } from '@/lib/format';
import { bookingsService } from '@/services/bookings.service';
import { LeadPicker } from './LeadPicker';
import { UnitPicker } from './UnitPicker';

/**
 * Connects a lead to an available unit. Either side can be preset
 * (booking from a lead's page, or from a unit in the inventory chart).
 */
export function BookingDialog({ open, onOpenChange, lead: presetLead, unit: presetUnit, onBooked }) {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [lead, setLead] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState('all');
  const [unit, setUnit] = useState(null);
  const [agreedPrice, setAgreedPrice] = useState('');
  const [bookingAmount, setBookingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const limits = unit ? bookingLimits(unit.price, Number(agreedPrice), isAdmin) : null;

  useEffect(() => {
    if (!open) return;
    setLead(presetLead ?? null);
    setUnit(presetUnit ?? null);
    setProjectId(presetUnit?.project?._id ?? presetUnit?.project ?? '');
    setType(presetLead?.preferredUnitType ?? 'all');
    setAgreedPrice(presetUnit?.price ? String(presetUnit.price) : '');
    setBookingAmount('');
    setNotes('');
    setErrors({});
    setFormError('');
  }, [open, presetLead, presetUnit]);

  const chooseUnit = (next) => {
    setUnit(next ?? null);
    setAgreedPrice(next?.price ? String(next.price) : '');
    setErrors((current) => ({ ...current, unitId: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!lead) nextErrors.leadId = 'Pick the customer for this booking.';
    else if (!lead.assignedTo) nextErrors.leadId = 'Assign this lead to a sales employee before booking.';
    if (!unit) nextErrors.unitId = 'Pick an available unit.';
    if (unit) {
      const price = Number(agreedPrice);
      if (!(price > 0)) nextErrors.agreedPrice = 'Enter the agreed price.';
      else if (price < limits.minPrice) {
        nextErrors.agreedPrice = `You can offer up to ${BOOKING_RULES.MAX_SALES_DISCOUNT * 100}% off (minimum ${formatINR(limits.minPrice)}). Ask an admin for a bigger discount.`;
      }
    }
    if (!(Number(bookingAmount) > 0)) nextErrors.bookingAmount = 'Enter the booking amount received.';
    else if (unit && Number(bookingAmount) > limits.maxAdvance) {
      nextErrors.bookingAmount = `At most ${formatINR(limits.maxAdvance)} (${BOOKING_RULES.MAX_BOOKING_AMOUNT_SHARE * 100}% of the agreed price) before an agreement for sale.`;
    }
    if (presetLead && nextErrors.leadId) {
      setFormError(nextErrors.leadId);
      delete nextErrors.leadId;
      setErrors(nextErrors);
      return;
    }
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const { booking } = await bookingsService.create({
        leadId: lead._id,
        unitId: unit._id,
        agreedPrice: Number(agreedPrice) || undefined,
        bookingAmount: Number(bookingAmount),
        notes: notes.trim() || undefined,
      });
      toast.success(`${booking.unit.building?.name ?? 'Unit'} ${booking.unit.unitNumber} booked for ${booking.lead.name}`);
      onOpenChange(false);
      onBooked?.(booking);
    } catch (error) {
      const fieldErrors = { ...error.fieldErrors };
      if (error.status === 409 && !fieldErrors.leadId && !presetUnit) {
        // Someone else got the unit first: refresh the list and let them pick again.
        setUnit(null);
        setRefreshKey((key) => key + 1);
      }
      // The customer field isn't shown when booking from a lead's page.
      if (presetLead && fieldErrors.leadId) delete fieldErrors.leadId;
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const discount = unit && Number(agreedPrice) ? unit.price - Number(agreedPrice) : 0;
  const discountPct = unit ? (discount / unit.price) * 100 : 0;
  const priceHint = !unit
    ? undefined
    : discount > 0
      ? `${formatINR(discount)} below list (${discountPct.toFixed(1)}%)`
      : isAdmin
        ? `List price ${formatINR(unit.price)}`
        : `List price. You can go down to ${formatINR(limits.minPrice)}.`;

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Book a unit</DialogTitle>
          <DialogDescription>The unit is reserved the moment you confirm. Nobody else can book it after that.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormAlert message={formError} />

          {!presetLead && (
            <FormField id="booking-lead" label="Customer" error={errors.leadId}>
              <LeadPicker value={lead} onChange={setLead} invalid={Boolean(errors.leadId)} />
            </FormField>
          )}

          {presetUnit ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium">
                {presetUnit.building?.name} {presetUnit.unitNumber}, {presetUnit.type}
              </p>
              <p className="text-xs text-muted-foreground">
                {presetUnit.project?.name}, floor {presetUnit.floor}, {presetUnit.areaSqft} sq ft
              </p>
            </div>
          ) : (
            <UnitPicker
              projectId={projectId}
              onProjectChange={(id) => {
                setProjectId(id);
                chooseUnit(null);
              }}
              type={type}
              onTypeChange={(next) => {
                setType(next);
                chooseUnit(null);
              }}
              unitId={unit?._id ?? ''}
              onUnitChange={chooseUnit}
              refreshKey={refreshKey}
              error={errors.unitId}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="booking-price"
              label="Agreed price"
              error={errors.agreedPrice}
              hint={priceHint}
            >
              <Input
                {...fieldProps('booking-price', errors.agreedPrice)}
                type="number"
                min="0"
                inputMode="numeric"
                value={agreedPrice}
                onChange={(event) => setAgreedPrice(event.target.value)}
                disabled={!unit}
              />
            </FormField>
            <FormField
              id="booking-amount"
              label="Booking amount received"
              error={errors.bookingAmount}
              hint={limits ? `Up to ${formatINR(limits.maxAdvance)} (${BOOKING_RULES.MAX_BOOKING_AMOUNT_SHARE * 100}% of price)` : undefined}
            >
              <Input
                {...fieldProps('booking-amount', errors.bookingAmount)}
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="500000"
                value={bookingAmount}
                onChange={(event) => setBookingAmount(event.target.value)}
              />
            </FormField>
          </div>

          <FormField id="booking-notes" label="Notes" optional>
            <Textarea id="booking-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Payment mode, cheque number, offers agreed" />
          </FormField>

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Confirm booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
