# Schema

## Table by table: what columns and types does each one have?

### 1. `User`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key |
| `email` | String | Unique, Indexed, Lowercase email |
| `password` | String | Bcrypt hash with salt rounds = 10 |
| `name` | String | User's full display name |
| `role` | String | `'MANAGER'` or `'STAFF'` |
| `createdAt` | DateTime | Timestamp of registration (Default: `now()`) |
| `updatedAt` | DateTime | Auto-updated on record changes |

### 2. `Location`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key |
| `name` | String | Unique location name (e.g. "Central Warehouse") |
| `code` | String | Unique code (e.g. "WH-MAIN", "STR-101") |
| `type` | String | Facility type (`"WAREHOUSE"`, `"STORE"`, etc.) |
| `address` | String (Nullable) | Physical logistics address |
| `isActive` | Boolean | Soft active status toggle (Default: `true`) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated timestamp |

### 3. `UserLocation` (Staff Assignment Matrix)
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key |
| `userId` | String (UUID) | Foreign Key -> `User.id` (OnDelete: Cascade) |
| `locationId` | String (UUID) | Foreign Key -> `Location.id` (OnDelete: Cascade) |
| `assignedAt` | DateTime | Timestamp of assignment (Default: `now()`) |
| *Constraint* | Unique | Compound unique index on `(userId, locationId)` |

### 4. `Category`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key |
| `name` | String | Unique category title (e.g. "Electronics") |
| `description` | String (Nullable) | Category scope explanation |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated timestamp |

### 5. `Item`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key |
| `sku` | String | Unique, Indexed SKU code (e.g. "ELEC-KB-001") |
| `name` | String | Item title |
| `description` | String (Nullable) | Specifications and details |
| `unit` | String | Unit of measure (e.g. "pcs", "box", "kg", "roll") |
| `reorderLevel` | Integer | Threshold for low-stock alerts (Default: `10`) |
| `categoryId` | String (UUID) | Foreign Key -> `Category.id` (OnDelete: Restrict) |
| `status` | String | Soft status: `'ACTIVE'` or `'ARCHIVED'` |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated timestamp |

### 6. `StockMovement` (The Append-Only Ledger)
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key |
| `itemId` | String (UUID) | Foreign Key -> `Item.id` (OnDelete: Restrict) |
| `type` | String | `'RECEIPT'`, `'ISSUE'`, `'TRANSFER'`, `'ADJUSTMENT'` |
| `quantity` | Integer | Movement magnitude (> 0 for receipts/issues/transfers; signed delta for adjustments) |
| `sourceLocationId` | String (Nullable) | Foreign Key -> `Location.id` (Source for issue & transfer) |
| `destinationLocationId` | String (Nullable) | Foreign Key -> `Location.id` (Destination for receipt, transfer, adjust) |
| `userId` | String (UUID) | Foreign Key -> `User.id` (Who recorded movement) |
| `reference` | String (Nullable) | PO number, SO number, manifest reference |
| `notes` | String (Nullable) | Reason/notes (Mandatory for adjustments) |
| `createdAt` | DateTime | Indexed timestamp of transaction (Default: `now()`) |

### 7. `ItemAuditLog` (Immutable Field & Note History)
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key |
| `itemId` | String (UUID) | Foreign Key -> `Item.id` (OnDelete: Cascade) |
| `type` | String | `'CREATED'`, `'FIELD_CHANGE'`, `'NOTE'`, `'STATUS_CHANGE'` |
| `fieldName` | String (Nullable) | Name of edited field (e.g. "Name", "Reorder Level") |
| `oldValue` | String (Nullable) | Previous field value before edit |
| `newValue` | String (Nullable) | New field value after edit |
| `note` | String (Nullable) | Note text left by staff or event summary |
| `userId` | String (UUID) | Foreign Key -> `User.id` |
| `createdAt` | DateTime | Timestamp of event (Default: `now()`) |

### 8. `LowStockAlert`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | String (UUID) | Primary Key |
| `itemId` | String (UUID) | Foreign Key -> `Item.id` (OnDelete: Cascade) |
| `locationId` | String (Nullable) | Facility identifier if location-specific |
| `currentStock` | Integer | Snapshot of calculated stock when alert fired |
| `reorderLevel` | Integer | Configured threshold snapshot |
| `status` | String | `'ACTIVE'`, `'DISMISSED'`, `'RESOLVED'` |
| `dismissedBy` | String (Nullable) | Email of manager who dismissed alert |
| `dismissedAt` | DateTime (Nullable) | Timestamp of dismissal |
| `createdAt` | DateTime | Alert creation timestamp |
| `updatedAt` | DateTime | Alert state update timestamp |

---

## Which relationships are one-to-many, and which are many-to-many?

- **One-to-Many**:
  - `Category` -> `Item` (One category classifies many items).
  - `Item` -> `StockMovement` (One item has many immutable ledger movements).
  - `Item` -> `ItemAuditLog` (One item has many audit timeline records).
  - `Item` -> `LowStockAlert` (One item can trigger alerts over time).
  - `User` -> `StockMovement` (One user records many stock movements).
  - `Location` -> `StockMovement` (One location acts as source or destination for many movements).
- **Many-to-Many**:
  - `User` <-> `Location` (One staff member can be assigned to multiple locations, and one location can have multiple assigned staff members). Implemented via the `UserLocation` join table with a compound unique index.

---

## Which constraints are enforced by the database, and which by application code — and why did you draw the line there?

- **Enforced by Database**:
  - Uniqueness (`User.email`, `Location.code`, `Location.name`, `Category.name`, `Item.sku`).
  - Compound uniqueness (`UserLocation(userId, locationId)`).
  - Foreign key referential integrity (`RESTRICT` on deleting items or categories that have active stock movements).
  - *Why*: Database constraints provide an un-bypassable physical guarantee against data corruption even during concurrent operations.
- **Enforced by Application Code**:
  - **Stock Sufficiency**: Checking that a warehouse has enough on-hand stock before approving an issue or transfer. (Calculated inside `prisma.$transaction`).
  - **Role-Based Authorization**: Ensuring staff cannot create items, locations, adjustments, or touch unassigned warehouses.
  - **Adjustment Reason Requirement**: Requiring a non-empty string for `notes` on adjustments.
  - **Partial Success CSV Row Validation**: Isolating bad CSV rows and reporting specific line errors without killing the entire transaction.
  - *Why*: These business rules depend on contextual logic, permissions, and dynamic ledger calculations that cannot be represented as simple static SQL column constraints.

---

## What did you deliberately denormalise?

- **LowStockAlert Snapshots**: `currentStock` and `reorderLevel` are captured on the `LowStockAlert` record when the alert triggers. This allows managers reviewing past alerts to see the exact stock situation at the moment the alert was evaluated without needing to reconstruct historical balances.
- **ItemAuditLog Old & New Values**: `oldValue` and `newValue` are stored as human-readable strings on the audit record rather than foreign keys, preserving an exact immutable historical snapshot even if underlying entities are modified later.

---

## What would break first if this had 100x the data?

- **On-the-Fly Full Ledger Table Scan**:
  - *Issue*: As the `StockMovement` table grows to millions of rows, calculating `SUM(quantity)` by scanning all movements for an item across multiple locations on every list query would increase database CPU and query latency.
  - *Solution at Scale*:
    1. Introduce a periodic **Ledger Checkpoint / Balance Snapshot Table** (e.g. daily/weekly balances per item per location). Real-time stock calculation would then only sum movements *since the last snapshot*:
       $$\text{Stock} = \text{Snapshot Balance} + \sum \text{Movements since Snapshot}$$
    2. Add composite database indexes on `(itemId, destinationLocationId, type, createdAt)` and `(itemId, sourceLocationId, type, createdAt)`.
