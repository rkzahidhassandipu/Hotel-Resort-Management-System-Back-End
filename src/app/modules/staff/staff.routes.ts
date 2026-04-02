import { Router } from 'express';
import { staffController } from './staff.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createShiftSchema, markAttendanceSchema, createTaskSchema,
  updateTaskStatusSchema, createPerformanceReviewSchema,
  shiftQuerySchema, taskQuerySchema,
} from './staff.validator';

const router = Router();
router.use(authenticate);

// Stats
router.get('/stats', authorize('ADMIN', 'MANAGER'), staffController.getStaffStats);

// Today on-duty
router.get('/on-duty', authorize('ADMIN', 'MANAGER'), staffController.getTodayOnDuty);

// Shifts
router.post('/shifts', authorize('ADMIN', 'MANAGER'), validateRequest(createShiftSchema), staffController.createShift);
router.get('/shifts/:profileId', validateRequest(shiftQuerySchema), staffController.getShifts);
router.patch('/shifts/:shiftId/attendance', authorize('ADMIN', 'MANAGER'), validateRequest(markAttendanceSchema), staffController.markAttendance);

// Tasks
router.get('/tasks/me', staffController.getMyTasks);
router.get('/tasks', authorize('ADMIN', 'MANAGER'), validateRequest(taskQuerySchema), staffController.getAllTasks);
router.post('/tasks', authorize('ADMIN', 'MANAGER'), validateRequest(createTaskSchema), staffController.createTask);
router.patch('/tasks/:id/status', validateRequest(updateTaskStatusSchema), staffController.updateTaskStatus);

// Performance Reviews
router.post('/performance/:profileId', authorize('ADMIN', 'MANAGER'), validateRequest(createPerformanceReviewSchema), staffController.addPerformanceReview);
router.get('/performance/:profileId', authorize('ADMIN', 'MANAGER'), staffController.getPerformanceReviews);

export default router;
