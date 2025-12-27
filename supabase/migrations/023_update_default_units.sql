-- Add new default units for all existing kitchens
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
