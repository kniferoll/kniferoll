---
applyTo: "supabase/**"
---

# Supabase Migration Instructions

## Writing Migrations

- Each migration is a single SQL file with timestamp prefix: `YYYYMMDDHHMMSS_description.sql`
- Migrations must be idempotent where possible
- Use enums for constrained string types: `user_plan`, `subscription_status`, `member_role`, `prep_status`
- All tables must have `enable row level security`
- All FKs should specify `on delete cascade` or `on delete set null` explicitly

## RLS Policy Pattern

All policies derive from `kitchen_members`:

```sql
-- Standard membership check
exists (
  select 1 from kitchen_members
  where kitchen_members.kitchen_id = <table>.kitchen_id
  and kitchen_members.user_id = auth.uid()
)
```

For tables nested under stations (like `prep_items`), join through stations:

```sql
exists (
  select 1 from kitchen_members
  join stations on stations.kitchen_id = kitchen_members.kitchen_id
  where stations.id = prep_items.station_id
  and kitchen_members.user_id = auth.uid()
)
```

## Enums

```sql
create type user_plan as enum ('free', 'pro');
create type subscription_status as enum ('active', 'canceled', 'past_due');
create type member_role as enum ('owner', 'admin', 'member');
create type prep_status as enum ('pending', 'partial', 'complete');
```

## Anonymous Users

Anonymous users don't have `auth.uid()`. Handle via:

- Supabase anonymous auth (`signInAnonymously()`), or
- Service role with app-layer validation
