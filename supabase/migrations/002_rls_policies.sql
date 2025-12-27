-- Kniferoll RLS Policies
-- All policies derive from kitchen_members table
-- 
-- IMPORTANT: kitchens and kitchen_members must NOT create circular references
-- Pattern: 
--   - kitchens policies use ONLY owner_id checks (no subqueries to kitchen_members)
--   - kitchen_members policies can reference kitchens (one-way dependency)
--   - Other tables reference kitchen_members (which doesn't reference them back)

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

alter table user_profiles enable row level security;
alter table anonymous_users enable row level security;
alter table kitchens enable row level security;
alter table kitchen_members enable row level security;
alter table stations enable row level security;
alter table prep_items enable row level security;
alter table invite_links enable row level security;
alter table kitchen_units enable row level security;
alter table kitchen_item_suggestions enable row level security;

-- ============================================================================
-- USER PROFILES
-- ============================================================================

create policy "Users can view their own profile"
  on user_profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update their own profile"
  on user_profiles for update
  to authenticated
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on user_profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ============================================================================
-- ANONYMOUS USERS
-- ============================================================================

-- Anonymous users table is managed via service role only
-- No direct client access policies needed

-- ============================================================================
-- KITCHENS
-- CRITICAL: Only use owner_id checks here to avoid circular reference with kitchen_members
-- ============================================================================

create policy "Owner can view kitchen"
  on kitchens for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Authenticated users can create kitchens"
  on kitchens for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owner can update kitchen"
  on kitchens for update
  to authenticated
  using (owner_id = auth.uid());

create policy "Owner can delete kitchen"
  on kitchens for delete
  to authenticated
  using (owner_id = auth.uid());

-- ============================================================================
-- KITCHEN MEMBERS
-- Can safely reference kitchens table since kitchens doesn't reference us
-- ============================================================================

-- Users can see their own memberships
create policy "User can view own membership"
  on kitchen_members for select
  to authenticated
  using (user_id = auth.uid());

-- Owner can add members to their kitchens
create policy "Owner can add members"
  on kitchen_members for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchens
      where kitchens.id = kitchen_members.kitchen_id
      and kitchens.owner_id = auth.uid()
    )
  );

-- Owner can update members in their kitchens
create policy "Owner can update members"
  on kitchen_members for update
  to authenticated
  using (
    exists (
      select 1 from kitchens
      where kitchens.id = kitchen_members.kitchen_id
      and kitchens.owner_id = auth.uid()
    )
  );

-- Owner can delete members from their kitchens
create policy "Owner can delete members"
  on kitchen_members for delete
  to authenticated
  using (
    exists (
      select 1 from kitchens
      where kitchens.id = kitchen_members.kitchen_id
      and kitchens.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- STATIONS
-- ============================================================================

create policy "Members can view stations"
  on stations for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = stations.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Owner/admin can manage stations"
  on stations for all
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = stations.kitchen_id
      and kitchen_members.user_id = auth.uid()
      and kitchen_members.role in ('owner', 'admin')
    )
  );

-- ============================================================================
-- PREP ITEMS
-- ============================================================================

create policy "Members can view prep items"
  on prep_items for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_items.station_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Members can manage prep items"
  on prep_items for all
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      join stations on stations.kitchen_id = kitchen_members.kitchen_id
      where stations.id = prep_items.station_id
      and kitchen_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- INVITE LINKS
-- ============================================================================

create policy "Authorized users can create invite links"
  on invite_links for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = invite_links.kitchen_id
      and kitchen_members.user_id = auth.uid()
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
      and kitchen_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- KITCHEN UNITS
-- ============================================================================

create policy "Members can view kitchen units"
  on kitchen_units for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Owner/admin can manage kitchen units"
  on kitchen_units for all
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = auth.uid()
      and kitchen_members.role in ('owner', 'admin')
    )
  );

-- ============================================================================
-- KITCHEN ITEM SUGGESTIONS
-- ============================================================================

create policy "Members can view suggestions"
  on kitchen_item_suggestions for select
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Members can create suggestions"
  on kitchen_item_suggestions for insert
  to authenticated
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Members can update suggestions"
  on kitchen_item_suggestions for update
  to authenticated
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );
