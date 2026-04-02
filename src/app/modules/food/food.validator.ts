import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    bookingId: z.string().cuid().optional(),
    type: z.enum(['DINE_IN', 'ROOM_SERVICE', 'TAKEAWAY']).default('ROOM_SERVICE'),
    tableNumber: z.string().optional(),
    roomNumber: z.string().optional(),
    specialNotes: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          menuItemId: z.string().cuid(),
          quantity: z.number().int().min(1),
          notes: z.string().optional(),
          customizations: z.record(z.unknown()).optional(),
        }),
      )
      .min(1, 'At least one item is required'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
  }),
});

export const createMenuItemSchema = z.object({
  body: z.object({
    categoryId: z.string().cuid(),
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    price: z.number().positive(),
    discountedPrice: z.number().positive().optional(),
    foodCategory: z
      .enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'BEVERAGES', 'DESSERTS', 'SPECIAL'])
      .optional(),
    preparationTime: z.number().int().positive().optional(),
    calories: z.number().int().positive().optional(),
    isVegetarian: z.boolean().optional(),
    isVegan: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
    ingredients: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional(),
  }),
});

export const updateMenuItemSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    discountedPrice: z.number().positive().optional(),
    isAvailable: z.boolean().optional(),
    preparationTime: z.number().int().positive().optional(),
    calories: z.number().int().positive().optional(),
    isVegetarian: z.boolean().optional(),
    isVegan: z.boolean().optional(),
    isGlutenFree: z.boolean().optional(),
  }),
});

export const createMenuCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

export const orderQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
    type: z.enum(['DINE_IN', 'ROOM_SERVICE', 'TAKEAWAY']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});
