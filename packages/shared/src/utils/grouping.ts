// =============================================================================
// Data Grouping Utilities
// =============================================================================

/**
 * Group items by their category field.
 *
 * @param items - Array of items each having a `category` string field.
 * @returns Record keyed by category with arrays of matching items.
 */
export function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = item.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Group items by their distributorId field.
 *
 * @param items - Array of items each having a `distributorId` string field.
 * @returns Record keyed by distributorId with arrays of matching items.
 */
export function groupByDistributor<T extends { distributorId: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = item.distributorId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Group items by their supplierId field.
 *
 * @param items - Array of items each having a `supplierId` string field.
 * @returns Record keyed by supplierId with arrays of matching items.
 */
export function groupBySupplier<T extends { supplierId: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = item.supplierId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Group items by their outletId field.
 *
 * @param items - Array of items each having an `outletId` string field.
 * @returns Record keyed by outletId with arrays of matching items.
 */
export function groupByOutlet<T extends { outletId: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = item.outletId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Group items by month (YYYY-MM format).
 *
 * @param items     - Array of items with a date field.
 * @param dateField - The key of the date field to group by (default: 'date').
 * @returns Record keyed by YYYY-MM string with arrays of matching items.
 */
export function groupByMonth<T extends { date: Date | string }>(
  items: T[],
  dateField?: keyof T
): Record<string, T[]> {
  const field = dateField ?? ('date' as keyof T);

  return items.reduce<Record<string, T[]>>((acc, item) => {
    const dateValue = item[field] as unknown as Date | string;
    const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}
