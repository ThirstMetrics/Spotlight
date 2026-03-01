// =============================================================================
// Application Constants
// =============================================================================

import { Category } from './types/entities';
import { AlertType, AlertSeverity } from './types/alerts';
import { UserRoleType } from './types/roles';
import { UploadSource, UploadType } from './types/uploads';

// ---------------------------------------------------------------------------
// Enum Value Arrays — useful for dropdowns, validation, iteration
// ---------------------------------------------------------------------------

/** All product categories. */
export const CATEGORIES = Object.values(Category);

/** All user role types. */
export const ROLES = Object.values(UserRoleType);

/** All alert types. */
export const ALERT_TYPES = Object.values(AlertType);

/** All alert severity levels. */
export const ALERT_SEVERITIES = Object.values(AlertSeverity);

/** All supported upload sources. */
export const UPLOAD_SOURCES = Object.values(UploadSource);

/** All upload data types. */
export const UPLOAD_TYPES = Object.values(UploadType);

// ---------------------------------------------------------------------------
// Pagination Defaults
// ---------------------------------------------------------------------------

/** Default number of items per page in paginated responses. */
export const DEFAULT_PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// File Upload Limits
// ---------------------------------------------------------------------------

/** Maximum upload file size in bytes (50 MB). */
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

/** File extensions accepted for data uploads. */
export const SUPPORTED_FILE_TYPES = ['.csv', '.xlsx', '.xls'];

// ---------------------------------------------------------------------------
// Alert Engine Defaults
// ---------------------------------------------------------------------------

/** Default pull-through high threshold (percentage of historic average). */
export const PULL_THROUGH_HIGH_DEFAULT = 120;

/** Default pull-through low threshold (percentage of historic average). */
export const PULL_THROUGH_LOW_DEFAULT = 80;

/** Default minimum days of inventory before triggering an alert. */
export const DAYS_OF_INVENTORY_DEFAULT = 5;

/** Grace period in days before a mandate item triggers a compliance alert. */
export const MANDATE_GRACE_DAYS = 7;

/** Default threshold for price change alerts (percentage). */
export const PRICE_CHANGE_THRESHOLD = 5;
