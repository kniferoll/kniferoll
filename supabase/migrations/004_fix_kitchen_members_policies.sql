-- Fix recursion in kitchen_members RLS policies

-- Drop recursive policies
DROP POLICY IF EXISTS "Members can view membership" ON kitchen_members;
DROP POLICY IF EXISTS "Owner/admin can manage members" ON kitchen_members;

-- Allow users to view their own membership rows and owners to view all
CREATE POLICY "User can view own membership"
  ON kitchen_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM kitchens
      WHERE kitchens.id = kitchen_members.kitchen_id
      AND kitchens.owner_id = auth.uid()
    )
  );

-- Owner can manage all members for their kitchen (insert/update/delete)
CREATE POLICY "Owner can manage members"
  ON kitchen_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM kitchens
      WHERE kitchens.id = kitchen_members.kitchen_id
      AND kitchens.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kitchens
      WHERE kitchens.id = kitchen_members.kitchen_id
      AND kitchens.owner_id = auth.uid()
    )
  );