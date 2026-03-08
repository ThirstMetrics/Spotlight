/**
 * Parse real Caesars Palace data from master XLSX file
 * Extracts distributors, suppliers, products, and costs
 */
import * as XLSX from "xlsx";
import * as fs from "fs";

const FILE = "/Users/thirstmetricsm1/Claude_Spotlight/Spotlight/Spotlight data sets analysis copy.xlsx";

const wb = XLSX.readFile(FILE);
console.log("Sheets:", wb.SheetNames);

// Parse each sheet
const result: Record<string, unknown> = {};

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  console.log(`\n=== ${name} === (${data.length} rows)`);
  if (data.length > 0) {
    console.log("Columns:", Object.keys(data[0] as object));
    // Print first 3 rows
    for (let i = 0; i < Math.min(3, data.length); i++) {
      console.log(`  Row ${i}:`, JSON.stringify(data[i]).slice(0, 300));
    }
  }
  result[name] = data;
}

// Extract key data
// 1. Distributor Table
const distSheet = result["Distributor Table"] as Record<string, string>[];
if (distSheet) {
  console.log("\n\n=== DISTRIBUTORS ===");
  for (const row of distSheet) {
    console.log(JSON.stringify(row));
  }
}

// 2. KPI
const kpiSheet = result["KPI"] as Record<string, unknown>[];
if (kpiSheet) {
  console.log("\n\n=== KPI (first 20) ===");
  for (let i = 0; i < Math.min(20, kpiSheet.length); i++) {
    console.log(JSON.stringify(kpiSheet[i]));
  }
}

// 3. Combined Supplier - unique supplier names
const combinedSheet = result["Combined Supplier"] as Record<string, string>[];
if (combinedSheet) {
  const suppliers = new Map<string, number>();
  for (const row of combinedSheet) {
    const name = row["Supplier"] || row["supplier"] || row["SUPPLIER"] || "";
    if (name) suppliers.set(name, (suppliers.get(name) || 0) + 1);
  }
  console.log("\n\n=== TOP SUPPLIERS (by product count) ===");
  const sorted = [...suppliers.entries()].sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sorted.slice(0, 50)) {
    console.log(`  ${name}: ${count} products`);
  }
  console.log(`\nColumns: ${Object.keys(combinedSheet[0] || {}).join(", ")}`);
  console.log("Sample row:", JSON.stringify(combinedSheet[0]).slice(0, 500));
}

// 4. Southern Supplier Sheet - products with costs
const southernSheet = result["Southern Supplier Sheet"] as Record<string, unknown>[];
if (southernSheet) {
  console.log("\n\n=== SOUTHERN SUPPLIER SHEET ===");
  console.log(`Columns: ${Object.keys(southernSheet[0] || {}).join(", ")}`);
  for (let i = 0; i < Math.min(10, southernSheet.length); i++) {
    console.log(`  Row ${i}:`, JSON.stringify(southernSheet[i]).slice(0, 400));
  }
}

// 5. CP Issues - real purchase data with distributors
const issuesSheet = result["CP Issues"] as Record<string, unknown>[];
if (issuesSheet) {
  console.log("\n\n=== CP ISSUES ===");
  console.log(`Columns: ${Object.keys(issuesSheet[0] || {}).join(", ")}`);
  for (let i = 0; i < Math.min(5, issuesSheet.length); i++) {
    console.log(`  Row ${i}:`, JSON.stringify(issuesSheet[i]).slice(0, 400));
  }
  // Unique distributors from issues
  const dists = new Set<string>();
  const supps = new Set<string>();
  const outlets = new Set<string>();
  for (const row of issuesSheet) {
    const d = String(row["Distributor"] || row["distributor"] || row["DISTRIBUTOR"] || row["Wholesaler"] || row["wholesaler"] || "");
    const s = String(row["Supplier"] || row["supplier"] || row["SUPPLIER"] || "");
    const o = String(row["Outlet"] || row["outlet"] || row["Department"] || row["department"] || "");
    if (d) dists.add(d);
    if (s) supps.add(s);
    if (o) outlets.add(o);
  }
  console.log("\nUnique distributors:", [...dists].slice(0, 30));
  console.log("\nUnique suppliers:", [...supps].slice(0, 50));
  console.log("\nUnique outlets:", [...outlets].slice(0, 20));
}

// 6. Outlet Table
const outletSheet = result["Outlet Table"] as Record<string, string>[];
if (outletSheet) {
  console.log("\n\n=== OUTLET TABLE ===");
  console.log(`Columns: ${Object.keys(outletSheet[0] || {}).join(", ")}`);
  for (let i = 0; i < Math.min(20, outletSheet.length); i++) {
    console.log(JSON.stringify(outletSheet[i]));
  }
}
