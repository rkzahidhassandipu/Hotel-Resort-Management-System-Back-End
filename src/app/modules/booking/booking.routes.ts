import { Router } from 'express';
import { bookingController } from './booking.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createBookingSchema,
  cancelBookingSchema,
  bookingQuerySchema,
  bookingStatsQuerySchema,
} from './booking.validator';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), validateRequest(bookingStatsQuerySchema), bookingController.getStats);
router.get('/', validateRequest(bookingQuerySchema), bookingController.getAllBookings);
router.post('/', validateRequest(createBookingSchema), bookingController.createBooking);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/confirm', authorize('ADMIN', 'MANAGER', 'STAFF'), bookingController.confirmBooking);
router.patch('/:id/check-in', authorize('ADMIN', 'MANAGER', 'STAFF'), bookingController.checkIn);
router.patch('/:id/check-out', authorize('ADMIN', 'MANAGER', 'STAFF'), bookingController.checkOut);
router.patch('/:id/cancel', validateRequest(cancelBookingSchema), bookingController.cancelBooking);

export default router;
