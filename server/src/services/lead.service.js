import { CLOSED_STAGES, ROLES } from '../constants.js';
import { Lead, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { getDayBounds } from '../utils/dates.js';

export const LEAD_POPULATE = [
  { path: 'assignedTo', select: 'name email' },
  { path: 'createdBy', select: 'name' },
];

export const isAdmin = (user) => user.role === ROLES.ADMIN;

/**
 * Row-level permission for leads: admins see everything, sales employees
 * only see leads assigned to them.
 */
export function leadScope(user) {
  return isAdmin(user) ? {} : { assignedTo: user._id };
}

/**
 * Loads a lead the user is allowed to work on. Returns 404 (not 403) for
 * leads outside the user's scope so other people's leads aren't revealed.
 */
export async function getAccessibleLead(id, user) {
  const lead = await Lead.findOne({ _id: id, ...leadScope(user) });
  if (!lead) throw ApiError.notFound('Lead');
  return lead;
}

/** Leads are worked by sales employees, so only active sales employees can own one. */
export async function getAssignableUser(userId) {
  const user = await User.findOne({ _id: userId, role: ROLES.SALES, isActive: true });
  if (!user) {
    throw ApiError.badRequest('Pick an active sales employee to assign this lead to.', [
      { field: 'assignedTo', message: 'Pick an active sales employee.' },
    ]);
  }
  return user;
}

export const isClosedStage = (stage) => CLOSED_STAGES.includes(stage);

/** Mongo filter for the follow-up views used by the leads list and dashboard. */
export function followUpFilter(kind, tzOffset) {
  const { start, end } = getDayBounds(tzOffset);
  const open = { stage: { $nin: CLOSED_STAGES } };

  switch (kind) {
    case 'overdue':
      return { ...open, nextFollowUpAt: { $lt: start } };
    case 'today':
      return { ...open, nextFollowUpAt: { $gte: start, $lt: end } };
    case 'upcoming':
      return { ...open, nextFollowUpAt: { $gte: end } };
    case 'none':
      return { ...open, nextFollowUpAt: null };
    default:
      return {};
  }
}

/** Friendly 409 when a phone number already belongs to another lead. */
export async function assertPhoneIsFree(phone, user, ignoreLeadId) {
  const existing = await Lead.findOne({ phone, _id: { $ne: ignoreLeadId } }).populate(
    'assignedTo',
    'name',
  );
  if (!existing) return;

  const canOpen = isAdmin(user) || String(existing.assignedTo?._id) === String(user._id);
  const owner = existing.assignedTo?.name;
  const message = owner
    ? `A lead with this phone number already exists and is handled by ${owner}.`
    : 'A lead with this phone number already exists.';

  throw ApiError.conflict(message, [
    { field: 'phone', message, ...(canOpen && { leadId: existing._id }) },
  ]);
}
