# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pool Picks is a golf pool/wagering application. Users create pools for PGA tournaments, invite members, pick athletes, and compete based on real tournament scores scraped from ESPN.

## Tech Stack

- **Framework:** Next.js 13 (Pages Router) with TypeScript
- **API:** GraphQL (GraphQL Yoga + Apollo Client)
- **Database:** PostgreSQL (Supabase) via Prisma ORM
- **Auth:** NextAuth.js (Google OAuth + Email/SMTP)
- **Styling:** Tailwind CSS with custom golf-themed color palette
- **Scraping:** Axios + Cheerio (ESPN leaderboard/rankings data)

## Commands

- `yarn dev` — Start development server
- `yarn build` — Generate Prisma client and build Next.js (`prisma generate && next build`)
- `npx prisma db push` — Push schema changes to local database
- `npx prisma generate` — Regenerate Prisma client after schema changes
- `npx prisma migrate dev --name <name>` — Create a migration (use with production DATABASE_URL)
- `npx prisma studio` — Open Prisma database browser

No test runner is configured.

## Architecture

### Data Flow
Pages use `getServerSideProps` for initial data fetching with Prisma directly. Client-side updates use Apollo Client mutations against the `/api/graphql` endpoint. No centralized state management — relies on SSR props, local React state, and Apollo cache.

### Key Directories
- `pages/` — Next.js pages and API routes (Pages Router)
- `graphql/` — Schema (`schema.ts`), resolvers (`resolvers/queries.ts`, `resolvers/mutations.ts`, `resolvers/models.ts`), and context
- `prisma/` — Schema definition (`schema.prisma`), migrations, and seed script (`seed.ts`)
- `components/` — React components (no sub-directory organization)
- `lib/` — Prisma client singleton (`prisma.ts`) with retry logic, Apollo client config (`apollo.ts`)
- `utils/utils.ts` — Scoring calculations (`sumMemberPicks`, `formatToPar`, `calculateMemberPosition`), date formatting, pool member sorting
- `data/` — Seed data files (athletes, tournaments, pools, invites)

### API Layer
- **GraphQL endpoint:** `pages/api/graphql.ts` using GraphQL Yoga
- **Scrape endpoints:** `pages/api/scrape/rankings.ts`, `pages/api/scrape/tournaments/[id]/athletes.ts`, `pages/api/scrape/tournaments/[id]/scores.ts` (admin-only, hit ESPN)

### Database
- Two connection URLs: `DATABASE_URL` (pooled via pgbouncer) for queries, `DIRECT_URL` for migrations
- Prisma client (`lib/prisma.ts`) uses a singleton pattern in dev and includes connection retry logic with middleware
- Seed with `npx prisma db seed` (runs `ts-node --transpile-only prisma/seed.ts`)

### Domain Model
- **Tournament** → has many **Athletes** (via `AthletesInTournaments` join table with scores)
- **Pool** → belongs to a **Tournament**, has many **PoolMembers** and **PoolInvites**
- **PoolMember** → belongs to a **User** and a **Pool**, picks **Athletes** (via `PoolMembersAthletes`)
- Pool lifecycle: Setup → Open → Locked → Complete
- Scoring: best 4 of a member's picks are summed (`sumMemberPicks` in `utils/utils.ts`)

### Authentication
- NextAuth with PrismaAdapter; sign-in restricted to emails on the `BetaList` table
- User roles: `USER` and `ADMIN` (enum in Prisma schema)
- Admin checks in both `getServerSideProps` and component rendering
