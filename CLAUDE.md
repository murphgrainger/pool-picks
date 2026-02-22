# CLAUDE.md

## Project Overview

Pool Picks is a golf pool/wagering application. Users create pools for PGA tournaments, invite members, pick athletes, and compete based on real tournament scores scraped from ESPN.

## Tech Stack

- **Structure:** Turborepo monorepo (packages + apps)
- **Framework:** Next.js 14 (App Router) with TypeScript
- **API:** tRPC (end-to-end type-safe, replaces GraphQL)
- **Database:** PostgreSQL (Supabase) via Prisma 5 ORM
- **Auth:** Supabase Auth (Google OAuth + Email OTP)
- **Styling:** Tailwind CSS with custom golf-themed color palette
- **Scraping:** Axios + Cheerio (ESPN leaderboard/rankings data)
- **Testing:** Vitest (scoring logic + tRPC routers)

## Commands

- `yarn dev` — Start all apps in development (via Turborepo)
- `yarn build` — Build all packages and apps (runs migrations automatically)
- `yarn db:generate` — Regenerate Prisma client
- `yarn db:migrate` — Create a new migration (interactive, dev only)

### From `packages/db/`:
- `npx prisma migrate dev --name <name>` — Create a migration
- `npx prisma generate` — Regenerate Prisma client
- `npx prisma studio` — Open Prisma database browser
- `npx prisma db seed` — Seed database

## Database Migrations

Migrations run automatically on deploy via the web app's build step (`prisma migrate deploy`). You should never need to manually run migrations in production.

**When you change `schema.prisma`:**
1. Edit `packages/db/prisma/schema.prisma`
2. Run `yarn db:migrate` (or `npx prisma migrate dev --name <name>` from `packages/db/`) — this creates a migration file and applies it locally
3. Run `yarn db:generate` to update the Prisma client
4. Commit the migration file in `packages/db/prisma/migrations/`
5. On deploy, `prisma migrate deploy` runs automatically before `next build`

**Do not use `prisma db push` for schema changes** — it doesn't create migration files and leads to drift between environments. Use `prisma migrate dev` instead.

**Environment note:** The root `.env` has `DATABASE_URL` and `DIRECT_URL`. Make sure these point to your **local** Supabase project for development, not production.

## Monorepo Structure

```
pool-picks/
  turbo.json                        # Turborepo config
  package.json                      # Workspace root

  packages/
    db/                             # @pool-picks/db - Prisma schema + client
    api/                            # @pool-picks/api - tRPC routers + middleware
    utils/                          # @pool-picks/utils - Scoring, formatting, sorting
    tailwind-config/                # @pool-picks/tailwind-config - Shared theme
    typescript-config/              # @pool-picks/typescript-config - Shared tsconfigs

  apps/
    web/                            # @pool-picks/web - Next.js 14 App Router
```

## Architecture

### Permission Model

- **Any user** can create a pool. The creator becomes that pool's **Commissioner**.
- **Commissioner** (per-pool role on `PoolMember`): invites members, sets pool status.
- **Member** (per-pool role on `PoolMember`): joins pools, picks athletes, views scores.
- **System Admin** (`is_admin` on `User`): triggers ESPN scrapes, manages tournaments.

### tRPC API Layer (`packages/api/`)

Four auth levels via middleware:
- `publicProcedure` — no auth required
- `protectedProcedure` — any signed-in user
- `commissionerProcedure` — commissioner of the specific pool (checks `pool_id` in input)
- `systemAdminProcedure` — checks `user.is_admin`

Routers: `pool`, `tournament`, `athlete`, `poolInvite`, `poolMember`

### Data Flow

Server Components fetch data via tRPC server caller (`lib/trpc/server.ts`). Client components use tRPC React Query hooks (`lib/trpc/client.ts`) for mutations and client-side queries. Scrape endpoints are App Router route handlers (`app/api/scrape/`).

### Database (`packages/db/`)

- Prisma schema at `packages/db/prisma/schema.prisma`
- Prisma singleton at `packages/db/src/client.ts`
- Two connection URLs: `DATABASE_URL` (pooled) for queries, `DIRECT_URL` for migrations

### Auth (`apps/web/src/lib/supabase/`)

- Supabase Auth with server/client helpers
- Middleware refreshes sessions and redirects unauthenticated users
- Auth callback auto-creates User row on first sign-in

### Domain Model

- **Tournament** → has many **Athletes** (via `AthletesInTournaments`)
- **Pool** → belongs to a **Tournament**, has many **PoolMembers** and **PoolInvites**
- **PoolMember** → belongs to a **User** and a **Pool**, has `role` (COMMISSIONER/MEMBER), picks **Athletes**
- Pool lifecycle: Setup → Open → Locked → Active → Complete
- Scoring: best 4 of a member's 6 picks are summed (`sumMemberPicks` in `packages/utils/`)

### Key Directories (Web App)

- `src/app/` — App Router pages and API routes
- `src/components/ui/` — Shared UI (Spinner, etc.)
- `src/components/layout/` — Header, DevBanner
- `src/components/pool/` — Pool-related components
- `src/components/picks/` — Pick-related components
- `src/lib/supabase/` — Supabase client helpers
- `src/lib/trpc/` — tRPC client, server caller, provider

### Coding Style

- All code should be readable and debuggable by a human
- Server Components by default; `'use client'` only for interactive parts
- Strong preference for readable code over minimalistic abstractions

## Git Workflow

All new work should follow this branching strategy:

1. Pull down the latest from `main`
2. Create a feature branch off of `main` (e.g. `feat/my-feature`, `fix/bug-name`, `chore/cleanup-task`)
3. Do your work on the feature branch
4. When done, submit a PR to `main`

**At the start of a new session**, before beginning any work, prompt the user: **"Pull down main and create a new feature branch?"** — unless we are already mid-session with work in progress on an existing branch.
