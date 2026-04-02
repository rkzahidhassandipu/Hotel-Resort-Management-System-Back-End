import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  dateRangeSchema,
  generateDailyReportSchema,
  revenueQuerySchema,
  occupancyQuerySchema,
} from './report.validator';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'MANAGER'));

// ── Overview ──────────────────────────────────────────────
router.get('/dashboard', reportController.getDashboard);

// ── Revenue ───────────────────────────────────────────────
router.get('/revenue', validateRequest(revenueQuerySchema), reportController.getRevenue);

// ── Occupancy ─────────────────────────────────────────────
router.get('/occupancy', validateRequest(occupancyQuerySchema), reportController.getOccupancy);

// ── Bookings ──────────────────────────────────────────────
router.get('/bookings', validateRequest(dateRangeSchema), reportController.getBookings);

// ── Staff Performance ─────────────────────────────────────
router.get('/staff-performance', validateRequest(dateRangeSchema), reportController.getStaffPerformance);

// ── Food ──────────────────────────────────────────────────
router.get('/food', validateRequest(dateRangeSchema), reportController.getFood);

// ── Daily Reports ─────────────────────────────────────────
router.get('/daily', validateRequest(dateRangeSchema), reportController.getDailyReports);
router.post(
  '/daily/generate',
  authorize('ADMIN'),
  validateRequest(generateDailyReportSchema),
  reportController.generateDaily,
);

// ── Monthly Reports ───────────────────────────────────────
router.get('/monthly', reportController.getMonthlyReports);

export default router;
