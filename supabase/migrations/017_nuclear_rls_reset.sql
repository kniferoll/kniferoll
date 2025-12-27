-- Nuclear option: Disable and re-enable RLS to force drop all policies
-- Then rebuild with the simplest possible policies

-- Disable RLS (drops all policies)
ALTER TABLE kitchens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_kitchens DISABLE ROW LEVEL SECURITY;
ALTER TABLE stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE prep_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_units DISABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_item_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestion_dismissals DISABLE ROW LEVEL SECURITY;
ALTER TABLE station_shift_dismissed_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_item_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestion_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_shift_dismissed_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- KITCHENS - Authenticated users manage their own
-- ============================================================================

CREATE POLICY "kitchens_authenticated_all" ON kitchens
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "kitchens_anon_select" ON kitchens
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- USER_KITCHENS - Users manage their own memberships
-- ============================================================================

CREATE POLICY "user_kitchens_own" ON user_kitchens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STATIONS - Owners manage, everyone reads
-- ============================================================================

CREATE POLICY "stations_authenticated_manage" ON stations
  FOR ALL
  TO authenticated
  USING (
    stations.kitchen_id IN (
      SELECT id FROM kitchens WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    stations.kitchen_id IN (
      SELECT id FROM kitchens WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "stations_select_all" ON stations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- SESSION_USERS - Anonymous users can manage
-- ============================================================================

CREATE POLICY "session_users_all" ON session_users
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PREP_ITEMS - Everyone can manage
-- ============================================================================

CREATE POLICY "prep_items_all" ON prep_items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- KITCHEN_UNITS - Everyone can manage
-- ============================================================================

CREATE POLICY "kitchen_units_all" ON kitchen_units
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- KITCHEN_ITEM_SUGGESTIONS - Everyone can manage
-- ============================================================================

CREATE POLICY "kitchen_item_suggestions_all" ON kitchen_item_suggestions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- USER_SUGGESTION_DISMISSALS - Everyone can manage
-- ============================================================================

CREATE POLICY "user_suggestion_dismissals_all" ON user_suggestion_dismissals
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STATION_SHIFT_DISMISSED_SUGGESTIONS - Everyone can manage
-- ============================================================================

CREATE POLICY "station_shift_dismissals_all" ON station_shift_dismissed_suggestions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ORDER_ITEMS - Everyone can manage (for future use)
-- ============================================================================

CREATE POLICY "order_items_all" ON order_items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- RECIPES - Everyone can manage (for future use)
-- ============================================================================

CREATE POLICY "recipes_all" ON recipes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SUBSCRIPTIONS - Owners can manage (for future use)
-- ============================================================================

CREATE POLICY "subscriptions_authenticated_manage" ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    subscriptions.kitchen_id IN (
      SELECT id FROM kitchens WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    subscriptions.kitchen_id IN (
      SELECT id FROM kitchens WHERE owner_id = auth.uid()
    )
  );
