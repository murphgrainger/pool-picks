# Pool Picks

A golf pool/wagering app. Users create pools for PGA tournaments, invite members, pick athletes, and compete based on real tournament scores scraped from ESPN.

## Tech Stack

- **Monorepo:** Turborepo (packages + apps)
- **Web:** Next.js 14 (App Router) + TypeScript, deployed to Vercel at `poolpicks.app`
- **Mobile:** Expo SDK 54 + Expo Router 6 (iOS-first; Android in v1.1)
- **API:** tRPC (end-to-end type-safe; same router for web cookies and mobile Bearer tokens)
- **Database:** PostgreSQL (Supabase) via Prisma
- **Auth:** Supabase Auth — Email OTP everywhere, Google OAuth on web + iOS, Apple Sign In on iOS
- **Styling:** Tailwind CSS (web); custom theme constants (mobile)
- **Scraping:** Axios + Cheerio (ESPN leaderboard/rankings)

## Project Structure

```
packages/
  db/                  # Prisma schema + client
  api/                 # tRPC routers + middleware
  utils/               # Scoring, formatting, sorting
  tailwind-config/
  typescript-config/
apps/
  web/                 # Next.js App Router (poolpicks.app)
  mobile/              # Expo iOS app (TestFlight / App Store)
```

## Development

```bash
yarn dev          # Start all apps via Turborepo
yarn build        # Build everything
yarn db:generate  # Regenerate Prisma client
yarn db:migrate   # Create a new migration
```

### Web only

`yarn dev` runs the web app at `http://localhost:3000`. For most web changes, that's all you need.

### Mobile

The mobile app is in `apps/mobile/`. It needs the web app running locally for tRPC, plus a separate Metro process. See [`apps/mobile/README.md`](apps/mobile/README.md) for the full setup — prerequisites, env vars, dev-loop options (Expo Go vs EAS dev client vs simulator), and when a native rebuild is required.

Quick start (after one-time setup is done):

```bash
yarn dev                          # terminal 1: starts web app for tRPC
cd apps/mobile && yarn start      # terminal 2: starts Metro for the dev client
```

Open the EAS dev client on your phone, point it at Metro, and you're in.

## Database Migrations

When you change `packages/db/prisma/schema.prisma`:

1. Run `yarn db:migrate` to create and apply a migration locally
2. Run `yarn db:generate` to update the Prisma client
3. Commit the migration file
4. Migrations run automatically on deploy via `prisma migrate deploy`

## Deployment

Merging a PR to the `production` branch triggers a Vercel deploy. The build runs migrations automatically before building the app.
