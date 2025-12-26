-- Create table to track suggestion dismissals per station-date-shift context
-- This allows dismissals to be specific to a prep context (e.g., dismissing "cilantro" 
-- for AM shift on Tuesday doesn't affect PM shift or Wednesday AM)
CREATE TABLE station_shift_dismissed_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_name TEXT NOT NULL,
  suggestion_id UUID NOT NULL REFERENCES kitchen_item_suggestions(id) ON DELETE CASCADE,
  dismissed_by TEXT NOT NULL, -- user_id or device_token
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(station_id, shift_date, shift_name, suggestion_id)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_station_shift_dismissals_context ON station_shift_dismissed_suggestions(station_id, shift_date, shift_name);
CREATE INDEX idx_station_shift_dismissals_suggestion_id ON station_shift_dismissed_suggestions(suggestion_id);

-- Add comments
COMMENT ON TABLE station_shift_dismissed_suggestions IS 'Track dismissed suggestions per station-date-shift context. Dismissals are scoped to specific prep contexts.';
COMMENT ON COLUMN station_shift_dismissed_suggestions.dismissed_by IS 'User ID or device token of the user who dismissed this suggestion';
