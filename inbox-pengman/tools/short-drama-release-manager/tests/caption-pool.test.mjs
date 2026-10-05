import test from 'node:test';
import assert from 'node:assert/strict';
import {JobStore} from '../src/job-store.mjs';
import {ensureCaptionDramas} from '../src/caption-pool.mjs';
function fixture(){
 const jobs=new JobStore(':memory:'),dramas=new Map();let posts=0;
 const repos={appToken:'test'};
 for(const [key,name] of [['accounts','账号台账'],['dramas','选剧池'],['captures','采集数据'],['releases','发布记录']])repos[key]={appToken:'test',tableId:`tbl-${key}`,tableName:name};
 repos.dramas.loadIndex=async()=>structuredClone(dramas);repos.dramas.serverGeneratedIds=true;
 repos.dramas.createWithGeneratedId=async(patch,actor,{beforeWrite})=>{await beforeWrite(structuredClone(dramas));posts++;assert.equal(actor,'caption_pool');const record={record_id:'new-drama',fields:{剧ID:'SD-1',...patch}};dramas.set('SD-1',record);return {record,readback:'verified'};};
 const candidate={title:'The Ice Man',platform:'ReelShort',post_id:'123'};
 return {jobs,repos,dramas,candidate,posts:()=>posts};
}
test('two captures of one new drama create one generated pool record and later runs reuse it',async()=>{
 const f=fixture();const r=await ensureCaptionDramas({jobs:f.jobs,repos:f.repos,candidates:[f.candidate,{...f.candidate,post_id:'124'}],revalidate:async()=>true});
 assert.equal(r.created,1);assert.equal(f.posts(),1);
 await ensureCaptionDramas({jobs:f.jobs,repos:f.repos,candidates:[f.candidate],revalidate:async()=>true});assert.equal(f.posts(),1);f.jobs.close();
});
test('unknown pool POST outcome never creates the same normalized title twice',async()=>{
 const f=fixture();let calls=0;
 f.repos.dramas.createWithGeneratedId=async(_p,_a,{beforeWrite})=>{await beforeWrite(f.dramas);calls++;throw Error('response lost');};
 const args={jobs:f.jobs,repos:f.repos,candidates:[f.candidate],revalidate:async()=>true};
 assert.equal((await ensureCaptionDramas(args)).held.length,1);assert.equal((await ensureCaptionDramas(args)).held.length,1);assert.equal(calls,1);f.jobs.close();
});
test('a changed capture cannot create an orphan pool record',async()=>{
 const f=fixture();const r=await ensureCaptionDramas({jobs:f.jobs,repos:f.repos,candidates:[f.candidate],revalidate:async()=>false});assert.equal(r.created,0);assert.equal(f.posts(),0);f.jobs.close();
});
