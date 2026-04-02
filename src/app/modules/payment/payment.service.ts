import { Prisma, PaymentStatus } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { stripe } from '../../config/stripe.config';
import { sendEmail, emailTemplates } from '../../utils/email';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';
import { logger } from '../../utils/logger';

// ── Create Payment (Cash / Card / Online) ─────────────────
const createPayment = async (
  userId: string,
  data: {
    bookingId?: string;
    amount: number;
    method: string;
    currency?: string;
    transactionId?: string;
    notes?: string;
  },
) => {
  if (data.bookingId) {
    const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
  }

  const currency = (data.currency || 'BDT').toLowerCase();

  // ── ONLINE PAYMENT via Stripe ──────────────────────────
  if (data.method === 'ONLINE_PAYMENT') {
    // Convert amount to smallest currency unit (paisa / cent)
    const amountInSmallestUnit = Math.round(data.amount * 100);

    // Create a Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency,
      metadata: {
        userId,
        bookingId: data.bookingId ?? '',
        notes: data.notes ?? '',
      },
      automatic_payment_methods: { enabled: true },
    });

    // Create a PENDING payment record
    const payment = await prisma.payment.create({
      data: {
        ...data,
        userId,
        status: 'PENDING',
        method: data.method as any,
        transactionId: paymentIntent.id,
      },
      include: {
        booking: { select: { bookingNumber: true, totalAmount: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return {
      payment,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  // ── CASH / CARD / BANK / MOBILE ───────────────────────
  const payment = await prisma.payment.create({
    data: {
      ...data,
      userId,
      status: 'COMPLETED',
      paidAt: new Date(),
      method: data.method as any,
    },
    include: {
      booking: { select: { bookingNumber: true, totalAmount: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  await createInvoiceForPayment(payment.id, data.amount, data.bookingId);

  const user = payment.user as any;
  if (user?.email) {
    sendEmail({
      to: user.email,
      subject: 'Payment Receipt',
      html: emailTemplates.paymentReceived(
        `${user.firstName} ${user.lastName}`,
        Number(data.amount),
        data.currency || 'BDT',
        payment.transactionId || payment.id,
      ),
    }).catch((e) => logger.error('Payment receipt email error:', e));
  }

  return { payment };
};

// ── Confirm Online Payment (called after Stripe confirms) ─
const confirmOnlinePayment = async (paymentIntentId: string) => {
  // Verify with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new BadRequestError(`Payment not succeeded. Current status: ${paymentIntent.status}`);
  }

  const payment = await prisma.payment.findFirst({
    where: { transactionId: paymentIntentId },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  if (!payment) throw new NotFoundError('Payment record not found');
  if (payment.status === 'COMPLETED') return { payment, message: 'Already confirmed' };

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'COMPLETED', paidAt: new Date() },
    include: {
      booking: { select: { bookingNumber: true, totalAmount: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  await createInvoiceForPayment(payment.id, Number(payment.amount), payment.bookingId ?? undefined);

  const user = payment.user as any;
  if (user?.email) {
    sendEmail({
      to: user.email,
      subject: 'Payment Receipt',
      html: emailTemplates.paymentReceived(
        `${user.firstName} ${user.lastName}`,
        Number(payment.amount),
        payment.currency || 'BDT',
        paymentIntentId,
      ),
    }).catch((e) => logger.error('Payment receipt email error:', e));
  }

  return { payment: updated };
};

// ── Stripe Webhook Handler ────────────────────────────────
const handleStripeWebhook = async (rawBody: Buffer, signature: string, webhookSecret: string) => {
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    throw new BadRequestError(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      await prisma.payment.updateMany({
        where: { transactionId: pi.id, status: 'PENDING' },
        data: { status: 'COMPLETED', paidAt: new Date() },
      });
      logger.info(`Stripe webhook: payment_intent.succeeded for ${pi.id}`);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await prisma.payment.updateMany({
        where: { transactionId: pi.id, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      logger.info(`Stripe webhook: payment_intent.payment_failed for ${pi.id}`);
      break;
    }
    default:
      logger.info(`Stripe webhook: unhandled event type ${event.type}`);
  }

  return { received: true };
};

// ── Get All Payments ──────────────────────────────────────
const getAllPayments = async (
  query: {
    page?: string; limit?: string; status?: string;
    bookingId?: string; method?: string; fromDate?: string; toDate?: string;
  },
  role: string,
  userId: string,
) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.PaymentWhereInput = {
    ...(role === 'CUSTOMER' && { userId }),
    ...(query.status && { status: query.status as PaymentStatus }),
    ...(query.bookingId && { bookingId: query.bookingId }),
    ...(query.method && { method: query.method as any }),
    ...(query.fromDate && { createdAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { createdAt: { lte: new Date(query.toDate) } }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        booking: { select: { bookingNumber: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, meta: getPaginationMeta(total, page, limit) };
};

// ── Get Payment By ID ─────────────────────────────────────
const getPaymentById = async (id: string, role: string, userId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      booking: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      invoice: { include: { items: true } },
    },
  });
  if (!payment) throw new NotFoundError('Payment not found');
  if (role === 'CUSTOMER' && payment.userId !== userId) throw new ForbiddenError('Access denied');
  return payment;
};

// ── Process Refund ────────────────────────────────────────
const processRefund = async (paymentId: string, refundAmount: number, refundReason: string) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status !== 'COMPLETED') throw new BadRequestError('Only completed payments can be refunded');
  if (refundAmount > Number(payment.amount)) throw new BadRequestError('Refund amount cannot exceed payment amount');

  // Stripe refund for online payments
  if (payment.method === 'ONLINE_PAYMENT' && payment.transactionId) {
    const refundAmountInSmallestUnit = Math.round(refundAmount * 100);
    await stripe.refunds.create({
      payment_intent: payment.transactionId,
      amount: refundAmountInSmallestUnit,
      reason: 'requested_by_customer',
    });
  }

  const status: PaymentStatus =
    refundAmount === Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

  return prisma.payment.update({
    where: { id: paymentId },
    data: { status, refundAmount, refundReason, refundedAt: new Date() },
  });
};

// ── Get Payment Stats ─────────────────────────────────────
const getPaymentStats = async () => {
  const [total, byMethod, revenue, todayRevenue, pendingCount] = await Promise.all([
    prisma.payment.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      _count: true,
      where: { status: 'COMPLETED' },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    total,
    byMethod,
    totalRevenue: revenue._sum.amount ?? 0,
    todayRevenue: todayRevenue._sum.amount ?? 0,
    pendingCount,
  };
};

// ── Private helper: create invoice ───────────────────────
const createInvoiceForPayment = async (paymentId: string, amount: number, bookingId?: string) => {
const taxRate = 15;
const subtotal = amount / 1.15;
const taxAmount = amount - subtotal;

await prisma.invoice.create({
  data: {
    invoiceNumber: `INV-${Date.now()}`,
    paymentId,
    status: 'ISSUED',
    subtotal,
    taxRate,
    taxAmount,
    totalAmount: amount,
    items: {
      create: [{
        description: bookingId ? 'Room Booking Payment' : 'Hotel Service Payment',
        quantity: 1,
        unitPrice: amount,
        totalPrice: amount,
      }],
    },
  },
});
};

export const paymentService = {
  createPayment,
  confirmOnlinePayment,
  handleStripeWebhook,
  getAllPayments,
  getPaymentById,
  processRefund,
  getPaymentStats,
};
