import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().cuid().optional(),
    amount: z.number().positive(),
    method: z.enum([
      'CASH', 'CREDIT_CARD', 'DEBIT_CARD',
      'BANK_TRANSFER', 'ONLINE_PAYMENT', 'MOBILE_BANKING', 'CRYPTO',
    ]),
    currency: z.string().default('BDT'),
    transactionId: z.string().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1, 'paymentIntentId is required'),
  }),
});

export const refundSchema = z.object({
  body: z.object({
    refundAmount: z.number().positive(),
    refundReason: z.string().min(3).max(500),
  }),
});

export const paymentQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']).optional(),
    bookingId: z.string().optional(),
    method: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});
