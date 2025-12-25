-- Core tables
CREATE TABLE kitchens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  join_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 6),
  shifts_config JSONB DEFAULT '[{"name":"AM"},{"name":"PM"}]'::jsonb,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kitchen_id, name)
);

CREATE TABLE user_kitchens (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kitchen_id UUID REFERENCES kitchens(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  PRIMARY KEY (user_id, kitchen_id)
);

CREATE TABLE prep_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  shift_date DATE DEFAULT CURRENT_DATE,
  shift_name TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity_raw TEXT NOT NULL,
  quantity_parsed JSONB,
  recipe_id UUID,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE session_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  station_id UUID REFERENCES stations(id),
  device_token TEXT UNIQUE NOT NULL,
  last_active TIMESTAMPTZ DEFAULT now()
);

-- Future tables (empty for now)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID REFERENCES kitchens(id) ON DELETE CASCADE,
  shift_date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  quantity_raw TEXT NOT NULL,
  quantity_parsed JSONB,
  source_prep_item_id UUID REFERENCES prep_items(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID REFERENCES kitchens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  yield_amount NUMERIC,
  yield_unit TEXT,
  ingredients_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID UNIQUE REFERENCES kitchens(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  current_period_end TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_prep_station_date ON prep_items(station_id, shift_date);
CREATE INDEX idx_session_device ON session_users(device_token);

-- Updated_at trigger
CREATE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kitchens_updated BEFORE UPDATE ON kitchens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER prep_updated BEFORE UPDATE ON prep_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
