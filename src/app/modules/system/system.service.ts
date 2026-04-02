import { Prisma, LogLevel, LogAction } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError, NotFoundError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

  // ── System Logs ───────────────────────────────────────────

const getSystemLogs = async (query: {
  page?: string; limit?: string; userId?: string;
  action?: LogAction; level?: LogLevel; resource?: string;
  fromDate?: string; toDate?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.SystemLogWhereInput = {
    ...(query.userId && { userId: query.userId }),
    ...(query.action && { action: query.action }),
    ...(query.level && { level: query.level }),
    ...(query.resource && { resource: { contains: query.resource, mode: 'insensitive' } }),
    ...(query.fromDate && { createdAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { createdAt: { lte: new Date(query.toDate) } }),
  };

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    }),
    prisma.systemLog.count({ where }),
  ]);

  return { logs, meta: getPaginationMeta(total, page, limit) };
}

const getSystemLogById = async (id: string) => {
  const log = await prisma.systemLog.findUnique({
    where: { id },
    include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
  });
  if (!log) throw new NotFoundError('Log not found');
  return log;
}

const clearOldLogs = async (daysOld: number) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = await prisma.systemLog.deleteMany({
    where: { createdAt: { lt: cutoff }, level: { in: ['INFO', 'DEBUG'] } },
  });

  return { deleted: result.count, cutoff: cutoff.toISOString() };
}

const getErrorLogs = async (query: {
  page?: string; limit?: string; level?: LogLevel;
  isResolved?: string; fromDate?: string; toDate?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.ErrorLogWhereInput = {
    ...(query.level && { level: query.level }),
    ...(query.isResolved !== undefined && { isResolved: query.isResolved === 'true' }),
    ...(query.fromDate && { createdAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { createdAt: { lte: new Date(query.toDate) } }),
  };

  const [logs, total] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.errorLog.count({ where }),
  ]);

  return { logs, meta: getPaginationMeta(total, page, limit) };
}

const getErrorLogById = async (id: string) => {
  const log = await prisma.errorLog.findUnique({ where: { id } });
  if (!log) throw new NotFoundError('Error log not found');
  return log;
}

const resolveErrorLog = async (id: string, resolvedById: string) => {
  const log = await prisma.errorLog.findUnique({ where: { id } });
  if (!log) throw new NotFoundError('Error log not found');

  return prisma.errorLog.update({
    where: { id },
    data: { isResolved: true, resolvedAt: new Date(), resolvedById },
  });
}

const createErrorLog = async (data: {
  message: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  level?: LogLevel;
}) => {
  return prisma.errorLog.create({
    data: {
      message: data.message,
      stackTrace: data.stackTrace,
      // Cast context to Prisma.InputJsonValue
      context: data.context as Prisma.InputJsonValue,
      level: data.level ?? 'ERROR',
      createdAt: new Date(),
    },
  });
}

const getAuditTrail = async (query: {
  page?: string; limit?: string; userId?: string;
  tableName?: string; recordId?: string; action?: string;
  fromDate?: string; toDate?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.AuditTrailWhereInput = {
    ...(query.userId && { userId: query.userId }),
    ...(query.tableName && { tableName: { contains: query.tableName, mode: 'insensitive' } }),
    ...(query.recordId && { recordId: query.recordId }),
    ...(query.action && { action: { contains: query.action, mode: 'insensitive' } }),
    ...(query.fromDate && { createdAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { createdAt: { lte: new Date(query.toDate) } }),
  };

  const [trail, total] = await Promise.all([
    prisma.auditTrail.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditTrail.count({ where }),
  ]);

  return { trail, meta: getPaginationMeta(total, page, limit) };
}

const createAuditEntry = async (data: {
  userId?: string;
  action: string;
  tableName: string;
  recordId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ipAddress?: string;
}) => {
  return prisma.auditTrail.create({ data: data as any });
}

const getSystemHealth = async () => {
  const [
    dbPing,
    totalUsers,
    activeSessions,
    recentErrors,
    logStats,
  ] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.refreshToken.count({ where: { isRevoked: false, expiresAt: { gt: new Date() } } }),
    prisma.errorLog.count({ where: { isResolved: false, level: { in: ['ERROR', 'CRITICAL'] } } }),
    prisma.systemLog.groupBy({ by: ['level'], _count: { level: true } }),
  ]);

  return {
    status: dbPing ? 'healthy' : 'degraded',
    database: { connected: dbPing },
    users: { total: totalUsers, activeSessions },
    errors: { unresolved: recentErrors },
    logsByLevel: logStats,
    timestamp: new Date().toISOString(),
  };
}

const getSystemStats = async () => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    logsLast24h, logsLast7d,
    errorsByLevel,
    topResources,
    topUsers,
  ] = await Promise.all([
    prisma.systemLog.count({ where: { createdAt: { gte: last24h } } }),
    prisma.systemLog.count({ where: { createdAt: { gte: last7d } } }),
    prisma.systemLog.groupBy({ by: ['level'], _count: { level: true }, where: { createdAt: { gte: last7d } } }),
    prisma.systemLog.groupBy({
      by: ['resource'],
      _count: { resource: true },
      orderBy: { _count: { resource: 'desc' } },
      take: 10,
      where: { createdAt: { gte: last7d } },
    }),
    prisma.systemLog.groupBy({
      by: ['userId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
      where: { createdAt: { gte: last7d }, userId: { not: null } },
    }),
  ]);

  return {
    activity: { last24h: logsLast24h, last7d: logsLast7d },
    errorsByLevel,
    topResources,
    topActiveUsers: topUsers,
  };
}

const getAllPermissions = async () => {
  return prisma.permission.findMany({
    include: { _count: { select: { userPermissions: true, rolePermissions: true } } },
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });
}

const createPermission = async (data: {
  name: string; resource: string; action: string; description?: string;
}) => {
  return prisma.permission.create({ data });
}

const getRolePermissions = async (role: string) => {
  return prisma.rolePermission.findMany({
    where: { role: role as any },
    include: { permission: true },
  });
}

const assignPermissionToRole = async (role: string, permissionId: string) => {
  return prisma.rolePermission.create({
    data: { role: role as any, permissionId },
  });
}

const getUserPermissions = async (userId: string) => {
  return prisma.userPermission.findMany({
    where: { userId, isActive: true },
    include: { permission: true },
  });
}


const revokeUserPermission = async (userId: string, permissionId: string) => {
  await prisma.userPermission.updateMany({
    where: { userId, permissionId },
    data: { isActive: false },
  });
}

const grantUserPermission = async (
  userId: string,
  permissionId: string,
  grantedById: string,
  expiresAt?: string
) => {
  // Ensure target user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  // Ensure permission exists
  const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
  if (!permission) throw new NotFoundError('Permission not found');

  // Check if already granted and not expired
  const existing = await prisma.userPermission.findFirst({
    where: {
      userId,
      permissionId,
      // If expiresAt is null or in the future, treat as active
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
  if (existing) throw new AppError('Permission already granted and active');

  return prisma.userPermission.create({
    data: {
      userId,
      permissionId,
      grantedById,
      grantedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      permission: { select: { id: true, name: true, description: true } },
    },
  });
};

export const systemService = {
  getSystemLogs,
  getSystemLogById,
  clearOldLogs,
  getErrorLogs,
  getErrorLogById,
  resolveErrorLog,
  createErrorLog,
  getAuditTrail,
  createAuditEntry,
  getSystemHealth,
  getSystemStats,
  getAllPermissions,
  createPermission,
  getRolePermissions,
  assignPermissionToRole,
  getUserPermissions,
  grantUserPermission,
  revokeUserPermission,
};
