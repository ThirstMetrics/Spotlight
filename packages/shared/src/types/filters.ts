// =============================================================================
// Filter & Query Types
// =============================================================================

import { Category } from './entities';

/**
 * Date range filter used across all report queries.
 */
export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Filter by specific outlets or outlet groups.
 */
export interface OutletFilter {
  outletIds?: string[];
  outletGroupIds?: string[];
}

/**
 * Filter by product categories.
 */
export interface CategoryFilter {
  categories?: Category[];
}

/**
 * Standard pagination and sorting parameters.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Combined report filters merging date range, outlet, and category filters.
 */
export type ReportFilters = DateRange & OutletFilter & CategoryFilter;

/**
 * Supported export formats for report downloads.
 */
export type ExportFormat = 'XLSX' | 'CSV';
