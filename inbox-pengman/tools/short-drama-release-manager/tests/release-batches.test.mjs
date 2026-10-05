import test from 'node:test';
import assert from 'node:assert/strict';
import * as batches from '../src/release-batches.mjs';
const row=(id,fields)=>({record_id:id,fields});
export function fixture(){
 const data={accounts:new Map([['one',row('a',{账号ID:'one',账号名:'Friendly',负责人:[{id:'ou_owner'}]})]]),dramas:new Map([['SD-1',row('d',{剧ID:'SD-1',剧名:'Hunter’s Prey'})],['SD-2',row('d2',{剧ID:'SD-2',剧名:'Other Drama'})]]),captures:new Map(),releases:new Map()};
 const posts=[];
 for(let i=1;i<=3;i++){
  data.releases.set(`SR-${i}`,row(`r${i}`,{发布ID:`SR-${i}`,账号:[{id:'a'}],剧:[{id:'d'}],日期:'2026-09-21',计划发布时间:'2026-09-21',批次ID:'B-1',计划序号:i,批次计划条数:3,处理负责人:[{id:'ou_owner'}],归档状态:'active'}));
  const url=`https://www.tiktok.com/@one/video/${i}`;const at=`2026-09-21T0${i}:00:00Z`;
  data.captures.set(String(i),row(`c${i}`,{'Post ID':String(i),账号:[{id:'a'}],发布时间:at,采集时间:'2026-09-21T16:10:00Z',视频链接:url,关联发布记录:[]}));
  posts.push({post_id:String(i),username:'one',post_url:url,published_at:at,caption:"Hunter's Prey",captured_at:'2026-09-21T16:10:00Z'});
 }
 const repos=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,{tableId:`tbl_${k}`,appToken:'base_test',loadIndex:async()=>structuredClone(v)}]));
 return {data,posts,input:{repos,readPosts:()=>structuredClone(posts),now:new Date('2026-09-22T02:00:00Z')}};
}
test('batch query API exists before implementing it',()=>assert.equal(typeof batches.queryReleaseBatches,'function'));
test('excluded Post IDs cannot become automatic batch candidates or count evidence',async()=>{
 const f=fixture();const batch=(await batches.queryReleaseBatches({...f.input,excludedPostIds:['2']})).rows[0];
 assert.deepEqual(batch.candidates.map(item=>item.post_id),['1','3']);
 assert.equal(batch.proposed.some(item=>item.post_id==='2'),false);
 assert.ok(batch.reasons.includes('count_short'));
});
test('groups three slots and sorts posts by real publish time without per-video Part matching',async()=>{
 const f=fixture();f.posts.reverse();f.data.captures=new Map([...f.data.captures].reverse());
 const r=await batches.queryReleaseBatches(f.input);assert.equal(r.mutations,0);assert.equal(r.rows.length,1);
 const b=r.rows[0];assert.equal(b.state,'needs_confirmation');assert.deepEqual(b.proposed.map(x=>[x.release_id,x.post_id]),[['SR-1','1'],['SR-2','2'],['SR-3','3']]);assert.deepEqual(b.owner_ids,['ou_owner']);
});
test('extra and missing posts never silently fill a whole batch',async()=>{
 const f=fixture();f.data.captures.delete('3');f.posts.pop();let b=(await batches.queryReleaseBatches(f.input)).rows[0];assert.equal(b.proposed.length,2);assert.equal(b.remaining,3);assert.ok(b.reasons.includes('count_short'));
 f.data.captures.set('4',row('c4',{'Post ID':'4',账号:[{id:'a'}],发布时间:'2026-09-21T04:00:00Z',采集时间:'2026-09-21T16:10:00Z',视频链接:'https://www.tiktok.com/@one/video/4'}));f.data.captures.set('5',row('c5',{...f.data.captures.get('4').fields,'Post ID':'5',视频链接:'https://www.tiktok.com/@one/video/5'}));
 b=(await batches.queryReleaseBatches(f.input)).rows[0];assert.ok(b.reasons.includes('count_extra'));assert.equal(b.proposed.length,0);
});
test('content unknown is shown and another known title is excluded',async()=>{
 const f=fixture();f.posts[0].caption='watch more';f.posts[1].caption='Other Drama';const b=(await batches.queryReleaseBatches(f.input)).rows[0];assert.equal(b.candidates.length,2);assert.ok(b.reasons.includes('content_unverified'));
});
test('claims including archived records stay reserved, and confirmed slots never reorder',async()=>{
 const f=fixture();Object.assign(f.data.releases.get('SR-2').fields,{'Post ID':'1',视频链接:'https://www.tiktok.com/@one/video/1',采集记录:[{id:'c1'}]});f.data.captures.get('1').fields.关联发布记录=[{id:'r2'}];
 const b=(await batches.queryReleaseBatches(f.input)).rows[0];assert.equal(b.linked,1);assert.deepEqual(b.proposed.map(x=>[x.release_id,x.post_id]),[['SR-1','2'],['SR-3','3']]);
 f.data.releases.set('SR-old',row('old',{归档状态:'archived','Post ID':'3'}));const c=(await batches.queryReleaseBatches(f.input)).rows[0];assert.equal(c.candidates.some(x=>x.post_id==='3'),false);
});
test('candidate competition includes other batches and unbatched plans',async()=>{
 const f=fixture();f.data.releases.set('SR-other',row('other',{账号:[{id:'a'}],剧:[{id:'d'}],日期:'2026-09-21',归档状态:'active'}));const b=(await batches.queryReleaseBatches(f.input)).rows[0];assert.ok(b.reasons.includes('competing_plans'));
});
test('future batches do not notify and changed identities invalidate the version',async()=>{
 const f=fixture();const a=(await batches.queryReleaseBatches({...f.input,now:new Date('2026-09-21T00:00:00Z')})).rows[0];assert.equal(a.state,'scheduled');assert.equal(a.notify,false);
 const b=(await batches.queryReleaseBatches(f.input)).rows[0];f.data.releases.get('SR-1').fields.备注='human edit';const c=(await batches.queryReleaseBatches(f.input)).rows[0];assert.notEqual(b.version,c.version);
});
test('no silent scope widening on invalid batch ID or duplicate source identity',async()=>{
 const f=fixture();await assert.rejects(batches.queryReleaseBatches({...f.input,key:'missing'}));f.posts.push(f.posts[0]);await assert.rejects(batches.queryReleaseBatches(f.input));
});
import { JobStore } from '../src/job-store.mjs';
import { HumanOpsService } from '../src/human-ops.mjs';
import { randomUUID } from 'node:crypto';
function serviceFixture(){
 const f=fixture(),jobs=new JobStore(':memory:'),writes=[];
 const primary={accounts:'账号ID',dramas:'剧ID',captures:'Post ID',releases:'发布ID'};
 for(const [name,repo]of Object.entries(f.input.repos)){
  repo.tableName={accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'}[name];repo.primaryField=primary[name];
  repo.getByKey=async key=>structuredClone(f.data[name].get(key)??null);
  repo.upsertByKey=async(key,patch)=>{const old=f.data[name].get(key)??row(`rec-${key}`,{[primary[name]]:key});Object.assign(old.fields,structuredClone(patch));f.data[name].set(key,old);writes.push({name,key,patch});return {record:structuredClone(old),readback:'verified'};};
 }
 f.input.repos.releases.linkCaptureSafely=async(key,cid)=>{const r=f.data.releases.get(key);r.fields.采集记录=[{id:cid}];const c=[...f.data.captures.values()].find(c=>c.record_id===cid);c.fields.关联发布记录=[{id:r.record_id}];writes.push({key,link:cid});return {record:structuredClone(r),readback:'verified'};};
 let seq=10;
 const humanOps=new HumanOpsService({repos:f.input.repos,jobs,operators:new Set(['ou_owner']),privileged:new Set(['ou_admin']),now:()=>f.input.now,makeReceiptId:()=>`sdp_${randomUUID()}`,allocateDramaId:()=>`SD-${String(++seq).padStart(6,'0')}`,allocateReleaseId:()=>`SR-${String(++seq).padStart(6,'0')}`});
 return {...f,jobs,writes,humanOps};
}
function directServiceFixture(){
 const f=serviceFixture();let sequence=10;
 f.input.repos.releases.serverGeneratedIds=true;
 f.input.repos.releases.createManyWithGeneratedIds=async(patches,_actor,{beforeWrite}={})=>{
  const before=structuredClone(f.data.releases);
  await beforeWrite?.(before);
  const records=patches.map(patch=>{
   const id=`SR-${++sequence}`,record=row(`rec-${id}`,{发布ID:id,...structuredClone(patch),归档状态:'active'});
   f.data.releases.set(id,record);f.writes.push({name:'releases',key:id,patch});return structuredClone(record);
  });
  return {records,readback:'verified'};
 };
 return f;
}
test('one batch preview binds ordered posts and applies with real HumanOps and SQLite receipts',async()=>{
 assert.equal(typeof batches.BatchOpsService,'function');const f=serviceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:id=>['ou_owner','ou_admin'].includes(id),isPrivileged:id=>id==='ou_admin'});
 const preview=await s.previewMatch({actorId:'ou_owner',chatId:'chat',batchId:'B-1'});assert.equal(f.writes.length,0);assert.equal(preview.proposed.length,3);
 await assert.rejects(s.apply({actorId:'ou_admin',chatId:'chat',receiptId:preview.receipt_id}),e=>e.code==='preview_actor_mismatch');
 const result=await s.apply({actorId:'ou_owner',chatId:'chat',receiptId:preview.receipt_id});assert.equal(result.readback,'verified');assert.equal(result.completed.length,3);assert.equal((await s.query({key:'B-1'})).rows[0].state,'complete');
 await assert.rejects(s.apply({actorId:'ou_owner',chatId:'chat',receiptId:preview.receipt_id}),e=>e.code==='preview_used');f.jobs.close();
});
test('changed batch invalidates all writes before consuming confirmation',async()=>{
 assert.equal(typeof batches.BatchOpsService,'function');const f=serviceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true,isPrivileged:()=>false});
 const p=await s.previewMatch({actorId:'ou_owner',chatId:'chat',batchId:'B-1'});f.data.releases.get('SR-3').fields.备注='changed';await assert.rejects(s.apply({actorId:'ou_owner',chatId:'chat',receiptId:p.receipt_id}),e=>e.code==='preview_stale');assert.equal(f.writes.length,0);f.jobs.close();
});
test('partial apply reports completed entries and cannot replay parent',async()=>{
 assert.equal(typeof batches.BatchOpsService,'function');const f=serviceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true,isPrivileged:()=>false});
 const p=await s.previewMatch({actorId:'ou_owner',chatId:'chat',batchId:'B-1'});const original=f.input.repos.releases.linkCaptureSafely;f.input.repos.releases.linkCaptureSafely=async(key,...args)=>{if(key==='SR-2')throw Error('network');return original(key,...args);};
 const r=await s.apply({actorId:'ou_owner',chatId:'chat',receiptId:p.receipt_id});assert.equal(r.status,'partial');assert.equal(r.completed.length,1);assert.equal(r.next_step,'inspect_before_retry');await assert.rejects(s.apply({actorId:'ou_owner',chatId:'chat',receiptId:p.receipt_id}),e=>e.code==='preview_used');f.jobs.close();
});
test('schedule count generates three slots with owner inherited from account, preview never writes',async()=>{
 assert.equal(typeof batches.BatchOpsService,'function');const f=serviceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true,isPrivileged:()=>false});
 const p=await s.previewSchedule({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3});assert.equal(f.writes.length,0);assert.equal(p.plans.length,3);assert.deepEqual(p.plans.map(p=>p.计划序号),[1,2,3]);assert.deepEqual(p.plans[0].处理负责人,[{id:'ou_owner'}]);
 const r=await s.apply({actorId:'ou_owner',chatId:'chat',receiptId:p.receipt_id});assert.equal(r.status,'success');assert.equal(f.data.releases.size,6);f.jobs.close();
});
test('a complete direct schedule writes and verifies three slots in one call',async()=>{
 const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:id=>id==='ou_owner'});
 const result=await s.scheduleDirect({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3});
 assert.equal(result.status,'success');assert.equal(result.readback,'verified');assert.equal(result.count,3);assert.equal(result.planned_at,'2026-09-24');assert.equal(result.completed.length,3);assert.equal(f.data.releases.size,6);
 f.jobs.close();
});
test('direct schedule refuses legacy text-ID tables that would require separate writes',async()=>{
 const f=serviceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 await assert.rejects(s.scheduleDirect({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3}),error=>error.code==='batch_direct_requires_generated_ids');
 assert.equal(f.writes.length,0);f.jobs.close();
});
test('an identical direct schedule returns the existing batch without extra records',async()=>{
 const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3};
 const first=await s.scheduleDirect(input),written=f.writes.length;
 const repeated=await s.scheduleDirect(input);
 assert.equal(repeated.status,'already_scheduled');assert.equal(repeated.batch_id,first.batch_id);assert.deepEqual(repeated.completed,first.completed);
 assert.equal(f.writes.length,written);assert.equal(f.data.releases.size,6);f.jobs.close();
});
test('a changed count on the same account drama and day is a conflict',async()=>{
 const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3};
 await s.scheduleDirect(input);
 await assert.rejects(s.scheduleDirect({...input,count:4}),error=>error.code==='batch_schedule_conflict');
 assert.equal(f.data.releases.size,6);f.jobs.close();
});
test('an unrelated drama on the same account and day can have its own direct batch',async()=>{
 const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3};
 const first=await s.scheduleDirect(input),second=await s.scheduleDirect({...input,drama:'SD-2',count:2});
 assert.equal(first.status,'success');assert.equal(second.status,'success');assert.notEqual(second.batch_id,first.batch_id);assert.equal(f.data.releases.size,8);f.jobs.close();
});
test('direct schedule rejects past days and never creates a receipt',async()=>{
 const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 await assert.rejects(s.scheduleDirect({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-21',count:3}),error=>error.code==='batch_schedule_past_date');
 assert.equal(f.data.releases.size,3);f.jobs.close();
});
test('direct schedule accepts the current Chicago day after Beijing has advanced',async()=>{
 const f=directServiceFixture();f.input.now=new Date('2026-09-25T02:00:00Z');const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true,publicationTimezone:'America/Chicago',publicationTimezoneSince:'2026-09-24'});
 const result=await s.scheduleDirect({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3});
 assert.equal(result.status,'success');assert.equal(result.readback,'verified');f.jobs.close();
});
test('direct schedule rejects a non-writer before any Base write',async()=>{
 const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:id=>id==='ou_owner'});
 await assert.rejects(s.scheduleDirect({actorId:'ou_other',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3}),error=>error.code==='actor_write_denied');
 assert.equal(f.writes.length,0);f.jobs.close();
});
test('direct schedule treats an incomplete or archived batch as a conflict',async()=>{
 for(const alteration of ['remove','archive']){
  const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
  const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3};
  const first=await s.scheduleDirect(input);
  if(alteration==='remove')f.data.releases.delete(first.completed[1]);
  else f.data.releases.get(first.completed[1]).fields.归档状态='archived';
  const before=f.writes.length;
  await assert.rejects(s.scheduleDirect(input),error=>error.code==='batch_schedule_conflict');
  assert.equal(f.writes.length,before);f.jobs.close();
 }
});
test('direct schedule stops on a legacy row with the same account drama and date',async()=>{
 const f=directServiceFixture();f.data.releases.set('SR-legacy',row('old',{发布ID:'SR-legacy',账号:[{id:'a'}],剧:[{id:'d'}],日期:'2026-09-24',归档状态:'active'}));
 const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 await assert.rejects(s.scheduleDirect({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3}),error=>error.code==='batch_schedule_conflict');
 assert.equal(f.writes.length,0);f.jobs.close();
});
test('direct schedule stops when an account-day release has no drama relation',async()=>{
 const f=directServiceFixture();f.data.releases.set('SR-unassigned',row('unassigned',{发布ID:'SR-unassigned',账号:[{id:'a'}],日期:'2026-09-24',归档状态:'active'}));
 const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 await assert.rejects(s.scheduleDirect({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3}),error=>error.code==='batch_schedule_conflict');
 assert.equal(f.writes.length,0);f.jobs.close();
});
test('direct schedule stops when a drama-day release has no account relation',async()=>{
 const f=directServiceFixture();f.data.releases.set('SR-unassigned',row('unassigned',{发布ID:'SR-unassigned',剧:[{id:'d'}],日期:'2026-09-24',归档状态:'active'}));
 const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 await assert.rejects(s.scheduleDirect({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3}),error=>error.code==='batch_schedule_conflict');
 assert.equal(f.writes.length,0);f.jobs.close();
});
test('direct schedule treats changed owner or notes as a conflict',async()=>{
 const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 const input={actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3};
 await s.scheduleDirect(input);
 await assert.rejects(s.scheduleDirect({...input,ownerId:'ou_other'}),error=>error.code==='batch_schedule_conflict');
 await assert.rejects(s.scheduleDirect({...input,notes:'new note'}),error=>error.code==='batch_schedule_conflict');
 assert.equal(f.data.releases.size,6);f.jobs.close();
});
test('direct schedule rejects an instant when a calendar date is required',async()=>{
 const f=directServiceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 await assert.rejects(s.scheduleDirect({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24T00:00:00+08:00',count:3}),error=>error.code==='batch_input_invalid');
 assert.equal(f.writes.length,0);f.jobs.close();
});
test('verified same-person alias permits owner confirmation without granting strangers access',async()=>{
 const f=serviceFixture();const opts={...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:id=>['ou_owner','ou_other'].includes(id),isPrivileged:()=>false,canonicalOwner:id=>id==='ou_owner'?'ou_person':id};
 for(const r of f.data.releases.values())r.fields.处理负责人=[{id:'ou_person'}];
 const s=new batches.BatchOpsService(opts);await assert.rejects(s.previewMatch({actorId:'ou_other',chatId:'chat',batchId:'B-1'}),e=>e.code==='batch_owner_required');const p=await s.previewMatch({actorId:'ou_owner',chatId:'chat',batchId:'B-1'});assert.equal(p.status,'preview');f.jobs.close();
});

test('a user_id session can preview two planned records with its canonical owner and zero business writes',async()=>{
 const f=serviceFixture(),uid='74378dd3',owner='ou_ef5bf436e9a3d1d5057d43b277044310';
 f.data.accounts.get('one').fields.负责人=[{id:owner}];const operators=new Set([uid,owner]);let sequence=20;
 const humanOps=new HumanOpsService({repos:f.input.repos,jobs:f.jobs,operators,privileged:new Set(),now:()=>f.input.now,makeReceiptId:()=>`sdp_${randomUUID()}`,allocateDramaId:()=>`SD-${String(++sequence).padStart(6,'0')}`,allocateReleaseId:()=>`SR-${String(++sequence).padStart(6,'0')}`});
 const service=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps,now:()=>f.input.now,isWriter:id=>operators.has(id),canonicalOwner:id=>id===uid?owner:id});
 const p=await service.previewSchedule({actorId:uid,chatId:'test-chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:2});
 assert.equal(p.status,'preview');assert.equal(p.plans.length,2);assert.equal(f.jobs.getPreview(p.receipt_id).actor_id,uid);assert.deepEqual(p.plans[0].处理负责人,[{id:owner}]);assert.equal(f.writes.length,0);
 await assert.rejects(service.previewSchedule({actorId:'unknown',chatId:'test-chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:2}),e=>e.code==='actor_write_denied');f.jobs.close();
});

test('three-slot scheduling succeeds when Base reads empty text back as null',async()=>{
 const f=serviceFixture();const original=f.input.repos.releases.upsertByKey;
 f.input.repos.releases.upsertByKey=async(key,patch,kind)=>original(key,Object.fromEntries(Object.entries(patch).map(([k,v])=>[k,v===''?null:v])),kind);
 const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 const p=await s.previewSchedule({actorId:'ou_owner',chatId:'chat',account:'one',drama:'SD-1',plannedAt:'2026-09-24',count:3});
 const r=await s.apply({actorId:'ou_owner',chatId:'chat',receiptId:p.receipt_id});assert.equal(r.status,'success');assert.equal(r.completed.length,3);assert.equal(f.writes.length,3);assert.ok(p.plans.every(p=>p.备注===null));f.jobs.close();
});
test('a valid future schedule does not claim missing publication or collection evidence',async()=>{
 const f=fixture();const b=(await batches.queryReleaseBatches({...f.input,now:new Date('2026-09-20T01:00:00Z')})).rows[0];assert.equal(b.state,'scheduled');assert.equal(b.notify,false);assert.ok(!b.reasons.includes('count_short'));assert.ok(!b.reasons.includes('collection_unverified'));
});
test('a future plan with incomplete metadata remains visible without notifying about unpublished videos',async()=>{
 const f=fixture();f.data.releases.delete('SR-1');f.data.captures.clear();f.posts.length=0;
 const batch=(await batches.queryReleaseBatches({...f.input,now:new Date('2026-09-20T01:00:00Z')})).rows[0];
 assert.equal(batch.state,'conflict');assert.ok(batch.reasons.includes('batch_metadata_invalid'));
 assert.equal(batch.notify,false);
 assert.ok(!batch.reasons.includes('count_short'));
 assert.ok(!batch.reasons.includes('collection_unverified'));
 const after=(await batches.queryReleaseBatches({...f.input,now:new Date('2026-09-22T01:00:00Z')})).rows[0];
 assert.equal(after.state,'conflict');assert.equal(after.notify,true);
});

test('US business-day batches wait for local midnight and do not compete across adjacent Beijing dates',async()=>{
 const f=fixture(),times=['2026-09-24T14:00:00Z','2026-09-24T15:00:00Z','2026-09-25T04:00:00Z','2026-09-25T14:00:00Z','2026-09-25T15:00:00Z','2026-09-26T04:00:00Z'];
 for(let i=1;i<=3;i++){
  f.data.releases.get(`SR-${i}`).fields.日期='2026-09-24';
  f.data.releases.get(`SR-${i}`).fields.计划发布时间='2026-09-24';
 }
 for(let i=4;i<=6;i++){
  f.data.releases.set(`SR-${i}`,row(`r${i}`,{...f.data.releases.get('SR-1').fields,发布ID:`SR-${i}`,日期:'2026-09-25',计划发布时间:'2026-09-25',批次ID:'B-2',计划序号:i-3}));
 }
 for(let i=1;i<=6;i++){
  const postId=String(i),url=`https://www.tiktok.com/@one/video/${i}`;
  f.data.captures.set(postId,row(`c${i}`,{'Post ID':postId,账号:[{id:'a'}],发布时间:times[i-1],视频链接:url}));
  f.posts[i-1]={post_id:postId,username:'one',post_url:url,published_at:times[i-1],caption:"Hunter's Prey",captured_at:'2026-09-26T06:00:00Z'};
 }
 f.posts.length=2;f.data.captures.delete('3');for(let i=4;i<=6;i++)f.data.captures.delete(String(i));
 const options={...f.input,publicationTimezone:'America/Chicago',publicationTimezoneSince:'2026-09-24'};
 const early=(await batches.queryReleaseBatches({...options,now:new Date('2026-09-24T16:00:00Z')})).rows.find(x=>x.batch_id==='B-1');
 assert.equal(early.state,'scheduled');assert.equal(early.notify,false);assert.ok(!early.reasons.includes('count_short'));
 for(let i=3;i<=6;i++){
  const postId=String(i),url=`https://www.tiktok.com/@one/video/${i}`;
  f.data.captures.set(postId,row(`c${i}`,{'Post ID':postId,账号:[{id:'a'}],发布时间:times[i-1],视频链接:url}));
  f.posts.push({post_id:postId,username:'one',post_url:url,published_at:times[i-1],caption:"Hunter's Prey",captured_at:'2026-09-26T06:00:00Z'});
 }
 const rows=(await batches.queryReleaseBatches({...options,now:new Date('2026-09-26T08:00:00Z')})).rows;
 assert.deepEqual(rows.map(b=>[b.batch_id,b.candidates.map(c=>c.post_id)]),[['B-1',['1','2','3']],['B-2',['4','5','6']]]);
 assert.ok(rows.every(b=>!b.reasons.includes('competing_plans')&&!b.reasons.includes('date_differs')&&batches.isHighConfidenceBatch(b)));
});
test('an already linked post outside the US plan day blocks automatic completion',async()=>{
 const f=fixture(),times=['2026-09-24T04:00:00Z','2026-09-24T14:00:00Z','2026-09-24T15:00:00Z'];
 for(let i=1;i<=3;i++){
  const id=String(i);f.data.releases.get(`SR-${i}`).fields.日期='2026-09-24';f.data.releases.get(`SR-${i}`).fields.计划发布时间='2026-09-24';
  f.data.captures.get(id).fields.发布时间=times[i-1];f.posts[i-1].published_at=times[i-1];f.posts[i-1].captured_at='2026-09-25T06:00:00Z';
 }
 const first=f.data.releases.get('SR-1'),capture=f.data.captures.get('1');
 Object.assign(first.fields,{'Post ID':'1',视频链接:capture.fields.视频链接,采集记录:[{id:capture.record_id}]});capture.fields.关联发布记录=[{id:first.record_id}];
 const batch=(await batches.queryReleaseBatches({...f.input,publicationTimezone:'America/Chicago',publicationTimezoneSince:'2026-09-24',now:new Date('2026-09-25T08:00:00Z')})).rows[0];
 assert.equal(batch.linked,1);assert.deepEqual(batch.candidates.map(c=>c.post_id),['2','3']);assert.equal(batches.isHighConfidenceBatch(batch),false);
});


test('explicit batch Post IDs are matched and read back in one direct call',async()=>{
 const f=serviceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:id=>id==='ou_owner'});
 const result=await s.matchDirect({actorId:'ou_owner',chatId:'chat',batchId:'B-1',postIds:['3','1','2']});
 assert.equal(result.status,'success');assert.equal(result.readback,'verified');assert.deepEqual(result.completed,['SR-1','SR-2','SR-3']);
 assert.deepEqual(['SR-1','SR-2','SR-3'].map(id=>f.data.releases.get(id).fields['Post ID']),['1','2','3']);
 assert.equal(f.writes.filter(w=>w.patch?.['Post ID']).length,3);f.jobs.close();
});
test('direct batch matching requires exact selected Post IDs and a writer',async()=>{
 const f=serviceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:id=>id==='ou_owner'});
 await assert.rejects(s.matchDirect({actorId:'ou_owner',chatId:'chat',batchId:'B-1'}),e=>e.code==='batch_selection_required');
 await assert.rejects(s.matchDirect({actorId:'ou_other',chatId:'chat',batchId:'B-1',postIds:['1']}),e=>e.code==='actor_write_denied');
 await assert.rejects(s.matchDirect({actorId:'ou_owner',chatId:'chat',batchId:'B-1',postIds:['999']}),e=>e.code==='batch_selection_invalid');
 assert.equal(f.writes.length,0);f.jobs.close();
});
test('direct batch partial write reports verified subset and never retries the consumed receipt',async()=>{
 const f=serviceFixture();const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 const original=f.input.repos.releases.linkCaptureSafely;f.input.repos.releases.linkCaptureSafely=async(key,...args)=>{if(key==='SR-2')throw Error('network');return original(key,...args);};
 const result=await s.matchDirect({actorId:'ou_owner',chatId:'chat',batchId:'B-1',postIds:['1','2','3']});
 assert.equal(result.status,'partial');assert.deepEqual(result.completed,['SR-1']);assert.equal(result.next_step,'inspect_before_retry');
 assert.equal(f.writes.filter(w=>w.patch?.['Post ID']).length,2);f.jobs.close();
});


test('direct batch matching waits for a real Base mutation lease before writing',async()=>{
 const {baseBinding}=await import('../src/human-ops.mjs');
 const f=serviceFixture();const lockKey=`human-base:${baseBinding(f.input.repos)}`,ownerId='other-writer';
 assert.equal(f.jobs.acquireMutationLease({lockKey,ownerId,now:f.input.now,leaseSeconds:300}).owner_id,ownerId);
 const s=new batches.BatchOpsService({...f.input,jobs:f.jobs,humanOps:f.humanOps,now:()=>f.input.now,isWriter:()=>true});
 const release=setTimeout(()=>f.jobs.releaseMutationLease({lockKey,ownerId}),50);
 try{
  const result=await s.matchDirect({actorId:'ou_owner',chatId:'chat',batchId:'B-1',postIds:['1']});
  assert.equal(result.readback,'verified');assert.deepEqual(result.completed,['SR-1']);
  assert.equal(f.writes.filter(w=>w.patch?.['Post ID']).length,1);
 }finally{clearTimeout(release);f.jobs.releaseMutationLease({lockKey,ownerId});f.jobs.close();}
});
