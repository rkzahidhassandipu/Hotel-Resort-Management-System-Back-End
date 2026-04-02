import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest.middleware';
import {
  createMaintenanceSchema, updateMaintenanceSchema,
  assignMaintenanceSchema, completeMaintenanceSchema, maintenanceQuerySchema,
} from './maintenance.validator';

const router = Router();
router.use(authenticate);

// Stats
router.get('/stats', authorize('ADMIN', 'MANAGER'), maintenanceController.getStats);

// Maintenance Tickets
router.get('/', validateRequest(maintenanceQuerySchema), maintenanceController.getAllTickets);
router.post('/', validateRequest(createMaintenanceSchema), maintenanceController.createTicket);
router.get('/:id', maintenanceController.getTicketById);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validateRequest(updateMaintenanceSchema), maintenanceController.updateTicket);
router.patch('/:id/assign', authorize('ADMIN', 'MANAGER'), validateRequest(assignMaintenanceSchema), maintenanceController.assignTicket);
router.patch('/:id/complete', authorize('ADMIN', 'MANAGER', 'MAINTENANCE'), validateRequest(completeMaintenanceSchema), maintenanceController.completeTicket);
router.patch('/:id/cancel', authorize('ADMIN', 'MANAGER'), maintenanceController.cancelTicket);

// Housekeeping
router.get('/housekeeping/logs', authorize('ADMIN', 'MANAGER', 'STAFF'), maintenanceController.getHousekeepingLogs);
router.post('/housekeeping/logs', authorize('ADMIN', 'MANAGER', 'STAFF'), maintenanceController.createHousekeepingLog);
router.patch('/housekeeping/logs/:logId/complete', authorize('ADMIN', 'MANAGER', 'STAFF'), maintenanceController.completeHousekeeping);

export default router;
