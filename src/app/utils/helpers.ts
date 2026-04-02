import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../interfaces';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta,
): Response => {
  const response: ApiResponse<T> = { success: true, message, data, meta };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully'): Response =>
  sendSuccess(res, data, message, 201);

export const sendNoContent = (res: Response): Response => res.status(204).send();

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: { field: string; message: string }[],
): Response => {
  const response: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(response);
};

export const getPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const getPaginationParams = (
  query: { page?: string | number; limit?: string | number },
  maxLimit = 100,
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(String(query.page || 1)));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query.limit || 10))));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
