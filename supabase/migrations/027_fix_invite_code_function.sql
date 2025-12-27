-- Fix ambiguous column reference in validate_and_use_invite_code function
DROP FUNCTION IF EXISTS validate_and_use_invite_code(TEXT, UUID);

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
  WHERE code = p_code AND kitchen_id = p_kitchen_id;

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
