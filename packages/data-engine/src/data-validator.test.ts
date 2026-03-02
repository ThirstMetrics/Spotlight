import { describe, it, expect } from "vitest";
import { DataValidator } from "./data-validator";

describe("DataValidator", () => {
  const validator = new DataValidator();

  // ---------------------------------------------------------------------------
  // validateRow
  // ---------------------------------------------------------------------------
  describe("validateRow", () => {
    it("passes valid warehouse_transfer row", () => {
      const row = {
        product_id: "prod-1",
        outlet_id: "out-1",
        quantity: 12,
        transfer_date: "2025-12-01",
      };

      const result = validator.validateRow(row, "warehouse_transfer");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("fails on missing required fields", () => {
      const row = {
        product_id: "prod-1",
        // missing outlet_id, quantity, transfer_date
      };

      const result = validator.validateRow(row, "warehouse_transfer");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);

      const fieldNames = result.errors.map((e) => e.field);
      expect(fieldNames).toContain("outlet_id");
      expect(fieldNames).toContain("quantity");
      expect(fieldNames).toContain("transfer_date");
    });

    it("fails on empty required field values", () => {
      const row = {
        product_id: "",
        outlet_id: null,
        quantity: undefined,
        transfer_date: "2025-12-01",
      };

      const result = validator.validateRow(row, "warehouse_transfer");

      expect(result.isValid).toBe(false);
      const fieldNames = result.errors.map((e) => e.field);
      expect(fieldNames).toContain("product_id");
      expect(fieldNames).toContain("outlet_id");
    });

    it("validates numeric fields", () => {
      const row = {
        product_id: "prod-1",
        outlet_id: "out-1",
        quantity: "not-a-number",
        transfer_date: "2025-12-01",
      };

      const result = validator.validateRow(row, "warehouse_transfer");

      expect(result.isValid).toBe(false);
      const numError = result.errors.find((e) => e.field === "quantity");
      expect(numError).toBeDefined();
      expect(numError!.severity).toBe("error");
    });

    it("warns on negative numeric values", () => {
      const row = {
        product_id: "prod-1",
        outlet_id: "out-1",
        quantity: -5,
        transfer_date: "2025-12-01",
      };

      const result = validator.validateRow(row, "warehouse_transfer");

      // Negative is warning, not error — row is still valid
      expect(result.isValid).toBe(true);
      const warning = result.errors.find(
        (e) => e.field === "quantity" && e.severity === "warning"
      );
      expect(warning).toBeDefined();
    });

    it("validates date fields", () => {
      const row = {
        product_id: "prod-1",
        outlet_id: "out-1",
        quantity: 10,
        transfer_date: "not-a-date",
      };

      const result = validator.validateRow(row, "warehouse_transfer");

      expect(result.isValid).toBe(false);
      const dateError = result.errors.find((e) => e.field === "transfer_date");
      expect(dateError).toBeDefined();
    });

    it("validates sales_data required fields", () => {
      const row = {
        product_id: "prod-1",
        outlet_id: "out-1",
        quantity_sold: 5,
        revenue: 125.0,
        sale_date: "2025-12-01",
      };

      const result = validator.validateRow(row, "sales_data");
      expect(result.isValid).toBe(true);
    });

    it("handles unknown upload type gracefully (no required fields)", () => {
      const row = { someField: "value" };
      const result = validator.validateRow(row, "unknown_type");

      expect(result.isValid).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // validateAll
  // ---------------------------------------------------------------------------
  describe("validateAll", () => {
    it("returns valid batch result for all valid rows", () => {
      const rows = [
        {
          product_id: "p1",
          outlet_id: "o1",
          quantity: 10,
          transfer_date: "2025-12-01",
        },
        {
          product_id: "p2",
          outlet_id: "o2",
          quantity: 20,
          transfer_date: "2025-12-02",
        },
      ];

      const result = validator.validateAll(rows, "warehouse_transfer");

      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.errorRows).toBe(0);
      expect(result.warningRows).toBe(0);
    });

    it("counts error rows correctly", () => {
      const rows = [
        {
          product_id: "p1",
          outlet_id: "o1",
          quantity: 10,
          transfer_date: "2025-12-01",
        },
        {
          product_id: "",
          outlet_id: "",
          quantity: "bad",
          transfer_date: "invalid",
        },
        {
          product_id: "p3",
          outlet_id: "o3",
          quantity: 30,
          transfer_date: "2025-12-03",
        },
      ];

      const result = validator.validateAll(rows, "warehouse_transfer");

      expect(result.isValid).toBe(false);
      expect(result.totalRows).toBe(3);
      expect(result.validRows).toBe(2);
      expect(result.errorRows).toBe(1);
    });

    it("builds error summary by field name", () => {
      const rows = [
        { product_id: "", quantity: 10, transfer_date: "2025-12-01" },
        { product_id: "", quantity: 5, transfer_date: "2025-12-02" },
      ];

      const result = validator.validateAll(rows, "warehouse_transfer");

      // product_id missing in both rows, outlet_id missing in both rows
      expect(result.errorSummary.product_id).toBe(2);
      expect(result.errorSummary.outlet_id).toBe(2);
    });

    it("counts warning rows separately from errors", () => {
      const rows = [
        {
          product_id: "p1",
          outlet_id: "o1",
          quantity: -5, // warning
          transfer_date: "2025-12-01",
        },
      ];

      const result = validator.validateAll(rows, "warehouse_transfer");

      expect(result.isValid).toBe(true);
      expect(result.warningRows).toBe(1);
      expect(result.errorRows).toBe(0);
    });
  });
});
