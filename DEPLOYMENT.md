# 🚀 PharmaNile Production Deployment & DevOps Runbook

This guide covers deployment procedures, environment separation, database migration safety workflows, auto-scaling management, and disaster recovery rollback steps.

---

## 📋 Table of Contents
1. [Staging vs. Production Setup](#1-staging-vs-production-setup)
2. [Database Migration Safety Workflow](#2-database-migration-safety-workflow)
3. [Auto-scaling & Connection Pooling Configuration](#3-auto-scaling--connection-pooling-configuration)
4. [Deployment Automation (CI/CD)](#4-deployment-automation-cicd)
5. [Disaster Recovery & Rollback Procedure](#5-disaster-recovery--rollback-procedure)

---

## 1. Staging vs. Production Setup

PharmaNile enforces strict isolation between staging and production instances to prevent test transactions from leaking into critical financial ledgers.

| Factor | Staging Environment | Production Environment |
| :--- | :--- | :--- |
| **Vercel Deployments** | Git updates to branch `staging` → Automated deploy | Git merges/updates on `main` → Production releases |
| **Domain Host** | `staging.pharmanile.com` | `app.pharmanile.com` |
| **Supabase Instance** | `pharma-nile-staging` | `pharma-nile-prod` (Premium Plan) |
| **Rate Limit Limits** | 100 req/min general, 20/min sensitive | 100 req/min general, 20/min sensitive (Edge cached) |
| **Sentry DSN** | Shared dev/staging logger | Productive logger (Strict quota-aware) |

### Environment Values Requirements (`.env` Config templates)
For both settings, the following variables must be configured:
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Safe client access key.
- `SUPABASE_SERVICE_ROLE_KEY`: Secret DB utility key (never expose to client).
- `GEMINI_API_KEY`: OCR & prescription analysis credential.
- `SENTRY_DSN`: Error-monitoring target.

---

## 2. Database Migration Safety Workflow

To prevent data corruption, schema mismatches, and downtime, migrations follow this sequence:

### Rule: Never Run Destructive Migrations in Production Directly
- **No `DROP COLUMN`** unless the column has been deprecated in code for at least 1 release cycle.
- **No `ALTER TABLE ... DEFAULT ...`** on major tables without batch provisioning, to avoid table locks.

### Step-by-Step Migration Loop:
```
[Local Testing] ──> [Backup Database] ──> [Deploy DB Schema Changes] ──> [Run Verification Script] ──> [Build & Release App]
```

1. **Step 1: Backup Database**
   Export a full database state backup by running:
   ```bash
   # Generates JSON data dump of tables
   curl -H "Authorization: Bearer <token>" https://your-app/api/db-backup/export > backups/backup_$(date +%F_%H%M%S).json
   # Or using pg_dump:
   pg_dump -h db.supabase.co -U postgres -d postgres -F c > backups/supabase_backup_$(date +%F).dump
   ```
2. **Step 2: Apply Migrations**
   Deploy SQL scripts using Supabase CLI or SQL Editor:
   ```bash
   supabase db push
   ```
3. **Step 3: Post-Migration Check**
   Run local schema checks before proceeding:
   ```bash
   npm run verify:rls
   npm run verify:constraints
   ```

---

## 3. Auto-scaling & Connection Pooling Configuration

PharmaNile is optimized to scale automatically on Vercel's serverless infrastructure. However, PostgreSQL can deplete its pool of active database connections if many lambda functions boot concurrently.

### Database Connection Management Model:

```
┌─────────────────────────────────┐
│     Next.js Serverless lambdas  │
└────────────────┬────────────────┘
                 │ (Websockets / REST pool)
                 ▼
┌─────────────────────────────────┐
│ Supabase Connection Pool (6543) │ (Transaction mode - PgBouncer)
└────────────────┬────────────────┘
                 │ (Keeps active connections recycled)
                 ▼
┌─────────────────────────────────┐
│  PostgreSQL Database (Port 5432)│ (Direct connection for migrations)
└─────────────────────────────────┘
```

1. **Production Port Rules:**
   - **For API Routes / Server Actions (High concurrency):** Always use port `6543` with PgBouncer. Appends `?pgbouncer=true` to your Postgres connection URL.
   - **For DB Migrations / CLI Scripts:** Use direct connection via port `5432` to allow schema locks.
2. **Graceful Degradation:**
   If the database reaches its connection ceiling, API routes catch database timeouts and fallback using `src/lib/errors.ts` returning standard `503 Service Unavailable` with details logged, preventing total frontend crashing.

---

## 4. Deployment Automation (CI/CD)

The GitHub Actions workflow `.github/workflows/ci.yml` is configured to enforce security before any code makes it to Vercel:

1. **Code Validation:** Runs type checking and linters.
2. **Unsafe Pattern Scan:** Rejects builds containing `supabase.from().single()` - forcing usage of `.maybeSingle()` to prevent runtime errors.
3. **Secrets Audit:** Scans configuration files for hardcoded API keys.
4. **Deploy Script Gates:** Prevents builds from succeeding if custom database validation routines (`verify:rls` or `verify:constraints`) output failures.

---

## 5. Disaster Recovery & Rollback Procedure

If a production release encounters critical registry faults or application logic bugs, execute the rollback workflow immediately.

### Action Plan 1: Revert Code Build (Instant)
Since Vercel supports instant deployments, you can roll back the application layer within 10 seconds:
1. Open Vercel Project Dashboard.
2. Navigate to **Deployments**.
3. Select the previous stable deployment (usually the 2nd to last successful build).
4. Click **Promote to Production** (Revert).

### Action Plan 2: Revert DB Schema & Restore Backup
If a database migration introduced corrupt fields or broke compatibility:
1. Revert the code build to the previous version to stop client requests from crashing on database constraints.
2. Run database reset scripts if schema locks occur.
3. Restore the backup dump collected before migration:
   ```bash
   # Restore schema & data using pg_restore
   pg_restore -h db.supabase.co -U postgres -d postgres -c backups/supabase_backup_previous.dump
   ```
4. Verify database state is restored:
   ```bash
   npm run verify:rls
   npm run verify:constraints
   ```
