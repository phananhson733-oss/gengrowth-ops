import {createHash,randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {baseBinding} from './human-ops.mjs';
import {parseQualifiedInstantMs} from './qualified-iso.mjs';
import {assertPatchAllowed} from './schema.mjs';
import {ShortDramaError} from './errors.mjs';

const fail=(code,message,details={})=>{throw new ShortDramaError(code,message,details);};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
 Object.fromEntries(Object.keys(value).sort().filter(key=>value[key]!==undefined).map(key=>[key,stable(value[key])])):value;
const snapshotVersion=record=>hash(stable({record_id:record.record_id,fields:record.fields}));
const one=value=>Array.isArray(value)&&value.length===1&&typeof value[0]?.id==='string'?value[0].id:null;
const APPROVED_BATCH_ID='fakedatingpm';
const APPROVED_RELEASE_IDS=['SR-000614','SR-000615','SR-000616'];
function day(value){
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value?value:null;
 const instant=parseQualifiedInstantMs(value);
 return instant===null?null:new Date(instant+8*3600000).toISOString().slice(0,10);
}
function validateRequest(request,{expectedVersion=false}={}){
 const keys=['batch_id','release_ids','record_ids','account_record_id','drama_record_id','owner_id','planned_at',...(expectedVersion?['expected_version']:[])];
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).sort().join('|')!==keys.sort().join('|')||
  typeof request.batch_id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/.test(request.batch_id)||
  !Array.isArray(request.release_ids)||request.release_ids.length<1||request.release_ids.length>30||
  request.release_ids.some(id=>typeof id!=='string'||!/^SR-\d{6}$/.test(id))||new Set(request.release_ids).size!==request.release_ids.length||
  request.batch_id!==APPROVED_BATCH_ID||!isDeepStrictEqual(request.release_ids,APPROVED_RELEASE_IDS)||
  !Array.isArray(request.record_ids)||request.record_ids.length!==request.release_ids.length||
  request.record_ids.some(id=>typeof id!=='string'||!/^rec[A-Za-z0-9]+$/.test(id))||new Set(request.record_ids).size!==request.record_ids.length||
  [request.account_record_id,request.drama_record_id].some(id=>typeof id!=='string'||!/^rec[A-Za-z0-9]+$/.test(id))||
  typeof request.owner_id!=='string'||!/^ou_[A-Za-z0-9]+$/.test(request.owner_id)||
  request.planned_at!==day(request.planned_at)||
  expectedVersion&&(typeof request.expected_version!=='string'||!/^[0-9a-f]{64}$/.test(request.expected_version)))
  fail('batch_metadata_request_invalid','Metadata repair request must name exact bound records and a version');
}

/** Read-only proof of one existing, unlinked schedule with exactly the expected slots. */
export async function inspectBatchMetadataRepair({repos,request}){
 validateRequest(request,{expectedVersion:Object.hasOwn(request,'expected_version')});
 const index=await repos.releases.loadIndex();
 if(!(index instanceof Map))fail('base_response_incomplete','Complete release index required');
 const ids=new Set(request.release_ids),rows=[];
 for(let position=0;position<request.release_ids.length;position++){
  const id=request.release_ids[position],record=index.get(id);
  if(!record||record.record_id!==request.record_ids[position]||record.fields.发布ID!==id||
    ![null,''].includes(record.fields.批次ID??null)||![null,''].includes(record.fields.归档状态??null)||
    record.fields.计划序号!==position+1||record.fields.批次计划条数!==request.release_ids.length||
    day(record.fields.日期)!==request.planned_at||day(record.fields.计划发布时间)!==request.planned_at||
    one(record.fields.账号)!==request.account_record_id||one(record.fields.剧)!==request.drama_record_id||
    one(record.fields.处理负责人)!==request.owner_id||record.fields['Post ID']||record.fields.视频链接||record.fields.采集记录?.length)
   fail('batch_metadata_conflict','Original release slot changed or does not match the approved repair',{release_id:id});
  rows.push({release_id:id,record_id:record.record_id,before:structuredClone(record),version:snapshotVersion(record)});
 }
 for(const [id,record] of index){
  if(ids.has(id))continue;
  const fields=record.fields,planDay=day(fields.计划发布时间)??day(fields.日期);
  if(fields.批次ID===request.batch_id||planDay===request.planned_at&&(
    one(fields.账号)===request.account_record_id&&[request.drama_record_id,null].includes(one(fields.剧))||
    one(fields.剧)===request.drama_record_id&&one(fields.账号)===null))
   fail('batch_metadata_conflict','Another release competes with the approved repair',{release_id:id});
 }
 return {batch_id:request.batch_id,release_ids:[...request.release_ids],version:hash({binding:baseBinding(repos),batch_id:request.batch_id,release_ids:request.release_ids,rows:rows.map(r=>r.version)}),rows};
}

/** One-time internal maintenance channel. A started or uncertain POST is never replayed. */
export async function processBatchMetadataRepairs({jobs,repos,requests=[],now=()=>new Date()}){
 if(!requests.length)return {status:'disabled',repaired:[],errors:[]};
 const binding=baseBinding(repos),lockKey=`human-base:${binding}`,ownerId=`batch-metadata-${randomUUID()}`;
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))return {status:'deferred',repaired:[],errors:[]};
 const result={status:'success',repaired:[],errors:[]};
 let leaseError=null;
 const renew=()=>{try{jobs.renewMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300});}catch(error){leaseError=error;}};
 const check=()=>{renew();if(leaseError)throw leaseError;};
 const timer=setInterval(renew,1000);timer.unref?.();
 try{
  jobs.db.exec(`CREATE TABLE IF NOT EXISTS batch_metadata_repairs (repair_key TEXT PRIMARY KEY,batch_id TEXT NOT NULL,state TEXT NOT NULL,plan_json TEXT NOT NULL,updated_at TEXT NOT NULL,error_code TEXT)`);
  for(const request of requests){
   const key=`${binding}:${request.batch_id}`;
   const old=jobs.db.prepare('SELECT state FROM batch_metadata_repairs WHERE repair_key=?').get(key);
   if(old?.state==='complete'){result.repaired.push({batch_id:request.batch_id,status:'already_repaired'});continue;}
   if(old){result.errors.push({batch_id:request.batch_id,code:'batch_metadata_requires_inspection'});continue;}
   let started=false;
   try{
    validateRequest(request,{expectedVersion:true});check();
    const plan=await inspectBatchMetadataRepair({repos,request});check();
    if(plan.version!==request.expected_version)fail('batch_metadata_stale','Live release rows changed since inspection');
    jobs.db.prepare("INSERT INTO batch_metadata_repairs VALUES(?,?,'started',?,?,NULL)").run(key,request.batch_id,JSON.stringify({version:plan.version,release_ids:plan.release_ids}),now().toISOString());started=true;
    const fresh=await inspectBatchMetadataRepair({repos,request});check();
    if(fresh.version!==plan.version)fail('batch_metadata_stale','Release rows changed before repair write');
    const patch={批次ID:request.batch_id,归档状态:'active'};
    assertPatchAllowed('发布记录',patch,'human');
    const written=await repos.releases.client.updateRecords(repos.releases.appToken,repos.releases.tableId,
      plan.rows.map(row=>({record_id:row.record_id,fields:patch})),{tableName:'发布记录',noRetry:true});check();
    if(!Array.isArray(written)||written.length!==plan.rows.length||new Set(written.map(row=>row.record_id)).size!==plan.rows.length||
      written.some(row=>!plan.rows.some(item=>item.record_id===row.record_id)))fail('readback_mismatch','Metadata update acknowledgement did not name the exact original records');
    const after=await repos.releases.loadIndex();check();
    for(const row of plan.rows){
     const record=after.get(row.release_id),expected={...row.before,fields:{...row.before.fields,...patch}};
     if(!record||record.record_id!==row.record_id||snapshotVersion(record)!==snapshotVersion(expected))
      fail('readback_mismatch','Metadata repair did not preserve and verify the original release',{release_id:row.release_id});
    }
    for(const row of plan.rows){
     const record=after.get(row.release_id);
     jobs.appendAudit({actorId:'system:batch-metadata-repair',action:'repair-batch-metadata',targetTable:'发布记录',targetKey:row.release_id,
      before:{batch_id:row.before.fields.批次ID??null,archive_state:row.before.fields.归档状态??null,version:row.version},after:patch,
      readback:{record_id:row.record_id,version:snapshotVersion(record),status:'verified'},now:now()});
    }
    jobs.db.prepare("UPDATE batch_metadata_repairs SET state='complete',updated_at=? WHERE repair_key=?").run(now().toISOString(),key);
    result.repaired.push({batch_id:request.batch_id,status:'verified',release_ids:plan.release_ids,changed:plan.rows.length});
   }catch(error){
    const code=typeof error?.code==='string'?error.code:'batch_metadata_uncertain';
    if(started)jobs.db.prepare("UPDATE batch_metadata_repairs SET state='uncertain',error_code=?,updated_at=? WHERE repair_key=?").run(code,now().toISOString(),key);
    result.errors.push({batch_id:request.batch_id,code,release_ids:request.release_ids});
    if(leaseError)break;
   }
  }
  if(result.errors.length)result.status='partial';
  return result;
 }finally{clearInterval(timer);jobs.releaseMutationLease({lockKey,ownerId});}
}
