import test from 'node:test';
import assert from 'node:assert/strict';
import {JobStore} from '../src/job-store.mjs';
import {projectReportTable,clearsMissingRows} from '../src/analytics-projection.mjs';
const spec={name:'report',key:['日期'],fields:{'日期':'datetime','播放量':'number','统计说明':'text'}};
function fixture(){const jobs=new JobStore(':memory:');const records=[];let writes=0,lose=false;
 const client={basePath:()=>'/base',getTable:async()=>({table_id:'tblTest',name:'report',primary_field:'f0'}),listFields:async()=>({complete:true,items:Object.entries(spec.fields).map(([name,type],i)=>({name,type,field_id:'f'+i}))}),listRecords:async()=>({complete:true,items:structuredClone(records)}),request:async(path,{body})=>{writes++;for(const f of body.create_records??[])records.push({record_id:'r'+records.length,fields:structuredClone(f)});for(const [id,fields]of Object.entries(body.update_records??{}))Object.assign(records.find(r=>r.record_id===id).fields,fields);if(lose){lose=false;throw Error('lost response');}return {};}};
 return {jobs,records,client,writeCount:()=>writes,lose:()=>{lose=true;},args:{client,jobs,config:{base:{appToken:'base'}},spec,tableId:'tblTest',rows:[{'日期':'2026-09-01','播放量':100,'统计说明':'最新值'}],sleep:async()=>{}}};}
test('projection is idempotent, normalizes date readback and heals changed source totals',async()=>{const f=fixture();try{let r=await projectReportTable(f.args);assert.equal(r.created,1);assert.equal(r.readback,'verified');assert.equal((await projectReportTable(f.args)).updated,0);assert.equal(f.writeCount(),1);f.args.rows[0].播放量=120;r=await projectReportTable(f.args);assert.equal(r.updated,1);assert.equal(f.records[0].fields.播放量,120);}finally{f.jobs.close();}});
test('a lost write response reconciles the recorded intent without replaying create',async()=>{const f=fixture();try{f.lose();await assert.rejects(projectReportTable(f.args),/lost response/);await projectReportTable(f.args);assert.equal(f.writeCount(),1);assert.equal(f.records.length,1);}finally{f.jobs.close();}});
test('missing source groups clear stale totals and invalid schema never writes',async()=>{const f=fixture();try{await projectReportTable(f.args);f.args.rows=[];await projectReportTable(f.args);assert.equal(f.records[0].fields.播放量,0);assert.match(f.records[0].fields.统计说明,/无符合/);f.client.listFields=async()=>({complete:true,items:[]});await assert.rejects(projectReportTable(f.args),/字段/);assert.equal(f.writeCount(),2);}finally{f.jobs.close();}});
test('blank stored text and null readback represent the same empty value',async()=>{const f=fixture();try{f.args.rows[0].统计说明='';await projectReportTable(f.args);f.records[0].fields.统计说明=null;await projectReportTable(f.args);assert.equal(f.writeCount(),1);}finally{f.jobs.close();}});
test('pagination revision lag after a successful write retries reads only',async()=>{const f=fixture();try{const stable=f.client.listRecords;let lagged=false,reads=0;f.client.listRecords=async()=>{reads++;if(f.writeCount()===1&&!lagged){lagged=true;throw Object.assign(new Error('revision changed'),{code:'base_response_invalid',details:{pagination_metadata_key:'rev'}});}return stable();};const r=await projectReportTable(f.args);assert.equal(r.readback,'verified');assert.equal(f.writeCount(),1);assert.ok(reads>=3);}finally{f.jobs.close();}});
test('missing report key identifies the table and record before any write',async()=>{const f=fixture();try{f.records.push({record_id:'blank',fields:{日期:null,播放量:null,统计说明:null}});await assert.rejects(projectReportTable(f.args),e=>e.code==='analytics_projection_invalid'&&e.details?.table==='report'&&e.details?.record_id==='blank'&&e.details?.field==='日期');assert.equal(f.writeCount(),0);}finally{f.jobs.close();}});
test('derived owner field is required but is never written by the analytics projection',async()=>{const f=fixture();try{
 f.args.spec={...spec,derivedFields:{负责人:'lookup'}};
 f.args.rows[0].负责人=[{id:'ou_owner'}];
 await assert.rejects(projectReportTable(f.args),/统计字段缺失或类型改变：负责人/);
 assert.equal(f.writeCount(),0);
 const original=f.client.listFields;
 f.client.listFields=async()=>({...await original(),items:[...(await original()).items,{name:'负责人',type:'lookup',field_id:'owner'}]});
 const result=await projectReportTable(f.args);
 assert.equal(result.created,1);
 assert.equal(Object.hasOwn(f.records[0].fields,'负责人'),false);
}finally{f.jobs.close();}});
test('a duplicated or blank key in the human-maintained account table is left untouched instead of blocking',async()=>{const f=fixture();try{
 const existing={...spec,existing:true};
 f.records.push({record_id:'dup1',fields:{'日期':'2026-09-02','播放量':1,'统计说明':'a'}},{record_id:'dup2',fields:{'日期':'2026-09-02','播放量':2,'统计说明':'b'}},{record_id:'dup2b',fields:{'日期':'2026-09-02','播放量':4,'统计说明':'d'}},{record_id:'blank',fields:{'日期':null,'播放量':3,'统计说明':'c'}},{record_id:'ok',fields:{'日期':'2026-09-01','播放量':0,'统计说明':''}});
 const r=await projectReportTable({...f.args,spec:existing});assert.equal(r.readback,'verified');assert.equal(r.updated,1);
 assert.deepEqual(f.records.map(x=>[x.record_id,x.fields.播放量]),[['dup1',1],['dup2',2],['dup2b',4],['blank',3],['ok',100]]);
 f.records.push({record_id:'dup3',fields:{'日期':'2026-09-03','播放量':1,'统计说明':''}},{record_id:'dup4',fields:{'日期':'2026-09-03','播放量':1,'统计说明':''}});
 const before=f.records.length;await assert.rejects(projectReportTable({...f.args,spec:existing,rows:[...f.args.rows,{'日期':'2026-09-02','播放量':1,'统计说明':''}]}),/不能自动创建账号/);assert.equal(f.records.length,before);
 await assert.rejects(projectReportTable({...f.args,rows:[...f.args.rows,{'日期':'2026-09-02','播放量':1,'统计说明':''}]}),/统计键重复/);
}finally{f.jobs.close();}});
test('rows without a computed value are left as they are while releases are being left out',async()=>{const f=fixture();try{
 await projectReportTable(f.args);f.args.rows=[];
 const r=await projectReportTable({...f.args,clearMissing:false});
 assert.equal(r.readback,'verified');assert.equal(r.updated,0);assert.equal(f.records[0].fields.播放量,100);assert.equal(f.writeCount(),1);
 await projectReportTable(f.args);assert.equal(f.records[0].fields.播放量,0);
}finally{f.jobs.close();}});
test('report rows are cleared only when no release was left out; the snapshot-based daily table always is',()=>{
 assert.equal(clearsMissingRows('dramas',{excluded_releases:0}),true);
 assert.equal(clearsMissingRows('releaseDays',{excluded_releases:2}),false);
 assert.equal(clearsMissingRows('firstDays',{excluded_releases:1}),false);
 assert.equal(clearsMissingRows('accountDaily',{excluded_releases:2}),true);
 // An analytics result that does not say how many were left out is not trusted to clear.
 assert.equal(clearsMissingRows('dramas',{}),false);
});
