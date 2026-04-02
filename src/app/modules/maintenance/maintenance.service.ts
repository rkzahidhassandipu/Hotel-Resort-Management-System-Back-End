import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, BadRequestError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

  // ── Create Ticket ─────────────────────────────────────────

const createTicket = async (data: {
  roomId?: string; location?: string; type: string; priority?: string;
  title: string; description: string; reportedById: string; scheduledAt?: string;
}) => {
  if (data.roomId) {
    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) throw new NotFoundError('Room not found');
  }

  const ticket = await prisma.maintenanceLog.create({
    data: {
      roomId: data.roomId,
      location: data.location,
      type: data.type as any,
      priority: (data.priority as any) || 'MEDIUM',
      title: data.title,
      description: data.description,
      reportedById: data.reportedById,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
    include: {
      room: { select: { roomNumber: true, floor: true } },
      reportedBy: { select: { firstName: true, lastName: true, role: true } },
    },
  });

  // If room reported, update room status to MAINTENANCE
  if (data.roomId) {
    await prisma.room.update({
      where: { id: data.roomId },
      data: { status: 'MAINTENANCE' },
    });
  }

  return ticket;
}

const getAllTickets = async (query: {
  page?: string; limit?: string; status?: string; priority?: string;
  type?: string; assignedToId?: string; roomId?: string;
  fromDate?: string; toDate?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.MaintenanceLogWhereInput = {
    ...(query.status && { status: query.status as any }),
    ...(query.priority && { priority: query.priority as any }),
    ...(query.type && { type: query.type as any }),
    ...(query.assignedToId && { assignedToId: query.assignedToId }),
    ...(query.roomId && { roomId: query.roomId }),
    ...(query.fromDate && { createdAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { createdAt: { lte: new Date(query.toDate) } }),
  };

  const [tickets, total] = await Promise.all([
    prisma.maintenanceLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        room: { select: { roomNumber: true, floor: true } },
        reportedBy: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        parts: true,
      },
    }),
    prisma.maintenanceLog.count({ where }),
  ]);

  return { tickets, meta: getPaginationMeta(total, page, limit) };
}

const getTicketById = async (id: string) => {
  const ticket = await prisma.maintenanceLog.findUnique({
    where: { id },
    include: {
      room: { select: { roomNumber: true, floor: true, type: true } },
      reportedBy: { select: { firstName: true, lastName: true, role: true } },
      assignedTo: { select: { firstName: true, lastName: true, role: true } },
      parts: true,
    },
  });
  if (!ticket) throw new NotFoundError('Maintenance ticket not found');
  return ticket;
}

const updateTicket = async (id: string, data: {
  type?: string; priority?: string; status?: string;
  title?: string; description?: string; scheduledAt?: string; notes?: string;
}) => {
  const ticket = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');

  return prisma.maintenanceLog.update({
    where: { id },
    data: {
      ...data,
      type: data.type as any,
      priority: data.priority as any,
      status: data.status as any,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
    include: {
      room: { select: { roomNumber: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });
}

const assignTicket = async (id: string, assignedToId: string, scheduledAt?: string) => {
  const ticket = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.status === 'COMPLETED' || ticket.status === 'CANCELLED') {
    throw new BadRequestError(`Cannot assign a ${ticket.status} ticket`);
  }

  // Verify the assignee exists and has maintenance/staff role
  const user = await prisma.user.findUnique({ where: { id: assignedToId } });
  if (!user) throw new NotFoundError('Assigned user not found');
  if (!['MAINTENANCE', 'STAFF', 'MANAGER', 'ADMIN'].includes(user.role)) {
    throw new BadRequestError('User cannot be assigned to maintenance tasks');
  }

  return prisma.maintenanceLog.update({
    where: { id },
    data: {
      assignedToId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    },
    include: {
      assignedTo: { select: { firstName: true, lastName: true } },
      room: { select: { roomNumber: true } },
    },
  });
}

const completeTicket = async (id: string, data: {
  actualHours: number; cost?: number; notes?: string;
  parts?: Array<{ partName: string; quantity: number; unitCost: number; totalCost: number }>;
}) => {
  const ticket = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.status === 'COMPLETED') throw new BadRequestError('Ticket already completed');
  if (ticket.status === 'CANCELLED') throw new BadRequestError('Cannot complete a cancelled ticket');

  return prisma.$transaction(async (tx) => {
    // Add parts if any
    if (data.parts?.length) {
      await tx.maintenancePart.createMany({
        data: data.parts.map((p) => ({ maintenanceId: id, ...p })),
      });
    }

    const updated = await tx.maintenanceLog.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualHours: data.actualHours,
        cost: data.cost,
        notes: data.notes,
      },
      include: { parts: true, room: { select: { roomNumber: true } } },
    });

    // Free up the room — set back to AVAILABLE
    if (ticket.roomId) {
      await tx.room.update({
        where: { id: ticket.roomId },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  });
}

const cancelTicket = async (id: string, reason?: string) => {
  const ticket = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.status === 'COMPLETED') throw new BadRequestError('Cannot cancel a completed ticket');

  const updated = await prisma.maintenanceLog.update({
    where: { id },
    data: { status: 'CANCELLED', notes: reason },
  });

  // Free room if it was in maintenance
  if (ticket.roomId) {
    await prisma.room.update({
      where: { id: ticket.roomId },
      data: { status: 'AVAILABLE' },
    });
  }

  return updated;
}

const createHousekeepingLog = async (data: {
  roomId: string; staffId?: string; status: string; type: string;
  notes?: string; checklist?: Record<string, boolean>;
}) => {
  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room) throw new NotFoundError('Room not found');

  const log = await prisma.housekeepingLog.create({
    data: {
      ...data,
      startedAt: new Date(),
      checklist: data.checklist as any,
    },
    include: { room: { select: { roomNumber: true, floor: true } } },
  });

  // Update room status to CLEANING
  await prisma.room.update({ where: { id: data.roomId }, data: { status: 'CLEANING' } });

  return log;
}

const completeHousekeeping = async (logId: string) => {
  const log = await prisma.housekeepingLog.findUnique({ where: { id: logId } });
  if (!log) throw new NotFoundError('Housekeeping log not found');

  const updated = await prisma.housekeepingLog.update({
    where: { id: logId },
    data: { completedAt: new Date(), status: 'COMPLETED' },
  });

  // Set room back to AVAILABLE
  await prisma.room.update({ where: { id: log.roomId }, data: { status: 'AVAILABLE' } });

  return updated;
}

const getHousekeepingLogs = async (query: { page?: string; limit?: string; roomId?: string }) => {
  const { page, limit, skip } = getPaginationParams(query);
  const where: Prisma.HousekeepingLogWhereInput = {
    ...(query.roomId && { roomId: query.roomId }),
  };
  const [logs, total] = await Promise.all([
    prisma.housekeepingLog.findMany({
      where,
      skip, take: limit,
      orderBy: { date: 'desc' },
      include: {
        room: { select: { roomNumber: true, floor: true } },
        staff: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.housekeepingLog.count({ where }),
  ]);
  return { logs, meta: getPaginationMeta(total, page, limit) };
}

const getStats = async () => {
  const [byStatus, byPriority, byType, overduePending] = await Promise.all([
    prisma.maintenanceLog.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.maintenanceLog.groupBy({
      by: ['priority'], _count: { priority: true },
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    }),
    prisma.maintenanceLog.groupBy({ by: ['type'], _count: { type: true } }),
    prisma.maintenanceLog.count({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        scheduledAt: { lt: new Date() },
      },
    }),
  ]);

  return { byStatus, byPriority, byType, overduePending };
}

export const maintenanceService = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  completeTicket,
  cancelTicket,
  createHousekeepingLog,
  completeHousekeeping,
  getHousekeepingLogs,
  getStats,
};
