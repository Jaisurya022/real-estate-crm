import { BOOKING_RULES, BOOKING_STATUS, ROLES, UNIT_STATUS } from '../constants.js';
import { Booking, Lead, Unit, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { formatINR } from '../utils/format.js';
import { logActivity } from './activity.service.js';
import { getAccessibleLead, isAdmin } from './lead.service.js';

export const BOOKING_POPULATE = [
  { path: 'lead', select: 'name phone stage assignedTo' },
  {
    path: 'unit',
    select: 'unitNumber floor type areaSqft price building',
    populate: { path: 'building', select: 'name' },
  },
  { path: 'project', select: 'name city' },
  { path: 'bookedBy', select: 'name' },
  { path: 'salesOwner', select: 'name' },
  { path: 'cancelledBy', select: 'name' },
];

const unitLabel = (unit) => `${unit.building?.name ?? ''} ${unit.unitNumber}`.trim();

function unitUnavailableError(unit) {
  return unit.status === UNIT_STATUS.BLOCKED
    ? ApiError.conflict(`Unit ${unitLabel(unit)} is blocked and can't be booked.`)
    : ApiError.conflict(`Unit ${unitLabel(unit)} has just been booked by someone else. Pick another unit.`);
}

/**
 * Books a unit for a lead.
 *
 * Double booking is prevented in two layers:
 *  1. An atomic compare-and-set on the unit (`status: available -> booked`).
 *     If two people submit at the same moment, MongoDB lets exactly one
 *     update match; the other gets `null` and a 409.
 *  2. A partial unique index on bookings (one *confirmed* booking per unit)
 *     as a database-level safety net.
 */
const fieldError = (field, message) => ApiError.badRequest(message, [{ field, message }]);

/**
 * Pricing guardrails (see BOOKING_RULES):
 *  - sales employees may discount at most 5% off list price; admins approve bigger deals;
 *  - the booking amount can't exceed 10% of the agreed price (RERA section 13).
 */
export function assertBookingTerms({ listPrice, agreedPrice, bookingAmount }, user) {
  const floorPrice = Math.ceil(listPrice * (1 - BOOKING_RULES.MAX_SALES_DISCOUNT));
  if (!isAdmin(user) && agreedPrice < floorPrice) {
    throw fieldError(
      'agreedPrice',
      `You can offer up to ${BOOKING_RULES.MAX_SALES_DISCOUNT * 100}% off list price (minimum ${formatINR(floorPrice)}). Ask an admin to book bigger discounts.`,
    );
  }

  const maxAdvance = Math.floor(agreedPrice * BOOKING_RULES.MAX_BOOKING_AMOUNT_SHARE);
  if (bookingAmount > maxAdvance) {
    throw fieldError(
      'bookingAmount',
      `Booking amount can be at most ${BOOKING_RULES.MAX_BOOKING_AMOUNT_SHARE * 100}% of the agreed price (${formatINR(maxAdvance)}) before an agreement for sale.`,
    );
  }
}

/** Every sale needs an accountable owner: an active sales employee. */
async function getSalesOwner(lead) {
  const owner = lead.assignedTo
    ? await User.findOne({ _id: lead.assignedTo, role: ROLES.SALES, isActive: true }).select('name')
    : null;
  if (!owner) {
    const message = 'Assign this lead to an active sales employee before booking a unit.';
    throw ApiError.conflict(message, [{ field: 'leadId', message }]);
  }
  return owner;
}

export async function createBooking({ leadId, unitId, agreedPrice, bookingAmount, notes }, user) {
  const lead = await getAccessibleLead(leadId, user);
  if (lead.stage === 'Lost') {
    throw ApiError.conflict('This lead is marked as Lost. Reopen it before booking a unit.');
  }
  const salesOwner = await getSalesOwner(lead);

  const unitBefore = await Unit.findById(unitId).populate('building', 'name');
  if (!unitBefore) throw ApiError.notFound('Unit');
  if (unitBefore.status !== UNIT_STATUS.AVAILABLE) throw unitUnavailableError(unitBefore);

  const price = agreedPrice ?? unitBefore.price;
  assertBookingTerms({ listPrice: unitBefore.price, agreedPrice: price, bookingAmount }, user);

  // Layer 1: claim the unit atomically.
  const unit = await Unit.findOneAndUpdate(
    { _id: unitId, status: UNIT_STATUS.AVAILABLE },
    { $set: { status: UNIT_STATUS.BOOKED } },
    { returnDocument: 'after' },
  );
  if (!unit) throw unitUnavailableError(unitBefore);

  let booking;
  try {
    booking = await Booking.create({
      lead: lead._id,
      unit: unit._id,
      project: unit.project,
      agreedPrice: price,
      bookingAmount,
      notes,
      bookedBy: user._id,
      salesOwner: salesOwner._id,
    });
  } catch (error) {
    // Layer 2 fired: a confirmed booking already exists, so the unit really is booked.
    if (error?.code === 11000) throw unitUnavailableError(unitBefore);
    // Anything else: release the unit so it doesn't stay locked without a booking.
    await Unit.updateOne({ _id: unit._id, status: UNIT_STATUS.BOOKED }, { status: UNIT_STATUS.AVAILABLE });
    throw error;
  }

  const previousStage = lead.stage;
  lead.stage = 'Booked';
  lead.nextFollowUpAt = null;
  lead.lostReason = undefined;
  await lead.save();

  await logActivity({
    lead: lead._id,
    type: 'booking',
    message: `Booked unit ${unitLabel(unitBefore)} at ${formatINR(price)}`,
    meta: { bookingId: booking._id, unitId: unit._id, from: previousStage, to: 'Booked' },
    user,
  });

  return Booking.findById(booking._id).populate(BOOKING_POPULATE);
}

/**
 * Cancels a confirmed booking, releases the unit and, if the customer has no
 * other confirmed booking, moves the lead back to Negotiation so it re-enters
 * the pipeline instead of silently disappearing.
 */
export async function cancelBooking(id, reason, user) {
  const booking = await Booking.findOneAndUpdate(
    { _id: id, status: BOOKING_STATUS.CONFIRMED },
    {
      $set: {
        status: BOOKING_STATUS.CANCELLED,
        cancelReason: reason,
        cancelledBy: user._id,
        cancelledAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  ).populate(BOOKING_POPULATE);

  if (!booking) {
    const exists = await Booking.exists({ _id: id });
    throw exists ? ApiError.conflict('This booking is already cancelled.') : ApiError.notFound('Booking');
  }

  await Unit.updateOne(
    { _id: booking.unit._id, status: UNIT_STATUS.BOOKED },
    { status: UNIT_STATUS.AVAILABLE },
  );

  const hasOtherBooking = await Booking.exists({
    lead: booking.lead._id,
    status: BOOKING_STATUS.CONFIRMED,
  });
  if (!hasOtherBooking) {
    await Lead.updateOne({ _id: booking.lead._id, stage: 'Booked' }, { stage: 'Negotiation' });
  }

  await logActivity({
    lead: booking.lead._id,
    type: 'booking_cancelled',
    message: `Booking for unit ${unitLabel(booking.unit)} cancelled: ${reason}`,
    meta: { bookingId: booking._id, to: hasOtherBooking ? 'Booked' : 'Negotiation' },
    user,
  });

  return booking;
}
