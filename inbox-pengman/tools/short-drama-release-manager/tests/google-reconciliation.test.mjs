import assert from 'node:assert/strict';
import test from 'node:test';
import { planGoogleReconciliation, applyGoogleReconciliation } from '../src/google-reconciliation.mjs';
import { BASE_FIELD_SPECS } from '../src/schema.mjs';
const clone = structuredClone;
function fixture() {
 const google={accounts:[{账号名:'acct',账号ID:'acct',主页链接:'https://www.tiktok.com/@acct',粉丝数:20,数据日期:'2026-09-08',状态:'发布中'}],dramas:[{剧名:'Old',剧分类:['爱情'],生命周期:'新剧'},{剧名:'New',剧分类:['豪门'],生命周期:null}],captures:[{'Post ID':'123',账号名:'acct',快照日期:'2026-09-08',视频链接:'https://www.tiktok.com/@acct/video/123',播放量:30,点赞:2,评论:0,收藏:0,转发:0}],releases:[{日期:'2026-09-08',账号名:'acct',剧名:null}],revision:'rev'};
 const snapshot={accounts:[{record_id:'a',fields:{账号ID:'acct',账号名:'acct',主页链接:'https://www.tiktok.com/@acct',粉丝数:10,数据日期:'2026-09-04',状态:'发布中'}}],dramas:[{record_id:'d',fields:{剧ID:'SD-000010',剧名:'Old',剧分类:['爱情'],生命周期:'新剧',归档状态:'active'}}],captures:[],releases:[]};
 const schema={tables:Object.entries({accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'}).map(([key,name])=>({name,table_id:key,fields:BASE_FIELD_SPECS[name].map(s=>({name:s.name,field_id:s.name,options:(s.options??(s.name==='剧分类'?['爱情']:[])).map(name=>({name}))}))}))};
 return {google,snapshot,schema,baseline:{source_backup:{formatted:{releases:[['日期','账号名','剧名']]}}},baseBindingSha256:'a'.repeat(64),now:'2026-09-08T10:00:00Z'};
}
test('Google is authoritative; existing IDs survive, new rows append, blank drama stays unlinked',()=>{
 const f=fixture();const p=planGoogleReconciliation(f);
 assert.equal(p.operations.accounts.updates[0].patch.粉丝数,20);
 assert.equal(p.operations.dramas.creates[0].key,'SD-000011');
 assert.deepEqual(p.operations.releases.creates[0].patch.剧,[]);
 assert.equal(p.operations.releases.creates[0].patch.日期,'2026-09-08');
 assert.equal(p.schema_changes[0].after.includes('豪门'),true);
 assert.equal(p.operations.captures.creates[0].patch.播放量,30);
 assert.equal(p.operations.captures.creates[0].patch.评论,0);
});
test('source duplicate names merge only according to existing provenance and union rules',()=>{
 const f=fixture();f.google.dramas.push({剧名:' old ',剧分类:['复仇'],生命周期:'在推',推荐理由:'why'});
 const p=planGoogleReconciliation(f);assert.equal(p.operations.dramas.creates.length,1);
 assert.equal(p.operations.dramas.updates[0].key,'SD-000010');assert.equal(p.operations.dramas.updates[0].patch.生命周期,'在推');
 assert.deepEqual(p.operations.dramas.updates[0].patch.剧分类,['爱情','复仇']);
});
test('duplicate source post identities fail before any mutation',()=>{
 const f=fixture();f.google.captures.push(clone(f.google.captures[0]));assert.throws(()=>planGoogleReconciliation(f),e=>e.code==='reconcile_duplicate_key');
});
test('existing release identity cannot be guessed after source row changes',()=>{
 const f=fixture();f.baseline.source_backup.formatted.releases.push(['2026-09-07','acct','Old']);
 f.snapshot.releases.push({record_id:'r',fields:{发布ID:'SR-000001'}});
 assert.throws(()=>planGoogleReconciliation(f),e=>e.code==='reconcile_release_mapping_changed');
});
test('wrong Base binding or modified plan is rejected before writes',async()=>{
 const f=fixture();const p=planGoogleReconciliation(f);p.operations.accounts.updates[0].patch.粉丝数=999;
 let calls=0;await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:()=>calls++}}),e=>e.code==='reconcile_plan_invalid');assert.equal(calls,0);
});
test('changed live source and concurrent Base changes reject the reviewed plan',async()=>{
 for(const mutate of [f=>f.google.accounts[0].粉丝数++,f=>f.snapshot.accounts[0].fields.粉丝数++]){
  const f=fixture();const p=planGoogleReconciliation(f);mutate(f);let calls=0;
  await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:()=>calls++}}),e=>e.code==='reconcile_stale');assert.equal(calls,0);
 }
});
test('partial writer failure remains partial and never reports verified',async()=>{
 const f=fixture();const p=planGoogleReconciliation(f);let calls=0;
 await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:async()=>{calls++;throw new Error('transport');}}}));assert.equal(calls,1);
});

test('writer changes only planned fields, reads back, audits, and never repeats a write for lag',async()=>{
 const {createGoogleReconciliationWriter}=await import('../src/google-reconciliation.mjs');
 const {JobStore}=await import('../src/job-store.mjs');
 const {BaseRepositories}=await import('../src/base-repositories.mjs');
 const f=fixture();const p=planGoogleReconciliation(f);const rows=clone(f.snapshot);const fields=clone(f.schema.tables);const writes=[];let lag=0;
 const client={
  async listRecords(_base,key){const items=clone(rows[key]);if(key==='accounts'&&lag-->0)items[0].fields.粉丝数=10;return {complete:true,items};},
  async getRecord(_base,key,id){return clone(rows[key].find(r=>r.record_id===id));},
  async listFields(_base,key){return {complete:true,items:clone(fields.find(t=>t.table_id===key).fields)};},
  async updateSelectFieldOptions(_base,key,id,_table,_name,options){fields.find(t=>t.table_id===key).fields.find(f=>f.field_id===id).options=options.map(name=>({name}));},
  async updateRecords(_base,key,updates){writes.push(key);for(const u of updates)Object.assign(rows[key].find(r=>r.record_id===u.record_id).fields,clone(u.fields));if(key==='accounts')lag=1;return clone(updates);},
  async createRecords(_base,key,creates){writes.push(key);const created=creates.map((r,i)=>({record_id:`new-${key}-${i}`,fields:clone(r.fields)}));rows[key].push(...created);return created;}
 };
 const jobs=new JobStore(':memory:');const config={base:{appToken:'base',tableIds:{accounts:'accounts',dramas:'dramas',captures:'captures',releases:'releases'}},auth:{isPrivilegedAllowed:actor=>actor==='admin'}};
 const repos=new BaseRepositories({client,appToken:'base',tableIds:config.base.tableIds});
 try{
  const writer=createGoogleReconciliationWriter({client,repos,config,jobs,actorId:'admin',sleep:async()=>{}});
  const result=await writer.apply(p);assert.equal(result.status,'success');assert.equal(result.readback,'verified');
  assert.equal(writes.filter(k=>k==='accounts').length,1);assert.equal(rows.accounts[0].fields.粉丝数,20);
  assert.equal(rows.releases[0].fields.剧.length,0);assert.equal(jobs.db.prepare('select count(*) as n from audit_events').get().n,4);
 }finally{jobs.close();}
});
