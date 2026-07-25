// src/modules/notification/notification.service.ts
import { NotFoundError } from "@/app/errorHelpers/AppError";
import {
  Prisma,
  NotificationType,
  NotificationChannel,
  Role,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../utils/email";
import { getPaginationParams, getPaginationMeta } from "../../utils/helpers";
import { logger } from "../../utils/logger";
import { ValidationError } from "@/app/errorHelpers/ValidationError";

// ── Template Rendering Helper ──────────────────────────────

const renderTemplate = (
  template: string,
  variables: Record<string, unknown> = {},
) => {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) =>
    variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`,
  );
};

const resolveContent = async (input: {
  templateId?: string;
  type: NotificationType;
  channel?: NotificationChannel;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
}) => {
  if (!input.templateId) {
    if (!input.title || !input.message) {
      throw new ValidationError(
        "title and message are required when templateId is not provided",
      );
    }
    return {
      type: input.type,
      channel: input.channel ?? ("IN_APP" as NotificationChannel),
      title: input.title,
      message: input.message,
    };
  }

  const template = await prisma.notificationTemplate.findUnique({
    where: { id: input.templateId },
  });
  if (!template) throw new NotFoundError("Template not found");
  if (!template.isActive) throw new ValidationError("Template is not active");

  const vars = input.data ?? {};

  return {
    type: template.type,
    channel: input.channel ?? template.channel,
    title: input.title ?? renderTemplate(template.subject ?? "", vars),
    message: input.message ?? renderTemplate(template.bodyTemplate, vars),
  };
};

// ── Create Single Notification ────────────────────────────

const create = async (data: {
  userId: string;
  templateId?: string;
  type: NotificationType;
  channel?: NotificationChannel;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
}) => {
  const resolved = await resolveContent(data);

  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: resolved.type,
      channel: resolved.channel,
      title: resolved.title,
      message: resolved.message,
      data: data.data as Prisma.InputJsonValue, // 👈 cast here
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  // Fire-and-forget delivery
  deliver(notification).catch((e) =>
    logger.error("Notification delivery failed:", e),
  );

  return notification;
};

// Internal delivery helper
const deliver = async (notification: any) => {
  if (notification.channel === "EMAIL") {
    if (notification.user?.email) {
      await sendEmail({
        to: notification.user.email,
        subject: notification.title,
        html: `<p>Dear ${notification.user.firstName} ${notification.user.lastName},</p><p>${notification.message}</p>`,
      });
    }
  }
};

// ── Broadcast Notifications ───────────────────────────────

const broadcast = async (data: {
  roles?: Role[];
  userIds?: string[];
  templateId?: string;
  type: NotificationType;
  channel?: NotificationChannel;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
}) => {
  const resolved = await resolveContent(data);

  const userIds: string[] = [...(data.userIds ?? [])];

  if (data.roles?.length) {
    const users = await prisma.user.findMany({
      where: { role: { in: data.roles }, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    userIds.push(...users.map((u) => u.id));
  }

  const uniqueIds = [...new Set(userIds)];
  if (!uniqueIds.length) return { sent: 0 };

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      type: resolved.type,
      channel: resolved.channel,
      title: resolved.title,
      message: resolved.message,
      data: data.data as Prisma.InputJsonValue,
    })),
  });

  // For email broadcasts, deliver individually
  if (resolved.channel === "EMAIL") {
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { email: true, firstName: true, lastName: true },
    });

    for (const user of users) {
      sendEmail({
        to: user.email,
        subject: resolved.title,
        html: `<p>Dear ${user.firstName} ${user.lastName},</p><p>${resolved.message}</p>`,
      }).catch((e) => logger.error("Broadcast email error:", e));
    }
  }

  return { sent: uniqueIds.length };
};

// ── User Notifications ────────────────────────────────────

const getMyNotifications = async (
  userId: string,
  query?: { page?: string; limit?: string },
) => {
  const { page, limit, skip } = getPaginationParams(query ?? {});
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { notifications, meta: getPaginationMeta(total, page, limit) };
};

const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new NotFoundError("Notification not found");

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
};

const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { updated: result.count };
};

const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new NotFoundError("Notification not found");
  await prisma.notification.delete({ where: { id: notificationId } });
};

const clearReadNotifications = async (userId: string) => {
  const result = await prisma.notification.deleteMany({
    where: { userId, isRead: true },
  });
  return { deleted: result.count };
};

const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { unreadCount: count };
};

// ── Templates ─────────────────────────────────────────────

const createTemplate = async (data: {
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  bodyTemplate: string;
  isActive?: boolean;
}) => {
  return prisma.notificationTemplate.create({ data });
};

const getTemplates = async () => {
  return prisma.notificationTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
};

const updateTemplate = async (
  id: string,
  data: {
    name?: string;
    type?: NotificationType;
    channel?: NotificationChannel;
    subject?: string;
    bodyTemplate?: string;
    isActive?: boolean;
  },
) => {
  const template = await prisma.notificationTemplate.findUnique({
    where: { id },
  });
  if (!template) throw new NotFoundError("Template not found");
  return prisma.notificationTemplate.update({ where: { id }, data });
};

const deleteTemplate = async (id: string) => {
  const template = await prisma.notificationTemplate.findUnique({
    where: { id },
  });
  if (!template) throw new NotFoundError("Template not found");
  await prisma.notificationTemplate.delete({ where: { id } });
};

// ── Stats ─────────────────────────────────────────────────

const getStats = async () => {
  const [total, unread, byType, byChannel] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.notification.groupBy({
      by: ["type"],
      _count: { type: true },
    }),
    prisma.notification.groupBy({
      by: ["channel"],
      _count: { channel: true },
    }),
  ]);

  return { total, unread, byType, byChannel };
};

export const notificationService = {
  create,
  broadcast,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadCount,
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
  getStats,
};
