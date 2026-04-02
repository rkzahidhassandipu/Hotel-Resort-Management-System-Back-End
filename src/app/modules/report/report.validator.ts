import { z } from 'zod';

export const dateRangeSchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export const generateDailyReportSchema = z.object({
  body: z.object({
    date: z.string().datetime(),
  }),
});

export const revenueQuerySchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  }),
});

export const occupancyQuerySchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    roomType: z
      .enum(['SINGLE', 'DOUBLE', 'TWIN', 'SUITE', 'DELUXE', 'PENTHOUSE', 'FAMILY', 'VILLA'])
      .optional(),
  }),
});
