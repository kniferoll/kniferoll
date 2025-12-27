-- Add status column to replace completed boolean
-- This enables three-state tracking: pending, partial, complete

-- Add new status column with default 'pending'
ALTER TABLE prep_items 
  ADD COLUMN status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'partial', 'complete'));

-- Add tracking columns for status changes
ALTER TABLE prep_items
  ADD COLUMN status_changed_at TIMESTAMPTZ,
  ADD COLUMN status_changed_by TEXT;

-- Migrate existing data: completed=true → 'complete', else 'pending'
UPDATE prep_items SET 
  status = CASE 
    WHEN completed = true THEN 'complete' 
    ELSE 'pending' 
  END,
  status_changed_at = CASE
    WHEN completed = true THEN completed_at
    ELSE created_at
  END,
  status_changed_by = created_by;

-- Drop old completed column
ALTER TABLE prep_items DROP COLUMN completed;

-- Update comments
COMMENT ON COLUMN prep_items.status IS 'Prep item status: pending (not started), partial (in progress), complete (done)';
COMMENT ON COLUMN prep_items.status_changed_at IS 'When the status was last changed';
COMMENT ON COLUMN prep_items.status_changed_by IS 'Who last changed the status';

-- Create index for filtering by status
CREATE INDEX idx_prep_items_status ON prep_items(status);
