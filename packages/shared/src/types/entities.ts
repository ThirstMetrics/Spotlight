// =============================================================================
// Entity Types — Plain TypeScript interfaces matching Prisma schema
// =============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum Category {
  BEER = 'BEER',
  WINE = 'WINE',
  SPIRITS = 'SPIRITS',
  SAKE = 'SAKE',
  NON_ALCOHOLIC = 'NON_ALCOHOLIC',
}

export enum RoleType {
  VP = 'VP',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
  ROOM_MANAGER = 'ROOM_MANAGER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  SUPPLIER = 'SUPPLIER',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum MandateComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PENDING = 'PENDING',
}

export enum UploadStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ---------------------------------------------------------------------------
// Organization & Access
// ---------------------------------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  groupId?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Outlet {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutletGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  outletIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: RoleType;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  roleName: RoleType;
  organizationId?: string;
  outletIds?: string[];
  distributorId?: string;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Products & Partners
// ---------------------------------------------------------------------------

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  subcategory?: string;
  brand?: string;
  size: string;
  unit: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Distributor {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistributorProduct {
  id: string;
  distributorId: string;
  productId: string;
  supplierId?: string;
  distributorSku?: string;
  cost: number;
  effectiveDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCatalog {
  id: string;
  productId: string;
  replacementProductId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Mandates & Compliance
// ---------------------------------------------------------------------------

export interface Mandate {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  effectiveDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MandateItem {
  id: string;
  mandateId: string;
  productId: string;
  outletIds: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MandateCompliance {
  id: string;
  mandateItemId: string;
  outletId: string;
  status: MandateComplianceStatus;
  firstOrderDate?: Date;
  lastOrderDate?: Date;
  lastCheckedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Inventory & Orders
// ---------------------------------------------------------------------------

export interface WarehouseTransfer {
  id: string;
  organizationId: string;
  outletId: string;
  productId: string;
  quantity: number;
  unit: string;
  cost: number;
  transferDate: Date;
  uploadId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DirectOrder {
  id: string;
  organizationId: string;
  outletId: string;
  productId: string;
  distributorId: string;
  quantity: number;
  unit: string;
  cost: number;
  orderDate: Date;
  deliveryDate?: Date;
  uploadId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventorySnapshot {
  id: string;
  outletId: string;
  productId: string;
  quantity: number;
  unit: string;
  snapshotDate: Date;
  createdAt: Date;
}

export interface OrderHistory {
  id: string;
  organizationId: string;
  outletId: string;
  productId: string;
  distributorId: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  orderDate: Date;
  uploadId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Sales & Margins
// ---------------------------------------------------------------------------

export interface SalesData {
  id: string;
  outletId: string;
  productId: string;
  quantity: number;
  revenue: number;
  saleDate: Date;
  posSource: string;
  uploadId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category: string;
  yield: number;
  yieldUnit: string;
  instructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  productId: string;
  quantity: number;
  unit: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostGoal {
  id: string;
  organizationId: string;
  outletId?: string;
  outletGroupId?: string;
  category?: Category;
  targetCostPercentage: number;
  effectiveDate: Date;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceTracking {
  id: string;
  outletId: string;
  productId: string;
  menuPrice: number;
  effectiveDate: Date;
  previousPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Alerts & Notifications
// ---------------------------------------------------------------------------

export interface AlertRule {
  id: string;
  organizationId: string;
  name: string;
  alertType: string;
  severity: string;
  isActive: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  alertRuleId: string;
  organizationId: string;
  outletId?: string;
  productId?: string;
  status: AlertStatus;
  title: string;
  message: string;
  data: Record<string, unknown>;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashMessage {
  id: string;
  organizationId: string;
  fromUserId: string;
  toUserId?: string;
  outletId?: string;
  subject: string;
  body: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface PortalSession {
  id: string;
  userId: string;
  loginAt: Date;
  logoutAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface PortalInteraction {
  id: string;
  sessionId: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface HotelOccupancy {
  id: string;
  organizationId: string;
  date: Date;
  hotelGuests: number;
  restaurantCovers: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Data Ingestion
// ---------------------------------------------------------------------------

export interface Upload {
  id: string;
  organizationId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadType: string;
  source: string;
  status: UploadStatus;
  totalRows?: number;
  processedRows?: number;
  failedRows?: number;
  errors?: Record<string, unknown>[];
  mappingProfileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMappingProfile {
  id: string;
  organizationId: string;
  name: string;
  source: string;
  uploadType: string;
  mappings: { sourceColumn: string; targetField: string; transform?: string }[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
