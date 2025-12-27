-- Replace the seed_default_units function with comprehensive unit list
CREATE OR REPLACE FUNCTION seed_default_units(p_kitchen_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO kitchen_units (kitchen_id, name, display_name, category, use_count)
  VALUES
    -- Pans (hotel/steam table sizes)
    (p_kitchen_id, 'Full Hotel', 'Full Hotel Pan', 'pan', 0),
    (p_kitchen_id, 'Half Hotel', 'Half Hotel Pan', 'pan', 0),
    (p_kitchen_id, 'Third Pan', 'Third Pan', 'pan', 0),
    (p_kitchen_id, 'Shallow Six', 'Shallow Sixth Pan', 'pan', 0),
    (p_kitchen_id, 'Sixth', 'Sixth Pan', 'pan', 0),
    (p_kitchen_id, 'Shallow Nine', 'Shallow Ninth Pan', 'pan', 0),
    (p_kitchen_id, 'Ninth Pan', 'Ninth Pan', 'pan', 0),
    (p_kitchen_id, 'Full Sheet', 'Full Sheet Pan', 'pan', 0),
    (p_kitchen_id, 'Half Sheet', 'Half Sheet Pan', 'pan', 0),
    (p_kitchen_id, 'Quarter Sheet', 'Quarter Sheet Pan', 'pan', 0),
    (p_kitchen_id, 'Perforated', 'Perforated Pan', 'pan', 0),
    
    -- Cambros / Lexans (by size)
    (p_kitchen_id, '2 Qt Cambro', '2 Quart Cambro', 'container', 0),
    (p_kitchen_id, '4 Qt Cambro', '4 Quart Cambro', 'container', 0),
    (p_kitchen_id, '6 Qt Cambro', '6 Quart Cambro', 'container', 0),
    (p_kitchen_id, '8 Qt Cambro', '8 Quart Cambro', 'container', 0),
    (p_kitchen_id, '12 Qt Cambro', '12 Quart Cambro', 'container', 0),
    (p_kitchen_id, '18 Qt Cambro', '18 Quart Cambro', 'container', 0),
    (p_kitchen_id, '22 Qt Cambro', '22 Quart Cambro', 'container', 0),
    
    -- Delis
    (p_kitchen_id, '8 oz Deli', '8 Ounce Deli', 'container', 0),
    (p_kitchen_id, 'Pint Deli', 'Pint Deli Container', 'container', 0),
    (p_kitchen_id, 'Quart Deli', 'Quart Deli Container', 'container', 0),
    
    -- Inserts / specialty
    (p_kitchen_id, 'Bain Marie', 'Bain Marie', 'container', 0),
    (p_kitchen_id, 'Bus Tub', 'Bus Tub', 'container', 0),
    (p_kitchen_id, 'Lexan', 'Lexan Container', 'container', 0),
    (p_kitchen_id, 'Fish Tub', 'Fish Tub', 'container', 0),
    (p_kitchen_id, 'Squeeze Bottle', 'Squeeze Bottle', 'container', 0),
    (p_kitchen_id, '2 oz Cup', '2 Ounce Portion Cup', 'container', 0),
    (p_kitchen_id, '4 oz Cup', '4 Ounce Portion Cup', 'container', 0),
    
    -- Volume
    (p_kitchen_id, 'Cup', 'Cup', 'volume', 0),
    (p_kitchen_id, 'Pint', 'Pint', 'volume', 0),
    (p_kitchen_id, 'Quart', 'Quart', 'volume', 0),
    (p_kitchen_id, 'Gallon', 'Gallon', 'volume', 0),
    (p_kitchen_id, 'Liter', 'Liter', 'volume', 0),
    (p_kitchen_id, 'Fl Oz', 'Fluid Ounce', 'volume', 0),
    
    -- Weight
    (p_kitchen_id, 'Lb', 'Pound', 'weight', 0),
    (p_kitchen_id, 'Oz', 'Ounce', 'weight', 0),
    (p_kitchen_id, 'Kg', 'Kilogram', 'weight', 0),
    (p_kitchen_id, 'g', 'Gram', 'weight', 0),
    
    -- Count
    (p_kitchen_id, 'Each', 'Each', 'count', 0),
    (p_kitchen_id, 'Dozen', 'Dozen', 'count', 0),
    (p_kitchen_id, 'Bunch', 'Bunch', 'count', 0),
    (p_kitchen_id, 'Head', 'Head', 'count', 0),
    (p_kitchen_id, 'Case', 'Case', 'count', 0),
    (p_kitchen_id, 'Flat', 'Flat', 'count', 0),
    (p_kitchen_id, 'Portion', 'Portion', 'count', 0),
    (p_kitchen_id, 'Bag', 'Bag', 'count', 0),
    (p_kitchen_id, '#10 Can', 'Number 10 Can', 'count', 0),
    
    -- Prep
    (p_kitchen_id, 'Batch', 'Batch', 'prep', 0),
    (p_kitchen_id, 'Recipe', 'Recipe Yield', 'prep', 0),
    (p_kitchen_id, 'Par', 'Par Level', 'prep', 0)
  ON CONFLICT (kitchen_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove old poorly formatted units from migration 008
DELETE FROM kitchen_units
WHERE name IN (
  'sheet pan', 'half sheet', 'hotel pan', 'half hotel',
  'shallow 9', 'deep 9', 'shallow 6', 'deep 6',
  'cambro', 'deli', 'quart container', 'lexan',
  'cup', 'quart', 'gallon',
  'lb', 'oz', 'kg',
  'each', 'bunch', 'case'
);

-- Backfill comprehensive unit list to all existing kitchens
INSERT INTO kitchen_units (kitchen_id, name, display_name, category, use_count)
SELECT k.id, unit.name, unit.display_name, unit.category, 0
FROM kitchens k
CROSS JOIN (
  VALUES
    -- Pans (hotel/steam table sizes)
    ('Full Hotel', 'Full Hotel Pan', 'pan'),
    ('Half Hotel', 'Half Hotel Pan', 'pan'),
    ('Third Pan', 'Third Pan', 'pan'),
    ('Shallow Six', 'Shallow Sixth Pan', 'pan'),
    ('Sixth', 'Sixth Pan', 'pan'),
    ('Shallow Nine', 'Shallow Ninth Pan', 'pan'),
    ('Ninth Pan', 'Ninth Pan', 'pan'),
    ('Full Sheet', 'Full Sheet Pan', 'pan'),
    ('Half Sheet', 'Half Sheet Pan', 'pan'),
    ('Quarter Sheet', 'Quarter Sheet Pan', 'pan'),
    ('Perforated', 'Perforated Pan', 'pan'),
    
    -- Cambros / Lexans (by size)
    ('2 Qt Cambro', '2 Quart Cambro', 'container'),
    ('4 Qt Cambro', '4 Quart Cambro', 'container'),
    ('6 Qt Cambro', '6 Quart Cambro', 'container'),
    ('8 Qt Cambro', '8 Quart Cambro', 'container'),
    ('12 Qt Cambro', '12 Quart Cambro', 'container'),
    ('18 Qt Cambro', '18 Quart Cambro', 'container'),
    ('22 Qt Cambro', '22 Quart Cambro', 'container'),
    
    -- Delis
    ('8 oz Deli', '8 Ounce Deli', 'container'),
    ('Pint Deli', 'Pint Deli Container', 'container'),
    ('Quart Deli', 'Quart Deli Container', 'container'),
    
    -- Inserts / specialty
    ('Bain Marie', 'Bain Marie', 'container'),
    ('Bus Tub', 'Bus Tub', 'container'),
    ('Lexan', 'Lexan Container', 'container'),
    ('Fish Tub', 'Fish Tub', 'container'),
    ('Squeeze Bottle', 'Squeeze Bottle', 'container'),
    ('2 oz Cup', '2 Ounce Portion Cup', 'container'),
    ('4 oz Cup', '4 Ounce Portion Cup', 'container'),
    
    -- Volume
    ('Cup', 'Cup', 'volume'),
    ('Pint', 'Pint', 'volume'),
    ('Quart', 'Quart', 'volume'),
    ('Gallon', 'Gallon', 'volume'),
    ('Liter', 'Liter', 'volume'),
    ('Fl Oz', 'Fluid Ounce', 'volume'),
    
    -- Weight
    ('Lb', 'Pound', 'weight'),
    ('Oz', 'Ounce', 'weight'),
    ('Kg', 'Kilogram', 'weight'),
    ('g', 'Gram', 'weight'),
    
    -- Count
    ('Each', 'Each', 'count'),
    ('Dozen', 'Dozen', 'count'),
    ('Bunch', 'Bunch', 'count'),
    ('Head', 'Head', 'count'),
    ('Case', 'Case', 'count'),
    ('Flat', 'Flat', 'count'),
    ('Portion', 'Portion', 'count'),
    ('Bag', 'Bag', 'count'),
    ('#10 Can', 'Number 10 Can', 'count'),
    
    -- Prep
    ('Batch', 'Batch', 'prep'),
    ('Recipe', 'Recipe Yield', 'prep'),
    ('Par', 'Par Level', 'prep')
) AS unit(name, display_name, category)
ON CONFLICT (kitchen_id, name) DO NOTHING;
