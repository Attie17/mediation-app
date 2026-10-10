import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {once} from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';
import {database,reset,id,queries} from './database.mjs';
for(const key of Object.keys(process.env)) if(/DATABASE|SUPABASE|OPENAI|ANTHROPIC|TAVILY|JWT_SECRET|DEV_AUTH/.test(key)) delete process.env[key];
process.env.NODE_ENV='production';process.env.JWT_SECRET='fictional-preparation-key';
register('./isolated-loader.mjs',import.meta.url);
const {default:intake}=await import('../../backend/src/routes/intake.js');
const {default:risk}=await import('../../backend/src/routes/riskAssessment.js');
let server,base;
before(async()=>{
 const app=express();app.use(express.json());app.use('/intake',intake);app.use('/api/users',risk);
 server=app.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{await new Promise(resolve=>server.close(resolve));await database.close();});
async function fresh(){
 await database.exec('DROP TABLE IF EXISTS intake_answers');await reset();
 await database.exec(`ALTER TABLE app_users ADD COLUMN first_name text, ADD COLUMN last_name text,
   ADD COLUMN risk_assessment jsonb, ADD COLUMN updated_at timestamptz DEFAULT now();
   CREATE TABLE intake_answers(id serial PRIMARY KEY,user_id uuid REFERENCES app_users(user_id),step text,answers jsonb)`);
 await database.query('UPDATE app_users SET risk_assessment=$1 WHERE user_id=$2',
  [JSON.stringify({safetyData:{private:'Fictional private answer',safetyNeedSupport:'yes, please'},ipvFlags:1,powerImbalance:2,suitability:'fixture',recommendation:'fixture',processAdaptations:[],supportResources:[],assessedAt:'fictional'}),id(1)]);
}
async function request(path,user=1,method='GET',body,role='divorcee'){
 const token=user===null?null:jwt.sign({sub:id(user),role},process.env.JWT_SECRET,{expiresIn:60});
 const log=console.log,error=console.error;console.log=console.error=()=>{};
 try{
  const response=await fetch(base+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:response.status,body:await response.json()};
 }finally{console.log=log;console.error=error;}
}
const answers={step:'fictional-step',answers:{private:'fictional owner answer'}};
const summary=(user=1)=>`/api/users/${id(user)}/risk-assessment`;
test('anonymous intake requests are denied before SQL, including health and demo writes',async()=>{
 await fresh();queries.length=0;
 for(const [path,method,body] of [['/intake/'+id(1),'GET'],['/intake','POST',answers],['/intake/health','GET'],['/intake/test','POST',{}]])
  assert.equal((await request(path,null,method,body)).status,401);
 assert.equal(queries.length,0);
});
test('owner intake saves and reads using authenticated identity with compatible response',async()=>{
 await fresh();const saved=await request('/intake',1,'POST',answers);assert.equal(saved.status,200);
 assert.equal(saved.body.data[0].user_id,id(1));
 const read=await request('/intake/'+id(1));assert.equal(read.status,200);assert.deepEqual(read.body.data[0].answers,answers.answers);
 const health=await request('/intake/health');assert.deepEqual(health.body,{success:true});
});
test('another spouse and claimed administrator cannot read or overwrite private intake',async()=>{
 await fresh();await request('/intake',1,'POST',answers);
 for(const [user,role] of [[3,'divorcee'],[4,'admin'],[2,'mediator']]){
  assert.equal((await request('/intake/'+id(1),user,'GET',undefined,role)).status,403);
  assert.equal((await request('/intake',user,'POST',{...answers,userId:id(1)},role)).status,403);
 }
 assert.equal((await database.query('SELECT count(*)::int AS n FROM intake_answers')).rows[0].n,1);
});
test('unknown, unscoped and non-divorcee profiles cannot use preparation',async()=>{
 await fresh();assert.equal((await request('/intake',99,'POST',answers)).status,403);
 assert.equal((await request('/intake',2,'POST',answers)).status,403);
 await database.query('UPDATE app_users SET organization_id=NULL WHERE user_id=$1',[id(1)]);
 assert.equal((await request('/intake',1,'POST',answers)).status,403);
});
test('demo writes are disabled and invalid answers are rejected',async()=>{
 await fresh();assert.equal((await request('/intake/test',1,'POST',{})).status,405);
 for(const body of [{step:'',answers:{}},{step:'fixture',answers:[]},{answers:{}}]) assert.equal((await request('/intake',1,'POST',body)).status,400);
 assert.equal((await database.query('SELECT count(*)::int AS n FROM intake_answers')).rows[0].n,0);
});
test('current assigned mediator receives only the existing redacted safety summary',async()=>{
 await fresh();const result=await request(summary(),2);
 assert.equal(result.status,200);assert.equal(result.body.user.caseId,id(10));
 assert.equal(result.body.assessment.needsSupport,true);assert.equal(result.body.assessment.safetyData,undefined);
 assert.equal(JSON.stringify(result.body).includes('Fictional private answer'),false);
});
test('unassigned, cross-practice and administrator actors cannot obtain safety summaries',async()=>{
 await fresh();for(const [user,role] of [[1,'mediator'],[3,'mediator'],[4,'admin']]) assert.equal((await request(summary(),user,'GET',undefined,role)).status,403);
 await database.query('UPDATE app_users SET organization_id=$1 WHERE user_id=$2',[id(200),id(2)]);
 assert.equal((await request(summary(),2)).status,403);
});
test('inactive or wrongly scoped target membership denies safety summary access',async()=>{
 await fresh();for(const status of ['invited','removed',null]){
  await database.query('UPDATE case_participants SET status=$1 WHERE user_id=$2',[status,id(1)]);
  assert.equal((await request(summary(),2)).status,403);
 }
 await database.query("UPDATE case_participants SET status='active' WHERE user_id=$1",[id(1)]);
 await database.query('UPDATE app_users SET organization_id=$1 WHERE user_id=$2',[id(200),id(1)]);
 assert.equal((await request(summary(),2)).status,403);
});
test('mediator profile authority and current assignment are both required',async()=>{
 await fresh();await database.query("UPDATE app_users SET role='divorcee' WHERE user_id=$1",[id(2)]);
 assert.equal((await request(summary(),2,'GET',undefined,'mediator')).status,403);
 await database.query("UPDATE app_users SET role='mediator' WHERE user_id=$1",[id(2)]);
 await database.query('UPDATE cases SET mediator_id=$1 WHERE id=$2',[id(4),id(10)]);
 assert.equal((await request(summary(),2,'GET',undefined,'mediator')).status,403);
});
test('missing intake schema fails closed without fabricated success',async()=>{
 await fresh();await database.exec('DROP TABLE intake_answers');
 assert.equal((await request('/intake',1,'POST',answers)).status,503);
 assert.equal((await request('/intake/'+id(1))).status,503);
});
