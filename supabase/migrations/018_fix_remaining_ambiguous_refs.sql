-- Final fix for any remaining ambiguous kitchen_id references
-- Drop and recreate any problematic policies with qualified column names

-- Drop policies that might have ambiguous references
DROP POLICY IF EXISTS "chefs_manage_units" ON kitchen_units;
DROP POLICY IF EXISTS "chefs_manage_suggestions" ON kitchen_item_suggestions;

-- Recreate with properly qualified column names
CREATE POLICY "chefs_manage_units" ON kitchen_units
  FOR ALL
  TO authenticated
  USING (
    kitchen_units.kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    kitchen_units.kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  );

CREATE POLICY "chefs_manage_suggestions" ON kitchen_item_suggestions
  FOR ALL
  TO authenticated
  USING (
    kitchen_item_suggestions.kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    kitchen_item_suggestions.kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
  );
