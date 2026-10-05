import test from 'node:test';
import assert from 'node:assert/strict';
import {JobStore} from '../src/job-store.mjs';
import {createHash} from 'node:crypto';
import {BaseRepositories} from '../src/base-repositories.mjs';
import {processDuplicateRelationRepairs} from '../src/duplicate-relation-repair.mjs';

const request={release_id:'SR-000022',owner_release_id:'SR-000017',post_id:'7678271597450497294',capture_record_id:'rec-c',release_record_id:'rec-target',owner_record_id:'rec-owner',release_date:'2026-08-27',owner_date:'2026-08-26'};
function fixture(){
 const jobs=new JobStore(':memory:');
 const rows={a:[{record_id:'rec-a',fields:{账号ID:'dramadetour0'}}],d:[{record_id:'rec-d',fields:{剧ID:'SD-000001'}}],c:[{record_id:'rec-c',fields:{'Post ID':request.post_id,账号:[{id:'rec-a'}],视频链接:`https://www.tiktok.com/@dramadetour0/video/${request.post_id}`}}],r:[
  {record_id:'rec-owner',fields:{发布ID:request.owner_release_id,日期:request.owner_date,账号:[{id:'rec-a'}],剧:[{id:'rec-d'}],归档状态:'active','Post ID':request.post_id,视频链接:`https://www.tiktok.com/@dramadetour0/video/${request.post_id}`,采集记录:[{id:'rec-c'}]}},
  {record_id:'rec-target',fields:{发布ID:request.release_id,日期:request.release_date,账号:[{id:'rec-a'}],剧:[{id:'rec-d'}],归档状态:'active','Post ID':null,视频链接:null,采集记录:[{id:'rec-c'}],备注:null,批次ID:null,匹配方式:null,匹配置信度:null}},
 ]};
 const writes=[];
 const client={
  listRecords:async(_base,id)=>({complete:true,items:structuredClone(rows[id])}),
  getRecord:async(_base,id,recordId)=>structuredClone(rows[id].find(row=>row.record_id===recordId)),
  createRecords:async()=>{throw Error('Repair must not create records');},
  updateRecords:async(_base,id,patches)=>{writes.push(structuredClone(patches));for(const patch of patches)Object.assign(rows[id].find(row=>row.record_id===patch.record_id).fields,structuredClone(patch.fields));return structuredClone(patches);},
 };
 const repos=new BaseRepositories({client,appToken:'base',tableIds:{accounts:'a',dramas:'d',captures:'c',releases:'r'},sleep:async()=>{}});
 return {jobs,repos,rows,writes,client};
}

test('one-shot repair detaches only the unsupported duplicate relation and verifies the owner',async()=>{
 const f=fixture(),owner=structuredClone(f.rows.r[0]),target=structuredClone(f.rows.r[1]);
 const result=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
 assert.equal(result.status,'success');assert.equal(result.repaired[0].release_id,request.release_id);
 assert.deepEqual(f.writes,[[{record_id:'rec-target',fields:{采集记录:[]}}]]);
 assert.deepEqual(f.rows.r[0],owner);assert.deepEqual({...f.rows.r[1].fields,采集记录:target.fields.采集记录},target.fields);
 assert.deepEqual(f.rows.r[1].fields.采集记录,[]);
 assert.equal(f.jobs.db.prepare("select count(*) n from audit_events where action='duplicate_relation_repair_resolved'").get().n,1);
 const again=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
 assert.equal(again.repaired[0].status,'already_repaired');assert.equal(f.writes.length,1);f.jobs.close();
});

test('a changed release or third claimant blocks repair before any write',async()=>{
 for(const change of ['target_post','third_claim']){
  const f=fixture();
  if(change==='target_post')f.rows.r[1].fields['Post ID']='123';
  else f.rows.r.push({record_id:'rec-third',fields:{发布ID:'SR-000023',日期:'2026-08-27',账号:[{id:'rec-a'}],剧:[{id:'rec-d'}],采集记录:[{id:'rec-c'}]}});
  const result=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
  assert.equal(result.status,'partial');assert.equal(result.errors[0].code,'duplicate_relation_repair_conflict');assert.equal(f.writes.length,0);f.jobs.close();
 }
});

test('an uncertain write is never replayed automatically',async()=>{
 const f=fixture();let attempts=0;f.client.updateRecords=async()=>{attempts++;throw Error('lost acknowledgement');};
 const first=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
 const second=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
 assert.equal(first.status,'partial');assert.equal(second.status,'partial');assert.equal(attempts,1);f.jobs.close();
});

test('acknowledged relation clear tolerates one stale Base read without a second write',async()=>{
 const f=fixture(),before=structuredClone(f.rows.r[1]),read=f.client.getRecord;let stale=1;
 f.client.getRecord=async(base,id,recordId)=>{
  if(f.writes.length&&id==='r'&&recordId==='rec-target'&&stale-- > 0)return structuredClone(before);
  return read(base,id,recordId);
 };
 const result=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
 assert.equal(result.status,'success');assert.equal(f.writes.length,1);f.jobs.close();
});

test('repair preserves populated human fields outside the compact matching evidence',async()=>{
 const f=fixture();f.rows.r[1].fields.RS收益=12;
 const result=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
 assert.equal(result.status,'success');assert.equal(f.rows.r[1].fields.RS收益,12);assert.equal(f.writes.length,1);f.jobs.close();
});

test('a proved prewrite conflict needs an explicit new attempt key before recovery',async()=>{
 const f=fixture(),read=f.client.getRecord;let changed=true;
 f.client.getRecord=async(base,id,recordId)=>{
  const row=await read(base,id,recordId);
  if(changed&&id==='r'&&recordId==='rec-target')row.fields.处理负责人=[{id:'ou_changed'}];
  return row;
 };
 const first=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
 assert.equal(first.status,'partial');assert.equal(f.writes.length,0);
 changed=false;
 const held=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[request]});
 assert.equal(held.errors[0].code,'duplicate_relation_repair_requires_review');
 const recovered=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[{...request,attempt_id:'verified-prewrite-v2'}]});
 assert.equal(recovered.status,'success');assert.equal(f.writes.length,1);f.jobs.close();
});

test('a unique machine match with a stable caption may retain its link while the unconfirmed twin is detached',async()=>{
 const f=fixture(),caption='#MyAlienLife She went diving on earth';
 f.rows.d[0].fields.剧名='My Alien Life';
 f.rows.r[0].fields['Post ID']=null;f.rows.r[0].fields.视频链接=null;f.rows.r[0].fields.匹配方式='account_time';f.rows.r[0].fields.匹配置信度=1;
 f.rows.r[1].fields.日期=request.owner_date;
 f.rows.c[0].fields.发布时间='2026-08-26T10:20:13.000Z';
 const inferred={...request,mode:'machine_match',release_date:request.owner_date,published_at:'2026-08-26T10:20:13.000Z',caption_sha256:createHash('sha256').update(caption).digest('hex'),owner_drama_record_id:'rec-d',target_drama_record_id:'rec-d',owner_title:'My Alien Life'};
 const readPostEvidence=()=>({post_id:request.post_id,username:'dramadetour0',post_url:f.rows.c[0].fields.视频链接,published_at:inferred.published_at,caption});
 const result=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[inferred],readPostEvidence});
 assert.equal(result.status,'success');assert.equal(f.writes.length,1);assert.deepEqual(f.rows.r[1].fields.采集记录,[]);f.jobs.close();
});

test('a caption naming the owner drama and Part 3 defeats a conflicting unpublished plan',async()=>{
 const f=fixture(),caption='Part 3 | Off the Ice Full series link in bio';
 f.rows.d[0].fields.剧名='Off the Ice';f.rows.d.push({record_id:'rec-d2',fields:{剧ID:'SD-000002',剧名:'Other Drama'}});
 f.rows.r[0].fields['Post ID']=null;f.rows.r[0].fields.视频链接=null;f.rows.r[0].fields.备注='第3条';
 f.rows.r[1].fields.剧=[{id:'rec-d2'}];f.rows.r[1].fields.备注='计划发布第1条；未发布';f.rows.r[1].fields.匹配方式='account_time';f.rows.r[1].fields.匹配置信度=1;
 f.rows.c[0].fields.发布时间='2026-08-26T17:00:00.000Z';
 const evidenced={...request,mode:'caption_part',published_at:'2026-08-26T17:00:00.000Z',caption_sha256:createHash('sha256').update(caption).digest('hex'),owner_drama_record_id:'rec-d',target_drama_record_id:'rec-d2',owner_title:'Off the Ice',part:3};
 const readPostEvidence=()=>({post_id:request.post_id,username:'dramadetour0',post_url:f.rows.c[0].fields.视频链接,published_at:evidenced.published_at,caption});
 const result=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[evidenced],readPostEvidence});
 assert.equal(result.status,'success');assert.equal(f.writes.length,1);assert.deepEqual(f.rows.r[1].fields.采集记录,[]);f.jobs.close();
});
test('unsupported repair evidence modes fail closed without changing Base',async()=>{
 const f=fixture(),caption='Drama';f.rows.d[0].fields.剧名='Drama';f.rows.c[0].fields.发布时间='2026-08-26T10:20:13.000Z';
 const unsupported={...request,mode:'unsupported',published_at:'2026-08-26T10:20:13.000Z',caption_sha256:createHash('sha256').update(caption).digest('hex'),owner_drama_record_id:'rec-d',target_drama_record_id:'rec-d',owner_title:'Drama'};
 const readPostEvidence=()=>({post_id:request.post_id,username:'dramadetour0',post_url:f.rows.c[0].fields.视频链接,published_at:unsupported.published_at,caption});
 const result=await processDuplicateRelationRepairs({jobs:f.jobs,repos:f.repos,requests:[unsupported],readPostEvidence});
 assert.equal(result.status,'partial');assert.equal(f.writes.length,0);f.jobs.close();
});
