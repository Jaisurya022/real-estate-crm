import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    totalFloors: { type: Number, required: true, min: 1, max: 100 },
  },
  { timestamps: true },
);

// "Tower A" can exist in two projects, but only once per project.
buildingSchema.index({ project: 1, name: 1 }, { unique: true });

buildingSchema.set('toJSON', { versionKey: false });

export const Building = mongoose.model('Building', buildingSchema);
