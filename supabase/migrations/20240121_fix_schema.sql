-- 1. Add Job Status Enum and Column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('open', 'filled', 'on_hold', 'closed');
  END IF;
END $$;

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status job_status DEFAULT 'open';

-- 2. Allow Employers to update applications (status) - MISSING POLICY
DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON public.applications;
CREATE POLICY "Employers can update applications for their jobs" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid())
);

-- 3. Messages Table (Required for functionality)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid NOT NULL, -- Links to application.id
  sender_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()),
  read_at timestamp WITH time zone
);

-- 4. Messages Policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see messages for their applications" ON public.messages;
CREATE POLICY "Users can see messages for their applications" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications 
    WHERE applications.id = messages.conversation_id::uuid 
    AND (
      applications.seeker_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Users can insert messages for their applications" ON public.messages;
CREATE POLICY "Users can insert messages for their applications" ON public.messages FOR INSERT WITH CHECK (
   EXISTS (
    SELECT 1 FROM public.applications 
    WHERE applications.id = messages.conversation_id::uuid 
    AND (
      applications.seeker_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid())
    )
  )
);
