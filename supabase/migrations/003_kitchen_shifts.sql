-- Kitchen Shifts Configuration
-- Allows kitchens to define custom shifts and day-specific overrides

-- ============================================================================
-- KITCHEN SHIFTS TABLE
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
  -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  is_open boolean not null default true,
  shift_ids uuid[] default array[]::uuid[],
  -- array of kitchen_shifts.id that apply to this day
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (kitchen_id, day_of_week)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_kitchen_shifts_kitchen on kitchen_shifts(kitchen_id);
create index idx_kitchen_shift_days_kitchen on kitchen_shift_days(kitchen_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create trigger kitchen_shifts_updated before update on kitchen_shifts
  for each row execute function update_updated_at();

create trigger kitchen_shift_days_updated before update on kitchen_shift_days
  for each row execute function update_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

alter table kitchen_shifts enable row level security;
alter table kitchen_shift_days enable row level security;

create policy "Members can view kitchen shifts"
  on kitchen_shifts for select
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shifts.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Owner/admin can manage kitchen shifts"
  on kitchen_shifts for all
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shifts.kitchen_id
      and kitchen_members.user_id = auth.uid()
      and kitchen_members.role in ('owner', 'admin')
    )
  );

create policy "Members can view kitchen shift days"
  on kitchen_shift_days for select
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shift_days.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Owner/admin can manage kitchen shift days"
  on kitchen_shift_days for all
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_shift_days.kitchen_id
      and kitchen_members.user_id = auth.uid()
      and kitchen_members.role in ('owner', 'admin')
    )
  );

-- ============================================================================
-- REALTIME
-- ============================================================================

alter publication supabase_realtime add table kitchen_shifts;
alter publication supabase_realtime add table kitchen_shift_days;
