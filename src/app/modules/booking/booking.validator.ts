import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    customerId: z.string().cuid().optional(),
    roomId: z.string().cuid(),
    checkInDate: z.string().datetime(),
    checkOutDate: z.string().datetime(),
    adults: z.number().int().min(1).max(20).optional(),
    children: z.number().int().min(0).max(10).optional(),
    specialRequests: z.string().max(500).optional(),
    arrivalTime: z.string().optional(),
    source: z.string().optional(),
    promoCode: z.string().optional(),
    guests: z
      .array(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          nationalId: z.string().optional(),
          passportNo: z.string().optional(),
          age: z.number().int().optional(),
          isPrimary: z.boolean().optional(),
        }),
      )
      .optional(),
  }),
});

export const cancelBookingSchema = z.object({
  body: z.object({
    reason: z.string().min(3).max(500),
  }),
});

export const bookingQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z
      .enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'WAITLISTED'])
      .optional(),
    customerId: z.string().optional(),
    roomId: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const bookingStatsQuerySchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});
