-- Restore separate chat sessions by identifying conversation breaks
-- Based on time gaps greater than 2 hours, we'll create new sessions

-- Step 1: Create a new session for the birthday message conversation
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Birthday Message Help',
  'Birthday Message Help',
  4,
  '2025-06-25 21:02:40.147463+00',
  '2025-06-25 21:11:57.766894+00'
);

-- Step 2: Create a new session for the email writing conversation  
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Email Writing Help',
  'Email Writing Help',
  8,
  '2025-06-24 22:27:30.178308+00',
  '2025-06-24 22:29:35.422066+00'
);

-- Step 3: Update the original session to only contain the Patois word conversation
UPDATE public.chat_sessions 
SET message_count = 2,
    title = 'Patois Word of the Day',
    auto_title = 'Patois Word of the Day',
    updated_at = '2025-06-24 18:15:41.911792+00'
WHERE id = '3b4f6d72-b7b5-4cbb-a1c1-113b7ced119b';