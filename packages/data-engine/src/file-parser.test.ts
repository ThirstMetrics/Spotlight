import { describe, it, expect } from "vitest";
import { FileParser } from "./file-parser";

describe("FileParser", () => {
  const parser = new FileParser();

  // ---------------------------------------------------------------------------
  // detectFileType
  // ---------------------------------------------------------------------------
  describe("detectFileType", () => {
    it("detects XLSX from PK zip header", () => {
      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      expect(parser.detectFileType(buffer)).toBe("xlsx");
    });

    it("detects XLS from compound document header", () => {
      const buffer = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1]);
      expect(parser.detectFileType(buffer)).toBe("xls");
    });

    it("defaults to CSV for plain text", () => {
      const buffer = Buffer.from("sku,name,qty\nABC,Test,10");
      expect(parser.detectFileType(buffer)).toBe("csv");
    });
  });

  // ---------------------------------------------------------------------------
  // parseCSV
  // ---------------------------------------------------------------------------
  describe("parseCSV", () => {
    it("parses CSV with header row", async () => {
      const csv = "SKU,Product Name,Quantity\nABC001,Tito's Vodka,12\nDEF002,Hennessy VS,6";
      const rows = await parser.parseCSV(csv);

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        SKU: "ABC001",
        "Product Name": "Tito's Vodka",
        Quantity: 12, // dynamic typing
      });
      expect(rows[1].SKU).toBe("DEF002");
    });

    it("trims header whitespace", async () => {
      const csv = " SKU , Name , Qty \nABC,Test,5";
      const rows = await parser.parseCSV(csv);

      expect(Object.keys(rows[0])).toEqual(["SKU", "Name", "Qty"]);
    });

    it("skips empty rows", async () => {
      const csv = "SKU,Name\nABC,Test\n\n\nDEF,Other\n";
      const rows = await parser.parseCSV(csv);

      expect(rows).toHaveLength(2);
    });

    it("handles dynamic typing for numbers", async () => {
      const csv = "name,price,qty\nTest,25.50,10";
      const rows = await parser.parseCSV(csv);

      expect(rows[0].price).toBe(25.5);
      expect(rows[0].qty).toBe(10);
      expect(typeof rows[0].price).toBe("number");
    });
  });

  // ---------------------------------------------------------------------------
  // parse (unified entry point)
  // ---------------------------------------------------------------------------
  describe("parse", () => {
    it("parses CSV file and returns ParseResult", async () => {
      const content = Buffer.from(
        "sku,outlet,quantity,cost\nABC,Carversteak,12,25.50\nDEF,Pool Bar,6,18.00"
      );
      const result = await parser.parse({ name: "data.csv", content });

      expect(result.rows).toHaveLength(2);
      expect(result.headers).toEqual(["sku", "outlet", "quantity", "cost"]);
      expect(result.totalRows).toBe(2);
      expect(result.sheetName).toBeUndefined();
    });

    it("returns empty headers for empty CSV", async () => {
      const content = Buffer.from("");
      const result = await parser.parse({ name: "empty.csv", content });

      expect(result.rows).toHaveLength(0);
      expect(result.headers).toEqual([]);
    });
  });
});
