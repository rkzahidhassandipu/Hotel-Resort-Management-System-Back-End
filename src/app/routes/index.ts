import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import roomRoutes from '../modules/room/room.routes';
import bookingRoutes from '../modules/booking/booking.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import foodRoutes from '../modules/food/food.routes';
import maintenanceRoutes from '../modules/maintenance/maintenance.routes';
import staffRoutes from '../modules/staff/staff.routes';
import serviceRoutes from '../modules/service/service.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import reviewRoutes from '../modules/review/review.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import reportRoutes from '../modules/report/report.routes';
import guestRoutes from '../modules/guest/guest.routes';
import systemRoutes from '../modules/system/system.routes';

const router = Router();

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/rooms',         roomRoutes);
router.use('/bookings',      bookingRoutes);
router.use('/payments',      paymentRoutes);
router.use('/food',          foodRoutes);
router.use('/maintenance',   maintenanceRoutes);
router.use('/staff',         staffRoutes);
router.use('/services',      serviceRoutes);
router.use('/inventory',     inventoryRoutes);
router.use('/reviews',       reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports',       reportRoutes);
router.use('/guests',        guestRoutes);
router.use('/system',        systemRoutes);

export default router;
