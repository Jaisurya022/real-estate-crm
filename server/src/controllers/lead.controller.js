import mongoose from 'mongoose';
import { BOOKING_STATUS } from '../constants.js';
import { Activity, Booking, Lead } from '../models/index.js';
import { logActivity } from '../services/activity.service.js';
import { BOOKING_POPULATE } from '../services/booking.service.js';
import {
  LEAD_POPULATE,
  assertPhoneIsFree,
  followUpFilter,
  getAccessibleLead,
  getAssignableUser,
  isAdmin,
  isClosedStage,
  leadScope,
} from '../services/lead.service.js';
import { ApiError } from '../utils/ApiError.js';
import { containsRegex, escapeRegex, pagedResponse, paginate } from '../utils/query.js';

const SORTS = {
  recent: { createdAt: -1 },
  followUp: { nextFollowUpAt: 1, createdAt: -1 },
  name: { name: 1 },
};

const FIELD_LABELS = {
  name: 'name',
  phone: 'phone',
  email: 'email',
  source: 'source',
  budget: 'budget',
  preferredUnitType: 'preferred unit type',
  nextFollowUpAt: 'follow-up date',
};

const comparable = (value) => (value instanceof Date ? value.getTime() : (value ?? null));

const closedLeadError = () =>
  ApiError.badRequest('Follow-ups can only be scheduled on open leads.', [
    { field: 'nextFollowUpAt', message: 'Follow-ups can only be scheduled on open leads.' },
  ]);

export async function listLeads(req, res) {
  const { q, stage, source, assignedTo, followUp, sort, ...pageQuery } = req.valid.query;
  const conditions = [leadScope(req.user)];

  if (q) {
    const digits = q.replace(/\D/g, '');
    conditions.push({
      $or: [
        { name: containsRegex(q) },
        { email: containsRegex(q) },
        ...(digits.length >= 3 ? [{ phone: new RegExp(escapeRegex(digits)) }] : []),
      ],
    });
  }
  if (source) conditions.push({ source });
  if (assignedTo && isAdmin(req.user)) {
    conditions.push({
      assignedTo: assignedTo === 'unassigned' ? null : new mongoose.Types.ObjectId(assignedTo),
    });
  }
  if (followUp) conditions.push(followUpFilter(followUp, req.tzOffset));

  // Stage counts ignore the stage filter so the stage tabs always show totals.
  const baseFilter = { $and: conditions };
  const filter = stage ? { $and: [...conditions, { stage }] } : baseFilter;
  const sortBy = SORTS[sort ?? (followUp ? 'followUp' : 'recent')];
  const page = paginate(pageQuery);

  const [items, total, stageCounts] = await Promise.all([
    Lead.find(filter).sort(sortBy).skip(page.skip).limit(page.limit).populate(LEAD_POPULATE),
    Lead.countDocuments(filter),
    Lead.aggregate([{ $match: baseFilter }, { $group: { _id: '$stage', count: { $sum: 1 } } }]),
  ]);

  res.json({
    ...pagedResponse(items, total, page),
    stageCounts: Object.fromEntries(stageCounts.map(({ _id, count }) => [_id, count])),
  });
}

export async function getLead(req, res) {
  const lead = await getAccessibleLead(req.valid.params.id, req.user);

  const [activities, bookings] = await Promise.all([
    Activity.find({ lead: lead._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('createdBy', 'name role'),
    Booking.find({ lead: lead._id }).sort({ createdAt: -1 }).populate(BOOKING_POPULATE),
    lead.populate(LEAD_POPULATE),
  ]);

  res.json({ lead, activities, bookings });
}

export async function createLead(req, res) {
  const { note, assignedTo: requestedAssignee, ...data } = req.valid.body;
  const user = req.user;

  await assertPhoneIsFree(data.phone, user);

  // Sales employees always own the leads they create. Admins may assign or leave it unassigned.
  let assignee = user;
  if (isAdmin(user)) {
    assignee = requestedAssignee ? await getAssignableUser(requestedAssignee) : null;
  }

  const lead = await Lead.create({ ...data, assignedTo: assignee?._id ?? null, createdBy: user._id });

  await logActivity({ lead: lead._id, type: 'created', message: `Lead added from ${lead.source}`, user });
  if (assignee && isAdmin(user)) {
    await logActivity({
      lead: lead._id,
      type: 'assignment',
      message: `Assigned to ${assignee.name}`,
      meta: { to: assignee._id },
      user,
    });
  }
  if (note) {
    await logActivity({ lead: lead._id, type: 'note', message: note, user });
  }

  await lead.populate(LEAD_POPULATE);
  res.status(201).json({ lead });
}

export async function updateLead(req, res) {
  const lead = await getAccessibleLead(req.valid.params.id, req.user);
  const data = req.valid.body;

  if (data.phone && data.phone !== lead.phone) {
    await assertPhoneIsFree(data.phone, req.user, lead._id);
  }
  if (data.nextFollowUpAt && isClosedStage(lead.stage)) throw closedLeadError();

  const changed = Object.keys(data).filter((key) => comparable(lead[key]) !== comparable(data[key]));
  if (changed.length === 0) {
    await lead.populate(LEAD_POPULATE);
    return res.json({ lead });
  }

  lead.set(data);
  await lead.save();

  const onlyFollowUp = changed.length === 1 && changed[0] === 'nextFollowUpAt';
  await logActivity({
    lead: lead._id,
    type: 'updated',
    message: onlyFollowUp
      ? data.nextFollowUpAt
        ? 'Rescheduled the follow-up'
        : 'Cleared the follow-up'
      : `Updated ${changed.map((key) => FIELD_LABELS[key]).join(', ')}`,
    meta: changed.includes('nextFollowUpAt') ? { nextFollowUpAt: data.nextFollowUpAt } : undefined,
    user: req.user,
  });

  await lead.populate(LEAD_POPULATE);
  res.json({ lead });
}

export async function changeStage(req, res) {
  const lead = await getAccessibleLead(req.valid.params.id, req.user);
  const { stage, lostReason } = req.valid.body;

  if (stage === 'Booked') {
    throw ApiError.badRequest('A lead moves to Booked automatically when you book a unit for it.');
  }
  if (lead.stage === stage) {
    await lead.populate(LEAD_POPULATE);
    return res.json({ lead });
  }
  // "New" means nobody has worked the lead yet, so the pipeline's New count stays honest.
  if (stage === 'New') {
    throw ApiError.badRequest("A lead can't go back to New once it has been worked on.");
  }
  if (lead.stage === 'Booked') {
    const hasBooking = await Booking.exists({ lead: lead._id, status: BOOKING_STATUS.CONFIRMED });
    if (hasBooking) {
      throw ApiError.conflict('This lead has a confirmed booking. Cancel the booking before changing the stage.');
    }
  }

  const previousStage = lead.stage;
  lead.stage = stage;
  if (stage === 'Lost') {
    lead.lostReason = lostReason;
    lead.nextFollowUpAt = null;
  } else {
    lead.lostReason = undefined;
  }
  await lead.save();

  await logActivity({
    lead: lead._id,
    type: 'stage_change',
    message: stage === 'Lost' ? `Marked as Lost: ${lostReason}` : `Moved from ${previousStage} to ${stage}`,
    meta: { from: previousStage, to: stage },
    user: req.user,
  });

  await lead.populate(LEAD_POPULATE);
  res.json({ lead });
}

export async function assignLead(req, res) {
  const lead = await Lead.findById(req.valid.params.id);
  if (!lead) throw ApiError.notFound('Lead');

  const { assignedTo } = req.valid.body;
  const assignee = assignedTo ? await getAssignableUser(assignedTo) : null;

  if (String(lead.assignedTo ?? '') !== String(assignee?._id ?? '')) {
    lead.assignedTo = assignee?._id ?? null;
    await lead.save();
    await logActivity({
      lead: lead._id,
      type: 'assignment',
      message: assignee ? `Assigned to ${assignee.name}` : 'Moved to unassigned',
      meta: { to: assignee?._id ?? null },
      user: req.user,
    });
  }

  await lead.populate(LEAD_POPULATE);
  res.json({ lead });
}

export async function addNote(req, res) {
  const lead = await getAccessibleLead(req.valid.params.id, req.user);
  const { message, nextFollowUpAt } = req.valid.body;

  if (nextFollowUpAt && isClosedStage(lead.stage)) throw closedLeadError();
  if (nextFollowUpAt !== undefined) lead.nextFollowUpAt = nextFollowUpAt;
  lead.lastContactedAt = new Date();

  // Logging the first interaction on a New lead means it has been contacted.
  const firstContact = lead.stage === 'New';
  if (firstContact) lead.stage = 'Contacted';
  await lead.save();

  if (firstContact) {
    await logActivity({
      lead: lead._id,
      type: 'stage_change',
      message: 'Moved from New to Contacted (first interaction logged)',
      meta: { from: 'New', to: 'Contacted' },
      user: req.user,
    });
  }
  const activity = await logActivity({
    lead: lead._id,
    type: 'note',
    message,
    meta: nextFollowUpAt ? { nextFollowUpAt } : undefined,
    user: req.user,
  });

  await Promise.all([activity.populate('createdBy', 'name role'), lead.populate(LEAD_POPULATE)]);
  res.status(201).json({ activity, lead });
}
