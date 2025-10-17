-- Fix chat_messages.case_id to be bigint instead of uuid to match cases.id

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.chat_messages 
  DROP CONSTRAINT IF EXISTS chat_messages_case_id_fkey;

-- Drop the existing uuid column if it exists
ALTER TABLE public.chat_messages 
  DROP COLUMN IF EXISTS case_id CASCADE;

-- Add it back as bigint
ALTER TABLE public.chat_messages
  ADD COLUMN case_id bigint REFERENCES public.cases(id) ON DELETE CASCADE;

-- Recreate the index
DROP INDEX IF EXISTS chat_messages_case_idx;
CREATE INDEX chat_messages_case_idx 
  ON public.chat_messages(case_id, created_at DESC);

-- Also fix case_channels table
DROP TABLE IF EXISTS public.case_channels;
CREATE TABLE IF NOT EXISTS public.case_channels (
  channel_id uuid PRIMARY KEY,
  case_id bigint NOT NULL REFERENCES public.cases(id)
);
