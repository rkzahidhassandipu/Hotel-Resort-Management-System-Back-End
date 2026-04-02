import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

// ── Place Order ───────────────────────────────────────────

const createOrder = async (
  customerId: string,
  items: { menuItemId: string; quantity: number }[],
  type: 'DINE_IN' | 'TAKEAWAY' | 'ROOM_SERVICE'
) => {
  if (!items.length) throw new BadRequestError('Order must include items');

  // Fetch menu items to get prices
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map(i => i.menuItemId) } },
  });

  if (menuItems.length !== items.length) {
    throw new BadRequestError('One or more menu items not found');
  }

  // Build order items with required fields
  const orderItems = items.map(i => {
    const menuItem = menuItems.find(m => m.id === i.menuItemId)!;
    const unitPrice = menuItem.discountedPrice ?? menuItem.price;
    const unitPriceNum = Number(unitPrice); // convert Decimal to number
    const totalPrice = unitPriceNum * i.quantity;

    return {
      menuItemId: i.menuItemId,
      quantity: i.quantity,
      unitPrice,
      totalPrice,
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + Number(i.totalPrice), 0);
  const taxAmount = subtotal * 0.1; // example: 10% tax
  const totalAmount = subtotal + taxAmount;

  const order = await prisma.foodOrder.create({
    data: {
      customerId,
      type,
      status: 'PENDING',
      subtotal,
      taxAmount,
      totalAmount,
      items: {
        create: orderItems,
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  return order;
};



const updateOrderStatus = async (orderId: string, status: string) => {
  const order = await prisma.foodOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');
  if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
    throw new BadRequestError(`Cannot update a ${order.status} order`);
  }

  const timestamps: Record<string, object> = {
    CONFIRMED: { confirmedAt: new Date() },
    PREPARING: { preparingAt: new Date() },
    READY: { readyAt: new Date() },
    DELIVERED: { deliveredAt: new Date() },
    CANCELLED: { cancelledAt: new Date() },
  };

  return prisma.foodOrder.update({
    where: { id: orderId },
    data: { status: status as any, ...timestamps[status] },
    include: { items: { include: { menuItem: { select: { name: true } } } } },
  });
};

const cancelOrder = async (orderId: string, userId: string, role: string) => {
  const order = await prisma.foodOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order not found');
  if (role === 'CUSTOMER' && order.customerId !== userId) {
    throw new BadRequestError('Access denied');
  }
  if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
    throw new BadRequestError(`Cannot cancel a ${order.status} order`);
  }
  if (order.status === 'READY') {
    throw new BadRequestError('Order is already ready for delivery, cannot cancel');
  }

  return prisma.foodOrder.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
};

const getOrders = async (
  query: { page?: string; limit?: string; status?: string; type?: string; fromDate?: string; toDate?: string },
  role?: string,
  userId?: string
) => {
  const { page, limit } = getPaginationParams({ page: query.page, limit: query.limit });

  const where: Prisma.FoodOrderWhereInput = {};
  if (query.status) where.status = query.status as any;
  if (query.type) where.type = query.type as any;
  if (query.fromDate || query.toDate) {
    where.createdAt = {
      gte: query.fromDate ? new Date(query.fromDate) : undefined,
      lte: query.toDate ? new Date(query.toDate) : undefined,
    };
  }

  // Restrict customers to their own orders
  if (role === 'CUSTOMER' && userId) {
    where.customerId = userId;
  }

  const [orders, total] = await Promise.all([
    prisma.foodOrder.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.foodOrder.count({ where }),
  ]);

  return {
    orders,
    meta: getPaginationMeta(page, limit, total),
  };
};




const getOrderById = async (orderId: string) => {
  const order = await prisma.foodOrder.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { menuItem: true } },
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      booking: { select: { bookingNumber: true, room: { select: { roomNumber: true } } } },
    },
  });
  if (!order) throw new NotFoundError('Order not found');
  return order;
};

const getFullMenu = async () => {
  return prisma.menuCategory.findMany({
    where: { isActive: true },
    include: {
      menuItems: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
};

const createMenuItem = async (data: {
  categoryId: string; name: string; description?: string;
  price: number; discountedPrice?: number; foodCategory?: string;
  preparationTime?: number; calories?: number; isVegetarian?: boolean;
  isVegan?: boolean; isGlutenFree?: boolean;
  ingredients?: string[]; allergens?: string[];
}) => {
  const category = await prisma.menuCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new NotFoundError('Menu category not found');
  return prisma.menuItem.create({ data: data as any });
};

const updateMenuItem = async (id: string, data: Partial<{
  name: string; description: string; price: number; discountedPrice: number;
  isAvailable: boolean; preparationTime: number; calories: number;
  isVegetarian: boolean; isVegan: boolean; isGlutenFree: boolean;
}>) => {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Menu item not found');
  return prisma.menuItem.update({ where: { id }, data });
};

const deleteMenuItem = async (id: string) => {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Menu item not found');
  // Soft delete — mark unavailable
  return prisma.menuItem.update({ where: { id }, data: { isAvailable: false } });
};

const createMenuCategory = async (data: {
  name: string; description?: string; imageUrl?: string; sortOrder?: number;
}) => {
  const exists = await prisma.menuCategory.findUnique({ where: { name: data.name } });
  if (exists) throw new ConflictError('Menu category already exists');
  return prisma.menuCategory.create({ data });
};

const updateMenuCategory = async (id: string, data: Partial<{
  name: string; description: string; imageUrl: string;
  isActive: boolean; sortOrder: number;
}>) => {
  const cat = await prisma.menuCategory.findUnique({ where: { id } });
  if (!cat) throw new NotFoundError('Menu category not found');
  return prisma.menuCategory.update({ where: { id }, data });
};

const getFoodStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [byStatus, byType, todayRevenue, popularItems] = await Promise.all([
    prisma.foodOrder.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.foodOrder.groupBy({
      by: ['type'], _count: { type: true }, _sum: { totalAmount: true },
    }),
    prisma.foodOrder.aggregate({
      where: { status: 'DELIVERED', deliveredAt: { gte: today } },
      _sum: { totalAmount: true },
    }),
    prisma.foodOrderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  return { byStatus, byType, todayRevenue: todayRevenue._sum.totalAmount ?? 0, popularItems };
};

export const foodService = {
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrders,
  getOrderById,
  getFullMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createMenuCategory,
  updateMenuCategory,
  getFoodStats,
};
