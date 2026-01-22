-- Migration: Enable Account Deletion via Cascading Deletes

-- 1. Create RPC function for self-deletion
-- This allows a user to delete their own account from auth.users (which triggers cascades)
CREATE OR REPLACE FUNCTION delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 2. Update Seekers FK
ALTER TABLE public.seekers 
DROP CONSTRAINT IF EXISTS seekers_id_fkey,
ADD CONSTRAINT seekers_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Update Employers FK
ALTER TABLE public.employers
DROP CONSTRAINT IF EXISTS employers_id_fkey,
ADD CONSTRAINT employers_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Update Jobs FK
ALTER TABLE public.jobs
DROP CONSTRAINT IF EXISTS jobs_employer_id_fkey,
ADD CONSTRAINT jobs_employer_id_fkey 
  FOREIGN KEY (employer_id) REFERENCES public.employers(id) ON DELETE CASCADE;

-- 5. Update Applications FKs
ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_job_id_fkey,
ADD CONSTRAINT applications_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_seeker_id_fkey,
ADD CONSTRAINT applications_seeker_id_fkey
  FOREIGN KEY (seeker_id) REFERENCES public.seekers(id) ON DELETE CASCADE;

-- 6. Update Messages FKs (assuming standard FK naming or checking existence)
-- First check if conversations table exists and update it
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
        
        ALTER TABLE public.conversations
        DROP CONSTRAINT IF EXISTS conversations_employer_id_fkey,
        ADD CONSTRAINT conversations_employer_id_fkey
            FOREIGN KEY (employer_id) REFERENCES public.employers(id) ON DELETE CASCADE;

        ALTER TABLE public.conversations
        DROP CONSTRAINT IF EXISTS conversations_seeker_id_fkey,
        ADD CONSTRAINT conversations_seeker_id_fkey
            FOREIGN KEY (seeker_id) REFERENCES public.seekers(id) ON DELETE CASCADE;
            
    END IF;
END $$;

-- Update Messages Sender FK
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update Messages Conversation FK (if 'conversations' table is used, messages usually link to it)
-- If messages link to 'applications' as per previous schema files, handle that.
-- Note: '20240121_fix_schema.sql' had "conversation_id uuid NOT NULL" linking to "application.id" in comments?
-- Let's assume standard behavior based on 'messages/page.tsx' usage which uses 'conversations' table.
DO $$
BEGIN
    -- Only alter if constraint exists or if we are sure about the relationship
    -- The new messages page uses 'conversations' table. 
    -- If messages.conversation_id references conversations.id:
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_conversation_id_fkey'
    ) THEN
        ALTER TABLE public.messages
        DROP CONSTRAINT messages_conversation_id_fkey,
        ADD CONSTRAINT messages_conversation_id_fkey
            FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
    END IF;
END $$;
