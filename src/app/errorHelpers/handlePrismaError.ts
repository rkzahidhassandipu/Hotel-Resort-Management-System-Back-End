import { Prisma } from '../../generated/prisma/client';
import { AppError } from './AppError';

export const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002': {
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return new AppError(`Duplicate value for: ${field}`, 409);
    }
    case 'P2025':
      return new AppError('Record not found', 404);
    case 'P2003':
      return new AppError('Foreign key constraint failed', 400);
    case 'P2014':
      return new AppError('Invalid relation', 400);
    default:
      return new AppError(`Database error: ${error.code}`, 500);
  }
};
