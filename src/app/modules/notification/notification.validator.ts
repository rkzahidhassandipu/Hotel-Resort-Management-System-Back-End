import { z } from 'zod';

// ── Create Notification ───────────────────────────────────
export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().cuid(),
    type: z.enum([
      'BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION',
      'CHECK_IN_REMINDER', 'CHECK_OUT_REMINDER',
      'PAYMENT_RECEIVED', 'PAYMENT_DUE',
      'MAINTENANCE_UPDATE', 'SERVICE_UPDATE',
      'GENERAL_ALERT', 'SYSTEM_ALERT',
    ]),
    channel: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']).default('IN_APP'),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    data: z.record(z.unknown()).optional(),
  }),
});

// ── Broadcast Notification ────────────────────────────────
export const broadcastNotificationSchema = z.object({
  body: z.object({
    roles: z.array(z.enum(['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER', 'MAINTENANCE', 'CHEF'])).optional(),
    userIds: z.array(z.string().cuid()).optional(),
    type: z.enum([
      'BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION',
      'CHECK_IN_REMINDER', 'CHECK_OUT_REMINDER',
      'PAYMENT_RECEIVED', 'PAYMENT_DUE',
      'MAINTENANCE_UPDATE', 'SERVICE_UPDATE',
      'GENERAL_ALERT', 'SYSTEM_ALERT',
    ]),
    channel: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']).default('IN_APP'),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    data: z.record(z.unknown()).optional(),
  }).refine((d) => (d.roles?.length || d.userIds?.length), {
    message: 'At least one of roles or userIds must be provided',
  }),
});

// ── Create Template ───────────────────────────────────────
export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    type: z.enum([
      'BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION',
      'CHECK_IN_REMINDER', 'CHECK_OUT_REMINDER',
      'PAYMENT_RECEIVED', 'PAYMENT_DUE',
      'MAINTENANCE_UPDATE', 'SERVICE_UPDATE',
      'GENERAL_ALERT', 'SYSTEM_ALERT',
    ]),
    channel: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']),
    subject: z.string().optional(),
    bodyTemplate: z.string().min(1),
    isActive: z.boolean().optional(),
  }),
});

// ── Query ─────────────────────────────────────────────────
export const notificationQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isRead: z.enum(['true', 'false']).optional(),
    type: z.string().optional(),
    channel: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']).optional(),
  }),
});
