-- Move messages to their correct sessions based on conversation timing

-- Move birthday message conversation to new session
UPDATE public.messages 
SET session_id = '12a88c65-12cd-4d8d-8035-f50052205743'
WHERE session_id = '3b4f6d72-b7b5-4cbb-a1c1-113b7ced119b'
  AND created_at >= '2025-06-25 21:02:40.147463+00';

-- Move email writing conversation to new session  
UPDATE public.messages 
SET session_id = 'f70b1c89-b483-448d-bf15-382b80f44b69'
WHERE session_id = '3b4f6d72-b7b5-4cbb-a1c1-113b7ced119b'
  AND created_at >= '2025-06-24 22:27:30.178308+00'
  AND created_at < '2025-06-25 21:02:40.147463+00';