import { Response } from 'express';
import { notificationService } from './notification.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

  // Admin: create single notification

const create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const notification = await notificationService.create(req.body);
  sendCreated(res, notification, 'Notification sent');
}

const broadcast = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await notificationService.broadcast(req.body);
  sendSuccess(res, result, `Notification broadcast to ${result.sent} users`);
}

const getMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await notificationService.getMyNotifications(
    req.user.userId,
    req.query as any,
  );
  sendSuccess(res, result.notifications, 'Notifications retrieved', 200, result.meta);
}

const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await notificationService.getUnreadCount(req.user.userId);
  sendSuccess(res, result, 'Unread count retrieved');
}

const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user.userId,
  );
  sendSuccess(res, notification, 'Marked as read');
}

const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await notificationService.markAllAsRead(req.user.userId);
  sendSuccess(res, result, 'All notifications marked as read');
}

const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  await notificationService.deleteNotification(req.params.id, req.user.userId);
  sendNoContent(res);
}

const clearRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await notificationService.clearReadNotifications(req.user.userId);
  sendSuccess(res, result, 'Read notifications cleared');
}

const createTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const template = await notificationService.createTemplate(req.body);
  sendCreated(res, template, 'Template created');
}

const getTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const templates = await notificationService.getTemplates();
  sendSuccess(res, templates, 'Templates retrieved');
}

const updateTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const template = await notificationService.updateTemplate(req.params.id, req.body);
  sendSuccess(res, template, 'Template updated');
}

const deleteTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await notificationService.deleteTemplate(req.params.id);
  sendNoContent(res);
}

const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await notificationService.getStats();
  sendSuccess(res, stats, 'Notification stats retrieved');
}

export const notificationController = {
  create,
  broadcast,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearRead,
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  getStats,
};
