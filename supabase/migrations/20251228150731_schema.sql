-- ============================================================================
-- KNIFEROLL SCHEMA
-- ============================================================================
--
-- DATA MODEL NOTES:
--
-- Kitchen Items vs Prep Items vs Prep Item Suggestions
-- ----------------------------------------------------
-- These three tables serve distinct purposes:
--
-- 1. kitchen_items: The canonical "thing" (Chives, French Toast Mix, etc.)
--    - One row per unique item per kitchen
--    - Used for autocomplete when adding to any prep list
--    - Case-insensitive unique constraint prevents duplicates
--    - Future: can hold recipe links, notes, default units, etc.
--
-- 2. prep_items: An instance on a specific prep list
--    - "3 nine pans of Chives for Dinner shift on Dec 28 at Garde Manger"
--    - Links to kitchen_items (no denormalized description - always join)
--    - Links to kitchen_shifts (not shift_name text - proper FK)
--    - Has quantity, unit, status, date
--
-- 3. prep_item_suggestions: Station + shift usage statistics
--    - Tracks: "Chives gets added to Garde Manger + Dinner frequently"
--    - Powers the "suggested items" feature (proactive recommendations)
--    - NOT used for autocomplete - that queries kitchen_items directly
--    - Upserted when a prep_item is created (increment use_count, update last_used)
--
-- Why this separation matters:
-- - Autocomplete shows ALL kitchen items regardless of station/shift
-- - Suggestions are contextual: Dinner shift doesn't suggest French Toast Mix
-- - Item metadata (name, recipe, notes) lives in one place, not duplicated
-- - Renaming an item updates everywhere automatically (no drift)
-- - Merging duplicates (chives vs Chives) is straightforward
--
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

create type user_plan as enum ('free', 'pro');
create type subscription_status as enum ('active', 'canceled');
create type member_role as enum ('owner', 'admin', 'member');
create type prep_status as enum ('pending', 'in_progress', 'complete');

-- ============================================================================
-- USER PROFILES (extends auth.users)
-- ============================================================================

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan user_plan not null default 'free',
  stripe_customer_id text,
  subscription_status subscription_status,
  subscription_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Note: display_name is stored in auth.users.raw_user_meta_data
-- Anonymous users are handled via Supabase's built-in signInAnonymously()
-- which creates auth.users with is_anonymous = true

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
-- UNIFIED MEMBERSHIP (all users are in auth.users)
-- ============================================================================

create table kitchen_members (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'member',
  can_invite boolean not null default false,
  joined_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (kitchen_id, user_id)
);

-- ============================================================================
-- INVITE LINKS (magic links, no permanent codes)
-- ============================================================================

create table invite_links (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_by_user uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  max_uses int not null default 1,
  use_count int not null default 0,
  revoked boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- STATIONS
-- ============================================================================

create table stations (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  name text not null,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- KITCHEN SHIFTS
-- ============================================================================

create table kitchen_shifts (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  name text not null,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- KITCHEN SHIFT DAYS (per-day configuration)
-- ============================================================================

create table kitchen_shift_days (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6),
  is_open boolean not null default true,
  shift_ids uuid[] default array[]::uuid[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (kitchen_id, day_of_week)
);

-- ============================================================================
-- KITCHEN UNITS (custom units per kitchen)
-- ============================================================================

create table kitchen_units (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  name text not null,
  display_name text,
  category text default 'other',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- KITCHEN ITEMS (canonical items - used for autocomplete)
-- ============================================================================

create table kitchen_items (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references kitchens(id) on delete cascade,
  name text not null,
  default_unit_id uuid references kitchen_units(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Case-insensitive uniqueness via index
create unique index idx_kitchen_items_unique_name 
  on kitchen_items (kitchen_id, lower(name));

-- ============================================================================
-- PREP ITEMS (instances on a prep list)
-- ============================================================================

create table prep_items (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references stations(id) on delete cascade,
  shift_id uuid not null references kitchen_shifts(id) on delete cascade,
  shift_date date not null default current_date,
  kitchen_item_id uuid not null references kitchen_items(id) on delete cascade,
  quantity numeric,
  unit_id uuid references kitchen_units(id) on delete set null,
  quantity_raw text,
  status prep_status not null default 'pending',
  created_by_user uuid references auth.users(id) on delete set null,
  status_changed_at timestamptz,
  status_changed_by_user uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- PREP ITEM SUGGESTIONS (station + shift usage stats for recommendations)
-- ============================================================================

create table prep_item_suggestions (
  id uuid primary key default gen_random_uuid(),
  kitchen_item_id uuid not null references kitchen_items(id) on delete cascade,
  station_id uuid not null references stations(id) on delete cascade,
  shift_id uuid not null references kitchen_shifts(id) on delete cascade,
  use_count int not null default 1,
  last_used timestamptz default now(),
  last_quantity numeric,
  last_unit_id uuid references kitchen_units(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (kitchen_item_id, station_id, shift_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_kitchen_members_kitchen on kitchen_members(kitchen_id);
create index idx_kitchen_members_user on kitchen_members(user_id);
create index idx_kitchens_owner on kitchens(owner_id);
create index idx_stations_kitchen on stations(kitchen_id);
create index idx_kitchen_shifts_kitchen on kitchen_shifts(kitchen_id);
create index idx_kitchen_shift_days_kitchen on kitchen_shift_days(kitchen_id);
create index idx_kitchen_units_kitchen on kitchen_units(kitchen_id);
create index idx_kitchen_items_kitchen on kitchen_items(kitchen_id);
create index idx_kitchen_items_name on kitchen_items(kitchen_id, name);
create index idx_prep_items_station_date on prep_items(station_id, shift_date);
create index idx_prep_items_shift on prep_items(shift_id);
create index idx_prep_items_status on prep_items(status);
create index idx_prep_item_suggestions_lookup on prep_item_suggestions(station_id, shift_id);
create index idx_invite_links_kitchen on invite_links(kitchen_id);
create index idx_invite_links_token on invite_links(token);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

create function update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create function is_anonymous_user()
returns boolean as $$
begin
  return (auth.jwt()->>'is_anonymous')::boolean = true;
end;
$$ language plpgsql security definer set search_path = '';

create function is_registered_user()
returns boolean as $$
begin
  return (auth.jwt()->>'is_anonymous')::boolean is not true;
end;
$$ language plpgsql security definer set search_path = '';

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (id, plan)
  values (new.id, 'free');
  return new;
end;
$$;

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS (bypass RLS for membership checks)
-- ============================================================================

create function is_kitchen_member(p_kitchen_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.kitchen_members
    where public.kitchen_members.kitchen_id = p_kitchen_id
    and public.kitchen_members.user_id = auth.uid()
  );
$$ language sql security definer set search_path = '';

create function is_kitchen_owner(p_kitchen_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.kitchens
    where public.kitchens.id = p_kitchen_id
    and public.kitchens.owner_id = auth.uid()
  );
$$ language sql security definer set search_path = '';

create function is_kitchen_admin_or_owner(p_kitchen_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.kitchen_members
    where public.kitchen_members.kitchen_id = p_kitchen_id
    and public.kitchen_members.user_id = auth.uid()
    and public.kitchen_members.role in ('owner', 'admin')
  );
$$ language sql security definer set search_path = '';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger user_profiles_updated before update on user_profiles
  for each row execute function update_updated_at();

create trigger kitchens_updated before update on kitchens
  for each row execute function update_updated_at();

create trigger kitchen_members_updated before update on kitchen_members
  for each row execute function update_updated_at();

create trigger invite_links_updated before update on invite_links
  for each row execute function update_updated_at();

create trigger stations_updated before update on stations
  for each row execute function update_updated_at();

create trigger kitchen_shifts_updated before update on kitchen_shifts
  for each row execute function update_updated_at();

create trigger kitchen_shift_days_updated before update on kitchen_shift_days
  for each row execute function update_updated_at();

create trigger kitchen_units_updated before update on kitchen_units
  for each row execute function update_updated_at();

create trigger kitchen_items_updated before update on kitchen_items
  for each row execute function update_updated_at();

create trigger prep_items_updated before update on prep_items
  for each row execute function update_updated_at();

create trigger prep_item_suggestions_updated before update on prep_item_suggestions
  for each row execute function update_updated_at();

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

alter table user_profiles enable row level security;
alter table kitchens enable row level security;
alter table kitchen_members enable row level security;
alter table stations enable row level security;
alter table prep_items enable row level security;
alter table invite_links enable row level security;
alter table kitchen_units enable row level security;
alter table kitchen_items enable row level security;
alter table prep_item_suggestions enable row level security;
alter table kitchen_shifts enable row level security;
alter table kitchen_shift_days enable row level security;

-- ============================================================================
-- RLS POLICIES: USER PROFILES
-- ============================================================================

create policy "Users can view their own profile"
  on user_profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile"
  on user_profiles for update
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can insert their own profile"
  on user_profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

-- ============================================================================
-- RLS POLICIES: KITCHENS
-- ============================================================================

create policy "Owner or member can view kitchen"
  on kitchens for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or is_kitchen_member(id)
  );

create policy "Authenticated users can create kitchens"
  on kitchens for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owner can update kitchen"
  on kitchens for update
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owner can delete kitchen"
  on kitchens for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ============================================================================
-- RLS POLICIES: KITCHEN MEMBERS
-- ============================================================================

create policy "User can view own membership"
  on kitchen_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Owner can view all members"
  on kitchen_members for select
  to authenticated
  using (is_kitchen_owner(kitchen_id));

create policy "Owner can add members"
  on kitchen_members for insert
  to authenticated
  with check (is_kitchen_owner(kitchen_id));

create policy "Owner can update members"
  on kitchen_members for update
  to authenticated
  using (is_kitchen_owner(kitchen_id));

create policy "Owner can delete members"
  on kitchen_members for delete
  to authenticated
  using (is_kitchen_owner(kitchen_id));

-- ============================================================================
-- RLS POLICIES: STATIONS
-- ============================================================================

create policy "Members can view stations"
  on stations for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = stations.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Owner/admin can insert stations"
  on stations for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = stations.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Owner/admin can update stations"
  on stations for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = stations.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Owner/admin can delete stations"
  on stations for delete
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = stations.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: KITCHEN SHIFTS
-- ============================================================================

create policy "Members can view shifts"
  on kitchen_shifts for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shifts.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Owner/admin can insert shifts"
  on kitchen_shifts for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shifts.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Owner/admin can update shifts"
  on kitchen_shifts for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shifts.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Owner/admin can delete shifts"
  on kitchen_shifts for delete
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shifts.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: KITCHEN SHIFT DAYS
-- ============================================================================

create policy "Members can view shift days"
  on kitchen_shift_days for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shift_days.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Owner/admin can insert shift days"
  on kitchen_shift_days for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shift_days.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Owner/admin can update shift days"
  on kitchen_shift_days for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shift_days.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Owner/admin can delete shift days"
  on kitchen_shift_days for delete
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shift_days.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: KITCHEN UNITS
-- ============================================================================

create policy "Members can view units"
  on kitchen_units for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can insert units"
  on kitchen_units for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can update units"
  on kitchen_units for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES: KITCHEN ITEMS
-- ============================================================================

create policy "Members can view items"
  on kitchen_items for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_items.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can insert items"
  on kitchen_items for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_items.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can update items"
  on kitchen_items for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_items.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES: PREP ITEMS
-- ============================================================================

create policy "Members can view prep items"
  on prep_items for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_items.station_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can insert prep items"
  on prep_items for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_items.station_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can update prep items"
  on prep_items for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_items.station_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can delete prep items"
  on prep_items for delete
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_items.station_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES: PREP ITEM SUGGESTIONS
-- ============================================================================

create policy "Members can view suggestions"
  on prep_item_suggestions for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_item_suggestions.station_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can insert suggestions"
  on prep_item_suggestions for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_item_suggestions.station_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can update suggestions"
  on prep_item_suggestions for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_item_suggestions.station_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES: INVITE LINKS
-- ============================================================================

create policy "Members can view invite links"
  on invite_links for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = invite_links.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Authorized users can create invite links"
  on invite_links for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = invite_links.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and (kitchen_members.can_invite = true or kitchen_members.role = 'owner')
    )
  );

create policy "Creator or owner can update invite links"
  on invite_links for update
  to authenticated
  using (
    created_by_user = (select auth.uid())
    or exists (
      select 1 from kitchens
      where kitchens.id = invite_links.kitchen_id
      and kitchens.owner_id = (select auth.uid())
    )
  );

create policy "Creator or owner can delete invite links"
  on invite_links for delete
  to authenticated
  using (
    created_by_user = (select auth.uid())
    or exists (
      select 1 from kitchens
      where kitchens.id = invite_links.kitchen_id
      and kitchens.owner_id = (select auth.uid())
    )
  );



-- ============================================================================
-- REALTIME
-- ============================================================================

alter publication supabase_realtime add table prep_items;
alter publication supabase_realtime add table stations;
alter publication supabase_realtime add table kitchen_members;
alter publication supabase_realtime add table kitchen_units;
alter publication supabase_realtime add table kitchen_items;
alter publication supabase_realtime add table prep_item_suggestions;