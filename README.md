# Brightloop Software - Subscription Management System

A production-grade, enterprise Subscription Management System developed for the Odoo Hackathon. The system manages the full subscription lifecycle—from quotation drafting and customer acceptance to automated recurring billing, PDF invoice generation, payment reconciliation, and SaaS metric analytics (MRR, ARR, churn rate).

---

## 🚀 Live Demo & Quick Start

### 1. Default Demo Credentials
The database is pre-seeded with sample users for each role (or you can use the 1-click fill buttons on the login screen):

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Admin** | `admin@brightloop.io` | `Password123!` | Full system access, users, analytics, system settings, cron billing |
| **Staff** | `staff@brightloop.io` | `Password123!` | Customers, products, plans, quotes, subscriptions, invoices, payments |
| **Customer** | `customer@brightloop.io` | `Password123!` | View active subscriptions, download quote/invoice PDFs, pay bills |

---

## 🛠️ Tech Stack & Architecture

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React
- **Document Generation:** PDFKit (server-rendered corporate PDF quotes & invoices)
- **Job Scheduling:** Node-cron (daily midnight automated recurring billing engine)
- **Testing:** Comprehensive Jest/Supertest integration test suite (32/32 passing tests)

---

## 🏃 Running the Application

### Prerequisites
- Node.js 18+ (tested with Node v22.13.0)
- PostgreSQL 14+ running locally on port 5432 (`subscription_management` database)

### Step 1: Start the Backend API
```powershell
cd backend
npm.cmd install
npx.cmd prisma db push
npx.cmd ts-node prisma/seed.ts
npm.cmd run dev
```
The backend API runs on **http://localhost:5000** (Health check: `http://localhost:5000/api/health`).

### Step 2: Start the Frontend Application
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
The frontend application will be live at **http://localhost:5173**.

---

## 📂 Project Structure

```
ODOO HACKATHON/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # 22 relational models and enums
│   │   └── seed.ts               # Seed data for users, products, plans, quotes
│   ├── src/
│   │   ├── config/database.ts    # Prisma client singleton
│   │   ├── controllers/          # 14 RESTful controllers
│   │   ├── middlewares/          # JWT, Role authorization, Zod validation
│   │   ├── routes/               # API route definitions
│   │   ├── utils/                # Date clamping, PDF generation, Audit logging
│   │   ├── cron.ts               # Recurring billing cron runner
│   │   └── server.ts             # Express app bootstrap
│   └── tests/
│       └── comprehensive.test.ts # 32 passing integration tests
├── frontend/
│   ├── src/
│   │   ├── components/           # Common UI widgets, layout, sidebar, navbar
│   │   ├── context/              # AuthContext and ToastContext
│   │   ├── pages/                # 20 full-featured application pages
│   │   ├── services/api.ts       # Axios instance with auth interceptor
│   │   ├── types/index.ts        # TypeScript interface definitions
│   │   ├── App.tsx               # Route definitions with role guards
│   │   └── main.tsx              # React DOM entry point
└── docs/
    ├── API_DOCUMENTATION.md      # Complete REST endpoints documentation
    ├── DATABASE_DESIGN.md        # DB Schema & Mermaid ER diagram
    └── CONTRIBUTIONS.md          # 4-member modular development matrix
```

---

## 🔄 Recurring Billing & Idempotency
- The recurring billing engine automatically scans active subscriptions where `nextBillingDate <= NOW()`.
- Calculates accurate cycle periods using date clamping to handle leap years and 28/30/31-day months.
- Checks `BillingAttempt` records for duplicate `[subscriptionId, periodStart, periodEnd]` keys to prevent double-invoicing.
- Generates an `Invoice` with line items, tax, and discount, advances `nextBillingDate`, and emits in-app notifications.

---

## 📄 Documentation Links
- [API Documentation](file:///c:/Users/ayush/OneDrive/Desktop/odoo/ODOO%20HACKATHON/docs/API_DOCUMENTATION.md)
- [Database Design](file:///c:/Users/ayush/OneDrive/Desktop/odoo/ODOO%20HACKATHON/docs/DATABASE_DESIGN.md)
- [Team Contributions](file:///c:/Users/ayush/OneDrive/Desktop/odoo/ODOO%20HACKATHON/docs/CONTRIBUTIONS.md)
- [Development Status](file:///c:/Users/ayush/OneDrive/Desktop/odoo/ODOO%20HACKATHON/DEVELOPMENT_STATUS.md)

