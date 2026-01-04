# Kniferoll

Kitchen prep management PWA for professional chefs. Manage prep lists across stations with real-time collaboration.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (Postgres, Auth, Realtime, RLS)
- **Styling:** Tailwind CSS
- **State:** Zustand + React Query
- **Monorepo:** pnpm + Turborepo

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 8+
- [Docker](https://www.docker.com/) (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start local Supabase

```bash
supabase start
```

This starts Postgres, Auth, Realtime, and other Supabase services in Docker containers.

### 3. Reset database with seed data

```bash
supabase db reset
```

This applies all migrations and seeds a test user.

### 4. Start the dev server

```bash
pnpm dev
```

The app runs at [http://localhost:5173](http://localhost:5173).

## Seeded Test User

After running `supabase db reset`, you can log in with:

| Field    | Value                      |
| -------- | -------------------------- |
| Email    | `e2e-test@kniferoll.app`   |
| Password | `TestPassword123!`         |
| Plan     | Pro                        |

The seeded user has a kitchen ("E2E Test Kitchen") with a station ("Garde Manger").

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Run ESLint

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:perf        # Run performance budget tests

# Supabase
supabase start        # Start local Supabase
supabase stop         # Stop local Supabase
supabase db reset     # Reset DB with migrations + seed
supabase db diff      # Generate migration from schema changes
```

## Project Structure

```
apps/
  web/                # React frontend (Vite)
    src/
      components/     # UI components
      pages/          # Route pages
      hooks/          # Data fetching hooks
      stores/         # Zustand stores
      lib/            # Utilities (Supabase client, Sentry, etc.)
    test/
      e2e/            # Playwright E2E tests
      integration/    # Performance budget tests

supabase/
  migrations/         # Database migrations
  seed.sql            # Test data for local development
```

## Environment Variables

Local development uses `.env.local` which points to local Supabase by default. Key variables:

| Variable                        | Description                    |
| ------------------------------- | ------------------------------ |
| `VITE_SUPABASE_URL`             | Supabase API URL               |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key              |
| `VITE_SENTRY_DSN`               | Sentry DSN (optional locally)  |

## Database Migrations

**Local development:**
1. Make schema changes in Supabase Studio ([http://127.0.0.1:54323](http://127.0.0.1:54323))
2. Generate migration: `supabase db diff -f <migration_name>`
3. Test: `supabase db reset`

**Production:**
Migrations are automatically deployed when PRs merge to `main` (via GitHub Actions).

## Running E2E Tests

E2E tests require local Supabase to be running:

```bash
supabase start
supabase db reset
pnpm test:e2e
```

Tests run against the seeded test user and data.
