import test from 'node:test';
import assert from 'node:assert/strict';
import {planCaptionBackfill,stageCaptionBackfillPlan,applyCaptionBackfill,processContinuousCaptionReleases,processCaptionRepair,captionRepositories} from '../src/caption-backfill.mjs';
import {JobStore} from '../src/job-store.mjs';

const record=(id,fields)=>({record_id:id,fields});
function fixture(){
 const accounts=new Map([['one',record('a1',{账号ID:'one',表现形式:'AI真人剧'})]]);
 const dramas=new Map([['SD-1',record('d1',{剧ID:'SD-1',剧名:'The Clear Drama',归档状态:'active'})],['SD-2',record('d2',{剧ID:'SD-2',剧名:'Other Drama',归档状态:'active'})]]);
 const captures=new Map(),releases=new Map(),posts=[];
 for(let i=1;i<=3;i++){
  const id=String(i),url=`https://www.tiktok.com/@one/video/${id}`,at=`2026-09-28T1${i+2}:00:00Z`;
  captures.set(id,record(`c${id}`,{'Post ID':id,账号:[{id:'a1'}],视频链接:url,发布时间:at,Caption:'The Clear Drama',业务:'short-drama',关联发布记录:[]}));
  posts.push({post_id:id,username:'one',post_url:url,published_at:at,caption:'The Clear Drama'});
  releases.set(`SR-${i}`,record(`r${i}`,{发布ID:`SR-${i}`,账号:[{id:'a1'}],剧:[{id:'d1'}],日期:'2026-09-28',批次ID:'B-1',计划序号:i,归档状态:'active'}));
 }
 return {accounts,dramas,captures,releases,posts,cutoff:'2026-09-29T00:00:00Z',publicationTimezone:'America/Chicago',publicationTimezoneSince:'2026-09-24'};
}

test('unique caption and account attach three captured posts to three empty planned slots in time order',()=>{
 const input=fixture();input.posts.reverse();
 const plan=planCaptionBackfill(input);
 assert.deepEqual(plan.actions.map(a=>[a.kind,a.post_id,a.release_id]),[['attach','1','SR-1'],['attach','2','SR-2'],['attach','3','SR-3']]);
 assert.equal(plan.held.length,0);
});

test('a unique caption creates a release when no corresponding planned row exists',()=>{
 const input=fixture();input.releases.clear();
 const plan=planCaptionBackfill(input);
 assert.equal(plan.actions.length,3);
 assert.ok(plan.actions.every(a=>a.kind==='create'&&a.drama_id==='SD-1'&&a.publication_day==='2026-09-28'));
});
test('a bounded capture scope never pulls older unselected posts into a new automation run',()=>{
 const input=fixture();input.releases.clear();
 const plan=planCaptionBackfill({...input,candidatePostIds:['2']});
 assert.deepEqual(plan.actions.map(action=>action.post_id),['2']);
});

test('unclear captions still create account-bound releases with drama left for human selection',()=>{
 const input=fixture();input.releases.clear();
 for(const post of input.posts)post.caption='Follow for more';
 for(const capture of input.captures.values())capture.fields.Caption='Follow for more';
 const plan=planCaptionBackfill({...input,allowUnknownDrama:true});
 assert.equal(plan.actions.length,3);
 assert.ok(plan.actions.every(action=>action.kind==='create'&&action.drama_id===null&&action.drama_record_id===null&&action.review_reason==='drama_title_unmatched'));
});

test('lead review selects only unlinked captions without a leading hash or Part and leaves drama blank',()=>{
 const input=fixture();input.releases.clear();
 const cases=[['1','  The Clear Drama'],['2','  #The Clear Drama'],['3',' Part 2 The Clear Drama']];
 for(const [id,caption] of cases){input.captures.get(id).fields.Caption=caption;input.posts.find(post=>post.post_id===id).caption=caption;}
 input.accounts.get('one').fields.负责人=[{id:'ou_owner'}];
 const plan=planCaptionBackfill({...input,leadReviewOnly:true});
 assert.deepEqual(plan.actions.map(action=>action.post_id),['1']);
 assert.equal(plan.actions[0].kind,'create');
 assert.equal(plan.actions[0].drama_record_id,null);
 assert.equal(plan.actions[0].review_reason,'剧名待人工匹配');
 assert.equal(plan.actions[0].owner_id,'ou_owner');
});

test('lead review never creates a second release for a claimed post',()=>{
 const input=fixture();input.releases.clear();
 input.releases.set('SR-existing',record('r-existing',{发布ID:'SR-existing',账号:[{id:'a1'}],归档状态:'active','Post ID':'1'}));
 const plan=planCaptionBackfill({...input,leadReviewOnly:true});
 assert.equal(plan.actions.some(action=>action.post_id==='1'),false);
 assert.equal(plan.held.find(item=>item.post_id==='1').reason,'post_already_claimed');
});

test('an unclear caption does not create a duplicate beside an unmatched existing plan',()=>{
 const input=fixture();input.releases.delete('SR-2');input.releases.delete('SR-3');
 input.posts=input.posts.slice(0,1);input.captures=new Map([['1',input.captures.get('1')]]);
 input.posts[0].caption='Follow for more';input.captures.get('1').fields.Caption='Follow for more';
 const plan=planCaptionBackfill({...input,allowUnknownDrama:true});
 assert.equal(plan.actions.length,0);assert.equal(plan.held[0].reason,'unresolved_release_plan');
});

test('existing rows are used first and excess caption-backed posts become new releases',()=>{
 const input=fixture();input.releases.delete('SR-2');input.releases.delete('SR-3');
 const plan=planCaptionBackfill(input);
 assert.deepEqual(plan.actions.map(a=>a.kind),['attach','create','create']);
});

test('ambiguous titles, account conflicts, and shortage of planned slots never create a guessed row',()=>{
 const title=fixture();title.dramas.set('SD-3',record('d3',{剧ID:'SD-3',剧名:'The Clear Drama',归档状态:'active'}));
 assert.equal(planCaptionBackfill(title).actions.length,0);
 const account=fixture();account.captures.get('1').fields.视频链接='https://www.tiktok.com/@other/video/1';
 assert.ok(planCaptionBackfill(account).held.some(h=>h.post_id==='1'&&h.reason==='capture_identity_conflict'));
 const shortage=fixture();shortage.captures.delete('3');shortage.posts.pop();
 assert.equal(planCaptionBackfill(shortage).actions.length,0);
});
test('non-drama captures cannot create drama release rows',()=>{
 const input=fixture();input.releases.clear();input.captures.get('1').fields.业务='other';
 const plan=planCaptionBackfill({...input,allowUnknownDrama:true});
 assert.equal(plan.actions.some(action=>action.post_id==='1'),false);
 assert.equal(plan.held.find(item=>item.post_id==='1').reason,'business_mismatch');
});
test('accounts outside the drama publishing format cannot create release rows even if capture says short-drama',()=>{
 const input=fixture();input.releases.clear();input.accounts.get('one').fields.表现形式='AstrologyWiki';
 const plan=planCaptionBackfill({...input,allowUnknownDrama:true});
 assert.equal(plan.actions.length,0);assert.ok(plan.held.every(item=>item.reason==='account_not_drama'));
});

test('the Chicago rollout begins at its local midnight, not at Beijing midnight',()=>{
 const input=fixture();input.releases.clear();input.captures=new Map([['1',input.captures.get('1')]]);input.posts=[input.posts[0]];
 input.captures.get('1').fields.发布时间='2026-09-24T03:00:00Z';input.posts[0].published_at='2026-09-24T03:00:00Z';
 assert.equal(planCaptionBackfill(input).actions[0].publication_day,'2026-09-24');
});

test('explicit Part numbers that duplicate or lack a matching slot never fall back to chronological assignment',()=>{
 for(const parts of [[1,1,3],[1,2,4]]){
  const input=fixture();
  for(let i=0;i<3;i++){
   input.posts[i].caption=`The Clear Drama Part ${parts[i]}`;
   input.captures.get(String(i+1)).fields.Caption=input.posts[i].caption;
  }
  const plan=planCaptionBackfill(input);
  assert.equal(plan.actions.length,0,parts.join(','));
 }
});

test('one unlabeled release slot may take the sole remaining uniquely titled Part by elimination',()=>{
 const input=fixture();delete input.releases.get('SR-3').fields.计划序号;
 for(let i=0;i<3;i++){
  input.posts[i].caption=`The Clear Drama Part ${i+1}`;
  input.captures.get(String(i+1)).fields.Caption=input.posts[i].caption;
 }
 const plan=planCaptionBackfill(input);
 assert.deepEqual(plan.actions.map(action=>[action.post_id,action.release_id]),[['1','SR-1'],['2','SR-2'],['3','SR-3']]);
});

test('scheduler plan stage saves a read-only bounded plan in the durable job store',async()=>{
 const input=fixture(),jobs=new JobStore(':memory:'),repos=Object.fromEntries(['accounts','dramas','captures','releases'].map(name=>[name,{loadIndex:async()=>structuredClone(input[name])}]));
 const report=await stageCaptionBackfillPlan({jobs,repos,readPosts:async()=>structuredClone(input.posts),requestId:'caption-20260928',mode:'plan',cutoff:input.cutoff,publicationTimezone:input.publicationTimezone,publicationTimezoneSince:input.publicationTimezoneSince});
 assert.deepEqual(report.counts,{attach:3,create:0,held:0});
 const stored=jobs.db.prepare('SELECT state,plan_json FROM caption_backfill_runs WHERE request_id=?').get('caption-20260928');
 assert.equal(stored.state,'planned');assert.equal(JSON.parse(stored.plan_json).actions.length,3);
 assert.equal(JSON.parse(stored.plan_json).before.captures.length,3);
 assert.equal(JSON.parse(stored.plan_json).before.releases.length,3);
 jobs.close();
});
test('caption reconciliation refuses projections that omit the derived reverse relation',async()=>{
 const f=workerFixture();f.repos.captures.writableOnly=true;
 await assert.rejects(stageCaptionBackfillPlan({...f.common,mode:'plan'}),error=>error.code==='caption_projection_invalid');
 f.jobs.close();
});
test('caption reconciliation reads the capture reverse field without decoding unrelated release lookups',()=>{
 const full={appToken:'base',captures:{tableName:'采集数据',writableOnly:false}};
 const worker={appToken:'base',accounts:{tableName:'账号台账',writableOnly:true},dramas:{tableName:'选剧池',writableOnly:true},
  captures:{tableName:'采集数据',writableOnly:true},releases:{tableName:'发布记录',writableOnly:true}};
 const repos=captionRepositories({full,worker});
 assert.equal(repos.captures,full.captures);assert.equal(repos.releases,worker.releases);
 assert.equal(repos.accounts,worker.accounts);assert.equal(repos.dramas,worker.dramas);
});

test('a metric refresh does not invalidate the planned identities',()=>{
 const input=fixture(),before=planCaptionBackfill(input);
 input.releases.get('SR-1').fields.播放量=12345;
 input.captures.get('1').fields.播放量=67890;
 assert.equal(planCaptionBackfill(input).digest,before.digest);
});

function workerFixture(){
 const input=fixture(),jobs=new JobStore(':memory:'),writes=[];
 const names={accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'};
 const repos=Object.fromEntries(['accounts','dramas','captures','releases'].map(name=>[name,{appToken:'base-test',tableId:`tbl-${name}`,tableName:names[name],
  loadIndex:async()=>structuredClone(input[name]),getByKey:async key=>structuredClone(input[name].get(key)??null)}]));
 repos.appToken='base-test';repos.releases.serverGeneratedIds=true;
 repos.captures.readRecordById=async recordId=>structuredClone([...input.captures.values()].find(row=>row.record_id===recordId));
 repos.releases.registerCaptionPostSafely=async(releaseId,postId)=>{
  const release=input.releases.get(releaseId),capture=input.captures.get(postId);
  Object.assign(release.fields,{'Post ID':postId,视频链接:capture.fields.视频链接,采集记录:[{id:capture.record_id}],匹配方式:'exact_post_id'});
  capture.fields.关联发布记录=[{id:release.record_id}];writes.push({kind:'attach',postId});
  return {record:structuredClone(release),readback:'verified'};
 };
 repos.releases.createWithGeneratedId=async(patch,_actor,{beforeWrite}={})=>{
  await beforeWrite?.(structuredClone(input.releases));
  const id=`SR-new-${writes.length+1}`,release=record(`r-new-${writes.length+1}`,{发布ID:id,...structuredClone(patch)});
  input.releases.set(id,release);
  const capture=[...input.captures.values()].find(row=>row.record_id===patch.采集记录[0].id);
  capture.fields.关联发布记录=[{id:release.record_id}];writes.push({kind:'create',postId:patch['Post ID']});
  return {record:structuredClone(release),readback:'verified'};
 };
 const common={jobs,repos,readPosts:async()=>structuredClone(input.posts),requestId:'caption-20260928',cutoff:input.cutoff,
  publicationTimezone:input.publicationTimezone,publicationTimezoneSince:input.publicationTimezoneSince};
 return {input,jobs,repos,writes,common};
}

test('stored caption plan applies each verified association once and records completion',async()=>{
 const f=workerFixture(),plan=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 const result=await applyCaptionBackfill({...f.common,expectedDigest:plan.digest});
 assert.equal(result.status,'complete');assert.equal(result.completed.length,3);assert.equal(f.writes.length,3);
 const again=await applyCaptionBackfill({...f.common,expectedDigest:plan.digest});
 assert.equal(again.status,'already_complete');assert.equal(f.writes.length,3);f.jobs.close();
});

test('unclear new captures are created without a drama and marked for human matching',async()=>{
 const f=workerFixture();f.input.releases.clear();
 for(const post of f.input.posts)post.caption='Follow for more';
 for(const capture of f.input.captures.values())capture.fields.Caption='Follow for more';
 const request={...f.common,allowUnknownDrama:true};
 const plan=await stageCaptionBackfillPlan({...request,mode:'plan'});
 assert.equal(plan.counts.create,3);
 const result=await applyCaptionBackfill({...request,expectedDigest:plan.digest});
 assert.equal(result.status,'complete');
 for(const release of f.input.releases.values()){
  assert.equal(release.fields.剧,undefined);
  assert.equal(release.fields.待处理原因,'剧名待人工匹配');
 }
 f.jobs.close();
});

test('stale caption plans fail before any Base write',async()=>{
 const f=workerFixture(),plan=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 f.input.captures.get('1').fields.Caption='Other Drama';
 await assert.rejects(applyCaptionBackfill({...f.common,expectedDigest:plan.digest}),error=>error.code==='caption_plan_changed');
 assert.equal(f.writes.length,0);f.jobs.close();
});

test('an uncertain caption write is held durably and never replayed',async()=>{
 const f=workerFixture(),plan=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 f.repos.releases.registerCaptionPostSafely=async()=>{f.writes.push({kind:'attempt'});throw Object.assign(new Error('lost response'),{code:'readback_mismatch'});};
 const result=await applyCaptionBackfill({...f.common,expectedDigest:plan.digest});
 assert.equal(result.status,'partial');assert.equal(result.error_code,'readback_mismatch');
 assert.equal(f.jobs.db.prepare("SELECT phase FROM caption_backfill_failures WHERE request_id='caption-20260928'").get().phase,'write');
 const again=await applyCaptionBackfill({...f.common,expectedDigest:plan.digest});
 assert.equal(again.status,'held');assert.equal(f.writes.length,1);f.jobs.close();
});

test('an uncertain attempt is inspected read-only before anyone decides whether a write landed',async()=>{
 const f=workerFixture(),plan=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 const original=f.repos.releases.registerCaptionPostSafely;
 f.repos.releases.registerCaptionPostSafely=async(...args)=>{await original(...args);throw Object.assign(new Error('response lost'),{code:'readback_mismatch'});};
 assert.equal((await applyCaptionBackfill({...f.common,expectedDigest:plan.digest})).status,'partial');
 const inspected=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 assert.equal(inspected.status,'held');
 assert.equal(inspected.inspection[0].state,'confirmed');
 assert.equal(f.writes.length,1);f.jobs.close();
});

test('large caption plans pause only after verified rows and resume without replaying them',async()=>{
 const f=workerFixture(),plan=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 for(let completed=1;completed<=3;completed++){
  const result=await applyCaptionBackfill({...f.common,expectedDigest:plan.digest,maxActions:1});
  assert.equal(result.status,completed===3?'complete':'paused_safe');
  assert.equal(result.completed.length,completed);
  assert.equal(f.writes.length,completed);
 }
 f.jobs.close();
});

test('reverse-link visibility lag waits on the created release instead of retrying its POST',async()=>{
 const f=workerFixture(),plan=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 const actualGet=f.repos.captures.getByKey;let reverseVisible=false;
 f.repos.captures.getByKey=async key=>{const row=await actualGet(key);if(!reverseVisible)row.fields.关联发布记录=[];return row;};
 const actualRead=f.repos.captures.readRecordById;
 f.repos.captures.readRecordById=async recordId=>{const row=await actualRead(recordId);if(!reverseVisible)row.fields.关联发布记录=[];return row;};
 const args={...f.common,expectedDigest:plan.digest,maxActions:1,wait:async()=>{}};
 const first=await applyCaptionBackfill(args);
 assert.equal(first.status,'pending_reverse');assert.equal(first.completed.length,1);assert.equal(f.writes.length,1);
 reverseVisible=true;
 const second=await applyCaptionBackfill(args);
 assert.equal(second.status,'paused_safe');assert.equal(second.completed.length,2);assert.equal(f.writes.length,2);
 f.jobs.close();
});
test('reverse verification bypasses a cached prewrite capture index',async()=>{
 const f=workerFixture(),plan=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 const cached=structuredClone(f.input.captures.get('1')),actualGet=f.repos.captures.getByKey;
 f.repos.captures.getByKey=async key=>key==='1'?structuredClone(cached):actualGet(key);
 f.repos.captures.readRecordById=async recordId=>structuredClone([...f.input.captures.values()].find(row=>row.record_id===recordId));
 const result=await applyCaptionBackfill({...f.common,expectedDigest:plan.digest,maxActions:1,wait:async()=>{}});
 assert.equal(result.status,'paused_safe');assert.equal(result.completed.length,1);assert.equal(f.writes.length,1);
 f.jobs.close();
});
test('a reverse-readback-only uncertain attempt reconciles from Base evidence without replay',async()=>{
 const f=workerFixture(),plan=await stageCaptionBackfillPlan({...f.common,mode:'plan'});
 await f.repos.releases.registerCaptionPostSafely('SR-1','1');
 f.jobs.db.prepare("UPDATE caption_backfill_runs SET state='uncertain',error_code='readback_mismatch' WHERE request_id='caption-20260928'").run();
 f.jobs.db.exec('CREATE TABLE caption_backfill_failures (request_id TEXT PRIMARY KEY,post_id TEXT NOT NULL,phase TEXT NOT NULL,error_code TEXT NOT NULL,message TEXT NOT NULL,updated_at TEXT NOT NULL)');
 f.jobs.db.prepare('INSERT INTO caption_backfill_failures VALUES(?,?,?,?,?,?)').run('caption-20260928','1','reverse_readback','readback_mismatch','lag','2026-09-29T00:00:00Z');
 const result=await applyCaptionBackfill({...f.common,expectedDigest:plan.digest,maxActions:1});
 assert.equal(result.status,'paused_safe');assert.equal(result.completed.length,2);
 assert.equal(f.writes.length,2);f.jobs.close();
});

test('newly captured posts create a release automatically and leave unknown drama for human review',async()=>{
 const f=workerFixture();f.input.releases.clear();
 for(const post of f.input.posts){post.first_seen_at='2026-09-29T06:00:00Z';post.caption='Follow for more';}
 for(const capture of f.input.captures.values())capture.fields.Caption='Follow for more';
 const args={...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z'),maxActions:20};
 const result=await processContinuousCaptionReleases(args);
 assert.equal(result.status,'complete');assert.equal(f.writes.length,3);
 assert.ok([...f.input.releases.values()].every(row=>!row.fields.剧&&row.fields.待处理原因==='剧名待人工匹配'));
 const again=await processContinuousCaptionReleases(args);
 assert.equal(f.writes.length,3);assert.equal(again.status,'no_op');f.jobs.close();
});

test('continuous caption automation leaves excluded historical captures untouched',async()=>{
 const f=workerFixture();f.input.releases.clear();
 for(const post of f.input.posts){post.first_seen_at='2026-09-29T06:00:00Z';post.caption='Follow for more';f.input.captures.get(post.post_id).fields.Caption=post.caption;}
 const result=await processContinuousCaptionReleases({...f.common,activationAt:'2026-09-28T06:25:01Z',
  now:()=>new Date('2026-09-29T08:00:00Z'),recognizeDramas:true,excludedPostIds:['2']});
 assert.equal(result.status,'complete');
 assert.equal(f.writes.length,2);
 assert.equal(f.input.captures.get('2').fields.关联发布记录?.length??0,0);
 assert.deepEqual(f.jobs.db.prepare("SELECT post_id FROM caption_auto_reviews WHERE post_id='2'").all(),[]);
 f.jobs.close();
});
test('observe-only mode reports an excluded saved plan without changing its journal',async()=>{
 const f=workerFixture();
 f.jobs.db.exec('CREATE TABLE caption_backfill_runs(request_id TEXT PRIMARY KEY,state TEXT,plan_digest TEXT,plan_json TEXT,completed_json TEXT,updated_at TEXT,error_code TEXT)');
 f.jobs.db.prepare('INSERT INTO caption_backfill_runs VALUES(?,?,?,?,?,?,?)').run('caption-auto-excluded','planned','a'.repeat(64),
  JSON.stringify({actions:[{post_id:'2'}],scope_post_ids:['2'],recognition_mode:true}), '[]','2026-09-29T00:00:00Z',null);
 const result=await processContinuousCaptionReleases({...f.common,activationAt:'2026-09-28T06:25:01Z',
  now:()=>new Date('2026-09-29T08:00:00Z'),recognizeDramas:true,observeOnly:true,excludedPostIds:['2']});
 assert.equal(result.status,'observed');
 assert.equal(result.excluded_post_in_pending_plan,true);
 assert.equal(f.jobs.db.prepare("SELECT state FROM caption_backfill_runs WHERE request_id='caption-auto-excluded'").get().state,'planned');
 f.jobs.close();
});

test('continuous lead review creates only plain-leading captions and keeps a recognizable drama blank',async()=>{
 const f=workerFixture();f.input.releases.clear();
 const captions=['The Clear Drama','#The Clear Drama','Part 2 The Clear Drama'];
 for(let i=0;i<f.input.posts.length;i++){
  f.input.posts[i].first_seen_at='2026-09-29T06:00:00Z';
  f.input.posts[i].caption=captions[i];
  f.input.captures.get(String(i+1)).fields.Caption=captions[i];
 }
 const result=await processContinuousCaptionReleases({...f.common,activationAt:'2026-09-28T06:25:01Z',
  now:()=>new Date('2026-09-29T08:00:00Z'),leadReviewOnly:true,maxActions:20});
 assert.equal(result.status,'complete');assert.equal(f.writes.length,1);
 assert.ok([...f.input.releases.values()].every(row=>!row.fields.剧));
 f.jobs.close();
});

test('continuous release creation ignores posts discovered before activation',async()=>{
 const f=workerFixture();f.input.releases.clear();
 for(const post of f.input.posts)post.first_seen_at='2026-09-27T06:00:00Z';
 const result=await processContinuousCaptionReleases({...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z')});
 assert.equal(result.status,'no_op');assert.equal(f.writes.length,0);f.jobs.close();
});
test('continuous automation does not replay an uncertain post but can process later independent posts',async()=>{
 const f=workerFixture();f.input.releases.clear();
 for(const post of f.input.posts)post.first_seen_at='2026-09-29T06:00:00Z';
 const original=f.repos.releases.createWithGeneratedId;let attempts=0;
 f.repos.releases.createWithGeneratedId=async(...args)=>{if(++attempts===1){f.writes.push({kind:'uncertain'});throw Object.assign(new Error('lost response'),{code:'readback_mismatch'});}return original(...args);};
 const args={...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z'),maxActions:20};
 assert.equal((await processContinuousCaptionReleases(args)).status,'partial');
 const result=await processContinuousCaptionReleases(args);
 assert.equal(result.status,'complete');assert.equal(f.writes.length,3);
 assert.equal(attempts,3);f.jobs.close();
});

test('one exact mistaken creation is archived and unlinked through a durable non-replayed repair',async()=>{
 const f=workerFixture(),capture=f.input.captures.get('1');
 const wrong=record('r-wrong',{发布ID:'SR-000777',账号:[{id:'a1'}],日期:'2026-09-28',归档状态:'active','Post ID':'1',
  视频链接:capture.fields.视频链接,采集记录:[{id:capture.record_id}],匹配方式:'exact_post_id',待处理原因:'剧名待人工匹配'});
 f.input.releases.set('SR-000777',wrong);capture.fields.关联发布记录=[{id:'r-wrong'}];
 f.repos.releases.archiveErroneousCaptionReleaseSafely=async()=>{
  wrong.fields.归档状态='archived';wrong.fields['Post ID']=null;wrong.fields.视频链接=null;wrong.fields.采集记录=[];capture.fields.关联发布记录=[];
  f.writes.push({kind:'repair'});return {record:structuredClone(wrong),readback:'verified'};
 };
 const request={requestId:'caption-repair-20260928',releaseId:'SR-000777',releaseRecordId:'r-wrong',postId:'1',captureRecordId:capture.record_id,accountRecordId:'a1'};
 assert.equal((await processCaptionRepair({jobs:f.jobs,repos:f.repos,request})).status,'complete');
 assert.equal((await processCaptionRepair({jobs:f.jobs,repos:f.repos,request})).status,'already_complete');
 assert.equal(f.writes.length,1);f.jobs.close();
});

test('full recognition keeps Part and hashtag captures and proposes missing pool titles',()=>{
 const input=fixture();input.releases.clear();input.captures=new Map([['1',input.captures.get('1')]]);input.posts=[input.posts[0]];
 input.posts[0].caption='Part 1 | The Ice Man A man wakes up. Watch on ReelShort.';input.captures.get('1').fields.Caption=input.posts[0].caption;
 const plan=planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true});
 assert.equal(plan.pool_candidates.length,1);assert.equal(plan.pool_candidates[0].title,'The Ice Man');assert.equal(plan.actions.length,0);
});
test('full recognition attaches one named post to its explicit partial batch slot',()=>{
 const input=fixture();input.captures=new Map([['1',input.captures.get('1')]]);input.posts=[input.posts[0]];
 input.posts[0].caption='Part 1 | The Clear Drama A man wakes up. Watch on ReelShort.';input.captures.get('1').fields.Caption=input.posts[0].caption;
 const plan=planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true});
 assert.equal(plan.actions.length,1);assert.equal(plan.actions[0].release_id,'SR-1');
});
test('full recognition completes a human-linked capture without creating another release',()=>{
 const input=fixture();input.captures=new Map([['1',input.captures.get('1')]]);input.posts=[input.posts[0]];
 input.posts[0].caption='Part 4 | The Clear Drama A scene. Watch on ReelShort.';
 input.captures.get('1').fields.Caption=input.posts[0].caption;
 input.captures.get('1').fields.关联发布记录=[{id:'r1'}];
 input.releases=new Map([['SR-1',input.releases.get('SR-1')]]);
 input.releases.get('SR-1').fields.采集记录=[{id:'c1'}];
 assert.equal(planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true}).actions.length,0);
 const plan=planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true,partialLinkPostIds:['1']});
 assert.deepEqual(plan.actions.map(a=>[a.kind,a.post_id,a.release_id]),[['attach','1','SR-1']]);
 assert.equal(plan.held.length,0);
});
test('recognized Parts follow actual publication order when plan sequence has a deleted gap',()=>{
 const input=fixture();
 input.releases.get('SR-1').fields.计划序号=2;
 input.releases.get('SR-1').fields['Post ID']='1';
 input.releases.get('SR-1').fields.视频链接=input.captures.get('1').fields.视频链接;
 input.releases.get('SR-1').fields.采集记录=[{id:'c1'}];
 input.captures.get('1').fields.关联发布记录=[{id:'r1'}];
 input.releases.get('SR-2').fields.计划序号=3;
 delete input.releases.get('SR-3').fields.批次ID;
 delete input.releases.get('SR-3').fields.计划序号;
 for(const [i,post] of input.posts.entries()){
  post.caption=`Part ${i+4} | The Clear Drama A scene. Watch on ReelShort.`;
  input.captures.get(post.post_id).fields.Caption=post.caption;
 }
 const baseline=planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true});
 assert.equal(baseline.actions.length,0);
 const plan=planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true,timeOrderTargets:[{accountId:'one',dramaId:'SD-1'}]});
 assert.deepEqual(plan.actions.map(a=>[a.post_id,a.release_id]),[['2','SR-2'],['3','SR-3']]);
 assert.equal(plan.held.length,0);
});
test('exact post claim wins over a conflicting caption title without overwriting the human drama',()=>{
 const input=fixture();input.releases.clear();input.captures=new Map([['1',input.captures.get('1')]]);input.posts=[input.posts[0]];
 input.releases.set('SR-1',record('r1',{发布ID:'SR-1',账号:[{id:'a1'}],剧:[{id:'d2'}],归档状态:'active','Post ID':'1'}));
 const plan=planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true});
 assert.equal(plan.actions.length,1);assert.equal(plan.actions[0].drama_record_id,'d2');assert.equal(plan.actions[0].review_reason,'drama_title_conflict');
});
test('full recognition can plan an incomplete new capture without inventing a publication date',()=>{
 const input=fixture();input.releases.clear();input.captures=new Map([['1',input.captures.get('1')]]);input.posts=[input.posts[0]];
 input.captures.get('1').fields.发布时间=null;input.captures.get('1').fields.Caption='';input.posts[0].published_at=null;input.posts[0].caption='';
 const plan=planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true});
 assert.equal(plan.actions.length,1);assert.equal(plan.actions[0].publication_day,null);assert.equal(plan.actions[0].kind,'create');
});

test('continuous recognition creates one missing drama for several posts and reuses it without duplicate releases',async()=>{
 const f=workerFixture();f.input.releases.clear();let poolWrites=0;
 f.repos.dramas.serverGeneratedIds=true;
 f.repos.dramas.createWithGeneratedId=async(patch,_actor,{beforeWrite})=>{await beforeWrite(f.input.dramas);poolWrites++;const row=record('d-new',{剧ID:'SD-new',...patch});f.input.dramas.set('SD-new',row);return {record:row,readback:'verified'};};
 for(const post of f.input.posts){post.first_seen_at='2026-09-29T06:00:00Z';post.caption='Part 1 | The Ice Man A man wakes up. Watch on ReelShort. Search code 4933302.';f.input.captures.get(post.post_id).fields.Caption=post.caption;}
 const args={...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z'),recognizeDramas:true,maxActions:20};
 const result=await processContinuousCaptionReleases(args);
 assert.equal(result.status,'complete');assert.equal(poolWrites,1);assert.equal(f.writes.length,3);
 assert.ok([...f.input.releases.values()].every(r=>r.fields.剧?.[0]?.id==='d-new'));
 await processContinuousCaptionReleases(args);assert.equal(poolWrites,1);assert.equal(f.writes.length,3);f.jobs.close();
});
test('continuous recognition finishes a human-selected partial link exactly once',async()=>{
 const f=workerFixture();
 f.input.captures=new Map([['1',f.input.captures.get('1')]]);f.input.posts=[f.input.posts[0]];
 f.input.releases=new Map([['SR-1',f.input.releases.get('SR-1')]]);
 f.input.releases.get('SR-1').fields.采集记录=[{id:'c1'}];
 f.input.captures.get('1').fields.关联发布记录=[{id:'r1'}];
 f.input.posts[0].caption='Part 4 | The Clear Drama A scene. Watch on ReelShort.';
 f.input.captures.get('1').fields.Caption=f.input.posts[0].caption;
 f.repos.releases.registerRecognizedPostSafely=f.repos.releases.registerCaptionPostSafely;
 const args={...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z'),recognizeDramas:true,partialLinkPostIds:['1']};
 const first=await processContinuousCaptionReleases(args);
 assert.equal(first.status,'complete');assert.equal(f.writes.length,1);
 assert.equal(f.input.releases.get('SR-1').fields['Post ID'],'1');
 assert.equal((await processContinuousCaptionReleases(args)).status,'no_op');assert.equal(f.writes.length,1);
 f.jobs.close();
});
test('narrowing partial-link scope stops a paused broad plan before any further write',async()=>{
 const f=workerFixture();f.input.captures.delete('3');f.input.posts=f.input.posts.slice(0,2);f.input.releases.delete('SR-3');
 for(const id of ['1','2']){
  f.input.captures.get(id).fields.关联发布记录=[{id:`r${id}`}];
  f.input.releases.get(`SR-${id}`).fields.采集记录=[{id:`c${id}`}];
  f.input.posts[Number(id)-1].caption='Part 4 | The Clear Drama A scene. Watch on ReelShort.';
  f.input.captures.get(id).fields.Caption=f.input.posts[Number(id)-1].caption;
 }
 f.repos.releases.registerRecognizedPostSafely=f.repos.releases.registerCaptionPostSafely;
 const base={...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z'),recognizeDramas:true,maxActions:1};
 assert.equal((await processContinuousCaptionReleases({...base,partialLinkPostIds:['1','2']})).status,'paused_safe');
 assert.equal(f.writes.length,1);
 assert.equal((await processContinuousCaptionReleases({...base,partialLinkPostIds:['1']})).status,'needs_review');
 assert.equal(f.writes.length,1);
 assert.equal(f.jobs.db.prepare("SELECT state FROM caption_backfill_runs WHERE request_id LIKE 'caption-auto-%'").get().state,'stale');
 f.jobs.close();
});
test('observe-only recognition reports proposed pool rows without writing business data',async()=>{
 const f=workerFixture();f.input.releases.clear();
 for(const post of f.input.posts){post.first_seen_at='2026-09-29T06:00:00Z';post.caption='#OneBetrayalOneNightWithMyBoss Watch on MoboReels';f.input.captures.get(post.post_id).fields.Caption=post.caption;}
 const result=await processContinuousCaptionReleases({...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z'),recognizeDramas:true,observeOnly:true});
 assert.equal(result.status,'observed');assert.equal(result.pool_candidates,3);assert.equal(f.writes.length,0);f.jobs.close();
});

test('recognized partial batches do not assign late-arriving older posts after an already linked slot',()=>{
 const input=fixture();input.releases.get('SR-1').fields['Post ID']='3';input.releases.get('SR-1').fields.视频链接=input.captures.get('3').fields.视频链接;input.releases.get('SR-1').fields.采集记录=[{id:'c3'}];input.captures.get('3').fields.关联发布记录=[{id:'r1'}];
 const result=planCaptionBackfill({...input,recognizeDramas:true,allowUnknownDrama:true});
 assert.equal(result.actions.length,0);assert.ok(result.held.every(x=>x.reason==='linked_order_conflict'));
});

test('full recognition also handles a capture synced to Base after its source first_seen date',async()=>{
 const f=workerFixture();f.input.releases.clear();
 for(const post of f.input.posts)post.first_seen_at='2026-09-27T06:00:00Z';
 const result=await processContinuousCaptionReleases({...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z'),recognizeDramas:true});
 assert.equal(result.status,'complete');assert.equal(f.writes.length,3);f.jobs.close();
});

test('a read-only preflight failure does not mark the untouched post as an unknown write',async()=>{
 const f=workerFixture();f.input.releases.clear();for(const post of f.input.posts)post.first_seen_at='2026-09-29T06:00:00Z';
 const original=f.repos.captures.getByKey;f.repos.captures.getByKey=async()=>{throw Object.assign(Error('read interrupted'),{code:'capture_read_failed'});};
 const args={...f.common,activationAt:'2026-09-28T06:25:01Z',now:()=>new Date('2026-09-29T08:00:00Z'),recognizeDramas:true};
 const first=await processContinuousCaptionReleases(args);assert.equal(first.status,'needs_review');assert.equal(f.writes.length,0);
 f.repos.captures.getByKey=original;assert.equal((await processContinuousCaptionReleases(args)).status,'complete');assert.equal(f.writes.length,3);f.jobs.close();
});
