import {createHash,randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {baseBinding} from './human-ops.mjs';
import {TABLES} from './schema.mjs';
import {ShortDramaError} from './errors.mjs';

const fail=(message)=>{throw new ShortDramaError('duplicate_relation_repair_conflict',message);};
const one=(value)=>Array.isArray(value)&&value.length===1?value[0]?.id:null;
const postFromUrl=(value)=>typeof value==='string'?value.match(/^https:\/\/www\.tiktok\.com\/@[^/]+\/(?:video|photo)\/(\d+)$/)?.[1]??null:null;
const protectedFields=[...TABLES['发布记录'].human,...TABLES['发布记录'].shared,'发布ID','采集记录','匹配方式','匹配置信度'];
const snapshot=(row)=>({record_id:row.record_id,fields:Object.fromEntries(protectedFields.map(key=>[key,row.fields[key]??null]))});

const compact=(value)=>typeof value==='string'?value.toLowerCase().replace(/[^a-z0-9]/g,''):'';
const beijingDate=(value)=>new Date(Date.parse(value)+8*3600000).toISOString().slice(0,10);
async function inspect(repos,request,readPostEvidence){
 const releases=await repos.releases.loadIndex(),captures=await repos.captures.loadIndex();
 const target=releases.get(request.release_id),owner=releases.get(request.owner_release_id),capture=captures.get(request.post_id);
 if(!target||!owner||!capture||target.record_id!==request.release_record_id||owner.record_id!==request.owner_record_id||capture.record_id!==request.capture_record_id)fail('Requested records or capture changed: '+JSON.stringify({target:target?.record_id??null,owner:owner?.record_id??null,capture:capture?.record_id??null}));
 const tf=target.fields,of=owner.fields,cf=capture.fields;
 const mode=request.mode??'explicit';
 if(!['explicit','machine_match','caption_part'].includes(mode))fail('Unsupported repair evidence mode');
 let post=null,ownerDrama=null;
 if(mode!=='explicit'){
  if(typeof readPostEvidence!=='function')fail('Current caption evidence reader is unavailable');
  post=await readPostEvidence(request.post_id);
  const dramas=await repos.dramas.loadIndex(),accounts=await repos.accounts.loadIndex();
  ownerDrama=[...dramas.values()].find(row=>row.record_id===request.owner_drama_record_id)?.fields??null;
  const account=[...accounts.values()].find(row=>row.record_id===one(of.账号))?.fields??null;
  if(!post||post.post_id!==request.post_id||post.post_url!==cf.视频链接||post.published_at!==request.published_at||cf.发布时间!==request.published_at||
     post.username!==account?.账号ID||createHash('sha256').update(post.caption??'').digest('hex')!==request.caption_sha256||
     ownerDrama?.剧名!==request.owner_title||!compact(post.caption).includes(compact(request.owner_title))||
     one(of.剧)!==request.owner_drama_record_id||one(tf.剧)!==request.target_drama_record_id)fail('Current publication or caption evidence changed');
 }
 const checks={
  target_date:tf.日期===request.release_date,owner_date:of.日期===request.owner_date,
  target_active:tf.归档状态==='active',owner_active:of.归档状态==='active',
  target_no_post:!tf['Post ID'],target_no_url:!tf.视频链接,target_no_batch:!tf.批次ID,
  target_relation:one(tf.采集记录)===capture.record_id,owner_relation:one(of.采集记录)===capture.record_id,
  capture_post:cf['Post ID']===request.post_id,
  same_account:!!one(tf.账号)&&one(tf.账号)===one(of.账号)&&one(tf.账号)===one(cf.账号),
 };
 if(mode==='explicit')Object.assign(checks,{
  target_no_note:!tf.备注,target_no_match_method:!tf.匹配方式,target_no_match_confidence:!tf.匹配置信度,
  owner_post:of['Post ID']===request.post_id,owner_url_post:postFromUrl(of.视频链接)===request.post_id,
  capture_url:cf.视频链接===of.视频链接,same_drama:!!one(tf.剧)&&one(tf.剧)===one(of.剧),
 });
 if(mode==='machine_match')Object.assign(checks,{
  target_no_note:!tf.备注,target_no_match_method:!tf.匹配方式,target_no_match_confidence:!tf.匹配置信度,
  owner_no_post:!of['Post ID'],owner_no_url:!of.视频链接,owner_machine_match:of.匹配方式==='account_time'&&of.匹配置信度===1,
  same_drama:!!one(tf.剧)&&one(tf.剧)===one(of.剧),same_day:tf.日期===of.日期&&beijingDate(post.published_at)===of.日期,
 });
 if(mode==='caption_part')Object.assign(checks,{
  owner_no_post:!of['Post ID'],owner_no_url:!of.视频链接,owner_note:of.备注===`第${request.part}条`,
  owner_no_match_method:!of.匹配方式,
  caption_part:new RegExp(`\\bpart\\s*${request.part}\\b`,'i').test(post.caption),
  target_unpublished:typeof tf.备注==='string'&&tf.备注.includes('未发布'),
  target_inferred_match:tf.匹配方式==='account_time'&&tf.匹配置信度===1,
  post_day_matches_target:beijingDate(post.published_at)===tf.日期,
  target_other_drama:!!one(tf.剧)&&one(tf.剧)!==one(of.剧),
 });
 const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
 if(failed.length)fail('Repair preflight failed: '+failed.join(','));
 const claimants=[...releases].filter(([,row])=>row.fields['Post ID']===request.post_id||postFromUrl(row.fields.视频链接)===request.post_id||one(row.fields.采集记录)===capture.record_id).map(([id])=>id).sort();
 if(!isDeepStrictEqual(claimants,[request.owner_release_id,request.release_id].sort()))fail('A third release also claims the post');
 return {target:snapshot(target),owner:snapshot(owner),capture:{record_id:capture.record_id,post_id:request.post_id}};
}

/** A single exact request is journaled before writing. Unknown outcomes require review. */
export async function processDuplicateRelationRepairs({jobs,repos,requests=[],readPostEvidence,now=()=>new Date()}){
 if(!requests.length)return {status:'disabled',repaired:[],errors:[]};
 const binding=baseBinding(repos),lockKey=`human-base:${binding}`,ownerId=`duplicate-relation-${randomUUID()}`;
 if(!binding)fail('Base binding is invalid');
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))return {status:'deferred',repaired:[],errors:[]};
 const result={status:'success',repaired:[],errors:[]};
 try{
  jobs.db.exec('CREATE TABLE IF NOT EXISTS duplicate_relation_repairs (repair_key TEXT PRIMARY KEY, state TEXT NOT NULL, before_json TEXT NOT NULL, updated_at TEXT NOT NULL, error_code TEXT)');
  for(const request of requests){
   const key=`${binding}:${request.release_id}:${request.post_id}${request.attempt_id?':'+request.attempt_id:''}`;
   const prior=jobs.db.prepare('SELECT state FROM duplicate_relation_repairs WHERE repair_key=?').get(key);
   if(prior?.state==='complete'){result.repaired.push({release_id:request.release_id,status:'already_repaired'});continue;}
   if(prior){result.errors.push({release_id:request.release_id,code:'duplicate_relation_repair_requires_review'});continue;}
   let started=false;
   try{
    const before=await inspect(repos,request,readPostEvidence);
    jobs.db.prepare("INSERT INTO duplicate_relation_repairs VALUES(?,'started',?,?,NULL)").run(key,JSON.stringify(before),now().toISOString());started=true;
    jobs.appendAudit({actorId:'system:duplicate-relation-repair',action:'duplicate_relation_repair_intent',targetTable:'发布记录',targetKey:request.release_id,before,after:{detach_capture_relation:request.capture_record_id},readback:{status:'pending'},now:now()});
    const written=await repos.releases.detachDuplicateCaptureSafely(request,before);
    if(written.readback!=='verified'||!isDeepStrictEqual(snapshot(written.owner),before.owner)||!isDeepStrictEqual(snapshot({...written.target,fields:{...written.target.fields,采集记录:before.target.fields.采集记录}}),before.target)||!isDeepStrictEqual(written.target.fields.采集记录,[]))fail('Independent readback differs');
    jobs.appendAudit({actorId:'system:duplicate-relation-repair',action:'duplicate_relation_repair_resolved',targetTable:'发布记录',targetKey:request.release_id,before,after:{采集记录:[]},readback:{status:'verified',target:snapshot(written.target),owner:snapshot(written.owner)},now:now()});
    jobs.db.prepare("UPDATE duplicate_relation_repairs SET state='complete',updated_at=? WHERE repair_key=?").run(now().toISOString(),key);
    result.repaired.push({release_id:request.release_id,owner_release_id:request.owner_release_id,post_id:request.post_id,status:'verified'});
   }catch(error){
    const code=error.code??'duplicate_relation_repair_uncertain';
    if(started)jobs.db.prepare("UPDATE duplicate_relation_repairs SET state='uncertain',error_code=?,updated_at=? WHERE repair_key=?").run(code,now().toISOString(),key);
    result.errors.push({release_id:request.release_id,code,message:error.message});
   }
  }
  if(result.errors.length)result.status='partial';return result;
 }finally{jobs.releaseMutationLease({lockKey,ownerId});}
}
