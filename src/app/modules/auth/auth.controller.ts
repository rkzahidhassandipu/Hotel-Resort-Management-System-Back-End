import { Request, Response } from 'express';
import { authService } from './auth.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';

const register = async (req: Request, res: Response): Promise<void> => {
  const user = await authService.register(req.body);
  sendCreated(res, user, 'Registration successful. Please verify your email.');
};

const login = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body, req.ip);
  if ('requires2FA' in result) { sendSuccess(res, result, 'Please complete 2FA verification'); return; }
  sendSuccess(res, result, 'Login successful');
};

const verify2FALogin = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.verify2FALogin(req.body, req.ip);
  sendSuccess(res, result, 'Login successful');
};

const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.refreshToken(req.body.refreshToken, req.ip);
  sendSuccess(res, result, 'Token refreshed');
};

const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await authService.logout(req.body.refreshToken, req.user.userId);
  sendNoContent(res);
};

const logoutAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await authService.logoutAll(req.user.userId);
  sendNoContent(res);
};

const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  await authService.verifyEmail(req.body.token);
  sendSuccess(res, null, 'Email verified successfully');
};

const resendVerifyEmail = async (req: Request, res: Response): Promise<void> => {
  await authService.resendVerifyEmail(req.body.email);
  sendSuccess(res, null, 'Verification email sent');
};

const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, null, 'If your email is registered, you will receive a reset link shortly');
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  await authService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, null, 'Password reset successful');
};

const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, null, 'Password changed successfully');
};

const setup2FA = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await authService.setup2FA(req.user.userId);
  sendSuccess(res, result, '2FA setup initiated. Scan the QR code with your authenticator app.');
};

const enable2FA = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await authService.enable2FA(req.user.userId, req.body.token);
  sendSuccess(res, null, '2FA enabled successfully');
};

const disable2FA = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await authService.disable2FA(req.user.userId, req.body.token);
  sendSuccess(res, null, '2FA disabled successfully');
};

const getActiveSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const sessions = await authService.getActiveSessions(req.user.userId);
  sendSuccess(res, sessions, 'Active sessions retrieved');
};

const revokeSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await authService.revokeSession(req.user.userId, req.params.sessionId);
  sendNoContent(res);
};

const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId, deletedAt: null },
    select: {
      id: true, email: true, phone: true, firstName: true, lastName: true,
      gender: true, dateOfBirth: true, avatarUrl: true, role: true, status: true,
      emailVerifiedAt: true, lastLoginAt: true, twoFactorEnabled: true,
      nationality: true, address: true, city: true, country: true,
      createdAt: true, updatedAt: true, customerProfile: true, staffProfile: true,
    },
  });
  if (!user) throw new UnauthorizedError('User not found');
  sendSuccess(res, user, 'Profile retrieved');
};

export const authController = {
  register, login, verify2FALogin, refreshToken, logout, logoutAll,
  verifyEmail, resendVerifyEmail, forgotPassword, resetPassword, changePassword,
  setup2FA, enable2FA, disable2FA, getActiveSessions, revokeSession, getMe,
};
