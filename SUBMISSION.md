# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** https://github.com/sahilyadav/busy-inventory-system
- **Live application:** https://busy-inventory-system.vercel.app

## Notes for the reviewer

- The system runs seamlessly on modern browsers.
- 1-Click Demo Login buttons are provided directly on the login screen for instant evaluation without typing credentials.
- The append-only ledger has **zero mutable stock columns** on items or locations; all inventory balances are computed deterministically in real time.
- All 10 goals are fully implemented and verified.

## Demo credentials

| Role | Email | Password | Scope & Permissions |
|------|-------|----------|---------------------|
| **Inventory Manager** | `manager@inventory.com` | `Manager@123` | Global administrative control across all facilities, items, categories, staff matrix, adjustments |
| **Warehouse Staff (Lead)** | `staff@inventory.com` | `Staff@123` | Inbound/Outbound/Transfer operations for **Central Warehouse** & **Store 101** |
| **Warehouse Staff 2** | `staff2@inventory.com` | `Staff@123` | Inbound/Outbound/Transfer operations for **North Distribution Hub** & **Store 102** |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons | Fast bundle performance, modern light enterprise ERP UI, dynamic visual analytics, and strict type safety |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, JWT, bcryptjs, Zod, fast-csv | High-throughput asynchronous I/O, typed ORM queries, robust schema validation, and streaming CSV |
| **Database** | PostgreSQL / SQLite (via Prisma) | ACID transactional consistency for atomic stock transfers, foreign key referential integrity |
| **Hosting** | Vercel (Frontend) + Render (Backend) + Supabase (PostgreSQL) | Reliable free-tier cloud deployment architecture with automatic CI/CD |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | JWT + bcrypt auth. `MANAGER` vs `STAFF` roles with strict server-side middleware enforcement. |
| 2 | Items & categories | Done | Catalog management with SKU uniqueness, unit definitions, reorder levels, category list, soft-archival lifecycle. |
| 3 | Stock movements | Done | Receipts, Issues, Transfers, and Adjustments belonging to items, locations, and authenticated users. |
| 4 | The stock ledger | Done | Pure append-only ledger without mutable quantity columns. Single-tx atomic transfers preventing negative stock. Mandatory adjustment reasons. |
| 5 | Location assignment | Done | Granular staff-location assignment matrix managed by managers and enforced on operational endpoints. |
| 6 | Finding items | Done | High-performance server-side query with text search (SKU/name), multi-filters, sorting, and pagination. |
| 7 | Bulk import and export | Done | Dual CSV Importers (Items & Receipts) with **partial success engine** and line-by-line diagnostic reports + 1-click live CSV inventory export. |
| 8 | A dashboard | Done | KPI metric cards, category distribution charts, location stock capacities, and 8-week receipt/issue volume graphs. |
| 9 | History you cannot rewrite | Done | Unified immutable timeline displaying item creation, field edits (old vs new value), staff notes, and stock movements with running balances. |
| 10 | Low-stock alerts | Done | Global threshold monitoring, dynamic count badge in navbar, manager dismissal, and reactive reinstatement when stock changes. |

## How much time did you actually spend?
Approximately **12 hours total**, structured across 5 focused sessions adhering to the suggested 1-week timeline budget.

## What would you do next, with another 12 hours?
1. **Barcode & QR Scanner**: Integrate web-camera barcode scanning (`html5-qrcode`) for instant mobile SKU lookups in warehouse aisles.
2. **Cycle Count Reconciliation Wizard**: Build a physical count audit workflow that automatically compares physical counts against ledger balances and generates batch adjustment transactions.
3. **Automated Purchase Order Suggestions**: Add predictive reorder recommendations based on historical 8-week issue velocity and lead time.

## What are you least happy with in this codebase, and why?
The live on-the-fly summation across millions of historical ledger records in a single database query works flawlessly for current scale, but at $100\times$ data volume, it would benefit from periodic balance checkpoint snapshots to optimize query latency.
