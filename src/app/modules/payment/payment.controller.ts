import { Request, Response } from 'express';
import { paymentService } from './payment.service';
import { AuthenticatedRequest } from '../../interfaces';
import { sendSuccess, sendCreated } from '../../utils/helpers';
import { UnauthorizedError, BadRequestError } from '../../errorHelpers/AppError';
import { config } from '../../config/env';

const create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await paymentService.createPayment(req.user.userId, req.body);
  
  // Online payment returns clientSecret for frontend to complete Stripe payment
  if ('clientSecret' in result) {
    sendCreated(res, result, 'Payment intent created. Complete payment on the client.');
    return;
  }
  sendCreated(res, result, 'Payment recorded successfully');
};

const confirmOnlinePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) throw new BadRequestError('paymentIntentId is required');
  const result = await paymentService.confirmOnlinePayment(paymentIntentId);
  sendSuccess(res, result, 'Payment confirmed successfully');
};

// Raw body needed for Stripe webhook signature verification
const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig) throw new BadRequestError('Missing stripe-signature header');
  const result = await paymentService.handleStripeWebhook(
    req.body as Buffer,
    sig,
    config.stripe.webhookSecret,
  );
  res.json(result);
};


const getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const result = await paymentService.getAllPayments(req.query as any, req.user.role, req.user.userId);
  sendSuccess(res, result.payments, 'Payments retrieved', 200, result.meta);
};

const getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) throw new UnauthorizedError();
  const payment = await paymentService.getPaymentById(req.params.id, req.user.role, req.user.userId);
  sendSuccess(res, payment, 'Payment retrieved');
};

const refund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const payment = await paymentService.processRefund(req.params.id, req.body.refundAmount, req.body.refundReason);
  sendSuccess(res, payment, 'Refund processed successfully');
};

const stats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const data = await paymentService.getPaymentStats();
  sendSuccess(res, data, 'Payment stats retrieved');
};

export const paymentController = {
  create, confirmOnlinePayment, stripeWebhook, getAll, getById, refund, stats,
};
