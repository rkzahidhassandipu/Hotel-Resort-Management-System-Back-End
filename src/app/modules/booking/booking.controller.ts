import { Response } from 'express';
import { bookingService } from './booking.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const customerId =
    req.user.role === 'CUSTOMER' ? req.user.userId : req.body.customerId;
  if (!customerId) throw new UnauthorizedError('Customer ID required');
  const booking = await bookingService.createBooking({
    ...req.body,
    customerId,
    createdById: req.user.userId,
  });
  sendCreated(res, booking, 'Booking created successfully');
}

const getAllBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
  if (!req.user) throw new UnauthorizedError();
  const result = await bookingService.getAllBookings(
    req.query as any,
    req.user.role,
    req.user.userId,
  );
  sendSuccess(res, result.bookings, 'Bookings retrieved', 200, result.meta);
}

const getBookingById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const booking = await bookingService.getBookingById(
    req.params.id,
    req.user.role,
    req.user.userId,
  );
  sendSuccess(res, booking, 'Booking retrieved');
}

const confirmBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const booking = await bookingService.confirmBooking(req.params.id);
  sendSuccess(res, booking, 'Booking confirmed');
}

const checkIn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const booking = await bookingService.checkIn(req.params.id);
  sendSuccess(res, booking, 'Check-in successful');
}

const checkOut = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const booking = await bookingService.checkOut(req.params.id);
  sendSuccess(res, booking, 'Check-out successful');
}

const cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const booking = await bookingService.cancelBooking(
    req.params.id,
    req.body.reason,
    req.user.role,
    req.user.userId,
  );
  sendSuccess(res, booking, 'Booking cancelled');
}

const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await bookingService.getBookingStats(
    req.query.fromDate as string,
    req.query.toDate as string,
  );
  sendSuccess(res, stats, 'Booking stats retrieved');
}

export const bookingController = {
  createBooking,
  getAllBookings,
  getBookingById,
  confirmBooking,
  checkIn,
  checkOut,
  cancelBooking,
  getStats,
};
