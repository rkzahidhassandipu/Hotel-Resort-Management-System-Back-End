import { Router } from 'express';
import { foodController } from './food.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createOrderSchema, updateOrderStatusSchema, createMenuItemSchema,
  updateMenuItemSchema, createMenuCategorySchema, orderQuerySchema,
} from './food.validator';

const router = Router();

// ── Public ────────────────────────────────────────────────
router.get('/menu', foodController.getFullMenu);

// ── Protected ─────────────────────────────────────────────
router.use(authenticate);

// Stats
router.get('/stats', authorize('ADMIN', 'MANAGER', 'CHEF'), foodController.getFoodStats);

// Orders
router.get('/orders', validateRequest(orderQuerySchema), foodController.getOrders);
router.post('/orders', validateRequest(createOrderSchema), foodController.createOrder);
router.get('/orders/:id', foodController.getOrderById);
router.patch('/orders/:id/status', authorize('ADMIN', 'MANAGER', 'STAFF', 'CHEF'), validateRequest(updateOrderStatusSchema), foodController.updateOrderStatus);
router.patch('/orders/:id/cancel', foodController.cancelOrder);

// Menu Items
router.post('/menu/items', authorize('ADMIN', 'MANAGER', 'CHEF'), validateRequest(createMenuItemSchema), foodController.createMenuItem);
router.put('/menu/items/:id', authorize('ADMIN', 'MANAGER', 'CHEF'), validateRequest(updateMenuItemSchema), foodController.updateMenuItem);
router.delete('/menu/items/:id', authorize('ADMIN', 'MANAGER'), foodController.deleteMenuItem);

// Menu Categories
router.post('/menu/categories', authorize('ADMIN', 'MANAGER'), validateRequest(createMenuCategorySchema), foodController.createMenuCategory);
router.put('/menu/categories/:id', authorize('ADMIN', 'MANAGER'), foodController.updateMenuCategory);

export default router;
