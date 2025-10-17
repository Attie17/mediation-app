SELECT 'cases.short_id exists' AS check, COUNT(*) FILTER (WHERE short_id IS NULL) AS nulls FROM public.cases;
SELECT 'uploads.case_uuid nulls' AS check, COUNT(*) AS cnt FROM public.uploads WHERE case_uuid IS NULL;
SELECT 'participants FK ok' AS check, COUNT(*) AS cnt
FROM information_schema.table_constraints
WHERE table_schema='public' AND table_name='case_participants' AND constraint_name='case_participants_case_uuid_fk';
SELECT 'events.case_id type' AS check, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='case_id';
SELECT 'documents.case_id exists' AS check, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='case_id') AS exists;
SELECT 'chat_messages.case_id exists' AS check, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_messages' AND column_name='case_id') AS exists;
