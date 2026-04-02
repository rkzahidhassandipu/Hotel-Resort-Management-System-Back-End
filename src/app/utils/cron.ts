import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { sendEmail } from './email';
import { logger } from './logger';

export const initCronJobs = (): void => {
  logger.info('⏰ Initializing cron jobs...');

  // ── 1. Check-in Reminder — daily 10:00 AM ─────────────────
  cron.schedule('0 10 * * *', async () => {
    logger.info('[CRON] Check-in reminder');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const bookings = await prisma.booking.findMany({
        where: { status: 'CONFIRMED', checkInDate: { gte: tomorrow, lt: dayAfter } },
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          room: { select: { roomNumber: true, type: true } },
        },
      });

      for (const b of bookings) {
        const c = b.customer as any;
        const r = b.room as any;

        await prisma.notification.create({
          data: {
            userId: b.customerId,
            type: 'CHECK_IN_REMINDER',
            channel: 'IN_APP',
            title: '📅 Check-in Tomorrow!',
            message: `Room ${r.roomNumber} — check-in tomorrow from 2:00 PM. Booking #${b.bookingNumber}.`,
          },
        });

        await sendEmail({
          to: c.email,
          subject: `Check-in Reminder — #${b.bookingNumber}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1a1a2e;padding:24px;text-align:center">
                <h1 style="color:#fff;margin:0">🏨 Hotel & Resort</h1>
              </div>
              <div style="padding:32px">
                <h2>Your Check-in is Tomorrow!</h2>
                <p>Dear ${c.firstName} ${c.lastName}, we look forward to welcoming you!</p>
                <div style="background:#f0f4ff;border-left:4px solid #c9a84c;padding:16px;border-radius:4px;margin:16px 0">
                  <b>Booking #:</b> ${b.bookingNumber}<br>
                  <b>Room:</b> ${r.roomNumber} (${r.type})<br>
                  <b>Date:</b> ${b.checkInDate.toLocaleDateString()}<br>
                  <b>Check-in from:</b> 2:00 PM
                </div>
              </div>
            </div>`,
        });
      }

      logger.info(`[CRON] Check-in reminders sent: ${bookings.length}`);
    } catch (err) {
      logger.error('[CRON] Check-in reminder failed:', err);
    }
  });

  // ── 2. Check-out Reminder — daily 08:00 AM ────────────────
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Check-out reminder');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookings = await prisma.booking.findMany({
        where: { status: 'CHECKED_IN', checkOutDate: { gte: today, lt: tomorrow } },
        include: { customer: { select: { firstName: true, lastName: true, email: true } } },
      });

      for (const b of bookings) {
        const c = b.customer as any;

        await prisma.notification.create({
          data: {
            userId: b.customerId,
            type: 'CHECK_OUT_REMINDER',
            channel: 'IN_APP',
            title: '🔔 Check-out Today by 12:00 PM',
            message: `Please vacate by 12:00 PM. We hope you had a wonderful stay! #${b.bookingNumber}`,
          },
        });

        await sendEmail({
          to: c.email,
          subject: 'Check-out Today by 12:00 PM',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1a1a2e;padding:24px;text-align:center">
                <h1 style="color:#fff;margin:0">🏨 Hotel & Resort</h1>
              </div>
              <div style="padding:32px">
                <h2>Check-out Reminder</h2>
                <p>Dear ${c.firstName} ${c.lastName},</p>
                <p>Your check-out is <strong>today by 12:00 PM</strong>. Please visit the front desk.</p>
                <p>Thank you for staying with us! We hope to see you again. 😊</p>
              </div>
            </div>`,
        });
      }

      logger.info(`[CRON] Check-out reminders sent: ${bookings.length}`);
    } catch (err) {
      logger.error('[CRON] Check-out reminder failed:', err);
    }
  });

  // ── 3. Daily Report — every day 11:59 PM ──────────────────
  cron.schedule('59 23 * * *', async () => {
    logger.info('[CRON] Generating daily report');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [checkIns, checkOuts, cancellations, noShows, revenue, roomRevenue, foodRevenue, totalRooms, occupiedRooms, newCustomers] =
        await Promise.all([
          prisma.booking.count({ where: { actualCheckIn: { gte: today, lt: tomorrow } } }),
          prisma.booking.count({ where: { actualCheckOut: { gte: today, lt: tomorrow } } }),
          prisma.booking.count({ where: { status: 'CANCELLED', cancelledAt: { gte: today, lt: tomorrow } } }),
          prisma.booking.count({ where: { status: 'NO_SHOW', checkInDate: { gte: today, lt: tomorrow } } }),
          prisma.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: today, lt: tomorrow } }, _sum: { amount: true } }),
          prisma.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: today, lt: tomorrow }, booking: { isNot: null } }, _sum: { amount: true } }),
          prisma.foodOrder.aggregate({ where: { status: 'DELIVERED', deliveredAt: { gte: today, lt: tomorrow } }, _sum: { totalAmount: true } }),
          prisma.room.count({ where: { isActive: true } }),
          prisma.room.count({ where: { status: 'OCCUPIED', isActive: true } }),
          prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: today, lt: tomorrow } } }),
        ]);

      const totalRev = Number(revenue._sum.amount ?? 0);
      const roomRev = Number(roomRevenue._sum.amount ?? 0);
      const foodRev = Number(foodRevenue._sum.totalAmount ?? 0);

      await prisma.dailyReport.upsert({
        where: { date: today },
        create: {
          date: today, checkIns, checkOuts, cancellations, noShows,
          totalRevenue: totalRev, roomRevenue: roomRev, foodRevenue: foodRev,
          serviceRevenue: totalRev - roomRev - foodRev,
          occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
          totalGuests: checkIns, newCustomers,
        },
        update: {
          checkIns, checkOuts, cancellations, noShows,
          totalRevenue: totalRev, roomRevenue: roomRev, foodRevenue: foodRev,
          occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
          newCustomers,
        },
      });

      logger.info('[CRON] Daily report generated');
    } catch (err) {
      logger.error('[CRON] Daily report failed:', err);
    }
  });

  // ── 4. Overdue Task Checker — every hour ──────────────────
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await prisma.staffTask.updateMany({
        where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } },
        data: { status: 'OVERDUE' },
      });
      if (result.count > 0) logger.info(`[CRON] ${result.count} task(s) marked OVERDUE`);
    } catch (err) {
      logger.error('[CRON] Overdue task checker failed:', err);
    }
  });

  // ── 5. Low Stock Alert — daily 09:00 AM ───────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('[CRON] Low stock alert');
    try {
      const lowItems = await prisma.inventoryItem.findMany({
        where: { status: { in: ['LOW', 'OUT_OF_STOCK'] } },
        include: { category: { select: { name: true } } },
      });

      if (!lowItems.length) return;

      const managers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'MANAGER'] }, status: 'ACTIVE', deletedAt: null },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      const outOfStock = lowItems.filter((i) => i.status === 'OUT_OF_STOCK').length;
      const low = lowItems.filter((i) => i.status === 'LOW').length;

      for (const mgr of managers) {
        await prisma.notification.create({
          data: {
            userId: mgr.id,
            type: 'SYSTEM_ALERT',
            channel: 'IN_APP',
            title: `⚠️ Stock Alert: ${lowItems.length} item(s) need attention`,
            message: `${outOfStock} out of stock, ${low} running low. Please check inventory.`,
          },
        });

        const rows = lowItems.map((item) =>
          `<tr style="background:${item.status === 'OUT_OF_STOCK' ? '#fff3f3' : '#fffbf0'}">
            <td style="padding:8px;border:1px solid #ddd">${item.name}</td>
            <td style="padding:8px;border:1px solid #ddd">${(item.category as any).name}</td>
            <td style="padding:8px;border:1px solid #ddd">${item.currentStock} ${item.unit}</td>
            <td style="padding:8px;border:1px solid #ddd;color:${item.status === 'OUT_OF_STOCK' ? '#c0392b' : '#e67e22'};font-weight:bold">${item.status}</td>
          </tr>`,
        ).join('');

        await sendEmail({
          to: mgr.email,
          subject: `⚠️ Inventory Alert: ${lowItems.length} Item(s) Need Attention`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
              <div style="background:#1a1a2e;padding:24px;text-align:center">
                <h1 style="color:#fff;margin:0">🏨 Hotel Management</h1>
              </div>
              <div style="padding:32px">
                <h2 style="color:#e67e22">⚠️ Inventory Stock Alert</h2>
                <p>Dear ${mgr.firstName} ${mgr.lastName},</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                  <thead><tr style="background:#1a1a2e;color:#fff">
                    <th style="padding:10px;text-align:left">Item</th>
                    <th style="padding:10px;text-align:left">Category</th>
                    <th style="padding:10px;text-align:left">Stock</th>
                    <th style="padding:10px;text-align:left">Status</th>
                  </tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
            </div>`,
        });
      }

      logger.info(`[CRON] Low stock alert sent: ${lowItems.length} item(s)`);
    } catch (err) {
      logger.error('[CRON] Low stock alert failed:', err);
    }
  });

  // ── 6. Expired Token Cleanup — daily 02:00 AM ─────────────
  cron.schedule('0 2 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true, revokedAt: { lt: thirtyDaysAgo } },
          ],
        },
      });
      logger.info(`[CRON] Token cleanup: deleted ${result.count} token(s)`);
    } catch (err) {
      logger.error('[CRON] Token cleanup failed:', err);
    }
  });

  // ── 7. No-show Marking — daily 06:00 AM ───────────────────
  cron.schedule('0 6 * * *', async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const noShows = await prisma.booking.findMany({
        where: { status: 'CONFIRMED', checkInDate: { gte: yesterday, lt: today }, actualCheckIn: null },
        select: { id: true, roomId: true },
      });

      if (!noShows.length) return;

      await prisma.booking.updateMany({
        where: { id: { in: noShows.map((b) => b.id) } },
        data: { status: 'NO_SHOW' },
      });

      for (const b of noShows) {
        await prisma.room.update({ where: { id: b.roomId }, data: { status: 'AVAILABLE' } });
      }

      logger.info(`[CRON] No-show: ${noShows.length} booking(s) marked, rooms freed`);
    } catch (err) {
      logger.error('[CRON] No-show marking failed:', err);
    }
  });

  logger.info('✅ 7 cron jobs active');
};
