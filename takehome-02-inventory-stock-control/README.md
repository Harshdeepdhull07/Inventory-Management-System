# BUSY Inventory & Stock Control System

> Production-grade, enterprise Inventory & Stock Control System built for the BUSY Infotech Take-Home Assessment.

---

## 🚀 Key Features

* 🔐 **Role-Based Access Control**: Manager & Warehouse Staff roles with JWT authentication and bcrypt password hashing.
* 📦 **Append-Only Stock Ledger**: **Zero mutable quantity columns**. All stock balances are computed dynamically from immutable transaction records.
* 📍 **Multi-Location & Staff Permissions Matrix**: Warehouses and Retail Stores with granular location-level staff authorization.
* 🔄 **Atomic Transfers**: Single-transaction inter-location stock transfers with strict sufficiency validation.
* 🔍 **High-Performance Server Querying**: Fuzzy text search, category/location filtering, low-stock toggles, multi-column sorting, and pagination.
* 📊 **CSV Data Hub**: Partial-success Items & Stock Receipts importers with row diagnostics + Live inventory CSV export.
* 📈 **Visual Analytics Dashboard**: KPI metrics, category stock breakdowns, facility capacity charts, and 8-week receipt vs issue trends.
* 📜 **Immutable Item Timeline**: Complete chronological audit log of all transactions with author attribution and running balance.
* ⚠️ **Intelligent Low-Stock Alerts**: Threshold monitoring with dismissal memory and reactive reinstatement.

---

## 🛠️ Quickstart Setup

### Prerequisites
* Node.js v18+
* PostgreSQL database (or Supabase / Render Postgres URL)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL in .env if needed
npm run prisma:generate
npm run prisma:db:push
npm run prisma:seed
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 👤 Demo Credentials

* **Manager**: `manager@inventory.com` / `Manager@123`
* **Staff**: `staff@inventory.com` / `Staff@123`
* **Staff 2**: `staff2@inventory.com` / `Staff@123`

---

## 📚 Complete Documentation Suite
* [System Architecture](docs/architecture.md)
* [Database Schema & ERD](docs/schema.md)
* [Architectural Decisions Log](docs/decisions.md)
* [AI Prompts Log](docs/ai-prompts.md)
* [Work Execution Plan](docs/plan.md)
* [Official Submission Form](SUBMISSION.md)
