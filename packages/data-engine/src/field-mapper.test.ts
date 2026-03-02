import { describe, it, expect } from "vitest";
import { FieldMapper } from "./field-mapper";
import type { MappingProfile } from "./field-mapper";

describe("FieldMapper", () => {
  const testProfile: MappingProfile = {
    id: "profile-1",
    name: "BirchStreet PO Export",
    sourceSystem: "birchstreet",
    mappings: {
      "Item Code": "sku",
      "Item Description": "productName",
      "Ship To": "outlet",
      "Qty": "quantity",
      "Unit Price": "costPerUnit",
    },
  };

  // ---------------------------------------------------------------------------
  // mapRow
  // ---------------------------------------------------------------------------
  describe("mapRow", () => {
    it("throws if no profile is set", () => {
      const mapper = new FieldMapper();
      expect(() => mapper.mapRow({ a: 1 })).toThrow("No mapping profile set");
    });

    it("maps source columns to target fields", () => {
      const mapper = new FieldMapper(testProfile);
      const row = {
        "Item Code": "TIT001",
        "Item Description": "Tito's Vodka",
        "Ship To": "Carversteak",
        Qty: 12,
        "Unit Price": 22.5,
      };

      const result = mapper.mapRow(row);

      expect(result.sku).toBe("TIT001");
      expect(result.productName).toBe("Tito's Vodka");
      expect(result.outlet).toBe("Carversteak");
      expect(result.quantity).toBe(12);
      expect(result.costPerUnit).toBe(22.5);
    });

    it("sets missing source columns to null", () => {
      const mapper = new FieldMapper(testProfile);
      const row = { "Item Code": "ABC" };

      const result = mapper.mapRow(row);

      expect(result.sku).toBe("ABC");
      expect(result.productName).toBeNull();
      expect(result.quantity).toBeNull();
    });

    it("works with setProfile()", () => {
      const mapper = new FieldMapper();
      mapper.setProfile(testProfile);
      const row = { "Item Code": "XYZ" };

      const result = mapper.mapRow(row);
      expect(result.sku).toBe("XYZ");
    });
  });

  // ---------------------------------------------------------------------------
  // mapAll
  // ---------------------------------------------------------------------------
  describe("mapAll", () => {
    it("maps all rows in a batch", () => {
      const mapper = new FieldMapper(testProfile);
      const rows = [
        { "Item Code": "A", Qty: 10 },
        { "Item Code": "B", Qty: 20 },
        { "Item Code": "C", Qty: 30 },
      ];

      const results = mapper.mapAll(rows);

      expect(results).toHaveLength(3);
      expect(results[0].sku).toBe("A");
      expect(results[1].quantity).toBe(20);
      expect(results[2].sku).toBe("C");
    });
  });

  // ---------------------------------------------------------------------------
  // getSuggestedMappings
  // ---------------------------------------------------------------------------
  describe("getSuggestedMappings", () => {
    it("returns exact matches with confidence 1.0", () => {
      const mapper = new FieldMapper();
      const suggestions = mapper.getSuggestedMappings(
        ["sku", "quantity"],
        ["sku", "quantity", "outlet"]
      );

      const skuMatch = suggestions.find(
        (s) => s.sourceColumn === "sku" && s.targetField === "sku"
      );
      expect(skuMatch).toBeDefined();
      expect(skuMatch!.confidence).toBe(1.0);
    });

    it("handles case-insensitive and underscore normalization", () => {
      const mapper = new FieldMapper();
      const suggestions = mapper.getSuggestedMappings(
        ["Product Name", "Unit_Cost"],
        ["product_name", "unit_cost"]
      );

      const nameMatch = suggestions.find(
        (s) => s.sourceColumn === "Product Name" && s.targetField === "product_name"
      );
      expect(nameMatch).toBeDefined();
      expect(nameMatch!.confidence).toBe(1.0);
    });

    it("returns contains matches with confidence 0.7", () => {
      const mapper = new FieldMapper();
      const suggestions = mapper.getSuggestedMappings(
        ["item_description"],
        ["description"]
      );

      const match = suggestions.find(
        (s) => s.sourceColumn === "item_description" && s.targetField === "description"
      );
      expect(match).toBeDefined();
      expect(match!.confidence).toBe(0.7);
    });

    it("sorts results by confidence descending", () => {
      const mapper = new FieldMapper();
      const suggestions = mapper.getSuggestedMappings(
        ["quantity", "item_quantity"],
        ["quantity"]
      );

      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      // Exact match should be first
      expect(suggestions[0].confidence).toBeGreaterThanOrEqual(suggestions[1].confidence);
    });

    it("returns empty for no matches", () => {
      const mapper = new FieldMapper();
      const suggestions = mapper.getSuggestedMappings(
        ["xyz_column"],
        ["abc_field"]
      );

      expect(suggestions).toHaveLength(0);
    });
  });
});
