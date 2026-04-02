import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  body: z.object({
    bookingId: z.string().cuid().optional(),
    type: z.enum([
      'LAUNDRY', 'ROOM_SERVICE', 'EXTRA_TOWELS', 'EXTRA_PILLOW',
      'WAKE_UP_CALL', 'TAXI_BOOKING', 'TOUR_BOOKING', 'SPA_BOOKING',
      'SPECIAL_ARRANGEMENT', 'OTHER',
    ]),
    description: z.string().max(500).optional(),
    scheduledAt: z.string().datetime().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  }),
});

export const updateServiceRequestSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    assignedToId: z.string().cuid().optional(),
    notes: z.string().optional(),
    cost: z.number().positive().optional(),
  }),
});

export const serviceRequestQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    type: z.string().optional(),
    customerId: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});
