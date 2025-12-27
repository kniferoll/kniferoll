-- Kniferoll RLS Policies
-- All policies derive from kitchen_members table

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
  using (id = auth.uid());

create policy "Users can update their own profile"
  on user_profiles for update
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on user_profiles for insert
  with check (id = auth.uid());

-- ============================================================================
-- ANONYMOUS USERS
-- ============================================================================

-- Anonymous users table is read-only from client perspective
-- Inserts/updates happen via service role only

-- ============================================================================
-- KITCHENS
-- ============================================================================

create policy "Members can view kitchen"
  on kitchens for select
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchens.id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Owner can update kitchen"
  on kitchens for update
  using (owner_id = auth.uid());

create policy "Owner can delete kitchen"
  on kitchens for delete
  using (owner_id = auth.uid());

create policy "Authenticated users can create kitchens"
  on kitchens for insert
  with check (owner_id = auth.uid());

-- ============================================================================
-- KITCHEN MEMBERS
-- ============================================================================

create policy "Members can view membership"
  on kitchen_members for select
  using (
    exists (
      select 1 from kitchen_members as my_membership
      where my_membership.kitchen_id = kitchen_members.kitchen_id
      and my_membership.user_id = auth.uid()
    )
  );

create policy "Owner/admin can manage members"
  on kitchen_members for all
  using (
    exists (
      select 1 from kitchen_members as my_membership
      where my_membership.kitchen_id = kitchen_members.kitchen_id
      and my_membership.user_id = auth.uid()
      and my_membership.role in ('owner', 'admin')
    )
  );

-- ============================================================================
-- STATIONS
-- ============================================================================

create policy "Members can view stations"
  on stations for select
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = stations.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Owner/admin can manage stations"
  on stations for all
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
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_units.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Owner/admin can manage kitchen units"
  on kitchen_units for all
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
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Members can create suggestions"
  on kitchen_item_suggestions for insert
  with check (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );

create policy "Members can update suggestions"
  on kitchen_item_suggestions for update
  using (
    exists (
      select 1 from kitchen_members
      where kitchen_members.kitchen_id = kitchen_item_suggestions.kitchen_id
      and kitchen_members.user_id = auth.uid()
    )
  );
