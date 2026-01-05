// ========================================
// SUCCESS RESPONSE TYPES
// ========================================

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
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
 * Create an error response
 */
export function createErrorResponse(
  error: string,
  details?: unknown
): { success: false; error: string; details?: unknown } {
  return {
    success: false,
    error,
    details,
  };
}
