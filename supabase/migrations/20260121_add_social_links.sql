-- Add social_links column to seekers and employers
ALTER TABLE public.seekers ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.seekers ADD COLUMN IF NOT EXISTS avatar_url text;
