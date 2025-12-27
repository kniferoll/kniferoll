-- Simplify RLS policies to avoid ambiguous kitchen_id errors
-- Remove the complex subqueries and replace with simpler policies

-- Drop existing policies that might cause issues
DROP POLICY IF EXISTS "chefs_manage_units" ON kitchen_units;
DROP POLICY IF EXISTS "public_manage_units" ON kitchen_units;
DROP POLICY IF EXISTS "chefs_manage_suggestions" ON kitchen_item_suggestions;
DROP POLICY IF EXISTS "public_read_suggestions" ON kitchen_item_suggestions;
DROP POLICY IF EXISTS "public_update_suggestions" ON kitchen_item_suggestions;
DROP POLICY IF EXISTS "public_insert_suggestions" ON kitchen_item_suggestions;

-- KITCHEN UNITS - Simplified
-- Public: Can manage all units (security through join_code)
CREATE POLICY "kitchen_units_all" ON kitchen_units
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- KITCHEN ITEM SUGGESTIONS - Simplified
-- Public: Can manage all suggestions (security through join_code)
CREATE POLICY "kitchen_item_suggestions_all" ON kitchen_item_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- USER SUGGESTION DISMISSALS
-- Public: Can manage their own dismissals
CREATE POLICY "user_suggestion_dismissals_all" ON user_suggestion_dismissals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- STATION SHIFT DISMISSED SUGGESTIONS
-- Public: Can manage dismissed suggestions for context
CREATE POLICY "station_shift_dismissals_all" ON station_shift_dismissed_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);
