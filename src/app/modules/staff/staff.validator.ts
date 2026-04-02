import { z } from 'zod';

export const createShiftSchema = z.object({
  body: z.object({
    staffProfileId: z.string().cuid(),
    type: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE']),
    date: z.string().datetime(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    notes: z.string().optional(),
  }),
});

export const markAttendanceSchema = z.object({
  body: z.object({
    isPresent: z.boolean(),
    actualStartTime: z.string().datetime().optional(),
    actualEndTime: z.string().datetime().optional(),
    overtimeHours: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    assignedToId: z.string().cuid(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().datetime().optional(),
  }),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    notes: z.string().optional(),
  }),
});

export const createPerformanceReviewSchema = z.object({
  body: z.object({
    period: z.string().min(1),
    rating: z.number().min(1).max(5),
    punctuality: z.number().min(1).max(5).optional(),
    productivity: z.number().min(1).max(5).optional(),
    attitude: z.number().min(1).max(5).optional(),
    teamwork: z.number().min(1).max(5).optional(),
    comments: z.string().optional(),
    goals: z.string().optional(),
  }),
});

export const shiftQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    type: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE']).optional(),
  }),
});

export const taskQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToId: z.string().optional(),
  }),
});
