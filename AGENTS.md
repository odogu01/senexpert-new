# AGENTS.md — SenExpert Global

## Quick Start
```bash
npm install
npm run dev          # Turbopack (may fail on low-RAM Windows — see below)
npm run dev:classic  # next dev --no-turbo — use if Turbopack gives OS error 1455
npm run build
npm run lint         # next lint only (no Prettier/Eslint config outside Next)
```

**Windows paging fix:** `npm run dev:classic` or increase virtual memory ≥ 8 GB.

## Architecture — Two Sites, Same App

| Area | Routes | Providers |
|------|--------|-----------|
| Public website | `(public)/` — `/`, `/about`, `/services`, `/gallery`, `/contact` | None (server components) |
| Dashboard | `/dashboard/*`, `/login` | `QueryProvider` → `AuthProvider` → `DashboardShell` |
| Print pages | `/dashboard/*/print`, `/print/*` | Same as dashboard (`'use client'`) |

**Key consequence:** Adding a new dashboard page goes inside `/dashboard/`. Adding a new public page goes inside `(public)/`. The root layout is bare `<html>`/`<body>` — no providers.

## Provider Architecture (Dashboard Only)

```
dashboard/layout.tsx (server)
  └─ QueryProvider (TanStack)
      └─ AuthProvider (localStorage JWT)
          └─ DashboardShell (client — sidebar, topbar, auth guard)
              └─ children (page content)
```

Public pages get no providers — they're server components with optional client content wrappers.

## Tech Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4** — CSS-first config in `globals.css` `@theme` block. **No** `tailwind.config.js`.
- **Framer Motion** + **Lucide React**
- **MongoDB Atlas** — native `mongodb` driver (no Mongoose/Prisma)
- **JWT + bcryptjs** — custom auth, localStorage sessions (no cookies)
- **@tanstack/react-query** — data fetching hooks

## Client-Side Data Flow

```
Page component
  → useTools(), useProfile(), etc. (src/hooks/api/)
    → TanStack useQuery + queryKeys (src/lib/query/)
      → fetch() to /api/* routes
        → services (src/services/) — server-only
          → repositories (src/services/repositories/) — pure data access
```

All hooks are `'use client'`. Import from `@/hooks/api` barrel.

TanStack defaults: 5 min staleTime, 10 min gcTime, no refetchOnWindowFocus.

Query key factory (`src/lib/query/keys.ts`) enables granular cache invalidation:
```ts
queryClient.invalidateQueries({ queryKey: queryKeys.tools.all })        // all tools
queryClient.invalidateQueries({ queryKey: queryKeys.tools.list(filters) }) // specific list
```

### Available Hooks (barrel at `src/hooks/api/index.ts`)

| Hook | Purpose |
|------|---------|
| `useTools(filters?)` | All tools |
| `useToolsPaginated(filters?)` | Server-paginated tools (`{ data, total }`) |
| `useToolById(id)` | Single tool |
| `useCategories()` | Distinct categories |
| `useCreateTool()`, `useUpdateTool()`, `useDeleteTool()` | Mutations |
| `useToolRequests(filters?)` | Tool requests |
| `useFinancialRequests(filters?)` | Financial requests |
| `useMaintenance(filters?)` | Maintenance records |
| `useAlerts(unreadOnly?)` | Alerts |
| `useRecentActivity(limit?)` | Audit log |
| `useDashboardStats()` | Dashboard stats |
| `useUsers()` | User management (super_admin only) |
| `useProfile()`, `useUpdateProfile()` | Current user profile |
| `useLogin()`, `useLogout()` | Auth |

## Server-Side Services — Critical Rules

**Four locations** use `// @ts-nocheck` and dynamic `import()` to avoid bundling Node modules in the browser:

| Path | Contents |
|------|----------|
| `src/lib/mongodb.ts` | `connectToDatabase()`, `getCollection()` |
| `src/services/authService.ts` | Login, JWT, bcrypt, user CRUD |
| `src/services/toolsService.ts` | Tools, requests, maintenance, stats, audit |
| `src/services/repositories/*` | Data access layer (BaseRepository + domain repos) |

**Never import these in client components.** They dynamically import `mongodb`, `jsonwebtoken`, `bcryptjs`.

**tsconfig excludes:**
```json
"exclude": ["src/scripts/**/*", "src/services/**/*"]
```

## API Routes (`/api/*`)

All routes (except `auth/login`) require `Authorization: Bearer <token>` header.

Every response uses the envelope: `{ success: boolean, data?: T, error?: { message: string } | string }`.

All route files follow the same pattern: extract Bearer token → call service → return JSON.

| Endpoint | Methods | Notes |
|----------|---------|-------|
| `auth/login` | POST | Public |
| `auth/logout` | POST | |
| `auth/refresh` | POST | Token refresh |
| `users` | GET/POST/PATCH/DELETE | Super admin only |
| `profile` | GET/PATCH | Self only |
| `tools` | GET/POST/PATCH/DELETE | `?page=&limit=` for pagination; `?category=`, `?status=`, `?search=`, `?location=`, `?id=`, `?categories=true` |
| `tools/stats` | GET | Dashboard statistics |
| `tool-requests` | GET/POST/PATCH | Status updates |
| `financial-requests` | GET/POST/PATCH | Status updates |
| `maintenance` | GET/POST/PATCH | Status updates |
| `alerts` | GET | |
| `audit-logs` | GET | |

## Auth Model

- **Storage:** localStorage keys: `senexpert_token`, `senexpert_user`, `senexpert_profile`
- **JWT expiry:** 7 days, secret from `JWT_SECRET` env var
- **Avatar:** base64 in MongoDB (not localStorage). Fetched via `GET /api/profile`
- **Sync:** listens for `storage` events (cross-tab) and custom `auth-change` events (same-tab)
- **Logout:** calls `POST /api/auth/logout`, then clears localStorage
- **Token refresh:** automatic every 30 minutes via `POST /api/auth/refresh`

## Routes & Roles

ROLE_PERMISSIONS is duplicated in `authContext.tsx` (client) and `authService.ts` (server). Keep in sync.

| Role | Capabilities |
|------|-------------|
| **super_admin** | Everything + user management + audit logs + "View As" mode |
| **admin** | Tool CRUD, approvals, analytics, calendar, maintenance |
| **accountant** | Financial requests: approve/reject |
| **hr** | Approvals (read), settings |
| **field** | Dashboard only (read) |
| **operator** | View/add tools, make tool/financial requests |

## Database — 8 Collections

| Collection | Key detail |
|-----------|------------|
| `users` | `password_hash` (bcrypt, 12 rounds) |
| `profiles` | `_id` matches `users._id`, `avatar_url` (base64) |
| `tools` | Setting `quantity: 0` **deletes the document** |
| `tool_requests` | Uses `$lookup` to resolve `tool_name` |
| `financial_requests` | Uses `$lookup` to resolve `requester_name` |
| `maintenance` | Statuses: `scheduled`, `in_progress`, `completed`, `cancelled` |
| `alerts` | Types: `info`, `warning`, `critical`, `success` |
| `audit_logs` | Every mutation logs here |

MongoDB indexes (created by `npx tsx src/scripts/migrateIndexes.ts`):
- `tools: { quantity: 1, name: 1 }` — covers paginated query
- `tools: { name: 1 }` — covers `$regex` search
- `users: { email: 1 }` (unique) — login lookup

## Key Quirks

- **Repository layer** (`src/services/repositories/*`): All repos extend `BaseRepository` which handles `_id → id` mapping automatically. Domain repos extend with named query methods.
- **Aggregation for display names:** Follow the pattern in `toolsService.ts` — `$lookup` → `$addFields` with `$let/$cond` → `$project` to remove temp field.
- **Tool auto-delete:** `updateTool()` deletes the document when `quantity` ≤ 0.
- **Operator visibility:** Operators only see tools they created in the last 4 hours (`src/app/dashboard/inventory/page.tsx`).
- **Server-side pagination:** Inventory main table uses `useToolsPaginated()` — search/status/category/location filters sent as API params. Default 10 per page. Receiving history still loads all tools (background).
- **Public page pattern:** Server Component shell (exports metadata) + `'use client'` content wrapper for animations/interactivity. Gallery uses ISR (`revalidate: 3600`).
- **Contact form:** Uses Server Action (`actions.ts`) + `useActionState` — no client fetch.
- **Path alias:** `@/*` → `src/*`
- **No test setup exists** in this repo — no Jest, no Playwright.

## Seed Data

```
npx tsx src/scripts/seedAll.ts   # creates 6 test users + inventory + requests
npx tsx src/scripts/seedUsers.ts # creates test users only
npx tsx src/scripts/migrateIndexes.ts  # creates MongoDB indexes
```

Seed scripts write directly to the current `MONGODB_URI` database (same as production). There is no separate staging database — seeds and dashboard writes go to the same collections.

### Test Users
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
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
