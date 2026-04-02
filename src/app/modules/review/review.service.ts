import { Prisma, ReviewStatus } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

// ── Review Service ───────────────────────────────────────

const create = async (userId: string, data: any) => {
  return prisma.review.create({
    data: { ...data, userId },
  });
};

const getAll = async (query: {
  page?: string;
  limit?: string;
  status?: string;
  minRating?: string;
  maxRating?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.ReviewWhereInput = {
    ...(query.status ? { status: query.status as any } : { status: 'APPROVED' }),
    ...(query.minRating && { overallRating: { gte: parseFloat(query.minRating) } }),
    ...(query.maxRating && { overallRating: { lte: parseFloat(query.maxRating) } }),
    ...(query.fromDate && { createdAt: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { createdAt: { lte: new Date(query.toDate) } }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
      skip,
      take: limit,
      orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
    }),
    prisma.review.count({ where }),
  ]);

  const sanitized = reviews.map(r => ({
    ...r,
    user: r.isAnonymous ? null : r.user,
  }));

  return { reviews: sanitized, meta: getPaginationMeta(total, page, limit) };
};

const getById = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      booking: { select: { bookingNumber: true, room: { select: { roomNumber: true, type: true } } } },
    },
  });
  if (!review) throw new NotFoundError('Review not found');
  return review;
};

const getMyReviews = async (userId: string) => {
  return prisma.review.findMany({
    where: { userId },
    include: {
      booking: { select: { bookingNumber: true, room: { select: { roomNumber: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// review.service.ts
const moderate = async (
  id: string,
  status: string,
  managerResponse: string | null,
  respondedById: string
) => {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new NotFoundError('Review not found');

  // Validate status against enum
  if (!Object.values(ReviewStatus).includes(status as ReviewStatus)) {
    throw new BadRequestError('Invalid review status');
  }

  return prisma.review.update({
    where: { id },
    data: {
      status: status as ReviewStatus,
      managerResponse,
      respondedById,
      respondedAt: new Date(),
    },
  });
};

const respondToReview = async (id: string, managerResponse: string, respondedById: string) => {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new NotFoundError('Review not found');
  if (review.status !== 'APPROVED') {
    throw new BadRequestError('Can only respond to approved reviews');
  }

  return prisma.review.update({
    where: { id },
    data: { managerResponse, respondedAt: new Date(), respondedById },
  });
};

const deleteReview = async (id: string, userId: string, role: string) => {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new NotFoundError('Review not found');
  if (role === 'CUSTOMER' && review.userId !== userId) {
    throw new ForbiddenError('Access denied');
  }
  await prisma.review.delete({ where: { id } });
};

const getStats = async () => {
  const [avgRatings, totalByStatus, ratingDistribution] = await Promise.all([
    prisma.review.aggregate({
      where: { status: 'APPROVED' },
      _avg: {
        overallRating: true,
        cleanlinessRating: true,
        serviceRating: true,
        foodRating: true,
        locationRating: true,
        valueRating: true,
      },
      _count: true,
    }),
    prisma.review.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.review.groupBy({
      by: ['overallRating' as any],
      _count: true,
      where: { status: 'APPROVED' },
    }),
  ]);

  return {
    averageRatings: avgRatings._avg,
    totalApproved: avgRatings._count,
    byStatus: totalByStatus,
    ratingDistribution,
  };
};

// ── Export ──────────────────────────────────────────────
export const reviewService = {
  create,
  getAll,
  getById,
  getMyReviews,
  moderate,
  respondToReview,
  deleteReview,
  getStats,
};