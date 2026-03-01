// =============================================================================
// Upload & Data Ingestion Types
// =============================================================================

/**
 * Supported data source systems for file uploads.
 */
export enum UploadSource {
  BIRCHSTREET = 'BIRCHSTREET',
  STRATTON_WARREN = 'STRATTON_WARREN',
  ORACLE = 'ORACLE',
  MICROS = 'MICROS',
  AGILYSYS = 'AGILYSYS',
  TOAST = 'TOAST',
  OTHER = 'OTHER',
}

/**
 * Types of data being uploaded.
 */
export enum UploadType {
  WAREHOUSE_TRANSFER = 'WAREHOUSE_TRANSFER',
  DIRECT_ORDER = 'DIRECT_ORDER',
  SALES_DATA = 'SALES_DATA',
  DISTRIBUTOR_CHART = 'DISTRIBUTOR_CHART',
}

/**
 * A single column mapping from source file to internal schema field.
 */
export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  transform?: string;
}

/**
 * A saved mapping profile for reuse across uploads from the same source.
 */
export interface MappingProfile {
  id: string;
  name: string;
  source: UploadSource;
  uploadType: UploadType;
  mappings: FieldMapping[];
}

/**
 * Result summary returned after processing an upload.
 */
export interface UploadResult {
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors: ValidationError[];
}

/**
 * Validation error for a specific row/field during upload processing.
 */
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Raw row from an uploaded file before mapping is applied.
 */
export type RawUploadRow = Record<string, unknown>;
