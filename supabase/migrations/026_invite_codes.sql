-- Create invite_codes table for tracking shareable join codes
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id UUID NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_by UUID REFERENCES session_users(id) ON DELETE SET NULL,
  -- NULL created_by means chef created it
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT NOT NULL DEFAULT 5,
  current_uses INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kitchen_id, code),
  CHECK (current_uses <= max_uses),
  CHECK (max_uses > 0)
);

-- Indexes for efficient lookups
CREATE INDEX idx_invite_codes_kitchen_active ON invite_codes(kitchen_id, is_active);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Updated_at trigger
CREATE TRIGGER invite_codes_updated BEFORE UPDATE ON invite_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for invite_codes
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active, non-expired codes for a kitchen (needed for joining)
CREATE POLICY "Anyone can view active invite codes"
  ON invite_codes FOR SELECT
  USING (
    is_active = true 
    AND expires_at > now()
  );

-- Chefs (auth users) can create codes for their kitchen
CREATE POLICY "Chef can create invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (
    kitchen_id IN (
      SELECT kitchen_id FROM user_kitchens 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    AND created_by IS NULL
  );

-- Cooks (session users) can create limited codes for their kitchen
CREATE POLICY "Cook can create limited invite codes"
  ON invite_codes FOR INSERT
  WITH CHECK (
    kitchen_id IN (
      SELECT kitchen_id FROM session_users 
      WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Only the creator or kitchen owner can update/delete their codes
CREATE POLICY "Creator or owner can update invite codes"
  ON invite_codes FOR UPDATE
  USING (
    created_by = auth.uid()
    OR kitchen_id IN (
      SELECT kitchen_id FROM user_kitchens 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Creator or owner can delete invite codes"
  ON invite_codes FOR DELETE
  USING (
    created_by = auth.uid()
    OR kitchen_id IN (
      SELECT kitchen_id FROM user_kitchens 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Function to validate and use an invite code
CREATE OR REPLACE FUNCTION validate_and_use_invite_code(p_code TEXT, p_kitchen_id UUID)
RETURNS TABLE (
  valid BOOLEAN,
  error_message TEXT,
  result_kitchen_id UUID
) AS $$
DECLARE
  v_code_record RECORD;
BEGIN
  -- Find the code
  SELECT * INTO v_code_record FROM invite_codes
  WHERE code = p_code AND invite_codes.kitchen_id = p_kitchen_id;

  -- Check if code exists
  IF v_code_record IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid invite code'::TEXT, p_kitchen_id;
    RETURN;
  END IF;

  -- Check if active
  IF v_code_record.is_active = false THEN
    RETURN QUERY SELECT false, 'Invite code is no longer active'::TEXT, p_kitchen_id;
    RETURN;
  END IF;

  -- Check if expired
  IF v_code_record.expires_at < now() THEN
    RETURN QUERY SELECT false, 'Invite code has expired'::TEXT, p_kitchen_id;
    RETURN;
  END IF;

  -- Check if at max uses
  IF v_code_record.current_uses >= v_code_record.max_uses THEN
    RETURN QUERY SELECT false, 'Invite code has reached its use limit'::TEXT, p_kitchen_id;
    RETURN;
  END IF;

  -- Increment use count
  UPDATE invite_codes
  SET current_uses = current_uses + 1
  WHERE id = v_code_record.id;

  -- If we've hit max uses, deactivate
  IF (v_code_record.current_uses + 1) >= v_code_record.max_uses THEN
    UPDATE invite_codes
    SET is_active = false
    WHERE id = v_code_record.id;
  END IF;

  RETURN QUERY SELECT true, ''::TEXT, p_kitchen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a random code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN substr(md5(random()::text || clock_timestamp()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired codes (can be called manually or via scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_invite_codes()
RETURNS TABLE (
  deleted_count INT
) AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM invite_codes
  WHERE expires_at < now() AND is_active = true;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
