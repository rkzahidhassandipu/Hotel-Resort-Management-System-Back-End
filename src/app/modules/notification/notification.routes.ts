import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createNotificationSchema,
  broadcastNotificationSchema,
  createTemplateSchema,
  notificationQuerySchema,
} from './notification.validator';

const router = Router();
router.use(authenticate);

// ── User routes ───────────────────────────────────────────
router.get(
  '/me',
  validateRequest(notificationQuerySchema),
  notificationController.getMyNotifications,
);
router.get(
  '/me/unread-count',
  notificationController.getUnreadCount,
);
router.patch(
  '/me/read-all',
  notificationController.markAllAsRead,
);
router.delete(
  '/me/clear-read',
  notificationController.clearRead,
);
router.patch(
  '/:id/read',
  notificationController.markAsRead,
);
router.delete(
  '/:id',
  notificationController.deleteNotification,
);

// ── Admin routes ──────────────────────────────────────────
router.get(
  '/stats',
  authorize('ADMIN', 'MANAGER'),
  notificationController.getStats,
);
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validateRequest(createNotificationSchema),
  notificationController.create,
);
router.post(
  '/broadcast',
  authorize('ADMIN', 'MANAGER'),
  validateRequest(broadcastNotificationSchema),
  notificationController.broadcast,
);

// ── Template routes ───────────────────────────────────────
router.get(
  '/templates',
  authorize('ADMIN', 'MANAGER'),
  notificationController.getTemplates,
);
router.post(
  '/templates',
  authorize('ADMIN'),
  validateRequest(createTemplateSchema),
  notificationController.createTemplate,
);
router.put(
  '/templates/:id',
  authorize('ADMIN'),
  notificationController.updateTemplate,
);
router.delete(
  '/templates/:id',
  authorize('ADMIN'),
  notificationController.deleteTemplate,
);

export default router;
