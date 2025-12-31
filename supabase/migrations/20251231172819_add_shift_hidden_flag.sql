-- Add is_hidden flag to kitchen_shifts
-- Allows soft-hiding shifts without deleting associated prep items
ALTER TABLE kitchen_shifts
ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Add is_hidden flag to kitchen_shift_days
-- Allows soft-hiding days without deleting associated prep items
-- (is_open controls whether day accepts new items, is_hidden controls visibility)
ALTER TABLE kitchen_shift_days
ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Add index for filtering visible shifts (common query pattern)
CREATE INDEX idx_kitchen_shifts_visible
ON kitchen_shifts (kitchen_id)
WHERE is_hidden = false;

-- Add index for filtering visible shift days (common query pattern)
CREATE INDEX idx_kitchen_shift_days_visible
ON kitchen_shift_days (kitchen_id)
WHERE is_hidden = false;
