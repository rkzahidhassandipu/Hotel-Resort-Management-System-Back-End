import { Response } from 'express';
import { AuthenticatedRequest } from '../../interfaces';
import { userService } from './user.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { UnauthorizedError, BadRequestError } from '../../errorHelpers/AppError';
import { Role, UserStatus } from '../../../generated/prisma/client';

const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const user = await userService.getMe(req.user.userId);
  sendSuccess(res, user, 'Profile retrieved');
}

const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const user = await userService.updateProfile(req.user.userId, req.body);
  sendSuccess(res, user, 'Profile updated');
}

const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.file) throw new BadRequestError('No image provided');
  const result = await userService.uploadAvatar(req.user.userId, req.file.buffer);
  sendSuccess(res, result, 'Avatar updated');
}

const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await userService.getAllUsers(req.query as any);
  sendSuccess(res, result.users, 'Users retrieved', 200, result.meta);
}

const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, user, 'User retrieved');
}

const createManager = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const newUser = await userService.createManager(req.body, req.user.role as Role, req.user.userId);
  sendCreated(res, newUser); // no message
};

const createStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await userService.createStaffAccount(req.body, req.user.role as Role, req.user.userId);
  sendCreated(res, result, 'Staff account created and pending approval');
}

const approveAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await userService.approveStaffAccount(
    req.params.id,
    req.user.userId,
    req.user.role as Role
  );
  sendSuccess(res, result);
};

const rejectAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await userService.rejectStaffAccount(
    req.params.id, req.user.userId, req.user.role as Role, req.body.reason,
  );
  sendSuccess(res, result, 'Staff account rejected');
}

const getPendingApprovals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await userService.getPendingApprovals(req.query as any);
  sendSuccess(res, result.users, 'Pending accounts retrieved', 200, result.meta);
}

const updateStaff = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const profile = await userService.updateStaff(req.params.id, req.body);
  sendSuccess(res, profile, 'Staff updated');
}

const updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const user = await userService.updateUserStatus(
    req.params.id,
    req.body.status as UserStatus,
    req.user.role as Role,
  );
  sendSuccess(res, user, 'User status updated');
}

const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await userService.deleteUser(req.params.id, req.user.role as Role);
  sendNoContent(res);
}

const getStaffList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await userService.getStaffList(req.query as any);
  sendSuccess(res, result.staff, 'Staff list retrieved', 200, result.meta);
}

const updateCustomerPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const profile = await userService.updateCustomerPreferences(req.user.userId, req.body);
  sendSuccess(res, profile, 'Preferences updated');
}

const getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await userService.getUserStats();
  sendSuccess(res, stats, 'User stats retrieved');
}

export const userController = {
  getMe,
  updateProfile,
  uploadAvatar,
  getAllUsers,
  getUserById,
  createManager,
  createStaff,
  approveAccount,
  rejectAccount,
  getPendingApprovals,
  updateStaff,
  updateUserStatus,
  deleteUser,
  getStaffList,
  updateCustomerPreferences,
  getUserStats,
};
