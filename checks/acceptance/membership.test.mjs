import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import express from 'express';
import jwt from 'jsonwebtoken';
import { database, queries, id, reset } from './database.mjs';
import { providerOperations } from './provider-fixture.mjs';
for (const key of Object.keys(process.env)) if (/DATABASE|SUPABASE|OPENAI|ANTHROPIC|TAVILY|JWT_SECRET|DEV_AUTH/.test(key)) delete process.env[key];
process.env.NODE_ENV='production';
process.env.JWT_SECRET='fictional-membership-test-key';
process.env.SUPABASE_JWT_SECRET='fictional-fallback-test-key';
register('./isolated-loader.mjs',import.meta.url);
const {default: overview}=await import('../../backend/src/routes/caseOverview.js');
const {default: cases}=await import('../../backend/src/routes/cases.js');
const {default: participants}=await import('../../backend/src/routes/participants.js');
let server,base;
before(async()=>{
  const app=express();app.use(express.json());
  app.use('/api/cases',overview);app.use('/api/cases',cases);app.use('/api/cases',participants);
  app.use('/direct-membership-fixture',participants);
  server=app.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{await new Promise(resolve=>server.close(resolve));await database.close();});
async function request(path,user=2,method='GET',body,claimedRole='divorcee'){
  const token=jwt.sign({sub:id(user),role:claimedRole},process.env.JWT_SECRET,{expiresIn:60});
  const log=console.log,error=console.error;console.log=console.error=()=>{};
  try{
    const response=await fetch(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    return {status:response.status,body:await response.json()};
  }finally{console.log=log;console.error=error;}
}
const path=(suffix='')=>`/api/cases/${id(10)}/participants${suffix}`;
async function member(n=1){return (await database.query('SELECT * FROM case_participants WHERE user_id=$1',[id(n)])).rows[0];}
async function fresh(){await reset();providerOperations.length=0;}

test('both participant list paths reject unknown, invited and removed memberships',async()=>{
  await fresh();
  for(const status of [null,'invited','removed']){
    await database.query('UPDATE case_participants SET status=$1 WHERE user_id=$2',[status,id(1)]);
    for(const suffix of ['', '/']) assert.equal((await request(path(suffix),1)).status,403);
  }
});
test('participant lists reject cross-practice actors and return active permitted data',async()=>{
  await fresh();assert.equal((await request(path(),3)).status,403);
  const result=await request(path(),1);assert.equal(result.status,200);assert.equal(result.body[0].status,'active');
});
test('ordinary participants and forged mediator claims cannot activate others',async()=>{
  await fresh();const target=await member();
  await database.query("UPDATE case_participants SET status='invited' WHERE id=$1",[target.id]);
  assert.equal((await request(path(`/${target.id}/activate`),1,'PATCH',{},'mediator')).status,403);
  assert.equal((await member()).status,'invited');
});
test('assigned mediator identity also requires authoritative mediator role',async()=>{
  await fresh();await database.query("UPDATE app_users SET role='divorcee' WHERE user_id=$1",[id(2)]);
  assert.equal((await request(path(`/${id(1)}`),2,'PATCH',{status:'active'},'mediator')).status,403);
});
test('activation requires verified identity in the same practice',async()=>{
  await fresh();const target=await member();
  await database.query("UPDATE case_participants SET status='invited' WHERE id=$1",[target.id]);
  await database.query('UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1',[id(1)]);
  assert.equal((await request(path(`/${target.id}/activate`),2,'PATCH',{})).status,403);
  await database.query('UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1',[id(1)]);
  await database.query('UPDATE app_users SET organization_id=$1 WHERE user_id=$2',[id(200),id(1)]);
  assert.equal((await request(path(`/${target.id}/activate`),2,'PATCH',{})).status,403);
  assert.equal((await member()).status,'invited');
});
test('explicit activation grants access and soft removal revokes it without deleting evidence',async()=>{
  await fresh();const target=await member();
  await database.query('UPDATE case_participants SET status=NULL WHERE id=$1',[target.id]);
  assert.equal((await request(path(`/${target.id}/activate`),2,'PATCH',{})).status,200);
  assert.equal((await request('/api/cases/10',1)).status,200);
  assert.equal((await request(path(`/${id(1)}`),2,'DELETE')).status,200);
  assert.equal((await member()).status,'removed');
  assert.equal((await request('/api/cases/10',1)).status,404);
});
test('removed and unknown members cannot self-accept an old invitation',async()=>{
  await fresh();
  for(const status of ['removed',null]){
    await database.query('UPDATE case_participants SET status=$1 WHERE user_id=$2',[status,id(1)]);
    assert.equal((await request(path('/accept'),1,'POST',{})).status,403);
    assert.equal((await member()).status,status);
  }
});
test('a verified invited spouse can accept only their own current invitation',async()=>{
  await fresh();await database.query("UPDATE case_participants SET status='invited' WHERE user_id=$1",[id(1)]);
  assert.equal((await request(path('/accept'),1,'POST',{userId:id(3)})).status,403);
  assert.equal((await request(path('/accept'),1,'POST',{})).status,200);
  assert.equal((await member()).status,'active');
});
test('invitation cannot create identities or reactivate existing removed membership',async()=>{
  await fresh();await database.query("UPDATE case_participants SET status='removed' WHERE user_id=$1",[id(1)]);
  const payload={email:'fictional1@example.invalid',role:'divorcee'};
  assert.equal((await request(path('/invite'),2,'POST',payload)).status,409);
  assert.equal((await request(path(),2,'POST',payload)).status,409);
  assert.equal((await request(path('/invite'),2,'POST',{email:'new@example.invalid',role:'divorcee'})).status,404);
  assert.equal((await member()).status,'removed');
  assert.equal((await database.query('SELECT count(*) AS count FROM auth.users')).rows[0].count,4);
});
test('both invitation paths record invited rather than active membership',async()=>{
  await fresh();await database.query('DELETE FROM case_participants WHERE user_id=$1',[id(1)]);
  const payload={email:'fictional1@example.invalid',role:'divorcee'};
  assert.equal((await request(path('/invite'),2,'POST',payload)).status,200);
  assert.equal((await member()).status,'invited');
  await database.query('DELETE FROM case_participants WHERE user_id=$1',[id(1)]);
  assert.equal((await request(path(),2,'POST',payload)).status,200);
  assert.equal((await member()).status,'invited');
});
test('invalid statuses and global privilege escalation are rejected',async()=>{
  await fresh();
  for(const payload of [{status:'approved-automatically'},{role:'admin'},{status:null},{role:'mediator',status:'active'}]){
    const result=await request(path(`/${id(1)}`),2,'PATCH',payload);
    assert.ok([400,403].includes(result.status));
  }
  assert.equal((await member()).role,'divorcee');
});
test('legacy removal requires mediator authority and matching case and participant IDs',async()=>{
  await fresh();const target=await member();
  const payload={participant_id:target.id,case_id:id(10),role:'divorcee'};
  assert.equal((await request('/api/cases/participants/remove',1,'POST',payload)).status,403);
  const foreign=await member(3);
  assert.equal((await request('/api/cases/participants/remove',2,'POST',{...payload,participant_id:foreign.id})).status,404);
  assert.equal((await request('/api/cases/participants/remove',2,'POST',payload)).status,200);
  assert.equal((await member()).status,'removed');
});
test('hard deletion is disabled and assigned mediator removal requires assignment workflow',async()=>{
  await fresh();await database.query("INSERT INTO case_participants(case_id,user_id,role,status) VALUES($1,$2,'mediator','active')",[id(10),id(2)]);
  assert.equal((await request(path(`/${id(2)}`),2,'DELETE')).status,409);
  const original=await member();
  assert.equal((await request(`/direct-membership-fixture/admin/participants/${original.id}`,4,'DELETE',{},'admin')).status,405);
  assert.equal((await member()).id,original.id);
});
test('missing status schema never fabricates active state or successful activation',async()=>{
  await reset({participantStatus:false});const target=await member();
  assert.equal((await request(path(),1)).status,403);
  const list=await request(path(),2);assert.equal(list.status,200);assert.equal(list.body[0].status,null);
  assert.equal((await request(path(`/${target.id}/activate`),2,'PATCH',{})).status,503);
});
test('reopening preserves revoked memberships and requires a same-practice administrator',async()=>{
  await fresh();await database.query("UPDATE case_participants SET status='removed' WHERE user_id=$1",[id(1)]);
  await database.query("UPDATE cases SET status='closed' WHERE id=$1",[id(10)]);
  assert.equal((await request(`/api/cases/${id(10)}/reopen`,1,'PATCH',{},'admin')).status,403);
  assert.equal((await request(`/api/cases/${id(10)}/reopen`,4,'PATCH',{},'divorcee')).status,200);
  assert.equal((await member()).status,'removed');
  assert.ok(!providerOperations.some(row=>row.table==='case_participants'));
  await database.query('UPDATE app_users SET organization_id=$1 WHERE user_id=$2',[id(200),id(4)]);
  assert.equal((await request(`/api/cases/${id(10)}/reopen`,4,'PATCH',{},'admin')).status,403);
});
test('case creation rejects missing practice metadata before provider writes',async()=>{
  await fresh();await database.query('UPDATE app_users SET organization_id=NULL WHERE user_id=$1',[id(1)]);
  assert.equal((await request('/api/cases',1,'POST',{organization_id:id(100)})).status,403);
  assert.equal(providerOperations.length,0);
});

test('root participant list returns unknown status as null and denies unreviewed viewers',async()=>{
  await fresh();await database.query('UPDATE case_participants SET status=NULL WHERE user_id=$1',[id(1)]);
  const url=`/direct-membership-fixture/${id(10)}/participants`;
  assert.equal((await request(url,1)).status,403);
  const result=await request(url,2);assert.equal(result.status,200);
  assert.equal(result.body.participants[0].status,null);
});

test('case creation derives practice from verified identity and records explicit invited status',async()=>{
  await fresh();
  const payload={organization_id:id(200),title:'Fictional new case',personalInfo:{name:'Fictional',dateOfBirth:'1990-01-01',email:'fictional1@example.invalid',phone:'000',address:'Fictional'}};
  const result=await request('/api/cases',1,'POST',payload);
  assert.equal(result.status,201);
  const created=(await database.query('SELECT organization_id FROM cases WHERE id=$1',[result.body.case_id])).rows[0];
  assert.equal(created.organization_id,id(100));
  assert.equal(result.body.participants[0].status,'invited');
});
test('participant lists do not reveal wrongly linked foreign-practice profiles',async()=>{
  await fresh();await database.query("INSERT INTO case_participants(case_id,user_id,role,status) VALUES($1,$2,'divorcee','active')",[id(10),id(3)]);
  const generic=await request(path(),1);
  assert.equal(generic.body.some(row=>row.user_id===id(3)),false);
  const root=await request(`/direct-membership-fixture/${id(10)}/participants`,1);
  assert.equal(root.body.participants.some(row=>row.user_id===id(3)),false);
});
test('schema proposal adds no active default or historical backfill, and is idempotent',async()=>{
  await reset({participantStatus:false});
  const sql=await readFile(new URL('./participant-status.sql',import.meta.url),'utf8');
  await database.exec(sql);await database.exec(sql);
  assert.equal((await member()).status,null);
  assert.equal((await request(path(),1)).status,403);
  await assert.rejects(database.query("UPDATE case_participants SET status='unsafe-default'"),error=>error.code==='23514');
  const target=await member();
  assert.equal((await request(path(`/${target.id}/activate`),2,'PATCH',{})).status,200);
  assert.equal((await request('/api/cases/10',1)).status,200);
});

test('membership insert failure rolls back case creation before downstream provider operations',async()=>{
  await fresh();
  await database.exec(`ALTER TABLE case_participants ADD CONSTRAINT fixture_reject_new_memberships CHECK(case_id IN ('${id(10)}','${id(20)}'))`);
  const payload={personalInfo:{name:'Fictional',dateOfBirth:'1990-01-01',email:'fictional1@example.invalid',phone:'000',address:'Fictional'}};
  assert.equal((await request('/api/cases',1,'POST',payload)).status,500);
  assert.equal((await database.query('SELECT count(*) AS count FROM cases')).rows[0].count,2);
  assert.equal(providerOperations.length,0);
});

test('an active mediator membership without current assignment cannot modify membership',async()=>{
  await fresh();await database.query("INSERT INTO case_participants(case_id,user_id,role,status) VALUES($1,$2,'mediator','active')",[id(10),id(2)]);
  await database.query('UPDATE cases SET mediator_id=NULL WHERE id=$1',[id(10)]);
  assert.equal((await request(path(`/${id(1)}`),2,'PATCH',{status:'removed'})).status,403);
  assert.equal((await member()).status,'active');
});
test('numeric case alias uses the same write authority and resolves to the UUID',async()=>{
  await fresh();
  assert.equal((await request(`/api/cases/10/participants/${id(1)}`,3,'PATCH',{status:'removed'})).status,403);
  assert.equal((await request(`/api/cases/10/participants/${id(1)}`,2,'PATCH',{status:'removed'})).status,200);
  assert.equal((await member()).status,'removed');
});
