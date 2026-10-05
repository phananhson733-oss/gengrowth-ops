import test from 'node:test';
import assert from 'node:assert/strict';
import {JobStore} from '../src/job-store.mjs';
import {inspectBatchMetadataRepair,processBatchMetadataRepairs} from '../src/batch-metadata-repair.mjs';

const request={
 batch_id:'fakedatingpm',release_ids:['SR-000614','SR-000615','SR-000616'],
 record_ids:['rec614','rec615','rec616'],account_record_id:'recaccount',drama_record_id:'recdrama',
 owner_id:'ou_owner',planned_at:'2026-09-25',
};
const row=(sequence)=>({record_id:`rec${613+sequence}`,fields:{
 发布ID:`SR-000${613+sequence}`,批次ID:null,计划序号:sequence,批次计划条数:3,
 日期:'2026-09-25',计划发布时间:'2026-09-25',账号:[{id:'recaccount'}],剧:[{id:'recdrama'}],
 处理负责人:[{id:'ou_owner'}],归档状态:null,备注:null,'Post ID':null,视频链接:null,采集记录:[],
}});
function fixture(){
 const rows=new Map([1,2,3].map(sequence=>[row(sequence).fields.发布ID,row(sequence)]));
 const jobs=new JobStore(':memory:');let posts=0;
 const client={async updateRecords(_base,_table,updates,options){assert.equal(options.noRetry,true);posts++;for(const update of updates)Object.assign([...rows.values()].find(r=>r.record_id===update.record_id).fields,structuredClone(update.fields));return structuredClone(updates);}};
 const releases={appToken:'base',tableId:'tblRelease',client,async loadIndex(){return structuredClone(rows);}};
 const repos={accounts:{appToken:'base',tableId:'tblAccount'},dramas:{appToken:'base',tableId:'tblDrama'},captures:{appToken:'base',tableId:'tblCapture'},releases};
 const now=()=>new Date('2026-09-24T11:00:00Z');
 return {rows,jobs,repos,now,posts:()=>posts};
}

test('metadata inspection proves the exact three untouched slots without writing',async()=>{
 const f=fixture();try{
  const plan=await inspectBatchMetadataRepair({repos:f.repos,request});
  assert.equal(plan.batch_id,'fakedatingpm');assert.equal(plan.release_ids.length,3);assert.match(plan.version,/^[a-f0-9]{64}$/);
  assert.equal(f.posts(),0);
 }finally{f.jobs.close();}
});

test('metadata repair refuses a different batch or release target',async()=>{
 const f=fixture();try{
  await assert.rejects(inspectBatchMetadataRepair({repos:f.repos,request:{...request,batch_id:'otherbatch'}}),error=>error.code==='batch_metadata_request_invalid');
  await assert.rejects(inspectBatchMetadataRepair({repos:f.repos,request:{...request,release_ids:['SR-000614','SR-000615','SR-000617']}}),error=>error.code==='batch_metadata_request_invalid');
  assert.equal(f.posts(),0);
 }finally{f.jobs.close();}
});

test('one-shot metadata repair changes only batch ID and active state, then verifies and audits',async()=>{
 const f=fixture();try{
  const plan=await inspectBatchMetadataRepair({repos:f.repos,request});
  const applied=await processBatchMetadataRepairs({jobs:f.jobs,repos:f.repos,requests:[{...request,expected_version:plan.version}],now:f.now});
  assert.equal(applied.status,'success');assert.equal(applied.repaired[0].status,'verified');assert.equal(f.posts(),1);
  assert.deepEqual([...f.rows.values()].map(r=>r.fields.批次ID),['fakedatingpm','fakedatingpm','fakedatingpm']);
  assert.deepEqual([...f.rows.values()].map(r=>r.fields.归档状态),['active','active','active']);
  assert.deepEqual([...f.rows.values()].map(r=>r.fields.计划序号),[1,2,3]);
  assert.equal(f.jobs.db.prepare("SELECT count(*) AS n FROM audit_events WHERE action='repair-batch-metadata'").get().n,3);
  const repeated=await processBatchMetadataRepairs({jobs:f.jobs,repos:f.repos,requests:[{...request,expected_version:plan.version}],now:f.now});
  assert.equal(repeated.repaired[0].status,'already_repaired');assert.equal(f.posts(),1);
 }finally{f.jobs.close();}
});

test('metadata repair refuses another matching slot and never starts a POST',async()=>{
 const f=fixture();try{
  f.rows.set('SR-000617',{...row(3),record_id:'rec617',fields:{...row(3).fields,发布ID:'SR-000617'}});
  await assert.rejects(inspectBatchMetadataRepair({repos:f.repos,request}),error=>error.code==='batch_metadata_conflict');
  assert.equal(f.posts(),0);
 }finally{f.jobs.close();}
});

test('metadata repair rejects changes to any writable field since inspection',async()=>{
 const f=fixture();try{
  f.rows.get('SR-000614').fields.RS收益=100;
  const plan=await inspectBatchMetadataRepair({repos:f.repos,request});
  f.rows.get('SR-000614').fields.RS收益=200;
  const result=await processBatchMetadataRepairs({jobs:f.jobs,repos:f.repos,requests:[{...request,expected_version:plan.version}],now:f.now});
  assert.equal(result.status,'partial');assert.equal(result.errors[0].code,'batch_metadata_stale');assert.equal(f.posts(),0);
 }finally{f.jobs.close();}
});

test('metadata repair detects an unrelated writable field changed during the POST',async()=>{
 const f=fixture();try{
  f.rows.get('SR-000614').fields.RS收益=100;
  const plan=await inspectBatchMetadataRepair({repos:f.repos,request});
  const original=f.repos.releases.client.updateRecords;
  f.repos.releases.client.updateRecords=async(...args)=>{
   const result=await original(...args);
   f.rows.get('SR-000614').fields.RS收益=200;
   return result;
  };
  const result=await processBatchMetadataRepairs({jobs:f.jobs,repos:f.repos,requests:[{...request,expected_version:plan.version}],now:f.now});
  assert.equal(result.status,'partial');assert.equal(result.errors[0].code,'readback_mismatch');assert.equal(f.posts(),1);
 }finally{f.jobs.close();}
});

test('unknown metadata update remains uncertain and cannot replay',async()=>{
 const f=fixture();try{
  const plan=await inspectBatchMetadataRepair({repos:f.repos,request});
  f.repos.releases.client.updateRecords=async()=>{throw Error('response lost');};
  const input={...request,expected_version:plan.version};
  const first=await processBatchMetadataRepairs({jobs:f.jobs,repos:f.repos,requests:[input],now:f.now});
  assert.equal(first.status,'partial');assert.equal(first.errors[0].code,'batch_metadata_uncertain');
  const second=await processBatchMetadataRepairs({jobs:f.jobs,repos:f.repos,requests:[input],now:f.now});
  assert.equal(second.errors[0].code,'batch_metadata_requires_inspection');
 }finally{f.jobs.close();}
});
