# AI Prompts

## 1. Monorepo Architecture & Append-Only Schema Design

### Prompt
> "Design a complete Prisma PostgreSQL schema for a multi-location stock control system. The schema must strictly enforce an append-only ledger where stock quantity is NOT stored as a mutable number on the item table. Include roles (Manager vs Staff), Locations, Categories, Items, Stock Movements (Receipt, Issue, Transfer, Adjustment), Item Audit Logs, and Low Stock Alerts."

### What you got
Initial Prisma schema with relational models for User, Location, Category, Item, StockMovement, ItemAuditLog, and LowStockAlert.

### What you corrected
Added explicit relation names (`SourceLocation` and `DestinationLocation`) on `StockMovement` to support bidirectional location queries, and added compound unique index `@@unique([userId, locationId])` on `UserLocation`.

---

## 2. Refactoring Inter-Location Transfers (Decision Reversal)

### Prompt
> "We initially considered creating 2 separate rows (one ISSUE and one RECEIPT) for inter-location transfers. Evaluate the pitfalls of this approach compared to a single atomic TRANSFER row with sourceLocationId and destinationLocationId in a single database transaction."

### What you got
Detailed trade-off comparison highlighting that dual rows create partial-commit vulnerabilities, disjointed audit timelines, and require complex global summation filtering.

### What you corrected
Standardized on a single atomic `TRANSFER` entity executed inside `prisma.$transaction` with pre-transfer sufficiency validation.

---

## 3. Partial-Success CSV Processing Engine

### Prompt
> "Build a robust Node.js / TypeScript CSV parsing engine for Catalog Items and Stock Receipts that implements partial success. Validate SKU uniqueness, mandatory fields, category existence (with auto-create fallback), and valid quantities. Return a detailed JSON response showing totalRows, importedCount, failedCount, and line-by-line result messages."

### What you got
Streaming CSV parser that validated fields and collected row results.

### What you corrected
Added in-memory `Set` and `Map` caching for existing SKUs and categories to prevent $O(N)$ repeated database roundtrips during large file uploads.

---

## 4. Item Timeline & Audit History (Goal 9)

### Prompt
> "Implement an immutable item timeline endpoint that merges physical stock movements (Receipt, Issue, Transfer, Adjustment) with item lifecycle events (Item Created, Field Edits with old/new values, Status Changes, and Staff Notes). Return them in chronological order with author attribution and running balance."

### What you got
An aggregation query merging `StockMovement` and `ItemAuditLog` records.

### What you corrected
Fixed running balance math so that creation, field changes, and staff notes do not affect running quantity balance ($\Delta = 0$), while stock movements accurately compute running total on-hand quantity.
