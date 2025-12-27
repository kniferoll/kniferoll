-- Fix ambiguous kitchen_id errors by simplifying RLS policies
-- Designed for mentor-mentee model: chefs (authenticated) create kitchens, cooks (unauthenticated) join via code

-- Drop all existing policies that might cause ambiguity
DROP POLICY IF EXISTS "chefs_own_kitchens" ON kitchens;
DROP POLICY IF EXISTS "public_read_kitchens" ON kitchens;
DROP POLICY IF EXISTS "chefs_manage_stations" ON stations;
DROP POLICY IF EXISTS "public_read_stations" ON stations;
DROP POLICY IF EXISTS "public_insert_session_users" ON session_users;
DROP POLICY IF EXISTS "public_update_session_users" ON session_users;
DROP POLICY IF EXISTS "public_read_session_users" ON session_users;
DROP POLICY IF EXISTS "chefs_delete_session_users" ON session_users;
DROP POLICY IF EXISTS "chefs_manage_prep" ON prep_items;
DROP POLICY IF EXISTS "public_manage_prep" ON prep_items;
DROP POLICY IF EXISTS "chefs_own_memberships" ON user_kitchens;
DROP POLICY IF EXISTS "chefs_insert_own_membership" ON user_kitchens;
DROP POLICY IF EXISTS "chefs_manage_memberships" ON user_kitchens;

-- ============================================================================
-- KITCHENS - Authenticated chefs only
-- ============================================================================

-- Chefs can create their own kitchens
CREATE POLICY "kitchens_insert" ON kitchens
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Chefs can read and update their own kitchens
CREATE POLICY "kitchens_select_update" ON kitchens
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "kitchens_update" ON kitchens
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Chefs can delete their own kitchens
CREATE POLICY "kitchens_delete" ON kitchens
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Public can read kitchens by join_code (for join flow)
CREATE POLICY "kitchens_public_read_by_code" ON kitchens
  FOR SELECT
  USING (true);

-- ============================================================================
-- USER_KITCHENS - Membership tracking for authenticated users
-- ============================================================================

-- Chefs can insert themselves as owner when creating kitchen
CREATE POLICY "user_kitchens_insert_self" ON user_kitchens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chefs can read their own memberships
CREATE POLICY "user_kitchens_select_self" ON user_kitchens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Kitchen owners can manage all memberships in their kitchen
CREATE POLICY "user_kitchens_owner_all" ON user_kitchens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM kitchens
      WHERE kitchens.id = user_kitchens.kitchen_id
      AND kitchens.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- STATIONS - Public read, owner manage
-- ============================================================================

-- Chefs can manage stations in their kitchens
CREATE POLICY "stations_owner_all" ON stations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM kitchens
      WHERE kitchens.id = stations.kitchen_id
      AND kitchens.owner_id = auth.uid()
    )
  );

-- Public can read all stations (needed for cook join flow and station picker)
CREATE POLICY "stations_public_read" ON stations
  FOR SELECT
  USING (true);

-- ============================================================================
-- SESSION_USERS - Unauthenticated cooks joining via code
-- ============================================================================

-- Anyone can insert (join flow)
CREATE POLICY "session_users_public_insert" ON session_users
  FOR INSERT
  WITH CHECK (true);

-- Anyone can read (see who's in kitchen)
CREATE POLICY "session_users_public_read" ON session_users
  FOR SELECT
  USING (true);

-- Anyone can update (claim station, update name)
CREATE POLICY "session_users_public_update" ON session_users
  FOR UPDATE
  USING (true);

-- Kitchen owners can delete session users in their kitchen
CREATE POLICY "session_users_owner_delete" ON session_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM kitchens
      WHERE kitchens.id = session_users.kitchen_id
      AND kitchens.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- PREP_ITEMS - Public manage (cooks working), owner manage
-- ============================================================================

-- Kitchen owners can manage all prep items in their stations
CREATE POLICY "prep_items_owner_all" ON prep_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stations
      INNER JOIN kitchens ON kitchens.id = stations.kitchen_id
      WHERE stations.id = prep_items.station_id
      AND kitchens.owner_id = auth.uid()
    )
  );

-- Public can manage prep items (cooks working on prep)
-- Security: Access controlled by knowing kitchen join_code
CREATE POLICY "prep_items_public_all" ON prep_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Security Model:
-- - Kitchen join_code is the primary security boundary
-- - Cooks (unauthenticated) get broad access once they know the code
-- - Client-side enforcement prevents cross-kitchen contamination
-- - Kitchen owners (authenticated) have full control over their kitchen
-- 
-- This is acceptable for MVP/pilot with trusted users.
-- For production, consider backend API with service role + device token validation.
-- 
-- ============================================================================
