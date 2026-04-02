import { Response } from 'express';
import { staffService } from './staff.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

  // Shifts

const createShift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const shift = await staffService.createShift(req.body);
  sendCreated(res, shift, 'Shift created');
}

const getShifts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await staffService.getShifts(req.params.profileId, req.query as any);
  sendSuccess(res, result.shifts, 'Shifts retrieved', 200, result.meta);
}

const markAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const shift = await staffService.markAttendance(req.params.shiftId, req.body);
  sendSuccess(res, shift, 'Attendance marked');
}

const getTodayOnDuty = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const staff = await staffService.getTodayOnDutyStaff();
  sendSuccess(res, staff, 'On-duty staff retrieved');
}

const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const task = await staffService.createTask(req.body, req.user.userId);
  sendCreated(res, task, 'Task created');
}

const getAllTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await staffService.getAllTasks(req.query as any);
  sendSuccess(res, result.tasks, 'Tasks retrieved', 200, result.meta);
}

const getMyTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const tasks = await staffService.getMyTasks(req.user.userId);
  sendSuccess(res, tasks, 'My tasks retrieved');
}

const updateTaskStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const task = await staffService.updateTaskStatus(
    req.params.id,
    req.body.status,
    req.user.userId,
    req.user.role,
    req.body.notes,
  );
  sendSuccess(res, task, 'Task status updated');
}

const addPerformanceReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const review = await staffService.addPerformanceReview(
    req.params.profileId,
    req.user.userId,
    req.body,
  );
  sendCreated(res, review, 'Performance review added');
}

const getPerformanceReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const reviews = await staffService.getPerformanceReviews(req.params.profileId);
  sendSuccess(res, reviews, 'Performance reviews retrieved');
}


const getStaffStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await staffService.getStaffStats();
  sendSuccess(res, stats, 'Staff stats retrieved');
}

export const staffController = {
  createShift,
  getShifts,
  markAttendance,
  getTodayOnDuty,
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus,
  addPerformanceReview,
  getPerformanceReviews,
  getStaffStats,
};
