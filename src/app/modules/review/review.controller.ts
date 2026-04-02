import { Response } from 'express';
import { reviewService } from './review.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

const create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const review = await reviewService.create(req.user.userId, req.body);
  sendCreated(res, review, 'Review published successfully');
}

const getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await reviewService.getAll(req.query as any);
  sendSuccess(res, result.reviews, 'Reviews retrieved', 200, result.meta);
}

const getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const review = await reviewService.getById(req.params.id);
  sendSuccess(res, review, 'Review retrieved');
}

const getMyReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const reviews = await reviewService.getMyReviews(req.user.userId);
  sendSuccess(res, reviews, 'My reviews retrieved');
}

const moderate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const review = await reviewService.moderate(
    req.params.id,
    req.body.status,
    req.body.managerResponse,
    req.user.userId,
  );
  sendSuccess(res, review, 'Review moderated');
}

const respond = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const review = await reviewService.respondToReview(
    req.params.id,
    req.body.managerResponse,
    req.user.userId,
  );
  sendSuccess(res, review, 'Response added');
}

const deleteReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await reviewService.deleteReview(req.params.id, req.user.userId, req.user.role);
  sendNoContent(res);
}

const getStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await reviewService.getStats();
  sendSuccess(res, stats, 'Review stats retrieved');
}

export const reviewController = {
  create,
  getAll,
  getById,
  getMyReviews,
  moderate,
  respond,
  deleteReview,
  getStats,
};
