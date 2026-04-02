import { Response } from 'express';
import { guestService } from './guest.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/helpers';
import { UnauthorizedError } from '../../errorHelpers/AppError';

  // ── Visitors ──────────────────────────────────────────────

const registerVisitor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const visitor = await guestService.registerVisitor(req.body);
  sendCreated(res, visitor, 'Visitor registered');
}

const getAllVisitors = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await guestService.getAllVisitors(req.query as any);
  sendSuccess(res, result.visitors, 'Visitors retrieved', 200, result.meta);
}

const getVisitorById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const visitor = await guestService.getVisitorById(req.params.id);
  sendSuccess(res, visitor, 'Visitor retrieved');
}

const convertToCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await guestService.convertToCustomer(req.params.id);
  sendSuccess(res, result, result.message);
}

const createInquiry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const inquiry = await guestService.createInquiry(req.body);
  sendCreated(res, inquiry, 'Inquiry submitted. We will contact you shortly.');
}

const getAllInquiries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const result = await guestService.getAllInquiries(req.query as any);
  sendSuccess(res, result.inquiries, 'Inquiries retrieved', 200, result.meta);
}

const getInquiryById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const inquiry = await guestService.getInquiryById(req.params.id);
  sendSuccess(res, inquiry, 'Inquiry retrieved');
}

const resolveInquiry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const inquiry = await guestService.resolveInquiry(
    req.params.id,
    req.user.userId,
    req.body.notes,
  );
  sendSuccess(res, inquiry, 'Inquiry resolved');
}

const deleteInquiry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await guestService.deleteInquiry(req.params.id);
  sendNoContent(res);
}

const getPublicHotelInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const info = await guestService.getHotelInfo(true);
  sendSuccess(res, info, 'Hotel info retrieved');
}

const getAllHotelInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const info = await guestService.getHotelInfo(false);
  sendSuccess(res, info, 'Hotel info retrieved');
}

const upsertHotelInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const info = await guestService.upsertHotelInfo(req.body);
  sendSuccess(res, info, 'Hotel info updated');
}

const deleteHotelInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await guestService.deleteHotelInfo(req.params.key);
  sendNoContent(res);
}

const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const stats = await guestService.getGuestStats();
  sendSuccess(res, stats, 'Guest stats retrieved');
}

export const guestController = {
  registerVisitor,
  getAllVisitors,
  getVisitorById,
  convertToCustomer,
  createInquiry,
  getAllInquiries,
  getInquiryById,
  resolveInquiry,
  deleteInquiry,
  getPublicHotelInfo,
  getAllHotelInfo,
  upsertHotelInfo,
  deleteHotelInfo,
  getStats,
};
