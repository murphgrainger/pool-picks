# Pool Picks

A golf pool/wagering app. Users create pools for PGA tournaments, invite members, pick athletes, and compete based on real tournament scores scraped from ESPN.

## Tech Stack

- **Monorepo:** Turborepo (packages + apps)
- **Framework:** Next.js 14 (App Router) with TypeScript
- **API:** tRPC (end-to-end type-safe)
- **Database:** PostgreSQL (Supabase) via Prisma
- **Auth:** Supabase Auth (Google OAuth + Email OTP)
- **Styling:** Tailwind CSS
- **Scraping:** Axios + Cheerio (ESPN leaderboard/rankings)

## Project Structure

```
packages/
  db/             # Prisma schema + client
  api/            # tRPC routers + middleware
  utils/          # Scoring, formatting, sorting
  tailwind-config/
  typescript-config/
apps/
  web/            # Next.js App Router
```

## Development

```bash
yarn dev          # Start all apps
yarn build        # Build everything
yarn db:generate  # Regenerate Prisma client
yarn db:migrate   # Create a new migration
```

## Database Migrations

When you change `packages/db/prisma/schema.prisma`:

1. Run `yarn db:migrate` to create and apply a migration locally
2. Run `yarn db:generate` to update the Prisma client
3. Commit the migration file
4. Migrations run automatically on deploy via `prisma migrate deploy`

## Deployment

Merging a PR to the `production` branch triggers a Vercel deploy. The build runs migrations automatically before building the app.
