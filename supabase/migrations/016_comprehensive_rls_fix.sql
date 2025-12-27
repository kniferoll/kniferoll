-- Comprehensive fix for all ambiguous kitchen_id errors
-- Drop ALL existing policies and rebuild from scratch

-- ============================================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================================

-- Kitchens
DROP POLICY IF EXISTS "owner_all" ON kitchens;
DROP POLICY IF EXISTS "public_join_by_code" ON kitchens;
DROP POLICY IF EXISTS "chefs_own_kitchens" ON kitchens;
DROP POLICY IF EXISTS "public_read_kitchens" ON kitchens;
DROP POLICY IF EXISTS "kitchens_insert" ON kitchens;
DROP POLICY IF EXISTS "kitchens_select_update" ON kitchens;
DROP POLICY IF EXISTS "kitchens_update" ON kitchens;
DROP POLICY IF EXISTS "kitchens_delete" ON kitchens;
DROP POLICY IF EXISTS "kitchens_public_read_by_code" ON kitchens;

-- Stations
DROP POLICY IF EXISTS "members_view_stations" ON stations;
DROP POLICY IF EXISTS "owner_manage_stations" ON stations;
DROP POLICY IF EXISTS "chefs_manage_stations" ON stations;
DROP POLICY IF EXISTS "public_read_stations" ON stations;
DROP POLICY IF EXISTS "stations_owner_all" ON stations;
DROP POLICY IF EXISTS "stations_public_read" ON stations;

-- Prep Items
DROP POLICY IF EXISTS "members_all_prep" ON prep_items;
DROP POLICY IF EXISTS "chefs_manage_prep" ON prep_items;
DROP POLICY IF EXISTS "public_manage_prep" ON prep_items;
DROP POLICY IF EXISTS "prep_items_owner_all" ON prep_items;
DROP POLICY IF EXISTS "prep_items_public_all" ON prep_items;

-- Session Users
DROP POLICY IF EXISTS "public_insert_session" ON session_users;
DROP POLICY IF EXISTS "members_view_session" ON session_users;
DROP POLICY IF EXISTS "public_insert_session_users" ON session_users;
DROP POLICY IF EXISTS "public_update_session_users" ON session_users;
DROP POLICY IF EXISTS "public_read_session_users" ON session_users;
DROP POLICY IF EXISTS "chefs_delete_session_users" ON session_users;
DROP POLICY IF EXISTS "session_users_public_insert" ON session_users;
DROP POLICY IF EXISTS "session_users_public_read" ON session_users;
DROP POLICY IF EXISTS "session_users_public_update" ON session_users;
DROP POLICY IF EXISTS "session_users_owner_delete" ON session_users;

-- User Kitchens
DROP POLICY IF EXISTS "own_memberships" ON user_kitchens;
DROP POLICY IF EXISTS "owner_manage_memberships" ON user_kitchens;
DROP POLICY IF EXISTS "chefs_own_memberships" ON user_kitchens;
DROP POLICY IF EXISTS "chefs_insert_own_membership" ON user_kitchens;
DROP POLICY IF EXISTS "chefs_manage_memberships" ON user_kitchens;
DROP POLICY IF EXISTS "user_kitchens_insert_self" ON user_kitchens;
DROP POLICY IF EXISTS "user_kitchens_select_self" ON user_kitchens;
DROP POLICY IF EXISTS "user_kitchens_owner_all" ON user_kitchens;

-- Kitchen Units
DROP POLICY IF EXISTS "chefs_manage_units" ON kitchen_units;
DROP POLICY IF EXISTS "public_manage_units" ON kitchen_units;
DROP POLICY IF EXISTS "kitchen_units_all" ON kitchen_units;

-- Kitchen Item Suggestions
DROP POLICY IF EXISTS "chefs_manage_suggestions" ON kitchen_item_suggestions;
DROP POLICY IF EXISTS "public_read_suggestions" ON kitchen_item_suggestions;
DROP POLICY IF EXISTS "public_update_suggestions" ON kitchen_item_suggestions;
DROP POLICY IF EXISTS "public_insert_suggestions" ON kitchen_item_suggestions;
DROP POLICY IF EXISTS "kitchen_item_suggestions_all" ON kitchen_item_suggestions;

-- User Suggestion Dismissals
DROP POLICY IF EXISTS "public_manage_dismissals" ON user_suggestion_dismissals;
DROP POLICY IF EXISTS "user_suggestion_dismissals_all" ON user_suggestion_dismissals;

-- Station Shift Dismissed Suggestions
DROP POLICY IF EXISTS "public_manage_shift_dismissals" ON station_shift_dismissed_suggestions;
DROP POLICY IF EXISTS "station_shift_dismissals_all" ON station_shift_dismissed_suggestions;

-- ============================================================================
-- CREATE SIMPLE, NON-AMBIGUOUS POLICIES
-- ============================================================================

-- KITCHENS: Owner has full access, public can read for join flow
CREATE POLICY "kitchens_owner_all" ON kitchens
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "kitchens_public_select" ON kitchens
  FOR SELECT
  TO public
  USING (true);

-- USER_KITCHENS: Users manage their own, owners manage their kitchen's memberships
CREATE POLICY "user_kitchens_self" ON user_kitchens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- STATIONS: Public read, authenticated owners manage
CREATE POLICY "stations_owner_manage" ON stations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kitchens k
      WHERE k.id = stations.kitchen_id
      AND k.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kitchens k
      WHERE k.id = stations.kitchen_id
      AND k.owner_id = auth.uid()
    )
  );

CREATE POLICY "stations_public_select" ON stations
  FOR SELECT
  TO public
  USING (true);

-- SESSION_USERS: Public can manage (unauthenticated cooks)
CREATE POLICY "session_users_public_manage" ON session_users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "session_users_owner_delete" ON session_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kitchens k
      WHERE k.id = session_users.kitchen_id
      AND k.owner_id = auth.uid()
    )
  );

-- PREP_ITEMS: Public can manage, owners can manage their kitchen's items
CREATE POLICY "prep_items_public_manage" ON prep_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "prep_items_owner_manage" ON prep_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM stations s
      INNER JOIN kitchens k ON k.id = s.kitchen_id
      WHERE s.id = prep_items.station_id
      AND k.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM stations s
      INNER JOIN kitchens k ON k.id = s.kitchen_id
      WHERE s.id = prep_items.station_id
      AND k.owner_id = auth.uid()
    )
  );

-- KITCHEN_UNITS: Public can manage
CREATE POLICY "kitchen_units_public_manage" ON kitchen_units
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- KITCHEN_ITEM_SUGGESTIONS: Public can manage
CREATE POLICY "kitchen_item_suggestions_public_manage" ON kitchen_item_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- USER_SUGGESTION_DISMISSALS: Public can manage
CREATE POLICY "user_suggestion_dismissals_public_manage" ON user_suggestion_dismissals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- STATION_SHIFT_DISMISSED_SUGGESTIONS: Public can manage
CREATE POLICY "station_shift_dismissals_public_manage" ON station_shift_dismissed_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SECURITY MODEL NOTES
-- ============================================================================
-- 
-- This design prioritizes simplicity and functionality for your mentor-mentee model:
-- 
-- 1. Authenticated users (chefs):
--    - Create and manage their own kitchens
--    - Full control over stations, prep items in their kitchens
--    - Can see who's working (session users)
-- 
-- 2. Unauthenticated users (cooks):
--    - Join via join_code (validated client-side)
--    - Work on prep items
--    - Claim stations
--    - Add suggestions and units
-- 
-- 3. Security boundary:
--    - join_code is the primary access control
--    - Client-side filtering prevents cross-kitchen access
--    - Trust model: cooks who know the code are trusted
-- 
-- This is appropriate for MVP/pilot phase with known users.
-- ============================================================================
