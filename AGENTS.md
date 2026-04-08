# AGENTS.md - SenExpert Global

## Quick Start
```bash
npm install
npm run dev     # Development server on http://localhost:3000
npm run build   # Production build
```

## Tech Stack
- Next.js 16 (App Router) with Turbopack
- React 19
- Tailwind CSS v4 (CSS-first config in `globals.css`)
- Framer Motion (animations, sidebar active indicator)
- Supabase (Auth + Database)
- Lucide React (Icons)

## Directory Ownership
- `src/app/` - Next.js pages (App Router)
  - `dashboard/` - Protected routes (require auth, redirect to `/login`)
  - `login/` - Login page
  - `page.tsx` - Public landing page (Hero, About, Services, etc.)
- `src/components/dashboard/` - Dashboard UI components (Sidebar, Topbar, StatusBadge, etc.)
- `src/components/layout/` - Navbar, Footer for public pages
- `src/components/sections/` - Page sections (Hero, About, Services, etc.)
- `src/lib/supabase.ts` - Supabase client and types
- `src/services/authService.ts` - Authentication logic
- `src/data/mockData.ts` - Mock data for dashboard (tools, requests, users, alerts)

## Supabase Setup
- Project URL: `https://racothutguedvekxmxqc.supabase.co`
- Config in `.env.local` - DO NOT commit credentials
- Database has RLS enabled on `profiles` table
- Test users: `superadmin@test.com`, `admin@test.com`, `hr@test.com`, `manager@test.com` (password: `Test@123`)

## Development Notes

### Responsive Breakpoints
- **Sidebar**: < 768px slides in from left (mobile), >= 768px fixed (desktop: 256px expanded, 80px collapsed)
- **Topbar**: < 1024px shows icons on left (Search, Bell, Profile, Menu), >= 1024px shows search bar + right section

### Sidebar Active State
- Uses Framer Motion `layoutId="activeIndicator"` for animated left indicator
- Logic: exact match for `/dashboard`, `startsWith` for sub-routes
- CSS `.active` class available in `globals.css` as backup

### Mobile Dropdowns
- Notification & Profile dropdowns use `w-[calc(100vw-1rem)] max-w-sm` to fit screen width
- Only one dropdown open at a time on mobile

### Inventory Table Columns
Tool Name | Serial Number | Size/Thread | Material | Model | Part Number | Category | Quantity | Status | Location

### Tool Movement Request Form
- Label: "Tool Movement Request" (not "Tool Request")
- Movement Type dropdown: "Incoming" or "Outgoing"
- Tool selector shows: Name, Size/Thread, Serial Number, Location

## Common Issues
- **Login failing**: Check RLS policies on `profiles` table in Supabase dashboard
- **Profile creation error**: May need to disable/re-enable RLS or check for policy recursion
- **TypeScript errors**: Run `npx tsc --noEmit` to check

## Scripts
- `npm run dev` - Dev with Turbopack
- `npm run lint` - ESLint check
- `npm run build` - Production build