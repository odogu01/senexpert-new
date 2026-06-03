# AGENTS.md — SenExpert Global

## Quick Start
```bash
npm install
npm run dev          # Turbopack (may crash on low-RAM Windows — see below)
npm run dev:classic  # next dev --no-turbo — use if Turbopack gives OS error 1455
npm run build        # next build (tests if code compiles)
npm run lint         # next lint only — no Prettier/Eslint config outside Next
```

**Windows paging crash fix:** Use `npm run dev:classic` instead of `dev`, or increase virtual memory ≥ 8 GB.

## No Test Setup
Zero test infrastructure. No Jest, Vitest, Playwright. Only `next build` catches type/import errors.

## Architecture — Two Sites, One App

| Area | Routes | Providers |
|------|--------|-----------|
| Public website | `(public)/` — `/`, `/about`, `/services`, `/gallery`, `/contact` | None (server components, optional client wrappers) |
| Dashboard | `/dashboard/*`, `/login` | `QueryProvider` → `AuthProvider` → `DashboardShell` |
| Print pages | `/print/*`, `/dashboard/*/print` | `QueryProvider` only (no auth guard — expects signed-in user) |

Root layout (`src/app/layout.tsx`) is bare `<html>`/`<body>` — no providers. Dashboard layout (`src/app/dashboard/layout.tsx`) wraps children in `QueryProvider` → `AuthProvider` → `DashboardShell`. Print layout (`src/app/print/layout.tsx`) wraps in `QueryProvider` only.

## Server-Side Services — Mandatory Pattern

**All files under `src/services/` and `src/lib/mongodb.ts`** use `// @ts-nocheck` + dynamic `import()` to prevent Node.js-only modules (mongodb, jsonwebtoken, bcryptjs) from bundling into browser chunks.

```ts
// Never import these in client components:
import { connectToDatabase } from '@/lib/mongodb';  // ❌ will import mongodb
// Instead: call fetch() to /api/* routes
```

**tsconfig excludes** these from typechecking:
```json
"exclude": ["src/scripts/**/*", "src/services/**/*"]
```

If you change a file in `src/services/`, verify with `npm run build` — `next lint` skips them.

## API Layer

Every response uses the envelope: `{ success: boolean, data?: T, error?: { message: string } | string }`.

All routes (except `POST /api/auth/login`) require `Authorization: Bearer <token>`. Extract token → call service → return JSON.

| Endpoint | Methods | Notes |
|----------|---------|-------|
| `auth/login` | POST | Public; rate-limited 10 attempts/15min per IP |
| `auth/refresh` | POST | Auto-called every 30 min |
| `users` | GET/POST/PATCH/DELETE | Super admin only |
| `profile` | GET/PATCH | Self only |
| `tools` | GET/POST/PATCH/DELETE | Query params: `page`, `limit`, `category`, `status`, `search`, `location`, `id`, `categories` |
| `tools/stats` | GET | Dashboard stats |
| `tool-requests` | GET/POST/PATCH | Status updates |
| `financial-requests` | GET/POST/PATCH | Status updates |
| `maintenance` | GET/POST/PATCH | Status updates |
| `alerts` | GET | |
| `audit-logs` | GET | |

## Auth Model

- JWT stored in localStorage keys: `senexpert_token`, `senexpert_user`, `senexpert_profile` (no cookies)
- Auto-refresh every 30 min via `POST /api/auth/refresh`
- Avatar is base64 stored in MongoDB (fetched via `GET /api/profile`)
- Cross-tab sync via `storage` events; same-tab via custom `auth-change` events
- `ROLE_PERMISSIONS` duplicated in `src/lib/authContext.tsx` (client) and `src/services/authService.ts` (server) — keep in sync

## Client-Side Data Flow

```
Page component
  → useTools(), useProfile(), etc. (src/hooks/api/)   ← all 'use client'
    → TanStack useQuery + queryKeys (src/lib/query/)
      → fetch() to /api/* routes
        → services (src/services/)   ← server-only
          → repositories (src/services/repositories/)   ← pure data access
```

All hooks import from `@/hooks/api` barrel. TanStack defaults: `staleTime: 5min`, `gcTime: 10min`, `refetchOnWindowFocus: false`.

**Hooks are disabled when token is missing** — the `enabled` option checks `localStorage.getItem('senexpert_token')`.

Query key factory (`src/lib/query/keys.ts`) for granular invalidation:
```ts
queryClient.invalidateQueries({ queryKey: queryKeys.tools.all })
queryClient.invalidateQueries({ queryKey: queryKeys.tools.list(filters) })
```

## Available Hooks (`@/hooks/api`)

| Hook | Purpose |
|------|---------|
| `useTools(filters?)` | All tools |
| `useToolsPaginated(filters?)` | Server-paginated `{ data, total }` |
| `useToolById(id)` | Single tool |
| `useCategories()` | Distinct categories |
| `useCreateTool/Update/Delete` | Tool mutations |
| `useToolRequests(filters?)` | Tool requests |
| `useFinancialRequests(filters?)` | Financial requests |
| `useCreateToolRequest`, `useUpdateToolRequestStatus` | Tool request mutations |
| `useCreateFinancialRequest`, `useUpdateFinancialRequestStatus` | Financial request mutations |
| `useMaintenance(filters?)` | Maintenance records |
| `useCreateMaintenance`, `useUpdateMaintenanceStatus` | Maintenance mutations |
| `useAlerts(unreadOnly?)` | Alerts |
| `useRecentActivity(limit?)` | Audit log |
| `useDashboardStats()` | Dashboard stats |
| `useUsers()`, `useCreateUser`, `useDeleteUser`, `useResetUserPassword` | User management |
| `useProfile()`, `useUpdateProfile()` | Current user profile |
| `useLogin()`, `useLogout()` | Auth |

## Roles (6)

`super_admin` > `admin` > `accountant` > `hr` > `field` > `operator`

| Role | Capabilities |
|------|-------------|
| super_admin | Everything + user mgmt + audit logs + "View As" mode |
| admin | Tool CRUD, approvals, analytics, calendar, maintenance, create requests |
| accountant | Financial requests approve/reject |
| hr | Approvals (read), settings |
| field | Dashboard read-only |
| operator | View/add tools, make tool/financial requests |

## Critical Quirks & Gotchas

### MongoDB
- **Prefer non-SRV connection string** (`mongodb://...` instead of `mongodb+srv://...`). The SRV lookup uses Node.js c-ares which is flaky on Windows. Switch to standard URI if you see `querySrv ECONNREFUSED`.
- **No staging database** — seed scripts write directly to the `MONGODB_URI` database (same as production).
- **`$toString` over `$toObjectId`** in `$lookup` pipelines. Aggregation comparing `_id.toString()` to a string field fails silently with `$toObjectId` when the string isn't a valid ObjectId. Use `$toString` on both sides or `$let/$cond` (see `ToolRequestRepository.ts`, `FinancialRequestRepository.ts`).
- **Tool auto-delete:** Setting `quantity: 0` deletes the tool document in `updateTool()`.

### Rental Workflow
- Approving a tool request with `transaction_type: 'rented'` **decreases** the tool's quantity.
- Completing a return (status → `completed` on a rented request) **increases** the tool's quantity and sets status to `available`.
- Cache invalidation on approval/completion touches both `tools.all` and `dashboard.stats`.

### Data
- **Seed `tool_requests` have empty `tool_id`** — approval won't update tool qty for seeded records. Only new UI-created requests have `transaction_type`.
- **Operator visibility:** Operators only see tools they created in the last 4 hours (`src/app/dashboard/inventory/page.tsx`).
- **`throwIfError`** expects `{ success, data?, error? }` shape. Mutation hooks return `response.data` which may be `undefined` — guard with optional chaining.
- **Contact form** (`(public)/contact/`) uses a Server Action (`actions.ts`) + `useActionState` — no client fetch.

### Print Pages
4 pages use the same receipt format (company header, `grid-cols-2` with `border-b` rows, approval timeline, footer). All are `'use client'`:
- `/print/tool-request/[id]/page.tsx`
- `/print/financial-request/[id]/page.tsx`
- `/dashboard/requests/[id]/print/page.tsx`
- `/dashboard/financial-requests/[id]/print/page.tsx`

### Tailwind CSS v4
CSS-first config in `src/app/globals.css` `@theme` block. **No `tailwind.config.js`**. Use `@import "tailwindcss"` syntax. PostCSS plugin: `@tailwindcss/postcss`.

## Database — 8 Collections

| Collection | Key detail |
|-----------|------------|
| `users` | `password_hash` (bcrypt, 12 rounds) |
| `profiles` | `_id` matches `users._id`, `avatar_url` (base64) |
| `tools` | `quantity: 0` deletes document |
| `tool_requests` | `$lookup` to resolve `tool_name` |
| `financial_requests` | `$lookup` to resolve `requester_name` |
| `maintenance` | Statuses: `scheduled`, `in_progress`, `completed`, `cancelled` |
| `alerts` | Types: `info`, `warning`, `critical`, `success` |
| `audit_logs` | Every mutation logs here |

Indexes (created by `npx tsx src/scripts/migrateIndexes.ts`):
- `tools: { quantity: 1, name: 1 }` — paginated query
- `tools: { name: 1 }` — `$regex` search support
- `users: { email: 1 }` (unique) — login lookup

## Seed Data

```bash
npx tsx src/scripts/seedAll.ts         # 6 test users + inventory + requests
npx tsx src/scripts/seedUsers.ts       # test users only
npx tsx src/scripts/migrateIndexes.ts  # MongoDB indexes
```

| Email | Password | Role |
|-------|----------|------|
| superadmin@test.com | Test@123 | super_admin |
| admin@test.com | Test@123 | admin |
| accountant@test.com | Test@123 | accountant |
| hr@test.com | Test@123 | hr |
| field@test.com | Test@123 | field |
| operator@test.com | Test@123 | operator |

## Environment

```env
MONGODB_URI=mongodb://...              # Prefer non-SRV — see quirks
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

(`dotenv` is a devDependency — `.env.local` is loaded by Next.js automatically.)
