import { Response, NextFunction } from 'express';
import { Role } from '../../generated/prisma/client';
import { AuthenticatedRequest } from '../interfaces';
import { UnauthorizedError, ForbiddenError } from '../errorHelpers/AppError';
import { verifyAccessToken } from '../lib/auth';
import { prisma } from '../lib/prisma';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) throw new UnauthorizedError('User no longer exists');
    if (user.status === 'SUSPENDED') throw new ForbiddenError('Account suspended');
    if (user.status === 'INACTIVE') throw new ForbiddenError('Account inactive');

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Not authenticated'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`));
      return;
    }
    next();
  };
};

export const authorizeOwnerOrAdmin = (
  getUserId: (req: AuthenticatedRequest) => string,
) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Not authenticated'));
      return;
    }
    const targetUserId = getUserId(req);
    const isOwner = req.user.userId === targetUserId;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      next(new ForbiddenError('Access denied'));
      return;
    }
    next();
  };
};
