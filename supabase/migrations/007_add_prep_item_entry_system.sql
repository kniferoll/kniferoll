-- Create kitchen_units table
CREATE TABLE kitchen_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT,
  category TEXT DEFAULT 'other',
  use_count INT DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kitchen_id, name)
);

-- Create kitchen_item_suggestions table
CREATE TABLE kitchen_item_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  default_unit_id UUID REFERENCES kitchen_units(id) ON DELETE SET NULL,
  use_count INT DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kitchen_id, description)
);

-- Create user_suggestion_dismissals table
CREATE TABLE user_suggestion_dismissals (
  user_id TEXT NOT NULL,
  suggestion_id UUID NOT NULL REFERENCES kitchen_item_suggestions(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, suggestion_id)
);

-- Alter prep_items table to add unit and quantity columns
ALTER TABLE prep_items 
  ADD COLUMN unit_id UUID REFERENCES kitchen_units(id) ON DELETE SET NULL,
  ADD COLUMN quantity NUMERIC;

-- Create indexes for better query performance
CREATE INDEX idx_kitchen_units_kitchen_id ON kitchen_units(kitchen_id);
CREATE INDEX idx_kitchen_units_use_count ON kitchen_units(use_count DESC);
CREATE INDEX idx_kitchen_units_last_used ON kitchen_units(last_used DESC);

CREATE INDEX idx_kitchen_item_suggestions_kitchen_id ON kitchen_item_suggestions(kitchen_id);
CREATE INDEX idx_kitchen_item_suggestions_use_count ON kitchen_item_suggestions(use_count DESC);
CREATE INDEX idx_kitchen_item_suggestions_last_used ON kitchen_item_suggestions(last_used DESC);

CREATE INDEX idx_user_suggestion_dismissals_user_id ON user_suggestion_dismissals(user_id);
CREATE INDEX idx_user_suggestion_dismissals_suggestion_id ON user_suggestion_dismissals(suggestion_id);

-- Add comments
COMMENT ON TABLE kitchen_units IS 'Kitchen-specific measurement units (pans, containers, weights, volumes, counts)';
COMMENT ON TABLE kitchen_item_suggestions IS 'Track frequently added prep items per kitchen for smart suggestions';
COMMENT ON TABLE user_suggestion_dismissals IS 'Track which suggestions users have dismissed (per user/device)';

COMMENT ON COLUMN kitchen_units.category IS 'Unit category: pan, container, weight, volume, count, or other';
COMMENT ON COLUMN kitchen_units.use_count IS 'Number of times this unit has been used';
COMMENT ON COLUMN kitchen_units.last_used IS 'Timestamp of last usage for recency ranking';

COMMENT ON COLUMN kitchen_item_suggestions.default_unit_id IS 'Default unit for this item if one has been established through frequent usage';
COMMENT ON COLUMN kitchen_item_suggestions.use_count IS 'Number of times this item has been added';

COMMENT ON COLUMN prep_items.unit_id IS 'Reference to the kitchen_units table, if this item has a unit';
COMMENT ON COLUMN prep_items.quantity IS 'Numeric quantity value for this item';
