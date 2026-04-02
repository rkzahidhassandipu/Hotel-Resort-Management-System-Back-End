import { z } from 'zod';

// ── Validators ────────────────────────────────────────────
export const systemLogQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    userId: z.string().optional(),
    action: z.enum(['CREATE','READ','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','IMPORT','OVERRIDE']).optional(),
    level: z.enum(['INFO','WARNING','ERROR','CRITICAL','DEBUG']).optional(),
    resource: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export const errorLogQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    level: z.enum(['INFO','WARNING','ERROR','CRITICAL','DEBUG']).optional(),
    isResolved: z.enum(['true','false']).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export const resolveErrorSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
});

export const auditQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    userId: z.string().optional(),
    tableName: z.string().optional(),
    recordId: z.string().optional(),
    action: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});
