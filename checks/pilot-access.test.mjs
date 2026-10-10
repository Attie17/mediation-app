import test from 'node:test';
import assert from 'node:assert/strict';
import { canReadCase, disabledLegacyRegistration, resolveAuthorizedCase } from '../backend/src/security/pilotAccess.js';

const person = { id: 'fictional-person', organization_id: 'practice-one' };
const record = { id: 'fictional-case', organization_id: 'practice-one', mediator_id: 'fictional-mediator' };
const member = { user_id: person.id, status: 'active' };

test('active participant and assigned mediator can read within their practice', () => {
  assert.equal(canReadCase(record, person, member), true);
  assert.equal(canReadCase(record, { ...person, id: record.mediator_id }, null), true);
});
test('other practice, unassigned mediator and administrator have no implicit access', () => {
  assert.equal(canReadCase(record, { ...person, organization_id: 'practice-two' }, member), false);
  assert.equal(canReadCase(record, { ...person, id: 'other-mediator', role: 'mediator' }, null), false);
  assert.equal(canReadCase(record, { ...person, id: 'operator', role: 'admin' }, null), false);
});
test('removed, invited, missing or mismatched membership is denied', () => {
  for (const status of ['removed', 'invited', null, undefined]) {
    assert.equal(canReadCase(record, person, { ...member, status }), false);
  }
  assert.equal(canReadCase(record, person, { ...member, user_id: 'other-person' }), false);
});
test('missing identity or organisation scope fails closed', () => {
  assert.equal(canReadCase(record, null, member), false);
  assert.equal(canReadCase({ ...record, organization_id: null }, person, member), false);
  assert.equal(canReadCase(record, { id: person.id }, member), false);
});
function response() {
  return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
test('all legacy registrations stop before password hashing, writes or token creation', () => {
  for (const email of ['new@example.invalid', 'existing@example.invalid']) {
    const res = response();
    disabledLegacyRegistration({ body: { email, password: 'fictional-only', role: 'divorcee' } }, res);
    assert.equal(res.code, 503);
    assert.equal(res.body.error.code, 'VERIFIED_REGISTRATION_REQUIRED');
    assert.equal('token' in res.body, false);
  }
});
test('privileged roles are explicitly rejected', () => {
  for (const role of ['admin', 'mediator', 'lawyer']) {
    const res = response();
    disabledLegacyRegistration({ body: { role } }, res);
    assert.equal(res.code, 403);
  }
});
test('malformed identifiers and missing identity never query the database', async () => {
  const db = { query() { throw new Error('Must not query'); } };
  for (const input of ['1suffix', '-1', '0', '1 OR 1=1', 'garbage']) {
    assert.equal(await resolveAuthorizedCase(db, input, person.id), null);
  }
  assert.equal(await resolveAuthorizedCase(db, '1', null), null);
});
test('UUID, short ID and my-case use the same scope checks and return only identity fields', async () => {
  const row = { ...record, short_id: 7, actor_organization_id: person.organization_id,
    member_user_id: person.id, member_status: 'active', confidential: 'must not return' };
  for (const input of ['7', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'my-case']) {
    const db = { async query(sql, params) {
      assert.deepEqual(params, [input, person.id]);
      assert.ok(sql.includes('$1') && sql.includes('$2'));
      return { rows: [{ ...row, organization_id: 'practice-two' }, row] };
    } };
    assert.deepEqual(await resolveAuthorizedCase(db, input, person.id), { id: record.id, short_id: 7 });
  }
});
test('unrelated records deny access and database errors propagate rather than allow access', async () => {
  assert.equal(await resolveAuthorizedCase({ async query() { return { rows: [{ ...record,
    actor_organization_id: person.organization_id, member_user_id: 'other', member_status: 'active' }] }; } }, '7', person.id), null);
  await assert.rejects(resolveAuthorizedCase({ async query() { throw new Error('Unavailable'); } }, '7', person.id), /Unavailable/);
});
