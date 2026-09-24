import mongoose from 'mongoose';
import { UNIT_STATUS, UNIT_TYPES } from '../constants.js';

const { ObjectId } = mongoose.Schema.Types;

const unitSchema = new mongoose.Schema(
  {
    // `project` is copied from the building so inventory can be filtered by
    // project without a join. It never changes after creation.
    project: { type: ObjectId, ref: 'Project', required: true },
    building: { type: ObjectId, ref: 'Building', required: true },
    unitNumber: { type: String, required: true, trim: true, maxlength: 20 },
    floor: { type: Number, required: true, min: 0 },
    type: { type: String, enum: UNIT_TYPES, required: true },
    areaSqft: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(UNIT_STATUS), default: UNIT_STATUS.AVAILABLE },
  },
  { timestamps: true },
);

unitSchema.index({ building: 1, unitNumber: 1 }, { unique: true });
unitSchema.index({ project: 1, status: 1 });

unitSchema.set('toJSON', { versionKey: false });

export const Unit = mongoose.model('Unit', unitSchema);
