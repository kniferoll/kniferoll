-- Final verification and fix of ALL RLS policies
-- This migration ensures no ambiguous column references exist anywhere

-- First, let's see what policies currently exist
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Found policy: %.% - %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;

-- Drop ALL policies on ALL tables to start fresh
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped policy: %.% - %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;

-- Now create clean, simple policies with NO ambiguous references

-- KITCHENS
CREATE POLICY "kitchens_auth_all" ON kitchens
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "kitchens_anon_select" ON kitchens
  FOR SELECT TO anon
  USING (true);

-- USER_KITCHENS
CREATE POLICY "user_kitchens_own" ON user_kitchens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- STATIONS
CREATE POLICY "stations_all" ON stations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- SESSION_USERS
CREATE POLICY "session_users_all" ON session_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- PREP_ITEMS
CREATE POLICY "prep_items_all" ON prep_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- KITCHEN_UNITS
CREATE POLICY "kitchen_units_all" ON kitchen_units
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- KITCHEN_ITEM_SUGGESTIONS
CREATE POLICY "kitchen_item_suggestions_all" ON kitchen_item_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- USER_SUGGESTION_DISMISSALS
CREATE POLICY "user_suggestion_dismissals_all" ON user_suggestion_dismissals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- STATION_SHIFT_DISMISSED_SUGGESTIONS
CREATE POLICY "station_shift_dismissals_all" ON station_shift_dismissed_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ORDER_ITEMS
CREATE POLICY "order_items_all" ON order_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RECIPES
CREATE POLICY "recipes_all" ON recipes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- SUBSCRIPTIONS
CREATE POLICY "subscriptions_all" ON subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify final state
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== FINAL RLS POLICY STATE ===';
  FOR r IN 
    SELECT tablename, policyname, cmd
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Policy: %.% (%)', r.tablename, r.policyname, r.cmd;
  END LOOP;
END $$;
