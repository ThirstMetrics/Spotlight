// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard API response wrapper for single-resource endpoints.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Paginated API response wrapper for list endpoints.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Structured API error object returned in error responses.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
