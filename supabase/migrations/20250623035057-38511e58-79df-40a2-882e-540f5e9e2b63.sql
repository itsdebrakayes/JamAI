
-- Reorder columns in profiles table to have first_name and last_name after email
ALTER TABLE public.profiles 
ADD COLUMN temp_first_name TEXT,
ADD COLUMN temp_last_name TEXT;

-- Copy data to temporary columns
UPDATE public.profiles 
SET temp_first_name = first_name,
    temp_last_name = last_name;

-- Drop original columns
ALTER TABLE public.profiles 
DROP COLUMN first_name,
DROP COLUMN last_name;

-- Add columns back in the correct order (after email)
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT NOT NULL DEFAULT '',
ADD COLUMN last_name TEXT;

-- Copy data back from temporary columns
UPDATE public.profiles 
SET first_name = COALESCE(temp_first_name, ''),
    last_name = temp_last_name;

-- Drop temporary columns
ALTER TABLE public.profiles 
DROP COLUMN temp_first_name,
DROP COLUMN temp_last_name;
