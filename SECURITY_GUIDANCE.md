# 🛡️ PharmaNile Production Security Guide & Checklists

This operational guide details the security defenses in place across PharmaNile API routes, data querying layers, and user interface layouts.

---

## 📋 Table of Contents
1. [SQL Injection Prevention Checklist](#1-sql-injection-prevention-checklist)
2. [XSS (Cross-Site Scripting) Defense](#2-xss-cross-site-scripting-defense)
3. [CSRF (Cross-Site Request Forgery) Protections](#3-csrf-cross-site-request-forgery-protections)
4. [Role-Based Access Control (RBAC) Matrices](#4-role-based-access-control-rbac-matrices)

---

## 1. SQL Injection Prevention Checklist

PharmaNile relies on PostgreSQL (Supabase). Dynamic execution or manual interpolation of strings is prohibited.

- [ ] **Utilize the Supabase JS SDK for Database IO:**
  - Supabase client queries are parameterized automatically by PostgREST.
  - *Correct:* `supabase.from('products').select('*').eq('barcode', userProvidedBarcode)`
  - *Incorrect:* Injecting raw strings directly into raw query strings.
- [ ] **PL/pgSQL Functions Parameter Binding:**
  - When drafting database functions (`database/*.sql`), never concatenate parameters into dynamic strings.
  - *Correct:* Use query parameters directly (`SELECT id FROM chains WHERE password = p_password`).
  - *Incorrect:* Using `EXECUTE 'SELECT * FROM chains WHERE password = ' || p_password`.
  - *Safe dynamic identifiers:* If dynamic tables or columns are required, use `format()` with `%I` (for identifiers) or `%L` (for values):
    ```sql
    EXECUTE format('SELECT * FROM %I WHERE id = $1', table_name) USING record_id;
    ```
- [ ] **Zod Schema Inputs Filtering:**
  - All API routes handling POST/PUT payloads must assert parameter formats before executing queries. Excecute via `parseBody(req, schema)`.

---

## 2. XSS (Cross-Site Scripting) Defense

XSS vulnerabilities are countered using double-layered code syntax constraints and browser-level policies:

1. **Next.js Engine Auto-escaping:**
   - React automatically escapes values in braces `{}` (e.g. `{userInput}`) before rendering, disabling inline HTML injection attempts.
2. **ESLint Safe-Syntax Rule Enforcement:**
   - PharmaNile bans dangerous overrides in `eslint.config.mjs`:
     ```json
     "react/no-danger": "error"
     ```
     This completely blocks developers from committing code with `dangerouslySetInnerHTML`.
3. **Execution Bans:**
   - ESLint rules enforce bans on code evaluation statements:
     ```json
     "no-eval": "error",
     "no-implied-eval": "error",
     "no-new-func": "error"
     ```
4. **Strict Content Security Policy (CSP):**
   - Implemented via `src/middleware.ts`:
     - Scripts are limited to `'self'` and Next.js internal execution requirements (`'unsafe-inline'`, `'unsafe-eval'`).
     - Stylesheet sources are restricted to `'self'`, `'unsafe-inline'`, and Google Fonts.
     - Content embedding is explicitly blocked using `frame-ancestors 'none'`.

---

## 3. CSRF (Cross-Site Request Forgery) Protections

CSRF vectors are addressed through secure cookie provisioning and Origin filtering:

1. **SameSite Cookie Configuration:**
   - Authentication tokens stored by `@supabase/ssr` in cookies use the following settings by default during production:
     - `HttpOnly`: Blocks client-side Javascript from reading the token (mitigates cookie-grabbing XSS).
     - `Secure`: Forces cookies to be sent only over HTTPS.
     - `SameSite=Lax`: Prevents browser agents from sending session cookies along with cross-site requests.
2. **HTTP State Header Verifications:**
   - State-changing API routes require specific request content-types and validate browser Origin/Referrer matching policies.
3. **Structured API Guarding:**
   - All protected API routes must run `requireAuth(req)` or `requireAdmin(req)`. They fetch authorization context from validated session metadata rather than trusting parameters supplied in query bodies.

---

## 4. Role-Based Access Control (RBAC) Matrices

Roles (`chain_admin`, `admin`, `manager`, `staff`, `developer`) are authorized on two separate layers:

```
                  ┌──────────────────────────────┐
                  │   Client Router Guard        │
                  │   - getNavRoutes(role)       │
                  │   - Blocks UI elements       │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Next.js Middleware Guard  │
                  │    - Role checks on /api/    │
                  │    - Redirects to login      │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Supabase RLS Policies     │
                  │    - Row isolation by role   │
                  │    - get_my_pharmacy_id()    │
                  └──────────────────────────────┘
```

- **Policy Compliance Script:** Run `verify-db-security.js` in execution builds to verify that RLS policies are enabled on all tables.
