/**
 * @spotlight/data-engine
 *
 * CSV/Excel ingestion and field-mapping engine for the Spotlight platform.
 * Handles file parsing, column mapping, data validation, and processing
 * for purchase orders, warehouse transfers, direct orders, and POS sales data.
 */

export { FileParser } from './file-parser';
export type { RawRow, ParseResult } from './file-parser';

export { FieldMapper } from './field-mapper';
export type { MappingProfile, MappedRow, SuggestedMapping } from './field-mapper';

export { DataValidator } from './data-validator';
export type {
  ValidationError,
  ValidationResult,
  BatchValidationResult,
} from './data-validator';

export {
  WarehouseTransferProcessor,
  DirectOrderProcessor,
  SalesDataProcessor,
} from './processors';

export {
  BIRCHSTREET_PRESETS,
  STRATTON_WARREN_PRESETS,
  ORACLE_PRESETS,
  MICROS_PRESETS,
  AGILYSYS_PRESETS,
} from './source-presets';
export type { SourcePreset } from './source-presets';
