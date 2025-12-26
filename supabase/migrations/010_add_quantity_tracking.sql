-- Add quantity tracking to suggestions for pre-filling quantities when user taps a suggestion
ALTER TABLE kitchen_item_suggestions
  ADD COLUMN last_quantity_used NUMERIC DEFAULT NULL;

-- Update comment
COMMENT ON COLUMN kitchen_item_suggestions.last_quantity_used IS 'Last quantity used for this item, used to pre-fill quantity field when suggestion is tapped';
