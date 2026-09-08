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
