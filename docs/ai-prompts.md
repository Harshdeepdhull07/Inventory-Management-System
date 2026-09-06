# AI Prompts & Engineering Log

## Overview
This log documents the AI prompts, iterations, and problem-solving dialogues utilized during the design and development of the BUSY Inventory & Stock Control System.

---

### Prompt 1: Monorepo Architecture & Append-Only Schema Design
* **Prompt**:
  > "Design a complete Prisma PostgreSQL schema for a multi-location stock control system. The schema must strictly enforce an append-only ledger where stock quantity is NOT stored as a mutable number on the item table. Include roles (Manager vs Staff), Locations, Categories, Items, Stock Movements (Receipt, Issue, Transfer, Adjustment), and Low Stock Alerts."
* **AI Output Analysis**:
  - Generated initial schema with proper foreign keys and indexes.
  - Ensured `quantity` is only present on `StockMovement` as an immutable audit record.

---

### Prompt 2: Refactoring Inter-Location Transfers (Decision Reversal)
* **Prompt**:
  > "We initially considered creating 2 separate rows (one ISSUE and one RECEIPT) for inter-location transfers. Evaluate the pitfalls of this approach compared to a single atomic TRANSFER row with sourceLocationId and destinationLocationId in a single database transaction."
* **AI Output Analysis**:
  - Highlighted the risk of partial commits, cluttering of item audit timeline, and difficulties in calculating global net inventory.
  - Guided the implementation of single-row atomic `TRANSFER` inside `prisma.$transaction`.

---

### Prompt 3: Partial-Success CSV Stream Engine
* **Prompt**:
  > "Build a robust Node.js / TypeScript CSV parsing engine for Catalog Items and Stock Receipts that implements partial success. Validate SKU uniqueness, mandatory fields, category existence (with auto-create fallback), and valid quantities. Return a detailed JSON response showing totalRows, importedCount, failedCount, and line-by-line result messages."
* **AI Output Analysis**:
  - Implemented streaming parser with fast lookup Sets and Maps for categories and existing SKUs, returning granular row diagnostics.

---

### Prompt 4: Dynamic Ledger Summation Query Optimization
* **Prompt**:
  > "Write an optimized TypeScript LedgerService that calculates current stock for an item at a specific location and across all locations using append-only movements. Ensure transfers correctly increment destination and decrement source without double-counting."
* **AI Output Analysis**:
  - Formulated precise summation logic: `Stock = Receipts - Issues + (TransfersIn - TransfersOut) + Adjustments`.
