import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import { createPaymentSchema, confirmPaymentSchema, refundSchema, paymentQuerySchema } from './payment.validator';

const router = Router();

// ── Authenticated routes ───────────────────────────────────
router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), paymentController.stats);
router.get('/', validateRequest(paymentQuerySchema), paymentController.getAll);
router.post('/', authorize('ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'), validateRequest(createPaymentSchema), paymentController.create);
router.post('/confirm-online', validateRequest(confirmPaymentSchema), paymentController.confirmOnlinePayment);
router.get('/:id', paymentController.getById);
router.post('/:id/refund', authorize('ADMIN', 'MANAGER'), validateRequest(refundSchema), paymentController.refund);

export default router;