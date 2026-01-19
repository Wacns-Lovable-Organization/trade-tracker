-- Fix the ambiguous column reference in check_otp_rate_limit function
-- The issue is that 'blocked_until' is both a column name and used in the return type

CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(
  _email text,
  _ip_address text DEFAULT NULL,
  _max_attempts integer DEFAULT 5,
  _window_minutes integer DEFAULT 15,
  _block_minutes integer DEFAULT 30
)
RETURNS TABLE(
  allowed boolean,
  remaining_attempts integer,
  blocked_until timestamptz,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record otp_rate_limits%ROWTYPE;
  v_now timestamptz := now();
  v_window_start timestamptz := v_now - (_window_minutes || ' minutes')::interval;
  v_block_until timestamptz;
BEGIN
  -- Check for existing rate limit record
  SELECT * INTO v_record
  FROM otp_rate_limits r
  WHERE r.email = _email
  ORDER BY r.last_attempt_at DESC
  LIMIT 1;

  -- If blocked, check if block has expired
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN QUERY SELECT 
      false::boolean,
      0::integer,
      v_record.blocked_until,
      'Too many attempts. Please try again later.'::text;
    RETURN;
  END IF;

  -- If record exists and within window, check attempts
  IF v_record.id IS NOT NULL AND v_record.first_attempt_at > v_window_start THEN
    IF v_record.attempt_count >= _max_attempts THEN
      -- Block the user
      v_block_until := v_now + (_block_minutes || ' minutes')::interval;
      
      UPDATE otp_rate_limits r
      SET blocked_until = v_block_until,
          last_attempt_at = v_now
      WHERE r.id = v_record.id;

      RETURN QUERY SELECT 
        false::boolean,
        0::integer,
        v_block_until,
        'Too many attempts. Please try again later.'::text;
      RETURN;
    END IF;

    -- Increment attempt count
    UPDATE otp_rate_limits r
    SET attempt_count = r.attempt_count + 1,
        last_attempt_at = v_now,
        ip_address = COALESCE(_ip_address, r.ip_address)
    WHERE r.id = v_record.id;

    RETURN QUERY SELECT 
      true::boolean,
      (_max_attempts - v_record.attempt_count - 1)::integer,
      NULL::timestamptz,
      'OK'::text;
    RETURN;
  END IF;

  -- Create new record or reset if window expired
  IF v_record.id IS NOT NULL THEN
    UPDATE otp_rate_limits r
    SET attempt_count = 1,
        first_attempt_at = v_now,
        last_attempt_at = v_now,
        blocked_until = NULL,
        ip_address = COALESCE(_ip_address, r.ip_address)
    WHERE r.id = v_record.id;
  ELSE
    INSERT INTO otp_rate_limits (email, ip_address, attempt_count, first_attempt_at, last_attempt_at)
    VALUES (_email, _ip_address, 1, v_now, v_now);
  END IF;

  RETURN QUERY SELECT 
    true::boolean,
    (_max_attempts - 1)::integer,
    NULL::timestamptz,
    'OK'::text;
END;
$$;