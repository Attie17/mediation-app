-- Adds documents.case_id uuid, tries to backfill from uploads.case_uuid (if present), then adds FK+index (nullable is fine until fully backfilled).

DO $$
DECLARE has_case boolean; has_upload boolean; has_up_uuid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='case_id'
  ) INTO has_case;

  IF NOT has_case THEN
    EXECUTE 'ALTER TABLE public.documents ADD COLUMN case_id uuid';
  END IF;

  -- best-effort backfill: documents.upload_id -> uploads.case_uuid
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='upload_id'
  ) INTO has_upload;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='uploads' AND column_name='case_uuid'
  ) INTO has_up_uuid;

  IF has_upload AND has_up_uuid THEN
    EXECUTE '
      UPDATE public.documents d
      SET case_id = u.case_uuid
      FROM public.uploads u
      WHERE d.case_id IS NULL AND d.upload_id = u.id
    ';
  END IF;

  EXECUTE 'CREATE INDEX IF NOT EXISTS documents_case_idx ON public.documents(case_id)';

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='documents' AND constraint_name='documents_case_fk'
  ) THEN
    EXECUTE 'ALTER TABLE public.documents ADD CONSTRAINT documents_case_fk FOREIGN KEY (case_id) REFERENCES public.cases(id)';
  END IF;
END$$;
