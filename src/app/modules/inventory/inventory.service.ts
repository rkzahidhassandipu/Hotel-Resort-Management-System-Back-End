import { Prisma, ProcurementStatus } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

// ── Items ─────────────────────────────────────────────────

const getAllItems = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  categoryId?: string;
  status?: string;
}) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.InventoryItemWhereInput = {
    ...(query.status && { status: query.status as any }),
    ...(query.categoryId && { categoryId: query.categoryId }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { supplier: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: { category: true },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return { items, meta: getPaginationMeta(total, page, limit) };
};

const getItemById = async (id: string) => {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: true,
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!item) throw new NotFoundError('Inventory item not found');
  return item;
};

const createItem = async (data: {
  categoryId: string;
  name: string;
  sku: string;
  unit: string;
  currentStock?: number;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint: number;
  unitCost: number;
  supplier?: string;
  location?: string;
  expiryDate?: string;
  notes?: string;
}) => {
  const exists = await prisma.inventoryItem.findUnique({ where: { sku: data.sku } });
  if (exists) throw new ConflictError(`SKU "${data.sku}" already exists`);

  const category = await prisma.inventoryCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new NotFoundError('Inventory category not found');

  return prisma.inventoryItem.create({
    data: {
      ...data,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      currentStock: data.currentStock ?? 0,
    } as any,
    include: { category: true },
  });
};

const updateItem = async (
  id: string,
  data: Partial<{
    name: string;
    minimumStock: number;
    maximumStock: number;
    reorderPoint: number;
    unitCost: number;
    supplier: string;
    location: string;
    notes: string;
  }>
) => {
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Inventory item not found');
  return prisma.inventoryItem.update({ where: { id }, data, include: { category: true } });
};

const addTransaction = async (
  itemId: string,
  data: {
    type: 'IN' | 'OUT';
    quantity: number;
    notes?: string;
  },
  performedBy: string
) => {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError('Inventory item not found');

  const newStock =
    data.type === 'IN'
      ? (item.currentStock ?? 0) + data.quantity
      : (item.currentStock ?? 0) - data.quantity;

  if (newStock < 0) throw new BadRequestError('Stock cannot go below zero');

  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { currentStock: newStock },
  });

  return prisma.inventoryTransaction.create({
    data: {
      itemId,
      type: data.type,
      quantity: data.quantity,
      notes: data.notes,
      performedBy, // now stored
    },
  });
};


const getTransactionHistory = async (itemId: string, query: { page?: string; limit?: string }) => {
  const { page, limit, skip } = getPaginationParams(query);

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError('Inventory item not found');

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where: { itemId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventoryTransaction.count({ where: { itemId } }),
  ]);

  return { transactions, meta: getPaginationMeta(total, page, limit) };
};

const getLowStockItems = async () =>
  prisma.inventoryItem.findMany({
    where: { status: { in: ['LOW', 'OUT_OF_STOCK'] } },
    include: { category: true },
    orderBy: { currentStock: 'asc' },
  });

const getAllCategories = async () =>
  prisma.inventoryCategory.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: 'asc' },
  });

const createCategory = async (data: { name: string; description?: string }) => {
  const exists = await prisma.inventoryCategory.findUnique({ where: { name: data.name } });
  if (exists) throw new ConflictError('Category already exists');
  return prisma.inventoryCategory.create({ data });
};

const createProcurementOrder = async (
  userId: string,
  data: {
    supplier?: string;
    expectedDate?: string;
    notes?: string;
    items: Array<{ inventoryItemId: string; quantity: number; unitCost: number }>;
  }
) => {
  const itemsData = data.items.map(item => ({
    inventoryItemId: item.inventoryItemId,
    quantity: item.quantity,
    unitCost: item.unitCost,
    totalCost: item.quantity * item.unitCost
  }));

  return prisma.procurementOrder.create({
    data: {
      requestedById: userId,
      supplier: data.supplier,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
      notes: data.notes,
      items: { create: itemsData },
    },
    include: {
      items: { include: { inventoryItem: true } }
    }
  });
};


const getAllProcurementOrders = async (query: { page?: string; limit?: string; status?: string }) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.ProcurementOrderWhereInput = {
    ...(query.status && { status: query.status as any }),
  };

  const [orders, total] = await Promise.all([
    prisma.procurementOrder.findMany({
      where,
      include: {
        items: { include: { inventoryItem: { select: { name: true, sku: true } } } },
        requestedBy: { select: { firstName: true, lastName: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.procurementOrder.count({ where }),
  ]);

  return { orders, meta: getPaginationMeta(total, page, limit) };
};

const updateProcurementStatus = async (
  orderId: string,
  status: ProcurementStatus,
  updatedById: string,
  notes?: string
) => {
  const order = await prisma.procurementOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Procurement order not found');

  return prisma.procurementOrder.update({
    where: { id: orderId },
    data: {
      status,
      notes,
      approvedById: updatedById, // assuming schema has approvedById
    },
  });
};



const getInventoryStats = async () => {
  const [total, byStatus, totalValue, lowStock, categories] = await Promise.all([
    prisma.inventoryItem.count(),
    prisma.inventoryItem.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.inventoryItem.aggregate({ _sum: { currentStock: true } }),
    prisma.inventoryItem.count({ where: { status: { in: ['LOW', 'OUT_OF_STOCK'] } } }),
    prisma.inventoryCategory.count(),
  ]);

  return {
    total,
    byStatus,
    totalStockUnits: totalValue._sum.currentStock,
    lowStockAlerts: lowStock,
    categories,
  };
};

export const inventoryService = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  addTransaction,
  getTransactionHistory,
  getLowStockItems,
  getAllCategories,
  createCategory,
  createProcurementOrder,
  getAllProcurementOrders,
  updateProcurementStatus,
  getInventoryStats,
};