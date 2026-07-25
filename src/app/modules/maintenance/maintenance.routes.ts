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

// ── Stats ─────────────────────────────────────────
// Must come before "/:id" so "stats" isn't swallowed as an id param.
router.get('/stats', authorize('ADMIN', 'MANAGER'), maintenanceController.getStats);

// ── Housekeeping ─────────────────────────────────────────
// IMPORTANT: these must be registered BEFORE "/:id" below.
// Express matches routes top-down, and "/:id" would otherwise swallow
// "/housekeeping/logs" (treating "housekeeping" as the :id param),
// causing GET /maintenance/housekeeping/logs to 404 / hit the wrong handler.
router.get('/housekeeping/logs', maintenanceController.getHousekeepingLogs);
router.post('/housekeeping/logs', authorize('ADMIN', 'MANAGER', 'STAFF'), maintenanceController.createHousekeepingLog);
router.patch('/housekeeping/logs/:logId/start', authorize('ADMIN', 'MANAGER', 'STAFF'), maintenanceController.startHousekeeping);
router.patch('/housekeeping/logs/:logId/complete', authorize('ADMIN', 'MANAGER', 'STAFF', 'MAINTENANCE'), maintenanceController.completeHousekeeping);

// ── Maintenance Tickets ─────────────────────────────────────────
router.get('/', validateRequest(maintenanceQuerySchema), maintenanceController.getAllTickets);
router.post('/', validateRequest(createMaintenanceSchema), maintenanceController.createTicket);
router.get('/:id', maintenanceController.getTicketById);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validateRequest(updateMaintenanceSchema), maintenanceController.updateTicket);
router.patch('/:id/assign', authorize('ADMIN', 'MANAGER'), validateRequest(assignMaintenanceSchema), maintenanceController.assignTicket);
router.patch('/:id/complete', authorize('ADMIN', 'MANAGER', 'MAINTENANCE'), validateRequest(completeMaintenanceSchema), maintenanceController.completeTicket);
router.patch('/:id/cancel', authorize('ADMIN', 'MANAGER'), maintenanceController.cancelTicket);

export default router;