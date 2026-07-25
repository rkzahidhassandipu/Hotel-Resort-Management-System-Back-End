import { prisma } from "../../lib/prisma";
import { Role, ShiftType, UserStatus } from "../../../generated/prisma/client";
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
} from "../../errorHelpers/AppError";
import { getPaginationParams, getPaginationMeta } from "../../utils/helpers";
import { Prisma } from "../../../generated/prisma/client";
import bcrypt from "bcryptjs";
import Decimal from "decimal.js";
import { randomUUID } from "crypto";

const ROLE_CREATION_RULES: Record<Role, Role[]> = {
  ADMIN: [Role.STAFF, Role.CHEF, Role.MAINTENANCE, Role.MANAGER],
  MANAGER: [Role.STAFF, Role.CHEF, Role.MAINTENANCE],

  STAFF: [],
  CHEF: [],
  MAINTENANCE: [],
  CUSTOMER: [],
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
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

  const { role, status, search } = query;

  const where: Prisma.UserWhereInput = {};

  // role filter
  if (role) {
    where.role = role;
  }

  // status filter
  if (status) {
    where.status = status;
  }

  // search filter (name/email)
  if (search) {
    where.OR = [
      {
        firstName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        lastName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: getPaginationMeta(total, page, limit),
  };
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User not found");
  return user;
};

// Create manager/staff
const createManager = async (
  data: any,
  requesterRole: Role,
  userId: string,
) => {
  if (requesterRole !== "ADMIN") throw new ForbiddenError("Access denied");
  return prisma.user.create({
    data: { ...data, role: "MANAGER", createdBy: userId },
  });
};

const createStaffAccount = async (
  data: any,
  requesterRole: Role,
  userId: string,
) => {
  const allowedRoles = ROLE_CREATION_RULES[requesterRole];

  if (!allowedRoles) {
    throw new ForbiddenError("Access denied");
  }

  const {
    role,
    firstName,
    lastName,
    email,
    password,
    department,
    designation,
    salary,
    joiningDate,
    shift,
    bankAccount,
    emergencyContact,
  } = data;

  if (!firstName || !lastName || !email || !password) {
    throw new BadRequestError("Missing required user fields");
  }

  if (!department || !designation || !salary || !joiningDate) {
    throw new BadRequestError("Missing staff profile fields");
  }

  if (!role || !allowedRoles.includes(role)) {
    throw new ForbiddenError(`${requesterRole} cannot create ${role} account`);
  }

  if (requesterRole === role) {
    throw new ForbiddenError("You cannot create same role account");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new BadRequestError("Email already exists");
  }

  if (isNaN(Number(salary))) {
    throw new BadRequestError("Invalid salary value");
  }

  if (shift && !Object.values(ShiftType).includes(shift)) {
    throw new BadRequestError("Invalid shift type");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      createdById: userId,
      staffProfile: {
        create: {
          employeeId: `EMP-${randomUUID().slice(0, 8).toUpperCase()}`,
          department,
          designation,
          salary: new Decimal(salary),
          joiningDate: new Date(joiningDate),
          ...(shift && { shift }),
          ...(bankAccount && { bankAccount }),
          ...(emergencyContact && { emergencyContact }),
        },
      },
    },
    include: {
      staffProfile: true,
    },
  });

  return user;
};

// Approve/reject staff accounts
const approveStaffAccount = async (
  id: string,
  approverId: string,
  approverRole: Role,
) => {
  if (!["ADMIN", "MANAGER"].includes(approverRole)) {
    throw new ForbiddenError("Access denied");
  }

  const user = await prisma.user.update({
    where: { id }, // ✅ use id
    data: {
      status: "ACTIVE",
    },
  });

  return user;
};

const rejectStaffAccount = async (
  id: string,
  approverId: string,
  approverRole: Role,
  reason: string,
) => {
  if (!["ADMIN", "MANAGER"].includes(approverRole)) {
    throw new ForbiddenError("Access denied");
  }

  return prisma.user.update({
    where: { id },
    data: {
      status: UserStatus.SUSPENDED,
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
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({
      where: { status: UserStatus.PENDING_VERIFICATION }, // ✅ fixed
    }),
  ]);

  return { users, meta: getPaginationMeta(total, page, limit) };
};

// Update staff profile
const updateStaff = async (id: string, data: any) => {
  return prisma.user.update({ where: { id }, data });
};

// Update user status
const updateUserStatus = async (
  id: string,
  status: UserStatus,
  requesterRole: Role,
) => {
  if (requesterRole !== "ADMIN")
    throw new ForbiddenError("Only admin can update status");
  if (!Object.values(UserStatus).includes(status))
    throw new BadRequestError("Invalid status");
  return prisma.user.update({ where: { id }, data: { status } });
};

// Delete user
const deleteUser = async (id: string, requesterRole: Role) => {
  if (requesterRole !== "ADMIN") throw new ForbiddenError("Access denied");
  return prisma.user.delete({ where: { id } });
};

// Staff list
const getStaffList = async (query: any) => {
  const { page, limit, skip } = getPaginationParams(query);

  const where = {
    role: { not: Role.CUSTOMER },
    staffProfile: { isNot: null }, // ← এটা add করো
  };

  const [staff, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        staffProfile: {
          select: {
            id: true,
            department: true,
            designation: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { staff, meta: getPaginationMeta(total, page, limit) };
};

// Update customer preferences
const updateCustomerPreferences = async (userId: string, data: any) => {
  return prisma.customerProfile.update({
    where: { userId },
    data: {
      preferences: {
        emailNotifications: data.emailNotifications,
        darkMode: data.darkMode,
        receivePromotions: data.receivePromotions,
      },
    },
  });
};

// User stats
const getUserStats = async () => {
  const users = await prisma.user.findMany({
    select: {
      role: true,
      status: true,
    },
  });

  const normalize = (v: any) =>
    String(v || "")
      .toUpperCase()
      .trim();

  return {
    total: users.length,
    active: users.filter((u) => normalize(u.status) === "ACTIVE").length,
    suspended: users.filter((u) => normalize(u.status) === "SUSPENDED").length,
    pending: users.filter((u) => normalize(u.status) === "PENDING_VERIFICATION")
      .length,
    customers: users.filter((u) => u.role === "CUSTOMER").length,
    staff: users.filter((u) => u.role !== "CUSTOMER").length,
  };
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
