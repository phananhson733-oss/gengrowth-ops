import {createHash} from 'node:crypto';
import {canonicalCapturePostUrl} from './match-candidates.mjs';
import {validateExcludedPostIds} from './capture-policy.mjs';

const one=value=>Array.isArray(value)&&value.length===1?value[0]?.id:null;
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function atomic(db,operation){db.exec('BEGIN IMMEDIATE');try{operation();db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}}
function recordLink(baseUrl,tableId,recordId){
 const url=new URL(baseUrl);url.searchParams.set('table',tableId);url.searchParams.set('record',recordId);return url.toString();
}

/** Notify only account owners of releases whose Base and reverse capture links were verified. */
export async function processCaptionOwnerNotifications({jobs,repos,requestId,baseUrl,tableId,send,now=()=>new Date(),respectQuietHours=false,notifyStartHour=9,notifyEndHour=20,excludedPostIds=[]}){
 const excluded=new Set(validateExcludedPostIds(excludedPostIds));
 jobs.db.exec(`CREATE TABLE IF NOT EXISTS caption_owner_notifications (
  request_id TEXT NOT NULL, post_id TEXT NOT NULL, recipient TEXT, state TEXT NOT NULL,
  attempt_id TEXT, message_id TEXT, error_code TEXT, updated_at TEXT NOT NULL,
  PRIMARY KEY(request_id,post_id))`);
 const row=jobs.db.prepare('SELECT state,plan_json,completed_json FROM caption_backfill_runs WHERE request_id=?').get(requestId);
 if(!row)return {status:'no_op',reason:'plan_missing'};
 const plan=JSON.parse(row.plan_json);
 if(plan.lead_review_only!==true&&plan.recognition_mode!==true)return {status:'no_op',reason:'not_caption_review'};
 const localHour=new Date(now().getTime()+8*3600000).getUTCHours();
 if(respectQuietHours&&(localHour<notifyStartHour||localHour>=notifyEndHour))return {status:'deferred',reason:'quiet_hours'};
 const completed=JSON.parse(row.completed_json);
 if(!completed.length)return {status:'no_op',reason:'no_verified_releases'};
 const [accounts,captures,releases]=await Promise.all([repos.accounts.loadIndex(),repos.captures.loadIndex(),repos.releases.loadIndex()]);
 const actions=new Map(plan.actions.map(action=>[action.post_id,action]));
 const pending=new Map(),held=[];
 for(const receipt of completed){
  if(excluded.has(receipt.post_id))continue;
  if(receipt.reverse_pending)continue;
  const proposed=actions.get(receipt.post_id);
  if(plan.recognition_mode&&proposed?.drama_record_id&&!proposed.review_reason&&!proposed.pending_timestamp)continue;
  const prior=jobs.db.prepare('SELECT state FROM caption_owner_notifications WHERE request_id=? AND post_id=?').get(requestId,receipt.post_id);
  if(prior){if(prior.state!=='sent')held.push({post_id:receipt.post_id,reason:'delivery_uncertain'});continue;}
  const action=actions.get(receipt.post_id),account=accounts.get(action?.account_id),capture=captures.get(receipt.post_id),release=releases.get(receipt.release_id);
  const owners=Array.isArray(account?.fields.负责人)?[...new Set(account.fields.负责人.map(value=>value?.id).filter(value=>typeof value==='string'&&/^ou_[A-Za-z0-9]+$/.test(value)))]:[];
  if(!action||!account||!capture||!release||owners.length!==1||owners[0]!==action.owner_id){held.push({post_id:receipt.post_id,reason:'owner_unavailable_or_changed'});continue;}
  if(release.record_id!==receipt.release_record_id||release.fields['Post ID']!==receipt.post_id||
     canonicalCapturePostUrl(release.fields.视频链接)!==action.video_url||one(release.fields.账号)!==action.account_record_id||
     one(release.fields.采集记录)!==action.capture_record_id||
     (plan.recognition_mode?one(release.fields.剧)!==(action.drama_record_id??null):!!one(release.fields.剧))||
     release.fields.归档状态&&release.fields.归档状态!=='active'||
     !Array.isArray(capture.fields.关联发布记录)||capture.fields.关联发布记录.length!==1||capture.fields.关联发布记录[0].id!==release.record_id){
   held.push({post_id:receipt.post_id,reason:'record_changed'});continue;
  }
  if(!pending.has(owners[0]))pending.set(owners[0],[]);
  pending.get(owners[0]).push({post_id:receipt.post_id,release_id:receipt.release_id,record_id:release.record_id,
   account_id:action.account_id,url:action.video_url,reason:release.fields.待处理原因??(action.pending_timestamp?'发布时间待核对':'剧名待人工匹配')});
 }
 let sent=0;
 for(const [recipient,items] of pending){
  items.sort((a,b)=>a.post_id.localeCompare(b.post_id));
  for(let start=0,chunkSize=plan.recognition_mode?8:20;start<items.length;start+=chunkSize){
   const chunk=items.slice(start,start+chunkSize),at=now().toISOString(),attemptId=hash([requestId,recipient,chunk.map(item=>item.post_id)]).slice(0,32);
   atomic(jobs.db,()=>{
    for(const item of chunk)jobs.db.prepare("INSERT INTO caption_owner_notifications(request_id,post_id,recipient,state,attempt_id,updated_at) VALUES(?,?,?,'sending',?,?)").run(requestId,item.post_id,recipient,attemptId,at);
   });
   const lines=chunk.map(item=>`${item.release_id}｜@${item.account_id}｜Post ID ${item.post_id}${plan.recognition_mode?'｜'+String(item.reason).slice(0,100):''}`).join('\n');
   const message=`${plan.recognition_mode?'这些发布记录的采集关联已完成，请核对下面标记的剧名或发布时间；无需再次确认视频链接。':'这些发布记录已按采集视频自动建立，剧名留空。请在短剧发行管理的发布记录中为它们匹配正确的剧；无需确认视频链接。'}\n\n${lines}\n\n打开发布记录：${recordLink(baseUrl,tableId,chunk[0].record_id)}`;
   try{
    const ack=await send({userId:recipient,text:message.slice(0,2000),uuid:attemptId});
    if(typeof ack?.message_id!=='string'||!ack.message_id)throw Error('message_ack_missing');
    atomic(jobs.db,()=>{for(const item of chunk)jobs.db.prepare("UPDATE caption_owner_notifications SET state='sent',message_id=?,updated_at=? WHERE request_id=? AND post_id=? AND attempt_id=? AND state='sending'").run(ack.message_id,now().toISOString(),requestId,item.post_id,attemptId);});
    sent+=chunk.length;
   }catch(error){
    const code=error.code??'delivery_uncertain';
    atomic(jobs.db,()=>{for(const item of chunk)jobs.db.prepare("UPDATE caption_owner_notifications SET state='uncertain',error_code=?,updated_at=? WHERE request_id=? AND post_id=? AND attempt_id=? AND state='sending'").run(code,now().toISOString(),requestId,item.post_id,attemptId);});
    for(const item of chunk)held.push({post_id:item.post_id,reason:code});
   }
  }
 }
 return {status:held.length?'partial':'success',sent,held};
}

/** Retry unsent review work on every scheduler tick, even when there are no new posts. */
export async function processCaptionAutomationNotifications({jobs,repos,baseUrl,tableId,captureTableId,send,now=()=>new Date(),notifyStartHour=9,notifyEndHour=20,excludedPostIds=[]}){
 const excluded=new Set(validateExcludedPostIds(excludedPostIds));
 const exists=name=>!!jobs.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
 const result={status:'success',sent:0,held:[]};
 const localHour=new Date(now().getTime()+8*3600000).getUTCHours();
 if(localHour<notifyStartHour||localHour>=notifyEndHour)return {status:'deferred',reason:'quiet_hours',sent:0};
 if(exists('caption_backfill_runs')){
  const rows=jobs.db.prepare("SELECT request_id,plan_json,completed_json FROM caption_backfill_runs WHERE request_id LIKE 'caption-auto-%' AND completed_json!='[]' ORDER BY updated_at DESC").all();
  let processed=0;
  for(const row of rows){
   const plan=JSON.parse(row.plan_json);if(!plan.recognition_mode&&!plan.lead_review_only)continue;
   const actions=new Map(plan.actions.map(a=>[a.post_id,a]));
   const pending=JSON.parse(row.completed_json).some(receipt=>{
    if(excluded.has(receipt.post_id))return false;
    const a=actions.get(receipt.post_id);if(receipt.reverse_pending||plan.recognition_mode&&a?.drama_record_id&&!a.review_reason&&!a.pending_timestamp)return false;
    return !exists('caption_owner_notifications')||!jobs.db.prepare('SELECT state FROM caption_owner_notifications WHERE request_id=? AND post_id=?').get(row.request_id,receipt.post_id);
   });
   if(!pending)continue;
   const report=await processCaptionOwnerNotifications({jobs,repos,requestId:row.request_id,baseUrl,tableId,send,now,respectQuietHours:true,notifyStartHour,notifyEndHour,excludedPostIds});
   result.sent+=report.sent??0;result.held.push(...(report.held??[]));if(++processed>=10)break;
  }
 }
 if(!exists('caption_auto_reviews'))return result;
 jobs.db.exec(`CREATE TABLE IF NOT EXISTS caption_held_notifications (
  notification_key TEXT PRIMARY KEY,post_id TEXT NOT NULL,recipient TEXT NOT NULL,state TEXT NOT NULL,
  message_id TEXT,error_code TEXT,updated_at TEXT NOT NULL)`);
 const reviews=jobs.db.prepare('SELECT post_id,reason,evidence_json FROM caption_auto_reviews ORDER BY updated_at').all();
 if(!reviews.length)return result;
 const [captures,accounts]=await Promise.all([repos.captures.loadIndex(),repos.accounts.loadIndex()]);
 const accountByRecord=new Map([...accounts].map(([id,r])=>[r.record_id,{id,...r}]));
 const labels={capture_identity_conflict:'采集账号、链接或发布时间证据不一致',account_not_drama:'账号不属于短剧账号',unresolved_release_plan:'表里有一条可能对应的空发布记录',multiple_release_batches:'表里有不止一组发布计划可能对应',linked_order_conflict:'发布时间顺序和已关联的视频对不上',post_claim_conflict:'这条视频被多条发布记录占用',claimed_release_conflict:'这条视频似乎已关联到另一条发布记录',pool_creation_requires_review:'新识别的剧还需核对',caption_unavailable_or_changed:'视频文案缺失或已变化'};
 for(const review of reviews){
  if(excluded.has(review.post_id))continue;
  const capture=captures.get(review.post_id);
  if(!capture||capture.fields.关联发布记录?.length){jobs.db.prepare('DELETE FROM caption_auto_reviews WHERE post_id=?').run(review.post_id);continue;}
  if(review.reason==='account_not_drama')continue;
  const account=accountByRecord.get(one(capture.fields.账号)),recipient=one(account?.fields.负责人);
  if(!recipient||!/^ou_[A-Za-z0-9]+$/.test(recipient)){result.held.push({post_id:review.post_id,reason:'owner_unavailable'});continue;}
  const key=hash([review.post_id,review.reason,recipient,review.evidence_json]);
  const old=jobs.db.prepare('SELECT state FROM caption_held_notifications WHERE notification_key=?').get(key);
  if(old){if(old.state!=='sent')result.held.push({post_id:review.post_id,reason:'notification_delivery_uncertain'});continue;}
  const claimed=jobs.db.prepare("INSERT OR IGNORE INTO caption_held_notifications VALUES(?,?,?,'sending',NULL,NULL,?)").run(key,review.post_id,recipient,now().toISOString()).changes;
  if(!claimed)continue;
  const caption=String(capture.fields.Caption??'（空）').slice(0,500);
  const part=review.reason==='part_slot_conflict'?/\bpart\s*(\d+)\b/i.exec(caption)?.[1]:null;
  const text=review.reason==='part_slot_conflict'
   ?`我抓到了 @${account.id} 的视频${part?`（文案写着 Part ${part}）`:''}，但现在不能确定它该对应哪条发布记录，所以没有自动关联。\nPost ID：${review.post_id}\n请先核对当天的发布计划，以及这条视频对应哪条记录。\n查看采集记录：${recordLink(baseUrl,captureTableId,capture.record_id)}\n有空处理即可，不用限时回复。`
   :`我抓到了 @${account.id} 的视频（Post ID：${review.post_id}），但${labels[review.reason]??'暂时无法确定该对应哪条发布记录'}，所以没有自动关联。\n请查看这条视频，确认账号、剧名或它对应的发布记录。\n查看采集记录：${recordLink(baseUrl,captureTableId,capture.record_id)}\n有空处理即可，不用限时回复。`;
  try{
   const ack=await send({userId:recipient,text,uuid:key.slice(0,32)});if(!ack?.message_id)throw Error('message_ack_missing');
   jobs.db.prepare("UPDATE caption_held_notifications SET state='sent',message_id=?,updated_at=? WHERE notification_key=?").run(ack.message_id,now().toISOString(),key);result.sent++;
  }catch(error){jobs.db.prepare("UPDATE caption_held_notifications SET state='uncertain',error_code=?,updated_at=? WHERE notification_key=?").run(error.code??'notification_delivery_uncertain',now().toISOString(),key);result.held.push({post_id:review.post_id,reason:'notification_delivery_uncertain'});}
  if(result.sent>=20)break;
 }
 if(result.held.length)result.status='partial';return result;
}
