import { Prisma, BookingStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { sendEmail, emailTemplates } from "../../utils/email";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../errorHelpers/AppError";
import { getPaginationParams, getPaginationMeta } from "../../utils/helpers";
import { logger } from "../../utils/logger";
import { paymentService } from "../payment/payment.service";

const BOOKING_SELECT = {
  id: true,
  bookingNumber: true,
  status: true,
  checkInDate: true,
  checkOutDate: true,
  actualCheckIn: true,
  actualCheckOut: true,
  nights: true,
  adults: true,
  children: true,
  pricePerNight: true,
  subtotal: true,
  taxAmount: true,
  discountAmount: true,
  totalAmount: true,
  specialRequests: true,
  arrivalTime: true,
  source: true,
  promoCode: true,
  cancellationReason: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  room: {
    select: {
      id: true,
      roomNumber: true,
      type: true,
      floor: true,
      category: { select: { name: true, basePrice: true } },
    },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
  guests: true,
  payments: {
    select: {
      id: true,
      amount: true,
      status: true,
      method: true,
      paidAt: true,
    },
  },
  // ✅ add
  reviews: {
    select: {
      id: true,
      overallRating: true,
      title: true,
      comment: true,
      isAnonymous: true,
    },
    take: 1,
  },
  _count: { select: { reviews: true } },
};

const TAX_RATE = 0.15;

// ── Create Booking ─────────────────────────────────────────────────────────────
// Booking create hobe PENDING status e — room reserve hobe na payment er age

const createBooking = async (data: {
  customerId: string;
  roomId: string;
  createdById?: string;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
  specialRequests?: string;
  arrivalTime?: string;
  source?: string;
  promoCode?: string;
  guests?: Array<{
    firstName: string;
    lastName: string;
    nationalId?: string;
    passportNo?: string;
    age?: number;
    isPrimary?: boolean;
  }>;
}) => {
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);

  if (checkIn >= checkOut)
    throw new BadRequestError("Check-out must be after check-in");

  const room = await prisma.room.findUnique({
    where: { id: data.roomId, isActive: true },
    include: {
      category: true,
      pricingRules: {
        where: { startDate: { lte: checkOut }, endDate: { gte: checkIn } },
      },
    },
  });
  if (!room) throw new NotFoundError("Room not found");
  if (room.status !== "AVAILABLE")
    throw new BadRequestError(`Room is currently ${room.status}`);

  const conflict = await prisma.booking.findFirst({
    where: {
      roomId: data.roomId,
      status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      OR: [{ checkInDate: { lt: checkOut }, checkOutDate: { gt: checkIn } }],
    },
  });
  if (conflict)
    throw new BadRequestError("Room is already booked for these dates");

  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isWeekend = checkIn.getDay() === 0 || checkIn.getDay() === 6;

  const specialRule = room.pricingRules[0];
  const basePrice = specialRule
    ? Number(specialRule.pricePerNight)
    : isWeekend && room.category.weekendPrice
      ? Number(room.category.weekendPrice)
      : Number(room.category.basePrice);

  const subtotal = basePrice * nights;
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount;

  // ✅ Booking create — status PENDING, room/stats untouched
  const booking = await prisma.booking.create({
    data: {
      customerId: data.customerId,
      roomId: data.roomId,
      createdById: data.createdById,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights,
      adults: data.adults ?? 1,
      children: data.children ?? 0,
      pricePerNight: basePrice,
      subtotal,
      taxAmount,
      totalAmount,
      status: "PENDING",
      specialRequests: data.specialRequests,
      arrivalTime: data.arrivalTime,
      source: data.source ?? "DIRECT",
      promoCode: data.promoCode,
      guests: data.guests?.length
        ? { createMany: { data: data.guests } }
        : undefined,
    },
    select: BOOKING_SELECT,
  });

  return booking;
};

const getMyBookings = async (customerId: string) => {
  const bookings = await prisma.booking.findMany({
  where: { customerId },
  include: {
    room: { select: { roomNumber: true, type: true, floor: true } },
    payments: { select: { id: true, status: true, amount: true } },

    reviews: {
      select: {
        id: true,
        overallRating: true,
        title: true,
        comment: true,
        createdAt: true,
      },
    },
  },
  orderBy: { createdAt: "desc" },
});

  return bookings.map((b) => ({
    ...b,
    hasReview: b.reviews.length > 0,
  }));
};

// ── Confirm Booking (payment success webhook/callback e call hobe) ─────────────

const confirmBooking = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.status !== "PENDING")
    throw new BadRequestError("Only pending bookings can be confirmed");

  // ✅ Payment completed ache kina check koro
  const completedPayment = await prisma.payment.findFirst({
    where: { bookingId, status: "COMPLETED" },
  });
  console.log("payment:", completedPayment);
  if (!completedPayment)
    throw new BadRequestError("Payment not completed for this booking");

  // ✅ Re-check conflict — payment er modhye onyo keu book kore feleche kina
  const conflict = await prisma.booking.findFirst({
    where: {
      id: { not: bookingId },
      roomId: booking.roomId,
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      OR: [
        {
          checkInDate: { lt: booking.checkOutDate },
          checkOutDate: { gt: booking.checkInDate },
        },
      ],
    },
  });
  if (conflict) {
    // Room ar available na — booking cancel kore refund trigger koro
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: "Room no longer available",
        cancelledAt: new Date(),
      },
    });
    await paymentService.processRefund(
      completedPayment.id,
      Number(completedPayment.amount),
      "Room no longer available after payment",
    );
    throw new BadRequestError(
      "Room is no longer available. Refund has been initiated.",
    );
  }

  // ✅ Atomic: booking CONFIRMED + room RESERVED + totalStays increment
  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
      select: BOOKING_SELECT,
    }),
    prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "RESERVED" },
    }),
    prisma.customerProfile.updateMany({
      where: { userId: booking.customerId },
      data: { totalStays: { increment: 1 } },
    }),
  ]);

  // Confirmation email
  const customer = await prisma.user.findUnique({
    where: { id: booking.customerId },
  });
  if (customer) {
    sendEmail({
      to: customer.email,
      subject: "Booking Confirmation",
      html: emailTemplates.bookingConfirmation(
        `${customer.firstName} ${customer.lastName}`,
        {
          bookingNumber: updated.bookingNumber,
          roomNumber: (updated.room as any).roomNumber,
          checkIn: booking.checkInDate.toLocaleDateString(),
          checkOut: booking.checkOutDate.toLocaleDateString(),
          nights: booking.nights,
          total: Number(booking.totalAmount),
          currency: "BDT",
        },
      ),
    }).catch((e) => logger.error("Booking confirmation email failed:", e));
  }

  return updated;
};

// ── Check In ───────────────────────────────────────────────────────────────────

const checkIn = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.status !== "CONFIRMED")
    throw new BadRequestError("Only confirmed bookings can check in");

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_IN", actualCheckIn: new Date() },
      select: BOOKING_SELECT,
    }),
    prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "OCCUPIED" },
    }),
  ]);

  return updated;
};

// ── Check Out ──────────────────────────────────────────────────────────────────

const checkOut = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.status !== "CHECKED_IN")
    throw new BadRequestError("Guest is not checked in");

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CHECKED_OUT", actualCheckOut: new Date() },
      select: BOOKING_SELECT,
    }),
    prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "CLEANING" },
    }),
    prisma.customerProfile.updateMany({
      where: { userId: booking.customerId },
      data: { totalSpent: { increment: Number(booking.totalAmount) } },
    }),
  ]);

  return updated;
};

// ── Cancel Booking ─────────────────────────────────────────────────────────────

const cancelBooking = async (
  bookingId: string,
  reason: string,
  requestorRole: string,
  requestorId: string,
) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError("Booking not found");

  if (requestorRole === "CUSTOMER" && booking.customerId !== requestorId) {
    throw new ForbiddenError("Access denied");
  }

  if (["CHECKED_IN", "CHECKED_OUT", "CANCELLED"].includes(booking.status)) {
    throw new BadRequestError(
      `Cannot cancel booking with status: ${booking.status}`,
    );
  }

  // ✅ PENDING booking — room kono din RESERVED hoyni, so room update lagbe na
  // CONFIRMED booking — room RESERVED ache, AVAILABLE e return korte hobe
  const wasConfirmed = booking.status === "CONFIRMED";

  const transactionOps: any[] = [
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      select: BOOKING_SELECT,
    }),
  ];

  if (wasConfirmed) {
    transactionOps.push(
      prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "AVAILABLE" },
      }),
      prisma.customerProfile.updateMany({
        where: { userId: booking.customerId },
        data: { totalStays: { decrement: 1 } },
      }),
    );
  }

  const [updated] = await prisma.$transaction(transactionOps);

  // Auto refund if completed payment exists
  const completedPayment = await prisma.payment.findFirst({
    where: { bookingId, status: "COMPLETED" },
  });
  if (completedPayment) {
    await paymentService.processRefund(
      completedPayment.id,
      Number(completedPayment.amount),
      reason || "Booking cancelled",
    );
  }

  // Notify customer
  const customer = await prisma.user.findUnique({
    where: { id: booking.customerId },
  });
  if (customer) {
    sendEmail({
      to: customer.email,
      subject: "Booking Cancellation",
      html: emailTemplates.bookingCancellation(
        `${customer.firstName} ${customer.lastName}`,
        booking.bookingNumber,
        reason,
      ),
    }).catch((e) => logger.error("Cancel email failed:", e));
  }

  return updated;
};

// ── Get All Bookings ───────────────────────────────────────────────────────────

const getAllBookings = async (
  query: {
    page?: string;
    limit?: string;
    search?: string;
    status?: BookingStatus;
    customerId?: string;
    roomId?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  requestorRole: string,
  requestorId: string,
) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.BookingWhereInput = {
    ...(query.status && { status: query.status }),
    ...(query.roomId && { roomId: query.roomId }),
    ...(query.fromDate && { checkInDate: { gte: new Date(query.fromDate) } }),
    ...(query.toDate && { checkOutDate: { lte: new Date(query.toDate) } }),
    ...(requestorRole === "CUSTOMER" && { customerId: requestorId }),
    ...(query.customerId &&
      requestorRole !== "CUSTOMER" && { customerId: query.customerId }),
    ...(query.search && {
      OR: [
        { bookingNumber: { contains: query.search, mode: "insensitive" } },
        {
          customer: {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          },
        },
        {
          room: { roomNumber: { contains: query.search, mode: "insensitive" } },
        },
      ],
    }),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      select: BOOKING_SELECT,
      skip,
      take: limit,
      orderBy: { [query.sortBy || "createdAt"]: query.sortOrder || "desc" },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, meta: getPaginationMeta(total, page, limit) };
};

// ── Get Booking By ID ──────────────────────────────────────────────────────────

const getBookingById = async (
  id: string,
  requestorRole: string,
  requestorId: string,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: BOOKING_SELECT,
  });
  if (!booking) throw new NotFoundError("Booking not found");

  if (
    requestorRole === "CUSTOMER" &&
    (booking.customer as any).id !== requestorId
  ) {
    throw new ForbiddenError("Access denied");
  }

  return booking;
};

// ── Booking Stats ──────────────────────────────────────────────────────────────

const getBookingStats = async (fromDate?: string, toDate?: string) => {
  const where: Prisma.BookingWhereInput = {
    ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
    ...(toDate && { createdAt: { lte: new Date(toDate) } }),
  };

  const [total, byStatus, revenue, upcomingCheckIns, upcomingCheckOuts] =
    await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by: ["status"],
        _count: { status: true },
        where,
      }),
      prisma.booking.aggregate({
        where: {
          ...where,
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true, nights: true },
      }),
      prisma.booking.count({
        where: {
          status: "CONFIRMED",
          checkInDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: "CHECKED_IN",
          checkOutDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  return {
    total,
    byStatus,
    totalRevenue: revenue._sum.totalAmount,
    avgBookingValue: revenue._avg.totalAmount,
    avgNights: revenue._avg.nights,
    upcomingCheckIns,
    upcomingCheckOuts,
  };
};

export const bookingService = {
  createBooking,
  getAllBookings,
  getBookingById,
  confirmBooking,
  checkIn,
  checkOut,
  cancelBooking,
  getBookingStats,
  getMyBookings,
};
