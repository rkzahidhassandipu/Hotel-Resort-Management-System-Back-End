import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { sendEmail } from '../../utils/email';
import { NotFoundError, BadRequestError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';
import { logger } from '../../utils/logger';

// ── Visitor Registration ──────────────────────────────────

const registerVisitor = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  purpose?: string;
  notes?: string;
}) => {
  return prisma.visitorRegistration.create({ data });
};

const getAllVisitors = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  convertedToCustomer?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.VisitorRegistrationWhereInput = {
    ...(query.convertedToCustomer !== undefined && {
      convertedToCustomer: query.convertedToCustomer === 'true',
    }),
    ...(query.fromDate && { visitedAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { visitedAt: { lte: new Date(query.toDate) } }),
    ...(query.search && {
      OR: [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [visitors, total] = await Promise.all([
    prisma.visitorRegistration.findMany({
      where,
      skip,
      take: limit,
      orderBy: { visitedAt: 'desc' },
    }),
    prisma.visitorRegistration.count({ where }),
  ]);

  return { visitors, meta: getPaginationMeta(total, page, limit) };
};

const getVisitorById = async (id: string) => {
  const visitor = await prisma.visitorRegistration.findUnique({ where: { id } });
  if (!visitor) throw new NotFoundError('Visitor not found');
  return visitor;
};

const convertToCustomer = async (visitorId: string) => {
  const visitor = await prisma.visitorRegistration.findUnique({ where: { id: visitorId } });
  if (!visitor) throw new NotFoundError('Visitor not found');
  if (visitor.convertedToCustomer) throw new BadRequestError('Visitor already converted');

  const existing = await prisma.user.findUnique({ where: { email: visitor.email } });
  if (existing) {
    await prisma.visitorRegistration.update({
      where: { id: visitorId },
      data: { convertedToCustomer: true, convertedUserId: existing.id },
    });
    return { message: 'Linked to existing account', userId: existing.id };
  }

  const { hashPassword } = await import('../../utils/hash');
  const tempPassword = Math.random().toString(36).slice(-8);
  const password = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      email: visitor.email,
      phone: visitor.phone,
      password,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      customerProfile: { create: {} },
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  await prisma.visitorRegistration.update({
    where: { id: visitorId },
    data: { convertedToCustomer: true, convertedUserId: user.id },
  });

  const { config } = await import('../../config/env');
  sendEmail({
    to: user.email,
    subject: 'Welcome to Our Hotel — Your Account is Ready',
    html: `
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>We have created an account for you.</p>
      <p><strong>Email:</strong> ${user.email}<br>
      <strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>Please login and change your password: <a href="${config.frontend.url}/login">Login</a></p>
    `,
  }).catch((e) => logger.error('Convert visitor email error:', e));

  return { message: 'Customer account created', userId: user.id };
};

// ── Room Inquiry ──────────────────────────────────

const createInquiry = async (data: {
  name: string;
  email: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  roomType?: string;
  budget?: number;
  message?: string;
}) => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  if (checkIn >= checkOut) throw new BadRequestError('Check-out must be after check-in');

  const inquiry = await prisma.roomInquiry.create({
    data: { ...data, checkIn, checkOut, roomType: data.roomType as any },
  });

  const { config } = await import('../../config/env');
  sendEmail({
    to: config.smtp.fromEmail,
    subject: `New Room Inquiry from ${data.name}`,
    html: `
      <h2>New Room Inquiry</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Phone:</strong> ${data.phone ?? 'N/A'}</p>
      <p><strong>Check-in:</strong> ${checkIn.toLocaleDateString()}</p>
      <p><strong>Check-out:</strong> ${checkOut.toLocaleDateString()}</p>
      <p><strong>Adults:</strong> ${data.adults ?? 1}, <strong>Children:</strong> ${data.children ?? 0}</p>
      <p><strong>Room Type:</strong> ${data.roomType ?? 'Any'}</p>
      <p><strong>Budget:</strong> ${data.budget ? `BDT ${data.budget}` : 'Not specified'}</p>
      <p><strong>Message:</strong> ${data.message ?? 'N/A'}</p>
    `,
  }).catch((e) => logger.error('Inquiry notification error:', e));

  return inquiry;
};

const getAllInquiries = async (query: {
  page?: string;
  limit?: string;
  isResolved?: string;
  fromDate?: string;
  toDate?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.RoomInquiryWhereInput = {
    ...(query.isResolved !== undefined && { isResolved: query.isResolved === 'true' }),
    ...(query.fromDate && { createdAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { createdAt: { lte: new Date(query.toDate) } }),
  };

  const [inquiries, total] = await Promise.all([
    prisma.roomInquiry.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.roomInquiry.count({ where }),
  ]);

  return { inquiries, meta: getPaginationMeta(total, page, limit) };
};

const getInquiryById = async (id: string) => {
  const inquiry = await prisma.roomInquiry.findUnique({ where: { id } });
  if (!inquiry) throw new NotFoundError('Inquiry not found');
  return inquiry;
};

const resolveInquiry = async (id: string, resolvedById: string, notes?: string) => {
  const inquiry = await prisma.roomInquiry.findUnique({ where: { id } });
  if (!inquiry) throw new NotFoundError('Inquiry not found');
  if (inquiry.isResolved) throw new BadRequestError('Inquiry already resolved');

  return prisma.roomInquiry.update({
    where: { id },
    data: { isResolved: true, resolvedById, resolvedAt: new Date(), notes },
  });
};

const deleteInquiry = async (id: string) => {
  const inquiry = await prisma.roomInquiry.findUnique({ where: { id } });
  if (!inquiry) throw new NotFoundError('Inquiry not found');
  await prisma.roomInquiry.delete({ where: { id } });
};

// ── Hotel Info ──────────────────────────────────

const getHotelInfo = async (publicOnly = true) =>
  prisma.hotelInfo.findMany({
    where: publicOnly ? { isPublic: true } : undefined,
    orderBy: { key: 'asc' },
  });

const getHotelInfoByKey = async (key: string) => {
  const info = await prisma.hotelInfo.findUnique({ where: { key } });
  if (!info) throw new NotFoundError('Hotel info not found');
  return info;
};

const upsertHotelInfo = async (data: {
  key: string;
  value: string;
  description?: string;
  isPublic?: boolean;
}) =>
  prisma.hotelInfo.upsert({
    where: { key: data.key },
    create: data,
    update: { value: data.value, description: data.description, isPublic: data.isPublic },
  });

const deleteHotelInfo = async (key: string) => {
  const info = await prisma.hotelInfo.findUnique({ where: { key } });
  if (!info) throw new NotFoundError('Hotel info not found');
  await prisma.hotelInfo.delete({ where: { key } });
};

// ── Stats ──────────────────────────────────

const getGuestStats = async () => {
  const [totalVisitors, convertedVisitors, totalInquiries, unresolvedInquiries] = await Promise.all([
    prisma.visitorRegistration.count(),
    prisma.visitorRegistration.count({ where: { convertedToCustomer: true } }),
    prisma.roomInquiry.count(),
    prisma.roomInquiry.count({ where: { isResolved: false } }),
  ]);

  return {
    visitors: {
      total: totalVisitors,
      converted: convertedVisitors,
      conversionRate: totalVisitors
        ? ((convertedVisitors / totalVisitors) * 100).toFixed(1) + '%'
        : '0%',
    },
    inquiries: { total: totalInquiries, unresolved: unresolvedInquiries },
  };
};

export const guestService = {
  registerVisitor,
  getAllVisitors,
  getVisitorById,
  convertToCustomer,
  createInquiry,
  getAllInquiries,
  getInquiryById,
  resolveInquiry,
  deleteInquiry,
  getHotelInfo,
  getHotelInfoByKey,
  upsertHotelInfo,
  deleteHotelInfo,
  getGuestStats,
};