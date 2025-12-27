# Kniferoll Agent Instructions

## Context

You are working on Kniferoll, a kitchen prep management PWA. The project is in active refactor to properly use Supabase.

## Critical Rules

1. **Supabase is the backend.** No custom API routes unless absolutely necessary.
2. **Types are generated.** Run `supabase gen types typescript --local > src/types/database.ts` after schema changes. Never manually define database types.
3. **RLS is mandatory.** Every table has row-level security. Policies derive from `kitchen_members` table.
4. **Migrations only.** Schema changes go in `supabase/migrations/`. Never raw SQL in code or dashboard modifications.

## User Model

Three user types:

- **Registered (free):** 1 kitchen, 1 station, no invites
- **Registered (pro):** 5 kitchens, unlimited stations, can invite
- **Anonymous:** Device-token based, join only via invite link

Plan lives on the user (`user_profiles.plan`), not the kitchen.

## Key Tables

- `user_profiles` — extends `auth.users`, holds plan/subscription
- `anonymous_users` — device-token based users
- `kitchens` — always has registered owner
- `kitchen_members` — unified membership, has `user_id` XOR `anonymous_user_id`
- `invite_links` — magic links with expiry, not permanent codes
- `stations` — belong to kitchen
- `prep_items` — belong to station

## File Locations

- Migrations: `supabase/migrations/`
- Generated types: `src/types/database.ts`
- Supabase client: `src/lib/supabase.ts`
- Entitlement logic: `src/lib/entitlements.ts`
- Data hooks: `src/hooks/`

## When Making Changes

1. If it touches the schema → write a migration, run `supabase db reset`, regenerate types
2. If it touches data access → use generated types, respect RLS
3. If it touches permissions → check entitlements via `getUserLimits()` or membership checks
4. If adding a feature → consider free vs pro tier implications

## Don't

- Reference old tables: `session_users`, `user_kitchens`
- Use `join_code` on kitchens—invite links only
- Skip the type generation step
- Hardcode plan limits
- Create RLS-exempt queries without explicit justification
