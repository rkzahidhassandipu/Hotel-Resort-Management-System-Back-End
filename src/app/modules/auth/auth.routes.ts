import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware';
import {
  registerSchema, loginSchema, refreshTokenSchema,
  forgotPasswordSchema, resetPasswordSchema, changePasswordSchema,
  verifyEmailSchema, enable2FASchema, verify2FASchema,
} from './auth.validator';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);
router.post('/login/2fa', authRateLimiter, validateRequest(verify2FASchema), authController.verify2FALogin);
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verify-email', authRateLimiter, validateRequest(forgotPasswordSchema), authController.resendVerifyEmail);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getMe);
router.post('/logout', validateRequest(refreshTokenSchema), authController.logout);
router.post('/logout-all', authController.logoutAll);
router.put('/change-password', validateRequest(changePasswordSchema), authController.changePassword);
router.get('/sessions', authController.getActiveSessions);
router.delete('/sessions/:sessionId', authController.revokeSession);
router.post('/2fa/setup', authController.setup2FA);
router.post('/2fa/enable', validateRequest(enable2FASchema), authController.enable2FA);
router.post('/2fa/disable', validateRequest(enable2FASchema), authController.disable2FA);

export default router;
