# AGENTS.md — SenExpert Global

## Quick Start

```bash
npm run dev:classic  # next dev --no-turbo — always use this on Windows (avoid OS error 1455)
npm run build        # catches type/import errors — only verification step (no tests exist)
npm run lint         # next lint only
```

**No test infrastructure.** Zero Jest/Vitest/Playwright. `next build` is the only gate.

**Windows paging crash:** Use `dev:classic` or increase virtual memory ≥ 8 GB.

## Architecture — Two Sites, One App

| Area | Routes | Providers |
|------|--------|-----------|
| Public website | `/`, `/about`, `/services`, `/gallery`, `/contact` | None (server components, optional client wrappers) |
| Dashboard | `/dashboard/*`, `/login` | `QueryProvider` → `AuthProvider` → `DashboardShell` |
| Print pages | `/print/*` | `QueryProvider` only (no auth guard) |

Root layout (`src/app/layout.tsx`) is bare `<html>`/`<body>`. Dashboard layout wraps in `QueryProvider` → `AuthProvider` → `DashboardShell`. Print layout wraps `QueryProvider` only.

## Server-Side Services — Mandatory Pattern

All files under `src/services/` and `src/lib/mongodb.ts` use `// @ts-nocheck` + dynamic `import()` to keep Node-only modules (mongodb, jsonwebtoken, bcryptjs) out of browser bundles.

```ts
// ❌ Never do this in client components:
import { connectToDatabase } from '@/lib/mongodb';

// ✅ Always call fetch() to /api/* routes
```

**tsconfig excludes** `src/scripts/**/*` and `src/services/**/*` from type-checking. After editing those, verify with `npm run build` — `next lint` skips them.

Repositories barrel: `import { ToolRepository } from '@/services/repositories'` (see `src/services/repositories/index.ts`).

## API Layer

Every response: `{ success: boolean, data?: T, error?: { message: string } | string }`. All routes except `POST /api/auth/login` require `Authorization: Bearer <token>`. Routes mirror `src/app/api/` directory structure.

## Auth Model

- **JWT in localStorage**, not cookies. Keys: `senexpert_token`, `senexpert_user`, `senexpert_profile`.
- Auto-refresh every 30 min via `POST /api/auth/refresh`.
- Cross-tab sync via `storage` events; same-tab via custom `auth-change` events.
- **Login uses `window.location.href` for redirect** (not `router.push`) to force a fresh `AuthProvider` mount.
- `ROLE_PERMISSIONS` duplicated in `src/lib/authContext.tsx` (client) and `src/services/authService.ts` (server) — keep in sync.

## Client-Side Data Flow

```
Page → useXxx() (src/hooks/api/) → TanStack useQuery → fetch() /api/* → services → repositories
```

All hooks export from `@/hooks/api` barrel. TanStack defaults: `staleTime: 5min`, `gcTime: 10min`, `refetchOnWindowFocus: false`. Hooks are disabled when token is missing (checks `localStorage.getItem('senexpert_token')` in `enabled`).

Query key factory (`src/lib/query/keys.ts`) enables granular cache invalidation:
```ts
queryClient.invalidateQueries({ queryKey: queryKeys.tools.all })      // everything
queryClient.invalidateQueries({ queryKey: queryKeys.tools.list(filters) }) // specific list
```

## Roles (6)

`super_admin` > `admin` > `accountant` > `hr` > `field` > `operator`

Key role-specific behaviors:
- **Operators** see only tools they created in the last 4 hours (`src/app/dashboard/inventory/page.tsx`).
- **Super admins** have user management + audit logs + "View As" mode.
- **Accountants** can only approve/reject financial requests.

## Database — 8 Collections (MongoDB)

| Collection | Key Detail |
|-----------|------------|
| `users` | `password_hash` (bcrypt, 12 rounds) |
| `profiles` | `_id` matches `users._id`, `avatar_url` (base64) |
| `tools` | `quantity: 0` kept in DB (record-keeping); excluded from list views by `{ quantity: { $gt: 0 } }` filter |
| `tool_requests` | `$lookup` resolves `tool_name` |
| `financial_requests` | `$lookup` resolves `requester_name` |
| `maintenance` | Statuses: `scheduled`, `in_progress`, `completed`, `cancelled` |
| `alerts` | Types: `info`, `warning`, `critical`, `success` |
| `audit_logs` | Every mutation logs here |

Indexes: `npm run migrate` / `npx tsx src/scripts/migrateIndexes.ts` creates indexes on `tools:{quantity:1,name:1}`, `tools:{name:1}`, `users:{email:1}` (unique).

## Seed Data

```bash
npx tsx src/scripts/seedAll.ts         # 6 users + inventory + requests
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

## Critical Quirks

### MongoDB
- Prefer non-SRV connection string (`mongodb://...` over `mongodb+srv://...`). SRV lookup flaky on Windows.
- No staging DB — seed scripts write to `MONGODB_URI` (same as production).
- Use `$toString` over `$toObjectId` in `$lookup` pipelines. `$toObjectId` fails silently on invalid ObjectIds (see `ToolRequestRepository.ts`, `FinancialRequestRepository.ts`).

### Rental Workflow
- Approving `transaction_type: 'rented'` **decreases** tool quantity.
- Completing a return (status → `completed` on rented request) **increases** tool quantity, sets status to `available`.
- Cache invalidation on approval/completion touches both `tools.all` and `dashboard.stats`.

### Tools
- Zero-quantity tools stay in DB (record-keeping); hidden from lists by `_buildFilterQuery` filter `{ quantity: { $gt: 0 } }`.
- Seed `tool_requests` have empty `tool_id` — approval won't update qty for seeded records.

### Tailwind CSS v4
- CSS-first config in `src/app/globals.css` `@theme` block. **No `tailwind.config.js`**.
- PostCSS plugin: `@tailwindcss/postcss`. Use `@import "tailwindcss"` syntax.

### Contact Form
- `(public)/contact/` uses a Server Action (`actions.ts`) + `useActionState` — no fetch() call.

## Environment

```env
MONGODB_URI=mongodb://...              # Prefer non-SRV
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.local` is loaded automatically by Next.js (dotenv is a devDependency).
