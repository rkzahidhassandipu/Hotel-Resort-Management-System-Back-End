import { Router } from 'express';
import { reviewController } from './review.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createReviewSchema, moderateReviewSchema,
  respondToReviewSchema, reviewQuerySchema,
} from './review.validator';

const router = Router();

// Public
router.get('/', validateRequest(reviewQuerySchema), reviewController.getAll);
router.get('/:id', reviewController.getById);

router.use(authenticate);

router.get('/me/list', reviewController.getMyReviews);
router.get('/stats/summary', authorize('ADMIN', 'MANAGER'), reviewController.getStats);
router.post('/', validateRequest(createReviewSchema), reviewController.create);
router.delete('/:id', reviewController.deleteReview);
router.patch('/:id/moderate', authorize('ADMIN', 'MANAGER'), validateRequest(moderateReviewSchema), reviewController.moderate);
router.patch('/:id/respond', authorize('ADMIN', 'MANAGER'), validateRequest(respondToReviewSchema), reviewController.respond);

export default router;
