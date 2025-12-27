-- Test creating a kitchen to see where the error occurs
-- Run this in Supabase SQL Editor to see the exact error

BEGIN;

-- Simulate creating a kitchen as a specific user
-- Replace 'YOUR_USER_ID' with an actual auth.uid() from your auth.users table
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000000"}';

-- Try to insert a kitchen
INSERT INTO kitchens (name, owner_id, join_code, plan)
VALUES ('Test Kitchen', '00000000-0000-0000-0000-000000000000', 'TEST01', 'free')
RETURNING *;

ROLLBACK;
