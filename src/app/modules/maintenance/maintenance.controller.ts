import { Response } from 'express';
import { maintenanceService } from './maintenance.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

const createTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const ticket = await maintenanceService.createTicket({
    ...req.body,
    reportedById: req.user.userId,
  });
  sendCreated(res, ticket, 'Maintenance ticket created');
}

const getAllTickets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await maintenanceService.getAllTickets(req.query as any);
  sendSuccess(res, result.tickets, 'Tickets retrieved', 200, result.meta);
}

const getTicketById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ticket = await maintenanceService.getTicketById(req.params.id);
  sendSuccess(res, ticket, 'Ticket retrieved');
}

const updateTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ticket = await maintenanceService.updateTicket(req.params.id, req.body);
  sendSuccess(res, ticket, 'Ticket updated');
}

const assignTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ticket = await maintenanceService.assignTicket(
    req.params.id,
    req.body.assignedToId,
    req.body.scheduledAt,
  );
  sendSuccess(res, ticket, 'Ticket assigned');
}

const completeTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ticket = await maintenanceService.completeTicket(req.params.id, req.body);
  sendSuccess(res, ticket, 'Ticket completed');
}

const cancelTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ticket = await maintenanceService.cancelTicket(req.params.id, req.body.reason);
  sendSuccess(res, ticket, 'Ticket cancelled');
}

const createHousekeepingLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const log = await maintenanceService.createHousekeepingLog({
    ...req.body,
    staffId: req.user.userId,
  });
  sendCreated(res, log, 'Housekeeping log created');
}

const completeHousekeeping = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const log = await maintenanceService.completeHousekeeping(req.params.logId);
  sendSuccess(res, log, 'Housekeeping completed');
}

const getHousekeepingLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await maintenanceService.getHousekeepingLogs(req.query as any);
  sendSuccess(res, result.logs, 'Housekeeping logs retrieved', 200, result.meta);
}

const getStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await maintenanceService.getStats();
  sendSuccess(res, stats, 'Maintenance stats retrieved');
}

export const maintenanceController = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  completeTicket,
  cancelTicket,
  createHousekeepingLog,
  completeHousekeeping,
  getHousekeepingLogs,
  getStats,
};
