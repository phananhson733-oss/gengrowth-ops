import {randomUUID} from 'node:crypto';
import {baseBinding} from './human-ops.mjs';
import {isHighConfidenceBatch,releaseVersion} from './release-batches.mjs';
import {ShortDramaError} from './errors.mjs';
const fail=(code,message)=>{throw new ShortDramaError(code,message);};
function initialize(db){db.exec(`CREATE TABLE IF NOT EXISTS batch_auto_matches (
 batch_key TEXT PRIMARY KEY, batch_id TEXT NOT NULL, state TEXT NOT NULL, plan_json TEXT NOT NULL,
 completed_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, error_code TEXT)`);}

/** Internal scheduler only. It never impersonates an operator or manufactures an approval receipt. */
export async function processAutomaticBatchMatches({jobs,repos,query,now=()=>new Date(),enabled=false,since,countOnlySince=null,isOwnerAllowed}){
 if(!enabled)return {status:'disabled',filled:0,batches:0,held:[],errors:[]};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(since??'')||typeof isOwnerAllowed!=='function')fail('batch_auto_config_invalid','A rollout date and owner policy are required');
 const binding=baseBinding(repos);if(!binding)fail('batch_auto_config_invalid','Invalid Base binding');
 const lockKey=`human-base:${binding}`,ownerId=`auto-batch-${randomUUID()}`;
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))return {status:'deferred',filled:0,batches:0,held:[],errors:[]};
 const controller=new AbortController();let lost=null;
 const renew=()=>{try{jobs.renewMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300});}catch(e){lost=e;controller.abort();}};
 const assertOwned=()=>{if(lost)throw lost;renew();if(lost)throw lost;};
 const heartbeat=setInterval(renew,1000);heartbeat.unref?.();
 const result={status:'success',filled:0,batches:0,held:[],errors:[]};
 try{
  initialize(jobs.db);
  const report=await query();assertOwned();
  for(const original of report.rows){
   if(['complete','inactive'].includes(original.state))continue;
   const batchKey=`${binding}:${original.batch_id}`;
   const previous=jobs.db.prepare('SELECT state FROM batch_auto_matches WHERE batch_key=?').get(batchKey);
   if(previous){result.held.push({batch_id:original.batch_id,code:'automatic_attempt_requires_review'});continue;}
   if(original.planned_day<since||!isHighConfidenceBatch(original,{countOnlySince})||!isOwnerAllowed(original.owner_ids[0]))continue;
   const fresh=(await query({key:original.batch_id})).rows.find(b=>b.batch_id===original.batch_id);assertOwned();
   if(!fresh||fresh.version!==original.version||!isHighConfidenceBatch(fresh,{countOnlySince}))continue;
   const countOnly=fresh.candidates.some(c=>!c.evidence?.includes('title_exact'));
   const plan={version:fresh.version,rule:countOnly?'exclusive_account_day_count_sequence':fresh.local_calendar?'exact_unique_title_ordered_publication_day':'exact_unique_title_ordered_batch_12h_rollover',match_method:countOnly?'account_time':'batch_title_sequence',base_linked:fresh.linked,pairs:fresh.proposed,candidates:fresh.candidates,slots:fresh.slots};
   const at=now().toISOString();
   jobs.db.prepare("INSERT INTO batch_auto_matches(batch_key,batch_id,state,plan_json,completed_json,created_at,updated_at) VALUES(?,?,'started',?,'[]',?,?)").run(batchKey,fresh.batch_id,JSON.stringify(plan),at,at);
   const completed=[];
   try{
    for(let i=0;i<plan.pairs.length;i++){
     const pair=plan.pairs[i];
     const current=(await query({key:fresh.batch_id})).rows.find(b=>b.batch_id===fresh.batch_id);assertOwned();
     if(!current||!isHighConfidenceBatch(current,{countOnlySince})||current.linked!==plan.base_linked+i||current.remaining!==plan.pairs.length-i||JSON.stringify(current.proposed)!==JSON.stringify(plan.pairs.slice(i)))fail('batch_auto_stale','Batch no longer has the verified remaining assignment');
     for(const slot of current.slots)if(plan.slots.find(s=>s.release_id===slot.release_id)?.release_version!==slot.release_version)fail('batch_auto_stale','Plan changed during automatic application');
     for(const c of current.candidates){const old=plan.candidates.find(p=>p.post_id===c.post_id);if(!old||old.capture_version!==c.capture_version||old.caption_hash!==c.caption_hash)fail('batch_auto_stale','Capture evidence changed during automatic application');}
     const expected=await repos.releases.getByKey(pair.release_id,{signal:controller.signal});assertOwned();
     if(!expected||releaseVersion(expected)!==plan.slots.find(s=>s.release_id===pair.release_id).release_version)fail('batch_auto_stale','Release changed before automatic write');
     const capture=plan.candidates.find(c=>c.post_id===pair.post_id);
     const written=await repos.releases.registerBatchPostSafely(pair.release_id,pair.post_id,expected,capture.capture_version,{signal:controller.signal,matchMethod:plan.match_method});assertOwned();
     if(written.readback!=='verified'||written.record.fields['Post ID']!==pair.post_id||written.record.fields.采集记录?.[0]?.id!==capture.capture_record_id)fail('readback_mismatch','Automatic match requires verified identity and relation');
     completed.push(pair);result.filled++;
     jobs.db.prepare('UPDATE batch_auto_matches SET completed_json=?,updated_at=? WHERE batch_key=?').run(JSON.stringify(completed),now().toISOString(),batchKey);
     jobs.appendAudit({actorId:'system:batch-auto',action:'batch-auto-match',targetTable:'发布记录',targetKey:pair.release_id,
      before:{record:expected,rule:plan.rule,capture_version:capture.capture_version},after:{post_id:pair.post_id,batch_id:fresh.batch_id},readback:{record:written.record,status:'verified'},now:now()});
    }
    const final=(await query({key:fresh.batch_id})).rows.find(b=>b.batch_id===fresh.batch_id);assertOwned();
    if(final?.state!=='complete'||final.linked!==plan.base_linked+plan.pairs.length)fail('readback_mismatch','Final batch readback is incomplete');
    jobs.db.prepare("UPDATE batch_auto_matches SET state='complete',updated_at=? WHERE batch_key=?").run(now().toISOString(),batchKey);result.batches++;
   }catch(e){
    const code=e.code??'automatic_match_uncertain';
    jobs.db.prepare("UPDATE batch_auto_matches SET state='uncertain',error_code=?,updated_at=? WHERE batch_key=?").run(code,now().toISOString(),batchKey);
    result.errors.push({batch_id:fresh.batch_id,code,completed:completed.length});result.held.push({batch_id:fresh.batch_id,code:'automatic_attempt_requires_review'});
    if(lost)break;
   }
  }
  if(result.errors.length||result.held.length)result.status='partial';return result;
 }finally{clearInterval(heartbeat);jobs.releaseMutationLease({lockKey,ownerId});}
}
