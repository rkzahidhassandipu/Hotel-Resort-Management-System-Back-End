import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  body: z.object({
    categoryId: z.string().cuid(),
    name: z.string().min(2).max(150),
    sku: z.string().min(1).max(50),
    unit: z.string().min(1).max(30),
    currentStock: z.number().min(0).optional(),
    minimumStock: z.number().min(0),
    maximumStock: z.number().positive().optional(),
    reorderPoint: z.number().min(0),
    unitCost: z.number().positive(),
    supplier: z.string().optional(),
    location: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const updateInventoryItemSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    minimumStock: z.number().min(0).optional(),
    maximumStock: z.number().positive().optional(),
    reorderPoint: z.number().min(0).optional(),
    unitCost: z.number().positive().optional(),
    supplier: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const inventoryTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'WASTAGE', 'TRANSFER', 'RETURN']),
    quantity: z.number().positive(),
    unitCost: z.number().positive().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const createProcurementSchema = z.object({
  body: z.object({
    supplier: z.string().optional(),
    expectedDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          inventoryItemId: z.string().cuid(),
          quantity: z.number().positive(),
          unitCost: z.number().positive(),
        }),
      )
      .min(1),
  }),
});

export const updateProcurementStatusSchema = z.object({
  body: z.object({
    status: z.enum(['SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']),
    notes: z.string().optional(),
  }),
});

export const inventoryQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    status: z.enum(['SUFFICIENT', 'LOW', 'OUT_OF_STOCK', 'OVERSTOCKED']).optional(),
  }),
});

export const createInventoryCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional(),
  }),
});
