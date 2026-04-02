import { Response } from 'express';
import { inventoryService } from './inventory.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

const getAllItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await inventoryService.getAllItems(req.query as any);
  sendSuccess(res, result.items, 'Inventory items retrieved', 200, result.meta);
}

const getItemById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = await inventoryService.getItemById(req.params.id);
  sendSuccess(res, item, 'Item retrieved');
}

const createItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = await inventoryService.createItem(req.body);
  sendCreated(res, item, 'Inventory item created');
}

const updateItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = await inventoryService.updateItem(req.params.id, req.body);
  sendSuccess(res, item, 'Item updated');
}

const addTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const item = await inventoryService.addTransaction(
    req.params.id,
    req.body,
    req.user.userId,
  );
  sendSuccess(res, item, 'Transaction recorded');
}

const getTransactionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await inventoryService.getTransactionHistory(
    req.params.id,
    req.query as any,
  );
  sendSuccess(res, result.transactions, 'Transaction history retrieved', 200, result.meta);
}

const getLowStock = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const items = await inventoryService.getLowStockItems();
  sendSuccess(res, items, 'Low stock items retrieved');
}

const getAllCategories = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const cats = await inventoryService.getAllCategories();
  sendSuccess(res, cats, 'Categories retrieved');
}

const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const cat = await inventoryService.createCategory(req.body);
  sendCreated(res, cat, 'Category created');
}

const createProcurement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const order = await inventoryService.createProcurementOrder(req.user.userId, req.body);
  sendCreated(res, order, 'Procurement order created');
};


const getAllProcurement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await inventoryService.getAllProcurementOrders(req.query as any);
  sendSuccess(res, result.orders, 'Procurement orders retrieved', 200, result.meta);
}

const updateProcurementStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const order = await inventoryService.updateProcurementStatus(
    req.params.id,
    req.body.status,
    req.user.userId,
    req.body.notes,
  );
  sendSuccess(res, order, 'Procurement status updated');
}

const getStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await inventoryService.getInventoryStats();
  sendSuccess(res, stats, 'Inventory stats retrieved');
}

export const inventoryController = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  addTransaction,
  getTransactionHistory,
  getLowStock,
  getAllCategories,
  createCategory,
  createProcurement,
  getAllProcurement,
  updateProcurementStatus,
  getStats,
};
