-- Kniferoll Complete Schema

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
-- KITCHEN-SPECIFIC UNITS
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
  created_by_user uuid references auth.users(id) on delete set null,
  status_changed_at timestamptz,
  status_changed_by_user uuid references auth.users(id) on delete set null,
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
  start_time time default '00:00',
  end_time time default '23:59',
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
-- INDEXES
-- ============================================================================

create index idx_kitchen_members_kitchen on kitchen_members(kitchen_id);
create index idx_kitchen_members_user on kitchen_members(user_id);
create index idx_kitchens_owner on kitchens(owner_id);
create index idx_stations_kitchen on stations(kitchen_id);
create index idx_prep_items_station_date on prep_items(station_id, shift_date);
create index idx_prep_items_status on prep_items(status);
create index idx_kitchen_units_kitchen on kitchen_units(kitchen_id);
create index idx_invite_links_kitchen on invite_links(kitchen_id);
create index idx_invite_links_token on invite_links(token);
create index idx_suggestions_kitchen on kitchen_item_suggestions(kitchen_id);
create index idx_kitchen_shifts_kitchen on kitchen_shifts(kitchen_id);
create index idx_kitchen_shift_days_kitchen on kitchen_shift_days(kitchen_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
create function update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Check if current user is anonymous
create function is_anonymous_user()
returns boolean as $$
begin
  return (auth.jwt()->>'is_anonymous')::boolean = true;
end;
$$ language plpgsql security definer set search_path = '';

-- Check if current user is registered (non-anonymous)
create function is_registered_user()
returns boolean as $$
begin
  return (auth.jwt()->>'is_anonymous')::boolean is not true;
end;
$$ language plpgsql security definer set search_path = '';

-- Auto-create user profile on signup
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

create trigger kitchen_units_updated before update on kitchen_units
  for each row execute function update_updated_at();

create trigger kitchen_item_suggestions_updated before update on kitchen_item_suggestions
  for each row execute function update_updated_at();

create trigger kitchen_shifts_updated before update on kitchen_shifts
  for each row execute function update_updated_at();

create trigger kitchen_shift_days_updated before update on kitchen_shift_days
  for each row execute function update_updated_at();

create trigger prep_items_updated before update on prep_items
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
alter table kitchen_item_suggestions enable row level security;
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
-- CRITICAL: Only use owner_id checks here to avoid circular reference with kitchen_members
-- Members access kitchens via kitchen_members queries (app layer joins)
-- ============================================================================

create policy "Owner can view kitchen"
  on kitchens for select
  to authenticated
  using (owner_id = (select auth.uid()));

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
-- Can safely reference kitchens table since kitchens doesn't reference us
-- ============================================================================

create policy "User can view own membership"
  on kitchen_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Owner can add members"
  on kitchen_members for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchens
      where kitchens.id = kitchen_members.kitchen_id
      and kitchens.owner_id = (select auth.uid())
    )
  );

create policy "Owner can update members"
  on kitchen_members for update
  to authenticated
  using (
    exists (
      select 1 from kitchens
      where kitchens.id = kitchen_members.kitchen_id
      and kitchens.owner_id = (select auth.uid())
    )
  );

create policy "Owner can delete members"
  on kitchen_members for delete
  to authenticated
  using (
    exists (
      select 1 from kitchens
      where kitchens.id = kitchen_members.kitchen_id
      and kitchens.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES: STATIONS
-- Consolidated: Members can view + manage with role check
-- ============================================================================

create policy "Members and admins can access stations"
  on stations for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = stations.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Owner/admin can manage stations"
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
-- RLS POLICIES: PREP ITEMS
-- Consolidated: Members can view + manage with separate policies
-- ============================================================================

create policy "Members can access prep items"
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
-- RLS POLICIES: INVITE LINKS
-- ============================================================================

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
-- RLS POLICIES: KITCHEN UNITS
-- Consolidated: Members can view + manage with role check
-- ============================================================================

create policy "Members and admins can access kitchen units"
  on kitchen_units for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Owner/admin can manage kitchen units"
  on kitchen_units for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Owner/admin can update kitchen units"
  on kitchen_units for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Owner/admin can delete kitchen units"
  on kitchen_units for delete
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
      and kitchen_members.role in ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: KITCHEN ITEM SUGGESTIONS
-- ============================================================================

create policy "Members can view suggestions"
  on kitchen_item_suggestions for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can create suggestions"
  on kitchen_item_suggestions for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Members can update suggestions"
  on kitchen_item_suggestions for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES: KITCHEN SHIFTS
-- Consolidated: Members can view + manage with role check
-- ============================================================================

create policy "Members and admins can access kitchen shifts"
  on kitchen_shifts for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shifts.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Owner/admin can manage kitchen shifts"
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

create policy "Owner/admin can update kitchen shifts"
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

create policy "Owner/admin can delete kitchen shifts"
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
-- Consolidated: Members can view + manage with role check
-- ============================================================================

create policy "Members and admins can access kitchen shift days"
  on kitchen_shift_days for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shift_days.kitchen_id
      and kitchen_members.user_id = (select auth.uid())
    )
  );

create policy "Owner/admin can manage kitchen shift days"
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

create policy "Owner/admin can update kitchen shift days"
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

create policy "Owner/admin can delete kitchen shift days"
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
-- REALTIME
-- ============================================================================

alter publication supabase_realtime add table prep_items;
alter publication supabase_realtime add table stations;
alter publication supabase_realtime add table kitchen_members;
alter publication supabase_realtime add table kitchen_units;
alter publication supabase_realtime add table kitchen_item_suggestions;
