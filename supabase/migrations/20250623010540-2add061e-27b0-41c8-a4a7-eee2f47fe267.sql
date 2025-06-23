
-- Create user_memories table for storing AI assistant memory across devices
CREATE TABLE public.user_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('recipe', 'preference', 'recommendation', 'fact', 'conversation')),
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  importance_score INTEGER NOT NULL DEFAULT 1 CHECK (importance_score >= 1 AND importance_score <= 5),
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- Users can only access their own memories
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

-- Create indexes for efficient querying
CREATE INDEX idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX idx_user_memories_category ON public.user_memories(category);
CREATE INDEX idx_user_memories_keywords ON public.user_memories USING GIN(keywords);
CREATE INDEX idx_user_memories_importance ON public.user_memories(importance_score DESC);
CREATE INDEX idx_user_memories_created_at ON public.user_memories(created_at DESC);

-- Function to search user memories by keywords and category
CREATE OR REPLACE FUNCTION public.search_user_memories(
  search_keywords TEXT[],
  search_category TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  user_query TEXT,
  ai_response TEXT,
  keywords TEXT[],
  importance_score INTEGER,
  is_permanent BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.id,
    um.category,
    um.user_query,
    um.ai_response,
    um.keywords,
    um.importance_score,
    um.is_permanent,
    um.created_at
  FROM public.user_memories um
  WHERE um.user_id = auth.uid()
    AND (search_category IS NULL OR um.category = search_category)
    AND (
      search_keywords IS NULL 
      OR search_keywords = '{}' 
      OR um.keywords && search_keywords
    )
  ORDER BY 
    um.is_permanent DESC,
    um.importance_score DESC,
    um.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get recent memories by category
CREATE OR REPLACE FUNCTION public.get_recent_memories_by_category(
  days_back INTEGER DEFAULT 30,
  limit_per_category INTEGER DEFAULT 3
)
RETURNS TABLE (
  category TEXT,
  user_query TEXT,
  ai_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_memories AS (
    SELECT 
      um.category,
      um.user_query,
      um.ai_response,
      um.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY um.category 
        ORDER BY um.is_permanent DESC, um.importance_score DESC, um.created_at DESC
      ) as rn
    FROM public.user_memories um
    WHERE um.user_id = auth.uid()
      AND um.created_at >= (now() - (days_back || ' days')::interval)
  )
  SELECT 
    rm.category,
    rm.user_query,
    rm.ai_response,
    rm.created_at
  FROM ranked_memories rm
  WHERE rm.rn <= limit_per_category
  ORDER BY rm.category, rm.created_at DESC;
END;
$$;
