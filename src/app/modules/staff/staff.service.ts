import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

  // ─────────────────────────────────────────────────────────
  // SHIFTS
  // ─────────────────────────────────────────────────────────

const createShift = async (data: {
  staffProfileId: string; type: string; date: string;
  startTime: string; endTime: string; notes?: string;
}) => {
  const profile = await prisma.staffProfile.findUnique({ where: { id: data.staffProfileId } });
  if (!profile) throw new NotFoundError('Staff profile not found');

  // Check for overlapping shift on same date
  const day = new Date(data.date);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const existing = await prisma.shift.findFirst({
    where: {
      staffProfileId: data.staffProfileId,
      date: { gte: day, lt: nextDay },
    },
  });
  if (existing) throw new BadRequestError('Staff already has a shift on this date');

  return prisma.shift.create({
    data: {
      staffProfileId: data.staffProfileId,
      type: data.type as any,
      date: new Date(data.date),
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      notes: data.notes,
    },
    include: {
      staffProfile: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });
}

const getShifts = async (staffProfileId: string, query: {
  page?: string; limit?: string; fromDate?: string; toDate?: string; type?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);
  const where: Prisma.ShiftWhereInput = {
    staffProfileId,
    ...(query.type && { type: query.type as any }),
    ...(query.fromDate && { date: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { date: { lte: new Date(query.toDate) } }),
  };
  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.shift.count({ where }),
  ]);
  return { shifts, meta: getPaginationMeta(total, page, limit) };
}

const markAttendance = async (shiftId: string, data: {
  isPresent: boolean; actualStartTime?: string; actualEndTime?: string;
  overtimeHours?: number; notes?: string;
}) => {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw new NotFoundError('Shift not found');

  return prisma.shift.update({
    where: { id: shiftId },
    data: {
      isPresent: data.isPresent,
      actualStartTime: data.actualStartTime ? new Date(data.actualStartTime) : undefined,
      actualEndTime: data.actualEndTime ? new Date(data.actualEndTime) : undefined,
      overtimeHours: data.overtimeHours,
      notes: data.notes,
    },
  });
}

const getTodayOnDutyStaff = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.shift.findMany({
    where: {
      date: { gte: today, lt: tomorrow },
      isPresent: true,
    },
    include: {
      staffProfile: {
        include: {
          user: { select: { firstName: true, lastName: true, role: true, phone: true, avatarUrl: true } },
        },
      },
    },
  });
}

const createTask = async (data: {
  title: string; description?: string; assignedToId: string;
  priority?: string; dueDate?: string;
}, createdById: string) => {
  const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId } });
  if (!assignee) throw new NotFoundError('Assigned user not found');

  return prisma.staffTask.create({
    data: {
      title: data.title,
      description: data.description,
      assignedToId: data.assignedToId,
      createdById,
      priority: (data.priority as any) || 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: {
      assignedTo: { select: { firstName: true, lastName: true, role: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

const getAllTasks = async (query: {
  page?: string; limit?: string; status?: string;
  priority?: string; assignedToId?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);
  const where: Prisma.StaffTaskWhereInput = {
    ...(query.status && { status: query.status as any }),
    ...(query.priority && { priority: query.priority as any }),
    ...(query.assignedToId && { assignedToId: query.assignedToId }),
  };
  const [tasks, total] = await Promise.all([
    prisma.staffTask.findMany({
      where, skip, take: limit,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.staffTask.count({ where }),
  ]);
  return { tasks, meta: getPaginationMeta(total, page, limit) };
}

const getMyTasks = async (userId: string) => {
  return prisma.staffTask.findMany({
    where: { assignedToId: userId, status: { notIn: ['CANCELLED'] } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
}

const updateTaskStatus = async (taskId: string, status: string, userId: string, role: string, notes?: string) => {
  const task = await prisma.staffTask.findUnique({ where: { id: taskId } });
  if (!task) throw new NotFoundError('Task not found');

  // Only assignee or admin/manager can update
  if (task.assignedToId !== userId && !['ADMIN', 'MANAGER'].includes(role)) {
    throw new ForbiddenError('You can only update tasks assigned to you');
  }

  const data: Record<string, unknown> = { status, notes };
  if (status === 'IN_PROGRESS') data.startedAt = new Date();
  if (status === 'COMPLETED') data.completedAt = new Date();

  return prisma.staffTask.update({
    where: { id: taskId },
    data: data as any,
    include: { assignedTo: { select: { firstName: true, lastName: true } } },
  });
}


const getPerformanceReviews = async (staffProfileId: string) => {
  const profile = await prisma.staffProfile.findUnique({ where: { id: staffProfileId } });
  if (!profile) throw new NotFoundError('Staff profile not found');

  return prisma.performanceReview.findMany({
    where: { staffProfileId },
    orderBy: { reviewedAt: 'desc' },
  });
}

const getStaffStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalStaff, onDutyToday, tasksByStatus, overdueCount] = await Promise.all([
    prisma.user.count({ where: { role: { in: ['MANAGER', 'STAFF', 'MAINTENANCE', 'CHEF'] }, deletedAt: null } }),
    prisma.shift.count({ where: { date: { gte: today }, isPresent: true } }),
    prisma.staffTask.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.staffTask.count({
      where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } },
    }),
  ]);

  return { totalStaff, onDutyToday, tasksByStatus, overdueCount };
}

const addPerformanceReview = async (
  staffProfileId: string,
  reviewedById: string,
  data: {
    period: string;
    rating: number;
    punctuality?: number;
    productivity?: number;
    attitude?: number;
    teamwork?: number;
    comments?: string;
    goals?: string;
  }
) => {
  // Ensure staff profile exists
  const staffProfile = await prisma.staffProfile.findUnique({ where: { id: staffProfileId } });
  if (!staffProfile) throw new NotFoundError('Staff profile not found');

  // Validate rating range (example: 0–5)
  if (data.rating < 0 || data.rating > 5) {
    throw new BadRequestError('Rating must be between 0 and 5');
  }

  return prisma.performanceReview.create({
    data: {
      staffProfileId,
      reviewedById,
      period: data.period,
      rating: data.rating,
      punctuality: data.punctuality,
      productivity: data.productivity,
      attitude: data.attitude,
      teamwork: data.teamwork,
      comments: data.comments,
      goals: data.goals,
      reviewedAt: new Date(),
    },
    include: {
      staffProfile: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
}; 
export const staffService = {
  createShift,
  getShifts,
  markAttendance,
  getTodayOnDutyStaff,
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus,
  addPerformanceReview,
  getPerformanceReviews,
  getStaffStats,
};
