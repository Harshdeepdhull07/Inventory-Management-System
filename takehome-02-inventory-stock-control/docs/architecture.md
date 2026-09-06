# Architecture

## What are the moving pieces, and how do they talk to each other?

The system is built on a 3-tier architecture with clean separation of concerns:

1. **Client Tier (React 18 SPA)**:
   - Built with React, Vite, TypeScript, and Tailwind CSS.
   - Handles role-based view rendering (Manager vs Warehouse Staff), dynamic navigation badges, interactive data visualizations (Recharts for 8-week movement trends and category/location distributions), and live CSV import/export reporting.
   - Communicates with the backend exclusively via an Axios REST API client sending JSON payloads with Bearer JWT tokens in the `Authorization` header.

2. **Application Server Tier (Node.js & Express)**:
   - Written in TypeScript with modular layering:
     - **Middlewares**: `authenticate` (validates JWT and attaches user + assigned location IDs to `req.user`), `requireManager` (blocks non-manager access to catalog creation, location management, and adjustments), `requireLocationAccess` (verifies warehouse staff are assigned to the target location), and `errorHandler` (centralized error catching and Zod validation formatting).
     - **Services**:
       - `LedgerService`: Handles dynamic on-the-fly summation of immutable `StockMovement` records and executes atomic transfers via database transactions.
       - `AlertService`: Evaluates inventory balances against reorder levels, manages dismissal state, and triggers reactive alert reappearance.
       - `CsvService`: Streams CSV uploads, performs row-by-row validation with partial-success tolerance, and streams formatted CSV inventory snapshots.
     - **Controllers & Routes**: Expose RESTful endpoints for authentication, categories, locations, items, stock movements, CSV processing, analytics, and alerts.

3. **Data Tier (PostgreSQL / SQLite via Prisma ORM)**:
   - Managed by Prisma ORM with type-safe schema definitions and foreign-key referential integrity.
   - Houses the append-only stock movement ledger, user/location authorization matrix, item catalog, immutable audit logs, and low-stock alert records.

---

## Where does each piece run?

- **Browser / Client**: Runs locally or deployed as a static Single-Page Application on **Vercel** / CDN edge networks.
- **Application Server**: Runs on Node.js (v18+) locally on port `5001` or deployed as a containerized web service on **Render**.
- **Database**: Runs locally via SQLite (`file:./dev.db`) for zero-dependency instant setup, or on managed **Supabase PostgreSQL** in cloud production via connection string `DATABASE_URL`.

---

## What is the request path for one representative user action, end to end?

### Representative Action: An Inter-Location Stock Transfer (e.g., Transferring 25 Keyboards from Central Warehouse to Store 101)

1. **User Action**: A staff member selects `ELEC-KB-001`, picks Source `WH-MAIN`, Destination `STR-101`, enters quantity `25`, adds a manifest reference `TR-2026-0901`, and clicks "Execute Transfer".
2. **Client Request**: The React client dispatches `POST /api/movements/transfer` with `{ itemId, sourceLocationId, destinationLocationId, quantity: 25, reference, notes }` including the JWT token in headers.
3. **Authentication Middleware**: `authenticate` extracts the JWT, verifies cryptographic signature with `JWT_SECRET`, loads the user's active permissions, and binds `{ userId, role, assignedLocationIds }` to `req.user`.
4. **Authorization Middleware**: `requireLocationAccess` verifies that if the user is a Staff member, their `assignedLocationIds` includes `sourceLocationId` (and destination). If unauthorized, immediately returns `403 Forbidden`.
5. **Request Validation**: Zod schema in `movementController` validates positive integer quantity and non-identical source and destination IDs.
6. **Transaction Execution (`LedgerService.recordTransfer`)**:
   - Begins an atomic database transaction `prisma.$transaction`.
   - Runs `getItemStockAtLocation(itemId, sourceLocationId, tx)` which sums all historical movements at `WH-MAIN`:
     $$\text{Stock} = \sum \text{Receipts} - \sum \text{Issues} + \sum \text{Transfers In} - \sum \text{Transfers Out} + \sum \text{Adjustments}$$
   - Compares available on-hand balance ($150$) against requested quantity ($25$).
   - If stock < 25, the transaction immediately rolls back and throws an explicit error (`"Insufficient stock at Central Warehouse"`), returning `400 Bad Request`.
   - If stock >= 25, inserts an immutable `StockMovement` row with `type = 'TRANSFER'`, `sourceLocationId = 'WH-MAIN'`, `destinationLocationId = 'STR-101'`, `quantity = 25`, `userId`, timestamp, and reference.
7. **Post-Transaction Trigger**: `AlertService.evaluateItemStockAlert(itemId)` checks global stock against reorder level and adjusts alert records if necessary.
8. **Response & UI Refresh**: The server returns `201 Created` with the movement record. The React client closes the modal, triggers a global data refresh across the Dashboard KPI cards, Movements Ledger, and Item Timeline.

---

## What did you decide *not* to build, and why?

1. **No Mutable Quantity Column in Item/Location Tables**:
   - *Why*: Storing a mutable quantity integer alongside a ledger introduces dual sources of truth, ledger drift, and race conditions during concurrent updates. By calculating quantity purely from the append-only ledger, mathematical integrity is guaranteed by design.
2. **No Hard Deletions for Items or Movements**:
   - *Why*: Physical deletion breaks historical auditability and corrupts past transaction balances. We implemented a soft-archival lifecycle (`ACTIVE` / `ARCHIVED`) for items and strict immutability for all ledger records.
3. **No Client-Side CSV Row Parsing / Client-Side Filtering**:
   - *Why*: Processing large CSV files in browser memory or loading thousands of inventory items to filter on the client causes UI freezes and leaks unauthorized data. All search, filtering, pagination, and CSV ingestion are executed strictly on the server.
4. **No Optional Stretch Features Prior to 10/10 Core Perfection**:
   - *Why*: Per the assignment brief ("Doing 8 goals well beats doing 10 goals badly"), we prioritized rock-solid architectural soundness, transactional ledger math, partial-success CSV error diagnostics, and complete documentation over non-essential stretch features.
