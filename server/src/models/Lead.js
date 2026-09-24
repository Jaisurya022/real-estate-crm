import mongoose from 'mongoose';
import { LEAD_SOURCES, LEAD_STAGES, UNIT_TYPES } from '../constants.js';

const { ObjectId } = mongoose.Schema.Types;

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Digits only (see utils/phone.js). Unique so the same buyer is never worked twice.
    phone: { type: String, required: true, unique: true },
    email: { type: String, trim: true, lowercase: true },
    source: { type: String, enum: LEAD_SOURCES, default: 'Other' },
    budget: { type: Number, min: 0 },
    preferredUnitType: { type: String, enum: UNIT_TYPES },
    stage: { type: String, enum: LEAD_STAGES, default: 'New' },
    lostReason: { type: String, trim: true },
    assignedTo: { type: ObjectId, ref: 'User', default: null },
    nextFollowUpAt: { type: Date, default: null },
    lastContactedAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

leadSchema.index({ assignedTo: 1, stage: 1 });
leadSchema.index({ nextFollowUpAt: 1 });
leadSchema.index({ createdAt: -1 });

leadSchema.set('toJSON', { versionKey: false });

export const Lead = mongoose.model('Lead', leadSchema);
