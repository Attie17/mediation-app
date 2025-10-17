-- Handles any current type (missing / bigint / uuid). Ends with an FK and index.

DO $$
DECLARE coltype text;
BEGIN
  SELECT data_type INTO coltype
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='events' AND column_name='case_id';

  IF coltype IS NULL THEN
    -- no column: add uuid + FK
    EXECUTE 'ALTER TABLE public.events ADD COLUMN case_id uuid';
    EXECUTE 'ALTER TABLE public.events ADD CONSTRAINT events_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS events_case_idx ON public.events(case_id, starts_at DESC)';
  ELSIF coltype = 'uuid' THEN
    -- has uuid: ensure FK + index
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema='public' AND table_name='events' AND constraint_type='FOREIGN KEY' AND constraint_name='events_case_fk'
    ) THEN
      EXECUTE 'ALTER TABLE public.events ADD CONSTRAINT events_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id)';
    END IF;
    EXECUTE 'CREATE INDEX IF NOT EXISTS events_case_idx ON public.events(case_id, starts_at DESC)';
  ELSIF coltype = 'bigint' THEN
    -- currently bigint: point it at cases.short_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema='public' AND table_name='events' AND constraint_type='FOREIGN KEY' AND constraint_name='events_case_short_fk'
    ) THEN
      EXECUTE 'ALTER TABLE public.events ADD CONSTRAINT events_case_short_fk FOREIGN KEY (case_id) REFERENCES public.cases(short_id)';
    END IF;
    EXECUTE 'CREATE INDEX IF NOT EXISTS events_case_idx ON public.events(case_id, starts_at DESC)';
  END IF;
END$$;
