
-- Reorder columns in profiles table to have subscription_tier after last_name and timestamps at the end
ALTER TABLE public.profiles 
ADD COLUMN temp_subscription_tier TEXT,
ADD COLUMN temp_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN temp_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN temp_avatar_url TEXT,
ADD COLUMN temp_preferences JSONB;

-- Copy data to temporary columns
UPDATE public.profiles 
SET temp_subscription_tier = subscription_tier,
    temp_created_at = created_at,
    temp_updated_at = updated_at,
    temp_avatar_url = avatar_url,
    temp_preferences = preferences;

-- Drop original columns
ALTER TABLE public.profiles 
DROP COLUMN subscription_tier,
DROP COLUMN created_at,
DROP COLUMN updated_at,
DROP COLUMN avatar_url,
DROP COLUMN preferences;

-- Add columns back in the correct order
ALTER TABLE public.profiles 
ADD COLUMN subscription_tier TEXT DEFAULT 'free',
ADD COLUMN avatar_url TEXT,
ADD COLUMN preferences JSONB DEFAULT '{}',
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Copy data back from temporary columns
UPDATE public.profiles 
SET subscription_tier = COALESCE(temp_subscription_tier, 'free'),
    avatar_url = temp_avatar_url,
    preferences = COALESCE(temp_preferences, '{}'),
    created_at = temp_created_at,
    updated_at = temp_updated_at;

-- Drop temporary columns
ALTER TABLE public.profiles 
DROP COLUMN temp_subscription_tier,
DROP COLUMN temp_created_at,
DROP COLUMN temp_updated_at,
DROP COLUMN temp_avatar_url,
DROP COLUMN temp_preferences;
