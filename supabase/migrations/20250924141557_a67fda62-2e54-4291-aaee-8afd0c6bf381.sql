-- Add premium-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have trial_started_at if they don't have it
UPDATE public.profiles 
SET trial_started_at = COALESCE(trial_started_at, NOW())
WHERE trial_started_at IS NULL;