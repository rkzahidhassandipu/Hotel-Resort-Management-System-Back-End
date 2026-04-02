import { prisma } from '../../lib/prisma';
import { BadRequestError } from '../../errorHelpers/AppError';


const monthsAgo = (n: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - n);
  return date;
};

const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24);
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

  // ── Dashboard Overview ────────────────────────────────────

const getDashboardOverview = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalRooms, occupiedRooms, availableRooms,
    todayCheckIns, todayCheckOuts,
    totalBookingsToday, pendingBookings,
    todayRevenue, monthRevenue,
    totalCustomers, newCustomersThisMonth,
    pendingMaintenance, openServiceRequests,
    pendingFoodOrders, lowStockItems,
  ] = await Promise.all([
    prisma.room.count({ where: { isActive: true } }),
    prisma.room.count({ where: { status: 'OCCUPIED', isActive: true } }),
    prisma.room.count({ where: { status: 'AVAILABLE', isActive: true } }),
    prisma.booking.count({ where: { checkInDate: { gte: today, lt: tomorrow }, status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { checkOutDate: { gte: today, lt: tomorrow }, status: 'CHECKED_IN' } }),
    prisma.booking.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: today, lt: tomorrow } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', paidAt: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
    prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null, createdAt: { gte: thisMonthStart } } }),
    prisma.maintenanceLog.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.serviceRequest.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
    prisma.foodOrder.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } }),
    prisma.inventoryItem.count({ where: { status: { in: ['LOW', 'OUT_OF_STOCK'] } } }),
  ]);

  const occupancyRate = totalRooms > 0
    ? ((occupiedRooms / totalRooms) * 100).toFixed(1)
    : '0.0';

  return {
    rooms: { total: totalRooms, occupied: occupiedRooms, available: availableRooms, occupancyRate: `${occupancyRate}%` },
    bookings: { todayCheckIns, todayCheckOuts, totalToday: totalBookingsToday, pending: pendingBookings },
    revenue: { today: todayRevenue._sum.amount ?? 0, thisMonth: monthRevenue._sum.amount ?? 0 },
    customers: { total: totalCustomers, newThisMonth: newCustomersThisMonth },
    alerts: { pendingMaintenance, openServiceRequests, pendingFoodOrders, lowStockItems },
  };
}

const getRevenueReport = async (query: { fromDate?: string; toDate?: string; groupBy?: string }) => {
  const from = query.fromDate ? new Date(query.fromDate) : monthsAgo(1);
  const to = query.toDate ? new Date(query.toDate) : new Date();

  const payments = await prisma.payment.findMany({
    where: { status: 'COMPLETED', paidAt: { gte: from, lte: to } },
    select: { amount: true, method: true, paidAt: true, booking: { select: { nights: true, room: { select: { type: true } } } } },
    orderBy: { paidAt: 'asc' },
  });

  // Group by day/week/month
  const grouped: Record<string, number> = {};
  for (const p of payments) {
    const date = p.paidAt!;
    let key: string;
    if (query.groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (query.groupBy === 'week') {
      const week = getWeekNumber(date);
      key = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
    } else {
      key = date.toISOString().split('T')[0];
    }
    grouped[key] = (grouped[key] ?? 0) + Number(p.amount);
  }

  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>);

  const byRoomType = payments.reduce((acc, p) => {
    const type = (p.booking?.room as any)?.type ?? 'SERVICE';
    acc[type] = (acc[type] ?? 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>);

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  return {
    total,
    timeline: Object.entries(grouped).map(([date, amount]) => ({ date, amount })),
    byPaymentMethod: byMethod,
    byRoomType,
    period: { from: from.toISOString(), to: to.toISOString() },
  };
}

const getOccupancyReport = async (query: { fromDate?: string; toDate?: string; roomType?: string }) => {
  const from = query.fromDate ? new Date(query.fromDate) : monthsAgo(1);
  const to = query.toDate ? new Date(query.toDate) : new Date();

  const [totalRooms, bookings] = await Promise.all([
    prisma.room.count({
      where: {
        isActive: true,
        ...(query.roomType && { type: query.roomType as any }),
      },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkInDate: { gte: from },
        checkOutDate: { lte: to },
        ...(query.roomType && { room: { type: query.roomType as any } }),
      },
      select: { checkInDate: true, checkOutDate: true, nights: true, room: { select: { type: true } } },
    }),
  ]);

  const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  const totalRoomNights = totalRooms * totalDays;
  const occupiedNights = bookings.reduce((s, b) => s + b.nights, 0);
  const occupancyRate = totalRoomNights > 0
    ? ((occupiedNights / totalRoomNights) * 100).toFixed(1)
    : '0.0';

  const byRoomType = bookings.reduce((acc, b) => {
    const type = (b.room as any)?.type ?? 'UNKNOWN';
    acc[type] = (acc[type] ?? 0) + b.nights;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRooms,
    totalDays,
    occupiedNights,
    occupancyRate: `${occupancyRate}%`,
    byRoomType,
    period: { from: from.toISOString(), to: to.toISOString() },
  };
}

const getBookingReport = async (query: { fromDate?: string; toDate?: string }) => {
  const from = query.fromDate ? new Date(query.fromDate) : monthsAgo(1);
  const to = query.toDate ? new Date(query.toDate) : new Date();

  const [byStatus, bySource, avgValues, topRooms, cancelledCount] = await Promise.all([
    prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { createdAt: { gte: from, lte: to } },
    }),
    prisma.booking.groupBy({
      by: ['source'],
      _count: { source: true },
      where: { createdAt: { gte: from, lte: to } },
    }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: from, lte: to }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
      _avg: { totalAmount: true, nights: true },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.booking.groupBy({
      by: ['roomId'],
      _count: { roomId: true },
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { _count: { roomId: 'desc' } },
      take: 5,
    }),
    prisma.booking.count({
      where: { status: 'CANCELLED', cancelledAt: { gte: from, lte: to } },
    }),
  ]);

  return {
    byStatus,
    bySource,
    totals: {
      count: avgValues._count,
      revenue: avgValues._sum.totalAmount ?? 0,
      avgValue: avgValues._avg.totalAmount ?? 0,
      avgNights: avgValues._avg.nights ?? 0,
    },
    cancellationCount: cancelledCount,
    topRoomIds: topRooms.map((r) => ({ roomId: r.roomId, bookingCount: r._count.roomId })),
    period: { from: from.toISOString(), to: to.toISOString() },
  };
}

const getStaffPerformanceReport = async (query: { fromDate?: string; toDate?: string }) => {
  const from = query.fromDate ? new Date(query.fromDate) : monthsAgo(1);
  const to = query.toDate ? new Date(query.toDate) : new Date();

  const [taskStats, maintenanceStats, reviews] = await Promise.all([
    prisma.staffTask.groupBy({
      by: ['assignedToId', 'status'],
      _count: { status: true },
      where: { createdAt: { gte: from, lte: to } },
    }),
    prisma.maintenanceLog.groupBy({
      by: ['assignedToId', 'status'],
      _count: { status: true },
      where: { assignedToId: { not: null }, createdAt: { gte: from, lte: to } },
    }),
    prisma.performanceReview.findMany({
      where: { reviewedAt: { gte: from, lte: to } },
      include: { staffProfile: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { rating: 'desc' },
      take: 10,
    }),
  ]);

  return { taskStats, maintenanceStats, topPerformers: reviews };
}

const getFoodReport = async (query: { fromDate?: string; toDate?: string }) => {
  const from = query.fromDate ? new Date(query.fromDate) : monthsAgo(1);
  const to = query.toDate ? new Date(query.toDate) : new Date();

  const [byType, totalRevenue, topItems, orderCount] = await Promise.all([
    prisma.foodOrder.groupBy({
      by: ['type'],
      _count: { type: true },
      _sum: { totalAmount: true },
      where: { status: 'DELIVERED', createdAt: { gte: from, lte: to } },
    }),
    prisma.foodOrder.aggregate({
      where: { status: 'DELIVERED', createdAt: { gte: from, lte: to } },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
    }),
    prisma.foodOrderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
    prisma.foodOrder.count({ where: { createdAt: { gte: from, lte: to } } }),
  ]);

  return {
    byOrderType: byType,
    totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    avgOrderValue: totalRevenue._avg.totalAmount ?? 0,
    totalOrders: orderCount,
    topMenuItemIds: topItems,
    period: { from: from.toISOString(), to: to.toISOString() },
  };
}

const generateDailyReport = async (date: string) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const [checkIns, checkOuts, cancellations, noShows, revenue, roomRevenue, foodRevenue, totalRooms, occupiedRooms, newCustomers] =
    await Promise.all([
      prisma.booking.count({ where: { actualCheckIn: { gte: day, lt: nextDay } } }),
      prisma.booking.count({ where: { actualCheckOut: { gte: day, lt: nextDay } } }),
      prisma.booking.count({ where: { status: 'CANCELLED', cancelledAt: { gte: day, lt: nextDay } } }),
      prisma.booking.count({ where: { status: 'NO_SHOW', checkInDate: { gte: day, lt: nextDay } } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: day, lt: nextDay } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: day, lt: nextDay }, booking: { isNot: null } }, _sum: { amount: true } }),
      prisma.foodOrder.aggregate({ where: { status: 'DELIVERED', deliveredAt: { gte: day, lt: nextDay } }, _sum: { totalAmount: true } }),
      prisma.room.count({ where: { isActive: true } }),
      prisma.room.count({ where: { status: 'OCCUPIED', isActive: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: day, lt: nextDay } } }),
    ]);

  const totalRevAmount = Number(revenue._sum.amount ?? 0);
  const roomRevAmount = Number(roomRevenue._sum.amount ?? 0);
  const foodRevAmount = Number(foodRevenue._sum.totalAmount ?? 0);
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  const report = await prisma.dailyReport.upsert({
    where: { date: day },
    create: {
      date: day,
      checkIns,
      checkOuts,
      cancellations,
      noShows,
      totalRevenue: totalRevAmount,
      roomRevenue: roomRevAmount,
      foodRevenue: foodRevAmount,
      serviceRevenue: totalRevAmount - roomRevAmount - foodRevAmount,
      occupancyRate,
      totalGuests: checkIns,
      newCustomers,
    },
    update: {
      checkIns, checkOuts, cancellations, noShows,
      totalRevenue: totalRevAmount, roomRevenue: roomRevAmount,
      foodRevenue: foodRevAmount, occupancyRate, newCustomers,
    },
  });

  return report;
}

const getDailyReports = async (query: { fromDate?: string; toDate?: string }) => {
  const from = query.fromDate ? new Date(query.fromDate) : monthsAgo(1);
  const to = query.toDate ? new Date(query.toDate) : new Date();

  return prisma.dailyReport.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: 'desc' },
  });
}

const getMonthlyReports = async (year?: number) => {
  const targetYear = year ?? new Date().getFullYear();
  return prisma.monthlyReport.findMany({
    where: { year: targetYear },
    orderBy: { month: 'asc' },
  });
}

export const reportService = {
  getDashboardOverview,
  getRevenueReport,
  getOccupancyReport,
  getBookingReport,
  getStaffPerformanceReport,
  getFoodReport,
  generateDailyReport,
  getDailyReports,
  getMonthlyReports,
};
