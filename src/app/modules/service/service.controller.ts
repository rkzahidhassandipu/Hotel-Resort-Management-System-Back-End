import { Response } from 'express';
import { serviceRequestService } from './service.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

const create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const sr = await serviceRequestService.create(req.user.userId, req.body);
  sendCreated(res, sr, 'Service request created');
}

const getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await serviceRequestService.getAll(
    req.query as any,
    req.user.role,
    req.user.userId,
  );
  sendSuccess(res, result.requests, 'Service requests retrieved', 200, result.meta);
}

const getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const sr = await serviceRequestService.getById(
    req.params.id,
    req.user.role,
    req.user.userId,
  );
  sendSuccess(res, sr, 'Service request retrieved');
}

const assign = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const sr = await serviceRequestService.assign(req.params.id, req.body.assignedToId);
  sendSuccess(res, sr, 'Request assigned');
}

const updateStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const sr = await serviceRequestService.updateStatus(
    req.params.id,
    req.body.status,
    req.body.notes,
    req.body.cost,
  );
  sendSuccess(res, sr, 'Status updated');
}

const cancel = async (req: AuthenticatedRequest, res: Response): Promise<void> =>  {
  if (!req.user) throw new UnauthorizedError();
  const sr = await serviceRequestService.cancel(
    req.params.id,
    req.user.userId,
    req.user.role,
  );
  sendSuccess(res, sr, 'Request cancelled');
}

const getStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await serviceRequestService.getStats();
  sendSuccess(res, stats, 'Stats retrieved');
}

export const serviceRequestController = {
  create,
  getAll,
  getById,
  assign,
  updateStatus,
  cancel,
  getStats,
};
