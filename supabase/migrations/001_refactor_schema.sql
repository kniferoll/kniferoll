-- Kniferoll Refactor: Complete Schema
-- This is a clean break from the old implementation
-- All old tables (session_users, user_kitchens, join_code) are removed

-- ============================================================================
-- ENUMS
-- ============================================================================

create type user_plan as enum ('free', 'pro');
create type subscription_status as enum ('active', 'canceled', 'past_due');
create type member_role as enum ('owner', 'admin', 'member');
create type prep_status as enum ('pending', 'partial', 'complete');

-- ============================================================================
-- USER PROFILES (extends auth.users)
-- ============================================================================

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  plan user_plan not null default 'free',
  stripe_customer_id text,
  subscription_status subscription_status,
  subscription_period_end timestamptz,
  created_at timestamptz default now()
);

-- ============================================================================
-- ANONYMOUS USERS (device-based)
-- ============================================================================

create table anonymous_users (
  id uuid primary key default gen_random_uuid(),
  device_token text unique not null,
  display_name text,
  created_at timestamptz default now(),
  last_active_at timestamptz default now()
);

-- ============================================================================
-- KITCHENS (always owned by registered user)
-- ============================================================================

create table kitchens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- UNIFIED MEMBERSHIP
-- ============================================================================

create table kitchen_members (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_user_id uuid references anonymous_users(id) on delete cascade,
  role member_role not null default 'member',
  can_invite boolean not null default false,
  joined_at timestamptz default now(),
  constraint one_user_type check (
    (user_id is not null and anonymous_user_id is null) or
    (user_id is null and anonymous_user_id is not null)
  )
);

-- ============================================================================
-- INVITE LINKS (magic links, no permanent codes)
-- ============================================================================

create table invite_links (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by_user uuid references auth.users(id),
  created_by_anon uuid references anonymous_users(id),
  expires_at timestamptz not null,
  max_uses int not null default 1,
  use_count int not null default 0,
  revoked boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- STATIONS
-- ============================================================================

create table stations (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  name text not null,
  display_order int default 0,
  created_at timestamptz default now()
);

-- ============================================================================
-- KITCHEN-SPECIFIC UNITS
-- ============================================================================

create table kitchen_units (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  name text not null,
  display_name text,
  category text default 'other',
  created_at timestamptz default now()
);

-- ============================================================================
-- PREP ITEMS
-- ============================================================================

create table prep_items (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  shift_date date not null default current_date,
  shift_name text not null,
  description text not null,
  quantity numeric,
  unit_id uuid references kitchen_units(id),
  quantity_raw text,
  status prep_status not null default 'pending',
  created_by_user uuid references auth.users(id),
  created_by_anon uuid references anonymous_users(id),
  status_changed_at timestamptz,
  status_changed_by_user uuid references auth.users(id),
  status_changed_by_anon uuid references anonymous_users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- ITEM SUGGESTIONS (autocomplete)
-- ============================================================================

create table kitchen_item_suggestions (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  description text not null,
  default_unit_id uuid references kitchen_units(id),
  use_count int default 1,
  last_used timestamptz default now(),
  last_quantity_used numeric,
  created_at timestamptz default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_kitchen_members_kitchen on kitchen_members(kitchen_id);
create index idx_kitchen_members_user on kitchen_members(user_id);
create index idx_kitchen_members_anon on kitchen_members(anonymous_user_id);
create index idx_stations_kitchen on stations(kitchen_id);
create index idx_prep_items_station_date on prep_items(station_id, shift_date);
create index idx_prep_items_status on prep_items(status);
create index idx_kitchen_units_kitchen on kitchen_units(kitchen_id);
create index idx_invite_links_kitchen on invite_links(kitchen_id);
create index idx_invite_links_token on invite_links(token);
create index idx_suggestions_kitchen on kitchen_item_suggestions(kitchen_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create function update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger kitchens_updated before update on kitchens
  for each row execute function update_updated_at();

create trigger prep_items_updated before update on prep_items
  for each row execute function update_updated_at();

-- ============================================================================
-- REALTIME
-- ============================================================================

alter publication supabase_realtime add table prep_items;
alter publication supabase_realtime add table stations;
alter publication supabase_realtime add table kitchen_members;
