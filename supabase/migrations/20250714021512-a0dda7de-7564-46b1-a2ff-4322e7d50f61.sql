-- Clean up existing chat sessions and consolidate under user_id
-- Step 1: Update chat_sessions to use user_id as the primary session identifier
-- For existing sessions, consolidate them under their user_id

UPDATE public.chat_sessions 
SET id = user_id 
WHERE user_id IS NOT NULL 
  AND id != user_id
  AND EXISTS (
    SELECT 1 FROM public.messages 
    WHERE session_id = chat_sessions.id
  );

-- Step 2: Update all messages to use the user_id as session_id for authenticated users
UPDATE public.messages 
SET session_id = user_id 
WHERE user_id IS NOT NULL 
  AND session_id != user_id;

-- Step 3: Remove orphaned chat sessions that have no messages
DELETE FROM public.chat_sessions 
WHERE id NOT IN (
  SELECT DISTINCT session_id 
  FROM public.messages 
  WHERE session_id IS NOT NULL
);

-- Step 4: Update message counts to reflect actual message counts
UPDATE public.chat_sessions 
SET message_count = (
  SELECT COUNT(*) 
  FROM public.messages 
  WHERE session_id = chat_sessions.id
)
WHERE id IN (
  SELECT DISTINCT session_id 
  FROM public.messages
);

-- Step 5: For future consistency, add a constraint to ensure session_id matches user_id for authenticated users
-- This will help prevent future inconsistencies