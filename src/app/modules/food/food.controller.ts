import { Response } from 'express';
import { foodService } from './food.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { AppError, UnauthorizedError } from '../../errorHelpers/AppError';

const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();

  const { items, type } = req.body;

  if (!items || !Array.isArray(items) || !type) {
    throw new AppError('Missing required order fields: items and type');
  }

  const order = await foodService.createOrder(req.user.userId, items, type);

  sendCreated(res, order, 'Order placed successfully');
};


const getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await foodService.getOrders(req.query as any, req.user.role, req.user.userId);
  sendSuccess(res, result.orders, 'Orders retrieved', 200, result.meta);
}

const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const order = await foodService.getOrderById(req.params.id);
  sendSuccess(res, order, 'Order retrieved');
}

const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const order = await foodService.updateOrderStatus(req.params.id, req.body.status);
  sendSuccess(res, order, 'Order status updated');
}

const cancelOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const order = await foodService.cancelOrder(req.params.id, req.user.userId, req.user.role);
  sendSuccess(res, order, 'Order cancelled');
}

const getFullMenu = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const menu = await foodService.getFullMenu();
  sendSuccess(res, menu, 'Menu retrieved');
}

const createMenuItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = await foodService.createMenuItem(req.body);
  sendCreated(res, item, 'Menu item created');
}

const updateMenuItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = await foodService.updateMenuItem(req.params.id, req.body);
  sendSuccess(res, item, 'Menu item updated');
}

const deleteMenuItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await foodService.deleteMenuItem(req.params.id);
  sendNoContent(res);
}

const createMenuCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const cat = await foodService.createMenuCategory(req.body);
  sendCreated(res, cat, 'Menu category created');
}

const updateMenuCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const cat = await foodService.updateMenuCategory(req.params.id, req.body);
  sendSuccess(res, cat, 'Menu category updated');
}

const getFoodStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await foodService.getFoodStats();
  sendSuccess(res, stats, 'Food stats retrieved');
}

export const foodController = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getFullMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createMenuCategory,
  updateMenuCategory,
  getFoodStats,
};
