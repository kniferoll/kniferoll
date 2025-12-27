-- Restore insert policy for kitchens to allow authenticated users to create kitchens

DROP POLICY IF EXISTS "Authenticated users can create kitchens" ON kitchens;

CREATE POLICY "Authenticated users can create kitchens"
  ON kitchens FOR INSERT
  WITH CHECK (owner_id = auth.uid());
