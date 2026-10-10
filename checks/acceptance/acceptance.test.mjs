import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { once } from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';
import { database, pool, queries, id, reset } from './database.mjs';
import { resolveAuthorizedCase } from '../../backend/src/security/pilotAccess.js';

// Use the real router and JWT middleware, replacing only its database import.
// No index.js, db.js, environment loader, provider client or legacy test is loaded.
for (const key of Object.keys(process.env)) {
  if (/DATABASE|SUPABASE|OPENAI|ANTHROPIC|TAVILY|JWT_SECRET|DEV_AUTH/.test(key)) delete process.env[key];
}
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'fictional-test-secret-never-used-by-accord';
process.env.SUPABASE_JWT_SECRET = 'fictional-fallback-secret-never-used-by-accord';
register('./isolated-loader.mjs', import.meta.url);
const { default: router } = await import('../../backend/src/routes/caseOverview.js');
let server, base;
before(async () => {
  const app = express();
  app.use('/api/cases', router);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await database.close();
});
async function request(path, user, tokenOverride) {
  const token = tokenOverride ?? (user ? jwt.sign({ sub: id(user) }, process.env.JWT_SECRET, { expiresIn: 60 }) : null);
  const previous = console.log;
  console.log = () => {}; // Existing middleware logs token fragments; keep them out of test output.
  try {
    const response = await fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return { status: response.status, body: await response.json() };
  } finally { console.log = previous; }
}

test('real PostgreSQL resolves UUID, numeric ID and alias for an active participant', async () => {
  await reset();
  for (const input of [id(10), '10', 'my-case']) {
    assert.deepEqual(await resolveAuthorizedCase(pool, input, id(1)), { id: id(10), short_id: 10 });
  }
});
test('real SQL denies cross-practice users and inactive memberships', async () => {
  await reset();
  assert.equal(await resolveAuthorizedCase(pool, '10', id(3)), null);
  for (const status of ['removed', 'invited', null]) {
    await database.query('UPDATE case_participants SET status=$1 WHERE user_id=$2', [status, id(1)]);
    assert.equal(await resolveAuthorizedCase(pool, '10', id(1)), null);
  }
});
test('real SQL allows the named mediator but no implicit administrator access', async () => {
  await reset();
  assert.deepEqual(await resolveAuthorizedCase(pool, '10', id(2)), { id: id(10), short_id: 10 });
  assert.equal(await resolveAuthorizedCase(pool, '10', id(4)), null);
});
test('null organisation and malformed input cannot gain access', async () => {
  await reset();
  await database.query('UPDATE cases SET organization_id=NULL WHERE id=$1', [id(10)]);
  assert.equal(await resolveAuthorizedCase(pool, '10', id(1)), null);
  queries.length = 0;
  assert.equal(await resolveAuthorizedCase(pool, '10 OR 1=1', id(1)), null);
  assert.equal(queries.length, 0);
});
test('HTTP rejects absent, forged and development tokens before database access', async () => {
  await reset();
  for (const token of [null, 'invalid-token', 'dev-fake-person']) {
    assert.equal((await request('/api/cases/10', null, token)).status, 401);
  }
  assert.equal(queries.length, 0);
});
test('HTTP overview, activity and events reject outsiders before reading case contents', async () => {
  await reset();
  for (const suffix of ['', '/activity', '/events']) {
    queries.length = 0;
    const result = await request('/api/cases/10' + suffix, 3);
    assert.equal(result.status, 404);
    assert.equal(result.body.error.code, 'CASE_NOT_FOUND');
    assert.equal(queries.length, 1);
    assert.ok(queries[0].includes('to_jsonb(c)'));
    assert.equal(JSON.stringify(result.body).includes('Fictional case'), false);
  }
});
test('missing fallback configuration rejects invalid tokens with 500 and no SQL', async () => {
  await reset();
  const secret = process.env.SUPABASE_JWT_SECRET;
  const previous = console.error;
  delete process.env.SUPABASE_JWT_SECRET;
  console.error = () => {};
  try {
    assert.equal((await request('/api/cases/10', null, 'invalid-token')).status, 500);
    assert.equal(queries.length, 0);
  } finally {
    process.env.SUPABASE_JWT_SECRET = secret;
    console.error = previous;
  }
});
test('HTTP permitted overview and activity return fictional data through real SQL', async () => {
  await reset();
  const overview = await request('/api/cases/10', 1);
  assert.equal(overview.status, 200);
  assert.equal(overview.body.case.id, id(10));
  assert.equal(overview.body.documents.overallPct, 100);
  const activity = await request('/api/cases/my-case/activity', 1);
  assert.equal(activity.status, 200);
  assert.equal(activity.body.items[0].id, id(50));
  const events = await request('/api/cases/10/events', 1);
  assert.equal(events.status, 200);
  assert.deepEqual(events.body, { ok: true, upcoming: [], past: [] });
});
test('legacy participant schema without status denies access rather than inferring consent', async () => {
  await reset({ participantStatus: false });
  assert.equal(await resolveAuthorizedCase(pool, '10', id(1)), null);
  assert.equal((await request('/api/cases/10', 1)).status, 404);
});
test('legacy assignment table alone does not satisfy the current mediator predicate', async () => {
  await reset({ caseMediator: false });
  assert.equal(await resolveAuthorizedCase(pool, '10', id(2)), null);
  assert.equal((await request('/api/cases/10', 2)).status, 404);
});
