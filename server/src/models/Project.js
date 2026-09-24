import mongoose from 'mongoose';
import { PROJECT_STATUS } from '../constants.js';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: PROJECT_STATUS, default: 'Under construction' },
  },
  { timestamps: true },
);

projectSchema.set('toJSON', { versionKey: false });

export const Project = mongoose.model('Project', projectSchema);
