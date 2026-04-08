# AGENTS.md - SenExpert Global

## Quick Start
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Production build
npm run lint    # ESLint check
```

## Tech Stack
- Next.js 16 (App Router) + Turbopack
- React 19 + Tailwind CSS v4 (CSS-first config in `globals.css`)
- Framer Motion (sidebar active indicator animation)
- Supabase (Auth + Database + Storage)
- Lucide React (Icons)

## Database Tables
- `profiles` - User profiles with roles (super_admin, admin, hr, manager, operator)
- `tools` - Inventory with `created_by` column for operator tracking
- `tool_requests` - Tool movement requests (incoming/outgoing)
- `financial_requests` - Manager requests for HR approval
- `maintenance` - Tool maintenance scheduling
- `alerts` - System alerts (linked to tools)
- `audit_logs` - All CRUD operations logged

## Role-Based Access Control

| Feature | super_admin | admin | hr | manager | operator |
|---------|-------------|-------|-----|---------|----------|
| View all inventory | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create inventory | ✅ | ✅ | ❌ | ❌ | ✅ (own tools, 4hrs) |
| Approve tool requests | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve financial requests | ✅ | ✅ | ✅ | ❌ | ❌ |
| Schedule maintenance | ✅ | ✅ | ❌ | ✅ | ❌ |
| Export reports | ✅ | ✅ | ❌ | ✅ | ❌ |
| View Settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ | ❌ |
| View As (test roles) | ✅ | ❌ | ❌ | ❌ | ❌ |

## Key Features

### View As Mode
- Super admin can switch to any role to test permissions
- Topbar shows "Viewing as: [role]" indicator
- Passes both `userRole` (display) and `actualRole` (permissions) to components

### Operator 4-Hour Limit
- Operators can only see tools they added for 4 hours
- After 4 hours, tools become visible to all (super_admin, admin)

### Audit Logging
- All login/logout, CRUD operations logged to `audit_logs` table
- Service: `src/services/authService.ts` and `src/services/toolsService.ts`

### Financial Requests
- Manager submits → HR approves/rejects
- PDF export available in requests page

## Common Issues
- **Login failing**: Check RLS policies on `profiles` table in Supabase dashboard
- **Profile creation error**: May need to disable/re-enable RLS or check for policy recursion
- **TypeScript errors**: Run `npx tsc --noEmit` to check

## Workflow
- Commit and push after every change to GitHub
- Branch: `main`

## Test Users
- `superadmin@test.com`, `admin@test.com`, `hr@test.com`, `manager@test.com`
- Password: `Test@123`

## Supabase
- Project URL: `https://racothutguedvekxmxqc.supabase.co`
- Config in `.env.local` - DO NOT commit
- Storage bucket: `avatars` with RLS policies