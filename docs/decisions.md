# Architectural & Technical Decisions Log

This document records the foundational architectural decisions made during development, including rationale, alternatives evaluated, trade-offs, and **one significant decision that was deliberately reversed**.

---

### Decision 1: Pure Append-Only Ledger vs. Mutable Item Quantity Column
* **Decision**: Eliminate mutable `quantity` columns from `Item` and `Location` tables. Compute stock on-the-fly from immutable `StockMovement` rows.
* **Context**: Traditional simple inventory tables maintain a `quantity` integer on the item record. However, concurrent updates cause race conditions, ledger drift, and untraceable discrepancies.
* **Trade-offs**: Requires real-time aggregation queries, but guarantees 100% mathematical auditability, eliminates race conditions, and fully satisfies the assignment's ledger mandate.

---

### Decision 2 (REVERSED): Dual-Entry Stock Movements for Inter-Location Transfers
* **Initial Decision**: Model an inter-location transfer as two separate movement rows: one `ISSUE` row from Location A and one `RECEIPT` row at Location B.
* **Why Reversed**:
  1. Creating two disjoint rows created a risk of partial failure if the system crashed midway.
  2. Item timeline views showed fragmented disconnected rows instead of a single cohesive transfer event ($Location_A \to Location_B$).
  3. Global total stock calculations became complicated because summing receipts and issues required filtering out transfer-related receipts/issues.
* **Final Chosen Approach**: Unified single `TRANSFER` movement record with both `sourceLocationId` and `destinationLocationId` executed atomically inside a `prisma.$transaction`. Global stock calculation naturally ignores transfers ($\Delta = 0$), while location-level stock accurately decrements source and increments destination.

---

### Decision 3: Partial Success CSV Processing vs. Atomic Batch Rollback
* **Decision**: Implement a row-by-row validation engine that imports valid rows and generates a structured per-row error summary for invalid rows.
* **Rationale**: In real-world enterprise warehouse operations, uploading a 500-row manifest should not fail entirely because row 342 has a typo in the category name. Users receive immediate productivity value and can fix only the flagged rows.

---

### Decision 4: Backend Middleware Authorization vs. Frontend-Only UI Hiding
* **Decision**: Implement strict Express authorization middlewares (`requireManager`, `requireLocationAccess`) to protect all stock mutation and management endpoints.
* **Rationale**: UI hiding is cosmetic. Malicious or compromised clients could otherwise invoke `/api/movements/adjustment` or access unassigned warehouse stock. Strict backend guards guarantee zero unauthorized access.

---

### Decision 5: Soft Archival Lifecycle (`ACTIVE` / `ARCHIVED`) vs. Hard Cascade Deletion
* **Decision**: Items and Categories with existing ledger movements cannot be hard deleted; items undergo soft archival.
* **Rationale**: Hard deleting an item would break foreign keys in historical stock movements, destroying ledger integrity and financial reporting. Archiving preserves historical auditability while preventing new stock transactions.

---

### Decision 6: Reactive Low-Stock Alert Evaluator with Dismissal Memory
* **Decision**: Low-stock alerts maintain a `DISMISSED` state with user attribution, but automatically reinstate if an issue occurs that drops the stock level further.
* **Rationale**: Prevents notification fatigue while ensuring critical new inventory drops are never missed.
