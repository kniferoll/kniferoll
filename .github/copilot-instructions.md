# Kniferoll - Repository Instructions

## Project Overview

Kniferoll is a kitchen prep management PWA for professional chefs. It allows kitchens to manage prep lists across stations with real-time collaboration.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (Postgres, Auth, Realtime, RLS)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (or similar)

## Supabase Rules

- All schema changes MUST go in `supabase/migrations/` as timestamped SQL files
- NEVER modify schema directly in Supabase dashboard
- After any schema change, regenerate types: `supabase gen types typescript --local > src/types/database.ts`
- Use local dev with `supabase start`, not the remote project
- Database types in `src/types/database.ts` are generated—do not edit manually

## Data Model Principles

- Users have plans (`free` | `pro`), kitchens inherit capabilities from their owner
- `kitchen_members` is the core membership table—handles both registered and anonymous users
- Anonymous users have `anonymous_user_id`, registered users have `user_id`—never both
- Invite links are the only way to join a kitchen—no permanent join codes
- RLS policies all derive from `kitchen_members` membership checks

## Code Patterns

- Use generated types from `src/types/database.ts` for all Supabase queries
- Entitlement checks go through `src/lib/entitlements.ts`
- Supabase client initialized in `src/lib/supabase.ts`
- React hooks for data access live in `src/hooks/`
- Prefer `async/await` over `.then()` chains

## Do Not

- Create manual type definitions for database tables
- Use the old schema patterns (`session_users`, `user_kitchens`, `join_code`)
- Hardcode plan limits—use `getUserLimits()` helper
- Skip RLS—every table must have appropriate policies
- Create markdown summaries of what you have done
