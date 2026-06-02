# AGENTS.md — SenExpert Global

## Quick Start
```bash
npm install
npm run dev        # Turbopack (may fail on low-RAM/paging; see below)
npm run dev:classic # next dev --no-turbo — use if Turbopack panics
npm run build
npm run lint
```

## Windows Paging File Issue
Turbopack (Rust) spawns many threads. On Windows with a small paging file you get:
```
OS can't spawn worker thread: The paging file is too small (os error 1455)
```
**Fix:** Use `npm run dev:classic`, or increase Windows virtual memory to ≥8 GB.

## Architecture — Two Sites in One App

| Area | Route | Who |
|------|-------|-----|
| Public website | `/`, `/about`, `/services`, `/gallery`, `/contact` | Anonymous visitors |
| Dashboard ("ToolVault") | `/dashboard/*`, `/login` | Authenticated users (6 roles) |
| Print views | `/print/tool-request/[id]`, `/print/financial-request/[id]` | Authenticated users |

## Tech Stack
- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** — CSS-first config (`globals.css` `@theme` block), **no** `tailwind.config.js`
- **Framer Motion** + **Lucide React**
- **MongoDB Atlas** — native `mongodb` driver (no Mongoose/Prisma)
- **JWT + bcryptjs** — custom auth, localStorage session (no cookies)

## Server-Side Services — Critical Rules

Three files have `// @ts-nocheck` and use **dynamic imports** to avoid bundling Node modules in the browser:

| File | Contents |
|------|----------|
| `src/lib/mongodb.ts` | `connectToDatabase()`, `getCollection()` |
| `src/services/authService.ts` | `login()`, JWT, bcrypt, user CRUD |
| `src/services/toolsService.ts` | Tools, requests, maintenance, stats, audit |

### Never import these in client components.
They dynamically `import('mongodb')`, `import('jsonwebtoken')`, `import('bcryptjs')`.

**Client code** must use `src/lib/apiClient.ts` (wraps `fetch()` to API routes) or `src/lib/authContext.tsx` (auth state).

### tsconfig excludes these deliberately
```json
"exclude": ["src/scripts/**/*", "src/services/**/*"]
```
They are **server-only** and skipped by the TS compiler.

## Auth Model
- **Storage:** `localStorage` keys: `senexpert_token`, `senexpert_user`, `senexpert_profile`
- **JWT expiry:** 7 days, secret from `JWT_SECRET` env var
- **Avatar:** stored as base64 **in MongoDB** (not localStorage — 5 MB quota limit). Fetched via `GET /api/profile`
- **Context sync:** listens for `storage` events (cross-tab) and custom `auth-change` events (same-tab dispatch from login page)
- **Logout:** calls `POST /api/auth/logout`, then clears localStorage

## Routes & Roles

See `authContext.tsx` `ROLE_PERMISSIONS` (client) and `authService.ts` `ROLE_PERMISSIONS` (server) — **duplicated**. Keep in sync.

| Role | Distinct permissions |
|------|---------------------|
| **super_admin** | Everything + user management + audit logs + "View As" mode |
| **admin** | Tool CRUD, approvals, analytics, calendar, maintenance |
| **accountant** | Financial requests: approve/reject |
| **hr** | Approvals (read), settings |
| **field** | Dashboard only (read) |
| **operator** | View/add tools, make tool/financial requests |

⚠️ **Bug:** `authService.ts` line 162–163 has a duplicate `field: []` key. Second one wins.

## Database — 8 Collections

| Collection | Key detail |
|-----------|------------|
| `users` | `password_hash` (bcrypt, 12 rounds) |
| `profiles` | `_id` matches `users._id`, `avatar_url` (base64) |
| `tools` | Setting `quantity: 0` **deletes** the document |
| `tool_requests` | Uses `$lookup` aggregation to resolve `tool_name` from `tools` |
| `financial_requests` | Uses `$lookup` aggregation to resolve `requester_name` from `profiles` |
| `maintenance` | Statuses: `scheduled`, `in_progress`, `completed`, `cancelled` |
| `alerts` | Types: `info`, `warning`, `critical`, `success` |
| `audit_logs` | Every mutation logs here |

## API Routes (`/api/*`)

All require `Authorization: Bearer <token>` header.

| Endpoint | Methods | Notes |
|----------|---------|-------|
| `auth/login` | POST | Public |
| `users` | GET/POST/PATCH/DELETE | Super admin only |
| `profile` | GET/PATCH | Self only |
| `tools` | GET/POST/PATCH/DELETE | Filters: `?category=`, `?status=`, `?search=`, `?id=` |
| `tools/stats` | GET | Dashboard statistics |
| `tool-requests` | GET/POST/PATCH | Status update: `approved`, `rejected`, `completed` |
| `financial-requests` | GET/POST/PATCH | Status update: `approved`, `rejected` |
| `maintenance` | GET/POST/PATCH | Status update: `scheduled`, `in_progress`, `completed`, `cancelled` |
| `alerts` | GET | |
| `audit-logs` | GET | |

All route files follow an identical pattern: extract Bearer token, call service, return JSON.

## Key Quirks

- **Aggregation pipelines** resolve display names via `$lookup`. If adding a new joined field, follow the pattern in `toolsService.ts` (`$lookup` → `$addFields` with `$let/$cond` → `$project` to remove temp field)
- **Tool auto-delete:** `updateTool()` deletes the document when `quantity` is set to `<= 0`
- **Operator visibility:** Operators only see tools they created in the last 4 hours (`src/app/dashboard/inventory/page.tsx`)
- **Seed command:** `npx tsx src/scripts/seedAll.ts` seeds 6 test users + inventory
- **Path alias:** `@/*` maps to `src/*`

## Test Users
| Email | Password | Role |
|-------|----------|------|
| superadmin@test.com | Test@123 | super_admin |
| admin@test.com | Test@123 | admin |
| accountant@test.com | Test@123 | accountant |
| hr@test.com | Test@123 | hr |
| field@test.com | Test@123 | field |
| operator@test.com | Test@123 | operator |
