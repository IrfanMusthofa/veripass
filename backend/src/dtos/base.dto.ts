import { z } from "zod";

// ========================================
// SUCCESS RESPONSE TYPES
// ========================================

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========================================
// ERROR RESPONSE TYPES
// ========================================

export interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message = "Success"
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = "Success"
): PaginatedResponse<T> {
  return {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: string,
  details?: unknown
): ErrorResponse {
  return {
    success: false,
    error,
    details,
  };
}

// ========================================
// PAGINATION QUERY SCHEMA
// ========================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
