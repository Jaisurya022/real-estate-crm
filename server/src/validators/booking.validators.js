import { z } from 'zod';
import { BOOKING_STATUS } from '../constants.js';
import { objectId, pagination, positiveNumber, searchText } from './common.js';

export const createBookingSchema = z.object({
  leadId: objectId,
  unitId: objectId,
  agreedPrice: positiveNumber('Agreed price').optional(),
  bookingAmount: positiveNumber('Booking amount'),
  notes: z.string().trim().max(1000).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(3, 'Add a short reason for the cancellation.').max(300),
});

export const listBookingsQuery = z.object({
  status: z.enum(Object.values(BOOKING_STATUS)).optional(),
  project: objectId.optional(),
  q: searchText,
  ...pagination,
});
