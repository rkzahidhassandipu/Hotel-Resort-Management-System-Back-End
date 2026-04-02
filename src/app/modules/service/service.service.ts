import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

const create = async (customerId: string, data: {
  bookingId?: string; type: string; description?: string;
  scheduledAt?: string; priority?: string;
}) => {
  if (data.bookingId) {
    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId, customerId, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
    });
    if (!booking) throw new BadRequestError('Invalid booking or booking not active');
  }

  return prisma.serviceRequest.create({
    data: {
      customerId,
      bookingId: data.bookingId,
      type: data.type as any,
      description: data.description,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      priority: (data.priority as any) || 'MEDIUM',
    },
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
      booking: { select: { bookingNumber: true, room: { select: { roomNumber: true } } } },
    },
  });
}

const getAll = async (query: {
  page?: string; limit?: string; status?: string;
  type?: string; customerId?: string; fromDate?: string; toDate?: string;
}, role: string, userId: string) => {
  const { page, limit, skip } = getPaginationParams(query);
  const where: Prisma.ServiceRequestWhereInput = {
    ...(role === 'CUSTOMER' && { customerId: userId }),
    ...(query.status && { status: query.status as any }),
    ...(query.type && { type: query.type as any }),
    ...(query.customerId && role !== 'CUSTOMER' && { customerId: query.customerId }),
    ...(query.fromDate && { createdAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { createdAt: { lte: new Date(query.toDate) } }),
  };

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where, skip, take: limit,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        booking: { select: { bookingNumber: true, room: { select: { roomNumber: true } } } },
      },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return { requests, meta: getPaginationMeta(total, page, limit) };
}

const getById = async (id: string, role: string, userId: string) => {
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      booking: { select: { bookingNumber: true, room: { select: { roomNumber: true } } } },
    },
  });
  if (!request) throw new NotFoundError('Service request not found');
  if (role === 'CUSTOMER' && request.customerId !== userId) throw new ForbiddenError('Access denied');
  return request;
}

const assign = async (id: string, assignedToId: string) => {
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundError('Service request not found');
  if (['COMPLETED', 'CANCELLED'].includes(request.status)) {
    throw new BadRequestError(`Cannot assign a ${request.status} request`);
  }

  const user = await prisma.user.findUnique({ where: { id: assignedToId } });
  if (!user) throw new NotFoundError('User not found');

  return prisma.serviceRequest.update({
    where: { id },
    data: { assignedToId, status: 'ASSIGNED' },
  });
}

const updateStatus = async (id: string, status: string, notes?: string, cost?: number) => {
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundError('Service request not found');
  if (request.status === 'CANCELLED') throw new BadRequestError('Cannot update a cancelled request');

  const data: Record<string, unknown> = { status, notes, cost };
  if (status === 'COMPLETED') data.completedAt = new Date();

  return prisma.serviceRequest.update({ where: { id }, data: data as any });
}

const cancel = async (id: string, userId: string, role: string) => {
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundError('Service request not found');
  if (role === 'CUSTOMER' && request.customerId !== userId) throw new ForbiddenError('Access denied');
  if (request.status === 'COMPLETED') throw new BadRequestError('Cannot cancel a completed request');

  return prisma.serviceRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
}

const getStats = async () => {
  const [byStatus, byType, pendingCount] = await Promise.all([
    prisma.serviceRequest.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.serviceRequest.groupBy({ by: ['type'], _count: { type: true } }),
    prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
  ]);
  return { byStatus, byType, pendingCount };
}

export const serviceRequestService = {
  create,
  getAll,
  getById,
  assign,
  updateStatus,
  cancel,
  getStats,
};
