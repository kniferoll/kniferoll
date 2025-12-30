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

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build all packages
pnpm lint         # Run ESLint across workspace

# Supabase
supabase start                                              # Start local Supabase
supabase db reset                                           # Reset database with migrations
supabase gen types typescript --local > apps/web/src/types/database.ts  # Regenerate types
```

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
- `stores/` - Zustand stores for client state (authStore, kitchenStore, prepStore, offlineStore)
- `hooks/` - Data-fetching hooks (useKitchens, useStations, usePrepItems, etc.)
- `context/` - React context for UI state (HeaderContext, DarkModeContext)

Realtime subscriptions: `useRealtimePrepItems`, `useRealtimeStations`, `useRealtimeMembers`

### Key Files
- `lib/supabase.ts` - Supabase client
- `lib/entitlements.ts` - Plan-based feature checks
- `types/database.ts` - Generated Supabase types (never edit manually)

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
- After schema changes: run `supabase db reset`, then regenerate types
- RLS is mandatory - policies derive from `kitchen_members` membership
- Use `getUserLimits()` from entitlements.ts, never hardcode plan limits

## Code Patterns

- Use generated types from `types/database.ts` for all Supabase queries
- Prefer `async/await` over `.then()` chains
- Import components from barrel exports (`@/components`, `@/hooks`, `@/stores`)
- New UI primitives go in `components/ui/`, domain components in their subdirectory
- Do not reference deprecated tables: `session_users`, `user_kitchens`
- Do not use `join_code` on kitchens - use invite links only

## Mockups

- When asked, create html/css/js mockups in isolation to validate UI/UX changes before integration.
- Insert them into the mockups/ directory so they can be opened in a browser directly and reviewed
