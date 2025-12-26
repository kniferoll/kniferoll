-- Enable Realtime for tables that need live updates
-- This adds tables to the supabase_realtime publication

-- Enable realtime for prep_items (main collaborative table)
ALTER PUBLICATION supabase_realtime ADD TABLE prep_items;

-- Enable realtime for stations (in case stations are added/removed)
ALTER PUBLICATION supabase_realtime ADD TABLE stations;

-- Enable realtime for session_users (to track who's online/active)
ALTER PUBLICATION supabase_realtime ADD TABLE session_users;

-- Enable realtime for kitchen_item_suggestions (for suggestion updates across devices)
ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_item_suggestions;

-- Enable realtime for kitchen_units (for unit updates across devices)
ALTER PUBLICATION supabase_realtime ADD TABLE kitchen_units;

-- Note: After running this migration, you may also need to enable Realtime 
-- in the Supabase Dashboard under Database > Replication if not already enabled.
-- The tables should appear in the "Source" section of the Realtime settings.

COMMENT ON TABLE prep_items IS 'Prep items for stations - realtime enabled for collaborative updates';
