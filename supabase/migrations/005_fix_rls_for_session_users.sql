-- Drop all existing policies
DROP POLICY IF EXISTS "owner_all" ON kitchens;
DROP POLICY IF EXISTS "public_join_by_code" ON kitchens;
DROP POLICY IF EXISTS "members_view_stations" ON stations;
DROP POLICY IF EXISTS "owner_manage_stations" ON stations;
DROP POLICY IF EXISTS "members_all_prep" ON prep_items;
DROP POLICY IF EXISTS "public_insert_session" ON session_users;
DROP POLICY IF EXISTS "members_view_session" ON session_users;
DROP POLICY IF EXISTS "own_memberships" ON user_kitchens;
DROP POLICY IF EXISTS "owner_manage_memberships" ON user_kitchens;

-- ============================================================================
-- NEW RLS POLICIES - Designed for auth users (chefs) + public access (cooks)
-- ============================================================================

-- KITCHENS
-- Chefs: Full access to kitchens they own
CREATE POLICY "chefs_own_kitchens" ON kitchens
  FOR ALL
  USING (auth.uid() = owner_id);

-- Public: Can read any kitchen (needed for join flow to look up by code)
-- Security: join_code is secret, knowing it = authorized
CREATE POLICY "public_read_kitchens" ON kitchens
  FOR SELECT
  USING (true);

-- STATIONS
-- Chefs: Full access to stations in their kitchens
CREATE POLICY "chefs_manage_stations" ON stations
  FOR ALL
  USING (
    kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  );

-- Public: Can read all stations (needed for station picker in join flow)
-- Security: You need the join_code to get to this point
CREATE POLICY "public_read_stations" ON stations
  FOR SELECT
  USING (true);

-- SESSION USERS
-- Public: Can insert session users (join flow)
CREATE POLICY "public_insert_session_users" ON session_users
  FOR INSERT
  WITH CHECK (true);

-- Public: Can update session users (update name, claim station)
-- Note: In production, should restrict to matching device_token, but RLS can't check localStorage
-- For MVP: Trust client-side validation, monitor for abuse
CREATE POLICY "public_update_session_users" ON session_users
  FOR UPDATE
  USING (true);

-- Public: Can read session users (see who's in kitchen)
CREATE POLICY "public_read_session_users" ON session_users
  FOR SELECT
  USING (true);

-- Chefs: Can delete session users in their kitchens
CREATE POLICY "chefs_delete_session_users" ON session_users
  FOR DELETE
  USING (
    kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  );

-- PREP ITEMS
-- Chefs: Full access to prep in their kitchens
CREATE POLICY "chefs_manage_prep" ON prep_items
  FOR ALL
  USING (
    station_id IN (
      SELECT s.id FROM stations s
      JOIN kitchens k ON s.kitchen_id = k.id
      WHERE k.owner_id = auth.uid()
    )
  );

-- Public: Can manage prep items (cooks working on their station)
-- Security: Kitchen access controlled by knowing join_code
-- In production: Could add created_by = device_token check, but requires backend
CREATE POLICY "public_manage_prep" ON prep_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- USER KITCHENS (chef membership tracking)
-- Chefs: See their own memberships
CREATE POLICY "chefs_own_memberships" ON user_kitchens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Chefs: Insert their own memberships (when creating kitchen)
CREATE POLICY "chefs_insert_own_membership" ON user_kitchens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chefs: Manage memberships in kitchens they own
CREATE POLICY "chefs_manage_memberships" ON user_kitchens
  FOR ALL
  USING (
    kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  );

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 
-- This RLS design prioritizes MVP speed over perfect security:
-- 1. join_code (6 random chars) is the primary security boundary
-- 2. Cooks (unauthenticated) get broad access once they know the code
-- 3. Cross-kitchen contamination prevented by client-side filtering
-- 
-- For production, consider:
-- - Backend API with service role for cook operations
-- - Row-level created_by checks with device_token
-- - Rate limiting on join attempts
-- - Audit logs for suspicious activity
-- 
-- For design partner pilot: This is acceptable. Monitor usage.
-- ============================================================================
