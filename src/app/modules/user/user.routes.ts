import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { uploadSingle } from '../../config/multer.config';
import {
  updateProfileSchema,
  createManagerSchema,
  createStaffSchema,
  updateStaffSchema,
  updateUserStatusSchema,
  userListQuerySchema,
  approveAccountSchema,
  rejectAccountSchema,
} from './user.validator';

const router = Router();
router.use(authenticate);

// ── My Profile ────────────────────────────────────────────
router.get('/me', userController.getMe);
router.put('/me', validateRequest(updateProfileSchema), userController.updateProfile);
router.post('/me/avatar', uploadSingle, userController.uploadAvatar);
router.put('/me/preferences', userController.updateCustomerPreferences);

// ── Pending Approvals (ADMIN only) ────────────────────────
// GET /users/pending → list all PENDING_VERIFICATION staff accounts
router.get(
  '/pending',
  authorize('ADMIN'),
  userController.getPendingApprovals,
);

// ── Approve / Reject (ADMIN only) ─────────────────────────
// PATCH /users/:id/approve → approve staff account → ACTIVE
router.patch(
  '/:id/approve',
  authorize('ADMIN'),
  validateRequest(approveAccountSchema),
  userController.approveAccount,
);

// PATCH /users/:id/reject → reject staff account → SUSPENDED
router.patch(
  '/:id/reject',
  authorize('ADMIN'),
  validateRequest(rejectAccountSchema),
  userController.rejectAccount,
);

// ── Manager creation (ADMIN only) ─────────────────────────
// POST /users/managers → create MANAGER account
router.post(
  '/managers',
  authorize('ADMIN'),
  validateRequest(createManagerSchema),
  userController.createManager,
);

// ── Staff / Chef / Maintenance creation (ADMIN or MANAGER) ─
// POST /users/staff → create STAFF | CHEF | MAINTENANCE
// MANAGER creates → PENDING_VERIFICATION (admin must approve)
// ADMIN creates   → directly ACTIVE
router.post(
  '/staff',
  authorize('ADMIN', 'MANAGER'),
  validateRequest(createStaffSchema),
  userController.createStaff,
);

// Update staff profile
router.put(
  '/staff/:id',
  authorize('ADMIN', 'MANAGER'),
  validateRequest(updateStaffSchema),
  userController.updateStaff,
);

// Staff list
router.get(
  '/staff',
  authorize('ADMIN', 'MANAGER'),
  userController.getStaffList,
);

// ── Admin: user management ────────────────────────────────
router.get('/stats', authorize('ADMIN'), userController.getUserStats);
router.get('/', authorize('ADMIN', 'MANAGER'), validateRequest(userListQuerySchema), userController.getAllUsers);
router.get('/:id', authorize('ADMIN', 'MANAGER'), userController.getUserById);
router.patch('/:id/status', authorize('ADMIN'), validateRequest(updateUserStatusSchema), userController.updateUserStatus);
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

export default router;

