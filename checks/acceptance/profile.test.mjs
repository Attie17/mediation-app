import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {once} from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';
import {database, reset, id} from './database.mjs';
for (const key of Object.keys(process.env)) if (/DATABASE|SUPABASE|OPENAI|ANTHROPIC|TAVILY|JWT_SECRET|DEV_AUTH/.test(key)) delete process.env[key];
process.env.NODE_ENV='production';
process.env.JWT_SECRET='fictional-profile-test-key';
register('./isolated-loader.mjs', import.meta.url);
const {default: users}=await import('../../backend/src/routes/users.js');
let server, base;
before(async()=>{
  const app=express(); app.use(express.json()); app.use('/api/users',users);
  server=app.listen(0,'127.0.0.1'); await once(server,'listening');
  base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{await new Promise(resolve=>server.close(resolve)); await database.close();});
async function fresh(){
  await reset();
  await database.exec(`ALTER TABLE app_users ADD COLUMN preferred_name text, ADD COLUMN phone text,
    ADD COLUMN address jsonb, ADD COLUMN avatar_url text, ADD COLUMN profile_details jsonb,
    ADD COLUMN created_at timestamptz DEFAULT now(), ADD COLUMN updated_at timestamptz DEFAULT now()`);
}
async function request(body,user=1,role='divorcee',method='POST',path='/profile'){
  const token=jwt.sign({sub:id(user),email:`fictional${user}@example.invalid`,role},process.env.JWT_SECRET,{expiresIn:60});
  const log=console.log,error=console.error; console.log=console.error=()=>{};
  try{
    const response=await fetch(base+'/api/users'+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:response.status,body:await response.json()};
  }finally{console.log=log;console.error=error;}
}
async function profile(n=1){return (await database.query('SELECT * FROM app_users WHERE user_id=$1',[id(n)])).rows[0];}
test('self-service cannot elevate an existing profile to any privileged role',async()=>{
  await fresh();
  for(const role of ['admin','mediator','lawyer']){
    const result=await request({name:'Forbidden change',role});
    assert.equal(result.status,403); assert.equal(result.body.error.code,'USR_ROLE_CHANGE_FORBIDDEN');
    assert.equal((await profile()).role,'divorcee'); assert.equal((await profile()).name,'Fictional 1');
  }
});
test('normal intake saves while preserving role and practice',async()=>{
  await fresh();
  const result=await request({name:'Fictional updated',phone:'fictional',role:'divorcee',profileDetails:{intakeCompleted:true}});
  assert.equal(result.status,200); const row=await profile();
  assert.equal(row.name,'Fictional updated'); assert.equal(row.role,'divorcee');
  assert.equal(row.organization_id,id(100)); assert.equal(row.profile_details.intakeCompleted,true);
});
test('existing authorised roles survive ordinary edits and same-role echoes',async()=>{
  await fresh();
  for(const [user,role] of [[2,'mediator'],[4,'admin']]){
    assert.equal((await request({name:'Fictional edit',role},user)).status,200);
    assert.equal((await request({phone:'fictional'},user)).status,200);
    assert.equal((await profile(user)).role,role);
  }
});
test('a profile edit cannot demote an existing authorised role',async()=>{
  await fresh(); assert.equal((await request({role:'divorcee',name:'Forbidden'},2)).status,403);
  assert.equal((await profile(2)).role,'mediator');
});
test('a missing profile cannot be created with a privileged role',async()=>{
  await fresh(); assert.equal((await request({role:'admin',name:'Forbidden'},99,'admin')).status,403);
  assert.equal(await profile(99),undefined);
});
test('hydrating a missing profile ignores privileged token claims',async()=>{
  await fresh(); assert.equal((await request(undefined,99,'admin','GET','/me')).status,200);
  assert.equal((await profile(99)).role,'divorcee'); assert.equal((await profile(99)).organization_id,null);
});
test('new ordinary intake creates a divorcee profile without granting a practice',async()=>{
  await fresh(); assert.equal((await request({role:'divorcee',name:'Fictional new'},99)).status,200);
  assert.equal((await profile(99)).role,'divorcee'); assert.equal((await profile(99)).organization_id,null);
});
test('forged token role cannot elevate an existing database profile',async()=>{
  await fresh(); assert.equal((await request({role:'admin'},1,'admin')).status,403);
  assert.equal((await profile()).role,'divorcee');
});
