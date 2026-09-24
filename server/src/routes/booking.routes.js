import { Router } from 'express';
import * as bookings from '../controllers/booking.controller.js';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  cancelBookingSchema,
  createBookingSchema,
  listBookingsQuery,
} from '../validators/booking.validators.js';
import { idParams } from '../validators/common.js';

const router = Router();

router.get('/', validate({ query: listBookingsQuery }), bookings.listBookings);
router.post('/', validate({ body: createBookingSchema }), bookings.createBookingHandler);
// Cancelling releases inventory and affects revenue, so it is admin-only.
router.patch(
  '/:id/cancel',
  authorize('admin'),
  validate({ params: idParams, body: cancelBookingSchema }),
  bookings.cancelBookingHandler,
);

export default router;
