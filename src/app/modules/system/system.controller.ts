import { Response } from 'express';
import { systemService } from './system.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

  // ── System Logs ───────────────────────────────────────────

const getSystemLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await systemService.getSystemLogs(req.query as any);
  sendSuccess(res, result.logs, 'System logs retrieved', 200, result.meta);
}

const getSystemLogById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const log = await systemService.getSystemLogById(req.params.id);
  sendSuccess(res, log, 'Log retrieved');
}

const clearOldLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const daysOld = parseInt(req.body.daysOld ?? '30');
  const result = await systemService.clearOldLogs(daysOld);
  sendSuccess(res, result, `Cleared logs older than ${daysOld} days`);
}

const getErrorLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await systemService.getErrorLogs(req.query as any);
  sendSuccess(res, result.logs, 'Error logs retrieved', 200, result.meta);
}

const getErrorLogById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const log = await systemService.getErrorLogById(req.params.id);
  sendSuccess(res, log, 'Error log retrieved');
}

const resolveErrorLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const log = await systemService.resolveErrorLog(req.params.id, req.user.userId);
  sendSuccess(res, log, 'Error log resolved');
}

const getAuditTrail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await systemService.getAuditTrail(req.query as any);
  sendSuccess(res, result.trail, 'Audit trail retrieved', 200, result.meta);
}

const getHealth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const health = await systemService.getSystemHealth();
  sendSuccess(res, health, 'System health checked');
}

const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await systemService.getSystemStats();
  sendSuccess(res, stats, 'System stats retrieved');
}

const getAllPermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const permissions = await systemService.getAllPermissions();
  sendSuccess(res, permissions, 'Permissions retrieved');
}

const createPermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const permission = await systemService.createPermission(req.body);
  sendCreated(res, permission, 'Permission created');
}

const getRolePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const permissions = await systemService.getRolePermissions(req.params.role);
  sendSuccess(res, permissions, 'Role permissions retrieved');
}

const assignPermissionToRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const rp = await systemService.assignPermissionToRole(req.params.role, req.body.permissionId);
  sendCreated(res, rp, 'Permission assigned to role');
}

const getUserPermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const permissions = await systemService.getUserPermissions(req.params.userId);
  sendSuccess(res, permissions, 'User permissions retrieved');
}

const grantUserPermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const up = await systemService.grantUserPermission(
    req.params.userId,
    req.body.permissionId,
    req.user.userId,
    req.body.expiresAt,
  );
  sendCreated(res, up, 'Permission granted');
}

const revokeUserPermission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await systemService.revokeUserPermission(req.params.userId, req.params.permissionId);
  sendNoContent(res);
}

export const systemController = {
  getSystemLogs,
  getSystemLogById,
  clearOldLogs,
  getErrorLogs,
  getErrorLogById,
  resolveErrorLog,
  getAuditTrail,
  getHealth,
  getStats,
  getAllPermissions,
  createPermission,
  getRolePermissions,
  assignPermissionToRole,
  getUserPermissions,
  grantUserPermission,
  revokeUserPermission,
};
