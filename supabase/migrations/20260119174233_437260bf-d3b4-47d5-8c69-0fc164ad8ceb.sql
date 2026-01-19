-- Create rate limiting table for OTP attempts
CREATE TABLE public.otp_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Create index for fast lookups
CREATE INDEX idx_otp_rate_limits_email ON public.otp_rate_limits(email);
CREATE INDEX idx_otp_rate_limits_ip ON public.otp_rate_limits(ip_address);

-- Enable RLS (public table but with controlled access)
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies needed - accessed only by edge functions with service role

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(
  _email TEXT,
  _ip_address TEXT DEFAULT NULL,
  _max_attempts INTEGER DEFAULT 5,
  _window_minutes INTEGER DEFAULT 15,
  _block_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining_attempts INTEGER,
  blocked_until TIMESTAMP WITH TIME ZONE,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _record RECORD;
  _window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  _window_start := now() - (_window_minutes || ' minutes')::interval;
  
  -- Check for existing record
  SELECT * INTO _record
  FROM public.otp_rate_limits
  WHERE email = lower(_email)
    AND (first_attempt_at > _window_start OR blocked_until > now());
  
  -- If blocked, return blocked status
  IF _record.blocked_until IS NOT NULL AND _record.blocked_until > now() THEN
    RETURN QUERY SELECT 
      FALSE,
      0,
      _record.blocked_until,
      'Too many attempts. Please try again later.';
    RETURN;
  END IF;
  
  -- If no record or window expired, create/reset
  IF _record IS NULL OR _record.first_attempt_at < _window_start THEN
    INSERT INTO public.otp_rate_limits (email, ip_address, attempt_count, first_attempt_at, last_attempt_at)
    VALUES (lower(_email), _ip_address, 1, now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    -- Delete old record if exists
    DELETE FROM public.otp_rate_limits 
    WHERE email = lower(_email) AND first_attempt_at < _window_start;
    
    RETURN QUERY SELECT 
      TRUE,
      _max_attempts - 1,
      NULL::TIMESTAMP WITH TIME ZONE,
      'OK';
    RETURN;
  END IF;
  
  -- Update attempt count
  UPDATE public.otp_rate_limits
  SET 
    attempt_count = attempt_count + 1,
    last_attempt_at = now(),
    blocked_until = CASE 
      WHEN attempt_count + 1 >= _max_attempts 
      THEN now() + (_block_minutes || ' minutes')::interval
      ELSE NULL
    END
  WHERE id = _record.id
  RETURNING * INTO _record;
  
  -- Check if now blocked
  IF _record.blocked_until IS NOT NULL THEN
    RETURN QUERY SELECT 
      FALSE,
      0,
      _record.blocked_until,
      'Too many attempts. Please try again later.';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    TRUE,
    _max_attempts - _record.attempt_count,
    NULL::TIMESTAMP WITH TIME ZONE,
    'OK';
END;
$$;

-- Cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.otp_rate_limits
  WHERE first_attempt_at < now() - interval '24 hours'
    AND (blocked_until IS NULL OR blocked_until < now());
END;
$$;