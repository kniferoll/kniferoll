-- Temporarily disable the seed units trigger to isolate the issue
-- This will help us determine if the trigger is causing the ambiguous column error

DROP TRIGGER IF EXISTS seed_units_on_kitchen_create ON kitchens;

-- We'll re-enable it once we confirm kitchens can be created
