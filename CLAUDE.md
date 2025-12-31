# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kniferoll is a kitchen prep management PWA for professional chefs. It allows kitchens to manage prep lists across stations with real-time collaboration.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite (in `apps/web/`)
- **Backend:** Supabase (Postgres, Auth, Realtime, RLS)
- **Styling:** Tailwind CSS
- **State:** Zustand stores + React Query for server state
- **Routing:** React Router DOM (SPA)
- **Monorepo:** pnpm + Turborepo
- **Testing:** Vitest + React Testing Library

## Commands

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build all packages
pnpm lint         # Run ESLint across workspace

# Testing
pnpm test         # Run all tests
pnpm test:watch   # Run tests in watch mode
pnpm test:perf    # Run performance budget tests only
pnpm test:ci      # Run tests with verbose output (CI)

# Supabase
supabase start                                              # Start local Supabase
supabase db reset                                           # Reset database with migrations
supabase gen types typescript --local > apps/web/src/types/database.ts  # Regenerate types
```

## Testing

Uses **Vitest + React Testing Library**. RTL is framework-agnostic and works with Vitest.

### Test File Location Rules

**Component tests are colocated** with source files:
```
src/components/ui/Button.tsx
src/components/ui/Button.test.tsx    ← colocated
src/hooks/useKitchens.ts
src/hooks/useKitchens.test.ts        ← colocated
```

**Non-component tests** go in `src/test/` with structure mirroring source:
```
src/test/
├── utils/                    # Shared test utilities (setup, providers, helpers)
├── integration/              # Cross-component, page-level, and performance tests
└── unit/                     # Unit tests for lib/, stores/, and other non-component code
    ├── lib/                  # Tests for src/lib/*.ts
    │   ├── auth.test.ts
    │   ├── dateUtils.test.ts
    │   └── entitlements.test.ts
    ├── stores/               # Tests for src/stores/*.ts
    │   ├── authStore.test.ts
    │   └── kitchenStore.test.ts
    └── hooks/                # Tests for hooks that are hard to colocate
```

**Rules:**
- Component/hook tests: colocate as `ComponentName.test.tsx` next to source
- Pure utility functions (`lib/`): place in `test/unit/lib/`
- Zustand stores: place in `test/unit/stores/`
- Integration/performance tests: place in `test/integration/`
- Never put loose test files directly in `test/unit/` - always use subdirectories

### Performance Budget Tests

The project enforces render budgets to prevent performance regressions. Tests are in `apps/web/src/test/integration/`.

**Before submitting frontend changes:**

1. Run `pnpm test:perf` to verify render budgets pass
2. If adding a new page, add an entry to `src/test/integration/budgets.ts`
3. If a budget test fails, use React DevTools Profiler to identify unnecessary re-renders

**Budget coverage is enforced** - all pages in `src/pages/` must have a corresponding budget entry (except static pages like PrivacyPolicy/TermsOfService which are excluded).

## React App Architecture (apps/web/src/)

### SPA Routing Structure
Routes are defined in `App.tsx` using React Router with two layout groups:
- **PublicLayout** - Landing, Login, Signup, InviteJoin, legal pages (marketing header/footer)
- **AppLayout** - Dashboard, KitchenDashboard, StationView, KitchenSettings (requires auth, app header)

All pages are lazy-loaded for code splitting.

### Layout System
- `layouts/LayoutShell.tsx` - Base visual shell (backgrounds, fonts, header rendering)
- `layouts/AppLayout.tsx` - Auth-protected routes, wraps with HeaderProvider
- `layouts/PublicLayout.tsx` - Public routes with marketing header/footer
- Pages customize their header via `useHeaderConfig` hook without unmounting

### Component Organization
Components are organized by domain in `components/`:
- `ui/` - Primitives: Button, Card, Modal, Alert, FormInput, Tabs, EmptyState, etc.
- `layout/` - PageHeader, Logo, NavLinks, BackButton, SectionHeader, etc.
- `cards/` - Domain-specific card components
- `modals/` - Modal dialogs
- `kitchen/` - Kitchen-specific components
- `prep/` - Prep item components
- `auth/` - Authentication components
- `icons/` - Icon components
- `settings/` - Settings UI components

All components are barrel-exported from `components/index.ts` for clean imports.

### State Management
- `stores/` - Zustand stores for client state (authStore, kitchenStore, prepStore, prepEntryStore, offlineStore)
- `hooks/` - Data-fetching hooks (useKitchens, useStations, usePrepItems, etc.)
- `context/` - React context for UI state (HeaderContext, DarkModeContext)

Realtime subscriptions: `useRealtimePrepItems`, `useRealtimeStations`, `useRealtimeMembers`

### Key Files
- `lib/supabase.ts` - Supabase client
- `lib/sentry.ts` - Sentry error tracking and performance monitoring
- `lib/entitlements.ts` - Plan-based feature checks
- `types/database.ts` - Generated Supabase types (never edit manually)

## Sentry Error Tracking

The app uses Sentry for error tracking and performance monitoring. Key patterns:

### Capturing Errors
Use `Sentry.captureException(error)` in try-catch blocks:
```typescript
import { captureError } from "@/lib";

try {
  await riskyOperation();
} catch (error) {
  captureError(error as Error, { context: "additional info" });
}
```

### Performance Spans
Create spans for meaningful actions (button clicks, API calls, function calls):
```typescript
import * as Sentry from "@sentry/react";

// For async operations like Supabase queries
async function fetchPrepItems(stationId: string) {
  return Sentry.startSpan(
    { name: "fetchPrepItems", op: "db.query" },
    async () => {
      const { data } = await supabase
        .from("prep_items")
        .select("*")
        .eq("station_id", stationId);
      return data;
    }
  );
}

// For UI interactions
function handleClick() {
  Sentry.startSpan(
    { op: "ui.click", name: "Save Button Click" },
    (span) => {
      span.setAttribute("itemCount", items.length);
      doSomething();
    }
  );
}
```

### Environment Variables
- `VITE_SENTRY_DSN` - Sentry DSN (set in Vercel, not committed)
- `VITE_SENTRY_ENV` - Environment name (production/staging)
- `SENTRY_AUTH_TOKEN` - For source map uploads (Vercel env only)

## Data Model

### Key Tables
- `user_profiles` - extends `auth.users`, holds `plan` (free/pro)
- `anonymous_users` - device-token based users
- `kitchens` - always owned by registered user
- `kitchen_members` - unified membership (has `user_id` XOR `anonymous_user_id`)
- `invite_links` - magic links with expiry (no permanent join codes)
- `stations` - belong to kitchen
- `prep_items` - belong to station

### User Types
- **Registered (free):** 1 kitchen, 1 station, no invites
- **Registered (pro):** 5 kitchens, unlimited stations, can invite
- **Anonymous:** Device-token based, join only via invite link

## Supabase Rules

- All schema changes MUST go in `supabase/migrations/` as timestamped SQL files
- NEVER modify schema directly in Supabase dashboard
- Create new migrations with: `supabase migration new <name>` (generates timestamped file)
- After schema changes: run `supabase db reset`, then regenerate types
- Regenerate types: `supabase gen types typescript --local > packages/types/src/database.ts`
- RLS is mandatory - policies derive from `kitchen_members` membership
- Use `getUserLimits()` from entitlements.ts, never hardcode plan limits
- Migrations auto-deploy to prod when merged to main (via GitHub Actions)

## Code Patterns

- Use generated types from `types/database.ts` for all Supabase queries
- Prefer `async/await` over `.then()` chains
- Import components from barrel exports (`@/components`, `@/hooks`, `@/stores`)
- New UI primitives go in `components/ui/`, domain components in their subdirectory
- Memoize derived state with `useMemo` and callbacks with `useCallback` to prevent render cascades
- Batch related state updates to minimize re-renders
- Do not reference deprecated tables: `session_users`, `user_kitchens`
- Do not use `join_code` on kitchens - use invite links only

## Verification Checklist

Before completing frontend work:

1. **Lint:** `pnpm lint` passes
2. **Build:** `pnpm build` succeeds
3. **Tests:** `pnpm test` passes (includes perf budgets)
4. **Manual:** Test the affected user flows in browser

## Mockups

When prototyping UI changes, create isolated HTML/CSS/JS mockups in `mockups/` directory. These can be opened directly in a browser for review before integration.

## Creating Pull Requests

Use `gh pr create` to create PRs. The repo has a PR template at `.github/pull_request_template.md` that will be used automatically.

```bash
gh pr create --title "Brief description of changes"
```

The PR body should follow the template structure:
- **What does this PR do?** - Brief description
- **Type of change** - Check the appropriate box (Bug fix, New feature, Refactor, Documentation, Other)
- **Checklist** - Verify all items pass before creating PR
- **Screenshots** - Include if UI changes were made

GitHub will auto-populate the template. Fill in the sections and check the boxes that apply.