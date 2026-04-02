import { Router } from 'express';
import { serviceRequestController } from './service.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createServiceRequestSchema,
  updateServiceRequestSchema,
  serviceRequestQuerySchema,
} from './service.validator';

const router = Router();
router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'MANAGER'), serviceRequestController.getStats);
router.get('/', validateRequest(serviceRequestQuerySchema), serviceRequestController.getAll);
router.post('/', validateRequest(createServiceRequestSchema), serviceRequestController.create);
router.get('/:id', serviceRequestController.getById);
router.patch('/:id/assign', authorize('ADMIN', 'MANAGER'), serviceRequestController.assign);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER', 'STAFF'), validateRequest(updateServiceRequestSchema), serviceRequestController.updateStatus);
router.patch('/:id/cancel', serviceRequestController.cancel);

export default router;
