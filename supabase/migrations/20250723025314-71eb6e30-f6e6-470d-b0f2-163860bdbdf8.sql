-- Create user memories table for dynamic memory storage
CREATE TABLE IF NOT EXISTS public.user_memories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  content jsonb DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'general',
  keywords text[] DEFAULT '{}',
  importance_score integer DEFAULT 3 CHECK (importance_score >= 1 AND importance_score <= 10),
  is_permanent boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own memories" 
ON public.user_memories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories" 
ON public.user_memories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" 
ON public.user_memories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.user_memories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX idx_user_memories_category ON public.user_memories(category);
CREATE INDEX idx_user_memories_keywords ON public.user_memories USING GIN(keywords);
CREATE INDEX idx_user_memories_created_at ON public.user_memories(created_at);

-- Create function to search memories by keywords
CREATE OR REPLACE FUNCTION public.search_user_memories(
  search_keywords text[],
  search_category text DEFAULT NULL,
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  category text,
  title text,
  content jsonb,
  keywords text[],
  importance_score integer,
  is_permanent boolean,
  expires_at timestamp with time zone,
  created_at timestamp with time zone
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

-- Create function to get recent memories by category
CREATE OR REPLACE FUNCTION public.get_recent_memories_by_category(
  days_back integer DEFAULT 30,
  limit_per_category integer DEFAULT 3
)
RETURNS TABLE(
  category text,
  title text,
  content jsonb,
  importance_score integer,
  created_at timestamp with time zone
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
    rm.content,
    rm.importance_score,
    rm.created_at
  FROM ranked_memories rm
  WHERE rm.rn <= limit_per_category
  ORDER BY rm.category, rm.importance_score DESC, rm.created_at DESC;
END;
$$;

-- Create function to cleanup expired memories
CREATE OR REPLACE FUNCTION public.cleanup_expired_memories()
RETURNS integer
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