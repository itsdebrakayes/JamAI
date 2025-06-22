
-- Create whitelabeling configuration table
CREATE TABLE public.whitelabel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  brand_name TEXT NOT NULL DEFAULT 'JamAI',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#10B981',
  secondary_color TEXT DEFAULT '#F59E0B',
  accent_color TEXT DEFAULT '#3B82F6',
  custom_css TEXT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('day', now()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT date_trunc('day', now()) + interval '1 day',
  messages_used INTEGER DEFAULT 0,
  media_uploads_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Create API keys management table
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT NOT NULL CHECK (service_name IN ('openai', 'gemini', 'elevenlabs', 'google_maps')),
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_name)
);

-- Add intelligent naming fields to chat_sessions
ALTER TABLE public.chat_sessions 
ADD COLUMN auto_title TEXT,
ADD COLUMN summary TEXT,
ADD COLUMN keywords TEXT[],
ADD COLUMN message_count INTEGER DEFAULT 0;

-- Enable RLS for new tables
ALTER TABLE public.whitelabel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for whitelabel_configs (read-only for all authenticated users)
CREATE POLICY "Anyone can view whitelabel configs" 
  ON public.whitelabel_configs 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- RLS policies for usage_tracking
CREATE POLICY "Users can view their own usage" 
  ON public.usage_tracking 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
  ON public.usage_tracking 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
  ON public.usage_tracking 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for user_api_keys
CREATE POLICY "Users can manage their own API keys" 
  ON public.user_api_keys 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Function to get subscription limits
CREATE OR REPLACE FUNCTION public.get_subscription_limits(user_email TEXT)
RETURNS TABLE(
  tier TEXT,
  daily_message_limit INTEGER,
  daily_media_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Special case for debrakayesam@gmail.com
  IF user_email = 'debrakayesam@gmail.com' THEN
    RETURN QUERY SELECT 'jamai_ultra'::TEXT, -1::INTEGER, -1::INTEGER;
    RETURN;
  END IF;

  -- Get user's subscription tier from profiles
  RETURN QUERY
  SELECT 
    COALESCE(p.subscription_tier, 'free')::TEXT,
    CASE 
      WHEN COALESCE(p.subscription_tier, 'free') = 'free' THEN 50
      WHEN p.subscription_tier = 'jamai_plus' THEN 500
      WHEN p.subscription_tier = 'jamai_ultra' THEN -1
      ELSE 50
    END::INTEGER as daily_message_limit,
    CASE 
      WHEN COALESCE(p.subscription_tier, 'free') = 'free' THEN 5
      WHEN p.subscription_tier = 'jamai_plus' THEN 20
      WHEN p.subscription_tier = 'jamai_ultra' THEN -1
      ELSE 5
    END::INTEGER as daily_media_limit
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(limit_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER;
  user_limit INTEGER;
  user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Get current usage for today
  SELECT 
    CASE 
      WHEN limit_type = 'messages' THEN COALESCE(messages_used, 0)
      WHEN limit_type = 'media' THEN COALESCE(media_uploads_used, 0)
      ELSE 0
    END
  INTO current_usage
  FROM public.usage_tracking 
  WHERE user_id = auth.uid() 
    AND period_start = date_trunc('day', now());

  -- Get user's limit
  IF limit_type = 'messages' THEN
    SELECT daily_message_limit INTO user_limit FROM public.get_subscription_limits(user_email);
  ELSIF limit_type = 'media' THEN
    SELECT daily_media_limit INTO user_limit FROM public.get_subscription_limits(user_email);
  END IF;

  -- If limit is -1 (unlimited), return true
  IF user_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN COALESCE(current_usage, 0) < user_limit;
END;
$$;

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(usage_type TEXT, amount INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update usage for today
  INSERT INTO public.usage_tracking (user_id, period_start, period_end, messages_used, media_uploads_used)
  VALUES (
    auth.uid(),
    date_trunc('day', now()),
    date_trunc('day', now()) + interval '1 day',
    CASE WHEN usage_type = 'messages' THEN amount ELSE 0 END,
    CASE WHEN usage_type = 'media' THEN amount ELSE 0 END
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    messages_used = CASE 
      WHEN usage_type = 'messages' THEN usage_tracking.messages_used + amount
      ELSE usage_tracking.messages_used
    END,
    media_uploads_used = CASE 
      WHEN usage_type = 'media' THEN usage_tracking.media_uploads_used + amount
      ELSE usage_tracking.media_uploads_used
    END,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Function to generate intelligent chat titles
CREATE OR REPLACE FUNCTION public.generate_chat_title(session_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  first_user_message TEXT;
  message_count INTEGER;
  title TEXT;
BEGIN
  -- Get the first user message and total count
  SELECT content, 
         (SELECT COUNT(*) FROM public.messages WHERE session_id = generate_chat_title.session_id)
  INTO first_user_message, message_count
  FROM public.messages 
  WHERE session_id = generate_chat_title.session_id 
    AND is_user = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- Generate title based on first message
  IF first_user_message IS NOT NULL THEN
    -- Truncate and clean up the message for title
    title := CASE 
      WHEN length(first_user_message) > 30 THEN 
        left(first_user_message, 30) || '...'
      ELSE first_user_message
    END;
    
    -- Update the chat session with auto title
    UPDATE public.chat_sessions 
    SET auto_title = title, 
        message_count = generate_chat_title.message_count,
        updated_at = now()
    WHERE id = generate_chat_title.session_id;
    
    RETURN title;
  END IF;

  RETURN 'New Chat';
END;
$$;

-- Update profiles table to include subscription tier options
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check,
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'jamai_plus', 'jamai_ultra'));

-- Set special user to jamai_ultra
UPDATE public.profiles 
SET subscription_tier = 'jamai_ultra' 
WHERE email = 'debrakayesam@gmail.com';

-- Create indexes for performance
CREATE INDEX idx_usage_tracking_user_period ON public.usage_tracking(user_id, period_start);
CREATE INDEX idx_user_api_keys_user_service ON public.user_api_keys(user_id, service_name);
CREATE INDEX idx_chat_sessions_auto_title ON public.chat_sessions(auto_title);
CREATE INDEX idx_whitelabel_configs_domain ON public.whitelabel_configs(domain);
