import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/hash';
import {
  signAccessToken, signRefreshToken, signEmailVerifyToken,
  signResetPasswordToken, verifyRefreshToken, verifyEmailToken, verifyResetPasswordToken,
} from '../../lib/auth';
import { sendEmail, emailTemplates } from '../../utils/email';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError, ForbiddenError } from '../../errorHelpers/AppError';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

const createSession = async (
user: { id: string; email: string; role: any; status: any },
deviceInfo?: string,
ip?: string,
) => {
const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, status: user.status });
const refreshToken = signRefreshToken({ userId: user.id });

const refreshExpiry = new Date();
refreshExpiry.setDate(refreshExpiry.getDate() + 7);

await prisma.$transaction([
  prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, deviceInfo, ipAddress: ip, expiresAt: refreshExpiry } }),
  prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastLoginIp: ip } }),
]);

return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role, status: user.status } };
};

const register = async (data: {
firstName: string; lastName: string; email: string; phone?: string;
password: string; gender?: 'MALE' | 'FEMALE' | 'OTHER'; dateOfBirth?: string; nationality?: string;
}) => {
const existing = await prisma.user.findFirst({
  where: { OR: [{ email: data.email }, ...(data.phone ? [{ phone: data.phone }] : [])] },
});
if (existing) throw new ConflictError('Email or phone already registered');

const password = await hashPassword(data.password);
const user = await prisma.user.create({
  data: { ...data, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined, password, role: 'CUSTOMER', status: 'PENDING_VERIFICATION', customerProfile: { create: {} } },
  select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
});

const verifyToken = signEmailVerifyToken({ userId: user.id, email: user.email });
const verifyUrl = `${config.frontend.url}/verify-email?token=${verifyToken}`;
sendEmail({ to: user.email, subject: 'Verify Your Email', html: emailTemplates.verifyEmail(`${user.firstName} ${user.lastName}`, verifyUrl) })
  .catch((err) => logger.error('Verify email send failed:', err));

return user;
};

const login = async (data: { email: string; password: string; deviceInfo?: string }, ip?: string) => {
const user = await prisma.user.findUnique({ where: { email: data.email, deletedAt: null } });
if (!user || !(await comparePassword(data.password, user.password))) throw new UnauthorizedError('Invalid email or password');

if (user.status === 'SUSPENDED') throw new ForbiddenError('Your account has been suspended. Please contact support.');
if (user.status === 'INACTIVE') throw new ForbiddenError('Your account is inactive. Please contact support.');
if (user.status === 'PENDING_VERIFICATION') {
  if (user.role === 'CUSTOMER') throw new ForbiddenError('Please verify your email before logging in.');
  throw new ForbiddenError('Your account is pending admin approval. You will be notified once approved.');
}

  if (user.twoFactorEnabled) return { requires2FA: true, userId: user.id };
  return createSession(user, data.deviceInfo, ip);
};

const verify2FALogin = async (data: { email: string; password: string; totpCode: string }, ip?: string) => {
  const user = await prisma.user.findUnique({ where: { email: data.email, deletedAt: null } });
  if (!user || !(await comparePassword(data.password, user.password))) throw new UnauthorizedError('Invalid credentials');
  if (!user.twoFactorSecret) throw new BadRequestError('2FA not configured');

  const valid = authenticator.verify({ token: data.totpCode, secret: user.twoFactorSecret });
  if (!valid) throw new UnauthorizedError('Invalid 2FA code');
  return createSession(user, undefined, ip);
};

const refreshToken = async (token: string, ip?: string) => {
  let decoded: { userId: string };
  try { decoded = verifyRefreshToken(token); } catch { throw new UnauthorizedError('Invalid refresh token'); }

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, role: true, status: true } } },
  });
  if (!stored || stored.isRevoked || stored.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expired or revoked');
  if (stored.userId !== decoded.userId) throw new UnauthorizedError('Token mismatch');

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true, revokedAt: new Date() } });

  const user = stored.user;
  const newAccessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role, status: user.status });
  const newRefreshToken = signRefreshToken({ userId: user.id });
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);
  await prisma.refreshToken.create({ data: { userId: user.id, token: newRefreshToken, ipAddress: ip, expiresAt: refreshExpiry } });
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (token: string, userId: string) => {
  await prisma.refreshToken.updateMany({ where: { token, userId }, data: { isRevoked: true, revokedAt: new Date() } });
};

const logoutAll = async (userId: string) => {
  await prisma.refreshToken.updateMany({ where: { userId, isRevoked: false }, data: { isRevoked: true, revokedAt: new Date() } });
  await prisma.userSession.deleteMany({ where: { userId } });
};

const verifyEmail = async (token: string) => {
  let decoded: { userId: string; email: string };
  try { decoded = verifyEmailToken(token); } catch { throw new BadRequestError('Invalid or expired verification link'); }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) throw new NotFoundError('User not found');
  if (user.emailVerifiedAt) throw new BadRequestError('Email already verified');

  const newStatus = user.role === 'CUSTOMER' ? 'ACTIVE' : user.status;
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), status: newStatus } });
};

const resendVerifyEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundError('User not found');
  if (user.emailVerifiedAt) throw new BadRequestError('Email already verified');

  const verifyToken = signEmailVerifyToken({ userId: user.id, email: user.email });
  const verifyUrl = `${config.frontend.url}/verify-email?token=${verifyToken}`;
  await sendEmail({ to: email, subject: 'Verify Your Email', html: emailTemplates.verifyEmail(`${user.firstName} ${user.lastName}`, verifyUrl) });
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email, deletedAt: null } });
  if (!user) return;

  const resetToken = signResetPasswordToken({ userId: user.id, email: user.email });
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: resetToken, passwordResetExpiry: expiry } });

  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
  sendEmail({ to: email, subject: 'Reset Your Password', html: emailTemplates.resetPassword(`${user.firstName} ${user.lastName}`, resetUrl) })
    .catch((err) => logger.error('Reset email send failed:', err));
};

const resetPassword = async (token: string, newPassword: string) => {
  let decoded: { userId: string; email: string };
  try { decoded = verifyResetPasswordToken(token); } catch { throw new BadRequestError('Invalid or expired reset link'); }

  const user = await prisma.user.findFirst({ where: { id: decoded.userId, passwordResetToken: token, passwordResetExpiry: { gt: new Date() } } });
  if (!user) throw new BadRequestError('Invalid or expired reset link');

  const password = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password, passwordResetToken: null, passwordResetExpiry: null } });
  await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { isRevoked: true, revokedAt: new Date() } });
};

const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (!(await comparePassword(currentPassword, user.password))) throw new UnauthorizedError('Current password is incorrect');

  const password = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password } });
  await prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true, revokedAt: new Date() } });
};

const setup2FA = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  if (user.twoFactorEnabled) throw new BadRequestError('2FA already enabled');

  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(user.email, config.twoFactor.appName, secret);
  const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
  return { secret, qrCode: qrCodeDataUrl };
};

const enable2FA = async (userId: string, token: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) throw new BadRequestError('Setup 2FA first');
  if (!authenticator.verify({ token, secret: user.twoFactorSecret })) throw new UnauthorizedError('Invalid TOTP code');
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
};

const disable2FA = async (userId: string, token: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) throw new BadRequestError('2FA not enabled');
  if (!authenticator.verify({ token, secret: user.twoFactorSecret })) throw new UnauthorizedError('Invalid TOTP code');
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
};

const getActiveSessions = async (userId: string) => {
  return prisma.refreshToken.findMany({
    where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
    select: { id: true, deviceInfo: true, ipAddress: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

const revokeSession = async (userId: string, sessionId: string) => {
  const session = await prisma.refreshToken.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new NotFoundError('Session not found');
  await prisma.refreshToken.update({ where: { id: sessionId }, data: { isRevoked: true, revokedAt: new Date() } });
};

export const authService = {
  register, login, verify2FALogin, refreshToken, logout, logoutAll,
  verifyEmail, resendVerifyEmail, forgotPassword, resetPassword, changePassword,
  setup2FA, enable2FA, disable2FA, getActiveSessions, revokeSession,
};
