// Re-export from lib/auth for backward compatibility
export {
  signAccessToken,
  signRefreshToken,
  signEmailVerifyToken,
  signResetPasswordToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyEmailToken,
  verifyResetPasswordToken,
} from '../lib/auth';
