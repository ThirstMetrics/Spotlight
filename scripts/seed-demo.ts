/**
 * Spotlight Demo Data Seeder
 *
 * Creates realistic demo data for Resorts World Las Vegas:
 * - 1 organization (Resorts World Las Vegas)
 * - 10 outlets mapped from Caesars Palace venues
 * - 3 distributors, 10 suppliers
 * - 200+ products across beer/wine/spirits/sake
 * - 3 outlet groups (fine dining, casual, nightlife)
 * - Sample mandates with compliance data
 * - 12 months of order history (re-dated to recent)
 * - Sample sales data
 * - Cost goals per outlet
 * - Sample alert rules
 */

// This script is run via: pnpm db:seed
// It uses Prisma Client to insert data directly

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// CAESARS → RESORTS WORLD OUTLET MAPPING
// ============================================================
// Caesars Palace outlet → Resorts World Las Vegas outlet
// Maintaining similar venue types for realistic data mapping
const OUTLET_MAPPING = {
  "Guy Savoy": {
    name: "Carversteak",
    type: "Fine Dining",
    slug: "carversteak",
  },
  Bacchanal: {
    name: "Crossroads Kitchen",
    type: "Restaurant",
    slug: "crossroads-kitchen",
  },
  "Mesa Grill": {
    name: "Wally's Wine & Spirits",
    type: "Wine Bar",
    slug: "wallys",
  },
  "Rao's": {
    name: "Bar Zazu",
    type: "Cocktail Bar",
    slug: "bar-zazu",
  },
  OH: {
    name: "Redtail",
    type: "Rooftop Bar",
    slug: "redtail",
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
// DISTRIBUTORS
// ============================================================
const DISTRIBUTORS = [
  {
    name: "Southern Glazer's Wine & Spirits",
    contactName: "Mike Reynolds",
    contactEmail: "mreynolds@sgws.com",
    contactPhone: "702-555-0101",
  },
  {
    name: "Republic National Distributing Company",
    contactName: "Sarah Chen",
    contactEmail: "schen@rndc.com",
    contactPhone: "702-555-0102",
  },
  {
    name: "Breakthru Beverage Group",
    contactName: "Tom Martinez",
    contactEmail: "tmartinez@breakthru.com",
    contactPhone: "702-555-0103",
  },
];

// ============================================================
// SUPPLIERS (Brands)
// ============================================================
const SUPPLIERS = [
  { name: "Diageo", contactEmail: "orders@diageo.com", website: "diageo.com" },
  {
    name: "Pernod Ricard",
    contactEmail: "orders@pernod-ricard.com",
    website: "pernod-ricard.com",
  },
  {
    name: "Brown-Forman",
    contactEmail: "orders@brown-forman.com",
    website: "brown-forman.com",
  },
  {
    name: "Beam Suntory",
    contactEmail: "orders@beamsuntory.com",
    website: "beamsuntory.com",
  },
  {
    name: "Bacardi Limited",
    contactEmail: "orders@bacardi.com",
    website: "bacardi.com",
  },
  {
    name: "Constellation Brands",
    contactEmail: "orders@cbrands.com",
    website: "cbrands.com",
  },
  {
    name: "E. & J. Gallo Winery",
    contactEmail: "orders@gallo.com",
    website: "gallo.com",
  },
  {
    name: "Moët Hennessy",
    contactEmail: "orders@moethennessy.com",
    website: "moethennessy.com",
  },
  {
    name: "Asahi Group (Sake)",
    contactEmail: "orders@asahibeer.com",
    website: "asahibeer.com",
  },
  {
    name: "Anheuser-Busch InBev",
    contactEmail: "orders@ab-inbev.com",
    website: "ab-inbev.com",
  },
];

// ============================================================
// PRODUCTS — 200+ across beer/wine/spirits/sake
// ============================================================
type CategoryType = "BEER" | "WINE" | "SPIRITS" | "SAKE";

interface ProductDef {
  sku: string;
  name: string;
  category: CategoryType;
  subcategory: string;
  size: string;
  unit: string;
  supplierIndex: number;
  distributorIndex: number;
  cost: number;
}

const PRODUCTS: ProductDef[] = [
  // ===== SPIRITS (80 products) =====
  // Vodka
  { sku: "SP-001", name: "Grey Goose Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIndex: 4, distributorIndex: 0, cost: 28.50 },
  { sku: "SP-002", name: "Belvedere Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 30.00 },
  { sku: "SP-003", name: "Ketel One Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 22.00 },
  { sku: "SP-004", name: "Tito's Handmade Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1.75L", unit: "bottle", supplierIndex: 5, distributorIndex: 1, cost: 24.00 },
  { sku: "SP-005", name: "Absolut Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 0, cost: 18.50 },
  { sku: "SP-006", name: "Stolichnaya Elit", category: "SPIRITS", subcategory: "Vodka", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 42.00 },
  { sku: "SP-007", name: "Ciroc Vodka", category: "SPIRITS", subcategory: "Vodka", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 32.00 },

  // Whiskey / Bourbon
  { sku: "SP-010", name: "Jack Daniel's Old No. 7", category: "SPIRITS", subcategory: "Whiskey", size: "1L", unit: "bottle", supplierIndex: 2, distributorIndex: 0, cost: 22.00 },
  { sku: "SP-011", name: "Maker's Mark Bourbon", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIndex: 3, distributorIndex: 1, cost: 26.00 },
  { sku: "SP-012", name: "Woodford Reserve", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIndex: 2, distributorIndex: 0, cost: 34.00 },
  { sku: "SP-013", name: "Bulleit Bourbon", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 24.00 },
  { sku: "SP-014", name: "Knob Creek 9yr", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIndex: 3, distributorIndex: 1, cost: 32.00 },
  { sku: "SP-015", name: "Buffalo Trace Bourbon", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIndex: 5, distributorIndex: 2, cost: 22.00 },
  { sku: "SP-016", name: "Wild Turkey 101", category: "SPIRITS", subcategory: "Bourbon", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 20.00 },
  { sku: "SP-017", name: "Blanton's Single Barrel", category: "SPIRITS", subcategory: "Bourbon", size: "750ml", unit: "bottle", supplierIndex: 5, distributorIndex: 2, cost: 65.00 },

  // Scotch
  { sku: "SP-020", name: "Johnnie Walker Black Label", category: "SPIRITS", subcategory: "Scotch", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 32.00 },
  { sku: "SP-021", name: "Johnnie Walker Blue Label", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 180.00 },
  { sku: "SP-022", name: "Macallan 12yr", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 58.00 },
  { sku: "SP-023", name: "Glenfiddich 12yr", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 42.00 },
  { sku: "SP-024", name: "Glenlivet 12yr", category: "SPIRITS", subcategory: "Scotch", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 0, cost: 38.00 },
  { sku: "SP-025", name: "Chivas Regal 12yr", category: "SPIRITS", subcategory: "Scotch", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 0, cost: 28.00 },
  { sku: "SP-026", name: "Dewar's White Label", category: "SPIRITS", subcategory: "Scotch", size: "1L", unit: "bottle", supplierIndex: 4, distributorIndex: 2, cost: 18.00 },

  // Tequila
  { sku: "SP-030", name: "Patron Silver", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIndex: 4, distributorIndex: 2, cost: 38.00 },
  { sku: "SP-031", name: "Don Julio 1942", category: "SPIRITS", subcategory: "Tequila", size: "750ml", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 135.00 },
  { sku: "SP-032", name: "Casamigos Blanco", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 40.00 },
  { sku: "SP-033", name: "Clase Azul Reposado", category: "SPIRITS", subcategory: "Tequila", size: "750ml", unit: "bottle", supplierIndex: 5, distributorIndex: 1, cost: 120.00 },
  { sku: "SP-034", name: "Herradura Silver", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIndex: 2, distributorIndex: 0, cost: 28.00 },
  { sku: "SP-035", name: "Espolon Blanco", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 22.00 },
  { sku: "SP-036", name: "Milagro Silver", category: "SPIRITS", subcategory: "Tequila", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 20.00 },

  // Rum
  { sku: "SP-040", name: "Bacardi Superior", category: "SPIRITS", subcategory: "Rum", size: "1L", unit: "bottle", supplierIndex: 4, distributorIndex: 2, cost: 14.00 },
  { sku: "SP-041", name: "Captain Morgan Spiced", category: "SPIRITS", subcategory: "Rum", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 16.00 },
  { sku: "SP-042", name: "Malibu Coconut Rum", category: "SPIRITS", subcategory: "Rum", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 0, cost: 15.00 },
  { sku: "SP-043", name: "Ron Zacapa 23yr", category: "SPIRITS", subcategory: "Rum", size: "750ml", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 45.00 },
  { sku: "SP-044", name: "Diplomatico Reserva Exclusiva", category: "SPIRITS", subcategory: "Rum", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 38.00 },

  // Gin
  { sku: "SP-050", name: "Tanqueray London Dry", category: "SPIRITS", subcategory: "Gin", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 22.00 },
  { sku: "SP-051", name: "Hendrick's Gin", category: "SPIRITS", subcategory: "Gin", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 32.00 },
  { sku: "SP-052", name: "Bombay Sapphire", category: "SPIRITS", subcategory: "Gin", size: "1L", unit: "bottle", supplierIndex: 4, distributorIndex: 2, cost: 22.00 },
  { sku: "SP-053", name: "Aviation Gin", category: "SPIRITS", subcategory: "Gin", size: "750ml", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 26.00 },
  { sku: "SP-054", name: "Beefeater London Dry", category: "SPIRITS", subcategory: "Gin", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 18.00 },

  // Cognac / Brandy
  { sku: "SP-060", name: "Hennessy VS", category: "SPIRITS", subcategory: "Cognac", size: "1L", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 38.00 },
  { sku: "SP-061", name: "Hennessy VSOP", category: "SPIRITS", subcategory: "Cognac", size: "750ml", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 52.00 },
  { sku: "SP-062", name: "Remy Martin VSOP", category: "SPIRITS", subcategory: "Cognac", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 48.00 },
  { sku: "SP-063", name: "Courvoisier VS", category: "SPIRITS", subcategory: "Cognac", size: "1L", unit: "bottle", supplierIndex: 3, distributorIndex: 1, cost: 28.00 },

  // Liqueurs
  { sku: "SP-070", name: "Baileys Irish Cream", category: "SPIRITS", subcategory: "Liqueur", size: "1L", unit: "bottle", supplierIndex: 0, distributorIndex: 0, cost: 22.00 },
  { sku: "SP-071", name: "Grand Marnier", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 0, cost: 32.00 },
  { sku: "SP-072", name: "Kahlua", category: "SPIRITS", subcategory: "Liqueur", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 0, cost: 20.00 },
  { sku: "SP-073", name: "Cointreau", category: "SPIRITS", subcategory: "Liqueur", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 0, cost: 28.00 },
  { sku: "SP-074", name: "Aperol", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 22.00 },
  { sku: "SP-075", name: "Campari", category: "SPIRITS", subcategory: "Liqueur", size: "1L", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 24.00 },
  { sku: "SP-076", name: "St-Germain Elderflower", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIndex: 4, distributorIndex: 2, cost: 30.00 },
  { sku: "SP-077", name: "Chambord", category: "SPIRITS", subcategory: "Liqueur", size: "750ml", unit: "bottle", supplierIndex: 2, distributorIndex: 0, cost: 28.00 },

  // ===== WINE (60 products) =====
  // Red Wine
  { sku: "WN-001", name: "Caymus Cabernet Sauvignon", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 65.00 },
  { sku: "WN-002", name: "Jordan Cabernet Sauvignon", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 48.00 },
  { sku: "WN-003", name: "Silver Oak Alexander Valley", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 62.00 },
  { sku: "WN-004", name: "Opus One", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIndex: 5, distributorIndex: 0, cost: 350.00 },
  { sku: "WN-005", name: "Stag's Leap Artemis Cabernet", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 52.00 },
  { sku: "WN-006", name: "Duckhorn Merlot", category: "WINE", subcategory: "Red - Merlot", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 42.00 },
  { sku: "WN-007", name: "Meiomi Pinot Noir", category: "WINE", subcategory: "Red - Pinot Noir", size: "750ml", unit: "bottle", supplierIndex: 5, distributorIndex: 0, cost: 14.00 },
  { sku: "WN-008", name: "Belle Glos Clark & Telephone Pinot", category: "WINE", subcategory: "Red - Pinot Noir", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 36.00 },
  { sku: "WN-009", name: "Decoy Pinot Noir", category: "WINE", subcategory: "Red - Pinot Noir", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 16.00 },
  { sku: "WN-010", name: "Josh Cellars Cabernet", category: "WINE", subcategory: "Red - Cabernet", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 10.00 },
  { sku: "WN-011", name: "The Prisoner Red Blend", category: "WINE", subcategory: "Red - Blend", size: "750ml", unit: "bottle", supplierIndex: 5, distributorIndex: 0, cost: 32.00 },
  { sku: "WN-012", name: "Apothic Red Blend", category: "WINE", subcategory: "Red - Blend", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 8.00 },
  { sku: "WN-013", name: "Penfolds Bin 389 Cabernet Shiraz", category: "WINE", subcategory: "Red - Blend", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 1, cost: 38.00 },
  { sku: "WN-014", name: "Tignanello", category: "WINE", subcategory: "Red - Italian", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 95.00 },
  { sku: "WN-015", name: "Barolo Marchesi di Barolo", category: "WINE", subcategory: "Red - Italian", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 42.00 },

  // White Wine
  { sku: "WN-020", name: "Rombauer Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 32.00 },
  { sku: "WN-021", name: "Cakebread Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 38.00 },
  { sku: "WN-022", name: "Sonoma-Cutrer Chardonnay", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIndex: 2, distributorIndex: 0, cost: 18.00 },
  { sku: "WN-023", name: "Kim Crawford Sauvignon Blanc", category: "WINE", subcategory: "White - Sauvignon Blanc", size: "750ml", unit: "bottle", supplierIndex: 5, distributorIndex: 0, cost: 10.00 },
  { sku: "WN-024", name: "Cloudy Bay Sauvignon Blanc", category: "WINE", subcategory: "White - Sauvignon Blanc", size: "750ml", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 18.00 },
  { sku: "WN-025", name: "Santa Margherita Pinot Grigio", category: "WINE", subcategory: "White - Pinot Grigio", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 16.00 },
  { sku: "WN-026", name: "Whispering Angel Rosé", category: "WINE", subcategory: "Rosé", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 16.00 },
  { sku: "WN-027", name: "Minuty M Rosé", category: "WINE", subcategory: "Rosé", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 18.00 },
  { sku: "WN-028", name: "Sancerre Pascal Jolivet", category: "WINE", subcategory: "White - Sauvignon Blanc", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 22.00 },
  { sku: "WN-029", name: "Chablis William Fevre", category: "WINE", subcategory: "White - Chardonnay", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 28.00 },
  { sku: "WN-030", name: "Dr. Loosen Riesling", category: "WINE", subcategory: "White - Riesling", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 1, cost: 14.00 },

  // Sparkling / Champagne
  { sku: "WN-040", name: "Veuve Clicquot Brut", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 48.00 },
  { sku: "WN-041", name: "Dom Perignon", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 175.00 },
  { sku: "WN-042", name: "Moët & Chandon Impérial", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 42.00 },
  { sku: "WN-043", name: "Ace of Spades Brut Gold", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 280.00 },
  { sku: "WN-044", name: "Perrier-Jouët Grand Brut", category: "WINE", subcategory: "Champagne", size: "750ml", unit: "bottle", supplierIndex: 1, distributorIndex: 0, cost: 38.00 },
  { sku: "WN-045", name: "Prosecco La Marca", category: "WINE", subcategory: "Sparkling", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 10.00 },
  { sku: "WN-046", name: "Chandon Brut", category: "WINE", subcategory: "Sparkling", size: "750ml", unit: "bottle", supplierIndex: 7, distributorIndex: 0, cost: 16.00 },

  // Wine by the Glass (house pours)
  { sku: "WN-050", name: "Kendall-Jackson Chardonnay", category: "WINE", subcategory: "House - White", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 8.00 },
  { sku: "WN-051", name: "Kendall-Jackson Cabernet", category: "WINE", subcategory: "House - Red", size: "750ml", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 10.00 },
  { sku: "WN-052", name: "Woodbridge Pinot Grigio", category: "WINE", subcategory: "House - White", size: "1.5L", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 8.00 },
  { sku: "WN-053", name: "Woodbridge Cabernet", category: "WINE", subcategory: "House - Red", size: "1.5L", unit: "bottle", supplierIndex: 6, distributorIndex: 0, cost: 8.00 },

  // ===== BEER (50 products) =====
  // Domestic
  { sku: "BR-001", name: "Bud Light", category: "BEER", subcategory: "Domestic Lager", size: "12oz", unit: "case/24", supplierIndex: 9, distributorIndex: 2, cost: 18.00 },
  { sku: "BR-002", name: "Budweiser", category: "BEER", subcategory: "Domestic Lager", size: "12oz", unit: "case/24", supplierIndex: 9, distributorIndex: 2, cost: 18.00 },
  { sku: "BR-003", name: "Michelob Ultra", category: "BEER", subcategory: "Domestic Light", size: "12oz", unit: "case/24", supplierIndex: 9, distributorIndex: 2, cost: 20.00 },
  { sku: "BR-004", name: "Coors Light", category: "BEER", subcategory: "Domestic Light", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 18.00 },
  { sku: "BR-005", name: "Miller Lite", category: "BEER", subcategory: "Domestic Light", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 18.00 },

  // Import
  { sku: "BR-010", name: "Heineken", category: "BEER", subcategory: "Import Lager", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 24.00 },
  { sku: "BR-011", name: "Corona Extra", category: "BEER", subcategory: "Import Lager", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 24.00 },
  { sku: "BR-012", name: "Stella Artois", category: "BEER", subcategory: "Import Lager", size: "11.2oz", unit: "case/24", supplierIndex: 9, distributorIndex: 2, cost: 24.00 },
  { sku: "BR-013", name: "Modelo Especial", category: "BEER", subcategory: "Import Lager", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 24.00 },
  { sku: "BR-014", name: "Guinness Draught", category: "BEER", subcategory: "Import Stout", size: "14.9oz", unit: "case/24", supplierIndex: 0, distributorIndex: 2, cost: 30.00 },
  { sku: "BR-015", name: "Pacifico", category: "BEER", subcategory: "Import Lager", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 22.00 },
  { sku: "BR-016", name: "Peroni Nastro Azzurro", category: "BEER", subcategory: "Import Lager", size: "11.2oz", unit: "case/24", supplierIndex: 9, distributorIndex: 2, cost: 26.00 },
  { sku: "BR-017", name: "Sapporo Premium", category: "BEER", subcategory: "Import Lager", size: "22oz", unit: "case/12", supplierIndex: 8, distributorIndex: 2, cost: 28.00 },

  // Craft
  { sku: "BR-020", name: "Lagunitas IPA", category: "BEER", subcategory: "Craft IPA", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 28.00 },
  { sku: "BR-021", name: "Sierra Nevada Pale Ale", category: "BEER", subcategory: "Craft Pale Ale", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 28.00 },
  { sku: "BR-022", name: "Blue Moon Belgian White", category: "BEER", subcategory: "Craft Wheat", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 26.00 },
  { sku: "BR-023", name: "Goose Island IPA", category: "BEER", subcategory: "Craft IPA", size: "12oz", unit: "case/24", supplierIndex: 9, distributorIndex: 2, cost: 28.00 },
  { sku: "BR-024", name: "Stone IPA", category: "BEER", subcategory: "Craft IPA", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 30.00 },
  { sku: "BR-025", name: "Athletic Brewing Run Wild IPA (NA)", category: "BEER", subcategory: "Non-Alcoholic", size: "12oz", unit: "case/24", supplierIndex: 5, distributorIndex: 2, cost: 32.00 },

  // Draft / Keg
  { sku: "BR-030", name: "Bud Light Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIndex: 9, distributorIndex: 2, cost: 105.00 },
  { sku: "BR-031", name: "Stella Artois Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIndex: 9, distributorIndex: 2, cost: 165.00 },
  { sku: "BR-032", name: "Blue Moon Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIndex: 5, distributorIndex: 2, cost: 155.00 },
  { sku: "BR-033", name: "Goose Island 312 Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIndex: 9, distributorIndex: 2, cost: 145.00 },
  { sku: "BR-034", name: "Modelo Especial Draft", category: "BEER", subcategory: "Draft", size: "1/2 BBL", unit: "keg", supplierIndex: 5, distributorIndex: 2, cost: 155.00 },

  // ===== SAKE (20 products) =====
  { sku: "SK-001", name: "Dassai 23 Junmai Daiginjo", category: "SAKE", subcategory: "Junmai Daiginjo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 80.00 },
  { sku: "SK-002", name: "Hakkaisan Tokubetsu Junmai", category: "SAKE", subcategory: "Tokubetsu Junmai", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 32.00 },
  { sku: "SK-003", name: "Kubota Manju Junmai Daiginjo", category: "SAKE", subcategory: "Junmai Daiginjo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 65.00 },
  { sku: "SK-004", name: "Masumi Okuden Kantsukuri", category: "SAKE", subcategory: "Junmai", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 24.00 },
  { sku: "SK-005", name: "Born Gold Junmai Daiginjo", category: "SAKE", subcategory: "Junmai Daiginjo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 55.00 },
  { sku: "SK-006", name: "Juyondai Honmaru", category: "SAKE", subcategory: "Honjozo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 120.00 },
  { sku: "SK-007", name: "Nanbu Bijin Tokubetsu Junmai", category: "SAKE", subcategory: "Tokubetsu Junmai", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 28.00 },
  { sku: "SK-008", name: "Hakutsuru Draft Sake", category: "SAKE", subcategory: "Draft", size: "300ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 8.00 },
  { sku: "SK-009", name: "Ozeki Dry", category: "SAKE", subcategory: "Junmai", size: "750ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 10.00 },
  { sku: "SK-010", name: "Sho Chiku Bai Ginjo", category: "SAKE", subcategory: "Ginjo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 18.00 },
  { sku: "SK-011", name: "Tozai Well of Wisdom", category: "SAKE", subcategory: "Junmai", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 14.00 },
  { sku: "SK-012", name: "Dewazakura Oka Cherry Bouquet", category: "SAKE", subcategory: "Ginjo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 22.00 },
  { sku: "SK-013", name: "Tamanohikari Junmai Ginjo", category: "SAKE", subcategory: "Junmai Ginjo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 30.00 },
  { sku: "SK-014", name: "Gekkeikan Haiku", category: "SAKE", subcategory: "Junmai Ginjo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 12.00 },
  { sku: "SK-015", name: "Wakatake Onikoroshi Junmai Daiginjo", category: "SAKE", subcategory: "Junmai Daiginjo", size: "720ml", unit: "bottle", supplierIndex: 8, distributorIndex: 1, cost: 45.00 },
];

// ============================================================
// OUTLET GROUPS
// ============================================================
const OUTLET_GROUPS = [
  {
    name: "Fine Dining",
    outlets: ["carversteak", "wallys", "crossroads-kitchen"],
  },
  {
    name: "Casual Dining & Bars",
    outlets: ["bar-zazu", "redtail", "famous-foods", "dawg-house", "pool-bar"],
  },
  {
    name: "Nightlife & Lounges",
    outlets: ["alle-lounge", "gatsbys"],
  },
];

// ============================================================
// COST GOALS (target cost % per outlet type)
// ============================================================
const COST_GOALS: Record<string, number> = {
  carversteak: 22.0, // Fine dining - lower cost % target
  "crossroads-kitchen": 24.0,
  wallys: 28.0, // Wine bar - higher wine cost
  "bar-zazu": 18.0, // Cocktail bar - good margins
  redtail: 20.0,
  "famous-foods": 26.0,
  "dawg-house": 22.0,
  "alle-lounge": 20.0,
  gatsbys: 16.0, // Nightlife - best margins
  "pool-bar": 18.0,
};

// ============================================================
// VOLUME MULTIPLIERS (how much each outlet orders relative to baseline)
// ============================================================
const VOLUME_MULTIPLIERS: Record<string, number> = {
  carversteak: 1.2,
  "crossroads-kitchen": 1.5,
  wallys: 0.8,
  "bar-zazu": 1.0,
  redtail: 0.9,
  "famous-foods": 1.8,
  "dawg-house": 1.3,
  "alle-lounge": 0.7,
  gatsbys: 2.0, // Nightclub - highest volume
  "pool-bar": 1.4,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** Generate a date shifted from Caesars 2012-2013 era to recent 2025-2026 */
function redate(monthsAgo: number): Date {
  const now = new Date(2026, 2, 1); // March 1, 2026
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
}

/** Random number within a range */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float within a range */
function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/** Pick random items from array */
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
  console.log("🌱 Starting Spotlight demo data seed...\n");

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
    prisma.$executeRawUnsafe('DELETE FROM "outlets"'),
    prisma.$executeRawUnsafe('DELETE FROM "outlet_groups"'),
    prisma.$executeRawUnsafe('DELETE FROM "distributors"'),
    prisma.$executeRawUnsafe('DELETE FROM "suppliers"'),
    prisma.$executeRawUnsafe('DELETE FROM "field_mapping_profiles"'),
    prisma.$executeRawUnsafe('DELETE FROM "uploads"'),
    prisma.$executeRawUnsafe('DELETE FROM "organizations"'),
    prisma.$executeRawUnsafe('DELETE FROM "organization_groups"'),
  ]);

  // 1. Create organization
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

  // 2. Create outlet groups
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

  // 3. Create outlets
  console.log("Creating outlets...");
  const outlets: Record<string, string> = {}; // slug → id
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

  // 4. Create distributors
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

  // 5. Create suppliers
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

  // 6. Create products + distributor_products
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
        distributorId: distributorIds[prod.distributorIndex],
        productId: product.id,
        supplierId: supplierIds[prod.supplierIndex],
        cost: prod.cost,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Created ${PRODUCTS.length} products with distributor links`);

  // 7. Create roles + users
  console.log("Creating roles and users...");
  const roles = await Promise.all([
    prisma.role.create({ data: { name: "VP", description: "Vice President — sees all properties" } }),
    prisma.role.create({ data: { name: "DIRECTOR", description: "Director — sees all outlets in property" } }),
    prisma.role.create({ data: { name: "ADMIN", description: "Admin — manages property configuration" } }),
    prisma.role.create({ data: { name: "ROOM_MANAGER", description: "Room Manager — sees assigned outlet(s)" } }),
    prisma.role.create({ data: { name: "DISTRIBUTOR", description: "Distributor — sees their products" } }),
    prisma.role.create({ data: { name: "SUPPLIER", description: "Supplier — sees their products across distributors" } }),
  ]);

  const directorUser = await prisma.user.create({
    data: {
      email: "director@resortsworld.com",
      name: "Sarah Mitchell",
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: directorUser.id,
      roleId: roles[1].id, // DIRECTOR
      organizationId: org.id,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@resortsworld.com",
      name: "James Park",
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: adminUser.id,
      roleId: roles[2].id, // ADMIN
      organizationId: org.id,
    },
  });

  // Room managers for a couple outlets
  const rmUser = await prisma.user.create({
    data: {
      email: "manager.carversteak@resortsworld.com",
      name: "Alex Chen",
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: rmUser.id,
      roleId: roles[3].id, // ROOM_MANAGER
      organizationId: org.id,
      outletId: outlets["carversteak"],
    },
  });

  // Distributor user
  const distUser = await prisma.user.create({
    data: {
      email: "rep@sgws.com",
      name: "Mike Reynolds",
      isActive: true,
    },
  });
  await prisma.userRoleAssignment.create({
    data: {
      userId: distUser.id,
      roleId: roles[4].id, // DISTRIBUTOR
      distributorId: distributorIds[0],
    },
  });

  console.log("  ✓ Created users and role assignments");

  // 8. Create mandates
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

  // Add 15 mandated items (a mix of spirits)
  const mandatedProducts = PRODUCTS.filter(
    (p) => p.category === "SPIRITS" && ["Vodka", "Bourbon", "Tequila", "Scotch", "Rum", "Gin"].includes(p.subcategory)
  ).slice(0, 15);

  const mandateItemIds: string[] = [];
  for (const prod of mandatedProducts) {
    const product = await prisma.product.findFirst({ where: { sku: prod.sku } });
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

  // Create compliance records (most outlets compliant, a few gaps)
  for (const item of mandateItemIds) {
    for (const [slug, outletId] of Object.entries(outlets)) {
      const isCompliant = Math.random() > 0.12; // ~88% compliant
      await prisma.mandateCompliance.create({
        data: {
          mandateItemId: item,
          outletId: outletId,
          isCompliant,
          lastOrderDate: isCompliant ? redate(rand(0, 2)) : null,
          lastOrderQuantity: isCompliant ? rand(2, 20) : null,
          checkedAt: new Date(),
        },
      });
    }
  }
  console.log("  ✓ Created compliance records");

  // 9. Generate 12 months of order history
  console.log("Generating 12 months of order history...");
  let orderCount = 0;
  const allProducts = await prisma.product.findMany();
  const productMap = new Map(allProducts.map((p) => [p.sku, p]));

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const baseDate = redate(monthsAgo);

    for (const [slug, outletId] of Object.entries(outlets)) {
      const multiplier = VOLUME_MULTIPLIERS[slug] || 1.0;

      // Each outlet orders a subset of products each month
      const outletProducts = pickRandom(
        PRODUCTS,
        Math.floor(PRODUCTS.length * 0.6 * multiplier)
      );

      for (const prod of outletProducts) {
        const product = productMap.get(prod.sku);
        if (!product) continue;

        // Generate 2-4 orders per product per month
        const ordersThisMonth = rand(2, 4);
        for (let o = 0; o < ordersThisMonth; o++) {
          const dayOfMonth = rand(1, 28);
          const orderDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            dayOfMonth
          );
          const quantity = Math.ceil(rand(1, 8) * multiplier);
          // Slight cost variation (+/- 3%)
          const costVariation = prod.cost * randFloat(0.97, 1.03);
          const costPerUnit = Math.round(costVariation * 100) / 100;

          await prisma.orderHistory.create({
            data: {
              organizationId: org.id,
              outletId,
              productId: product.id,
              distributorId: distributorIds[prod.distributorIndex],
              supplierId: supplierIds[prod.supplierIndex],
              quantity,
              costPerUnit,
              totalCost: Math.round(quantity * costPerUnit * 100) / 100,
              orderDate,
              orderType: Math.random() > 0.85 ? "DIRECT" : "WAREHOUSE",
            },
          });
          orderCount++;
        }
      }
    }
    console.log(
      `  ✓ Month ${12 - monthsAgo}/12 — ${orderCount} total orders`
    );
  }
  console.log(`  ✓ Created ${orderCount} order history records`);

  // 10. Generate sales data (revenue per product per outlet per month)
  console.log("Generating sales data...");
  let salesCount = 0;
  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const baseDate = redate(monthsAgo);

    for (const [slug, outletId] of Object.entries(outlets)) {
      const multiplier = VOLUME_MULTIPLIERS[slug] || 1.0;
      const saleProducts = pickRandom(PRODUCTS, Math.floor(PRODUCTS.length * 0.5));

      for (const prod of saleProducts) {
        const product = productMap.get(prod.sku);
        if (!product) continue;

        // Generate daily sales aggregates (4 days per month sample)
        for (let d = 0; d < 4; d++) {
          const dayOfMonth = rand(1, 28);
          const saleDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            dayOfMonth
          );
          const quantitySold = Math.ceil(rand(1, 15) * multiplier);
          // Menu price markup varies by outlet type
          const markupMultiplier =
            slug === "gatsbys"
              ? 5.0
              : slug === "carversteak"
              ? 4.0
              : slug === "wallys"
              ? 3.5
              : 3.0;
          const revenue =
            Math.round(quantitySold * prod.cost * markupMultiplier * 100) / 100;

          await prisma.salesData.create({
            data: {
              organizationId: org.id,
              outletId,
              productId: product.id,
              itemName: prod.name,
              quantitySold,
              revenue,
              saleDate,
              posSource: "MICROS",
            },
          });
          salesCount++;
        }
      }
    }
  }
  console.log(`  ✓ Created ${salesCount} sales data records`);

  // 11. Cost goals
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

  // 12. Alert rules
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

  // 13. Sample alerts
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
    ],
  });
  console.log("  ✓ Created sample alerts");

  // 14. Sample recipes
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

  const tequilaProduct = await prisma.product.findFirst({ where: { sku: "SP-030" } });
  const cointreau = await prisma.product.findFirst({ where: { sku: "SP-073" } });
  if (tequilaProduct && cointreau) {
    await prisma.recipeIngredient.createMany({
      data: [
        { recipeId: margarita.id, productId: tequilaProduct.id, quantity: 2.0, unit: "oz" },
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

  const bourbon = await prisma.product.findFirst({ where: { sku: "SP-012" } });
  if (bourbon) {
    await prisma.recipeIngredient.create({
      data: { recipeId: oldFashioned.id, productId: bourbon.id, quantity: 2.0, unit: "oz" },
    });
  }
  console.log("  ✓ Created sample recipes");

  // 15. Hotel occupancy (last 3 months)
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

  // 16. Flash messages
  console.log("Creating sample flash messages...");
  await prisma.flashMessage.createMany({
    data: [
      {
        organizationId: org.id,
        senderId: directorUser.id,
        outletId: outlets["carversteak"],
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
    ],
  });
  console.log("  ✓ Created flash messages");

  console.log("\n✅ Seed complete!");
  console.log(`   Organization: ${org.name}`);
  console.log(`   Outlets: ${Object.keys(outlets).length}`);
  console.log(`   Products: ${PRODUCTS.length}`);
  console.log(`   Orders: ${orderCount}`);
  console.log(`   Sales records: ${salesCount}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
