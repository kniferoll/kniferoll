-- Add unique constraint for session_users to enable upsert
-- A device can only have one session per kitchen
ALTER TABLE session_users 
  ADD CONSTRAINT session_users_kitchen_device_unique 
  UNIQUE (kitchen_id, device_token);
