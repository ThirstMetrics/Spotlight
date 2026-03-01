import type { MappedRow } from './field-mapper';

/**
 * A single validation error found in a row.
 */
export interface ValidationError {
  /** The field name that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
  /** The invalid value that was found */
  value: unknown;
  /** Error severity: 'error' blocks import, 'warning' allows import with flag */
  severity: 'error' | 'warning';
}

/**
 * Result of validating a single row.
 */
export interface ValidationResult {
  /** Whether the row passed all validation checks (no errors, warnings OK) */
  isValid: boolean;
  /** List of validation errors/warnings found */
  errors: ValidationError[];
}

/**
 * Result of validating an entire batch of rows, with summary statistics.
 */
export interface BatchValidationResult {
  /** Whether all rows passed validation */
  isValid: boolean;
  /** Total number of rows validated */
  totalRows: number;
  /** Number of rows that passed validation */
  validRows: number;
  /** Number of rows with errors */
  errorRows: number;
  /** Number of rows with warnings (but no errors) */
  warningRows: number;
  /** Per-row validation results */
  results: ValidationResult[];
  /** Summary of errors by field name */
  errorSummary: Record<string, number>;
}

/**
 * Required fields per upload type. Each upload type defines which fields
 * must be present and non-empty for a row to be considered valid.
 */
const REQUIRED_FIELDS: Record<string, string[]> = {
  warehouse_transfer: [
    'product_id',
    'outlet_id',
    'quantity',
    'transfer_date',
  ],
  direct_order: [
    'product_id',
    'outlet_id',
    'quantity',
    'order_date',
    'distributor_id',
  ],
  purchase_order: [
    'product_id',
    'quantity',
    'unit_cost',
    'order_date',
    'distributor_id',
  ],
  sales_data: [
    'product_id',
    'outlet_id',
    'quantity_sold',
    'revenue',
    'sale_date',
  ],
};

/**
 * Fields that should be validated as numbers.
 */
const NUMERIC_FIELDS: string[] = [
  'quantity',
  'quantity_sold',
  'unit_cost',
  'total_cost',
  'revenue',
  'price',
];

/**
 * Fields that should be validated as dates.
 */
const DATE_FIELDS: string[] = [
  'transfer_date',
  'order_date',
  'sale_date',
  'delivery_date',
  'invoice_date',
];

/**
 * DataValidator validates mapped rows before they are written to the database.
 * Checks for required fields, data types, and business rules per upload type.
 */
export class DataValidator {
  /**
   * Validate a single mapped row against the rules for a given upload type.
   *
   * TODO: Implement comprehensive row validation including:
   * - Required field presence checks (field exists and is non-null/non-empty)
   * - Numeric field validation (must be a valid number, optionally > 0)
   * - Date field validation (must be a parseable date, not in the future)
   * - String length limits
   * - Product ID format validation (match expected SKU patterns)
   * - Cross-field validation (e.g., total_cost should equal quantity * unit_cost)
   * - Custom validation rules per upload type
   *
   * @param row - A mapped row to validate
   * @param uploadType - The type of upload (warehouse_transfer, direct_order, purchase_order, sales_data)
   * @returns Validation result with any errors found
   */
  validateRow(row: MappedRow, uploadType: string): ValidationResult {
    const errors: ValidationError[] = [];
    const requiredFields = REQUIRED_FIELDS[uploadType] || [];

    // TODO: Add product ID format validation (configurable per organization)
    // TODO: Add cross-field validation (e.g., total = qty * unit_cost)
    // TODO: Add custom validation rules from organization settings
    // TODO: Add duplicate detection within the same upload batch

    // Check required fields
    for (const field of requiredFields) {
      const value = row[field];
      if (value === undefined || value === null || value === '') {
        errors.push({
          field,
          message: `Required field "${field}" is missing or empty`,
          value,
          severity: 'error',
        });
      }
    }

    // Validate numeric fields
    for (const field of NUMERIC_FIELDS) {
      const value = row[field];
      if (value !== undefined && value !== null && value !== '') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({
            field,
            message: `Field "${field}" must be a valid number, got "${value}"`,
            value,
            severity: 'error',
          });
        } else if (num < 0) {
          errors.push({
            field,
            message: `Field "${field}" should not be negative (got ${num})`,
            value,
            severity: 'warning',
          });
        }
      }
    }

    // Validate date fields
    for (const field of DATE_FIELDS) {
      const value = row[field];
      if (value !== undefined && value !== null && value !== '') {
        const date = new Date(String(value));
        if (isNaN(date.getTime())) {
          errors.push({
            field,
            message: `Field "${field}" must be a valid date, got "${value}"`,
            value,
            severity: 'error',
          });
        }
      }
    }

    const hasErrors = errors.some((e) => e.severity === 'error');

    return {
      isValid: !hasErrors,
      errors,
    };
  }

  /**
   * Validate all rows in a batch and return summary statistics.
   *
   * TODO: Implement batch validation with:
   * - Per-row validation using validateRow()
   * - Summary statistics (total, valid, error, warning counts)
   * - Error summary grouped by field name (to show "12 rows missing product_id")
   * - Configurable early termination (stop after N errors)
   * - Duplicate detection across the entire batch
   * - Cross-row validation (e.g., no duplicate order IDs)
   *
   * @param rows - Array of mapped rows to validate
   * @param uploadType - The type of upload
   * @returns Batch validation result with per-row results and summary
   */
  validateAll(rows: MappedRow[], uploadType: string): BatchValidationResult {
    // TODO: Add configurable max error count for early termination
    // TODO: Add duplicate detection across rows (e.g., same product + date + outlet)
    // TODO: Add cross-row validation rules
    // TODO: Add performance optimization for large batches (>100k rows)
    const results: ValidationResult[] = [];
    const errorSummary: Record<string, number> = {};
    let validRows = 0;
    let errorRows = 0;
    let warningRows = 0;

    for (const row of rows) {
      const result = this.validateRow(row, uploadType);
      results.push(result);

      if (result.isValid) {
        const hasWarnings = result.errors.some((e) => e.severity === 'warning');
        if (hasWarnings) {
          warningRows++;
        } else {
          validRows++;
        }
      } else {
        errorRows++;
      }

      // Build error summary
      for (const error of result.errors) {
        if (error.severity === 'error') {
          errorSummary[error.field] = (errorSummary[error.field] || 0) + 1;
        }
      }
    }

    return {
      isValid: errorRows === 0,
      totalRows: rows.length,
      validRows,
      errorRows,
      warningRows,
      results,
      errorSummary,
    };
  }
}
