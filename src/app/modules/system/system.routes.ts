import { Router } from 'express';
import { systemController } from './system.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  systemLogQuerySchema,
  errorLogQuerySchema,
  resolveErrorSchema,
  auditQuerySchema,
} from './system.validator';

const router = Router();


// ── Public health check ───────────────────────────────────
router.get('/health', systemController.getHealth);

// ── All routes below require ADMIN ────────────────────────
router.use(authenticate, authorize('ADMIN'));

// System Logs
router.get(
  '/logs',
  validateRequest(systemLogQuerySchema),
  systemController.getSystemLogs,
);
router.get('/logs/:id', systemController.getSystemLogById);
router.delete('/logs/clear', systemController.clearOldLogs);

// Error Logs
router.get(
  '/errors',
  validateRequest(errorLogQuerySchema),
  systemController.getErrorLogs,
);
router.get('/errors/:id', systemController.getErrorLogById);
router.patch(
  '/errors/:id/resolve',
  validateRequest(resolveErrorSchema),
  systemController.resolveErrorLog,
);

// Audit Trail
router.get(
  '/audit',
  validateRequest(auditQuerySchema),
  systemController.getAuditTrail,
);

// Stats
router.get('/stats', systemController.getStats);

// Permissions
router.get('/permissions', systemController.getAllPermissions);
router.post('/permissions', systemController.createPermission);
router.get('/permissions/roles/:role', systemController.getRolePermissions);
router.post('/permissions/roles/:role', systemController.assignPermissionToRole);
router.get('/permissions/users/:userId', systemController.getUserPermissions);
router.post('/permissions/users/:userId', systemController.grantUserPermission);
router.delete(
  '/permissions/users/:userId/:permissionId',
  systemController.revokeUserPermission,
);

export default router;
