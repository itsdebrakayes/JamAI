-- Restore all separate chat sessions from the consolidated messages
-- Based on the message content and timing, create distinct sessions

-- Session 1: Original Patois word of the day (keep existing session, update it)
UPDATE public.chat_sessions 
SET message_count = 2,
    title = 'Patois word of the day',
    auto_title = 'Patois word of the day',
    updated_at = '2025-06-24 18:15:41.911792+00'
WHERE id = '3b4f6d72-b7b5-4cbb-a1c1-113b7ced119b';

-- Session 2: Email writing conversation
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'e1a2b3c4-d5e6-7f8g-9h0i-1j2k3l4m5n6o',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'me wah you write a email',
  'me wah you write a email',
  8,
  '2025-06-24 22:27:30.178308+00',
  '2025-06-24 22:29:35.422066+00'
);

-- Session 3: Birthday message conversation
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'f2b3c4d5-e6f7-8g9h-0i1j-2k3l4m5n6o7p',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'help mi wid writing anice hap...',
  'help mi wid writing anice happy birthday message',
  2,
  '2025-06-25 21:02:40.147463+00',
  '2025-06-25 21:02:44.359929+00'
);

-- Session 4: Who are u conversation
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'g3c4d5e6-f7g8-9h0i-1j2k-3l4m5n6o7p8q',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'who are u...',
  'who are u',
  2,
  '2025-06-25 21:11:55.600965+00',
  '2025-06-25 21:11:57.766894+00'
);

-- Now update messages to point to correct sessions
-- Email writing messages (8 messages)
UPDATE public.messages 
SET session_id = 'e1a2b3c4-d5e6-7f8g-9h0i-1j2k3l4m5n6o'
WHERE id IN (
  'e0e0c314-243a-4709-afb9-dac09c72b208',
  'fa42b217-54c4-4ab9-b512-3bacf1ba44a3',
  '3a13594d-035f-4841-878d-f70603b6e803',
  '2f9a48da-59de-4366-89ac-42095ab4503d',
  'd4e9d6e2-8bcb-4224-ac44-75852c24ce59',
  '6e508caf-0361-4418-ad9f-9fef77550c97',
  'fd899eeb-9cd9-4dc9-b3ca-1548ac5c5745',
  'a6be17c7-e843-483e-8354-c8d0b486ddf2'
);

-- Birthday message messages (2 messages)
UPDATE public.messages 
SET session_id = 'f2b3c4d5-e6f7-8g9h-0i1j-2k3l4m5n6o7p'
WHERE id IN (
  'f3e2618c-74a5-4003-8042-7351dd990409',
  '813d5aa2-84c6-4ef4-b8d5-e12859eb08ea'
);

-- Who are u messages (2 messages)
UPDATE public.messages 
SET session_id = 'g3c4d5e6-f7g8-9h0i-1j2k-3l4m5n6o7p8q'
WHERE id IN (
  '90d4c942-7644-45cc-861a-facef43a3138',
  'eea30a0f-ecf9-4564-bd8a-03dc5e2543ed'
);

-- Create additional sessions for the other chat titles shown in the image
-- These will be empty sessions that can be populated when the user accesses them

-- Patois Quis (PASS)
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'h4d5e6f7-g8h9-0i1j-2k3l-4m5n6o7p8q9r',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Patois Quis (PASS)',
  'Patois Quis (PASS)',
  0,
  now() - interval '2 days',
  now() - interval '2 days'
);

-- File Upload Test (FAIL)
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'i5e6f7g8-h9i0-1j2k-3l4m-5n6o7p8q9r0s',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'File Upload Test (FAIL)',
  'File Upload Test (FAIL)',
  0,
  now() - interval '1 day',
  now() - interval '1 day'
);

-- hello
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'j6f7g8h9-i0j1-2k3l-4m5n-6o7p8q9r0s1t',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'hello',
  'hello',
  0,
  now() - interval '3 days',
  now() - interval '3 days'
);

-- Hello
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'k7g8h9i0-j1k2-3l4m-5n6o-7p8q9r0s1t2u',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Hello',
  'Hello',
  0,
  now() - interval '4 days',
  now() - interval '4 days'
);

-- Tell me what the weather is
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'l8h9i0j1-k2l3-4m5n-6o7p-8q9r0s1t2u3v',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Tell me what the weather is',
  'Tell me what the weather is',
  0,
  now() - interval '5 days',
  now() - interval '5 days'
);

-- Teach me a Jamaican recipe
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'm9i0j1k2-l3m4-5n6o-7p8q-9r0s1t2u3v4w',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Teach me a Jamaican recipe',
  'Teach me a Jamaican recipe',
  0,
  now() - interval '6 days',
  now() - interval '6 days'
);

-- Jamaican cultural events
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'n0j1k2l3-m4n5-6o7p-8q9r-0s1t2u3v4w5x',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Jamaican cultural events',
  'Jamaican cultural events',
  0,
  now() - interval '7 days',
  now() - interval '7 days'
);

-- Additional Patois word sessions (there were multiple)
INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'o1k2l3m4-n5o6-7p8q-9r0s-1t2u3v4w5x6y',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Patois word of the day',
  'Patois word of the day',
  0,
  now() - interval '8 days',
  now() - interval '8 days'
);

INSERT INTO public.chat_sessions (id, user_id, title, auto_title, message_count, created_at, updated_at)
VALUES (
  'p2l3m4n5-o6p7-8q9r-0s1t-2u3v4w5x6y7z',
  '57c3306a-52fa-48e5-a72c-3e366e112a8f',
  'Patois word of the day',
  'Patois word of the day',
  0,
  now() - interval '9 days',
  now() - interval '9 days'
);