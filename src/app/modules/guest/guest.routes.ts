import { Router } from 'express';
import { guestController } from './guest.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createVisitorSchema,
  createInquirySchema,
  resolveInquirySchema,
  updateHotelInfoSchema,
  visitorQuerySchema,
  inquiryQuerySchema,
} from './guest.validator';

const router = Router();

// ── Public routes (no auth) ───────────────────────────────
router.get('/hotel-info', guestController.getPublicHotelInfo);
router.post(
  '/inquiries',
  validateRequest(createInquirySchema),
  guestController.createInquiry,
);

// ── Protected routes ──────────────────────────────────────
router.use(authenticate);

// Stats
router.get(
  '/stats',
  authorize('ADMIN', 'MANAGER'),
  guestController.getStats,
);

// Visitors
router.get(
  '/visitors',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  validateRequest(visitorQuerySchema),
  guestController.getAllVisitors,
);
router.post(
  '/visitors',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  validateRequest(createVisitorSchema),
  guestController.registerVisitor,
);
router.get(
  '/visitors/:id',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  guestController.getVisitorById,
);
router.post(
  '/visitors/:id/convert',
  authorize('ADMIN', 'MANAGER'),
  guestController.convertToCustomer,
);

// Inquiries
router.get(
  '/inquiries',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  validateRequest(inquiryQuerySchema),
  guestController.getAllInquiries,
);
router.get(
  '/inquiries/:id',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  guestController.getInquiryById,
);
router.patch(
  '/inquiries/:id/resolve',
  authorize('ADMIN', 'MANAGER', 'STAFF'),
  validateRequest(resolveInquirySchema),
  guestController.resolveInquiry,
);
router.delete(
  '/inquiries/:id',
  authorize('ADMIN'),
  guestController.deleteInquiry,
);

// Hotel Info (admin)
router.get(
  '/hotel-info/all',
  authorize('ADMIN', 'MANAGER'),
  guestController.getAllHotelInfo,
);
router.put(
  '/hotel-info',
  authorize('ADMIN'),
  validateRequest(updateHotelInfoSchema),
  guestController.upsertHotelInfo,
);
router.delete(
  '/hotel-info/:key',
  authorize('ADMIN'),
  guestController.deleteHotelInfo,
);

export default router;
