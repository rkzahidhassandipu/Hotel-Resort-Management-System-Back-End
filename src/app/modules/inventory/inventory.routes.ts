import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  inventoryTransactionSchema,
  createProcurementSchema,
  updateProcurementStatusSchema,
  inventoryQuerySchema,
  createInventoryCategorySchema,
} from './inventory.validator';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'MANAGER', 'STAFF'));

// Stats & alerts
router.get('/stats', authorize('ADMIN', 'MANAGER'), inventoryController.getStats);
router.get('/low-stock', inventoryController.getLowStock);

// Categories
router.get('/categories', inventoryController.getAllCategories);
router.post('/categories', authorize('ADMIN', 'MANAGER'), validateRequest(createInventoryCategorySchema), inventoryController.createCategory);

// Procurement
router.get('/procurement', authorize('ADMIN', 'MANAGER'), inventoryController.getAllProcurement);
router.post('/procurement', authorize('ADMIN', 'MANAGER'), validateRequest(createProcurementSchema), inventoryController.createProcurement);
router.patch('/procurement/:id/status', authorize('ADMIN', 'MANAGER'), validateRequest(updateProcurementStatusSchema), inventoryController.updateProcurementStatus);

// Items
router.get('/', validateRequest(inventoryQuerySchema), inventoryController.getAllItems);
router.post('/', authorize('ADMIN', 'MANAGER'), validateRequest(createInventoryItemSchema), inventoryController.createItem);
router.get('/:id', inventoryController.getItemById);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validateRequest(updateInventoryItemSchema), inventoryController.updateItem);
router.post('/:id/transaction', validateRequest(inventoryTransactionSchema), inventoryController.addTransaction);
router.get('/:id/transactions', inventoryController.getTransactionHistory);

export default router;
