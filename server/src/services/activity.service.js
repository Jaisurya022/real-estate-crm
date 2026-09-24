import { Activity } from '../models/index.js';

/** Append an entry to a lead's timeline. */
export function logActivity({ lead, type, message, meta, user }) {
  return Activity.create({ lead, type, message, meta, createdBy: user._id });
}
