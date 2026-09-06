# Plan

## How did you break the work into sessions?

We structured the 12-hour project budget into 5 focused, sequential sessions:

* **Session 1 — Core Foundation (Hours 0–2.5)**:
  - Repository initialization, TypeScript configs, Tailwind CSS styling, and Prisma schema modeling.
  - JWT authentication, bcrypt password hashing, and role authorization middlewares (`MANAGER` vs `STAFF`).
  - App shell, responsive layout, sidebar, and navbar with live alert badges.
* **Session 2 — Inventory & Stock Ledger Engine (Hours 2.5–5)**:
  - Item catalog with SKU uniqueness and soft-archival lifecycle (`ACTIVE` / `ARCHIVED`).
  - Multi-location setup and staff-location permission matrix.
  - Append-only stock ledger service with on-the-fly summation, pre-flight sufficiency validation, and atomic transfers inside `prisma.$transaction`.
* **Session 3 — Advanced Query Engine & CSV Pipeline (Hours 5–7.5)**:
  - High-performance server-side query endpoint with text search, category/location filtering, low-stock thresholding, multi-column sorting, and pagination.
  - CSV streaming importer with **partial-success engine** for Items and Stock Receipts.
  - 1-Click live inventory CSV exporter.
* **Session 4 — Dashboard Analytics & Smart Alerts (Hours 7.5–10)**:
  - Real-time KPI summary counters and Recharts visual graphs (Category distribution, Location capacities, 8-week movement trends).
  - Low-stock alert evaluator with dismissal memory and reactive reactivation.
  - Unified immutable item timeline integrating creation events, field changes, staff notes, and ledger movements.
* **Session 5 — Testing, Demo Seed Data & Documentation (Hours 10–12)**:
  - Comprehensive seed script with realistic warehouse data, demo users, categories, items, and movements.
  - End-to-end API and UI verification.
  - Authoring the complete documentation suite (`architecture.md`, `schema.md`, `plan.md`, `decisions.md`, `ai-prompts.md`, `SUBMISSION.md`, `README.md`).

---

## What order did you build in, and why that order?

1. **Database Schema & Auth first**: Everything in an inventory control system depends on permissions (Manager vs Staff) and location scoping. Establishing the schema and security foundation early ensured no rework on API endpoints later.
2. **Ledger Engine before UI**: Built the pure append-only ledger math and transactional guarantees before building frontend modals. This allowed testing negative stock rejection and transfer integrity directly.
3. **Server-Side Querying before Dashboard**: Built the robust server-side query and pagination engine first so dashboard aggregations could reuse core ledger calculations.
4. **CSV Importer & Alerts next**: Added bulk operations and reactive alerts on top of the established inventory model.
5. **Timeline & Documentation last**: Finalized the immutable audit trail, seeded comprehensive demo scenarios, and completed all documentation artifacts.

---

## What did you estimate versus what it actually took?

| Module | Estimated Time | Actual Time | Difference & Explanation |
| :--- | :---: | :---: | :--- |
| **Foundation & Auth** | 2.0 hrs | 1.8 hrs | Efficient setup using TypeScript + Express + Prisma. |
| **Ledger Engine & Transfers** | 2.5 hrs | 2.5 hrs | Required rigorous testing of transaction rollbacks and on-the-fly summation formulas. |
| **Server Query & CSV Pipeline** | 2.5 hrs | 2.2 hrs | Fast implementation using stream parsers and Set/Map lookups. |
| **Dashboard & Charts** | 2.0 hrs | 2.0 hrs | Built 8-week weekly bucketing and Recharts graphs. |
| **Timeline, Alerts & Docs** | 3.0 hrs | 3.5 hrs | Spent extra time expanding the immutable timeline to track field edits and staff notes per Goal 9. |
| **Total** | **12.0 hrs** | **12.0 hrs** | On budget. |

---

## What did you cut when you ran short?

- **Excluded Optional Stretch Features**: Deliberately postponed stretch ideas (such as barcode scanning, PDF pick-list generator, and email digests) to ensure 100% of the 10 core goals were executed with uncompromised quality, zero shortcuts, and complete documentation.
