
-- Drop existing functions first
DROP FUNCTION IF EXISTS public.search_user_memories(text[], text, integer);
DROP FUNCTION IF EXISTS public.get_recent_memories_by_category(integer, integer);

-- Add new columns to existing user_memories table
ALTER TABLE public.user_memories 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update the importance_score column to have a default of 3 instead of 1
ALTER TABLE public.user_memories 
ALTER COLUMN importance_score SET DEFAULT 3;

-- Create an index for the expires_at column for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_memories_expires_at ON public.user_memories(expires_at) WHERE expires_at IS NOT NULL;

-- Create a function to clean up expired memories
CREATE OR REPLACE FUNCTION public.cleanup_expired_memories()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_memories 
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Create the updated search function with new return structure
CREATE OR REPLACE FUNCTION public.search_user_memories(
  search_keywords TEXT[],
  search_category TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  user_query TEXT,
  ai_response TEXT,
  content JSONB,
  keywords TEXT[],
  importance_score INTEGER,
  is_permanent BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up expired memories first
  PERFORM public.cleanup_expired_memories();
  
  RETURN QUERY
  SELECT 
    um.id,
    um.category,
    um.title,
    um.user_query,
    um.ai_response,
    um.content,
    um.keywords,
    um.importance_score,
    um.is_permanent,
    um.expires_at,
    um.created_at
  FROM public.user_memories um
  WHERE um.user_id = auth.uid()
    AND (um.expires_at IS NULL OR um.expires_at > now())
    AND (search_category IS NULL OR um.category = search_category)
    AND (
      search_keywords IS NULL 
      OR search_keywords = '{}' 
      OR um.keywords && search_keywords
      OR (um.title IS NOT NULL AND um.title ILIKE '%' || array_to_string(search_keywords, '%') || '%')
    )
  ORDER BY 
    um.is_permanent DESC,
    um.importance_score DESC,
    um.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create the updated recent memories function with new return structure
CREATE OR REPLACE FUNCTION public.get_recent_memories_by_category(
  days_back INTEGER DEFAULT 30,
  limit_per_category INTEGER DEFAULT 3
)
RETURNS TABLE (
  category TEXT,
  title TEXT,
  user_query TEXT,
  ai_response TEXT,
  content JSONB,
  importance_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up expired memories first
  PERFORM public.cleanup_expired_memories();
  
  RETURN QUERY
  WITH ranked_memories AS (
    SELECT 
      um.category,
      um.title,
      um.user_query,
      um.ai_response,
      um.content,
      um.importance_score,
      um.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY um.category 
        ORDER BY um.is_permanent DESC, um.importance_score DESC, um.created_at DESC
      ) as rn
    FROM public.user_memories um
    WHERE um.user_id = auth.uid()
      AND (um.expires_at IS NULL OR um.expires_at > now())
      AND um.created_at >= (now() - (days_back || ' days')::interval)
  )
  SELECT 
    rm.category,
    rm.title,
    rm.user_query,
    rm.ai_response,
    rm.content,
    rm.importance_score,
    rm.created_at
  FROM ranked_memories rm
  WHERE rm.rn <= limit_per_category
  ORDER BY rm.category, rm.importance_score DESC, rm.created_at DESC;
END;
$$;
