-- Add schedule configuration to kitchens table
ALTER TABLE kitchens 
ADD COLUMN schedule JSONB DEFAULT '{"default": ["Lunch", "Dinner"]}'::jsonb,
ADD COLUMN closed_days TEXT[] DEFAULT '{}'::TEXT[];

-- Update existing kitchens to have the default schedule
UPDATE kitchens 
SET schedule = '{"default": ["Lunch", "Dinner"]}'::jsonb,
    closed_days = '{}'::TEXT[]
WHERE schedule IS NULL;

COMMENT ON COLUMN kitchens.schedule IS 'Shift schedule configuration. Can be {"default": [...]} for same-every-day or per-day like {"monday": [...], "tuesday": [...]}';
COMMENT ON COLUMN kitchens.closed_days IS 'Array of day names that the kitchen is closed (e.g., ["sunday"])';
