-- Create function to seed default units for a new kitchen
CREATE OR REPLACE FUNCTION seed_default_units(kitchen_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO kitchen_units (kitchen_id, name, display_name, category, use_count)
  VALUES
    -- Pans (hotel/steam table sizes)
    (kitchen_id, 'Full Hotel', 'Full Hotel Pan', 'pan', 0),
    (kitchen_id, 'Half Hotel', 'Half Hotel Pan', 'pan', 0),
    (kitchen_id, 'Third Pan', 'Third Pan', 'pan', 0),
    (kitchen_id, 'Shallow Six', 'Shallow Sixth Pan', 'pan', 0),
    (kitchen_id, 'Sixth', 'Sixth Pan', 'pan', 0),
    (kitchen_id, 'Shallow Nine', 'Shallow Ninth Pan', 'pan', 0),
    (kitchen_id, 'Ninth Pan', 'Ninth Pan', 'pan', 0),
    (kitchen_id, 'Full Sheet', 'Full Sheet Pan', 'pan', 0),
    (kitchen_id, 'Half Sheet', 'Half Sheet Pan', 'pan', 0),
    (kitchen_id, 'Quarter Sheet', 'Quarter Sheet Pan', 'pan', 0),
    (kitchen_id, 'Perforated', 'Perforated Pan', 'pan', 0),
    
    -- Cambros / Lexans (by size)
    (kitchen_id, '2 Qt Cambro', '2 Quart Cambro', 'container', 0),
    (kitchen_id, '4 Qt Cambro', '4 Quart Cambro', 'container', 0),
    (kitchen_id, '6 Qt Cambro', '6 Quart Cambro', 'container', 0),
    (kitchen_id, '8 Qt Cambro', '8 Quart Cambro', 'container', 0),
    (kitchen_id, '12 Qt Cambro', '12 Quart Cambro', 'container', 0),
    (kitchen_id, '18 Qt Cambro', '18 Quart Cambro', 'container', 0),
    (kitchen_id, '22 Qt Cambro', '22 Quart Cambro', 'container', 0),
    
    -- Delis
    (kitchen_id, '8 oz Deli', '8 Ounce Deli', 'container', 0),
    (kitchen_id, 'Pint Deli', 'Pint Deli Container', 'container', 0),
    (kitchen_id, 'Quart Deli', 'Quart Deli Container', 'container', 0),
    
    -- Inserts / specialty
    (kitchen_id, 'Bain Marie', 'Bain Marie', 'container', 0),
    (kitchen_id, 'Bus Tub', 'Bus Tub', 'container', 0),
    (kitchen_id, 'Lexan', 'Lexan Container', 'container', 0),
    (kitchen_id, 'Fish Tub', 'Fish Tub', 'container', 0),
    (kitchen_id, 'Squeeze Bottle', 'Squeeze Bottle', 'container', 0),
    (kitchen_id, '2 oz Cup', '2 Ounce Portion Cup', 'container', 0),
    (kitchen_id, '4 oz Cup', '4 Ounce Portion Cup', 'container', 0),
    
    -- Volume
    (kitchen_id, 'Cup', 'Cup', 'volume', 0),
    (kitchen_id, 'Pint', 'Pint', 'volume', 0),
    (kitchen_id, 'Quart', 'Quart', 'volume', 0),
    (kitchen_id, 'Gallon', 'Gallon', 'volume', 0),
    (kitchen_id, 'Liter', 'Liter', 'volume', 0),
    (kitchen_id, 'Fl Oz', 'Fluid Ounce', 'volume', 0),
    
    -- Weight
    (kitchen_id, 'Lb', 'Pound', 'weight', 0),
    (kitchen_id, 'Oz', 'Ounce', 'weight', 0),
    (kitchen_id, 'Kg', 'Kilogram', 'weight', 0),
    (kitchen_id, 'g', 'Gram', 'weight', 0),
    
    -- Count
    (kitchen_id, 'Each', 'Each', 'count', 0),
    (kitchen_id, 'Dozen', 'Dozen', 'count', 0),
    (kitchen_id, 'Bunch', 'Bunch', 'count', 0),
    (kitchen_id, 'Head', 'Head', 'count', 0),
    (kitchen_id, 'Case', 'Case', 'count', 0),
    (kitchen_id, 'Flat', 'Flat', 'count', 0),
    (kitchen_id, 'Portion', 'Portion', 'count', 0),
    (kitchen_id, 'Bag', 'Bag', 'count', 0),
    (kitchen_id, '#10 Can', 'Number 10 Can', 'count', 0),
    
    -- Prep
    (kitchen_id, 'Batch', 'Batch', 'prep', 0),
    (kitchen_id, 'Recipe', 'Recipe Yield', 'prep', 0),
    (kitchen_id, 'Par', 'Par Level', 'prep', 0)
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
