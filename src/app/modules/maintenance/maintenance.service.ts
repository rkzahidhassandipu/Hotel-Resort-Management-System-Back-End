import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, BadRequestError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

// ── Helpers ─────────────────────────────────────────

const generateTicketNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.maintenanceLog.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  return `MT-${year}-${String(count + 1).padStart(4, '0')}`;
};

// ── Create Ticket — replace the existing createTicket function ─────────────────────────────────────────

const createTicket = async (data: {
  roomId?: string; roomNumber?: string; location?: string; type: string; priority?: string;
  title: string; description: string; reportedById: string; scheduledAt?: string;
}) => {
  let roomId = data.roomId;

  // Resolve roomNumber → roomId (same pattern as createHousekeepingLog)
  if (!roomId && data.roomNumber) {
    const room = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
    if (!room) throw new NotFoundError(`Room ${data.roomNumber} not found`);
    roomId = room.id;
  } else if (roomId) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundError('Room not found');
  }

  const ticketNumber = await generateTicketNumber();

  const ticket = await prisma.maintenanceLog.create({
    data: {
      ticketNumber,
      roomId,
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

  if (roomId) {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'MAINTENANCE' },
    });
  }

  return ticket;
};



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
};

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
};

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
};

const assignTicket = async (id: string, assignedToId: string, scheduledAt?: string) => {
  const ticket = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.status === 'COMPLETED' || ticket.status === 'CANCELLED') {
    throw new BadRequestError(`Cannot assign a ${ticket.status} ticket`);
  }

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
};

const completeTicket = async (id: string, data: {
  actualHours: number; cost?: number; notes?: string;
  parts?: Array<{ partName: string; quantity: number; unitCost: number; totalCost: number }>;
}) => {
  const ticket = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.status === 'COMPLETED') throw new BadRequestError('Ticket already completed');
  if (ticket.status === 'CANCELLED') throw new BadRequestError('Cannot complete a cancelled ticket');

  return prisma.$transaction(async (tx) => {
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

    if (ticket.roomId) {
      await tx.room.update({
        where: { id: ticket.roomId },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  });
};

const cancelTicket = async (id: string, reason?: string) => {
  const ticket = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('Ticket not found');
  if (ticket.status === 'COMPLETED') throw new BadRequestError('Cannot cancel a completed ticket');

  const updated = await prisma.maintenanceLog.update({
    where: { id },
    data: { status: 'CANCELLED', notes: reason },
  });

  if (ticket.roomId) {
    await prisma.room.update({
      where: { id: ticket.roomId },
      data: { status: 'AVAILABLE' },
    });
  }

  return updated;
};

// ── Housekeeping ─────────────────────────────────────────
//
// Accepts a human-friendly roomNumber (e.g. "204") instead of the internal
// roomId (UUID/CUID). roomNumber is @unique on the Room model, so a single
// findUnique resolves it to the actual room before creating the log.
const createHousekeepingLog = async (data: {
  roomNumber: string; staffId?: string; status: string; type: string;
  notes?: string; checklist?: Record<string, boolean>;
}) => {
  const room = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
  if (!room) throw new NotFoundError(`Room ${data.roomNumber} not found`);

  const { roomNumber, ...rest } = data;

  const log = await prisma.housekeepingLog.create({
    data: {
      ...rest,
      roomId: room.id,
      startedAt: new Date(),
      checklist: data.checklist as any,
    },
    include: {
      room: { select: { roomNumber: true, floor: true } },
      staff: { select: { firstName: true, lastName: true } },
    },
  });

  await prisma.room.update({ where: { id: room.id }, data: { status: 'CLEANING' } });

  return log;
};

const startHousekeeping = async (logId: string) => {
  const log = await prisma.housekeepingLog.findUnique({ where: { id: logId } });
  if (!log) throw new NotFoundError('Housekeeping log not found');
  if (log.status === 'COMPLETED') throw new BadRequestError('Log already completed');
  if (log.status === 'IN_PROGRESS') throw new BadRequestError('Log already in progress');

  return prisma.housekeepingLog.update({
    where: { id: logId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
    include: {
      room: { select: { roomNumber: true, floor: true } },
      staff: { select: { firstName: true, lastName: true } },
    },
  });
};

const completeHousekeeping = async (logId: string) => {
  const log = await prisma.housekeepingLog.findUnique({ where: { id: logId } });
  if (!log) throw new NotFoundError('Housekeeping log not found');

  const updated = await prisma.housekeepingLog.update({
    where: { id: logId },
    data: { completedAt: new Date(), status: 'COMPLETED' },
  });

  await prisma.room.update({ where: { id: log.roomId }, data: { status: 'AVAILABLE' } });

  return updated;
};

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
};

// Returns FLAT keys the frontend StatsCards consume directly — no parsing needed
const getStats = async () => {
  // TEMP DEBUG — remove after diagnosing the all-zero stats issue
  const rawCount = await prisma.maintenanceLog.count();
  console.log('[getStats] total rows in maintenance_logs:', rawCount);
  const sample = await prisma.maintenanceLog.findMany({
    take: 3,
    select: { id: true, ticketNumber: true, status: true, createdAt: true },
  });
  console.log('[getStats] sample rows:', JSON.stringify(sample, null, 2));
 
  const [byStatusRaw, byPriorityRaw, byTypeRaw, overduePending] = await Promise.all([
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
 
  console.log('[getStats] byStatusRaw:', byStatusRaw);
 
  const byStatus = Object.fromEntries(byStatusRaw.map((s) => [s.status, s._count.status]));
  const byPriority = Object.fromEntries(byPriorityRaw.map((p) => [p.priority, p._count.priority]));
  const byType = Object.fromEntries(byTypeRaw.map((t) => [t.type, t._count.type]));
 
  const total = byStatusRaw.reduce((sum, s) => sum + s._count.status, 0);
 
  return {
    total,
    pending: byStatus.PENDING || 0,
    inProgress: byStatus.IN_PROGRESS || 0,
    completed: byStatus.COMPLETED || 0,
    cancelled: byStatus.CANCELLED || 0,
    byStatus,
    byPriority,
    byType,
    overduePending,
  };
};

export const maintenanceService = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  completeTicket,
  cancelTicket,
  createHousekeepingLog,
  startHousekeeping,
  completeHousekeeping,
  getHousekeepingLogs,
  getStats,
};