import { Booking, Lead } from '../models/index.js';
import { BOOKING_POPULATE, cancelBooking, createBooking } from '../services/booking.service.js';
import { isAdmin } from '../services/lead.service.js';
import { containsRegex, escapeRegex, pagedResponse, paginate } from '../utils/query.js';

/** Sales employees see bookings credited to them and bookings of leads they currently own. */
export async function bookingScope(user) {
  if (isAdmin(user)) return {};
  const myLeadIds = await Lead.find({ assignedTo: user._id }).distinct('_id');
  return { $or: [{ salesOwner: user._id }, { lead: { $in: myLeadIds } }] };
}

export async function listBookings(req, res) {
  const { status, project, q, ...pageQuery } = req.valid.query;
  const conditions = [await bookingScope(req.user)];

  if (status) conditions.push({ status });
  if (project) conditions.push({ project });
  if (q) {
    const digits = q.replace(/\D/g, '');
    const leadIds = await Lead.find({
      $or: [
        { name: containsRegex(q) },
        ...(digits.length >= 3 ? [{ phone: new RegExp(escapeRegex(digits)) }] : []),
      ],
    }).distinct('_id');
    conditions.push({ lead: { $in: leadIds } });
  }

  const filter = { $and: conditions };
  const page = paginate(pageQuery);
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(page.skip).limit(page.limit).populate(BOOKING_POPULATE),
    Booking.countDocuments(filter),
  ]);

  res.json(pagedResponse(items, total, page));
}

export async function createBookingHandler(req, res) {
  const booking = await createBooking(req.valid.body, req.user);
  res.status(201).json({ booking });
}

export async function cancelBookingHandler(req, res) {
  const booking = await cancelBooking(req.valid.params.id, req.valid.body.reason, req.user);
  res.json({ booking });
}
