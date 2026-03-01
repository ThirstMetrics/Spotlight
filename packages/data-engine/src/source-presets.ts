/**
 * A source preset defines the known column mappings for a specific
 * inventory or POS system export format. These presets are used to
 * auto-suggest field mappings when a user uploads a file from a known source.
 */
export interface SourcePreset {
  /** Identifier for this source system */
  sourceSystem: string;
  /** Human-readable name */
  displayName: string;
  /** Upload types this preset applies to */
  uploadTypes: string[];
  /**
   * Known column mappings: key = common source column name (case-insensitive),
   * value = internal schema target field name
   */
  columnMappings: Record<string, string>;
  /**
   * Common aliases for columns in this source system.
   * Multiple source names can map to the same target field.
   */
  aliases?: Record<string, string[]>;
}

/**
 * BirchStreet purchasing system preset.
 *
 * TODO: Verify these column names against actual BirchStreet CSV/Excel exports.
 * BirchStreet is used for purchase orders and warehouse transfers at
 * properties like Resorts World Las Vegas.
 */
export const BIRCHSTREET_PRESETS: SourcePreset = {
  sourceSystem: 'birchstreet',
  displayName: 'BirchStreet',
  uploadTypes: ['purchase_order', 'warehouse_transfer'],
  columnMappings: {
    'Item Number': 'product_id',
    'Item Description': 'product_name',
    'Category': 'category',
    'Sub Category': 'subcategory',
    'Vendor': 'distributor_name',
    'Vendor Number': 'distributor_id',
    'Unit of Measure': 'unit',
    'Pack Size': 'pack_size',
    'Quantity': 'quantity',
    'Unit Price': 'unit_cost',
    'Extended Price': 'total_cost',
    'PO Number': 'order_number',
    'PO Date': 'order_date',
    'Delivery Date': 'delivery_date',
    'Location': 'outlet_name',
    'Location Code': 'outlet_id',
    'Warehouse': 'warehouse_name',
    'Transfer Date': 'transfer_date',
  },
  aliases: {
    product_id: ['Item Number', 'Item #', 'Item No', 'SKU', 'Item Code'],
    product_name: ['Item Description', 'Description', 'Item Name', 'Product'],
    quantity: ['Quantity', 'Qty', 'QTY', 'Order Qty', 'Transfer Qty'],
    unit_cost: ['Unit Price', 'Unit Cost', 'Cost', 'Price'],
    order_date: ['PO Date', 'Order Date', 'Date', 'Created Date'],
  },
};

/**
 * Stratton Warren purchasing system preset.
 *
 * TODO: Verify these column names against actual Stratton Warren exports.
 * Stratton Warren is an alternative purchasing system used by some
 * hotel and casino properties.
 */
export const STRATTON_WARREN_PRESETS: SourcePreset = {
  sourceSystem: 'stratton_warren',
  displayName: 'Stratton Warren',
  uploadTypes: ['purchase_order', 'warehouse_transfer'],
  columnMappings: {
    'Stock Code': 'product_id',
    'Stock Description': 'product_name',
    'Group': 'category',
    'Supplier': 'distributor_name',
    'Supplier Code': 'distributor_id',
    'UOM': 'unit',
    'Qty': 'quantity',
    'Price': 'unit_cost',
    'Value': 'total_cost',
    'Requisition No': 'order_number',
    'Requisition Date': 'order_date',
    'Delivery Location': 'outlet_name',
    'Cost Centre': 'outlet_id',
    'Issue Date': 'transfer_date',
    'Issue Qty': 'transfer_quantity',
  },
  aliases: {
    product_id: ['Stock Code', 'Stock No', 'Material Code', 'Item Code'],
    product_name: ['Stock Description', 'Material Description', 'Item Description'],
    quantity: ['Qty', 'Quantity', 'Order Qty', 'Req Qty'],
    unit_cost: ['Price', 'Unit Price', 'Cost Price', 'Unit Cost'],
    order_date: ['Requisition Date', 'Order Date', 'Req Date'],
  },
};

/**
 * Oracle purchasing system preset.
 *
 * TODO: Verify these column names against actual Oracle purchasing exports.
 * Oracle is commonly used in larger enterprise hotel environments.
 */
export const ORACLE_PRESETS: SourcePreset = {
  sourceSystem: 'oracle',
  displayName: 'Oracle Purchasing',
  uploadTypes: ['purchase_order', 'warehouse_transfer'],
  columnMappings: {
    'ITEM_NUM': 'product_id',
    'ITEM_DESCRIPTION': 'product_name',
    'CATEGORY_SEGMENT1': 'category',
    'CATEGORY_SEGMENT2': 'subcategory',
    'VENDOR_NAME': 'distributor_name',
    'VENDOR_NUM': 'distributor_id',
    'UNIT_MEAS_LOOKUP_CODE': 'unit',
    'QUANTITY': 'quantity',
    'UNIT_PRICE': 'unit_cost',
    'AMOUNT': 'total_cost',
    'PO_NUM': 'order_number',
    'CREATION_DATE': 'order_date',
    'PROMISED_DATE': 'delivery_date',
    'SHIP_TO_LOCATION': 'outlet_name',
    'SHIP_TO_LOCATION_CODE': 'outlet_id',
    'SUBINVENTORY': 'warehouse_name',
    'TRANSACTION_DATE': 'transfer_date',
  },
  aliases: {
    product_id: ['ITEM_NUM', 'ITEM_NUMBER', 'ITEM_ID', 'INVENTORY_ITEM_ID'],
    product_name: ['ITEM_DESCRIPTION', 'DESCRIPTION', 'ITEM_DESC'],
    quantity: ['QUANTITY', 'QTY', 'ORDERED_QUANTITY', 'SHIPPED_QUANTITY'],
    unit_cost: ['UNIT_PRICE', 'LIST_PRICE', 'PRICE'],
    order_date: ['CREATION_DATE', 'ORDER_DATE', 'PO_DATE'],
  },
};

/**
 * Micros POS system preset.
 *
 * TODO: Verify these column names against actual Micros POS exports.
 * Micros (Oracle Hospitality) is the dominant POS system in hotel
 * food & beverage. Exports are typically Excel format.
 */
export const MICROS_PRESETS: SourcePreset = {
  sourceSystem: 'micros',
  displayName: 'Micros POS',
  uploadTypes: ['sales_data'],
  columnMappings: {
    'Menu Item Number': 'product_id',
    'Menu Item Name': 'product_name',
    'Major Group': 'category',
    'Family Group': 'subcategory',
    'Revenue Center': 'outlet_name',
    'RVC Number': 'outlet_id',
    'Quantity Sold': 'quantity_sold',
    'Net Sales': 'revenue',
    'Gross Sales': 'gross_revenue',
    'Discount Amount': 'discount_amount',
    'Tax Amount': 'tax_amount',
    'Business Date': 'sale_date',
    'Check Number': 'check_number',
    'Server': 'server_name',
    'Order Type': 'order_type',
  },
  aliases: {
    product_id: ['Menu Item Number', 'MI Number', 'Item Num', 'PLU'],
    product_name: ['Menu Item Name', 'MI Name', 'Item Name', 'Menu Item'],
    quantity_sold: ['Quantity Sold', 'Qty Sold', 'Count', 'Qty'],
    revenue: ['Net Sales', 'Net Revenue', 'Sales Amount', 'Revenue'],
    sale_date: ['Business Date', 'Date', 'Trans Date', 'Transaction Date'],
    outlet_name: ['Revenue Center', 'RVC', 'RVC Name', 'Location'],
  },
};

/**
 * Agilysys POS system preset.
 *
 * TODO: Verify these column names against actual Agilysys POS exports.
 * Agilysys is used by several casino and resort properties as their
 * POS system. Exports are typically CSV or Excel format.
 */
export const AGILYSYS_PRESETS: SourcePreset = {
  sourceSystem: 'agilysys',
  displayName: 'Agilysys POS',
  uploadTypes: ['sales_data'],
  columnMappings: {
    'Item ID': 'product_id',
    'Item Name': 'product_name',
    'Department': 'category',
    'Sub Department': 'subcategory',
    'Outlet': 'outlet_name',
    'Outlet ID': 'outlet_id',
    'Qty': 'quantity_sold',
    'Sales': 'revenue',
    'Gross Amount': 'gross_revenue',
    'Discounts': 'discount_amount',
    'Tax': 'tax_amount',
    'Date': 'sale_date',
    'Check #': 'check_number',
    'Cashier': 'server_name',
    'Tender Type': 'tender_type',
  },
  aliases: {
    product_id: ['Item ID', 'Item Number', 'Item #', 'SKU', 'PLU'],
    product_name: ['Item Name', 'Description', 'Item Description', 'Product Name'],
    quantity_sold: ['Qty', 'Quantity', 'Qty Sold', 'Units Sold'],
    revenue: ['Sales', 'Net Sales', 'Amount', 'Revenue', 'Total'],
    sale_date: ['Date', 'Business Date', 'Trans Date', 'Sale Date'],
    outlet_name: ['Outlet', 'Dept', 'Department', 'Location'],
  },
};

/**
 * All available source presets indexed by source system identifier.
 *
 * TODO: Add ability to load custom presets from the database (organization-specific).
 */
export const ALL_PRESETS: Record<string, SourcePreset> = {
  birchstreet: BIRCHSTREET_PRESETS,
  stratton_warren: STRATTON_WARREN_PRESETS,
  oracle: ORACLE_PRESETS,
  micros: MICROS_PRESETS,
  agilysys: AGILYSYS_PRESETS,
};
