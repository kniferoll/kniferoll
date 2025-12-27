-- Fix the seed_default_units function to work properly with RLS
-- The issue is that the function needs to bypass RLS when inserting default units

-- Drop existing functions
DROP FUNCTION IF EXISTS trigger_seed_units() CASCADE;
DROP FUNCTION IF EXISTS seed_default_units(UUID) CASCADE;

-- Recreate the seed function with proper RLS handling
CREATE OR REPLACE FUNCTION seed_default_units(p_kitchen_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default units for the kitchen
  -- Using explicit parameter name to avoid any ambiguity
  INSERT INTO kitchen_units (kitchen_id, name, display_name, category, use_count)
  VALUES
    -- Pans
    (p_kitchen_id, 'sheet pan', 'sheet pan', 'pan', 0),
    (p_kitchen_id, 'half sheet', 'half sheet pan', 'pan', 0),
    (p_kitchen_id, 'hotel pan', 'hotel pan', 'pan', 0),
    (p_kitchen_id, 'half hotel', 'half hotel pan', 'pan', 0),
    (p_kitchen_id, 'shallow 9', 'shallow 9 pan', 'pan', 0),
    (p_kitchen_id, 'deep 9', 'deep 9 pan', 'pan', 0),
    (p_kitchen_id, 'shallow 6', 'shallow 6 pan', 'pan', 0),
    (p_kitchen_id, 'deep 6', 'deep 6 pan', 'pan', 0),
    
    -- Containers
    (p_kitchen_id, 'cambro', 'cambro container', 'container', 0),
    (p_kitchen_id, 'deli', 'deli container', 'container', 0),
    (p_kitchen_id, 'quart container', 'quart container', 'container', 0),
    (p_kitchen_id, 'lexan', 'lexan container', 'container', 0),
    
    -- Volume
    (p_kitchen_id, 'cup', 'cup', 'volume', 0),
    (p_kitchen_id, 'quart', 'quart', 'volume', 0),
    (p_kitchen_id, 'gallon', 'gallon', 'volume', 0),
    
    -- Weight
    (p_kitchen_id, 'lb', 'pound', 'weight', 0),
    (p_kitchen_id, 'oz', 'ounce', 'weight', 0),
    (p_kitchen_id, 'kg', 'kilogram', 'weight', 0),
    
    -- Count
    (p_kitchen_id, 'each', 'each', 'count', 0),
    (p_kitchen_id, 'bunch', 'bunch', 'count', 0),
    (p_kitchen_id, 'case', 'case', 'count', 0)
  ON CONFLICT (kitchen_id, name) DO NOTHING;
END;
$$;

-- Recreate trigger function
CREATE OR REPLACE FUNCTION trigger_seed_units()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call seed function with NEW.id (the newly created kitchen's id)
  PERFORM seed_default_units(NEW.id);
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER seed_units_on_kitchen_create
AFTER INSERT ON kitchens
FOR EACH ROW
EXECUTE FUNCTION trigger_seed_units();

-- Grant execute permissions to the function
GRANT EXECUTE ON FUNCTION seed_default_units(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION trigger_seed_units() TO authenticated, anon;
