import { z } from 'zod';

export const createRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1).max(10),
    floor: z.number().int().min(0),
    type: z.enum(['SINGLE','DOUBLE','TWIN','SUITE','DELUXE','PENTHOUSE','FAMILY','VILLA']),
    bedType: z.enum(['SINGLE','DOUBLE','QUEEN','KING','TWIN','BUNK']),
    maxOccupancy: z.number().int().min(1),
    sizeInSqFt: z.number().positive().optional(),
    categoryId: z.string().cuid(),
    description: z.string().optional(),
    view: z.string().optional(),
    smokingAllowed: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

export const updateRoomSchema = z.object({
  body: z.object({
    floor: z.number().int().min(0).optional(),
    type: z.enum(['SINGLE','DOUBLE','TWIN','SUITE','DELUXE','PENTHOUSE','FAMILY','VILLA']).optional(),
    status: z.enum(['AVAILABLE','OCCUPIED','MAINTENANCE','CLEANING','OUT_OF_ORDER','RESERVED']).optional(),
    bedType: z.enum(['SINGLE','DOUBLE','QUEEN','KING','TWIN','BUNK']).optional(),
    maxOccupancy: z.number().int().min(1).optional(),
    sizeInSqFt: z.number().positive().optional(),
    categoryId: z.string().cuid().optional(),
    description: z.string().optional(),
    view: z.string().optional(),
    smokingAllowed: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
    isActive: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    basePrice: z.number().positive(),
    weekendPrice: z.number().positive().optional(),
    maxOccupancy: z.number().int().min(1),
    amenities: z.array(z.string()).optional(),
  }),
});

export const roomAvailabilitySchema = z.object({
  query: z.object({
    checkIn: z.string().datetime(),
    checkOut: z.string().datetime(),
    type: z.enum(['SINGLE','DOUBLE','TWIN','SUITE','DELUXE','PENTHOUSE','FAMILY','VILLA']).optional(),
    adults: z.string().optional(),
    children: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
  }),
});

export const pricingRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    pricePerNight: z.number().positive(),
    reason: z.string().optional(),
  }),
});

export const roomListQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    type: z.enum(['SINGLE','DOUBLE','TWIN','SUITE','DELUXE','PENTHOUSE','FAMILY','VILLA']).optional(),
    status: z.enum(['AVAILABLE','OCCUPIED','MAINTENANCE','CLEANING','OUT_OF_ORDER','RESERVED']).optional(),
    floor: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    petFriendly: z.string().optional(),
    smokingAllowed: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc','desc']).optional(),
  }),
});
