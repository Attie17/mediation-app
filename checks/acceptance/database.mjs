import { PGlite } from '@electric-sql/pglite';
// Memory only: no filesystem data directory or database connection string.
export const database = new PGlite('memory://');
export const queries = [];
export const pool = {
  async connect() { return { query: pool.query.bind(pool), release() {} }; },
  async query(sql, values) {
    queries.push(sql);
    const result = await database.query(sql, values);
    return { ...result, rowCount: result.rows.length };
  }
};
export const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export async function reset({ participantStatus = true, caseMediator = true } = {}) {
  queries.length = 0;
  await database.exec(`
    DROP TABLE IF EXISTS case_assignments, uploads, case_participants, cases, app_users;
    CREATE SCHEMA IF NOT EXISTS auth;
    DROP TABLE IF EXISTS auth.users;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
    CREATE TABLE app_users (user_id uuid PRIMARY KEY, id uuid GENERATED ALWAYS AS (user_id) STORED,
      organization_id uuid, name text, email text, role text);
    CREATE TABLE cases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), short_id serial UNIQUE, organization_id uuid,
      ${caseMediator ? 'mediator_id uuid,' : ''}
      title text,description text,status text,closed_at timestamptz,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
    CREATE TABLE case_participants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),case_id uuid REFERENCES cases(id),user_id uuid REFERENCES app_users(user_id),
      ${participantStatus ? 'status text,' : ''} role text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),UNIQUE(case_id,user_id));
    CREATE TABLE uploads (id uuid PRIMARY KEY, case_id uuid,case_uuid uuid REFERENCES cases(id), user_id uuid,
      doc_type text, status text, confirmed boolean, deleted_at timestamptz, created_at timestamptz DEFAULT now());
    CREATE TABLE case_assignments (case_id uuid, mediator_id uuid, organization_id uuid, status text);
  `);
  for (const [n, org, role] of [[1, 100, 'divorcee'], [2, 100, 'mediator'], [3, 200, 'divorcee'], [4, 100, 'admin']]) {
    await database.query('INSERT INTO app_users(user_id,organization_id,name,email,role) VALUES($1,$2,$3,$4,$5)',
      [id(n), id(org), `Fictional ${n}`, `fictional${n}@example.invalid`, role]);
    await database.query('INSERT INTO auth.users VALUES($1,$2,now())', [id(n),`fictional${n}@example.invalid`]);
  }
  for (const [n, org] of [[10, 100], [20, 200]]) {
    await database.query(`INSERT INTO cases(id,short_id,organization_id,${caseMediator ? 'mediator_id,' : ''}description,status)
      VALUES($1,$2,$3,${caseMediator ? '$4,' : ''}$${caseMediator ? 5 : 4},'collecting_docs')`,
      [id(n), n, id(org), ...(caseMediator ? [id(2)] : []), `Fictional case ${n}`]);
  }
  for (const [user, caseNumber] of [[1, 10], [3, 20]]) {
    await database.query(`INSERT INTO case_participants(case_id,user_id,role${participantStatus ? ',status' : ''})
      VALUES($1,$2,'divorcee'${participantStatus ? ",'active'" : ''})`, [id(caseNumber), id(user)]);
  }
  await database.query('INSERT INTO uploads(id,case_uuid,user_id,doc_type,status,confirmed) VALUES($1,$2,$3,$4,$5,true)',
    [id(50), id(10), id(1), 'fictional_statement', 'complete']);
  await database.query("INSERT INTO case_assignments VALUES($1,$2,$3,'active')", [id(10), id(2), id(100)]);
}
