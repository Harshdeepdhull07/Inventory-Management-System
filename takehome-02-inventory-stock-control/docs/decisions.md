# Decisions

## Decision 1: Pure Append-Only Ledger vs. Mutable Item Quantity Column

- **Chose:** Eliminate mutable `quantity` columns from `Item` and `Location` tables. Calculate on-hand stock dynamically by summing immutable transaction rows in `StockMovement`.
- **Rejected:** Storing an integer `quantity` column on the `Item` record and updating it with `UPDATE items SET quantity = quantity - X`.
- **Why:** In multi-location distribution systems, direct quantity updates create race conditions, lost updates, and irreconcilable ledger drift. An append-only ledger guarantees mathematical auditability, enforces that every single unit is accounted for, and satisfies the assignment mandate.

---

## Decision 2: Single Atomic Transfer Movement vs. Dual Movement Rows (REVERSED)

- **Chose:** Unified single `TRANSFER` movement record storing both `sourceLocationId` and `destinationLocationId` executed atomically inside a `prisma.$transaction`.
- **Rejected:** Creating two separate movement records: one `ISSUE` record at Location A and one `RECEIPT` record at Location B.
- **Why:** Single-row transfers are inherently cohesive. In the timeline, users see a clear inter-location shift ($Location_A \to Location_B$) rather than two disconnected actions. Furthermore, global total stock calculations naturally ignore transfers ($\Delta = 0$), while location-level math cleanly decrements the source and increments the destination.
- **Later reversed:** We initially considered splitting transfers into two records (`ISSUE` + `RECEIPT`) thinking it would simplify per-location filtering. We reversed this decision after realizing it introduced partial-commit vulnerabilities, cluttered the item audit trail, and complicated global stock summation.

---

## Decision 3: Partial-Success CSV Engine vs. All-or-Nothing Atomic Batch Rollback

- **Chose:** A streaming row-by-row validator that imports valid rows immediately and produces an itemized report of failed rows with exact line numbers and error reasons.
- **Rejected:** Aborting the entire CSV upload and rolling back all rows if even a single line fails validation.
- **Why:** Real-world enterprise warehouse manifests can contain hundreds of rows. Rejecting an entire shipment import over a single typo in row 180 creates operational bottlenecks. Partial success provides immediate business continuity while making errors trivial to isolate and fix.

---

## Decision 4: Backend Security Middleware vs. UI-Only Role Hiding

- **Chose:** Enforcing role-based authorization (`requireManager`) and location access control (`requireLocationAccess`) directly in Express middlewares.
- **Rejected:** Relying on frontend conditional rendering (`isManager ? <Button/> : null`) to prevent unauthorized actions.
- **Why:** UI hiding is purely aesthetic. Client requests can be forged or intercepted. Backend middleware ensures that staff can never adjust stock, create items, or execute transactions at unassigned warehouses regardless of how the request is sent.

---

## Decision 5: Soft-Archival (`ACTIVE` / `ARCHIVED`) vs. Hard Cascade Deletions

- **Chose:** Soft-archiving items to remove them from active operations while permanently preserving their ledger history.
- **Rejected:** Allowing physical SQL `DELETE FROM items WHERE id = X`.
- **Why:** Deleting an item with existing movements violates database foreign keys and destroys historical financial/audit integrity. Archiving blocks future stock movements while preserving historical compliance.

---

## Decision 6: Reactive Low-Stock Alert System with Dismissal Memory

- **Chose:** Capturing manager dismissal status while automatically reactivating alerts if stock rises above threshold and later drops back at or below the reorder level.
- **Rejected:** Deleting alert records upon dismissal or permanently silencing an item once dismissed.
- **Why:** Fulfills Goal 10 exactly: prevents alert spam while ensuring new stock deficits are never missed.
