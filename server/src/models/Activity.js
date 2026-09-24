import mongoose from 'mongoose';
import { ACTIVITY_TYPES } from '../constants.js';

const { ObjectId } = mongoose.Schema.Types;

/**
 * Append-only timeline for a lead: notes, stage changes, assignments and
 * bookings. Kept in its own collection so a busy lead's history can grow
 * without bloating the lead document.
 */
const activitySchema = new mongoose.Schema(
  {
    lead: { type: ObjectId, ref: 'Lead', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    meta: { type: mongoose.Schema.Types.Mixed },
    createdBy: { type: ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ lead: 1, createdAt: -1 });

activitySchema.set('toJSON', { versionKey: false });

export const Activity = mongoose.model('Activity', activitySchema);
