import { Response } from 'express';
import { reportService } from './report.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess } from '../../utils/helpers';

const getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.getDashboardOverview();
  sendSuccess(res, data, 'Dashboard data retrieved');
}

const getRevenue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.getRevenueReport(req.query as any);
  sendSuccess(res, data, 'Revenue report retrieved');
}

const getOccupancy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.getOccupancyReport(req.query as any);
  sendSuccess(res, data, 'Occupancy report retrieved');
}

const getBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.getBookingReport(req.query as any);
  sendSuccess(res, data, 'Booking report retrieved');
}

const getStaffPerformance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.getStaffPerformanceReport(req.query as any);
  sendSuccess(res, data, 'Staff performance report retrieved');
}

const getFood = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.getFoodReport(req.query as any);
  sendSuccess(res, data, 'Food report retrieved');
}

const generateDaily = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.generateDailyReport(req.body.date);
  sendSuccess(res, data, 'Daily report generated');
}

const getDailyReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.getDailyReports(req.query as any);
  sendSuccess(res, data, 'Daily reports retrieved');
}

const getMonthlyReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await reportService.getMonthlyReports(
    req.query.year ? Number(req.query.year) : undefined,
  );
  sendSuccess(res, data, 'Monthly reports retrieved');
}

export const reportController = {
  getDashboard,
  getRevenue,
  getOccupancy,
  getBookings,
  getStaffPerformance,
  getFood,
  generateDaily,
  getDailyReports,
  getMonthlyReports,
};
