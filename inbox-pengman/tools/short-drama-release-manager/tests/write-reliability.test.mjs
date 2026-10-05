import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {JobStore} from '../src/job-store.mjs';
import {BaseRepositories} from '../src/base-repositories.mjs';
import {HumanOpsService,baseBinding} from '../src/human-ops.mjs';
import {BatchOpsService} from '../src/release-batches.mjs';
import {ShortDramaError} from '../src/errors.mjs';
function fixture(){
 const tableIds={accounts:'a',dramas:'d',captures:'c',releases:'r'};
 const rows={a:[{record_id:'a1',fields:{账号ID:'one',负责人:[{id:'ou_owner'}]}}],d:[{record_id:'d1',fields:{剧ID:'SD-000001',剧名:'Test Drama'}}],c:[],r:[]};
 const jobs=new JobStore(':memory:');let posts=0;const calls=[];
 const client={
  updateRecords:async()=>{throw Error('unexpected update')},
  listRecords:async(_base,t)=>({complete:true,items:structuredClone(rows[t])}),
  listFields:async()=>({complete:true,items:[{name:'发布ID',type:'auto_number',style:{rules:[{type:'text',text:'SR-'},{type:'incremental_number',length:6}]}}]}),
  async createRecords(_base,t,records,options={}){
   await options.beforeWrite?.();posts++;calls.push(structuredClone(records));
   const created=records.map((r,i)=>({record_id:`new-${rows[t].length+i+1}`,fields:{...structuredClone(r.fields),发布ID:`SR-${String(rows[t].length+i+1).padStart(6,'0')}`}}));rows[t].push(...created);
   return structuredClone(created).reverse(); // Acknowledgement order is not identity.
  },
  getRecord:async(_base,t,id)=>structuredClone(rows[t].find(r=>r.record_id===id)),
 };
 const repos=new BaseRepositories({client,appToken:'test',tableIds});repos.releases.serverGeneratedIds=true;
 const now=()=>new Date('2026-09-22T08:00:00Z');
 const humanOps=new HumanOpsService({repos,jobs,operators:new Set(['ou_owner']),privileged:new Set(),now,makeReceiptId:()=>`sdp_${randomUUID()}`,allocateDramaId:()=>{throw Error('no local IDs')},allocateReleaseId:()=>{throw Error('no local IDs')}});
 const service=new BatchOpsService({repos,jobs,humanOps,now,readPosts:()=>[],isWriter:id=>id==='ou_owner',isPrivileged:()=>false});
 const preview=()=>service.previewSchedule({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-000001',plannedAt:'2026-09-23',count:4});
 const apply=p=>service.apply({actorId:'ou_owner',chatId:'chat',receiptId:p.receipt_id});
 return {jobs,client,repos,rows,calls,humanOps,service,preview,apply,posts:()=>posts};
}
test('four approved slots use one POST and verify identity independent of response order',async()=>{
 const f=fixture();try{const p=await f.preview(),r=await f.apply(p);assert.equal(r.status,'success');assert.equal(f.posts(),1);assert.equal(f.calls[0].length,4);assert.deepEqual(r.completed,['SR-000001','SR-000002','SR-000003','SR-000004']);assert.deepEqual(f.rows.r.map(r=>r.fields.计划序号),[1,2,3,4]);await assert.rejects(f.apply(p),e=>e.code==='preview_used');assert.equal(f.posts(),1);}finally{f.jobs.close();}
});
test('direct scheduling uses one generated-ID POST and an exact repeat makes no second POST',async()=>{
 const f=fixture();try{
  const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-000001',plannedAt:'2026-09-23',count:4};
  const first=await f.service.scheduleDirect(input),again=await f.service.scheduleDirect(input);
  assert.equal(first.status,'success');assert.equal(first.readback,'verified');assert.equal(again.status,'already_scheduled');
  assert.equal(again.batch_id,first.batch_id);assert.equal(f.posts(),1);assert.equal(f.rows.r.length,4);
 }finally{f.jobs.close();}
});
test('direct scheduling detects a matching external row inserted at the final prewrite read',async()=>{
 const f=fixture();try{
  const original=f.client.listFields;
  f.client.listFields=async(...args)=>{
   f.rows.r.push({record_id:'external',fields:{发布ID:'SR-legacy',账号:[{id:'a1'}],剧:[{id:'d1'}],日期:'2026-09-23',计划发布时间:'2026-09-23',归档状态:'active'}});
   return original(...args);
  };
  const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-000001',plannedAt:'2026-09-23',count:4};
  await assert.rejects(f.service.scheduleDirect(input),error=>error.code==='batch_schedule_conflict');
  assert.equal(f.posts(),0);assert.equal(f.rows.r.length,1);
 }finally{f.jobs.close();}
});
test('direct scheduling stops when a complete identical batch appears at the final prewrite read',async()=>{
 const f=fixture();try{
  const original=f.client.listFields;
  f.client.listFields=async(...args)=>{
   for(let sequence=1;sequence<=4;sequence++)f.rows.r.push({record_id:`external-${sequence}`,fields:{
    发布ID:`SR-ext-${sequence}`,账号:[{id:'a1'}],剧:[{id:'d1'}],日期:'2026-09-23',计划发布时间:'2026-09-23',
    批次ID:'SB-external',计划序号:sequence,批次计划条数:4,处理负责人:[{id:'ou_owner'}],备注:null,归档状态:'active',
   }});
   return original(...args);
  };
  const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-000001',plannedAt:'2026-09-23',count:4};
  await assert.rejects(f.service.scheduleDirect(input),error=>error.code==='batch_schedule_conflict');
  assert.equal(f.posts(),0);assert.equal(f.rows.r.length,4);
 }finally{f.jobs.close();}
});
test('an uncertain direct schedule cannot POST again when Base still shows no rows',async()=>{
 const f=fixture();try{
  let attempts=0;
  f.client.createRecords=async(_base,_table,_records,options)=>{await options.beforeWrite();attempts++;throw new ShortDramaError('base_response_invalid','lost response');};
  const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-000001',plannedAt:'2026-09-23',count:4};
  const first=await f.service.scheduleDirect(input);assert.equal(first.status,'partial');assert.match(first.receipt_id,/^sdp_/);assert.equal(attempts,1);
  await assert.rejects(f.service.scheduleDirect(input),error=>error.code==='batch_schedule_prior_attempt');
  assert.equal(attempts,1);assert.equal(f.rows.r.length,0);
 }finally{f.jobs.close();}
});
test('generated-create read-only preflight failure keeps parent and all child receipts usable',async()=>{
 const f=fixture();try{const p=await f.preview(),orig=f.client.listFields;f.client.listFields=async()=>{throw new ShortDramaError('base_response_invalid','metadata unavailable')};
 await assert.rejects(f.apply(p),e=>e.code==='base_response_invalid');assert.equal(f.posts(),0);const parent=f.jobs.getPreview(p.receipt_id);assert.equal(parent.used_at,null);for(const id of parent.patch.children)assert.equal(f.jobs.getPreview(id).used_at,null);
 f.client.listFields=orig;assert.equal((await f.apply(p)).status,'success');assert.equal(f.posts(),1);}finally{f.jobs.close();}
});
test('transport preflight failure occurs before receipt consumption',async()=>{
 const f=fixture();try{const p=await f.preview();f.client.createRecords=async()=>{throw new ShortDramaError('base_response_invalid','select coverage failed')};await assert.rejects(f.apply(p));assert.equal(f.jobs.getPreview(p.receipt_id).used_at,null);}finally{f.jobs.close();}
});
test('another worker lease blocks batch before consuming any confirmation',async()=>{
 const f=fixture();try{const p=await f.preview();f.jobs.acquireMutationLease({lockKey:`human-base:${baseBinding(f.repos)}`,ownerId:'other',now:new Date('2026-09-22T08:00:00Z')});await assert.rejects(f.apply(p),e=>e.code==='mutation_busy');assert.equal(f.jobs.getPreview(p.receipt_id).used_at,null);assert.equal(f.posts(),0);}finally{f.jobs.close();}
});
test('unknown write outcome consumes all receipts and never retries a POST',async()=>{
 const f=fixture();try{const p=await f.preview();let attempted=0;f.client.createRecords=async(_b,_t,_r,o)=>{await o.beforeWrite();attempted++;throw new ShortDramaError('base_response_invalid','lost response')};const r=await f.apply(p);assert.equal(r.status,'partial');assert.equal(r.error.cause_details.write_attempted,true);assert.equal(attempted,1);const parent=f.jobs.getPreview(p.receipt_id);assert.ok(parent.used_at);for(const id of parent.patch.children)assert.ok(f.jobs.getPreview(id).used_at);await assert.rejects(f.apply(p),e=>e.code==='preview_used');assert.equal(attempted,1);}finally{f.jobs.close();}
});
test('all child receipts consume atomically; an expired last child cannot burn the earlier ones',()=>{
 const jobs=new JobStore(':memory:');try{
 const now=new Date('2026-09-22T08:00:00Z');for(const id of ['one','two'])jobs.createPreview({receiptId:id,actorId:'op',chatId:'chat',action:'create',targetTable:'发布记录',targetKey:id,beforeHash:'same',patch:{},now});jobs.consumePreview('two',{actorId:'op',chatId:'chat',beforeHash:'same',now});
 assert.throws(()=>jobs.consumePreviews(['one','two'].map(receiptId=>({receiptId,actorId:'op',chatId:'chat',beforeHash:'same'})),{now}),e=>e.code==='preview_used');assert.equal(jobs.getPreview('one').used_at,null);
 }finally{jobs.close();}
});

import {FeishuClient} from '../src/feishu-client.mjs';
import {BASE_FIELD_SPECS} from '../src/schema.mjs';
test('complete four-slot flow uses the real wire codec, repositories, HumanOps and SQLite receipts',async()=>{
 const f=fixture(),names={a:'账号台账',d:'选剧池',c:'采集数据',r:'发布记录'};let posts=0;
 const matrix=rows=>{const fields=[...new Set(rows.flatMap(r=>Object.keys(r.fields)))];return {code:0,data:{fields,record_id_list:rows.map(r=>r.record_id),data:rows.map(r=>fields.map(k=>r.fields[k]??null)),total:rows.length}}};
 const client=new FeishuClient({tokenProvider:async()=>'test-only',fetchJson:async(url,o)=>{
  const t=new URL(url).pathname.match(/tables\/([^/]+)/)?.[1];assert.ok(names[t]);
  if(url.includes('/fields')){const fields=BASE_FIELD_SPECS[names[t]].filter(s=>s.autoNumberPrefix||['single_select','multi_select'].includes(s.kind)).map((s,i)=>s.autoNumberPrefix?{field_id:`f${i}`,name:s.name,type:'auto_number',style:{rules:[{text:s.autoNumberPrefix,type:'text'},{length:6,type:'incremental_number'}]}}:{field_id:`f${i}`,name:s.name,type:'select',multiple:s.kind==='multi_select',options:(s.options??[]).map(name=>({name}))});return {code:0,data:{fields,total:fields.length}};}
  if(url.endsWith('/batch_create')){posts++;assert.equal(o.body.create_records.length,4);assert.equal(f.jobs.db.prepare('SELECT count(*) AS n FROM preview_receipts WHERE used_at IS NOT NULL').get().n,5);const created=o.body.create_records.map((fields,i)=>({record_id:`wire${i+1}`,fields:{...structuredClone(fields),发布ID:`SR-${String(i+1).padStart(6,'0')}`}}));f.rows[t].push(...created);return {code:0,data:{record_id_list:created.map(r=>r.record_id).reverse()}};}
  if(url.endsWith('/batch_get'))return matrix(f.rows[t].filter(r=>o.body.record_id_list.includes(r.record_id)));
  assert.equal(o.method,'GET');return matrix(f.rows[t]);
 }});
 for(const r of Object.values(f.repos))if(r?.tableId)r.client=client;
 try{const preview=await f.preview();const result=await f.apply(preview);assert.equal(result.status,'success');assert.equal(posts,1);assert.deepEqual(result.completed,['SR-000001','SR-000002','SR-000003','SR-000004']);assert.equal(f.jobs.db.prepare("SELECT count(*) AS n FROM audit_events WHERE action='create'").get().n,4);}finally{f.jobs.close();}
});
test('failed record readback retains acknowledged IDs and verified slots without resending',async()=>{
 const f=fixture();try{const p=await f.preview(),read=f.client.getRecord;f.client.getRecord=async(...args)=>{if(args[2]==='new-2')throw new ShortDramaError('base_response_invalid','malformed readback');return read(...args)};
 const r=await f.apply(p);assert.equal(r.status,'partial');assert.equal(f.posts(),1);assert.equal(f.rows.r.length,4);assert.equal(r.error.cause_details.record_ids.length,4);assert.deepEqual(r.completed,['SR-000003','SR-000004']);await assert.rejects(f.apply(p),e=>e.code==='preview_used');assert.equal(f.posts(),1);
 }finally{f.jobs.close();}
});
