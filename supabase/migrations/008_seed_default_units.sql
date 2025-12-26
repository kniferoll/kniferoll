-- Create function to seed default units for a new kitchen
CREATE OR REPLACE FUNCTION seed_default_units(kitchen_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO kitchen_units (kitchen_id, name, display_name, category, use_count)
  VALUES
    -- Pans
    (kitchen_id, 'sheet pan', 'sheet pan', 'pan', 0),
    (kitchen_id, 'half sheet', 'half sheet pan', 'pan', 0),
    (kitchen_id, 'hotel pan', 'hotel pan', 'pan', 0),
    (kitchen_id, 'half hotel', 'half hotel pan', 'pan', 0),
    (kitchen_id, 'shallow 9', 'shallow 9 pan', 'pan', 0),
    (kitchen_id, 'deep 9', 'deep 9 pan', 'pan', 0),
    (kitchen_id, 'shallow 6', 'shallow 6 pan', 'pan', 0),
    (kitchen_id, 'deep 6', 'deep 6 pan', 'pan', 0),
    
    -- Containers
    (kitchen_id, 'cambro', 'cambro container', 'container', 0),
    (kitchen_id, 'deli', 'deli container', 'container', 0),
    (kitchen_id, 'quart container', 'quart container', 'container', 0),
    (kitchen_id, 'lexan', 'lexan container', 'container', 0),
    
    -- Volume
    (kitchen_id, 'cup', 'cup', 'volume', 0),
    (kitchen_id, 'quart', 'quart', 'volume', 0),
    (kitchen_id, 'gallon', 'gallon', 'volume', 0),
    
    -- Weight
    (kitchen_id, 'lb', 'pound', 'weight', 0),
    (kitchen_id, 'oz', 'ounce', 'weight', 0),
    (kitchen_id, 'kg', 'kilogram', 'weight', 0),
    
    -- Count
    (kitchen_id, 'each', 'each', 'count', 0),
    (kitchen_id, 'bunch', 'bunch', 'count', 0),
    (kitchen_id, 'case', 'case', 'count', 0)
  ON CONFLICT (kitchen_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to seed units on kitchen creation
CREATE OR REPLACE FUNCTION trigger_seed_units()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_units(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS seed_units_on_kitchen_create ON kitchens;

-- Create the trigger
CREATE TRIGGER seed_units_on_kitchen_create
AFTER INSERT ON kitchens
FOR EACH ROW
EXECUTE FUNCTION trigger_seed_units();

-- For existing kitchens, you can manually run:
-- SELECT seed_default_units(id) FROM kitchens;

COMMENT ON FUNCTION seed_default_units IS 'Seeds default units for a kitchen when created';
COMMENT ON FUNCTION trigger_seed_units IS 'Trigger function to seed default units on kitchen creation';
