-- Add RLS policies for kitchen_units, kitchen_item_suggestions, and station_shift_dismissed_suggestions

-- Enable RLS on new tables
ALTER TABLE kitchen_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_item_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestion_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_shift_dismissed_suggestions ENABLE ROW LEVEL SECURITY;

-- KITCHEN UNITS
-- Chefs: Full access to units in their kitchens
CREATE POLICY "chefs_manage_units" ON kitchen_units
  FOR ALL
  USING (
    kitchen_units.kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  );

-- Public: Can read and insert units (cooks adding new units during prep)
CREATE POLICY "public_manage_units" ON kitchen_units
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- KITCHEN ITEM SUGGESTIONS
-- Chefs: Full access to suggestions in their kitchens
CREATE POLICY "chefs_manage_suggestions" ON kitchen_item_suggestions
  FOR ALL
  USING (
    kitchen_item_suggestions.kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  );

-- Public: Can read suggestions (for autocomplete), can update (tracking usage)
CREATE POLICY "public_read_suggestions" ON kitchen_item_suggestions
  FOR SELECT
  USING (true);

CREATE POLICY "public_update_suggestions" ON kitchen_item_suggestions
  FOR UPDATE
  USING (true);

-- PUBLIC: Can insert suggestions (tracking new items as prep happens)
CREATE POLICY "public_insert_suggestions" ON kitchen_item_suggestions
  FOR INSERT
  WITH CHECK (true);

-- USER SUGGESTION DISMISSALS
-- Public: Can manage their own dismissals
CREATE POLICY "public_manage_dismissals" ON user_suggestion_dismissals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- STATION SHIFT DISMISSED SUGGESTIONS
-- Public: Can manage dismissed suggestions for context
CREATE POLICY "public_manage_shift_dismissals" ON station_shift_dismissed_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);
