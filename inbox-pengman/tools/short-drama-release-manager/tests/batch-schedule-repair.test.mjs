import test from 'node:test';import assert from 'node:assert/strict';import {createHash,randomUUID} from 'node:crypto';
import * as repair from '../src/batch-schedule-repair.mjs';import {JobStore} from '../src/job-store.mjs';import {baseBinding} from '../src/human-ops.mjs';import {BaseRepositories} from '../src/base-repositories.mjs';
function fixture(){
 const jobs=new JobStore(':memory:'),batch='SB-partial',ids={accounts:'tbl-a',dramas:'tbl-d',captures:'tbl-c',releases:'tbl-r'};
 const basePatch={日期:'2026-09-23',计划发布时间:'2026-09-23',账号:[{id:'a'}],剧:[{id:'d'}],批次ID:batch,批次计划条数:3,处理负责人:[{id:'ou_owner'}],备注:'',归档状态:'active'};
 const rows={'tbl-a':[{record_id:'a',fields:{账号ID:'one'}}],'tbl-d':[{record_id:'d',fields:{剧ID:'SD-000001'}}],'tbl-c':[],'tbl-r':[{record_id:'r1',fields:{...basePatch,发布ID:'SR-000001',计划序号:1,备注:null}}]};const writes=[];let seq=1;
 const client={listRecords:async(_a,t)=>({complete:true,items:structuredClone(rows[t])}),getRecord:async(_a,t,id)=>structuredClone(rows[t].find(x=>x.record_id===id)),listFields:async()=>({complete:true,items:[{name:'发布ID',type:'auto_number',style:{rules:[{text:'SR-',type:'text'},{length:6,type:'incremental_number'}]}}]}),createRecords:async(_a,t,records,options={})=>{await options.beforeWrite?.();return records.map(r=>{const i=++seq,record={record_id:'r'+i,fields:{...Object.fromEntries(Object.entries(structuredClone(r.fields)).map(([k,v])=>[k,v===''?null:v])),发布ID:'SR-'+String(i).padStart(6,'0')}};rows[t].push(record);writes.push(record);return {record_id:record.record_id};});},updateRecords:async()=>{throw Error('Must never edit existing rows')}};
 const repos=new BaseRepositories({client,appToken:'base',tableIds:ids,sleep:async()=>{}});repos.releases.serverGeneratedIds=true;
 const binding=createHash('sha256').update(JSON.stringify(Object.fromEntries(['accounts','dramas','captures','releases'].map(k=>[k,[repos[k].appToken,repos[k].tableId]])))).digest('hex');
 const children=[];
 for(let i=1;i<=3;i++){
  const rid='sdp_'+randomUUID(),patch={v:1,base_binding:baseBinding(repos),action:'create',table:'发布记录',id_generation:'base_auto_number',targets:[{key:'pending:'+randomUUID(),patch:{...basePatch,计划序号:i}}],before:[]};
  jobs.createPreview({receiptId:rid,actorId:'owner',chatId:'chat',action:'create',targetTable:'发布记录',targetKey:patch.targets[0].key,beforeHash:'before',patch});children.push(rid);if(i===1)jobs.consumePreview(rid,{actorId:'owner',chatId:'chat',beforeHash:'before'});
 }
 const parent='sdp_'+randomUUID();jobs.createPreview({receiptId:parent,actorId:'owner',chatId:'chat',action:'batch_schedule',targetTable:'发布记录',targetKey:batch,beforeHash:'before',patch:{action:'batch_schedule',batch_id:batch,binding,children}});jobs.consumePreview(parent,{actorId:'owner',chatId:'chat',beforeHash:'before'});
 return {jobs,repos,rows,client,writes,batch,parent,children,opts:{jobs,repos,batchId:batch,parentReceiptId:parent}};
}
test('inspection uses the consumed original plan and identifies only unexecuted slots',async()=>{
 const f=fixture();assert.equal(typeof repair.inspectScheduleRepair,'function');const p=await repair.inspectScheduleRepair(f.opts);assert.deepEqual(p.missing.map(x=>x.sequence),[2,3]);assert.equal(p.existing[0].release_id,'SR-000001');assert.equal(p.missing[0].patch.备注,null);assert.equal(f.writes.length,0);f.jobs.close();
});
test('repair fills only missing slots, leaves existing row untouched and does not replay receipts',async()=>{
 const f=fixture();assert.equal(typeof repair.processScheduleRepairs,'function');const p=await repair.inspectScheduleRepair(f.opts),before=structuredClone(f.rows['tbl-r'][0]);
 const opts={jobs:f.jobs,repos:f.repos,requests:[{batch_id:f.batch,parent_receipt_id:f.parent,expected_version:p.version}]};const r=await repair.processScheduleRepairs(opts);assert.equal(r.created,2);assert.equal(r.status,'success');assert.deepEqual(f.rows['tbl-r'][0],before);assert.deepEqual(f.rows['tbl-r'].map(x=>x.fields.计划序号),[1,2,3]);assert.equal(f.jobs.getPreview(f.children[1]).used_at,null);await repair.processScheduleRepairs(opts);assert.equal(f.writes.length,2);f.jobs.close();
});
test('human edits, duplicate slots and missing already-attempted slots block repair',async()=>{
 for(const kind of ['edit','duplicate','attempted','unconfirmed']){
  const f=fixture();assert.equal(typeof repair.inspectScheduleRepair,'function');
  if(kind==='edit')f.rows['tbl-r'][0].fields.备注='human change';if(kind==='duplicate')f.rows['tbl-r'].push({record_id:'r2',fields:{...f.rows['tbl-r'][0].fields,发布ID:'SR-000002'}});if(kind==='attempted')f.jobs.consumePreview(f.children[1],{actorId:'owner',chatId:'chat',beforeHash:'before'});if(kind==='unconfirmed')f.jobs.db.prepare('UPDATE preview_receipts SET used_at=NULL WHERE receipt_id=?').run(f.parent);
  await assert.rejects(repair.inspectScheduleRepair(f.opts));assert.equal(f.writes.length,0);f.jobs.close();
 }
});
test('stale approved repair and uncertain write never get blindly replayed',async()=>{
 const f=fixture();assert.equal(typeof repair.processScheduleRepairs,'function');const p=await repair.inspectScheduleRepair(f.opts);let attempts=0;f.client.createRecords=async()=>{attempts++;throw Error('lost response');};const opts={jobs:f.jobs,repos:f.repos,requests:[{batch_id:f.batch,parent_receipt_id:f.parent,expected_version:p.version}]};const r=await repair.processScheduleRepairs(opts);assert.equal(r.status,'partial');await repair.processScheduleRepairs(opts);assert.equal(attempts,1);f.jobs.close();
});
import {HumanOpsService} from '../src/human-ops.mjs';import {BatchOpsService} from '../src/release-batches.mjs';
test('real repositories and HumanOps create a full auto-number batch with nullable blank notes',async()=>{
 const f=fixture();f.rows['tbl-r']=[];f.rows['tbl-a'][0].fields.负责人=[{id:'ou_owner'}];
 const ops=new HumanOpsService({repos:f.repos,jobs:f.jobs,operators:new Set(['ou_owner']),privileged:new Set(),now:()=>new Date(),makeReceiptId:()=>`sdp_${randomUUID()}`,allocateDramaId:()=>{throw Error('no local IDs')},allocateReleaseId:()=>{throw Error('no local IDs')}});
 const b=new BatchOpsService({repos:f.repos,jobs:f.jobs,humanOps:ops,readPosts:()=>[],now:()=>new Date(),isWriter:()=>true});
 const p=await b.previewSchedule({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-000001',plannedAt:'2026-09-24',count:3});assert.equal(f.writes.length,0);
 const result=await b.apply({actorId:'ou_owner',chatId:'chat',receiptId:p.receipt_id});assert.equal(result.status,'success');assert.equal(result.completed.length,3);assert.deepEqual(f.rows['tbl-r'].map(x=>x.fields.计划序号),[1,2,3]);assert.ok(f.rows['tbl-r'].every(r=>r.fields.备注===null));f.jobs.close();
});
test('a repaired slot counts once after a changed approved snapshot is rejected',async()=>{
 const f=fixture();const p=await repair.inspectScheduleRepair(f.opts);f.rows['tbl-r'][0].fields.RS收益=1;
 const r=await repair.processScheduleRepairs({jobs:f.jobs,repos:f.repos,requests:[{batch_id:f.batch,parent_receipt_id:f.parent,expected_version:p.version}]});assert.equal(r.created,0);assert.equal(r.errors[0].code,'batch_repair_stale');assert.equal(f.writes.length,0);f.jobs.close();
});

test('named settled-absence review allows a consumed missing slot without reusing its receipt',async()=>{
 const f=fixture();const past=new Date(Date.now()-10*60*1000);f.jobs.consumePreview(f.children[1],{actorId:'owner',chatId:'chat',beforeHash:'before',now:past});
 await assert.rejects(repair.inspectScheduleRepair(f.opts),e=>e.code==='batch_repair_write_uncertain');
 const settled={receipt_ids:[f.children[1]],verified_at:new Date().toISOString()};const p=await repair.inspectScheduleRepair({...f.opts,settledAbsence:settled});assert.deepEqual(p.missing.map(x=>x.sequence),[2,3]);
 const used=f.jobs.getPreview(f.children[1]).used_at;
 const r=await repair.processScheduleRepairs({jobs:f.jobs,repos:f.repos,requests:[{batch_id:f.batch,parent_receipt_id:f.parent,expected_version:p.version,settled_absence:settled}]});assert.equal(r.created,2);assert.equal(f.jobs.getPreview(f.children[1]).used_at,used);f.jobs.close();
});
test('settled absence review rejects recent, expired, unrelated or incomplete receipt evidence',async()=>{
 for(const kind of ['recent','expired','unrelated','not-covered']){
  const f=fixture();f.jobs.consumePreview(f.children[1],{actorId:'owner',chatId:'chat',beforeHash:'before',now:new Date(Date.now()-(kind==='recent'?0:600000))});
  const settled={receipt_ids:kind==='unrelated'?['sdp_'+randomUUID()]:kind==='not-covered'?[]:[f.children[1]],verified_at:new Date(Date.now()-(kind==='expired'?3600000:0)).toISOString()};
  await assert.rejects(repair.inspectScheduleRepair({...f.opts,settledAbsence:settled}));assert.equal(f.writes.length,0);f.jobs.close();
 }
});
test('only a recorded preflight failure proves a consumed slot had no write attempt',async()=>{
 for(const attempted of [false,true]){
  const f=fixture();f.jobs.consumePreview(f.children[1],{actorId:'owner',chatId:'chat',beforeHash:'before'});
  f.jobs.appendAudit({actorId:'owner',action:'batch-partial',targetTable:'发布记录',targetKey:f.batch,before:{receipt_id:f.parent},after:{failed_receipt:f.children[1]},readback:{cause_details:{write_attempted:attempted,phase:'generated_create_preflight'}}});
  if(attempted)await assert.rejects(repair.inspectScheduleRepair(f.opts));else assert.deepEqual((await repair.inspectScheduleRepair(f.opts)).missing.map(x=>x.sequence),[2,3]);f.jobs.close();
 }
});
