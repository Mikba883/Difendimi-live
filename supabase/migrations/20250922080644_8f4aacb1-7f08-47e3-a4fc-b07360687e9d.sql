-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('legal-docs', 'legal-docs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('temp-uploads', 'temp-uploads', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for legal-docs bucket
CREATE POLICY "Users can view own legal docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'legal-docs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own legal docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'legal-docs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for temp-uploads bucket
CREATE POLICY "Users can view own temp uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own temp files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own temp files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'temp-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public assets bucket policies
CREATE POLICY "Anyone can view public assets" ON storage.objects
FOR SELECT USING (bucket_id = 'public-assets');

-- Create case status enum
DO $$ BEGIN
  CREATE TYPE case_status AS ENUM (
    'draft', 'collecting', 'queued', 'processing', 'ready', 'error', 'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update cases table with new fields
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS job_id text UNIQUE,
ADD COLUMN IF NOT EXISTS case_type text,
ADD COLUMN IF NOT EXISTS status case_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS previous_context text,
ADD COLUMN IF NOT EXISTS case_text text,
ADD COLUMN IF NOT EXISTS pii_scrubbed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS jurisdiction text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS area_of_law text[],
ADD COLUMN IF NOT EXISTS search_plan jsonb,
ADD COLUMN IF NOT EXISTS legal_signals jsonb,
ADD COLUMN IF NOT EXISTS classification jsonb,
ADD COLUMN IF NOT EXISTS report jsonb,
ADD COLUMN IF NOT EXISTS documents jsonb,
ADD COLUMN IF NOT EXISTS error_message text;

-- Rename user_id to created_by if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'cases' AND column_name = 'user_id') THEN
    ALTER TABLE public.cases RENAME COLUMN user_id TO created_by;
  END IF;
END $$;

-- Update existing RLS policies to use created_by
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can create their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete their own cases" ON public.cases;

CREATE POLICY "Users can view their own cases" 
ON public.cases FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own cases" 
ON public.cases FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own cases" 
ON public.cases FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own cases" 
ON public.cases FOR DELETE 
USING (auth.uid() = created_by);