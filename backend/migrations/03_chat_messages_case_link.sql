-- Adds case_id uuid to messages; provides case_channels(channel_id → case_id) mapping to backfill; leaves nullable until you seed mapping.

-- mapping: one channel -> one case (seed this table in app/setup as you know channels)
CREATE TABLE IF NOT EXISTS public.case_channels (
  channel_id uuid PRIMARY KEY,
  case_id    uuid NOT NULL REFERENCES public.cases(id)
);

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS case_id uuid;

UPDATE public.chat_messages m
SET case_id = cc.case_id
FROM public.case_channels cc
WHERE m.case_id IS NULL AND m.channel_id = cc.channel_id;

CREATE INDEX IF NOT EXISTS chat_messages_case_idx
  ON public.chat_messages(case_id, created_at DESC);
