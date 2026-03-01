# Spotlight — Hotel Multi-Outlet Beverage Management Platform

## Project Overview
Spotlight is a hotel beverage program management platform for multi-outlet properties (casinos, resorts, hotel groups). It ingests purchasing data from inventory systems (BirchStreet, Stratton Warren, Oracle), sales data from POS systems (Micros, Agilysys, Toast), and provides compliance tracking, margin analysis, inventory alerts, and partner reporting across all outlets.

**Codename:** Spotlight
**Companion Product:** Hammer (beverage menu builder — separate repo, shared auth/data layer)

---

## Tech Stack

### Core
- **Frontend:** Next.js 14+ (App Router) with React 18+ and TypeScript
- **Styling:** Tailwind CSS + shadcn/ui component library
- **Database:** PostgreSQL via Supabase (hosted) or self-hosted Postgres in Docker
- **Auth:** Supabase Auth (email/password + SSO for enterprise)
- **ORM:** Prisma (schema-first, migration-friendly)
- **State Management:** Zustand for client state, React Query (TanStack Query) for server state
- **File Processing:** Papa Parse (CSV), SheetJS (Excel/XLSX), custom field-mapping engine
- **Charts:** Recharts for dashboards, AG Grid for data tables
- **Export:** SheetJS for Excel export, jsPDF for PDF generation
- **Maps:** Mapbox GL JS or Leaflet for item usage geographic views
- **Real-time:** Supabase Realtime for flash messages and live alerts

### Infrastructure
- **Hosting:** Vercel (frontend) + Supabase (backend/db) for cloud version
- **On-Premise:** Docker Compose (Next.js + Postgres + Redis containers)
- **CI/CD:** GitHub Actions
- **Container Registry:** GitHub Container Registry (ghcr.io)
- **Monitoring:** Sentry for error tracking

### V0/Vercel Compatibility
- All UI components must be V0-compatible (standard React + Tailwind + shadcn/ui)
- No custom CSS-in-JS solutions — stick to Tailwind utility classes
- Component files should be self-contained for easy V0 iteration by UI/UX developers

---

## Architecture

### Monorepo Structure (Turborepo)
```
spotlight/
├── apps/
│   ├── web/                    # Next.js main application
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Login, register, password reset
│   │   │   ├── (dashboard)/    # Main authenticated layout
│   │   │   │   ├── overview/   # Hotel-wide dashboard
│   │   │   │   ├── outlets/    # Outlet-level views
│   │   │   │   ├── compliance/ # RFP/mandate tracking
│   │   │   │   ├── inventory/  # Alerts, pull-through, days-on-hand
│   │   │   │   ├── margins/    # Cost analysis, projections
│   │   │   │   ├── partners/   # Distributor & supplier portals
│   │   │   │   ├── catalog/    # Product catalog & substitutions
│   │   │   │   ├── recipes/    # Cocktail recipe builder
│   │   │   │   ├── direct/     # Direct-to-outlet tracking board
│   │   │   │   ├── map/        # Geographic item usage view
│   │   │   │   ├── messages/   # Flash message system
│   │   │   │   ├── analytics/  # Portal usage tracking
│   │   │   │   └── admin/      # Settings, roles, hotel config
│   │   │   └── api/            # API routes
│   │   ├── components/         # Shared UI components
│   │   ├── lib/                # Utilities, hooks, data processing
│   │   └── types/              # TypeScript type definitions
│   └── portal/                 # External partner portal (suppliers/distributors)
├── packages/
│   ├── db/                     # Prisma schema, migrations, seed data
│   ├── shared/                 # Shared types, utils, constants
│   ├── data-engine/            # CSV/Excel ingestion + field mapping engine
│   └── alert-engine/           # Alert rules, calculations, notification dispatch
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.portal
│   └── docker-compose.yml
├── docs/
│   ├── data-dictionary.md      # All table/field definitions
│   ├── alert-rules.md          # Alert logic documentation
│   └── api-spec.md             # API endpoint documentation
├── scripts/
│   ├── seed-demo.ts            # Demo data seeder (Caesars → Resorts World mapping)
│   └── generate-stations.ts    # Multi-property data generator for Stations Casinos
├── claude.md                   # THIS FILE
├── turbo.json
└── package.json
```

### Hammer (Separate Repo — Connects via Shared DB/API)
```
hammer/
├── apps/
│   ├── web/                    # Menu builder application
│   └── print/                  # Print engine (PDF generation)
├── packages/
│   ├── db/                     # Extended Prisma schema (menu tables)
│   ├── shared/                 # Shared with Spotlight via npm package
│   ├── fintech-adapter/        # Fintech.com / Fintech.net integration
│   └── print-engine/           # Page layout, gutters, TOC, watermarks
└── claude.md
```

---

## Database Schema (Core Tables)

### Organization & Access
- `organizations` — Hotel properties (Resorts World, individual Stations properties)
- `organization_groups` — Groups of properties (Stations Casinos parent)
- `outlets` — Individual venues within a property (bar, restaurant, pool, etc.)
- `outlet_groups` — Groupings like "fine dining" or "casual" for segment reporting
- `users` — All system users
- `roles` — Role definitions (admin, director, vp, room_manager, distributor, supplier)
- `user_roles` — User-to-role mapping with scope (which outlet/org they can see)

### Products & Partners
- `products` — Master product catalog (SKU, name, category: beer/wine/spirits/sake, size, unit)
- `distributors` — Distribution partners
- `suppliers` — Brand/supplier companies (can appear across multiple distributors)
- `distributor_products` — Maps products to distributors (with cost, supplier attribution)
- `product_catalog` — Substitution/replacement catalog maintained by admin

### Mandates & Compliance
- `mandates` — RFP/national program required items per outlet
- `mandate_items` — Individual products in a mandate
- `mandate_compliance` — Tracking: has each outlet ordered each mandated item?

### Inventory & Orders
- `warehouse_transfers` — Items leaving central warehouse to outlets
- `direct_orders` — Items shipped directly from vendors to outlets
- `inventory_snapshots` — Point-in-time inventory levels per outlet per product
- `order_history` — All orders with timestamps, quantities, costs, distributor

### Sales & Margins
- `sales_data` — POS data uploads (Micros, Agilysys, Toast)
- `recipes` — Cocktail/mixed drink recipes
- `recipe_ingredients` — Product-to-recipe mapping with quantities and yields
- `cost_goals` — Target cost percentages per outlet set by admin
- `price_tracking` — Tracks menu prices per product per outlet (for discrepancy alerts)

### Alerts & Notifications
- `alert_rules` — Configurable alert definitions
- `alerts` — Generated alert instances
- `flash_messages` — Director ↔ outlet messaging

### Analytics
- `portal_sessions` — Login/session tracking for usage analytics
- `portal_interactions` — Page views, report pulls, export actions

### Admin
- `hotel_occupancy` — Daily people counts (hotel guests, restaurant covers)

---

## Role-Based Access Control (RBAC)

| Role | Sees | Can Do |
|------|------|--------|
| **VP / Director** | All properties, all outlets, all partners | Full CRUD, set mandates, set cost goals, manage roles |
| **Admin** | All outlets in their property | Configure outlets, upload data, set goals, view all reports |
| **Room Manager** | Only their assigned outlet(s) | View their inventory, orders, compliance status, send messages |
| **Distributor** | Only their own products across all outlets | View their sales data, download reports, see map view |
| **Supplier** | Only their own products (across all distributors) | View their product placement, usage, order frequency |

### Access Rules
- Every API route and page must check role + scope
- Middleware validates JWT and attaches user context with permitted outlet/org IDs
- Row-level security (RLS) in Supabase for defense-in-depth
- Supplier portal aggregates their products across all distributors automatically

---

## Alert Engine Rules

### Compliance Alerts
- **New mandate item not ordered within 7 days** → Alert to director + room manager
- **Outlet ordering non-mandated item** → Informational flag

### Inventory Alerts
- **Pull-through above historic average** → Configurable threshold (e.g., >120% of rolling 90-day avg)
- **Pull-through below historic average** → Configurable threshold (e.g., <80% of rolling 90-day avg)
- **Days of inventory below threshold** → User-configurable per SKU (e.g., alert when < 5 days supply)
- **Historic baseline:** Rolling 90-day average, with same-period-last-year comparison available

### Direct-to-Outlet Alerts
- **New item appearing at an outlet** → Alert to director
- **Tracking board** shows: item name, which outlets use it, order frequency, first/last order date

### Price Alerts
- **Same product at different prices across outlets** → Alert to admin
- **Price change from previous order** → Alert with % change

### Margin Alerts
- **Cost percentage exceeding goal** → Alert when outlet or segment exceeds target

---

## Data Ingestion

### Supported Sources (Phase 1)
1. **BirchStreet** — CSV/Excel export of purchase orders and warehouse transfers
2. **Stratton Warren** — CSV/Excel export
3. **Oracle (purchasing)** — CSV/Excel export
4. **Micros (POS)** — Excel export of sales data
5. **Agilysys (POS)** — Excel/CSV export

### Field Mapping Engine
- On first upload of a new source format, present column-mapping UI
- User maps source columns → internal schema fields
- Save mapping profile for that source for future uploads
- Validate data quality on import (flag missing SKUs, unmatched products)

### Upload Flow
1. User selects upload type (purchases, warehouse transfers, direct orders, sales)
2. User uploads file (CSV or Excel)
3. System detects format or uses saved mapping
4. Preview screen shows mapped data with validation flags
5. User confirms → data written to appropriate tables
6. Alert engine processes new data immediately

---

## Key Business Logic

### Margin Calculations
- **Product Cost** = latest order cost from distributor
- **Cocktail Cost** = sum of (ingredient cost × quantity used per recipe) / yield
- **Revenue** = from POS sales data
- **Margin** = (Revenue - Cost) / Revenue × 100
- **Projections** = historical volume × current costs, compared against cost % goals

### Segment Grouping
- Admin can create outlet groups (e.g., "Fine Dining" = Steakhouse + French Restaurant)
- All margin/cost/volume reports support filtering by: individual outlet, outlet group, entire property, category (beer/wine/spirits/sake)

### Partner Reporting
- **Distributor view:** Total volume, revenue, YoY comparison, drill into products, drill into outlets
- **Supplier view:** Same data but aggregated across all distributors carrying their products
- Both views exportable to Excel/CSV
- Both accessible via dedicated portal login

---

## Coding Standards

### General
- TypeScript strict mode everywhere
- All database queries through Prisma (no raw SQL except for complex analytics queries)
- All API routes return typed responses
- Error boundaries on every page
- Loading skeletons for async data

### File Conventions
- Components: PascalCase (`OutletDashboard.tsx`)
- Utilities: camelCase (`calculateMargin.ts`)
- Types: PascalCase with `.types.ts` extension
- API routes: `route.ts` in appropriate app directory
- One component per file, co-locate related hooks

### Testing
- Unit tests for alert engine calculations
- Unit tests for margin/cost calculations
- Integration tests for data ingestion pipeline
- E2E tests for critical flows (login, upload, alert generation)

### Security
- All file uploads scanned and validated (file type, size limits)
- No raw user input in SQL queries (Prisma handles parameterization)
- CORS locked to known domains
- Rate limiting on API routes
- Audit log for admin actions

---

## Demo Data Strategy

### Resorts World Demo
- Map Caesars Palace historic data to Resorts World venue names
- Maintain realistic volume ratios between outlet types
- 12 months of historic data for YoY comparisons

### Stations Casinos Demo
- Generate multi-property structure (multiple buildings)
- Each building has multiple outlets
- Vary product mix by property type/size
- Use `scripts/generate-stations.ts` to create realistic scaled data

---

## Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (direct connection for Prisma)
DATABASE_URL=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MAP_TOKEN=        # Mapbox token

# Docker (on-premise only)
POSTGRES_PASSWORD=
REDIS_URL=
```

---

## Phase Build Order (for parallel terminal work)

### Phase 1 — Foundation (all terminals need this first)
1. Turborepo + Next.js + Supabase + Prisma setup
2. Database schema + migrations
3. Auth + RBAC middleware
4. Base layout + navigation shell

### Phase 2 — Parallel Workstreams (run simultaneously)
- **Terminal A:** Data ingestion engine (upload, field mapping, processing)
- **Terminal B:** Alert engine (rules, calculations, notification UI)
- **Terminal C:** Dashboard + outlet views (compliance, inventory)
- **Terminal D:** Partner portal (distributor/supplier views, exports)
- **Terminal E:** Margin engine (cost tracking, recipes, projections, POS integration)

### Phase 3 — Integration & Polish
- Wire all engines together
- Map visualization
- Flash messaging
- Portal analytics
- Demo data seeding
- Docker packaging

---

## Commands
```bash
# Development
pnpm dev                  # Start all apps
pnpm dev --filter web     # Start just main app
pnpm db:migrate           # Run Prisma migrations
pnpm db:seed              # Seed demo data
pnpm db:studio            # Open Prisma Studio

# Testing
pnpm test                 # Run all tests
pnpm test:alerts          # Test alert engine
pnpm test:margins         # Test margin calculations

# Docker
docker compose up -d      # Start on-premise stack
docker compose down        # Stop

# Build
pnpm build                # Build all apps
pnpm docker:build         # Build Docker images
```
