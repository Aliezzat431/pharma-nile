# 💊 PharmaNile — Premium Multi-Tenant Pharmacy Management System

> **Version:** 2.0 (Multi-Chain Architecture)  
> **Stack:** Next.js 15 · Supabase · TypeScript · Framer Motion  
> **Language:** Arabic (RTL) UI with English code base

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Multi-Chain Model](#3-multi-chain-model)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Application Modules](#6-application-modules)
7. [API Routes](#7-api-routes)
8. [Frontend Structure](#8-frontend-structure)
9. [Key Hooks & State](#9-key-hooks--state)
10. [Security Model (RLS)](#10-security-model-rls)
11. [AI Features](#11-ai-features)
12. [Offline Mode](#12-offline-mode)
13. [Design System](#13-design-system)
14. [Environment Setup](#14-environment-setup)
15. [Database Files Reference](#15-database-files-reference)
16. [Deployment](#16-deployment)

---

## 1. Project Overview

**PharmaNile** is a full-stack, premium pharmacy management system built for the Egyptian market. It supports multiple pharmacy chains (سلاسل صيدليات), each with multiple branches (فروع), and each branch with multiple staff members.

**Core capabilities:**
- 🏪 Point of Sale (POS) with barcode scanning
- 📦 Inventory & stock management
- 🧾 Invoice & order tracking
- 👥 Customer & debt management
- 💰 Financial reporting & analytics
- 🔁 Stock transfers between branches
- 🤖 AI-powered product analysis & auto-fill
- 📴 Offline-first POS with sync-on-reconnect
- 🌙 10+ premium themes (dark, light, midnight, ocean, etc.)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 15 App                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │   Pages/UI   │  │  API Routes  │  │ Middleware │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                 │                │         │
│  ┌──────▼─────────────────▼────────────────▼─────┐  │
│  │              Supabase Client (JS SDK)          │  │
│  └──────────────────────┬─────────────────────────┘  │
└─────────────────────────│────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│                    Supabase Cloud                     │
│  ┌────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ PostgreSQL │  │   Auth   │  │  Row Level Sec.  │  │
│  │  + RLS     │  │ (JWT)    │  │  (Chain-scoped)  │  │
│  └────────────┘  └──────────┘  └──────────────────┘  │
└───────────────────────────────────────────────────────┘
```

**Tech Stack:**
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Styling | Vanilla CSS + CSS Variables |
| Animations | Framer Motion |
| State | React Context + Redux Toolkit |
| Icons | Lucide React |
| Font | Cairo (Arabic), Inter (English) |

---

## 3. Multi-Chain Model

The system uses a **3-tier hierarchy**:

```
Chain (سلسلة)          ← Owned by chain_admin
  └── Pharmacy (صيدلية) ← Each branch
        └── User (مستخدم) ← Staff per pharmacy
```

### Roles

| Role | Arabic | Access |
|------|--------|--------|
| `chain_admin` | مدير السلسلة | Can add/manage pharmacies in their chain. No access to pharmacy data. Only `/settings`. |
| `admin` | مدير الصيدلية | Full access to their pharmacy's data |
| `manager` | مشرف | Most features except sensitive settings |
| `staff` | موظف | POS, inventory view |

### Chain Login Flow (v2.0)

```
1. User opens app → /auth/login
2. Selects their chain (سلسلة) from dropdown
3. Enters chain password (set by chain_admin)
4. Selects their pharmacy (فرع) from filtered list
5. Enters email + password
6. JWT issued with { pharmacy_id, chain_id, role } in metadata
7. RLS enforces data isolation at DB level
```

---

## 4. Database Schema

### Core Tables

#### `chains`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Chain identifier |
| `name` | text UNIQUE | Chain display name |
| `password` | text | Access password set by chain_admin |
| `created_at` | timestamptz | Creation timestamp |

#### `pharmacies`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Pharmacy identifier |
| `chain_id` | uuid FK→chains | Parent chain |
| `name` | text | Branch name |
| `address` | text | Physical address |
| `phone` | text | Contact number |
| `is_active` | boolean | Active status |

#### `user_profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid FK→auth.users | User ID |
| `pharmacy_id` | uuid FK→pharmacies | Assigned pharmacy |
| `chain_id` | uuid FK→chains | Assigned chain |
| `full_name` | text | Display name |
| `role` | text | User role |

#### `products`
Full inventory item with: `barcode`, `name`, `category`, `price`, `cost_price`, `quantity`, `reorder_level`, `expiry_date`, `pharmacy_id`

#### `orders` / `order_items`
Sales transactions linked to pharmacy and optional customer.

#### `customers`
Patient/customer records with debt tracking per pharmacy.

#### `invoices`
Purchase invoices from suppliers, with line items.

#### `stock_transfers`
Inter-branch inventory movements within the same chain.

#### `user_pharmacy_access`
Maps users to pharmacies with role — supports multi-pharmacy access.

#### `monthly_sales_summary`
Materialized-view-style table auto-updated by trigger on order completion.

---

## 5. Authentication & Authorization

### Login Flow
- Handled in `src/app/auth/login/page.tsx`
- Uses `supabase.auth.signInWithPassword()`
- JWT metadata includes: `pharmacy_id`, `chain_id`, `role`, `full_name`

### Registration
- Handled in `src/app/auth/register/page.tsx`
- Creates auth user → triggers `handle_new_user_registration()` DB function
- Auto-creates `user_profiles` and `user_pharmacy_access` records

### Middleware (`src/middleware.ts`)
- Protects all non-auth routes
- Refreshes session on every request
- Redirects unauthenticated users to `/auth/login`

### Auth Hook (`src/hooks/useAuth.tsx`)
- Subscribes to `onAuthStateChange`
- Fetches `user_profiles` record
- Exposes `user`, `loading`, `signOut`

---

## 6. Application Modules

### 🏠 Dashboard (`/`)
- Real-time KPIs: Sales today, Low stock alerts, Pending debts
- Monthly sales chart
- Quick-action buttons
- Live Supabase subscriptions for instant updates

### 🛒 POS (`/pos`)
- Barcode scanner integration
- Cart management with quantity controls
- Customer selection & debt tracking
- Offline support — queues sales locally, syncs on reconnect
- Receipt generation

### 📦 Inventory (`/inventory`)
- Product list with search & filters
- Add/Edit/Delete products
- Expiry date tracking
- Low stock indicators
- Bulk CSV import via AI parsing

### 🧾 Invoices (`/invoices`)
- Purchase invoice management
- Supplier tracking
- PDF-ready view

### 🔁 Returns (`/returns`)
- Product return processing
- Links back to original order

### 👥 Customers (`/customers`)
- Customer profiles
- Debt ledger
- Payment history

### 💰 Financials (`/financials`)
- Revenue / expense tracking
- Monthly summary reports
- Export to Excel/CSV

### 📋 Shortages (`/shortages`)
- Track out-of-stock items
- Request restocking

### 🏢 Companies (`/companies`)
- Supplier / distributor management

### 👨‍⚕️ Staff (`/staff`)
- Employee management (admin/manager only)
- Salary & incentive tracking
- Role assignment

### 🔄 Transfers (`/transfers`)
- Move stock between pharmacies in same chain
- Requires admin approval

### 🕌 Sadqah (`/sadqah`)
- Charitable donation / near-expiry product tracking

### ⚙️ Settings (`/settings`)
- **General:** Pharmacy info, preferences
- **Appearance:** 10+ themes, dark/light mode
- **Shortcuts:** Keyboard shortcut reference
- **Database:** Backup, export, cleanup tools
- **Chain (chain_admin only):** Add pharmacies, update chain password

---

## 7. API Routes

All routes in `src/app/api/`:

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/register` | POST | Create user + pharmacy |
| `/api/staff/create` | POST | Add staff member (admin only) |
| `/api/db-backup/export` | GET | Export full DB backup as JSON |
| `/api/db-cleanup` | POST | Remove orphaned data |
| `/api/db-usage` | GET | DB size & table stats |
| `/api/agent/execute` | POST | AI agent command execution |
| `/api/ai-autofill` | POST | AI product data autofill |
| `/api/analyze-product` | POST | AI product image analysis |
| `/api/invoice-scan` | POST | AI invoice OCR parsing |
| `/api/prescription-scan` | POST | AI prescription reader |
| `/api/copilot` | POST | AI system assistant |

---

## 8. Frontend Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global CSS + design tokens
│   ├── auth/               # Login, register
│   ├── pos/                # Point of Sale
│   ├── inventory/          # Inventory management
│   ├── invoices/           # Purchase invoices
│   ├── customers/          # Customer management
│   ├── staff/              # Staff management
│   ├── financials/         # Financial reports
│   ├── settings/           # Settings + ChainSettings
│   ├── transfers/          # Stock transfers
│   └── api/                # API route handlers
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── LayoutWrapper.tsx # Auth + layout guard
│   │   └── CommandPalette.tsx # Ctrl+K search
│   ├── ui/
│   │   ├── Pagination.tsx  # Reusable paginator
│   │   └── SyncToastProvider.tsx # Toast notifications
│   └── chat/
│       └── ChatWidget.tsx  # AI chat interface
│
├── hooks/
│   ├── useAuth.tsx         # Auth state management
│   ├── usePreferences.ts   # User preferences
│   ├── usePagination.ts    # Pagination logic
│   └── useInventory.ts     # Inventory data hook
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser Supabase client
│   │   ├── server.ts       # Server Supabase client
│   │   └── offline-orders.ts # Offline queue
│   └── api/
│       ├── staff.ts        # Staff API helpers
│       └── orders.ts       # Order processing
│
└── store/                  # Redux store
    └── slices/
        └── agentSlice.ts   # AI agent state
```

---

## 9. Key Hooks & State

### `useAuth`
```ts
const { user, loading, signOut } = useAuth();
// user.user_metadata = { pharmacy_id, chain_id, role, full_name }
```

### `usePreferences`
Persists user UI preferences to Supabase:
- Currency format, language, notification settings
- Theme preference backup

### `usePagination`
```ts
const { page, perPage, from, to, setPage } = usePagination(20);
// Use with Supabase .range(from, to)
```

---

## 10. Security Model (RLS)

Every table has RLS enabled. Policies enforce:

1. **Pharmacy isolation:** Users can only read/write rows where `pharmacy_id = get_my_pharmacy_id()`
2. **Chain isolation:** `chain_admin` can only see pharmacies in `chain_id = get_my_chain_id()`
3. **Role checks:** Admin-only operations (delete, staff creation) check JWT role claim

Key DB functions:
- `get_my_pharmacy_id()` → reads from `user_profiles` using `auth.uid()`
- `get_my_chain_id()` → returns chain for current user
- `handle_new_user_registration()` → trigger on `auth.users` insert

---

## 11. AI Features

| Feature | Endpoint | Model |
|---------|----------|-------|
| Product autofill | `/api/ai-autofill` | Gemini |
| Invoice OCR scan | `/api/invoice-scan` | Gemini Vision |
| Prescription reader | `/api/prescription-scan` | Gemini Vision |
| Product image analysis | `/api/analyze-product` | Gemini Vision |
| AI Copilot assistant | `/api/copilot` | Gemini |
| Agent executor | `/api/agent/execute` | Gemini |

---

## 12. Offline Mode

- POS works fully offline using **localStorage queue**
- `src/lib/supabase/offline-orders.ts` manages the queue
- On reconnect: `syncOfflineReturns()` uploads pending operations
- Service Worker (`/api/__trigger_sync`) handles background sync

---

## 13. Design System

CSS custom properties in `globals.css`:

```css
--nile-teal: #00CED1       /* Primary brand color */
--royal-gold: #D4AF37      /* Accent / premium color */
--background: #050505      /* Default dark background */
--text-primary: #ffffff
--text-secondary: #9ca3af
--nile-teal-glow: rgba(0,206,209,0.25)
```

**Available Themes:**
`dark` · `light` · `midnight` · `forest` · `coffee` · `dracula` · `ocean` · `amethyst` · `sunset` · `cyberpunk` · `snowy`

---

## 14. Environment Setup

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
```

**Run development server:**
```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 15. Database Files Reference

All SQL files are in the `database/` folder:

| File | Purpose |
|------|---------|
| `FULL_DB_SETUP.sql` | ⭐ Complete schema — run first on fresh DB |
| `chains_migration.sql` | Multi-chain: adds `chains` table + RLS updates |
| `fix_rls_triggers.sql` | Registration trigger + RLS hardening |
| `fix_registration_permissions.sql` | Grants anon/service_role access |
| `database_optimization.sql` | Indexes, materialized views, performance |
| `core_schema.sql` | Core table definitions (subset) |
| `seed_data.sql` | Sample data for development |
| `reset.sql` | ⚠️ Drops everything — use with caution |
| `clean_import.sql` | Cleanup for bulk CSV imports |
| `fix_bulk_import.sql` | Fixes after bulk import issues |
| `create_agent_logs.sql` | AI agent logging table |
| `debug_stats.sql` | Diagnostic queries |

**Execution order for fresh setup:**
```
1. FULL_DB_SETUP.sql
2. fix_rls_triggers.sql
3. fix_registration_permissions.sql
4. chains_migration.sql
5. database_optimization.sql
6. (optional) seed_data.sql
```

---

## 16. Deployment

**Platform:** Vercel (recommended)

```bash
# Build check
npm run build

# Environment variables needed on Vercel:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# GEMINI_API_KEY
```

**Supabase project settings:**
- Enable RLS on all tables ✓
- Set JWT expiry to 3600s (1 hour)
- Enable `pg_cron` for scheduled tasks
- Enable `pgvector` if using AI embeddings

---

*Last updated: July 2026 | PharmaNile v2.0 — Multi-Chain Edition*
