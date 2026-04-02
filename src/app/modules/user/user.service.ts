import { prisma } from '../../lib/prisma';
import { Role, UserStatus } from '../../../generated/prisma/client';
import { NotFoundError, UnauthorizedError, BadRequestError, ForbiddenError } from '../../errorHelpers/AppError';
import { getPaginationParams, getPaginationMeta } from '../../utils/helpers';

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

const updateProfile = async (userId: string, data: any) => {
  return prisma.user.update({ where: { id: userId }, data });
};

const uploadAvatar = async (userId: string, buffer: Buffer) => {
  // replace with actual file upload logic
  const avatarUrl = `uploads/${userId}.png`;
  return prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
};

const getAllUsers = async (query: any) => {
  const { page, limit, skip } = getPaginationParams(query);
  const [users, total] = await Promise.all([
    prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count(),
  ]);
  return { users, meta: getPaginationMeta(total, page, limit) };
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

// Create manager/staff
const createManager = async (data: any, requesterRole: Role, userId: string) => {
  if (requesterRole !== 'ADMIN') throw new ForbiddenError('Access denied');
  return prisma.user.create({ data: { ...data, role: 'MANAGER', createdBy: userId } });
};

const createStaffAccount = async (data: any, requesterRole: Role, userId: string) => {
  if (!['ADMIN', 'MANAGER'].includes(requesterRole)) throw new ForbiddenError('Access denied');
  return prisma.user.create({ data: { ...data, role: 'STAFF', createdBy: userId } });
};

// Approve/reject staff accounts
const approveStaffAccount = async (
  id: string,
  approverId: string,
  approverRole: Role
) => {
  if (!['ADMIN', 'MANAGER'].includes(approverRole)) {
    throw new ForbiddenError('Access denied');
  }

  const user = await prisma.user.update({
    where: { id }, // ✅ use id
    data: {
      status: 'ACTIVE',
    },
  });

  return user;
};

const rejectStaffAccount = async (
  id: string,
  approverId: string,
  approverRole: Role,
  reason: string
) => {
  if (!['ADMIN', 'MANAGER'].includes(approverRole)) {
    throw new ForbiddenError('Access denied');
  }

  return prisma.user.update({
    where: { id },
    data: {
      status: UserStatus.SUSPENDED, // ✅ valid enum
    },
  });
};



const getPendingApprovals = async (query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { status: UserStatus.PENDING_VERIFICATION }, // ✅ fixed
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({
      where: { status: UserStatus.PENDING_VERIFICATION } // ✅ fixed
    }),
  ]);

  return { users, meta: getPaginationMeta(total, page, limit) };
};

// Update staff profile
const updateStaff = async (id: string, data: any) => {
  return prisma.user.update({ where: { id }, data });
};

// Update user status
const updateUserStatus = async (id: string, status: UserStatus, requesterRole: Role) => {
  if (requesterRole !== 'ADMIN') throw new ForbiddenError('Only admin can update status');
  if (!Object.values(UserStatus).includes(status)) throw new BadRequestError('Invalid status');
  return prisma.user.update({ where: { id }, data: { status } });
};

// Delete user
const deleteUser = async (id: string, requesterRole: Role) => {
  if (requesterRole !== 'ADMIN') throw new ForbiddenError('Access denied');
  return prisma.user.delete({ where: { id } });
};

// Staff list
const getStaffList = async (query: any) => {
  const { page, limit, skip } = getPaginationParams(query);
  const [staff, total] = await Promise.all([
    prisma.user.findMany({ where: { role: 'STAFF' }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where: { role: 'STAFF' } }),
  ]);
  return { staff, meta: getPaginationMeta(total, page, limit) };
};

// Update customer preferences
const updateCustomerPreferences = async (userId: string, data: any) => {
  return prisma.user.update({
    where: { id: userId },
    data
  });
};

// User stats
const getUserStats = async () => {
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({ where: { status: UserStatus.ACTIVE } });
  const pendingUsers = await prisma.user.count({ where: { status: UserStatus.PENDING_VERIFICATION } });
  return { totalUsers, activeUsers, pendingUsers };
};

export const userService = {
  getMe,
  updateProfile,
  uploadAvatar,
  getAllUsers,
  getUserById,
  createManager,
  createStaffAccount,
  approveStaffAccount,
  rejectStaffAccount,
  getPendingApprovals,
  updateStaff,
  updateUserStatus,
  deleteUser,
  getStaffList,
  updateCustomerPreferences,
  getUserStats,
};