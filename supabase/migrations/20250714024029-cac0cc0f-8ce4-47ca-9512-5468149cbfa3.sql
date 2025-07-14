-- Mark corrupted chat sessions with 0 messages as test cases
UPDATE public.chat_sessions 
SET title = '**[CORRUPTED]** ' || title,
    updated_at = now()
WHERE user_id = '57c3306a-52fa-48e5-a72c-3e366e112a8f' 
  AND message_count = 0 
  AND title NOT LIKE '**[CORRUPTED]**%';