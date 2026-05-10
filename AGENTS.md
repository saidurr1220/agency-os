<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AgencyOS - Agent Instructions

## Project Overview
AgencyOS is a multi-tenant SaaS Agency Operating System for digital agencies. Built with Next.js App Router, Prisma, PostgreSQL (Neon), and Better Auth.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: Better Auth (JWT + sessions)
- **State**: Zustand (UI state) + React Query (server state)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Charts**: recharts
- **Animations**: framer-motion

## Key Commands
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npx prisma db push` - Sync schema to database
- `npx prisma migrate dev` - Create migration
- `npx prisma studio` - Open Prisma Studio
- `npx prisma generate` - Generate Prisma Client

## Project Structure
```
src/
  app/          - Next.js App Router pages & API routes
  components/   - Shared UI components
  config/       - App constants
  lib/          - Core utilities (prisma.ts, auth.ts, auth-client.ts)
  store/        - Zustand stores
  types/        - TypeScript interfaces
  providers/    - React context providers
```

## Auth Architecture
- Server: `src/lib/auth.ts` - Better Auth config with Prisma adapter
- Client: `src/lib/auth-client.ts` - React client for auth
- API: `src/app/api/auth/[...all]/route.ts` - Catch-all auth handler
- Middleware: `src/proxy.ts` - Route protection (Next.js 16 renamed middleware → proxy)

## Database
- Schema: `prisma/schema.prisma`
- Client singleton: `src/lib/prisma.ts`
- Always scope queries by `companyId` for multi-tenancy

## Conventions
- Use `"use client"` directive for client components
- Import from `@/` alias (maps to `src/`)
- Use shadcn/ui components from `@/components/ui/`
- Use Zustand for UI state, not server data
- All API routes should validate auth session
