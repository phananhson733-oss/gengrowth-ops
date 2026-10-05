import test from 'node:test';
import assert from 'node:assert/strict';
import * as q from '../src/release-batches.mjs';
const row=(record_id,fields)=>({record_id,fields});
function fixture(){
 const data={accounts:new Map([['one',row('a',{账号ID:'one',账号名:'One',负责人:[{id:'ou_owner'}]})]]),dramas:new Map([['SD-1',row('d',{剧ID:'SD-1',剧名:'The Clear Title'})]]),captures:new Map(),releases:new Map()};const posts=[];
 for(let i=1;i<=3;i++){
  const at=`2026-09-22T0${i}:00:00.000Z`,url=`https://www.tiktok.com/@one/video/${i}`;
  data.releases.set(`SR-${i}`,row(`r${i}`,{发布ID:`SR-${i}`,账号:[{id:'a'}],剧:[{id:'d'}],日期:'2026-09-22',计划发布时间:'2026-09-22',批次ID:'SB-1',计划序号:i,批次计划条数:3,处理负责人:[{id:'ou_owner'}],归档状态:'active'}));
  data.captures.set(String(i),row(`c${i}`,{'Post ID':String(i),账号:[{id:'a'}],发布时间:at,视频链接:url}));posts.push({post_id:String(i),username:'one',post_url:url,published_at:at,caption:'The Clear Title',captured_at:'2026-09-22T16:10:00Z'});
 }
 const repos=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,{loadIndex:async()=>structuredClone(v),tableName:{accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'}[k],tableId:'tbl-'+k,appToken:'base'}]));
 return {data,posts,repos,now:()=>new Date('2026-09-23T01:00:00Z'),query:async()=>q.queryReleaseBatches({repos,readPosts:()=>posts,now:new Date('2026-09-23T01:00:00Z')})};
}
function linkedCrossMidnight(f){
 const sets=f.records?{
  releases:f.records['tbl-releases'],captures:f.records['tbl-captures']
 }:{releases:[...f.data.releases.values()],captures:[...f.data.captures.values()]};
 const first=sets.releases[0],capture=sets.captures[0];
 first.fields['Post ID']='1';first.fields.视频链接=capture.fields.视频链接;first.fields.采集记录=[{id:capture.record_id}];
 capture.fields.关联发布记录=[{id:first.record_id}];
 for(const [id,publishedAt] of [['2','2026-09-22T16:30:00Z'],['3','2026-09-22T22:22:00Z']]){
  sets.captures.find(r=>r.fields['Post ID']===id).fields.发布时间=publishedAt;
  f.posts.find(p=>p.post_id===id).published_at=publishedAt;
 }
 for(const p of f.posts)p.captured_at='2026-09-23T00:00:00Z';
}
test('strict automatic eligibility is explicit and requires unique title evidence',async()=>{
 const f=fixture(),b=(await f.query()).rows[0];assert.equal(typeof q.isHighConfidenceBatch,'function');assert.equal(q.isHighConfidenceBatch(b),true);
 for(const reason of ['content_unverified','count_short','count_extra','competing_plans','collection_unverified','notes_say_unpublished'])assert.equal(q.isHighConfidenceBatch({...b,reasons:[reason]}),false);
 assert.equal(q.isHighConfidenceBatch({...b,linked:1}),false);assert.equal(q.isHighConfidenceBatch({...b,owner_ids:[]}),false);
});
test('verified linked prefix and next-morning posts can fill only the remaining slots',async()=>{
 const f=integration();linkedCrossMidnight(f);
 const before=structuredClone(f.records['tbl-releases'][0]);
 const batch=(await f.query()).rows[0];assert.deepEqual(batch.reasons,['date_differs']);
 assert.equal(q.isHighConfidenceBatch(batch),true);
 const result=await automatic.processAutomaticBatchMatches(f.opts);
 assert.equal(result.filled,2);assert.equal(result.batches,1);assert.equal(f.writes.length,2);
 assert.deepEqual(f.records['tbl-releases'][0],before);
 assert.deepEqual(f.records['tbl-releases'].map(r=>r.fields['Post ID']),['1','2','3']);
 f.jobs.close();
});
test('automatic matching completes consecutive US publication days without cross-day claims',async()=>{
 const f=integration(),releaseRows=f.records['tbl-releases'],captureRows=f.records['tbl-captures'];
 const times=['2026-09-24T14:00:00Z','2026-09-24T15:00:00Z','2026-09-25T04:00:00Z','2026-09-25T14:00:00Z','2026-09-25T15:00:00Z','2026-09-26T04:00:00Z'];
 for(let i=1;i<=3;i++){releaseRows[i-1].fields.日期='2026-09-24';releaseRows[i-1].fields.计划发布时间='2026-09-24';}
 for(let i=4;i<=6;i++)releaseRows.push(row(`r${i}`,{...releaseRows[0].fields,发布ID:`SR-${i}`,日期:'2026-09-25',计划发布时间:'2026-09-25',批次ID:'SB-2',计划序号:i-3}));
 for(let i=1;i<=6;i++){
  const id=String(i),url=`https://www.tiktok.com/@one/video/${i}`;
  if(i>3)captureRows.push(row(`c${i}`,{'Post ID':id,账号:[{id:'a'}],发布时间:times[i-1],视频链接:url}));
  else captureRows[i-1].fields.发布时间=times[i-1];
  f.posts[i-1]={post_id:id,username:'one',post_url:url,published_at:times[i-1],caption:'The Clear Title',captured_at:'2026-09-26T06:00:00Z'};
 }
 f.now=()=>new Date('2026-09-26T08:00:00Z');f.opts.now=f.now;f.opts.since='2026-09-24';
 f.opts.query=request=>q.queryReleaseBatches({...request,repos:f.repos,readPosts:()=>f.posts,now:f.now(),publicationTimezone:'America/Chicago',publicationTimezoneSince:'2026-09-24'});
 const result=await automatic.processAutomaticBatchMatches(f.opts);
 assert.equal(result.status,'success');assert.equal(result.filled,6);assert.equal(result.batches,2);
 assert.deepEqual(releaseRows.map(r=>r.fields['Post ID']),['1','2','3','4','5','6']);
 f.jobs.close();
});
test('an exclusive three-slot US batch fills three titleless posts by publish time after complete collection',async()=>{
 const f=integration(),times=['2026-09-28T16:00:00Z','2026-09-28T14:00:00Z','2026-09-28T15:00:00Z'];
 for(let i=1;i<=3;i++){
  const release=f.records['tbl-releases'][i-1],capture=f.records['tbl-captures'][i-1];
  release.fields.日期='2026-09-28';release.fields.计划发布时间='2026-09-28';
  capture.fields.发布时间=times[i-1];f.posts[i-1].published_at=times[i-1];
  f.posts[i-1].caption='watch more';f.posts[i-1].captured_at='2026-09-29T06:00:00Z';
 }
 f.now=()=>new Date('2026-09-29T08:00:00Z');f.opts.now=f.now;f.opts.countOnlySince='2026-09-28';
 f.opts.query=request=>q.queryReleaseBatches({...request,repos:f.repos,readPosts:()=>f.posts,now:f.now(),publicationTimezone:'America/Chicago',publicationTimezoneSince:'2026-09-24'});
 const result=await automatic.processAutomaticBatchMatches(f.opts);
 assert.equal(result.status,'success');assert.equal(result.filled,3);
 assert.deepEqual(f.records['tbl-releases'].map(r=>r.fields['Post ID']),['2','3','1']);
 assert.ok(f.records['tbl-releases'].every(r=>r.fields.匹配方式==='account_time'&&r.fields.采集记录?.length===1));
 f.jobs.close();
});
test('count-only matching holds extra posts, another plan, contradictory title, missing source evidence, and pre-rollout batches',async()=>{
 for(const variant of ['extra','competing','other_title','source_missing','historical']){
  const f=integration(),times=['2026-09-28T14:00:00Z','2026-09-28T15:00:00Z','2026-09-28T16:00:00Z'];
  for(let i=1;i<=3;i++){
   const release=f.records['tbl-releases'][i-1],capture=f.records['tbl-captures'][i-1];
   release.fields.日期='2026-09-28';release.fields.计划发布时间='2026-09-28';
   capture.fields.发布时间=times[i-1];f.posts[i-1].published_at=times[i-1];
   f.posts[i-1].caption='watch more';f.posts[i-1].captured_at='2026-09-29T06:00:00Z';
  }
  if(variant==='extra')f.posts.push({post_id:'4',username:'one',post_url:'https://www.tiktok.com/@one/video/4',published_at:'2026-09-28T17:00:00Z',caption:'Other Drama',captured_at:'2026-09-29T06:00:00Z'});
  if(variant==='competing')f.records['tbl-releases'].push(row('r4',{发布ID:'SR-4',账号:[{id:'a'}],剧:[{id:'d'}],日期:'2026-09-28',归档状态:'active'}));
  if(variant==='other_title'){
   f.records['tbl-dramas'].push(row('d2',{剧ID:'SD-2',剧名:'Other Drama'}));
   f.posts[0].caption='Other Drama';
  }
  if(variant==='source_missing')f.posts.pop();
  f.now=()=>new Date('2026-09-29T08:00:00Z');f.opts.now=f.now;
  f.opts.countOnlySince=variant==='historical'?'2026-09-29':'2026-09-28';
  f.opts.query=request=>q.queryReleaseBatches({...request,repos:f.repos,readPosts:()=>f.posts,now:f.now(),publicationTimezone:'America/Chicago',publicationTimezoneSince:'2026-09-24'});
  const result=await automatic.processAutomaticBatchMatches(f.opts);
  assert.equal(result.filled,0,variant);assert.equal(f.writes.length,0,variant);f.jobs.close();
 }
});
test('cross-day automatic matching stops for late posts or a non-prefix linked slot',async()=>{
 const f=fixture();linkedCrossMidnight(f);
 let batch=(await f.query()).rows[0];assert.equal(q.isHighConfidenceBatch(batch),true);
 assert.equal(q.isHighConfidenceBatch({...batch,candidates:batch.candidates.map((c,i)=>i===1?{...c,published_at:'2026-09-23T05:00:00Z'}:c)}),false);
 const first=f.data.releases.get('SR-1'),second=f.data.releases.get('SR-2');
 second.fields['Post ID']=first.fields['Post ID'];second.fields.视频链接=first.fields.视频链接;second.fields.采集记录=first.fields.采集记录;
 delete first.fields['Post ID'];delete first.fields.视频链接;delete first.fields.采集记录;
 f.data.captures.get('1').fields.关联发布记录=[{id:second.record_id}];
 batch=(await f.query()).rows[0];assert.equal(q.isHighConfidenceBatch(batch),false);
});
test('negative human notes and known homonymous dramas block automatic matching',async()=>{
 const f=fixture();f.data.releases.get('SR-1').fields.备注='未发布，待制作';let b=(await f.query()).rows[0];assert.ok(b.reasons.includes('notes_say_unpublished'));
 f.data.releases.get('SR-1').fields.备注='';f.data.dramas.set('SD-2',row('d2',{剧ID:'SD-2',剧名:'The Clear Title'}));b=(await f.query()).rows[0];assert.equal(q.isHighConfidenceBatch(b),false);
});
import * as automatic from '../src/batch-auto-match.mjs';
import {BaseRepositories} from '../src/base-repositories.mjs';
import {JobStore} from '../src/job-store.mjs';
import {baseBinding} from '../src/human-ops.mjs';
function integration(){
 const f=fixture(),ids={accounts:'tbl-accounts',dramas:'tbl-dramas',captures:'tbl-captures',releases:'tbl-releases'};
 const records=Object.fromEntries(Object.keys(ids).map(n=>[ids[n],[...f.data[n].values()]]));const writes=[];
 const client={createRecords:async()=>{throw Error("unexpected create")},listRecords:async(_a,t)=>({complete:true,items:structuredClone(records[t])}),getRecord:async(_a,t,id)=>structuredClone(records[t].find(r=>r.record_id===id)),updateRecords:async(_a,t,updates)=>{for(const u of updates){const r=records[t].find(r=>r.record_id===u.record_id);Object.assign(r.fields,structuredClone(u.fields));if(u.fields.采集记录){const c=records[ids.captures].find(c=>c.record_id===u.fields.采集记录[0].id);c.fields.关联发布记录=[{id:r.record_id}];}}writes.push(...updates);return structuredClone(updates);}};
 const repos=new BaseRepositories({client,appToken:'base',tableIds:ids,sleep:async()=>{}}),jobs=new JobStore(':memory:');
 const query=()=>q.queryReleaseBatches({repos,readPosts:()=>f.posts,now:f.now()});
 const opts={jobs,repos,query,now:f.now,enabled:true,since:'2026-09-22',isOwnerAllowed:id=>id==='ou_owner'};
 return {...f,records,client,repos,jobs,query,writes,opts};
}
test('automatic path uses real repositories and SQLite, writes each slot once without a human receipt',async()=>{
 const f=integration();assert.equal(typeof automatic.processAutomaticBatchMatches,'function');const result=await automatic.processAutomaticBatchMatches(f.opts);assert.equal(result.filled,3);assert.equal(result.status,'success');assert.equal(f.writes.length,3);assert.equal(f.jobs.db.prepare('SELECT COUNT(*) n FROM preview_receipts').get().n,0);assert.equal((await f.query()).rows[0].state,'complete');await automatic.processAutomaticBatchMatches(f.opts);assert.equal(f.writes.length,3);f.jobs.close();
});
test('automatic path shares human lease and never writes if disabled, historical, ambiguous or owner denied',async()=>{
 for(const variant of ['disabled','historical','ambiguous','owner','lease']){
  const f=integration();assert.equal(typeof automatic.processAutomaticBatchMatches,'function');
  if(variant==='disabled')f.opts.enabled=false;if(variant==='historical')f.opts.since='2026-09-23';if(variant==='ambiguous')f.posts[0].caption='unknown';if(variant==='owner')f.opts.isOwnerAllowed=()=>false;
  if(variant==='lease')f.jobs.acquireMutationLease({lockKey:`human-base:${baseBinding(f.repos)}`,ownerId:'human',now:f.now(),leaseSeconds:300});
  await automatic.processAutomaticBatchMatches(f.opts);assert.equal(f.writes.length,0,variant);f.jobs.close();
 }
});
test('ambiguous write result is held durably and never retried automatically',async()=>{
 const f=integration();assert.equal(typeof automatic.processAutomaticBatchMatches,'function');const real=f.client.updateRecords;let attempts=0;f.client.updateRecords=async(...args)=>{attempts++;if(attempts===2)throw Error('uncertain transport');return real(...args);};
 const result=await automatic.processAutomaticBatchMatches(f.opts);assert.equal(result.status,'partial');assert.equal(result.filled,1);assert.equal(result.held.length,1);await automatic.processAutomaticBatchMatches(f.opts);assert.equal(attempts,2);assert.equal(f.writes.length,1);f.jobs.close();
});
test('fresh changes between initial scan and locked pass prevent all writes',async()=>{
 const f=integration();assert.equal(typeof automatic.processAutomaticBatchMatches,'function');let calls=0;const query=f.query;f.opts.query=async()=>{if(++calls===2)f.records['tbl-releases'][0].fields.备注='未发布';return query();};const result=await automatic.processAutomaticBatchMatches(f.opts);assert.equal(result.filled,0);assert.equal(f.writes.length,0);f.jobs.close();
});
test('successful automatic writes stay distinct and blank human values are never manufactured',async()=>{
 const f=integration();const r=await automatic.processAutomaticBatchMatches(f.opts);assert.equal(r.filled,3);
 const releases=f.records['tbl-releases'];assert.equal(new Set(releases.map(r=>r.fields['Post ID'])).size,3);for(const x of releases){assert.equal(x.fields.日期,'2026-09-22');assert.equal(x.fields.计划发布时间,'2026-09-22');assert.equal(x.fields.备注,undefined);assert.equal(x.fields.匹配置信度,null);}
 assert.equal(f.jobs.db.prepare("SELECT COUNT(*) n FROM audit_events WHERE action='batch-auto-match'").get().n,3);f.jobs.close();
});
test('a previously journaled batch is held even if all its fields are blank again',async()=>{
 const f=integration();await automatic.processAutomaticBatchMatches(f.opts);for(const r of f.records['tbl-releases']){delete r.fields['Post ID'];delete r.fields.视频链接;delete r.fields.采集记录;}for(const c of f.records['tbl-captures'])delete c.fields.关联发布记录;
 const before=f.writes.length;const r=await automatic.processAutomaticBatchMatches(f.opts);assert.equal(r.held.length,1);assert.equal(f.writes.length,before);f.jobs.close();
});
