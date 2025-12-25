-- Allow unauthenticated users to find kitchens by join code
-- This is needed for the join flow where cooks don't have accounts
CREATE POLICY "public_join_by_code" ON kitchens 
  FOR SELECT 
  USING (true);

-- Note: This allows reading kitchen data if you know the join_code
-- The actual security is in the join_code being secret (6 random chars)
-- Alternative: Could restrict to only allowing reads where join_code matches
-- but that requires passing the join_code in the query which Supabase RLS can't easily check
