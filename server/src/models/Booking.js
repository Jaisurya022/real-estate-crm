import mongoose from 'mongoose';
import { BOOKING_STATUS } from '../constants.js';

const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema(
  {
    lead: { type: ObjectId, ref: 'Lead', required: true },
    unit: { type: ObjectId, ref: 'Unit', required: true },
    project: { type: ObjectId, ref: 'Project', required: true },
    // Snapshot of the negotiated price. Later price changes on the unit
    // must not rewrite what the customer agreed to.
    agreedPrice: { type: Number, required: true, min: 0 },
    bookingAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.CONFIRMED,
    },
    bookedBy: { type: ObjectId, ref: 'User', required: true },
    // Sales employee credited with the sale: the lead's owner at booking time.
    // Kept separately from bookedBy because an admin may book on a rep's behalf,
    // and later reassignment of the lead must not move the credit.
    salesOwner: { type: ObjectId, ref: 'User', required: true },
    cancelReason: { type: String, trim: true },
    cancelledBy: { type: ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

/**
 * Database-level guarantee against double booking: at most ONE confirmed
 * booking can exist per unit. Cancelled bookings are kept for history and
 * are excluded from the constraint.
 */
bookingSchema.index(
  { unit: 1 },
  { unique: true, partialFilterExpression: { status: BOOKING_STATUS.CONFIRMED } },
);
bookingSchema.index({ lead: 1 });
bookingSchema.index({ salesOwner: 1, status: 1 });
bookingSchema.index({ createdAt: -1 });

bookingSchema.set('toJSON', { versionKey: false });

export const Booking = mongoose.model('Booking', bookingSchema);
