-- ============================================================================
-- E2E TEST SEED DATA
-- ============================================================================
-- This data is loaded by `supabase db reset` and provides a consistent
-- starting point for Playwright E2E tests.
-- ============================================================================

-- Test user (password: TestPassword123!)
-- Using a deterministic UUID for easy reference in tests
-- Note: 'confirmed_at' is auto-generated from LEAST(email_confirmed_at, phone_confirmed_at)
-- GoTrue expects empty strings (not NULL) for all token and change columns
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  reauthentication_token,
  phone,
  phone_change,
  phone_change_token
) VALUES (
  'e2e00000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'e2e-test@kniferoll.app',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"E2E Test User"}',
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
);

-- Identity record required by GoTrue for email authentication
-- Note: 'email' column is auto-generated from identity_data->>'email'
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
) VALUES (
  'e2e00000-0000-0000-0000-000000000001',
  'e2e00000-0000-0000-0000-000000000001',
  'e2e-test@kniferoll.app',
  'email',
  '{"sub":"e2e00000-0000-0000-0000-000000000001","email":"e2e-test@kniferoll.app","email_verified":true,"provider":"email"}',
  now(),
  now()
);

-- Update test user profile to pro (trigger already created with 'free')
UPDATE user_profiles
SET plan = 'pro'
WHERE id = 'e2e00000-0000-0000-0000-000000000001';

-- Test kitchen
INSERT INTO kitchens (id, name, owner_id)
VALUES (
  'e2e00000-0000-0000-0000-000000000002',
  'E2E Test Kitchen',
  'e2e00000-0000-0000-0000-000000000001'
);

-- Test kitchen member (owner)
INSERT INTO kitchen_members (kitchen_id, user_id, role)
VALUES (
  'e2e00000-0000-0000-0000-000000000002',
  'e2e00000-0000-0000-0000-000000000001',
  'owner'
);

-- Test shifts
INSERT INTO kitchen_shifts (id, kitchen_id, name, display_order)
VALUES
  ('e2e00000-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000002', 'AM', 1),
  ('e2e00000-0000-0000-0000-000000000004', 'e2e00000-0000-0000-0000-000000000002', 'PM', 2);

-- Test shift days (all days open with both shifts)
INSERT INTO kitchen_shift_days (kitchen_id, day_of_week, is_open, shift_ids)
VALUES
  ('e2e00000-0000-0000-0000-000000000002', 0, true, ARRAY['e2e00000-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000004']::uuid[]),
  ('e2e00000-0000-0000-0000-000000000002', 1, true, ARRAY['e2e00000-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000004']::uuid[]),
  ('e2e00000-0000-0000-0000-000000000002', 2, true, ARRAY['e2e00000-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000004']::uuid[]),
  ('e2e00000-0000-0000-0000-000000000002', 3, true, ARRAY['e2e00000-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000004']::uuid[]),
  ('e2e00000-0000-0000-0000-000000000002', 4, true, ARRAY['e2e00000-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000004']::uuid[]),
  ('e2e00000-0000-0000-0000-000000000002', 5, true, ARRAY['e2e00000-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000004']::uuid[]),
  ('e2e00000-0000-0000-0000-000000000002', 6, true, ARRAY['e2e00000-0000-0000-0000-000000000003', 'e2e00000-0000-0000-0000-000000000004']::uuid[]);

-- Test station
INSERT INTO stations (id, kitchen_id, name, display_order)
VALUES (
  'e2e00000-0000-0000-0000-000000000005',
  'e2e00000-0000-0000-0000-000000000002',
  'Garde Manger',
  1
);
