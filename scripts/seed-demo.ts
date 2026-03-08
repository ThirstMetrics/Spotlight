/**
 * Spotlight Demo Data Seeder
 *
 * Creates realistic demo data for Resorts World Las Vegas using REAL
 * distributor, supplier, and product data from Caesars Palace purchasing system.
 *
 * - 1 organization (Resorts World Las Vegas)
 * - 20 outlets (10 mapped from Caesars Palace + 10 new RWLV venues)
 * - 5 distributors (real Nevada distributors)
 * - 15 suppliers (real brand owners)
 * - ~250 products across beer/wine/spirits/sake with real costs
 * - 5 outlet groups (fine dining, casual, nightlife, casino bars, lobby bars)
 * - Realistic outlet-specific product mixes
 * - Sample mandates with compliance data
 * - 12 months of order history with Pool Bar seasonal curve
 * - Sample sales data with seasonal adjustments
 * - Cost goals per outlet
 * - Sample alert rules and alerts
 */

// This script is run via: pnpm db:seed
// It uses Prisma Client to insert data directly

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Pre-computed bcrypt hash for demo password "spotlight123" (10 salt rounds)
const DEMO_PASSWORD_HASH = "$2b$10$EKtuqYO/ckDsdk4XEhWG3.AzEo5abYIwoM.QQUlPL38bjsX0TeJlS";

// ============================================================
// CAESARS -> RESORTS WORLD OUTLET MAPPING
// ============================================================
const OUTLET_MAPPING = {
  "Guy Savoy": {
    name: "Wally's Wine & Spirits",
    type: "Wine Bar",
    slug: "wallys",
  },
  Bacchanal: {
    name: "Crossroads Kitchen",
    type: "Restaurant",
    slug: "crossroads-kitchen",
  },
  "Mesa Grill": {
    name: "Viva",
    type: "Restaurant",
    slug: "viva",
  },
  "Rao's": {
    name: "Stubborn Seed",
    type: "Fine Dining",
    slug: "stubborn-seed",
  },
  OH: {
    name: "Genting Palace",
    type: "Steakhouse",
    slug: "genting-palace",
  },
  "Gordon Ramsay": {
    name: "Famous Foods Street Eats",
    type: "Food Hall",
    slug: "famous-foods",
  },
  Central: {
    name: "Dawg House Saloon",
    type: "Bar & Grill",
    slug: "dawg-house",
  },
  Hyakumi: {
    name: "Alle Lounge on 66",
    type: "Lounge",
    slug: "alle-lounge",
  },
  Venus: {
    name: "Gatsby's Cocktail Lounge",
    type: "Nightlife",
    slug: "gatsbys",
  },
  Pool: {
    name: "Pool Bar & Grill",
    type: "Pool",
    slug: "pool-bar",
  },
};

// ============================================================
// NEW OUTLETS — Additional Resorts World Las Vegas venues
// ============================================================
const NEW_OUTLETS = [
  // === RESTAURANTS ===
  { name: "Zouk Nightclub", type: "Nightclub", slug: "zouk" },
  { name: "Kusa Nori", type: "Restaurant", slug: "kusa-nori" },
  { name: "Junior's", type: "Restaurant", slug: "juniors" },
  { name: "Fuhu", type: "Restaurant", slug: "fuhu" },
  // === BARS ===
  { name: "Conrad Lobby Bar", type: "Lobby Bar", slug: "conrad-lobby" },
  { name: "Crockfords Lobby Bar", type: "Lobby Bar", slug: "crockfords-lobby" },
  { name: "Crystal Bar", type: "Bar", slug: "crystal-bar" },
  { name: "Here Kitty Kitty", type: "Speakeasy", slug: "here-kitty-kitty" },
  { name: "Golden Monkey", type: "Bar", slug: "golden-monkey" },
  { name: "High Limit Bar", type: "Bar", slug: "high-limit-bar" },
];

// ============================================================
// REAL NEVADA DISTRIBUTORS (from Caesars Palace Stratton Warren data)
// ============================================================
const DISTRIBUTORS = [
  {
    name: "Southern Glazer's Wine & Spirits",
    code: "SGWS",
    contactName: "Mike Reynolds",
    contactEmail: "rep@sgws.com",
    contactPhone: "702-555-0101",
  },
  {
    name: "Breakthru Beverage Nevada",
    code: "BREAKTHRU",
    contactName: "Sarah Chen",
    contactEmail: "schen@breakthru.com",
    contactPhone: "702-555-0102",
  },
  {
    name: "Johnson Brothers of Nevada",
    code: "JB",
    contactName: "Tom Martinez",
    contactEmail: "tmartinez@jbnevada.com",
    contactPhone: "702-555-0103",
  },
  {
    name: "Bonanza Beverage Company",
    code: "BONANZA",
    contactName: "Dave Wilson",
    contactEmail: "dwilson@bonanzabev.com",
    contactPhone: "702-555-0104",
  },
  {
    name: "Nevada Beverage Company",
    code: "NEVBEV",
    contactName: "Rick Torres",
    contactEmail: "rtorres@nevadabev.com",
    contactPhone: "702-555-0105",
  },
];

// Distributor index constants for readability
const SGWS = 0;
const BREAKTHRU = 1;
const JB = 2;
const BONANZA = 3;
const NEVBEV = 4;

// ============================================================
// REAL SUPPLIERS (from Caesars Palace data — top suppliers by product count)
// ============================================================
const SUPPLIERS = [
  { name: "Moet Hennessy USA", contactEmail: "orders@moethennessy.com", website: "moethennessy.com" },           // 0
  { name: "Constellation Brands", contactEmail: "orders@cbrands.com", website: "cbrands.com" },                   // 1
  { name: "Diageo", contactEmail: "orders@diageo.com", website: "diageo.com" },                                   // 2
  { name: "Pernod Ricard", contactEmail: "orders@pernod-ricard.com", website: "pernod-ricard.com" },             // 3
  { name: "Ste Michelle Wine Estates", contactEmail: "orders@smwe.com", website: "smwe.com" },                   // 4
  { name: "Bacardi", contactEmail: "orders@bacardi.com", website: "bacardi.com" },                                 // 5
  { name: "Brown-Forman", contactEmail: "orders@brown-forman.com", website: "brown-forman.com" },                 // 6
  { name: "Beam Suntory", contactEmail: "orders@beamsuntory.com", website: "beamsuntory.com" },                   // 7
  { name: "Campari America", contactEmail: "orders@campari.com", website: "camparigroup.com" },                   // 8
  { name: "Sazerac Company", contactEmail: "orders@sazerac.com", website: "sazerac.com" },                       // 9
  { name: "Heaven Hill", contactEmail: "orders@heavenhill.com", website: "heavenhill.com" },                       // 10
  { name: "Anheuser-Busch InBev", contactEmail: "orders@ab-inbev.com", website: "ab-inbev.com" },               // 11
  { name: "Molson Coors", contactEmail: "orders@molsoncoors.com", website: "molsoncoors.com" },                   // 12
  { name: "JFC International", contactEmail: "orders@jfc.com", website: "jfc.com" },                             // 13
  { name: "Sierra Nevada Brewing", contactEmail: "orders@sierranevada.com", website: "sierranevada.com" },       // 14
];

// Supplier index constants
const MOET = 0;
const CONSTELLATION = 1;
const DIAGEO = 2;
const PERNOD = 3;
const STEMICHELLE = 4;
const BACARDI = 5;
const BROWNFORMAN = 6;
const BEAMSUNTORY = 7;
const CAMPARI = 8;
const SAZERAC = 9;
const HEAVENHILL = 10;
const ABINBEV = 11;
const MOLSONCOORS = 12;
const JFC = 13;
const SIERRANEVADA = 14;

// ============================================================
// PRODUCTS — ~250 across beer/wine/spirits/sake
// All costs from real Caesars Palace purchasing / SWS price sheets
// ============================================================
type CategoryType = "BEER" | "WINE" | "SPIRITS" | "SAKE";

interface ProductDef {
  sku: string;
  name: string;
  category: CategoryType;
  subcategory: string;
  size: string;
  unit: string;
  supplierIdx: number;
  distributorIdx: number;
  cost: number;
}

const PRODUCTS: ProductDef[] = [
  // ===== SPIRITS (80 products) =====
  // --- Vodka ---
  { sku: "SP-001", name: "Grey Goose Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIdx: BACARDI, distributorIdx: SGWS, cost: 28.50 },
  { sku: "SP-002", name: "Belvedere Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 30.00 },
  { sku: "SP-003", name: "Ketel One Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 20.47 },
  { sku: "SP-004", name: "Absolut Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 21.38 },
  { sku: "SP-005", name: "Ciroc Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 32.00 },
  { sku: "SP-006", name: "Tito's Handmade Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1.75L", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 24.00 },
  { sku: "SP-007", name: "Skyy Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIdx: CAMPARI, distributorIdx: SGWS, cost: 15.00 },
  { sku: "SP-008", name: "Stolichnaya Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 18.00 },
  { sku: "SP-009", name: "Deep Eddy Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIdx: HEAVENHILL, distributorIdx: SGWS, cost: 16.00 },
  { sku: "SP-010", name: "New Amsterdam Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1.75L", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 14.00 },

  // --- Whiskey / Bourbon ---
  { sku: "SP-011", name: "Jack Daniel's Old No.7", category: "SPIRITS", subcategory: "Whiskey", size: "1L", unit: "bottle", supplierIdx: BROWNFORMAN, distributorIdx: SGWS, cost: 22.00 },
  { sku: "SP-012", name: "Maker's Mark Bourbon", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 26.00 },
  { sku: "SP-013", name: "Woodford Reserve", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIdx: BROWNFORMAN, distributorIdx: SGWS, cost: 34.00 },
  { sku: "SP-014", name: "Bulleit Bourbon", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 24.00 },
  { sku: "SP-015", name: "Knob Creek 9yr", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 32.00 },
  { sku: "SP-016", name: "Buffalo Trace Bourbon", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIdx: SAZERAC, distributorIdx: SGWS, cost: 22.00 },
  { sku: "SP-017", name: "Wild Turkey 101", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIdx: CAMPARI, distributorIdx: BREAKTHRU, cost: 20.00 },
  { sku: "SP-018", name: "Blanton's Single Barrel", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIdx: SAZERAC, distributorIdx: SGWS, cost: 65.00 },
  { sku: "SP-019", name: "Evan Williams Black Label", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIdx: HEAVENHILL, distributorIdx: SGWS, cost: 10.00 },
  { sku: "SP-020", name: "Crown Royal", category: "SPIRITS", subcategory: "Whiskey", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 26.00 },
  { sku: "SP-021", name: "Basil Hayden's Bourbon", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 38.00 },
  { sku: "SP-022", name: "Elijah Craig Small Batch", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIdx: HEAVENHILL, distributorIdx: SGWS, cost: 28.00 },
  { sku: "SP-023", name: "Old Forester 1920", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIdx: BROWNFORMAN, distributorIdx: SGWS, cost: 55.00 },
  { sku: "SP-024", name: "Larceny Bourbon", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIdx: HEAVENHILL, distributorIdx: SGWS, cost: 22.00 },
  { sku: "SP-025", name: "Jim Beam White Label", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 14.00 },
  { sku: "SP-026", name: "Fireball Cinnamon", category: "SPIRITS", subcategory: "Whiskey", size: "1L", unit: "bottle", supplierIdx: SAZERAC, distributorIdx: SGWS, cost: 16.00 },

  // --- Scotch ---
  { sku: "SP-027", name: "Johnnie Walker Black Label", category: "SPIRITS", subcategory: "Scotch", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 32.00 },
  { sku: "SP-028", name: "Johnnie Walker Blue Label", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 180.00 },
  { sku: "SP-029", name: "Macallan 12yr", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 58.00 },
  { sku: "SP-030", name: "Glenlivet 12yr", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 38.00 },
  { sku: "SP-031", name: "Glenfiddich 12yr", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: BREAKTHRU, cost: 42.00 },
  { sku: "SP-032", name: "Chivas Regal 12yr", category: "SPIRITS", subcategory: "Scotch", size: "1L", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 28.00 },
  { sku: "SP-033", name: "Dewar's White Label", category: "SPIRITS", subcategory: "Scotch", size: "1L", unit: "bottle", supplierIdx: BACARDI, distributorIdx: SGWS, cost: 22.70 },
  { sku: "SP-034", name: "Monkey Shoulder", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 28.00 },

  // --- Tequila ---
  { sku: "SP-035", name: "Patron Silver", category: "SPIRITS", subcategory: "Tequila", size: "750ml", unit: "bottle", supplierIdx: BACARDI, distributorIdx: SGWS, cost: 38.63 },
  { sku: "SP-036", name: "Patron Anejo", category: "SPIRITS", subcategory: "Tequila", size: "750ml", unit: "bottle", supplierIdx: BACARDI, distributorIdx: SGWS, cost: 45.33 },
  { sku: "SP-037", name: "Don Julio 1942", category: "SPIRITS", subcategory: "Tequila", size: "750ml", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 135.00 },
  { sku: "SP-038", name: "Casamigos Blanco", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 40.00 },
  { sku: "SP-039", name: "Clase Azul Reposado", category: "SPIRITS", subcategory: "Tequila", size: "750ml", unit: "bottle", supplierIdx: SAZERAC, distributorIdx: BREAKTHRU, cost: 120.00 },
  { sku: "SP-040", name: "Herradura Silver", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIdx: BROWNFORMAN, distributorIdx: SGWS, cost: 28.00 },
  { sku: "SP-041", name: "Espolon Blanco", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIdx: CAMPARI, distributorIdx: BREAKTHRU, cost: 22.00 },
  { sku: "SP-042", name: "Casamigos Reposado", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 45.00 },
  { sku: "SP-043", name: "Jose Cuervo Tradicional Silver", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 18.00 },
  { sku: "SP-044", name: "Milagro Silver", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 22.00 },

  // --- Rum ---
  { sku: "SP-045", name: "Bacardi Superior", category: "SPIRITS", subcategory: "Rum", size: "1L", unit: "bottle", supplierIdx: BACARDI, distributorIdx: SGWS, cost: 14.00 },
  { sku: "SP-046", name: "Captain Morgan Spiced", category: "SPIRITS", subcategory: "Rum", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 16.00 },
  { sku: "SP-047", name: "Malibu Coconut Rum", category: "SPIRITS", subcategory: "Rum", size: "1L", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 15.00 },
  { sku: "SP-048", name: "Ron Zacapa 23yr", category: "SPIRITS", subcategory: "Rum", size: "750ml", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 45.00 },
  { sku: "SP-049", name: "Diplomatico Reserva Exclusiva", category: "SPIRITS", subcategory: "Rum", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 38.00 },
  { sku: "SP-050", name: "Bacardi Gold", category: "SPIRITS", subcategory: "Rum", size: "1L", unit: "bottle", supplierIdx: BACARDI, distributorIdx: SGWS, cost: 14.00 },

  // --- Gin ---
  { sku: "SP-051", name: "Tanqueray London Dry", category: "SPIRITS", subcategory: "Gin", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 22.00 },
  { sku: "SP-052", name: "Hendrick's Gin", category: "SPIRITS", subcategory: "Gin", size: "1L", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 32.00 },
  { sku: "SP-053", name: "Bombay Sapphire", category: "SPIRITS", subcategory: "Gin", size: "1L", unit: "bottle", supplierIdx: BACARDI, distributorIdx: SGWS, cost: 26.96 },
  { sku: "SP-054", name: "Beefeater London Dry", category: "SPIRITS", subcategory: "Gin", size: "1L", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 18.00 },
  { sku: "SP-055", name: "Aviation Gin", category: "SPIRITS", subcategory: "Gin", size: "750ml", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 26.00 },

  // --- Cognac / Brandy ---
  { sku: "SP-056", name: "Hennessy VS", category: "SPIRITS", subcategory: "Cognac", size: "1L", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 38.00 },
  { sku: "SP-057", name: "Hennessy VSOP", category: "SPIRITS", subcategory: "Cognac", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 52.00 },
  { sku: "SP-058", name: "Remy Martin VSOP", category: "SPIRITS", subcategory: "Cognac", size: "750ml", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 37.20 },
  { sku: "SP-059", name: "Courvoisier VS", category: "SPIRITS", subcategory: "Cognac", size: "1L", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 28.00 },
  { sku: "SP-060", name: "Hennessy XO", category: "SPIRITS", subcategory: "Cognac", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 195.00 },

  // --- Liqueurs ---
  { sku: "SP-061", name: "Baileys Irish Cream", category: "SPIRITS", subcategory: "Liqueur", size: "1L", unit: "bottle", supplierIdx: DIAGEO, distributorIdx: SGWS, cost: 22.00 },
  { sku: "SP-062", name: "Grand Marnier", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIdx: CAMPARI, distributorIdx: SGWS, cost: 32.00 },
  { sku: "SP-063", name: "Kahlua", category: "SPIRITS", subcategory: "Liqueur", size: "1L", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 20.00 },
  { sku: "SP-064", name: "Cointreau", category: "SPIRITS", subcategory: "Liqueur", size: "1L", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 28.00 },
  { sku: "SP-065", name: "Aperol", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIdx: CAMPARI, distributorIdx: BREAKTHRU, cost: 22.00 },
  { sku: "SP-066", name: "Campari", category: "SPIRITS", subcategory: "Liqueur", size: "1L", unit: "bottle", supplierIdx: CAMPARI, distributorIdx: BREAKTHRU, cost: 24.00 },
  { sku: "SP-067", name: "St-Germain Elderflower", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIdx: BACARDI, distributorIdx: SGWS, cost: 30.00 },
  { sku: "SP-068", name: "Chambord", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIdx: BROWNFORMAN, distributorIdx: SGWS, cost: 28.00 },
  { sku: "SP-069", name: "Luxardo Maraschino", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 30.00 },
  { sku: "SP-070", name: "Fernet-Branca", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 26.00 },
  { sku: "SP-071", name: "Disaronno Amaretto", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 24.00 },

  // --- Irish ---
  { sku: "SP-072", name: "Jameson Irish Whiskey", category: "SPIRITS", subcategory: "Irish Whiskey", size: "1L", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 25.00 },

  // --- Japanese Whisky ---
  { sku: "SP-073", name: "Suntory Toki", category: "SPIRITS", subcategory: "Japanese Whisky", size: "750ml", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 32.00 },
  { sku: "SP-074", name: "Hibiki Harmony", category: "SPIRITS", subcategory: "Japanese Whisky", size: "750ml", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 65.00 },
  { sku: "SP-075", name: "Yamazaki 12yr", category: "SPIRITS", subcategory: "Japanese Whisky", size: "750ml", unit: "bottle", supplierIdx: BEAMSUNTORY, distributorIdx: BREAKTHRU, cost: 140.00 },
  { sku: "SP-076", name: "Nikka Coffey Grain", category: "SPIRITS", subcategory: "Japanese Whisky", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 60.00 },

  // --- Additional spirits to reach 80 ---
  { sku: "SP-077", name: "Pappy Van Winkle 15yr", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIdx: SAZERAC, distributorIdx: SGWS, cost: 120.00 },
  { sku: "SP-078", name: "Angostura Bitters", category: "SPIRITS", subcategory: "Bitters", size: "200ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 8.00 },
  { sku: "SP-079", name: "Peychaud's Bitters", category: "SPIRITS", subcategory: "Bitters", size: "148ml", unit: "bottle", supplierIdx: SAZERAC, distributorIdx: SGWS, cost: 7.00 },
  { sku: "SP-080", name: "Simple Syrup", category: "SPIRITS", subcategory: "Mixer", size: "1L", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 4.00 },

  // ===== WINE (60 products) =====
  // --- Red Wine ---
  { sku: "WN-001", name: "Caymus Cabernet Sauvignon", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 65.00 },
  { sku: "WN-002", name: "Jordan Cabernet Sauvignon", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 48.00 },
  { sku: "WN-003", name: "Silver Oak Alexander Valley", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 62.00 },
  { sku: "WN-004", name: "Opus One", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 350.00 },
  { sku: "WN-005", name: "Stag's Leap Artemis Cabernet", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 52.00 },
  { sku: "WN-006", name: "Duckhorn Merlot", category: "WINE", subcategory: "Red - Merlot", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 42.00 },
  { sku: "WN-007", name: "Meiomi Pinot Noir", category: "WINE", subcategory: "Red - Pinot Noir", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 14.00 },
  { sku: "WN-008", name: "Belle Glos Clark & Telephone Pinot", category: "WINE", subcategory: "Red - Pinot Noir", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: JB, cost: 36.00 },
  { sku: "WN-009", name: "Decoy Pinot Noir", category: "WINE", subcategory: "Red - Pinot Noir", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 16.00 },
  { sku: "WN-010", name: "The Prisoner Red Blend", category: "WINE", subcategory: "Red - Blend", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 32.00 },
  { sku: "WN-011", name: "Tignanello", category: "WINE", subcategory: "Red - Italian", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 95.00 },
  { sku: "WN-012", name: "Robert Mondavi Cabernet", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 12.00 },
  { sku: "WN-013", name: "Josh Cellars Cabernet", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: SGWS, cost: 10.00 },
  { sku: "WN-014", name: "Apothic Red Blend", category: "WINE", subcategory: "Red - Blend", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 8.00 },
  { sku: "WN-015", name: "Penfolds Bin 389 Cabernet Shiraz", category: "WINE", subcategory: "Red - Blend", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 38.00 },
  { sku: "WN-016", name: "Barolo Marchesi di Barolo", category: "WINE", subcategory: "Red - Italian", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 42.00 },
  { sku: "WN-017", name: "Brunello di Montalcino Banfi", category: "WINE", subcategory: "Red - Italian", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 48.00 },
  { sku: "WN-018", name: "Malbec Catena Alta", category: "WINE", subcategory: "Red - Malbec", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 28.00 },
  { sku: "WN-019", name: "14 Hands Cabernet", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 9.00 },
  { sku: "WN-020", name: "Columbia Crest Grand Estates Cabernet", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 10.00 },

  // --- White Wine ---
  { sku: "WN-021", name: "Rombauer Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 32.00 },
  { sku: "WN-022", name: "Cakebread Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 38.00 },
  { sku: "WN-023", name: "Kim Crawford Sauvignon Blanc", category: "WINE", subcategory: "White - Sauvignon Blanc", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 10.00 },
  { sku: "WN-024", name: "Cloudy Bay Sauvignon Blanc", category: "WINE", subcategory: "White - Sauvignon Blanc", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 18.00 },
  { sku: "WN-025", name: "Santa Margherita Pinot Grigio", category: "WINE", subcategory: "White - Pinot Grigio", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 16.00 },
  { sku: "WN-026", name: "Whispering Angel Rose", category: "WINE", subcategory: "Rose", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 16.00 },
  { sku: "WN-027", name: "Kendall-Jackson Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: JB, cost: 8.00 },
  { sku: "WN-028", name: "Sancerre Pascal Jolivet", category: "WINE", subcategory: "White - Sauvignon Blanc", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 22.00 },
  { sku: "WN-029", name: "Chablis William Fevre", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 28.00 },
  { sku: "WN-030", name: "Dr. Loosen Riesling", category: "WINE", subcategory: "White - Riesling", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 14.00 },
  { sku: "WN-031", name: "Chateau Ste Michelle Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 10.00 },
  { sku: "WN-032", name: "Sonoma-Cutrer Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: BROWNFORMAN, distributorIdx: SGWS, cost: 18.00 },
  { sku: "WN-033", name: "Minuty M Rose", category: "WINE", subcategory: "Rose", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 18.00 },
  { sku: "WN-034", name: "Woodbridge Pinot Grigio", category: "WINE", subcategory: "House - White", size: "1.5L", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 8.00 },
  { sku: "WN-035", name: "Woodbridge Cabernet", category: "WINE", subcategory: "House - Red", size: "1.5L", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 8.00 },
  { sku: "WN-036", name: "Kendall-Jackson Cabernet", category: "WINE", subcategory: "House - Red", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: JB, cost: 10.00 },

  // --- Sparkling / Champagne ---
  { sku: "WN-037", name: "Veuve Clicquot Brut", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 48.00 },
  { sku: "WN-038", name: "Dom Perignon", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 175.00 },
  { sku: "WN-039", name: "Moet & Chandon Imperial", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 42.00 },
  { sku: "WN-040", name: "Ace of Spades Brut Gold", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 280.00 },
  { sku: "WN-041", name: "Perrier-Jouet Grand Brut", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIdx: PERNOD, distributorIdx: SGWS, cost: 38.00 },
  { sku: "WN-042", name: "Prosecco La Marca", category: "WINE", subcategory: "Sparkling", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: SGWS, cost: 10.00 },
  { sku: "WN-043", name: "Chandon Brut", category: "WINE", subcategory: "Sparkling", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 16.00 },
  { sku: "WN-044", name: "Veuve Clicquot Rose", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIdx: MOET, distributorIdx: SGWS, cost: 62.00 },
  { sku: "WN-045", name: "Laurent-Perrier Brut", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 36.00 },

  // --- Additional wines to reach 60 ---
  { sku: "WN-046", name: "Duckhorn Cabernet", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 55.00 },
  { sku: "WN-047", name: "Justin Cabernet Paso Robles", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 22.00 },
  { sku: "WN-048", name: "Flowers Pinot Noir Sonoma Coast", category: "WINE", subcategory: "Red - Pinot Noir", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 42.00 },
  { sku: "WN-049", name: "Chateau Montelena Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 45.00 },
  { sku: "WN-050", name: "Far Niente Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 48.00 },
  { sku: "WN-051", name: "Stag's Leap Karia Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 32.00 },
  { sku: "WN-052", name: "Conundrum White Blend", category: "WINE", subcategory: "White - Blend", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 16.00 },
  { sku: "WN-053", name: "Chalk Hill Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 28.00 },
  { sku: "WN-054", name: "Decoy Cabernet Sauvignon", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: BREAKTHRU, cost: 18.00 },
  { sku: "WN-055", name: "Chateau Margaux", category: "WINE", subcategory: "Red - Bordeaux", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 450.00 },
  { sku: "WN-056", name: "Sassicaia", category: "WINE", subcategory: "Red - Italian", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 225.00 },
  { sku: "WN-057", name: "Caymus Special Selection", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: CONSTELLATION, distributorIdx: SGWS, cost: 145.00 },
  { sku: "WN-058", name: "Chateau Haut-Brion", category: "WINE", subcategory: "Red - Bordeaux", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 400.00 },
  { sku: "WN-059", name: "Clos du Val Cabernet Napa", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 35.00 },
  { sku: "WN-060", name: "Domaine Drouhin Pinot Noir", category: "WINE", subcategory: "Red - Pinot Noir", size: "750ml", unit: "bottle", supplierIdx: STEMICHELLE, distributorIdx: JB, cost: 38.00 },

  // ===== BEER (30 products) =====
  // --- Domestic ---
  { sku: "BR-001", name: "Bud Light", category: "BEER", subcategory: "Domestic Lager", size: "24-12oz", unit: "case", supplierIdx: ABINBEV, distributorIdx: NEVBEV, cost: 18.00 },
  { sku: "BR-002", name: "Budweiser", category: "BEER", subcategory: "Domestic Lager", size: "24-12oz", unit: "case", supplierIdx: ABINBEV, distributorIdx: NEVBEV, cost: 18.00 },
  { sku: "BR-003", name: "Michelob Ultra", category: "BEER", subcategory: "Domestic Light", size: "24-12oz", unit: "case", supplierIdx: ABINBEV, distributorIdx: NEVBEV, cost: 20.00 },
  { sku: "BR-004", name: "Coors Light", category: "BEER", subcategory: "Domestic Light", size: "24-12oz", unit: "case", supplierIdx: MOLSONCOORS, distributorIdx: BONANZA, cost: 20.90 },
  { sku: "BR-005", name: "Miller Lite", category: "BEER", subcategory: "Domestic Light", size: "24-12oz", unit: "case", supplierIdx: MOLSONCOORS, distributorIdx: BONANZA, cost: 20.90 },

  // --- Import ---
  { sku: "BR-006", name: "Heineken", category: "BEER", subcategory: "Import Lager", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 24.00 },
  { sku: "BR-007", name: "Corona Extra", category: "BEER", subcategory: "Import Lager", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 24.00 },
  { sku: "BR-008", name: "Stella Artois", category: "BEER", subcategory: "Import Lager", size: "24-11.2oz", unit: "case", supplierIdx: ABINBEV, distributorIdx: NEVBEV, cost: 24.00 },
  { sku: "BR-009", name: "Modelo Especial", category: "BEER", subcategory: "Import Lager", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 24.00 },
  { sku: "BR-010", name: "Guinness Draught", category: "BEER", subcategory: "Import Stout", size: "24-14.9oz", unit: "case", supplierIdx: DIAGEO, distributorIdx: BREAKTHRU, cost: 30.00 },
  { sku: "BR-011", name: "Sapporo Premium", category: "BEER", subcategory: "Import Lager", size: "12-22oz", unit: "case", supplierIdx: JFC, distributorIdx: SGWS, cost: 28.00 },
  { sku: "BR-012", name: "Peroni Nastro Azzurro", category: "BEER", subcategory: "Import Lager", size: "24-11.2oz", unit: "case", supplierIdx: ABINBEV, distributorIdx: BONANZA, cost: 26.00 },
  { sku: "BR-013", name: "Pacifico", category: "BEER", subcategory: "Import Lager", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 22.00 },

  // --- Craft ---
  { sku: "BR-014", name: "Lagunitas IPA", category: "BEER", subcategory: "Craft IPA", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 28.00 },
  { sku: "BR-015", name: "Sierra Nevada Pale Ale", category: "BEER", subcategory: "Craft Pale Ale", size: "15.5gal", unit: "keg", supplierIdx: SIERRANEVADA, distributorIdx: SGWS, cost: 125.00 },
  { sku: "BR-016", name: "Blue Moon Belgian White", category: "BEER", subcategory: "Craft Wheat", size: "24-12oz", unit: "case", supplierIdx: MOLSONCOORS, distributorIdx: BONANZA, cost: 26.00 },
  { sku: "BR-017", name: "Goose Island IPA", category: "BEER", subcategory: "Craft IPA", size: "24-12oz", unit: "case", supplierIdx: ABINBEV, distributorIdx: NEVBEV, cost: 28.00 },
  { sku: "BR-018", name: "Stone IPA", category: "BEER", subcategory: "Craft IPA", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 30.00 },
  { sku: "BR-019", name: "Athletic Brewing Run Wild IPA (NA)", category: "BEER", subcategory: "Non-Alcoholic", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 32.00 },

  // --- Draft / Keg ---
  { sku: "BR-020", name: "Bud Light Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIdx: ABINBEV, distributorIdx: NEVBEV, cost: 105.00 },
  { sku: "BR-021", name: "Stella Artois Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIdx: ABINBEV, distributorIdx: NEVBEV, cost: 165.00 },
  { sku: "BR-022", name: "Blue Moon Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIdx: MOLSONCOORS, distributorIdx: BONANZA, cost: 155.00 },
  { sku: "BR-023", name: "Modelo Especial Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 155.00 },
  { sku: "BR-024", name: "Peroni Draft", category: "BEER", subcategory: "Draft", size: "15.5gal", unit: "keg", supplierIdx: ABINBEV, distributorIdx: BONANZA, cost: 154.95 },

  // --- Additional beer ---
  { sku: "BR-025", name: "Dos Equis Lager", category: "BEER", subcategory: "Import Lager", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 22.00 },
  { sku: "BR-026", name: "Amstel Light", category: "BEER", subcategory: "Import Light", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 24.00 },
  { sku: "BR-027", name: "Asahi Super Dry", category: "BEER", subcategory: "Import Lager", size: "24-12oz", unit: "case", supplierIdx: JFC, distributorIdx: SGWS, cost: 26.00 },
  { sku: "BR-028", name: "Kirin Ichiban", category: "BEER", subcategory: "Import Lager", size: "24-12oz", unit: "case", supplierIdx: JFC, distributorIdx: SGWS, cost: 26.00 },
  { sku: "BR-029", name: "White Claw Variety Pack", category: "BEER", subcategory: "Hard Seltzer", size: "24-12oz", unit: "case", supplierIdx: CONSTELLATION, distributorIdx: BREAKTHRU, cost: 22.00 },
  { sku: "BR-030", name: "Truly Hard Seltzer Variety", category: "BEER", subcategory: "Hard Seltzer", size: "24-12oz", unit: "case", supplierIdx: ABINBEV, distributorIdx: NEVBEV, cost: 22.00 },

  // ===== SAKE (15 products) =====
  { sku: "SK-001", name: "Dassai 23 Junmai Daiginjo", category: "SAKE", subcategory: "Junmai Daiginjo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 80.00 },
  { sku: "SK-002", name: "Hakkaisan Tokubetsu Junmai", category: "SAKE", subcategory: "Tokubetsu Junmai", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 32.00 },
  { sku: "SK-003", name: "Kubota Manju Junmai Daiginjo", category: "SAKE", subcategory: "Junmai Daiginjo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 65.00 },
  { sku: "SK-004", name: "Sho Chiku Bai Ginjo", category: "SAKE", subcategory: "Ginjo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 18.00 },
  { sku: "SK-005", name: "Born Gold Junmai Daiginjo", category: "SAKE", subcategory: "Junmai Daiginjo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 55.00 },
  { sku: "SK-006", name: "Juyondai Honmaru", category: "SAKE", subcategory: "Honjozo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 120.00 },
  { sku: "SK-007", name: "Nanbu Bijin Tokubetsu Junmai", category: "SAKE", subcategory: "Tokubetsu Junmai", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 28.00 },
  { sku: "SK-008", name: "Hakutsuru Draft Sake", category: "SAKE", subcategory: "Draft", size: "300ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 8.00 },
  { sku: "SK-009", name: "Ozeki Dry", category: "SAKE", subcategory: "Junmai", size: "750ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 10.00 },
  { sku: "SK-010", name: "Masumi Okuden Kantsukuri", category: "SAKE", subcategory: "Junmai", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 24.00 },
  { sku: "SK-011", name: "Tozai Well of Wisdom", category: "SAKE", subcategory: "Junmai", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 14.00 },
  { sku: "SK-012", name: "Dewazakura Oka Cherry Bouquet", category: "SAKE", subcategory: "Ginjo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 22.00 },
  { sku: "SK-013", name: "Tamanohikari Junmai Ginjo", category: "SAKE", subcategory: "Junmai Ginjo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 30.00 },
  { sku: "SK-014", name: "Gekkeikan Haiku", category: "SAKE", subcategory: "Junmai Ginjo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 12.00 },
  { sku: "SK-015", name: "Wakatake Onikoroshi Junmai Daiginjo", category: "SAKE", subcategory: "Junmai Daiginjo", size: "720ml", unit: "bottle", supplierIdx: JFC, distributorIdx: SGWS, cost: 45.00 },
];

// ============================================================
// OUTLET PRODUCT ASSIGNMENTS — realistic subsets per venue
// ============================================================
// Each outlet gets a curated mix matching its concept

const OUTLET_PRODUCT_SKUS: Record<string, string[]> = {
  // Famous Foods (~40 products): Casual — domestic beer, well spirits, a few wines
  "famous-foods": [
    // Well spirits
    "SP-006", "SP-008", "SP-010", "SP-019", "SP-025", "SP-026", "SP-045", "SP-046", "SP-047", "SP-050",
    "SP-051", "SP-054", "SP-007", "SP-063",
    // Cheap wine
    "WN-012", "WN-013", "WN-014", "WN-023", "WN-027", "WN-034", "WN-035", "WN-036", "WN-042",
    // Domestic beer heavy
    "BR-001", "BR-002", "BR-003", "BR-004", "BR-005", "BR-006", "BR-007", "BR-009", "BR-013",
    "BR-016", "BR-020", "BR-023", "BR-025", "BR-029", "BR-030",
    // Whiskey basics
    "SP-011", "SP-020",
  ],

  // Dawg House (~60 products): Beer & whiskey heavy — 60% beer, 30% whiskey/bourbon, 10% other spirits. NO wine. NO sake.
  "dawg-house": [
    // ALL beer
    "BR-001", "BR-002", "BR-003", "BR-004", "BR-005", "BR-006", "BR-007", "BR-008", "BR-009",
    "BR-010", "BR-012", "BR-013", "BR-014", "BR-015", "BR-016", "BR-017", "BR-018",
    "BR-020", "BR-021", "BR-022", "BR-023", "BR-024", "BR-025", "BR-026", "BR-029", "BR-030",
    "BR-019",
    // Whiskey & Bourbon heavy
    "SP-011", "SP-012", "SP-013", "SP-014", "SP-015", "SP-016", "SP-017", "SP-018", "SP-019",
    "SP-020", "SP-021", "SP-022", "SP-023", "SP-024", "SP-025", "SP-026", "SP-027", "SP-029",
    "SP-033", "SP-072",
    // Well spirits
    "SP-006", "SP-007", "SP-045", "SP-046", "SP-051", "SP-035", "SP-040", "SP-041",
    "SP-026", "SP-061",
  ],

  // Pool Bar (~40 products): Bar items only — frozen drink spirits, light beer, vodka, rum, tequila. NO wine. NO sake. NO scotch.
  "pool-bar": [
    // Vodka
    "SP-001", "SP-003", "SP-005", "SP-006", "SP-007", "SP-010",
    // Rum
    "SP-045", "SP-046", "SP-047", "SP-050",
    // Tequila
    "SP-035", "SP-038", "SP-040", "SP-041", "SP-043",
    // Other
    "SP-064", "SP-047", "SP-063", "SP-080",
    // Light beer
    "BR-001", "BR-002", "BR-003", "BR-004", "BR-005", "BR-006", "BR-007", "BR-009",
    "BR-013", "BR-016", "BR-025", "BR-029", "BR-030",
    // Draft
    "BR-020", "BR-023",
    // Frozen drink spirits
    "SP-026", "SP-008",
  ],

  // Wally's (~120 products): ALL wines + champagnes + premium spirits. Wine-forward.
  "wallys": [
    // ALL wines
    ...Array.from({ length: 60 }, (_, i) => `WN-${String(i + 1).padStart(3, "0")}`),
    // ALL sake
    ...Array.from({ length: 15 }, (_, i) => `SK-${String(i + 1).padStart(3, "0")}`),
    // Premium spirits
    "SP-001", "SP-002", "SP-003", "SP-005", "SP-013", "SP-018", "SP-021", "SP-023",
    "SP-027", "SP-028", "SP-029", "SP-030", "SP-031", "SP-034",
    "SP-035", "SP-036", "SP-037", "SP-038", "SP-039",
    "SP-048", "SP-052", "SP-055", "SP-056", "SP-057", "SP-058", "SP-060",
    "SP-061", "SP-062", "SP-063", "SP-064", "SP-065", "SP-066", "SP-067",
    "SP-072", "SP-073", "SP-074", "SP-075", "SP-076", "SP-077",
    // A few beers
    "BR-008", "BR-010", "BR-012", "BR-014",
  ],

  // Stubborn Seed (~80 products): Fine dining — premium wines, spirits, craft cocktail ingredients
  "stubborn-seed": [
    // Premium wines
    "WN-001", "WN-002", "WN-003", "WN-004", "WN-005", "WN-006", "WN-007", "WN-008", "WN-009",
    "WN-010", "WN-011", "WN-015", "WN-016", "WN-017", "WN-018", "WN-021", "WN-022", "WN-024",
    "WN-025", "WN-026", "WN-028", "WN-029", "WN-030", "WN-037", "WN-038", "WN-039", "WN-040",
    "WN-041", "WN-044", "WN-045", "WN-046", "WN-047", "WN-048", "WN-049", "WN-050", "WN-051",
    "WN-055", "WN-056", "WN-057", "WN-058", "WN-059", "WN-060",
    // Premium spirits
    "SP-001", "SP-002", "SP-003", "SP-013", "SP-018", "SP-021", "SP-023", "SP-028", "SP-029",
    "SP-030", "SP-031", "SP-037", "SP-039", "SP-048", "SP-052", "SP-055",
    "SP-056", "SP-057", "SP-058", "SP-060", "SP-062", "SP-064", "SP-065", "SP-066", "SP-067",
    "SP-073", "SP-074", "SP-075", "SP-076", "SP-077", "SP-078", "SP-079",
    // Sake
    "SK-001", "SK-002", "SK-003", "SK-005", "SK-006",
    // Craft beer
    "BR-010", "BR-014",
  ],

  // Crossroads Kitchen (~70 products): Restaurant — broad wine selection, spirits, some beer
  "crossroads-kitchen": [
    // Wine selection
    "WN-001", "WN-002", "WN-005", "WN-006", "WN-007", "WN-009", "WN-010", "WN-012", "WN-013",
    "WN-014", "WN-015", "WN-016", "WN-018", "WN-019", "WN-020", "WN-021", "WN-022", "WN-023",
    "WN-024", "WN-025", "WN-026", "WN-027", "WN-028", "WN-031", "WN-032", "WN-033", "WN-034",
    "WN-035", "WN-036", "WN-037", "WN-039", "WN-042", "WN-043", "WN-047", "WN-054",
    // Spirits
    "SP-001", "SP-003", "SP-004", "SP-006", "SP-011", "SP-012", "SP-013", "SP-014", "SP-016",
    "SP-020", "SP-027", "SP-030", "SP-035", "SP-038", "SP-040", "SP-045", "SP-046",
    "SP-051", "SP-053", "SP-056", "SP-061", "SP-063", "SP-064", "SP-065", "SP-072",
    // Beer
    "BR-001", "BR-003", "BR-006", "BR-007", "BR-008", "BR-009", "BR-010", "BR-014", "BR-016",
  ],

  // Viva (~60 products): Southwest restaurant — tequila/margarita-forward, broad spirits, some wine
  // POS source: Mesa Grill (74,000+ margaritas/year, strong tequila + spirits)
  "viva": [
    // ALL tequila (signature focus)
    "SP-035", "SP-036", "SP-037", "SP-038", "SP-039", "SP-040", "SP-041", "SP-042", "SP-043", "SP-044",
    // Core spirits
    "SP-001", "SP-003", "SP-004", "SP-006", "SP-011", "SP-012", "SP-013", "SP-014",
    "SP-016", "SP-017", "SP-020", "SP-027", "SP-030",
    "SP-045", "SP-046", "SP-051", "SP-053", "SP-056", "SP-072",
    // Liqueurs (margarita/cocktail ingredients)
    "SP-061", "SP-062", "SP-063", "SP-064", "SP-065", "SP-066", "SP-067", "SP-078", "SP-079", "SP-080",
    // Wine selection
    "WN-007", "WN-010", "WN-012", "WN-013", "WN-014", "WN-018", "WN-023", "WN-025", "WN-026",
    "WN-027", "WN-033", "WN-037", "WN-039", "WN-042",
    // Beer (Mexican + craft)
    "BR-007", "BR-009", "BR-013", "BR-014", "BR-016", "BR-023", "BR-025",
  ],

  // Genting Palace (~80 products): Premium steakhouse — wine-dominant, premium spirits, craft beer
  // POS source: Old Homestead (70% of $3.5M annual from wine, 139K items/year)
  "genting-palace": [
    // Premium wines (steakhouse wine list)
    "WN-001", "WN-002", "WN-003", "WN-004", "WN-005", "WN-006", "WN-007", "WN-008", "WN-009",
    "WN-010", "WN-011", "WN-015", "WN-016", "WN-017", "WN-018", "WN-021", "WN-022", "WN-024",
    "WN-025", "WN-026", "WN-028", "WN-029", "WN-030", "WN-031", "WN-032",
    "WN-037", "WN-038", "WN-039", "WN-041", "WN-044", "WN-045",
    "WN-046", "WN-047", "WN-048", "WN-049", "WN-050", "WN-051", "WN-054", "WN-055", "WN-056",
    "WN-057", "WN-058", "WN-059", "WN-060",
    // Premium spirits
    "SP-001", "SP-002", "SP-003", "SP-005", "SP-011", "SP-013", "SP-014", "SP-016", "SP-020",
    "SP-027", "SP-028", "SP-029", "SP-030", "SP-031", "SP-035", "SP-038", "SP-045", "SP-046",
    "SP-051", "SP-052", "SP-053", "SP-056", "SP-057", "SP-058", "SP-060",
    "SP-061", "SP-063", "SP-064", "SP-065", "SP-072",
    // Craft beer + imports
    "BR-003", "BR-006", "BR-008", "BR-010", "BR-012", "BR-014", "BR-016",
    "BR-021", "BR-024",
  ],

  // Gatsby's (~80 products): Nightlife — champagne, vodka, tequila, bottle service premium spirits
  "gatsbys": [
    // ALL champagnes
    "WN-037", "WN-038", "WN-039", "WN-040", "WN-041", "WN-042", "WN-043", "WN-044", "WN-045",
    // Vodka heavy (bottle service)
    "SP-001", "SP-002", "SP-003", "SP-005", "SP-006", "SP-008", "SP-009",
    // Tequila heavy (bottle service)
    "SP-035", "SP-036", "SP-037", "SP-038", "SP-039", "SP-042", "SP-043",
    // Premium whiskey / scotch
    "SP-013", "SP-018", "SP-021", "SP-023", "SP-027", "SP-028", "SP-029", "SP-037", "SP-077",
    // Cognac
    "SP-056", "SP-057", "SP-060",
    // Rum
    "SP-045", "SP-046",
    // Gin
    "SP-051", "SP-052", "SP-053",
    // Liqueurs
    "SP-061", "SP-062", "SP-063", "SP-064", "SP-065", "SP-066", "SP-067",
    // Beer (limited)
    "BR-001", "BR-003", "BR-006", "BR-007", "BR-008", "BR-009", "BR-014",
    // Red Bull / energy mixers simulated as simple syrup
    "SP-080",
    // Select wines for table service
    "WN-001", "WN-004", "WN-010", "WN-007", "WN-021",
    // Japanese whisky for VIP
    "SP-073", "SP-074", "SP-075",
    // Irish
    "SP-072", "SP-020",
    // Fireball
    "SP-026",
  ],

  // Alle Lounge (~35 products): Lounge — sake, Japanese whisky, premium cocktails
  "alle-lounge": [
    // ALL sake
    ...Array.from({ length: 15 }, (_, i) => `SK-${String(i + 1).padStart(3, "0")}`),
    // Japanese whisky
    "SP-073", "SP-074", "SP-075", "SP-076",
    // Japanese beer
    "BR-011", "BR-027", "BR-028",
    // Premium cocktail spirits
    "SP-001", "SP-002", "SP-052", "SP-055", "SP-064", "SP-065", "SP-066", "SP-067",
    "SP-078", "SP-079", "SP-080",
    // Champagne
    "WN-037", "WN-039",
  ],

  // ================================================================
  // NEW OUTLETS — Product assignments
  // ================================================================

  // Zouk Nightclub (~75 products): High-energy nightclub — bottle service, champagne, premium spirits
  "zouk": [
    // ALL champagnes (VIP table service)
    "WN-037", "WN-038", "WN-039", "WN-040", "WN-041", "WN-042", "WN-043", "WN-044", "WN-045",
    // Vodka heavy (bottle service staples)
    "SP-001", "SP-002", "SP-003", "SP-005", "SP-006", "SP-008", "SP-009", "SP-010",
    // Tequila heavy
    "SP-035", "SP-036", "SP-037", "SP-038", "SP-039", "SP-042", "SP-043", "SP-044",
    // Premium whiskey
    "SP-013", "SP-018", "SP-021", "SP-023", "SP-027", "SP-028", "SP-029",
    // Cognac / Hennessy
    "SP-056", "SP-057", "SP-060",
    // Rum
    "SP-045", "SP-046", "SP-047",
    // Gin
    "SP-051", "SP-052", "SP-053",
    // Liqueurs & mixers
    "SP-061", "SP-062", "SP-063", "SP-064", "SP-065", "SP-066", "SP-067", "SP-080",
    // Beer (limited)
    "BR-001", "BR-003", "BR-006", "BR-007", "BR-008", "BR-009",
    // Japanese whisky for VIP
    "SP-073", "SP-074", "SP-075",
    // Select wines for table service
    "WN-001", "WN-004", "WN-007", "WN-010", "WN-021",
    // Irish
    "SP-072", "SP-020",
    // Fireball / shots
    "SP-026",
    // Jack Daniel's (high volume shots)
    "SP-011",
  ],

  // Kusa Nori (~55 products): Japanese sushi restaurant — sake-forward, Japanese whisky, select wines
  "kusa-nori": [
    // ALL sake (signature focus)
    ...Array.from({ length: 15 }, (_, i) => `SK-${String(i + 1).padStart(3, "0")}`),
    // Japanese whisky
    "SP-073", "SP-074", "SP-075", "SP-076", "SP-077",
    // Japanese beer
    "BR-011", "BR-027", "BR-028",
    // Select wines (white-dominant for sushi)
    "WN-019", "WN-020", "WN-023", "WN-025", "WN-026", "WN-027", "WN-031", "WN-032", "WN-033",
    "WN-034", "WN-035", "WN-036", "WN-037", "WN-042",
    // Core spirits
    "SP-001", "SP-003", "SP-035", "SP-038", "SP-051", "SP-052",
    "SP-056", "SP-045", "SP-046",
    // Cocktail ingredients
    "SP-064", "SP-065", "SP-066", "SP-078", "SP-079", "SP-080",
    // A few more beers
    "BR-008", "BR-010", "BR-014",
  ],

  // Junior's (~35 products): Classic American restaurant/deli — beer + well spirits, limited wine
  "juniors": [
    // Domestic beer heavy
    "BR-001", "BR-002", "BR-003", "BR-004", "BR-005", "BR-006", "BR-007", "BR-009",
    "BR-013", "BR-016", "BR-020", "BR-023", "BR-025",
    // Well spirits
    "SP-006", "SP-008", "SP-010", "SP-011", "SP-019", "SP-025", "SP-026",
    "SP-045", "SP-046", "SP-051", "SP-063",
    // Cheap wines / by-the-glass
    "WN-012", "WN-013", "WN-014", "WN-023", "WN-027", "WN-034", "WN-035", "WN-036",
    // Cocktail mixers
    "SP-064", "SP-080",
  ],

  // Fuhu (~65 products): Pan-Asian restaurant — premium spirits, sake selection, Asian beer, wines
  "fuhu": [
    // Sake selection (premium)
    "SK-001", "SK-002", "SK-003", "SK-004", "SK-005", "SK-006", "SK-007", "SK-008", "SK-009", "SK-010",
    // Japanese whisky
    "SP-073", "SP-074", "SP-075", "SP-076",
    // Asian beer + imports
    "BR-011", "BR-027", "BR-028", "BR-008", "BR-010", "BR-014",
    // Premium spirits (cocktail program)
    "SP-001", "SP-002", "SP-003", "SP-005", "SP-013", "SP-027", "SP-028", "SP-029",
    "SP-035", "SP-038", "SP-039", "SP-051", "SP-052", "SP-055",
    "SP-056", "SP-057", "SP-060", "SP-045", "SP-046",
    // Cocktail ingredients
    "SP-061", "SP-062", "SP-064", "SP-065", "SP-066", "SP-067", "SP-078", "SP-079", "SP-080",
    // Wine selection (curated)
    "WN-001", "WN-005", "WN-007", "WN-010", "WN-015", "WN-018", "WN-021", "WN-024",
    "WN-025", "WN-031", "WN-037", "WN-039", "WN-042",
  ],

  // Conrad Lobby Bar (~40 products): Upscale lobby bar — premium spirits, wine BTG, craft cocktails
  "conrad-lobby": [
    // Premium spirits
    "SP-001", "SP-002", "SP-003", "SP-013", "SP-018", "SP-027", "SP-028", "SP-029", "SP-030",
    "SP-035", "SP-038", "SP-051", "SP-052", "SP-056", "SP-057",
    // Cocktail ingredients
    "SP-061", "SP-064", "SP-065", "SP-066", "SP-067", "SP-078", "SP-079", "SP-080",
    // Wine BTG
    "WN-007", "WN-010", "WN-012", "WN-018", "WN-023", "WN-025", "WN-027", "WN-037", "WN-039",
    // Beer
    "BR-003", "BR-006", "BR-008", "BR-010", "BR-014",
    // Rum
    "SP-045", "SP-046",
    // Irish
    "SP-072",
  ],

  // Crockfords Lobby Bar (~45 products): Ultra-premium lobby bar — top-shelf everything
  "crockfords-lobby": [
    // Premium spirits (top-shelf focus)
    "SP-001", "SP-002", "SP-003", "SP-005", "SP-013", "SP-018", "SP-021", "SP-023",
    "SP-027", "SP-028", "SP-029", "SP-030", "SP-031", "SP-034",
    "SP-035", "SP-037", "SP-038", "SP-039",
    "SP-048", "SP-052", "SP-055", "SP-056", "SP-057", "SP-058", "SP-060",
    // Cocktail luxuries
    "SP-061", "SP-064", "SP-065", "SP-066", "SP-067", "SP-078", "SP-079",
    // Premium wines BTG
    "WN-001", "WN-002", "WN-004", "WN-005", "WN-007", "WN-010", "WN-037", "WN-038", "WN-039",
    // Japanese whisky
    "SP-073", "SP-074", "SP-075",
    // Select beer
    "BR-008", "BR-010", "BR-014",
  ],

  // Crystal Bar (~35 products): Casino floor bar — well spirits + beer, fast service
  "crystal-bar": [
    // Well spirits (high turnover)
    "SP-006", "SP-007", "SP-008", "SP-010", "SP-019", "SP-025", "SP-026",
    "SP-045", "SP-046", "SP-047", "SP-050", "SP-051", "SP-054",
    // Popular call brands
    "SP-001", "SP-003", "SP-011", "SP-013", "SP-035", "SP-038", "SP-072",
    // Beer
    "BR-001", "BR-002", "BR-003", "BR-004", "BR-005", "BR-006", "BR-007", "BR-009",
    "BR-013", "BR-020", "BR-023",
    // A few wines BTG
    "WN-023", "WN-027", "WN-034",
    // Mixers
    "SP-063", "SP-064", "SP-080",
  ],

  // Here Kitty Kitty (~50 products): Speakeasy — craft cocktails, premium spirits, curated wine/beer
  "here-kitty-kitty": [
    // Premium craft cocktail spirits
    "SP-001", "SP-002", "SP-003", "SP-005", "SP-013", "SP-018", "SP-021",
    "SP-035", "SP-037", "SP-038", "SP-039",
    "SP-051", "SP-052", "SP-055",
    "SP-056", "SP-057",
    // Cocktail ingredients (full bar)
    "SP-061", "SP-062", "SP-063", "SP-064", "SP-065", "SP-066", "SP-067",
    "SP-078", "SP-079", "SP-080",
    // Rum selection
    "SP-045", "SP-046", "SP-047", "SP-048",
    // Bourbon/Rye for old fashioneds
    "SP-014", "SP-016", "SP-020", "SP-072",
    // Curated wine
    "WN-007", "WN-010", "WN-018", "WN-025", "WN-037", "WN-039",
    // Craft beer
    "BR-008", "BR-010", "BR-012", "BR-014",
  ],

  // Golden Monkey (~40 products): Casino bar — spirits-forward, beer, limited wine
  "golden-monkey": [
    // Well + call spirits
    "SP-001", "SP-003", "SP-006", "SP-008", "SP-010", "SP-011", "SP-013",
    "SP-019", "SP-025", "SP-026", "SP-027", "SP-035", "SP-038",
    "SP-045", "SP-046", "SP-051", "SP-056", "SP-072",
    // Liqueurs
    "SP-063", "SP-064", "SP-080",
    // Beer
    "BR-001", "BR-002", "BR-003", "BR-004", "BR-005", "BR-006", "BR-007", "BR-009",
    "BR-013", "BR-016", "BR-020",
    // Wines BTG
    "WN-012", "WN-023", "WN-027", "WN-034",
    // Rum extras
    "SP-047", "SP-050",
  ],

  // High Limit Bar (~50 products): VIP casino bar — ultra-premium spirits, champagne, fine wine
  "high-limit-bar": [
    // Ultra-premium spirits
    "SP-001", "SP-002", "SP-003", "SP-005", "SP-013", "SP-018", "SP-021", "SP-023",
    "SP-027", "SP-028", "SP-029", "SP-030", "SP-031", "SP-034",
    "SP-035", "SP-037", "SP-038", "SP-039",
    "SP-052", "SP-055", "SP-056", "SP-057", "SP-058", "SP-060",
    // Japanese whisky
    "SP-073", "SP-074", "SP-075", "SP-077",
    // Champagnes
    "WN-037", "WN-038", "WN-039", "WN-040", "WN-041", "WN-044", "WN-045",
    // Premium wines
    "WN-001", "WN-002", "WN-004", "WN-005", "WN-007", "WN-010",
    // Cognac
    "SP-048",
    // Cocktail ingredients
    "SP-064", "SP-065", "SP-066", "SP-078", "SP-079",
    // Premium beer
    "BR-008", "BR-010", "BR-014",
  ],
};

// ============================================================
// OUTLET GROUPS
// ============================================================
const OUTLET_GROUPS = [
  {
    name: "Fine Dining",
    outlets: ["stubborn-seed", "wallys", "genting-palace", "kusa-nori", "fuhu"],
  },
  {
    name: "Casual Dining & Bars",
    outlets: ["viva", "crossroads-kitchen", "famous-foods", "dawg-house", "pool-bar", "juniors"],
  },
  {
    name: "Nightlife & Lounges",
    outlets: ["alle-lounge", "gatsbys", "zouk", "here-kitty-kitty"],
  },
  {
    name: "Casino Bars",
    outlets: ["crystal-bar", "golden-monkey", "high-limit-bar"],
  },
  {
    name: "Lobby Bars",
    outlets: ["conrad-lobby", "crockfords-lobby"],
  },
];

// ============================================================
// COST GOALS (target cost % per outlet)
// ============================================================
const COST_GOALS: Record<string, number> = {
  "stubborn-seed": 22.0,
  "crossroads-kitchen": 24.0,
  wallys: 24.0,
  viva: 20.0,
  "genting-palace": 22.0,
  "famous-foods": 26.0,
  "dawg-house": 18.0,
  "alle-lounge": 20.0,
  gatsbys: 16.0,
  "pool-bar": 18.0,
  // New outlets
  "zouk": 14.0,             // Nightclub — high markup, low cost target
  "kusa-nori": 22.0,        // Fine dining sushi
  "juniors": 28.0,          // Casual deli — higher cost target
  "fuhu": 20.0,             // Premium Pan-Asian
  "conrad-lobby": 20.0,     // Upscale lobby bar
  "crockfords-lobby": 18.0, // Ultra-premium lobby bar
  "crystal-bar": 22.0,      // Casino floor bar
  "here-kitty-kitty": 18.0, // Speakeasy — craft cocktail margins
  "golden-monkey": 22.0,    // Casino bar
  "high-limit-bar": 16.0,   // VIP bar — ultra-premium markups
};

// ============================================================
// POS-DATA-DRIVEN DAILY CONSUMPTION RATES
// Source: Caesars Palace 2012 annual POS data, mapped to RWLV outlets
//
// These are DRINKS SOLD PER DAY from the POS system.
// Conversion to BOTTLES: spirits 1L = 22 pours, 750ml = 17 pours,
// wine bottle = 5 glasses, beer case = 24, keg = 165 pints.
// ============================================================

// Daily POS drink sales for each MANDATE SPIRIT at each outlet
// Used to generate realistic order quantities (drinks ÷ pours/bottle = bottles/day)
const POS_DAILY_DRINKS: Record<string, Record<string, number>> = {
  // SP-001 Grey Goose Vodka (1L → 22 pours)
  "SP-001": {
    "pool-bar": 2.17, viva: 8.90, "genting-palace": 13.59,
    "stubborn-seed": 13.82, "dawg-house": 27.28, gatsbys: 10.09,
    wallys: 0.64, "alle-lounge": 2.87, "crossroads-kitchen": 0.59,
    "famous-foods": 5.0,
    // New outlets
    "zouk": 18.5, "kusa-nori": 1.2, "juniors": 0, "fuhu": 3.5,
    "conrad-lobby": 2.8, "crockfords-lobby": 4.5, "crystal-bar": 6.0,
    "here-kitty-kitty": 3.2, "golden-monkey": 4.8, "high-limit-bar": 5.5,
  },
  // SP-003 Ketel One Vodka (1L → 22 pours)
  "SP-003": {
    "pool-bar": 0.02, viva: 5.96, "genting-palace": 9.24,
    "stubborn-seed": 10.08, "dawg-house": 0, gatsbys: 8.05,
    wallys: 0.28, "alle-lounge": 0, "crossroads-kitchen": 0.24,
    "famous-foods": 2.0,
    "zouk": 14.2, "kusa-nori": 0.8, "juniors": 0, "fuhu": 2.0,
    "conrad-lobby": 2.0, "crockfords-lobby": 3.8, "crystal-bar": 3.5,
    "here-kitty-kitty": 2.5, "golden-monkey": 3.2, "high-limit-bar": 4.0,
  },
  // SP-011 Jack Daniel's Old No.7 (1L → 22 pours)
  "SP-011": {
    "pool-bar": 1.21, viva: 4.51, "genting-palace": 6.30,
    "stubborn-seed": 6.22, "dawg-house": 17.90, gatsbys: 2.48,
    wallys: 0.08, "alle-lounge": 1.06, "crossroads-kitchen": 0.35,
    "famous-foods": 3.5,
    "zouk": 5.5, "kusa-nori": 0.3, "juniors": 2.5, "fuhu": 0,
    "conrad-lobby": 1.0, "crockfords-lobby": 0.5, "crystal-bar": 8.0,
    "here-kitty-kitty": 0.8, "golden-monkey": 5.5, "high-limit-bar": 0.3,
  },
  // SP-013 Woodford Reserve (1L → 22 pours)
  "SP-013": {
    "pool-bar": 0, viva: 1.17, "genting-palace": 0.72,
    "stubborn-seed": 0.73, "dawg-house": 0.87, gatsbys: 0,
    wallys: 0.03, "alle-lounge": 0.02, "crossroads-kitchen": 0,
    "famous-foods": 0.3,
    "zouk": 1.5, "kusa-nori": 0.1, "juniors": 0, "fuhu": 0.4,
    "conrad-lobby": 0.5, "crockfords-lobby": 0.8, "crystal-bar": 0.3,
    "here-kitty-kitty": 1.2, "golden-monkey": 0.4, "high-limit-bar": 1.0,
  },
  // SP-014 Bulleit Bourbon (1L → 22 pours)
  "SP-014": {
    "pool-bar": 0, viva: 0.36, "genting-palace": 0,
    "stubborn-seed": 0, "dawg-house": 1.19, gatsbys: 0,
    wallys: 0, "alle-lounge": 0, "crossroads-kitchen": 0,
    "famous-foods": 0.2,
    "zouk": 0, "kusa-nori": 0, "juniors": 0, "fuhu": 0,
    "conrad-lobby": 0, "crockfords-lobby": 0, "crystal-bar": 0,
    "here-kitty-kitty": 0.6, "golden-monkey": 0, "high-limit-bar": 0,
  },
  // SP-016 Buffalo Trace Bourbon (1L → 22 pours) — newer brand, minimal 2012 presence
  "SP-016": {
    "pool-bar": 0, viva: 0.15, "genting-palace": 0.20,
    "stubborn-seed": 0.10, "dawg-house": 0.30, gatsbys: 0,
    wallys: 0, "alle-lounge": 0, "crossroads-kitchen": 0,
    "famous-foods": 0.1,
    "zouk": 0, "kusa-nori": 0, "juniors": 0, "fuhu": 0,
    "conrad-lobby": 0, "crockfords-lobby": 0, "crystal-bar": 0,
    "here-kitty-kitty": 0.4, "golden-monkey": 0, "high-limit-bar": 0,
  },
  // SP-027 Johnnie Walker Black Label (1L → 22 pours)
  "SP-027": {
    "pool-bar": 0.03, viva: 1.53, "genting-palace": 3.65,
    "stubborn-seed": 2.80, "dawg-house": 4.83, gatsbys: 0.50,
    wallys: 0.08, "alle-lounge": 0.76, "crossroads-kitchen": 0.08,
    "famous-foods": 1.0,
    "zouk": 2.0, "kusa-nori": 0.3, "juniors": 0, "fuhu": 1.2,
    "conrad-lobby": 1.0, "crockfords-lobby": 1.8, "crystal-bar": 1.5,
    "here-kitty-kitty": 0.5, "golden-monkey": 1.8, "high-limit-bar": 2.5,
  },
  // SP-030 Glenlivet 12yr (750ml → 17 pours)
  "SP-030": {
    "pool-bar": 0, viva: 0, "genting-palace": 0.05,
    "stubborn-seed": 0, "dawg-house": 1.24, gatsbys: 0,
    wallys: 0.03, "alle-lounge": 0, "crossroads-kitchen": 0,
    "famous-foods": 0.1,
    "zouk": 0, "kusa-nori": 0, "juniors": 0, "fuhu": 0,
    "conrad-lobby": 0.2, "crockfords-lobby": 0.4, "crystal-bar": 0,
    "here-kitty-kitty": 0, "golden-monkey": 0, "high-limit-bar": 0.5,
  },
  // SP-035 Patron Silver (750ml → 17 pours)
  "SP-035": {
    "pool-bar": 0.10, viva: 7.44, "genting-palace": 1.84,
    "stubborn-seed": 1.82, "dawg-house": 12.62, gatsbys: 4.97,
    wallys: 0.03, "alle-lounge": 0.33, "crossroads-kitchen": 0.14,
    "famous-foods": 2.0,
    "zouk": 8.0, "kusa-nori": 0.5, "juniors": 0, "fuhu": 1.5,
    "conrad-lobby": 1.0, "crockfords-lobby": 1.5, "crystal-bar": 2.0,
    "here-kitty-kitty": 1.8, "golden-monkey": 2.0, "high-limit-bar": 2.0,
  },
  // SP-038 Casamigos Blanco (1L → 22 pours) — launched 2013, estimated
  "SP-038": {
    "pool-bar": 0.08, viva: 3.50, "genting-palace": 0.80,
    "stubborn-seed": 0.60, "dawg-house": 2.50, gatsbys: 2.00,
    wallys: 0, "alle-lounge": 0.15, "crossroads-kitchen": 0.05,
    "famous-foods": 0.8,
    "zouk": 6.0, "kusa-nori": 0.2, "juniors": 0, "fuhu": 0.8,
    "conrad-lobby": 0.5, "crockfords-lobby": 0.8, "crystal-bar": 1.5,
    "here-kitty-kitty": 1.2, "golden-monkey": 1.5, "high-limit-bar": 1.2,
  },
  // SP-045 Bacardi Superior (1L → 22 pours)
  "SP-045": {
    "pool-bar": 0.24, viva: 2.59, "genting-palace": 4.77,
    "stubborn-seed": 3.24, "dawg-house": 12.78, gatsbys: 2.42,
    wallys: 0.04, "alle-lounge": 0.91, "crossroads-kitchen": 0.24,
    "famous-foods": 2.5,
    "zouk": 4.0, "kusa-nori": 0.3, "juniors": 1.5, "fuhu": 1.0,
    "conrad-lobby": 0.8, "crockfords-lobby": 0.5, "crystal-bar": 5.0,
    "here-kitty-kitty": 1.0, "golden-monkey": 3.5, "high-limit-bar": 0,
  },
  // SP-046 Captain Morgan Spiced (1L → 22 pours)
  "SP-046": {
    "pool-bar": 0.21, viva: 3.23, "genting-palace": 3.80,
    "stubborn-seed": 4.08, "dawg-house": 10.55, gatsbys: 1.75,
    wallys: 0.03, "alle-lounge": 0.72, "crossroads-kitchen": 0.14,
    "famous-foods": 2.0,
    "zouk": 3.0, "kusa-nori": 0.2, "juniors": 1.2, "fuhu": 0.5,
    "conrad-lobby": 0.5, "crockfords-lobby": 0.3, "crystal-bar": 4.0,
    "here-kitty-kitty": 0.5, "golden-monkey": 3.0, "high-limit-bar": 0,
  },
  // SP-051 Tanqueray London Dry (1L → 22 pours)
  "SP-051": {
    "pool-bar": 0.01, viva: 3.29, "genting-palace": 4.35,
    "stubborn-seed": 4.46, "dawg-house": 5.65, gatsbys: 0.52,
    wallys: 0.14, "alle-lounge": 0.54, "crossroads-kitchen": 0.16,
    "famous-foods": 1.5,
    "zouk": 1.5, "kusa-nori": 0.3, "juniors": 0.8, "fuhu": 0.8,
    "conrad-lobby": 0.8, "crockfords-lobby": 0.6, "crystal-bar": 2.5,
    "here-kitty-kitty": 1.0, "golden-monkey": 2.0, "high-limit-bar": 0,
  },
  // SP-056 Hennessy VS (1L → 22 pours)
  "SP-056": {
    "pool-bar": 0.01, viva: 0.50, "genting-palace": 0.71,
    "stubborn-seed": 0.37, "dawg-house": 0, gatsbys: 0,
    wallys: 0.05, "alle-lounge": 0.18, "crossroads-kitchen": 0.08,
    "famous-foods": 0.2,
    "zouk": 3.0, "kusa-nori": 0.1, "juniors": 0, "fuhu": 0.8,
    "conrad-lobby": 0.3, "crockfords-lobby": 0.5, "crystal-bar": 0.5,
    "here-kitty-kitty": 0.3, "golden-monkey": 0.8, "high-limit-bar": 1.5,
  },
  // SP-072 Jameson Irish Whiskey (1L → 22 pours)
  "SP-072": {
    "pool-bar": 0.03, viva: 1.35, "genting-palace": 1.45,
    "stubborn-seed": 1.46, "dawg-house": 4.80, gatsbys: 0,
    wallys: 0.02, "alle-lounge": 0.10, "crossroads-kitchen": 0.07,
    "famous-foods": 1.0,
    "zouk": 1.5, "kusa-nori": 0, "juniors": 0.8, "fuhu": 0,
    "conrad-lobby": 0.3, "crockfords-lobby": 0.2, "crystal-bar": 2.0,
    "here-kitty-kitty": 0.5, "golden-monkey": 1.5, "high-limit-bar": 0,
  },
};

// Pours per bottle by size designation
const POURS_PER_BOTTLE: Record<string, number> = {
  "1L": 22,
  "1.75L": 39,
  "750ml": 17,
  "200ml": 6,
  "148ml": 4,
  "720ml": 5,    // sake (5 glasses)
  "300ml": 2,    // small sake
  "24-12oz": 24, // beer case
  "24-11.2oz": 24,
  "24-14.9oz": 24,
  "12-22oz": 12,
  "1/2 BBL": 165,
  "15.5gal": 165,
  "1.5L": 10,   // magnum wine = 10 glasses
};

// Day-of-week volume multipliers (from OH/Redtail December 2012 daily data)
// Index 0 = Sunday, 6 = Saturday
const DAY_OF_WEEK_MULTIPLIERS = [
  0.98, // Sun
  0.72, // Mon (slowest weekday)
  0.82, // Tue
  0.57, // Wed (industry off-day)
  1.01, // Thu
  1.27, // Fri
  1.57, // Sat (peak)
];

// Total daily POS items per outlet (from annual data) — used for non-mandate product scaling
const OUTLET_DAILY_TOTAL_ITEMS: Record<string, number> = {
  "pool-bar": 758.3,
  viva: 673.2,
  "genting-palace": 381.6,
  "stubborn-seed": 479.2,
  "dawg-house": 1014.9,
  gatsbys: 179.9,
  wallys: 29.7,
  "alle-lounge": 157.7,
  "crossroads-kitchen": 66.4,
  "famous-foods": 500.0, // estimated from GR daily data (Dec avg)
  // New outlets
  "zouk": 850.0,              // High-volume nightclub (Fri/Sat peaks)
  "kusa-nori": 120.0,         // Upscale sushi (intimate setting)
  "juniors": 280.0,           // Casual American deli (steady traffic)
  "fuhu": 220.0,              // Premium Pan-Asian (dinner-focused)
  "conrad-lobby": 95.0,       // Lobby bar (hotel guest traffic)
  "crockfords-lobby": 65.0,   // Ultra-premium lobby bar (smaller, exclusive)
  "crystal-bar": 420.0,       // Casino floor bar (high-volume, fast service)
  "here-kitty-kitty": 140.0,  // Speakeasy (intimate, craft-focused)
  "golden-monkey": 350.0,     // Casino bar (solid casino floor traffic)
  "high-limit-bar": 110.0,    // VIP casino bar (fewer guests, higher spend)
};

// ============================================================
// POOL BAR SEASONAL MULTIPLIERS (Vegas pool season curve)
// ============================================================
const POOL_MONTHLY_MULTIPLIERS: Record<number, number> = {
  0: 0.10,  // Jan - very low
  1: 0.10,  // Feb - very low
  2: 0.25,  // Mar - slightly better
  3: 0.80,  // Apr - 80% of max
  4: 0.80,  // May - 80% of max
  5: 1.0,   // Jun - MAX
  6: 1.0,   // Jul - MAX
  7: 1.0,   // Aug - MAX
  8: 0.50,  // Sep - 50%
  9: 0.30,  // Oct - 30%
  10: 0.10, // Nov - low
  11: 0.10, // Dec - low
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** Generate a date shifted from Caesars 2012-2013 era to recent 2025-2026 */
function redate(monthsAgo: number): Date {
  const now = new Date(2026, 2, 1); // March 1, 2026
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
}

/** Random integer within a range (inclusive) */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float within a range, rounded to 2 decimals */
function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/** Pick random items from array */
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

/** Get the seasonal multiplier for an outlet in a given month */
function getSeasonalMultiplier(slug: string, month: number): number {
  if (slug === "pool-bar") {
    return POOL_MONTHLY_MULTIPLIERS[month] ?? 0.5;
  }
  // Slight seasonal variation for other outlets (Vegas conventions, holidays)
  const GENERAL_MONTHLY: Record<number, number> = {
    0: 0.85, 1: 0.90, 2: 1.05, 3: 1.10, 4: 1.00, 5: 0.95,
    6: 0.90, 7: 0.85, 8: 0.90, 9: 1.05, 11: 1.15, 10: 1.10,
  };
  return GENERAL_MONTHLY[month] ?? 1.0;
}

/** Get daily bottle consumption rate for a product at an outlet */
function getDailyBottleRate(sku: string, slug: string, size: string): number {
  // For mandate spirits with POS data, use exact rates
  const posData = POS_DAILY_DRINKS[sku];
  if (posData && posData[slug] !== undefined) {
    const drinks = posData[slug];
    const pours = POURS_PER_BOTTLE[size] || 22;
    return drinks / pours;
  }
  // For non-mandate products, estimate based on outlet total volume
  // with category-aware weighting (bitters/small bottles get much less volume)
  const totalItems = OUTLET_DAILY_TOTAL_ITEMS[slug] || 200;
  const outletProducts = getOutletProducts(slug);
  if (outletProducts.length === 0) return 0;

  // Category weight: how much of the drink volume this size/type represents
  // Bitters are used in dashes (tiny quantities), not full pours
  const sizeWeight: Record<string, number> = {
    "148ml": 0.02,    // bitters — dash bottles, ~1 bottle per week
    "200ml": 0.03,    // small bitters/cordials
    "300ml": 0.15,    // small sake
    "720ml": 0.5,     // sake — by the glass/carafe
    "750ml": 0.8,     // wine/spirits standard
    "1L": 1.0,        // well spirits (highest volume)
    "1.75L": 1.2,     // handle bottles (very high volume wells)
    "1.5L": 0.6,      // magnum wine
    "24-12oz": 1.0,   // beer case
    "24-11.2oz": 0.8, // import beer case
    "24-14.9oz": 0.8, // tall can case
    "12-22oz": 0.7,   // bomber case
    "1/2 BBL": 1.5,   // keg — high volume draft
    "15.5gal": 1.5,   // keg
  };
  const weight = sizeWeight[size] ?? 0.5;

  const pours = POURS_PER_BOTTLE[size] || 22;
  // Weighted share of daily drinks for this product
  const totalWeight = outletProducts.reduce((sum, p) => sum + (sizeWeight[p.size] ?? 0.5), 0);
  const productShare = weight / totalWeight;
  const dailyDrinks = totalItems * productShare;
  return dailyDrinks / pours;
}

/** Get the products assigned to a specific outlet */
function getOutletProducts(slug: string): ProductDef[] {
  const skus = OUTLET_PRODUCT_SKUS[slug];
  if (!skus) return [];
  const skuSet = new Set(skus);
  return PRODUCTS.filter((p) => skuSet.has(p.sku));
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
  console.log("🌱 Starting Spotlight demo data seed (Real Caesars Palace data)...\n");

  // Clean existing data
  console.log("Cleaning existing data...");
  await prisma.$transaction([
    prisma.$executeRawUnsafe('DELETE FROM "alerts"'),
    prisma.$executeRawUnsafe('DELETE FROM "alert_rules"'),
    prisma.$executeRawUnsafe('DELETE FROM "flash_messages"'),
    prisma.$executeRawUnsafe('DELETE FROM "portal_interactions"'),
    prisma.$executeRawUnsafe('DELETE FROM "portal_sessions"'),
    prisma.$executeRawUnsafe('DELETE FROM "hotel_occupancy"'),
    prisma.$executeRawUnsafe('DELETE FROM "price_tracking"'),
    prisma.$executeRawUnsafe('DELETE FROM "cost_goals"'),
    prisma.$executeRawUnsafe('DELETE FROM "recipe_ingredients"'),
    prisma.$executeRawUnsafe('DELETE FROM "recipes"'),
    prisma.$executeRawUnsafe('DELETE FROM "sales_data"'),
    prisma.$executeRawUnsafe('DELETE FROM "inventory_snapshots"'),
    prisma.$executeRawUnsafe('DELETE FROM "order_history"'),
    prisma.$executeRawUnsafe('DELETE FROM "direct_orders"'),
    prisma.$executeRawUnsafe('DELETE FROM "warehouse_transfers"'),
    prisma.$executeRawUnsafe('DELETE FROM "mandate_compliance"'),
    prisma.$executeRawUnsafe('DELETE FROM "mandate_items"'),
    prisma.$executeRawUnsafe('DELETE FROM "mandates"'),
    prisma.$executeRawUnsafe('DELETE FROM "product_catalog"'),
    prisma.$executeRawUnsafe('DELETE FROM "distributor_products"'),
    prisma.$executeRawUnsafe('DELETE FROM "products"'),
    prisma.$executeRawUnsafe('DELETE FROM "user_roles"'),
    prisma.$executeRawUnsafe('DELETE FROM "roles"'),
    prisma.$executeRawUnsafe('DELETE FROM "users"'),
    prisma.$executeRawUnsafe('DELETE FROM "outlet_tracking_numbers"'),
    prisma.$executeRawUnsafe('DELETE FROM "outlets"'),
    prisma.$executeRawUnsafe('DELETE FROM "outlet_groups"'),
    prisma.$executeRawUnsafe('DELETE FROM "distributors"'),
    prisma.$executeRawUnsafe('DELETE FROM "suppliers"'),
    prisma.$executeRawUnsafe('DELETE FROM "field_mapping_profiles"'),
    prisma.$executeRawUnsafe('DELETE FROM "uploads"'),
    prisma.$executeRawUnsafe('DELETE FROM "organizations"'),
    prisma.$executeRawUnsafe('DELETE FROM "organization_groups"'),
  ]);

  // ============================================================
  // 1. Create organization
  // ============================================================
  console.log("Creating organization...");
  const org = await prisma.organization.create({
    data: {
      name: "Resorts World Las Vegas",
      slug: "resorts-world-lv",
      address: "3000 Las Vegas Blvd S",
      city: "Las Vegas",
      state: "NV",
      zip: "89109",
      phone: "702-676-7000",
    },
  });
  console.log(`  ✓ Created org: ${org.name} (${org.id})`);

  // ============================================================
  // 2. Create outlet groups
  // ============================================================
  console.log("Creating outlet groups...");
  const outletGroupMap: Record<string, string> = {};
  for (const group of OUTLET_GROUPS) {
    const created = await prisma.outletGroup.create({
      data: {
        name: group.name,
        organizationId: org.id,
      },
    });
    for (const slug of group.outlets) {
      outletGroupMap[slug] = created.id;
    }
    console.log(`  ✓ Created group: ${group.name}`);
  }

  // ============================================================
  // 3. Create outlets
  // ============================================================
  console.log("Creating outlets...");
  const outlets: Record<string, string> = {}; // slug -> id
  for (const [, mapping] of Object.entries(OUTLET_MAPPING)) {
    const outlet = await prisma.outlet.create({
      data: {
        name: mapping.name,
        slug: mapping.slug,
        type: mapping.type,
        organizationId: org.id,
        outletGroupId: outletGroupMap[mapping.slug] || null,
        isActive: true,
      },
    });
    outlets[mapping.slug] = outlet.id;
    console.log(`  ✓ Created outlet: ${mapping.name} (${mapping.type})`);
  }

  // Create new outlets (restaurants + bars)
  for (const newOutlet of NEW_OUTLETS) {
    const outlet = await prisma.outlet.create({
      data: {
        name: newOutlet.name,
        slug: newOutlet.slug,
        type: newOutlet.type,
        organizationId: org.id,
        outletGroupId: outletGroupMap[newOutlet.slug] || null,
        isActive: true,
      },
    });
    outlets[newOutlet.slug] = outlet.id;
    console.log(`  ✓ Created outlet: ${newOutlet.name} (${newOutlet.type})`);
  }

  // ============================================================
  // 4. Create distributors
  // ============================================================
  console.log("Creating distributors...");
  const distributorIds: string[] = [];
  for (const dist of DISTRIBUTORS) {
    const created = await prisma.distributor.create({
      data: {
        name: dist.name,
        contactName: dist.contactName,
        contactEmail: dist.contactEmail,
        contactPhone: dist.contactPhone,
        isActive: true,
      },
    });
    distributorIds.push(created.id);
    console.log(`  ✓ Created distributor: ${dist.name}`);
  }

  // ============================================================
  // 5. Create suppliers
  // ============================================================
  console.log("Creating suppliers...");
  const supplierIds: string[] = [];
  for (const sup of SUPPLIERS) {
    const created = await prisma.supplier.create({
      data: {
        name: sup.name,
        contactEmail: sup.contactEmail,
        website: sup.website,
        isActive: true,
      },
    });
    supplierIds.push(created.id);
    console.log(`  ✓ Created supplier: ${sup.name}`);
  }

  // ============================================================
  // 6. Create products + distributor_products
  // ============================================================
  console.log("Creating products...");
  const productIds: string[] = [];
  const productCosts: Record<string, number> = {};
  for (const prod of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        subcategory: prod.subcategory,
        size: prod.size,
        unit: prod.unit,
        isActive: true,
      },
    });
    productIds.push(product.id);
    productCosts[product.id] = prod.cost;

    // Link to distributor + supplier
    await prisma.distributorProduct.create({
      data: {
        distributorId: distributorIds[prod.distributorIdx],
        productId: product.id,
        supplierId: supplierIds[prod.supplierIdx],
        cost: prod.cost,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Created ${PRODUCTS.length} products with distributor links`);

  // ============================================================
  // 7. Create roles + users
  // ============================================================
  console.log("Creating roles and users...");
  const roles = await Promise.all([
    prisma.role.create({ data: { name: "VP", description: "Vice President — sees all properties" } }),
    prisma.role.create({ data: { name: "DIRECTOR", description: "Director — sees all outlets in property" } }),
    prisma.role.create({ data: { name: "ADMIN", description: "Admin — manages property configuration" } }),
    prisma.role.create({ data: { name: "ROOM_MANAGER", description: "Room Manager — sees assigned outlet(s)" } }),
    prisma.role.create({ data: { name: "DISTRIBUTOR", description: "Distributor — sees their products" } }),
    prisma.role.create({ data: { name: "SUPPLIER", description: "Supplier — sees their products across distributors" } }),
  ]);

  // VP
  const vpUser = await prisma.user.create({
    data: {
      email: "vp@resortsworld.com",
      name: "Richard Kang",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: vpUser.id,
      roleId: roles[0].id,
      organizationId: org.id,
    },
  });

  // Director
  const directorUser = await prisma.user.create({
    data: {
      email: "director@resortsworld.com",
      name: "Sarah Mitchell",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: directorUser.id,
      roleId: roles[1].id,
      organizationId: org.id,
    },
  });

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@resortsworld.com",
      name: "James Park",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: adminUser.id,
      roleId: roles[2].id,
      organizationId: org.id,
    },
  });

  // Room Manager — Stubborn Seed
  const rmUser = await prisma.user.create({
    data: {
      email: "manager.stubbornseed@resortsworld.com",
      name: "Alex Chen",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: rmUser.id,
      roleId: roles[3].id,
      organizationId: org.id,
      outletId: outlets["stubborn-seed"],
    },
  });

  // Distributor user — SGWS
  const distUser = await prisma.user.create({
    data: {
      email: "rep@sgws.com",
      name: "Mike Reynolds",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: distUser.id,
      roleId: roles[4].id,
      distributorId: distributorIds[SGWS],
    },
  });

  // Supplier user — Moet Hennessy
  const supplierUser = await prisma.user.create({
    data: {
      email: "rep@moethennessy.com",
      name: "Claire Dubois",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: supplierUser.id,
      roleId: roles[5].id,
      supplierId: supplierIds[MOET],
    },
  });

  console.log("  ✓ Created 6 users and role assignments");

  // ============================================================
  // 8. Create mandates
  // ============================================================
  console.log("Creating mandates...");
  const mandate = await prisma.mandate.create({
    data: {
      name: "National Spirits Program 2026",
      description: "Required pour brands for all outlets per national agreement",
      organizationId: org.id,
      createdBy: directorUser.id,
      isActive: true,
      startDate: redate(6),
      endDate: redate(-6),
    },
  });

  // 15 mandated spirits items from key brand programs
  const mandatedSkus = [
    "SP-001", // Grey Goose (Bacardi)
    "SP-003", // Ketel One (Diageo)
    "SP-011", // Jack Daniel's (Brown-Forman)
    "SP-013", // Woodford Reserve (Brown-Forman)
    "SP-014", // Bulleit (Diageo)
    "SP-016", // Buffalo Trace (Sazerac)
    "SP-027", // JW Black (Diageo)
    "SP-030", // Glenlivet 12 (Pernod Ricard)
    "SP-035", // Patron Silver (Bacardi)
    "SP-038", // Casamigos Blanco (Diageo)
    "SP-045", // Bacardi Superior (Bacardi)
    "SP-046", // Captain Morgan (Diageo)
    "SP-051", // Tanqueray (Diageo)
    "SP-056", // Hennessy VS (Moet Hennessy)
    "SP-072", // Jameson (Pernod Ricard)
  ];

  const mandateItemIds: string[] = [];
  for (const sku of mandatedSkus) {
    const product = await prisma.product.findFirst({ where: { sku } });
    if (product) {
      const item = await prisma.mandateItem.create({
        data: {
          mandateId: mandate.id,
          productId: product.id,
          minimumQuantity: rand(2, 10),
        },
      });
      mandateItemIds.push(item.id);
    }
  }
  console.log(`  ✓ Created mandate with ${mandateItemIds.length} items`);

  // Create compliance records with POS-realistic lastOrderQuantity
  for (let i = 0; i < mandateItemIds.length; i++) {
    const sku = mandatedSkus[i];
    const prod = PRODUCTS.find((p) => p.sku === sku);
    const poursPerBottle = prod ? (POURS_PER_BOTTLE[prod.size] || 22) : 22;

    for (const [slug, outletId] of Object.entries(outlets)) {
      // Check if this outlet carries this product
      const outletSkus = OUTLET_PRODUCT_SKUS[slug] || [];
      const carriesProduct = outletSkus.includes(sku);

      // Non-compliance: outlet doesn't carry it, or low-volume outlets sometimes miss
      const posData = POS_DAILY_DRINKS[sku];
      const dailyDrinks = posData?.[slug] || 0;
      const isCompliant = carriesProduct && dailyDrinks > 0 && Math.random() > 0.12;

      // Realistic order quantity: ~1 week of consumption in bottles
      const weeklyBottles = Math.max(1, Math.round((dailyDrinks / poursPerBottle) * 7));
      const lastOrderQty = isCompliant ? Math.max(1, weeklyBottles + rand(-1, 1)) : null;

      await prisma.mandateCompliance.create({
        data: {
          mandateItemId: mandateItemIds[i],
          outletId: outletId,
          isCompliant,
          lastOrderDate: isCompliant ? redate(rand(0, 2)) : null,
          lastOrderQuantity: lastOrderQty,
          checkedAt: new Date(),
        },
      });
    }
  }
  console.log("  ✓ Created compliance records");

  // ============================================================
  // 9. Generate 12 months of order history
  //    POS-data-driven: each product's quantity reflects actual
  //    daily consumption rates from Caesars POS data, with
  //    day-of-week variation and seasonal adjustments.
  //
  //    Warehouse orders happen on consistent weekdays (Mon/Thu typical).
  //    Order frequency scales with consumption rate:
  //      >= 0.5 bottles/day → 2x/week orders
  //      >= 0.1 bottles/day → weekly orders
  //      >= 0.03 bottles/day → biweekly orders
  //      < 0.03 bottles/day → monthly orders
  // ============================================================
  console.log("Generating 12 months of order history (POS-data-driven)...");
  let orderCount = 0;
  const allProducts = await prisma.product.findMany();
  const productMap = new Map(allProducts.map((p) => [p.sku, p]));
  const productDefMap = new Map(PRODUCTS.map((p) => [p.sku, p]));

  // Batch order inserts for performance
  const orderBatch: Parameters<typeof prisma.orderHistory.create>[0]["data"][] = [];

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const baseDate = redate(monthsAgo);
    const monthIdx = baseDate.getMonth();

    for (const [slug, outletId] of Object.entries(outlets)) {
      const seasonalMult = getSeasonalMultiplier(slug, monthIdx);
      if (seasonalMult < 0.05) continue;

      const outletProds = getOutletProducts(slug);
      if (outletProds.length === 0) continue;

      for (const prod of outletProds) {
        const product = productMap.get(prod.sku);
        if (!product) continue;

        // Calculate daily bottle consumption rate
        const dailyRate = getDailyBottleRate(prod.sku, slug, prod.size) * seasonalMult;
        if (dailyRate <= 0) continue;

        // Monthly bottle consumption
        const monthlyBottles = dailyRate * 30;

        // Determine order frequency and quantity per order
        let ordersPerMonth: number;
        let bottlesPerOrder: number;

        if (dailyRate >= 0.5) {
          // High volume: order twice a week (8x/month)
          ordersPerMonth = 8;
          bottlesPerOrder = Math.max(1, Math.round((monthlyBottles / 8) * randFloat(0.8, 1.2)));
        } else if (dailyRate >= 0.1) {
          // Medium: order weekly (4x/month)
          ordersPerMonth = 4;
          bottlesPerOrder = Math.max(1, Math.round((monthlyBottles / 4) * randFloat(0.8, 1.2)));
        } else if (dailyRate >= 0.03) {
          // Low: order biweekly (2x/month)
          ordersPerMonth = 2;
          bottlesPerOrder = Math.max(1, Math.round((monthlyBottles / 2) * randFloat(0.8, 1.2)));
        } else {
          // Very low: order monthly or skip some months
          if (Math.random() < monthlyBottles) {
            ordersPerMonth = 1;
            bottlesPerOrder = 1;
          } else {
            continue; // Skip this month for this product
          }
        }

        for (let o = 0; o < ordersPerMonth; o++) {
          // Distribute orders across the month, favoring Mon/Thu (typical warehouse order days)
          const weekNum = Math.min(3, Math.floor(o * 4 / ordersPerMonth));
          const baseDayOfMonth = weekNum * 7 + (o % 2 === 0 ? rand(1, 3) : rand(4, 6));
          const dayOfMonth = Math.min(28, Math.max(1, baseDayOfMonth));

          const orderDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            dayOfMonth
          );

          // Apply day-of-week variation to quantity
          const dow = orderDate.getDay();
          const dowMult = DAY_OF_WEEK_MULTIPLIERS[dow];
          const quantity = Math.max(1, Math.round(bottlesPerOrder * dowMult * randFloat(0.85, 1.15)));

          const costPerUnit = Math.round(prod.cost * randFloat(0.97, 1.03) * 100) / 100;

          orderBatch.push({
            organizationId: org.id,
            outletId,
            productId: product.id,
            distributorId: distributorIds[prod.distributorIdx],
            supplierId: supplierIds[prod.supplierIdx],
            quantity,
            costPerUnit,
            totalCost: Math.round(quantity * costPerUnit * 100) / 100,
            orderDate,
            orderType: Math.random() > 0.90 ? "DIRECT" : "WAREHOUSE",
          });
          orderCount++;
        }
      }
    }

    // Flush batch every month
    if (orderBatch.length > 0) {
      await prisma.orderHistory.createMany({ data: orderBatch });
      orderBatch.length = 0;
    }
    console.log(`  ✓ Month ${12 - monthsAgo}/12 — ${orderCount} total orders`);
  }

  // Flush remaining
  if (orderBatch.length > 0) {
    await prisma.orderHistory.createMany({ data: orderBatch });
    orderBatch.length = 0;
  }
  console.log(`  ✓ Created ${orderCount} order history records`);

  // ============================================================
  // 10. Generate sales data (POS drink-level sales per outlet)
  //     Quantities reflect ACTUAL POS drink counts from Caesars data
  //     with day-of-week variation applied to sample days.
  // ============================================================
  console.log("Generating sales data (POS-calibrated)...");
  let salesCount = 0;
  const salesBatch: Parameters<typeof prisma.salesData.create>[0]["data"][] = [];

  // Markup multipliers by outlet character (menu price = cost × markup)
  const MARKUP_BY_OUTLET: Record<string, number> = {
    gatsbys: 5.0,
    "stubborn-seed": 4.0,
    wallys: 3.5,
    "genting-palace": 4.0,
    "alle-lounge": 4.0,
    viva: 3.0,
    "crossroads-kitchen": 3.0,
    "dawg-house": 3.0,
    "famous-foods": 2.8,
    "pool-bar": 3.5,
    // New outlets
    "zouk": 5.5,             // Nightclub — highest markup (bottle service)
    "kusa-nori": 4.0,        // Fine dining sushi
    "juniors": 2.5,          // Casual deli — lowest markup
    "fuhu": 3.8,             // Premium Pan-Asian
    "conrad-lobby": 3.5,     // Upscale lobby bar
    "crockfords-lobby": 4.5, // Ultra-premium lobby bar
    "crystal-bar": 3.0,      // Casino floor bar
    "here-kitty-kitty": 4.5, // Speakeasy — craft cocktail markup
    "golden-monkey": 3.0,    // Casino bar
    "high-limit-bar": 5.0,   // VIP bar — ultra-premium markups
  };

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const baseDate = redate(monthsAgo);
    const monthIdx = baseDate.getMonth();

    for (const [slug, outletId] of Object.entries(outlets)) {
      const seasonalMult = getSeasonalMultiplier(slug, monthIdx);
      if (seasonalMult < 0.05) continue;

      const outletProds = getOutletProducts(slug);
      if (outletProds.length === 0) continue;

      for (const prod of outletProds) {
        const product = productMap.get(prod.sku);
        if (!product) continue;

        // Get daily bottle rate and convert back to drinks for sales data
        const dailyRate = getDailyBottleRate(prod.sku, slug, prod.size) * seasonalMult;
        if (dailyRate <= 0) continue;
        const poursPerBottle = POURS_PER_BOTTLE[prod.size] || 22;
        const baseDailyDrinks = dailyRate * poursPerBottle;
        if (baseDailyDrinks < 0.1) continue; // skip negligible products

        // Generate sales for every day of the month (28 days)
        for (let dayOfMonth = 1; dayOfMonth <= 28; dayOfMonth++) {
          const saleDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), dayOfMonth);
          const dow = saleDate.getDay();
          const dowMult = DAY_OF_WEEK_MULTIPLIERS[dow];

          // POS drinks sold that day (applying day-of-week + variance)
          const dailySales = baseDailyDrinks * dowMult * randFloat(0.75, 1.25);
          const quantitySold = Math.max(1, Math.round(dailySales));

          const markup = MARKUP_BY_OUTLET[slug] || 3.0;
          // Revenue per drink (cost per bottle ÷ pours × markup)
          const costPerDrink = prod.cost / poursPerBottle;
          const revenuePerDrink = costPerDrink * markup;
          const revenue = Math.round(quantitySold * revenuePerDrink * 100) / 100;

          salesBatch.push({
            organizationId: org.id,
            outletId,
            productId: product.id,
            itemName: prod.name,
            quantitySold,
            revenue,
            saleDate,
            posSource: "MICROS",
          });
          salesCount++;
        }
      }
    }

    // Flush batch every month
    if (salesBatch.length > 0) {
      await prisma.salesData.createMany({ data: salesBatch });
      salesBatch.length = 0;
    }
  }
  if (salesBatch.length > 0) {
    await prisma.salesData.createMany({ data: salesBatch });
    salesBatch.length = 0;
  }
  console.log(`  ✓ Created ${salesCount} sales data records`);

  // ============================================================
  // 11. Cost goals
  // ============================================================
  console.log("Creating cost goals...");
  for (const [slug, target] of Object.entries(COST_GOALS)) {
    if (outlets[slug]) {
      await prisma.costGoal.create({
        data: {
          outletId: outlets[slug],
          targetCostPercentage: target,
          effectiveDate: redate(6),
          createdBy: adminUser.id,
        },
      });
    }
  }
  console.log("  ✓ Created cost goals for all outlets");

  // ============================================================
  // 12. Alert rules
  // ============================================================
  console.log("Creating alert rules...");
  const alertTypes = [
    { type: "MANDATE_COMPLIANCE", threshold: 7, unit: "days" },
    { type: "PULL_THROUGH_HIGH", threshold: 120, unit: "percent" },
    { type: "PULL_THROUGH_LOW", threshold: 80, unit: "percent" },
    { type: "DAYS_OF_INVENTORY", threshold: 5, unit: "days" },
    { type: "NEW_DIRECT_ITEM", threshold: null, unit: null },
    { type: "PRICE_DISCREPANCY", threshold: 5, unit: "percent" },
    { type: "PRICE_CHANGE", threshold: 5, unit: "percent" },
    { type: "COST_GOAL_EXCEEDED", threshold: 0, unit: "percent" },
  ] as const;

  for (const rule of alertTypes) {
    await prisma.alertRule.create({
      data: {
        organizationId: org.id,
        alertType: rule.type,
        isEnabled: true,
        thresholdValue: rule.threshold,
        thresholdUnit: rule.unit,
        createdBy: adminUser.id,
      },
    });
  }
  console.log("  ✓ Created alert rules");

  // ============================================================
  // 13. Sample alerts
  // ============================================================
  console.log("Creating sample alerts...");
  await prisma.alert.createMany({
    data: [
      {
        organizationId: org.id,
        outletId: outlets["dawg-house"],
        alertType: "MANDATE_COMPLIANCE",
        severity: "WARNING",
        title: "Mandate item not ordered — Dawg House",
        message: "Grey Goose Vodka has not been ordered at Dawg House Saloon within the 7-day grace period.",
        isRead: false,
        isDismissed: false,
      },
      {
        organizationId: org.id,
        outletId: outlets["gatsbys"],
        alertType: "PULL_THROUGH_HIGH",
        severity: "INFO",
        title: "High pull-through — Gatsby's",
        message: "Don Julio 1942 usage at Gatsby's is 145% of 90-day average.",
        isRead: false,
        isDismissed: false,
      },
      {
        organizationId: org.id,
        outletId: outlets["pool-bar"],
        alertType: "DAYS_OF_INVENTORY",
        severity: "CRITICAL",
        title: "Low inventory — Pool Bar",
        message: "Bud Light at Pool Bar & Grill has only 2 days of inventory remaining (threshold: 5 days).",
        isRead: false,
        isDismissed: false,
      },
      {
        organizationId: org.id,
        outletId: outlets["stubborn-seed"],
        alertType: "PRICE_DISCREPANCY",
        severity: "WARNING",
        title: "Price discrepancy — Opus One",
        message: "Opus One is priced at $895 at Stubborn Seed but $750 at Crossroads Kitchen. Difference exceeds 5% threshold.",
        isRead: false,
        isDismissed: false,
      },
      {
        organizationId: org.id,
        outletId: outlets["famous-foods"],
        alertType: "COST_GOAL_EXCEEDED",
        severity: "WARNING",
        title: "Cost goal exceeded — Famous Foods",
        message: "Famous Foods Street Eats beer cost percentage is 28.3%, exceeding the 26% target.",
        isRead: false,
        isDismissed: false,
      },
    ],
  });
  console.log("  ✓ Created sample alerts");

  // ============================================================
  // 14. Sample recipes
  // ============================================================
  console.log("Creating sample recipes...");
  const margarita = await prisma.recipe.create({
    data: {
      name: "Classic Margarita",
      description: "Traditional margarita with fresh lime juice",
      organizationId: org.id,
      yieldServings: 1,
      sellingPrice: 16.00,
      category: "Cocktail",
      createdBy: adminUser.id,
      isActive: true,
    },
  });

  const patronProduct = await prisma.product.findFirst({ where: { sku: "SP-035" } }); // Patron Silver
  const cointreau = await prisma.product.findFirst({ where: { sku: "SP-064" } }); // Cointreau
  if (patronProduct && cointreau) {
    await prisma.recipeIngredient.createMany({
      data: [
        { recipeId: margarita.id, productId: patronProduct.id, quantity: 2.0, unit: "oz" },
        { recipeId: margarita.id, productId: cointreau.id, quantity: 1.0, unit: "oz" },
      ],
    });
  }

  const oldFashioned = await prisma.recipe.create({
    data: {
      name: "Old Fashioned",
      description: "Classic bourbon cocktail with bitters and orange",
      organizationId: org.id,
      yieldServings: 1,
      sellingPrice: 18.00,
      category: "Cocktail",
      createdBy: adminUser.id,
      isActive: true,
    },
  });

  const woodford = await prisma.product.findFirst({ where: { sku: "SP-013" } }); // Woodford Reserve
  const angostura = await prisma.product.findFirst({ where: { sku: "SP-078" } }); // Angostura Bitters
  if (woodford) {
    const ingredients = [
      { recipeId: oldFashioned.id, productId: woodford.id, quantity: 2.0, unit: "oz" },
    ];
    if (angostura) {
      ingredients.push({ recipeId: oldFashioned.id, productId: angostura.id, quantity: 0.1, unit: "oz" });
    }
    await prisma.recipeIngredient.createMany({ data: ingredients });
  }

  const espressoMartini = await prisma.recipe.create({
    data: {
      name: "Espresso Martini",
      description: "Vodka, Kahlua, fresh espresso",
      organizationId: org.id,
      yieldServings: 1,
      sellingPrice: 18.00,
      category: "Cocktail",
      createdBy: adminUser.id,
      isActive: true,
    },
  });

  const greyGoose = await prisma.product.findFirst({ where: { sku: "SP-001" } });
  const kahlua = await prisma.product.findFirst({ where: { sku: "SP-063" } });
  if (greyGoose && kahlua) {
    await prisma.recipeIngredient.createMany({
      data: [
        { recipeId: espressoMartini.id, productId: greyGoose.id, quantity: 1.5, unit: "oz" },
        { recipeId: espressoMartini.id, productId: kahlua.id, quantity: 0.5, unit: "oz" },
      ],
    });
  }

  console.log("  ✓ Created sample recipes");

  // ============================================================
  // 15. Hotel occupancy (last 3 months)
  // ============================================================
  console.log("Creating hotel occupancy data...");
  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    const base = redate(monthsAgo);
    for (let day = 1; day <= 28; day++) {
      const date = new Date(base.getFullYear(), base.getMonth(), day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      await prisma.hotelOccupancy.create({
        data: {
          organizationId: org.id,
          date,
          hotelGuests: isWeekend ? rand(2800, 3400) : rand(1800, 2600),
          restaurantCovers: isWeekend ? rand(4000, 5500) : rand(2500, 3800),
        },
      });
    }
  }
  console.log("  ✓ Created hotel occupancy data");

  // ============================================================
  // 16. Warehouse transfers (6 months, POS-calibrated daily issuances)
  //     Each transfer represents bottles leaving warehouse to outlet.
  //     Frequency and quantity driven by actual consumption rates.
  // ============================================================
  console.log("Generating warehouse transfers (POS-calibrated)...");
  let transferCount = 0;
  const transferBatch: Parameters<typeof prisma.warehouseTransfer.create>[0]["data"][] = [];

  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const baseDate = redate(monthsAgo);
    const monthIdx = baseDate.getMonth();

    for (const [slug, outletId] of Object.entries(outlets)) {
      const seasonalMult = getSeasonalMultiplier(slug, monthIdx);
      if (seasonalMult < 0.05) continue;

      const outletProds = getOutletProducts(slug);
      if (outletProds.length === 0) continue;

      for (const prod of outletProds) {
        const product = productMap.get(prod.sku);
        if (!product) continue;

        const dailyRate = getDailyBottleRate(prod.sku, slug, prod.size) * seasonalMult;
        if (dailyRate <= 0) continue;

        // Warehouse transfers happen 2-3x per week
        // Calculate bottles needed per transfer
        const daysPerTransfer = dailyRate >= 0.3 ? 3 : dailyRate >= 0.05 ? 7 : 14;
        const bottlesPerTransfer = dailyRate * daysPerTransfer;
        if (bottlesPerTransfer < 0.3 && Math.random() > bottlesPerTransfer * 3) continue;

        const transfersThisMonth = Math.max(1, Math.ceil(28 / daysPerTransfer));

        for (let t = 0; t < transfersThisMonth; t++) {
          const dayOfMonth = Math.min(28, Math.max(1, Math.round((t + 0.5) * (28 / transfersThisMonth))));
          const transferDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), dayOfMonth);
          const dow = transferDate.getDay();
          const dowMult = DAY_OF_WEEK_MULTIPLIERS[dow];

          const quantity = Math.max(1, Math.round(bottlesPerTransfer * dowMult * randFloat(0.8, 1.2)));
          const costPerUnit = Math.round(prod.cost * randFloat(0.97, 1.03) * 100) / 100;

          transferBatch.push({
            organizationId: org.id,
            outletId,
            productId: product.id,
            quantity,
            costPerUnit,
            totalCost: Math.round(quantity * costPerUnit * 100) / 100,
            transferDate,
            referenceNumber: `WT-${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(transferCount + 1).padStart(4, "0")}`,
          });
          transferCount++;
        }
      }
    }

    if (transferBatch.length > 0) {
      await prisma.warehouseTransfer.createMany({ data: transferBatch });
      transferBatch.length = 0;
    }
    console.log(`  ✓ Transfer month ${6 - monthsAgo}/6 — ${transferCount} total`);
  }
  if (transferBatch.length > 0) {
    await prisma.warehouseTransfer.createMany({ data: transferBatch });
    transferBatch.length = 0;
  }
  console.log(`  ✓ Created ${transferCount} warehouse transfers`);

  // ============================================================
  // 17. Inventory snapshots (current stock levels per outlet)
  //     Quantity on hand proportional to actual daily consumption.
  //     Represents ~3-10 days of supply with realistic variance.
  // ============================================================
  console.log("Generating inventory snapshots...");
  let snapshotCount = 0;
  const snapshotDate = new Date(2026, 1, 28); // Feb 28, 2026
  const snapshotMonthIdx = snapshotDate.getMonth();

  for (const [slug, outletId] of Object.entries(outlets)) {
    const outletProds = getOutletProducts(slug);
    const seasonalMult = getSeasonalMultiplier(slug, snapshotMonthIdx);

    for (const prod of outletProds) {
      const product = productMap.get(prod.sku);
      if (!product) continue;

      // Base inventory on actual daily consumption rate
      const dailyRate = getDailyBottleRate(prod.sku, slug, prod.size) * seasonalMult;

      let qtyOnHand: number;
      if (dailyRate <= 0) {
        qtyOnHand = rand(1, 3); // Rarely used item, keep a few on hand
      } else {
        // Normal stock: 3-10 days of supply
        const roll = Math.random();
        if (roll < 0.06) {
          qtyOnHand = 0; // Out of stock (6% chance)
        } else if (roll < 0.15) {
          // Low stock: 1-2 days supply
          qtyOnHand = Math.max(1, Math.round(dailyRate * randFloat(0.5, 2)));
        } else if (roll < 0.88) {
          // Normal: 4-8 days supply
          qtyOnHand = Math.max(1, Math.round(dailyRate * randFloat(4, 8)));
        } else {
          // Overstocked: 10-18 days supply (recent large delivery)
          qtyOnHand = Math.max(2, Math.round(dailyRate * randFloat(10, 18)));
        }
      }

      await prisma.inventorySnapshot.create({
        data: {
          outletId,
          productId: product.id,
          quantityOnHand: qtyOnHand,
          snapshotDate,
        },
      });
      snapshotCount++;
    }
  }
  console.log(`  ✓ Created ${snapshotCount} inventory snapshots`);

  // ============================================================
  // 18. Direct orders (items shipped directly from vendors to outlets)
  //     Direct orders represent specialty / high-value items sent
  //     straight from vendor to outlet, bypassing the warehouse.
  //     Quantities based on actual consumption rates (~2-4 weeks supply).
  // ============================================================
  console.log("Generating direct orders...");
  let directOrderCount = 0;

  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const baseDate = redate(monthsAgo);
    const monthIdx = baseDate.getMonth();

    // 3-5 outlets get direct shipments each month
    const directOutletEntries = pickRandom(Object.entries(outlets), rand(3, 5));

    for (const [slug, outletId] of directOutletEntries) {
      const seasonalMult = getSeasonalMultiplier(slug, monthIdx);
      if (seasonalMult < 0.05) continue;

      const outletProds = getOutletProducts(slug);
      // Pick a few specialty products for direct ship
      const directProds = pickRandom(outletProds, rand(2, 5));

      for (const prod of directProds) {
        const product = productMap.get(prod.sku);
        if (!product) continue;

        const dailyRate = getDailyBottleRate(prod.sku, slug, prod.size) * seasonalMult;
        // Direct orders are typically 2-4 weeks of supply
        const weeksSupply = randFloat(2, 4);
        const quantity = Math.max(1, Math.round(dailyRate * 7 * weeksSupply));

        const dayOfMonth = rand(1, 28);
        const orderDate = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          dayOfMonth
        );
        const receivedDate = new Date(
          orderDate.getTime() + rand(2, 7) * 24 * 60 * 60 * 1000
        );
        const costPerUnit = Math.round(prod.cost * randFloat(0.95, 1.02) * 100) / 100;

        await prisma.directOrder.create({
          data: {
            organizationId: org.id,
            outletId,
            productId: product.id,
            distributorId: distributorIds[prod.distributorIdx],
            supplierId: supplierIds[prod.supplierIdx],
            quantity,
            costPerUnit,
            totalCost: Math.round(quantity * costPerUnit * 100) / 100,
            orderDate,
            receivedDate,
            referenceNumber: `DO-${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(directOrderCount + 1).padStart(4, "0")}`,
          },
        });
        directOrderCount++;
      }
    }
  }
  console.log(`  ✓ Created ${directOrderCount} direct orders`);

  // ============================================================
  // 19. Price tracking (menu prices per product per outlet)
  // ============================================================
  console.log("Generating price tracking data...");
  let priceCount = 0;

  for (const [slug, outletId] of Object.entries(outlets)) {
    const outletProds = getOutletProducts(slug);
    // Track prices for 60-80% of products
    const pricedProducts = pickRandom(outletProds, Math.floor(outletProds.length * 0.7));
    const isPremiumOutlet = ["stubborn-seed", "wallys", "gatsbys", "genting-palace"].includes(slug);

    for (const prod of pricedProducts) {
      const product = productMap.get(prod.sku);
      if (!product) continue;

      // Menu price = cost x markup (varies by outlet type)
      const markup = isPremiumOutlet ? randFloat(3.5, 5.0) : randFloat(2.5, 4.0);
      const menuPrice = Math.round(prod.cost * markup * 100) / 100;

      // Create a price entry effective 3 months ago
      await prisma.priceTracking.create({
        data: {
          outletId,
          productId: product.id,
          menuPrice,
          effectiveDate: redate(3),
        },
      });
      priceCount++;

      // ~30% of products had a price change 1 month ago
      if (Math.random() < 0.3) {
        const priceChange = isPremiumOutlet ? randFloat(0.95, 1.12) : randFloat(0.97, 1.08);
        await prisma.priceTracking.create({
          data: {
            outletId,
            productId: product.id,
            menuPrice: Math.round(menuPrice * priceChange * 100) / 100,
            effectiveDate: redate(1),
          },
        });
        priceCount++;
      }
    }
  }
  console.log(`  ✓ Created ${priceCount} price tracking records`);

  // ============================================================
  // 20. Flash messages
  // ============================================================
  console.log("Creating sample flash messages...");
  await prisma.flashMessage.createMany({
    data: [
      {
        organizationId: org.id,
        senderId: directorUser.id,
        outletId: outlets["stubborn-seed"],
        subject: "Wine List Update",
        body: "Please update the wine list with the new Opus One vintage. Pricing info attached to the catalog entry.",
        isRead: false,
      },
      {
        organizationId: org.id,
        senderId: directorUser.id,
        subject: "Monthly Inventory Review",
        body: "All outlet managers — please complete your month-end inventory counts by March 3rd.",
        isRead: false,
      },
      {
        organizationId: org.id,
        senderId: directorUser.id,
        outletId: outlets["gatsbys"],
        subject: "Champagne Inventory for NYE Prep",
        body: "Gatsby's — please confirm your Dom Perignon and Ace of Spades inventory levels ahead of weekend VIP events.",
        isRead: false,
      },
    ],
  });
  console.log("  ✓ Created flash messages");

  // ============================================================
  // 13. Outlet Tracking Numbers
  // ============================================================
  console.log("\n12. Seeding outlet tracking numbers...");

  const TRACKING_NUMBERS: {
    slug: string;
    type: "POS" | "COST_CENTER" | "GL_CODE" | "PURCHASING_SYSTEM" | "INVENTORY_SYSTEM";
    value: string;
    notes?: string;
  }[] = [
    // All 20 outlets get POS IDs
    { slug: "wallys", type: "POS", value: "POS-1001", notes: "Main POS terminal" },
    { slug: "crossroads-kitchen", type: "POS", value: "POS-1002" },
    { slug: "viva", type: "POS", value: "POS-1003" },
    { slug: "stubborn-seed", type: "POS", value: "POS-1004" },
    { slug: "genting-palace", type: "POS", value: "POS-1005" },
    { slug: "famous-foods", type: "POS", value: "POS-1006" },
    { slug: "dawg-house", type: "POS", value: "POS-1007" },
    { slug: "alle-lounge", type: "POS", value: "POS-1008" },
    { slug: "gatsbys", type: "POS", value: "POS-1009" },
    { slug: "pool-bar", type: "POS", value: "POS-1010" },
    { slug: "zouk", type: "POS", value: "POS-2001" },
    { slug: "kusa-nori", type: "POS", value: "POS-2002" },
    { slug: "juniors", type: "POS", value: "POS-2003" },
    { slug: "fuhu", type: "POS", value: "POS-2004" },
    { slug: "conrad-lobby", type: "POS", value: "POS-2101" },
    { slug: "crockfords-lobby", type: "POS", value: "POS-2102" },
    { slug: "crystal-bar", type: "POS", value: "POS-2201" },
    { slug: "here-kitty-kitty", type: "POS", value: "POS-2202" },
    { slug: "golden-monkey", type: "POS", value: "POS-2203" },
    { slug: "high-limit-bar", type: "POS", value: "POS-2210" },

    // Fine dining outlets get Cost Center + GL Code
    { slug: "wallys", type: "COST_CENTER", value: "CC-5001", notes: "Wine bar operations" },
    { slug: "wallys", type: "GL_CODE", value: "GL-8001" },
    { slug: "crossroads-kitchen", type: "COST_CENTER", value: "CC-5002" },
    { slug: "crossroads-kitchen", type: "GL_CODE", value: "GL-8002" },
    { slug: "kusa-nori", type: "COST_CENTER", value: "CC-5012" },
    { slug: "kusa-nori", type: "GL_CODE", value: "GL-8012" },
    { slug: "fuhu", type: "COST_CENTER", value: "CC-5014" },
    { slug: "fuhu", type: "GL_CODE", value: "GL-8014" },
    { slug: "gatsbys", type: "COST_CENTER", value: "CC-5009", notes: "VIP lounge" },
    { slug: "gatsbys", type: "GL_CODE", value: "GL-8009" },
    { slug: "genting-palace", type: "COST_CENTER", value: "CC-5005" },
    { slug: "genting-palace", type: "GL_CODE", value: "GL-8005" },

    // Nightlife venues get Cost Center
    { slug: "zouk", type: "COST_CENTER", value: "CC-6001", notes: "Nightclub & events" },
    { slug: "here-kitty-kitty", type: "COST_CENTER", value: "CC-6002" },

    // High-limit bar gets Inventory System
    { slug: "high-limit-bar", type: "INVENTORY_SYSTEM", value: "INV-HLB-01", notes: "Premium spirits tracking" },
    { slug: "zouk", type: "INVENTORY_SYSTEM", value: "INV-ZNK-01", notes: "Bottle service inventory" },
  ];

  let trackingCount = 0;
  for (const tn of TRACKING_NUMBERS) {
    const outletId = outlets[tn.slug];
    if (!outletId) {
      console.log(`  ⚠ Skipping tracking number for unknown outlet: ${tn.slug}`);
      continue;
    }

    await prisma.outletTrackingNumber.create({
      data: {
        outletId,
        type: tn.type,
        value: tn.value,
        notes: tn.notes ?? null,
      },
    });
    trackingCount++;
  }
  console.log(`  ✓ Created ${trackingCount} tracking numbers`);

  // ============================================================
  // Summary
  // ============================================================
  console.log("\n✅ Seed complete!");
  console.log(`   Organization: ${org.name}`);
  console.log(`   Outlets: ${Object.keys(outlets).length}`);
  console.log(`   Distributors: ${DISTRIBUTORS.length} (real Nevada distributors)`);
  console.log(`   Suppliers: ${SUPPLIERS.length} (real brand owners)`);
  console.log(`   Products: ${PRODUCTS.length}`);
  console.log(`   Orders: ${orderCount}`);
  console.log(`   Sales records: ${salesCount}`);
  console.log(`   Warehouse transfers: ${transferCount}`);
  console.log(`   Inventory snapshots: ${snapshotCount}`);
  console.log(`   Direct orders: ${directOrderCount}`);
  console.log(`   Price tracking: ${priceCount}`);
  console.log(`   Tracking numbers: ${trackingCount}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
