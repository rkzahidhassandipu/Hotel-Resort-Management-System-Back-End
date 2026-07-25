import { z } from 'zod';

const paymentMethods = [
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'ONLINE_PAYMENT',
  'MOBILE_BANKING',
  'CRYPTO',
] as const;

const paymentStatuses = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;

// Create Payment Schema
export const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid('Invalid booking ID').optional(),

    amount: z
      .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number',
      })
      .positive('Amount must be greater than 0'),

    method: z.enum(paymentMethods, {
      required_error: 'Payment method is required',
    }),

    currency: z
      .string()
      .trim()
      .min(3)
      .max(5)
      .default('BDT'),

    transactionId: z.string().trim().optional(),

    notes: z
      .string()
      .trim()
      .max(500, 'Notes cannot exceed 500 characters')
      .optional(),
  }),
});

// Confirm Payment Schema
export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z
      .string()
      .trim()
      .min(1, 'paymentIntentId is required'),
  }),
});

// Refund Schema
export const refundSchema = z.object({
  body: z.object({
    refundAmount: z
      .number({
        required_error: 'Refund amount is required',
      })
      .positive('Refund amount must be greater than 0'),

    refundReason: z
      .string()
      .trim()
      .min(3, 'Refund reason must be at least 3 characters')
      .max(500, 'Refund reason cannot exceed 500 characters'),
  }),
});

// Payment Query Schema
export const paymentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().optional(),

    limit: z.coerce.number().positive().optional(),

    status: z.enum(paymentStatuses).optional(),

    bookingId: z.string().uuid().optional(),

    method: z.enum(paymentMethods).optional(),

    fromDate: z.string().datetime().optional(),

    toDate: z.string().datetime().optional(),
  }),
});