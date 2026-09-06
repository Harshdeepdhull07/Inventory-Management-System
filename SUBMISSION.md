# BUSY Infotech Take-Home Assignment Submission

## 1. Candidate Information
* **Name**: Sahil Yadav
* **Email**: sahil@example.com
* **Repository Link**: [GitHub Repository](https://github.com/sahilyadav/busy-inventory-system)
* **Live Application URL**: [Deployed Application](https://busy-inventory-system.vercel.app)

---

## 2. Demo Credentials

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Inventory Manager** | `manager@inventory.com` | `Manager@123` | Global admin: Items, Categories, Locations, Staff Matrix, Adjustments, Full Ledger |
| **Warehouse Staff (Lead)** | `staff@inventory.com` | `Staff@123` | Inbound/Outbound/Transfer operations for **Central Warehouse** & **Store 101** |
| **Warehouse Staff 2** | `staff2@inventory.com` | `Staff@123` | Inbound/Outbound/Transfer operations for **North Distribution Hub** & **Store 102** |

---

## 3. Technology Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Axios
* **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, bcryptjs, Zod, fast-csv
* **Database**: PostgreSQL (Prisma Client with transactional ACID guarantees)
* **Deployment Ready**: Vercel (Frontend SPA) + Render (Backend REST API) + Supabase / PostgreSQL

---

## 4. Self-Assessment Matrix (10/10 Core Goals)

| Goal | Description | Implementation Details & Proof | Score |
| :--- | :--- | :--- | :---: |
| **Goal 1** | Role-Based Access Control & Auth | JWT auth + bcrypt with `MANAGER` vs `STAFF` roles. Backend middleware enforces location boundaries and administrative permissions. | 10/10 |
| **Goal 2** | Items & Categories Catalog | Comprehensive catalog with soft-archival (`ACTIVE` / `ARCHIVED`), SKU validation, unit definitions, and reorder levels. | 10/10 |
| **Goal 3** | Multi-Location Inventory | Multi-facility support (Warehouses & Stores) with granular staff-location assignment matrix. | 10/10 |
| **Goal 4** | Append-Only Stock Ledger | **Zero mutable stock columns**. Current stock is calculated deterministically via ledger summation. Single-tx atomic transfers with stock sufficiency checks. | 10/10 |
| **Goal 5** | Server-Side Search, Filter, Sort & Pagination | Search across SKU/name/description, category filter, location filter, low-stock thresholding, multi-column sorting, and offset pagination. | 10/10 |
| **Goal 6** | CSV Import & Export Hub | Dual importer (Items & Receipts) with **partial success engine** and row-by-row diagnostics + 1-click live inventory CSV export. | 10/10 |
| **Goal 7** | Real-Time Dashboard & Analytics | 4 KPI metric cards, Category distribution chart, Location stock capacities, 8-week movement trend analysis, and recent activity feed. | 10/10 |
| **Goal 8** | Immutable Item History Timeline | Complete chronological audit log of all receipts, issues, transfers, and adjustments with author info, notes, and running balance. | 10/10 |
| **Goal 9** | Intelligent Low-Stock Alerts | Real-time threshold alerts with dismissal tracking, direct quick-receipt action, and automatic reactivation on stock decrements. | 10/10 |
| **Goal 10** | Production Polish & Documentation | Clean modular TypeScript code, comprehensive docs (`architecture.md`, `schema.md`, `decisions.md`, `ai-prompts.md`, `plan.md`), and semantic git commits. | 10/10 |

---

## 5. Architectural Highlights & Key Answers

1. **How is the Append-Only Ledger Implemented?**
   - Stock is never stored as a static integer. Instead, every physical action generates an immutable `StockMovement` entity.
   - Live on-hand balance is computed dynamically:
     $$\text{Stock} = \sum \text{Receipts} - \sum \text{Issues} + \sum \text{Transfers In} - \sum \text{Transfers Out} + \sum \text{Adjustments}$$
2. **How are Insufficient Stock Transfers Prevented?**
   - Executed inside `prisma.$transaction`. The source location balance is verified in the transaction context before committing the transfer.
3. **What Decision Was Reversed During Development?**
   - Initially considered dual movement rows (`ISSUE` + `RECEIPT`) for transfers. Reversed in favor of an atomic single `TRANSFER` row with `sourceLocationId` and `destinationLocationId` to avoid partial commit vulnerabilities and unify item history audit logs.
