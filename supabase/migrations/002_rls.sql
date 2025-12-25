-- Enable RLS
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kitchens ENABLE ROW LEVEL SECURITY;

-- Kitchens: owner full access
CREATE POLICY "owner_all" ON kitchens FOR ALL USING (owner_id = auth.uid());

-- Stations: kitchen members can view, owner can manage
CREATE POLICY "members_view_stations" ON stations FOR SELECT USING (
  kitchen_id IN (SELECT kitchen_id FROM user_kitchens WHERE user_id = auth.uid())
  OR kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
);
CREATE POLICY "owner_manage_stations" ON stations FOR ALL USING (
  kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
);

-- Prep items: kitchen members full access
CREATE POLICY "members_all_prep" ON prep_items FOR ALL USING (
  station_id IN (
    SELECT s.id FROM stations s
    JOIN kitchens k ON s.kitchen_id = k.id
    WHERE k.owner_id = auth.uid()
      OR k.id IN (SELECT kitchen_id FROM user_kitchens WHERE user_id = auth.uid())
  )
);

-- Session users: public insert, kitchen members can view
CREATE POLICY "public_insert_session" ON session_users FOR INSERT WITH CHECK (true);
CREATE POLICY "members_view_session" ON session_users FOR SELECT USING (
  kitchen_id IN (SELECT kitchen_id FROM user_kitchens WHERE user_id = auth.uid())
  OR kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
);

-- User kitchens: users see own memberships, owners manage
CREATE POLICY "own_memberships" ON user_kitchens FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "owner_manage_memberships" ON user_kitchens FOR ALL USING (
  kitchen_id IN (SELECT id FROM kitchens WHERE owner_id = auth.uid())
);
