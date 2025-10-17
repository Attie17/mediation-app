-- Fix enforce_mediator_constraint trigger to return OLD on delete operations

CREATE OR REPLACE FUNCTION public.enforce_mediator_constraint()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'mediator' AND OLD.status = 'active' THEN
            PERFORM 1
            FROM case_participants
            WHERE case_id = OLD.case_id
              AND role = 'mediator'
              AND status = 'active'
              AND id <> OLD.id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Cannot delete the last active mediator for case %', OLD.case_id;
            END IF;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;
