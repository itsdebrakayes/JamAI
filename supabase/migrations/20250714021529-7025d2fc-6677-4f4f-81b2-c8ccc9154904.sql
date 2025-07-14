-- Clean up existing chat sessions safely
-- Step 1: First, identify and merge duplicate sessions for the same user
WITH user_sessions AS (
  SELECT user_id, MIN(created_at) as earliest_session, 
         array_agg(id ORDER BY created_at) as session_ids
  FROM public.chat_sessions 
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) > 1
),
sessions_to_keep AS (
  SELECT user_id, session_ids[1] as keep_session_id, 
         session_ids[2:] as merge_session_ids
  FROM user_sessions
)
-- Update messages to point to the session we're keeping
UPDATE public.messages 
SET session_id = stk.keep_session_id
FROM sessions_to_keep stk
WHERE messages.session_id = ANY(stk.merge_session_ids);

-- Step 2: Delete duplicate sessions (keeping only the earliest one per user)
WITH user_sessions AS (
  SELECT user_id, MIN(created_at) as earliest_session
  FROM public.chat_sessions 
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
DELETE FROM public.chat_sessions 
WHERE user_id IN (SELECT user_id FROM user_sessions)
  AND created_at > (
    SELECT earliest_session 
    FROM user_sessions us 
    WHERE us.user_id = chat_sessions.user_id
  );

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
);