# Database Schema & Entity Relationships

## PostgreSQL & Prisma Data Architecture

### Entity Relationship Model

```mermaid
erDiagram
    USER ||--o{ USER_LOCATION : assigned
    LOCATION ||--o{ USER_LOCATION : contains
    CATEGORY ||--o{ ITEM : categorizes
    ITEM ||--o{ STOCK_MOVEMENT : records
    LOCATION ||--o{ STOCK_MOVEMENT : "source / dest"
    USER ||--o{ STOCK_MOVEMENT : logs
    ITEM ||--o{ LOW_STOCK_ALERT : triggers

    USER {
        string id PK
        string email UK
        string password
        string name
        enum role "MANAGER | STAFF"
        datetime createdAt
        datetime updatedAt
    }

    LOCATION {
        string id PK
        string name UK
        string code UK
        string type "WAREHOUSE | STORE"
        string address
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    USER_LOCATION {
        string id PK
        string userId FK
        string locationId FK
        datetime assignedAt
    }

    CATEGORY {
        string id PK
        string name UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    ITEM {
        string id PK
        string sku UK
        string name
        string description
        string unit "pcs, box, kg..."
        int reorderLevel
        string categoryId FK
        enum status "ACTIVE | ARCHIVED"
        datetime createdAt
        datetime updatedAt
    }

    STOCK_MOVEMENT {
        string id PK
        string itemId FK
        enum type "RECEIPT | ISSUE | TRANSFER | ADJUSTMENT"
        int quantity
        string sourceLocationId FK
        string destinationLocationId FK
        string userId FK
        string reference
        string notes
        datetime createdAt
    }

    LOW_STOCK_ALERT {
        string id PK
        string itemId FK
        string locationId
        int currentStock
        int reorderLevel
        enum status "ACTIVE | DISMISSED | RESOLVED"
        string dismissedBy
        datetime dismissedAt
        datetime createdAt
        datetime updatedAt
    }
```

---

### Key Tables & Indexes

#### 1. `StockMovement` (Append-Only Ledger)
- **Primary Key**: `id` (UUID)
- **Indexes**:
  - `itemId` — Fast lookups for item ledger summation and timeline retrieval.
  - `type` — Fast filtering by receipt, issue, transfer, or adjustment.
  - `sourceLocationId` & `destinationLocationId` — Fast location-wise stock aggregation queries.
  - `createdAt` — Time-series queries and 8-week movement trend aggregations.

#### 2. `Item`
- **Unique Constraint**: `sku`
- **Soft Delete**: `status` field (`ACTIVE` vs `ARCHIVED`). Items are never hard-deleted once movements exist.

#### 3. `UserLocation`
- **Compound Unique Constraint**: `(userId, locationId)` ensures idempotency in staff location assignments.
