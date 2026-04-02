import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    bookingId: z.string().cuid().optional(),
    overallRating: z.number().min(1).max(5),
    cleanlinessRating: z.number().min(1).max(5).optional(),
    serviceRating: z.number().min(1).max(5).optional(),
    foodRating: z.number().min(1).max(5).optional(),
    locationRating: z.number().min(1).max(5).optional(),
    valueRating: z.number().min(1).max(5).optional(),
    title: z.string().max(100).optional(),
    comment: z.string().max(1000).optional(),
    isAnonymous: z.boolean().optional(),
  }),
});

export const moderateReviewSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'FLAGGED']),
    managerResponse: z.string().max(1000).optional(),
  }),
});

export const respondToReviewSchema = z.object({
  body: z.object({
    managerResponse: z.string().min(5).max(1000),
  }),
});

export const reviewQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED']).optional(),
    minRating: z.string().optional(),
    maxRating: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    sortBy: z.enum(['overallRating', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
