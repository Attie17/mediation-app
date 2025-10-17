const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });
dotenv.config({ path: path.resolve(__dirname, 'tests', '.env') });

const sql = `
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
`;

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL environment variable.');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ enforce_mediator_constraint function updated successfully');
  } catch (error) {
    console.error('❌ Failed to update enforce_mediator_constraint function');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch((err) => {
      console.error('⚠️ Failed to close database connection');
      console.error(err.message);
    });
  }
})();
