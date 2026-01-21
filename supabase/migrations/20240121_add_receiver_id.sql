-- Add receiver_id for better notifications
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES auth.users;

-- Update RLS to allow users to see messages they received (redundant with existing but clearer)
-- Existing: "Users can see messages for their applications"
-- No change needed to Select policy if it uses application relation.
-- But we should index message receiver for speed.
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);
