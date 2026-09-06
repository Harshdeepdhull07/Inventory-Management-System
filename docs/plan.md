# Work Plan & Execution Sequencing

## Project: Inventory & Stock Control System (BUSY Infotech Assessment)

### Target Scope: 10/10 Core Goals

| Goal | Description | Status |
| :--- | :--- | :--- |
| **Goal 1** | Role-Based Access Control (Manager vs Warehouse Staff) with JWT Auth | In Progress |
| **Goal 2** | Item & Category Catalog Management with Soft Archival Lifecycle | Planned |
| **Goal 3** | Multi-Location Inventory & Granular Staff-Location Assignment Matrix | Planned |
| **Goal 4** | Pure Append-Only Stock Ledger Engine (Receipts, Issues, Transfers, Adjustments) | Planned |
| **Goal 5** | High-Performance Server-Side Search, Multi-Filter, Sorting & Pagination | Planned |
| **Goal 6** | Dual CSV Importer with Partial Success Engine & CSV Inventory Exporter | Planned |
| **Goal 7** | Real-Time Dashboard with KPI Counters & Historical Trend Visualizations | Planned |
| **Goal 8** | Complete Immutable Item History & Audit Timeline | Planned |
| **Goal 9** | Intelligent Low-Stock Alert System with Dismissal/Reactivation Lifecycle | Planned |
| **Goal 10** | Production-Grade Code Quality, Comprehensive Docs & Clean Git History | In Progress |

---

## Milestone Execution Sequence

### Milestone 1: Core Foundation & Data Architecture
- Initialize repository, TypeScript configurations, Tailwind CSS frontend, Express backend.
- Define Prisma schema with append-only ledger, user authentication, RBAC, and location permissions.
- Implement JWT authentication with password hashing (`bcryptjs`), access tokens, and role-guard middlewares.

### Milestone 2: Inventory Catalog & Stock Ledger Engine
- Implement Category and Location management.
- Implement Item CRUD with SKU uniqueness and soft-delete (`ACTIVE` / `ARCHIVED`).
- Build Ledger Service:
  - On-the-fly stock balance aggregation query.
  - Receipts (+Qty to Destination).
  - Issues (-Qty from Source with pre-flight stock sufficiency check).
  - Atomic Transfers (Source to Destination in a single `prisma.$transaction`).
  - Stock Adjustments (Manager-only reconciliation with mandatory audit reason).

### Milestone 3: Server-Side Query Engine & CSV Data Pipeline
- Build dynamic server-side inventory query API supporting text search, category/location filtering, low-stock thresholding, multi-column sorting, and pagination.
- Build CSV Import Pipeline:
  - Items CSV: row-by-row validation, error reporting, partial success.
  - Stock Receipts CSV: row-by-row validation, batch ledger entry, partial success.
- Build CSV Export Pipeline: streaming live location-wise stock snapshot.
- Build Item History Timeline endpoint aggregating all ledger transactions and metadata.

### Milestone 4: Analytics Dashboard & Low-Stock Alerts
- Dashboard aggregations: Active items, low-stock items count, today's movements, weekly movement volume.
- Analytics charts: Category distribution, location stock capacity, 8-week receipt vs issue trends.
- Low-stock alert evaluator with dismissal and reactive reactivation when stock drops further.

### Milestone 5: Polish, Seed Data, Verification & Deployment Readiness
- Seed comprehensive realistic inventory dataset with demo credentials.
- End-to-end testing across all roles and stock operations.
- Finalize documentation suite (`architecture.md`, `schema.md`, `decisions.md`, `ai-prompts.md`, `SUBMISSION.md`).
