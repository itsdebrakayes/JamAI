
-- Update the get_subscription_limits function to include both special email addresses
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
  -- Special cases for ultra access users
  IF user_email IN ('debrakayesam@gmail.com', 'camillewllms@gmail.com') THEN
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

-- Update profiles table to set subscription tier for both users
UPDATE public.profiles 
SET subscription_tier = 'jamai_ultra' 
WHERE email IN ('debrakayesam@gmail.com', 'camillewllms@gmail.com');
