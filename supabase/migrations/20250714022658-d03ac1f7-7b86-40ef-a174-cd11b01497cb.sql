-- Clean up duplicate sessions and ensure all messages are properly linked

-- Delete sessions that have no messages and are duplicates
DELETE FROM public.chat_sessions 
WHERE user_id = '57c3306a-52fa-48e5-a72c-3e366e112a8f' 
  AND message_count = 0 
  AND id NOT IN (
    SELECT DISTINCT session_id 
    FROM public.messages 
    WHERE user_id = '57c3306a-52fa-48e5-a72c-3e366e112a8f'
  );

-- Update message counts for sessions that actually have messages
UPDATE public.chat_sessions 
SET message_count = (
  SELECT COUNT(*) 
  FROM public.messages 
  WHERE session_id = chat_sessions.id 
    AND user_id = '57c3306a-52fa-48e5-a72c-3e366e112a8f'
)
WHERE user_id = '57c3306a-52fa-48e5-a72c-3e366e112a8f';