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
- React 19 + Tailwind CSS v4 (CSS-first config)
- Framer Motion (animations)
- MongoDB (Atlas) - Database & Authentication
- JWT Authentication (custom implementation)
- Lucide React (Icons)

## Database (MongoDB)

### Collections
- `users` - User accounts with password_hash
- `profiles` - User profiles with roles and avatar_url
- `tools` - Tool inventory
- `tool_requests` - Tool movement requests
- `financial_requests` - Financial requests
- `maintenance` - Tool maintenance scheduling
- `alerts` - System alerts
- `audit_logs` - All CRUD operations logged

### Environment Variables (.env.local)
```
MONGODB_URI=mongodb+srv://testuser:Test1234@emma1.tmb1awh.mongodb.net/?appName=Emma1
JWT_SECRET=senexpert-jwt-secret-key-2024-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Roles (Current)

| Role | Dashboard | Inventory | Requests | Financial | Approve |
|------|-----------|------------|----------|-----------|----------|
| **super_admin** | ✅ | ✅ | ✅ | ✅ Send+Approve | ✅ |
| **admin** | ✅ | ✅ | ✅ | ✅ Send | ❌ |
| **accountant** | ✅ | ❌ | ❌ | ✅ | ✅ Approve |
| **hr** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **field** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **operator** | ✅ | ✅ View+Add | ✅ Send | ✅ Send | ❌ |

## Test Users
- `superadmin@test.com` / `Test@123` - Super Admin
- `admin@test.com` / `Test@123` - Admin
- `accountant@test.com` / `Test@123` - Accountant
- `hr@test.com` / `Test@123` - HR
- `field@test.com` / `Test@123` - Field
- `operator@test.com` / `Test@123` - Operator

## Key Features

### Avatar Storage
- Avatars are stored in MongoDB (not localStorage - 5MB limit)
- Fetches from API on dashboard load

### View As Mode
- Super admin can switch to any role to test permissions

## Common Issues
- **Login quota exceeded**: Avatar too large - avatar_url stripped from localStorage
- **Profile null error**: Use localStorage or API to get profile data safely

## Workflow
- Commit and push after every change to GitHub
- Branch: `main`