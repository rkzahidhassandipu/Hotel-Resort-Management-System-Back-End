import { z } from 'zod';

export const createVisitorSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().min(10).max(20).optional(),
    purpose: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const createInquirySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().min(10).max(20).optional(),
    checkIn: z.string().datetime(),
    checkOut: z.string().datetime(),
    adults: z.number().int().min(1).default(1),
    children: z.number().int().min(0).default(0),
    roomType: z
      .enum(['SINGLE', 'DOUBLE', 'TWIN', 'SUITE', 'DELUXE', 'PENTHOUSE', 'FAMILY', 'VILLA'])
      .optional(),
    budget: z.number().positive().optional(),
    message: z.string().max(1000).optional(),
  }),
});

export const resolveInquirySchema = z.object({
  body: z.object({
    notes: z.string().max(500).optional(),
  }),
});

export const convertVisitorSchema = z.object({
  body: z.object({
    visitorId: z.string().cuid(),
  }),
});

export const updateHotelInfoSchema = z.object({
  body: z.object({
    key: z.string().min(1).max(100),
    value: z.string().min(1),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const visitorQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    convertedToCustomer: z.enum(['true', 'false']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export const inquiryQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isResolved: z.enum(['true', 'false']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});
