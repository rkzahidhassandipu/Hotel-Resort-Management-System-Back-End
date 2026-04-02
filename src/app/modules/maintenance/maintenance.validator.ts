import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  body: z.object({
    roomId: z.string().cuid().optional(),
    location: z.string().optional(),
    type: z.enum(['ELECTRICAL', 'PLUMBING', 'HVAC', 'FURNITURE', 'APPLIANCE', 'STRUCTURAL', 'CLEANING', 'OTHER']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    title: z.string().min(3).max(200),
    description: z.string().min(5),
    scheduledAt: z.string().datetime().optional(),
  }),
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
    assignedToId: z.string().cuid(),
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
