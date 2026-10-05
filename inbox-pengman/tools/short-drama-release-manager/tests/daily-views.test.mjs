import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDailyViews,validateDailyViewsFields,DAILY_VIEWS_FIELDS} from '../src/daily-views.mjs';
const row=(date,id,views,extra={})=>({snapshot_date:date,post_id:id,username:'acct',views,captured_at:date+'T00:00:00Z',published_at:'2026-08-01T00:00:00Z',...extra});
test('daily views use consecutive snapshots and include only provably new posts',()=>{
 const result=buildDailyViews([row('2026-09-08','1',100),row('2026-09-09','1',130),row('2026-09-09','2',20,{published_at:'2026-09-08T12:00:00Z'}),row('2026-09-09','3',900)]);
 assert.equal(result[0].新增播放量,null);assert.equal(result[1].新增播放量,50);assert.equal(result[1].可比帖子数,1);assert.equal(result[1].新增帖子数,1);assert.equal(result[1].未纳入帖子数,1);
});
test('missing days and missing values never turn into zero or cross-day attribution',()=>{
 const result=buildDailyViews([row('2026-09-04','1',100),row('2026-09-09','1',200),row('2026-09-10','1',null)]);
 assert.equal(result.length,7);assert.ok(result.every(r=>r.新增播放量===null));
});
test('zero growth is valid while platform corrections remain signed and explicit',()=>{
 const result=buildDailyViews([row('2026-09-08','1',100),row('2026-09-09','1',90),row('2026-09-10','1',90)]);
 assert.equal(result[1].新增播放量,-10);assert.equal(result[1].回调帖子数,1);assert.equal(result[2].新增播放量,0);
});
test('duplicate identities, unsafe metrics and invalid dates fail closed',()=>{
 for(const rows of [[row('2026-09-09','1',10),row('2026-09-09','1',20)],[row('2026-02-30','1',10)],[row('2026-09-09','1',-1)]])assert.throws(()=>buildDailyViews(rows));
});
test('analytics schema accepts only the configured fixed field set and primary field',()=>{
 const fields=Object.entries(DAILY_VIEWS_FIELDS).map(([name,type],i)=>({name,type,field_id:'f'+i}));validateDailyViewsFields({complete:true,items:fields},{primary_field:'f0'});
 assert.throws(()=>validateDailyViewsFields({complete:true,items:fields.slice(1)},{primary_field:'f0'}));
 assert.throws(()=>validateDailyViewsFields({complete:true,items:fields.map(f=>f.name==='新增播放量'?{...f,type:'text'}:f)},{primary_field:'f0'}));
});

test('daily projection reads SQLite, verifies writes, skips unchanged snapshots and recovers a lost response without replay',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {DatabaseSync}=await import('node:sqlite');const {JobStore}=await import('../src/job-store.mjs');const {projectDailyViews,DAILY_VIEWS_TABLE}=await import('../src/daily-views.mjs');
 const dir=await mkdtemp(join(tmpdir(),'daily-views-')),path=join(dir,'metrics.sqlite'),db=new DatabaseSync(path);db.exec('CREATE TABLE posts(post_id TEXT PRIMARY KEY,published_at TEXT); CREATE TABLE post_snapshots(snapshot_date TEXT,captured_at TEXT,post_id TEXT,username TEXT,views INTEGER);');db.prepare('INSERT INTO posts VALUES (?,?)').run('1','2026-08-01T00:00:00Z');for(const r of [row('2026-09-08','1',100),row('2026-09-09','1',130)])db.prepare('INSERT INTO post_snapshots VALUES (?,?,?,?,?)').run(r.snapshot_date,r.captured_at,r.post_id,r.username,r.views);db.close();
 const jobs=new JobStore(':memory:'),records=[];let writes=0,lose=true;
 const fields=Object.entries(DAILY_VIEWS_FIELDS).map(([name,type],i)=>({name,type,field_id:'f'+i}));
 const client={basePath:()=>'/base',getTable:async()=>({table_id:'tblDaily',name:DAILY_VIEWS_TABLE,primary_field:'f0'}),listFields:async()=>({complete:true,items:fields}),listRecords:async()=>({complete:true,items:structuredClone(records)}),request:async(path,{body})=>{writes++;assert.ok(path.endsWith('/records/batch_create'));records.push(...body.create_records.map((fields,i)=>({record_id:'r'+i,fields:structuredClone(fields)})));if(lose)throw Error('lost response');return {data:{record_id_list:records.map(r=>r.record_id)}};}};
 const config={base:{appToken:'base',dailyViewsTableId:'tblDaily'},paths:{metricsSqlite:path}};
 try{await assert.rejects(projectDailyViews({client,config,jobs,sleep:async()=>{}}),/lost response/);assert.equal(writes,1);lose=false;const result=await projectDailyViews({client,config,jobs,sleep:async()=>{}});assert.equal(result.readback,'verified');assert.equal(writes,1);assert.equal(records[1].fields.新增播放量,30);assert.equal((await projectDailyViews({client,config,jobs})).status,'unchanged');assert.equal(writes,1);}finally{jobs.close();await rm(dir,{recursive:true,force:true});}
});
test('rate readback tolerates vendor floating precision loss but rejects real metric changes',async()=>{
 const mod=await import('../src/daily-views.mjs');assert.equal(typeof mod.dailyFieldEqual,'function');
 assert.equal(mod.dailyFieldEqual('互动率',0.0195929016092785,0.019592901609278537),true);
 assert.equal(mod.dailyFieldEqual('互动率',0.0195,0.0196),false);
 assert.equal(mod.dailyFieldEqual('新增播放量',100,101),false);
 assert.equal(mod.dailyFieldEqual('互动率',null,0),false);
});
test('calendar reporting preserves pre-cutover history and closes the prior date',()=>{
 const data=[row('2026-09-19','1',100,{captured_at:'2026-09-19T00:02:00Z',likes:10,comments:1,favorites:1,shares:1}),row('2026-09-20','1',150,{captured_at:'2026-09-20T00:02:00Z',likes:15,comments:2,favorites:2,shares:2}),row('2026-09-21','1',210,{captured_at:'2026-09-20T16:10:00Z',likes:21,comments:3,favorites:3,shares:3})];
 const legacy=buildDailyViews(data),result=buildDailyViews(data,{calendarStartDate:'2026-09-20',asOfDate:'2026-09-21'});
 assert.deepEqual(result[0],legacy[0]);assert.equal(result.find(r=>r.日期==='2026-09-20').新增播放量,60);assert.equal(result.find(r=>r.日期==='2026-09-20').新增点赞,6);assert.match(result.find(r=>r.日期==='2026-09-20').说明,/切换首日/);assert.equal(result.find(r=>r.日期==='2026-09-21').新增播放量,null);assert.match(result.find(r=>r.日期==='2026-09-21').说明,/待结算/);
});
test('calendar mode never invents a close or distributes a multi-day gap',()=>{
 const result=buildDailyViews([row('2026-09-20','1',100),row('2026-09-22','1',300)],{calendarStartDate:'2026-09-20',asOfDate:'2026-09-22'});
 assert.ok(result.every(r=>r.新增播放量===null));assert.match(result.find(r=>r.日期==='2026-09-20').说明,/缺少/);
});
