import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  body: z.object({
    title:       z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    type:        z.enum(['ELECTRICAL', 'PLUMBING', 'HVAC', 'FURNITURE', 'CLEANING', 'SECURITY', 'OTHER']),
    priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    // roomId (UUID) OR roomNumber (human-friendly) — at least one or location
    roomId:      z.string().uuid().optional(),
    roomNumber:  z.string().optional(),
    location:    z.string().optional(),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    // reportedById comes from req.user in controller — NOT validated here
  }).refine(
    (d) => d.roomId || d.roomNumber || d.location,
    { message: 'roomId, roomNumber, or location is required' }
  ),
});




export const updateMaintenanceSchema = z.object({
  body: z.object({
    type: z.enum(['ELECTRICAL', 'PLUMBING', 'HVAC', 'FURNITURE', 'APPLIANCE', 'STRUCTURAL', 'CLEANING', 'OTHER']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const assignMaintenanceSchema = z.object({
  body: z.object({
    assignedToId: z.string().uuid(),
    scheduledAt: z.string().datetime().optional(),
  }),
});

export const completeMaintenanceSchema = z.object({
  body: z.object({
    actualHours: z.number().positive(),
    cost: z.number().positive().optional(),
    notes: z.string().optional(),
    parts: z.array(z.object({
      partName: z.string().min(1),
      quantity: z.number().int().min(1),
      unitCost: z.number().positive(),
      totalCost: z.number().positive(),
    })).optional(),
  }),
});

export const maintenanceQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    type: z.enum(['ELECTRICAL', 'PLUMBING', 'HVAC', 'FURNITURE', 'APPLIANCE', 'STRUCTURAL', 'CLEANING', 'OTHER']).optional(),
    assignedToId: z.string().optional(),
    roomId: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

