import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    phone: z.string().min(10).max(20).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().datetime().optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    nationalId: z.string().optional(),
    passportNumber: z.string().optional(),
  }),
});

// ADMIN creates manager
export const createManagerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().min(10).max(20).optional(),
    department: z.string().min(1),
    designation: z.string().min(1),
    joiningDate: z.string().datetime(),
    salary: z.number().positive(),
    shift: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE']).optional(),
    bankAccount: z.string().optional(),
    emergencyContact: z.string().optional(),
  }),
});

// MANAGER (or ADMIN) creates staff/chef/maintenance
export const createStaffSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().min(10).max(20).optional(),
    role: z.enum(['STAFF', 'MAINTENANCE', 'CHEF']),
    department: z.string().min(1),
    designation: z.string().min(1),
    joiningDate: z.string().datetime(),
    salary: z.number().positive(),
    shift: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE']).optional(),
    bankAccount: z.string().optional(),
    emergencyContact: z.string().optional(),
  }),
});

// Admin approve/reject schema
export const approveAccountSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const rejectAccountSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    reason: z.string().min(5).max(500),
  }),
});

export const updateStaffSchema = z.object({
  body: z.object({
    department: z.string().optional(),
    designation: z.string().optional(),
    salary: z.number().positive().optional(),
    shift: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FLEXIBLE']).optional(),
    bankAccount: z.string().optional(),
    emergencyContact: z.string().optional(),
    isOnDuty: z.boolean().optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    reason: z.string().optional(),
  }),
});

export const userListQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER', 'MAINTENANCE', 'CHEF']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
