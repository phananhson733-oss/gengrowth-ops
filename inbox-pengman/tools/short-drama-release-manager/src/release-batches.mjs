import { createHash, randomUUID } from 'node:crypto';
import { ShortDramaError } from './errors.mjs';
import { canonicalCapturePostUrl, captureMatchVersion } from './match-candidates.mjs';
import { parseQualifiedInstantMs } from './qualified-iso.mjs';
import { withMutationLeaseRetry } from './mutation-busy-retry.mjs';
import { nextDay, zonedDay, zonedDayStart } from './zoned-day.mjs';
import { validateExcludedPostIds } from './capture-policy.mjs';

const DAY = 86_400_000;
const fail=(code,message,details={})=>{throw new ShortDramaError(code,message,details);};
const one=value=>Array.isArray(value)&&value.length===1&&typeof value[0]?.id==='string'?value[0].id:null;
const text=value=>typeof value==='string'?value.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').trim():'';
const norm=value=>text(value).normalize('NFKC').toLowerCase().replace(/[’']/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const titleIn=(title,caption)=>norm(title).length>=2&&` ${norm(caption)} `.includes(` ${norm(title)} `);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function day(value){
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value?value:null;
 const ms=parseQualifiedInstantMs(value);return ms===null?null:new Date(ms+8*3600000).toISOString().slice(0,10);
}
function identity(url){const canonical=canonicalCapturePostUrl(url);if(!canonical)return null;const m=new URL(canonical).pathname.match(/^\/@([^/]+)\/(?:video|photo)\/(\d+)$/);return m?{account:m[1],post:m[2],url:canonical}:null;}
const ownerIds=fields=>Array.isArray(fields.处理负责人)?[...new Set(fields.处理负责人.map(x=>x?.id).filter(x=>typeof x==='string'))].sort():[];
export function releaseVersion(record){return hash({record_id:record.record_id,fields:Object.fromEntries(['发布ID','日期','计划发布时间','批次ID','计划序号','批次计划条数','处理负责人','账号','剧','归档状态','备注','Post ID','视频链接','采集记录'].map(k=>[k,record.fields[k]??null]))});}

function inspectScheduleCollision(releases,{accountRecordId,dramaRecordId,plannedAt,count,ownerId,notes}){
 if(!(releases instanceof Map))fail('base_response_incomplete','Complete release index required');
 const sameAccountDay=[...releases].filter(([,record])=>one(record.fields.账号)===accountRecordId&&
  (day(record.fields.计划发布时间)===plannedAt||day(record.fields.日期)===plannedAt));
 const unresolved=sameAccountDay.filter(([,record])=>!one(record.fields.剧));
 if(unresolved.length)fail('batch_schedule_conflict','An account-day release has no unique drama relation',{
  planned_at:plannedAt,existing_release_ids:unresolved.map(([id])=>id).sort(),
 });
 const unknownAccount=[...releases].filter(([,record])=>one(record.fields.剧)===dramaRecordId&&!one(record.fields.账号)&&
  (day(record.fields.计划发布时间)===plannedAt||day(record.fields.日期)===plannedAt));
 if(unknownAccount.length)fail('batch_schedule_conflict','A drama-day release has no unique account relation',{
  planned_at:plannedAt,existing_release_ids:unknownAccount.map(([id])=>id).sort(),
 });
 const matching=sameAccountDay.filter(([,record])=>one(record.fields.剧)===dramaRecordId);
 if(!matching.length)return {status:'absent'};
 const batchId=matching[0][1].fields.批次ID;
 const allInBatch=typeof batchId==='string'&&batchId.length>0&&[...releases.values()].filter(record=>record.fields.批次ID===batchId).length===matching.length;
 const ordered=[...matching].sort((a,b)=>a[1].fields.计划序号-b[1].fields.计划序号);
 const complete=allInBatch&&matching.length===count&&ordered.every(([id,record],index)=>{
  const fields=record.fields;
  return fields.归档状态==='active'&&fields.批次ID===batchId&&fields.计划序号===index+1&&fields.批次计划条数===count&&
   day(fields.日期)===plannedAt&&day(fields.计划发布时间)===plannedAt&&
   ownerIds(fields).length===1&&ownerIds(fields)[0]===ownerId&&(fields.备注??null)===(notes||null);
 });
 if(complete)return {status:'already_scheduled',batch_id:batchId,completed:ordered.map(([id])=>id),planned_at:plannedAt,count,readback:'verified',mutations:0};
 fail('batch_schedule_conflict','Existing release plans for this account, drama, and day need review',{
  planned_at:plannedAt,existing_release_ids:matching.map(([id])=>id).sort(),existing_batch_ids:[...new Set(matching.map(([,record])=>record.fields.批次ID).filter(Boolean))].sort(),
 });
}
function requireAbsentSchedule(releases,identity){
 const result=inspectScheduleCollision(releases,identity);
 if(result.status!=='absent')fail('batch_schedule_conflict','A complete batch was registered while this direct request was being checked',{
  planned_at:identity.plannedAt,existing_batch_ids:[result.batch_id],existing_release_ids:result.completed,
 });
}

/** A full-index, read-only batch projection. Never infers a drama from counts or assigns a post twice. */
export async function queryReleaseBatches({repos,readPosts,readAccounts=async()=>[],now=new Date(),key,waitHours=24,publicationTimezone='Asia/Shanghai',publicationTimezoneSince=null,publicationTimezones={},excludedPostIds=[]}={}){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime())||!Number.isFinite(waitHours)||waitHours<0)fail('batch_input_invalid','Invalid clock or wait hours');
 const excluded=new Set(validateExcludedPostIds(excludedPostIds));
 if(key!==undefined&&(typeof key!=='string'||!key||key.trim()!==key))fail('batch_input_invalid','Invalid batch ID');
 const [accounts,dramas,captures,releases]=await Promise.all(['accounts','dramas','captures','releases'].map(k=>repos[k].loadIndex()));
 for(const idx of [accounts,dramas,captures,releases])if(!(idx instanceof Map))fail('base_response_incomplete','Complete indexes required');
 const rawPosts=await readPosts();const accountSnapshots=await readAccounts();
 if(!Array.isArray(rawPosts)||!Array.isArray(accountSnapshots))fail('batch_source_invalid','Source is unavailable');
 const posts=rawPosts.filter(post=>!excluded.has(post.post_id));
 const source=new Map(),freshness=new Map();
 for(const p of [...accountSnapshots,...posts]){const at=Date.parse(p.captured_at);if(typeof p.username==='string'&&Number.isFinite(at))freshness.set(p.username,Math.max(freshness.get(p.username)??0,at));}
 for(const p of posts){if(typeof p.post_id!=='string'||source.has(p.post_id))fail('batch_source_invalid','Source Post ID missing or duplicated');source.set(p.post_id,p);}
 const accountByRecord=new Map([...accounts].map(([id,r])=>[r.record_id,{id,...r.fields}]));
 const dramaByRecord=new Map([...dramas].map(([id,r])=>[r.record_id,{id,...r.fields}]));
 const captureByRecord=new Map([...captures].map(([id,r])=>[r.record_id,id]));
 const claims=new Map();const reserve=(id,owner)=>{if(id){if(!claims.has(id))claims.set(id,new Set());claims.get(id).add(owner);}};
 for(const [id,r] of releases){reserve(r.fields['Post ID'],id);reserve(identity(r.fields.视频链接)?.post,id);for(const link of r.fields.采集记录??[])reserve(captureByRecord.get(link.id),id);}
 const releaseByRecord=new Map([...releases].map(([id,r])=>[r.record_id,id]));
 for(const [id,r] of captures)for(const link of r.fields.关联发布记录??[])reserve(id,releaseByRecord.get(link.id)??`unknown:${link.id}`);
 const groups=new Map();
 for(const [id,r]of releases){const b=r.fields.批次ID;if(typeof b==='string'&&b){if(!groups.has(b))groups.set(b,[]);groups.get(b).push({id,...r});}}
 const rows=[];
 for(const [batchId,members]of groups){
  members.sort((a,b)=>(a.fields.计划序号??Infinity)-(b.fields.计划序号??Infinity)||a.id.localeCompare(b.id));
  const first=members[0].fields,account=accountByRecord.get(one(first.账号)),drama=dramaByRecord.get(one(first.剧));
  const planned=first.计划发布时间??first.日期,plannedDay=day(planned),owners=ownerIds(first),count=first.批次计划条数;
  const localCalendar=plannedDay&&publicationTimezoneSince&&plannedDay>=publicationTimezoneSince;
  const planTimezone=localCalendar?(Object.hasOwn(publicationTimezones,account?.id)?publicationTimezones[account.id]:publicationTimezone):'Asia/Shanghai';
  const windowStart=plannedDay?zonedDayStart(plannedDay,planTimezone):null;
  const windowEnd=plannedDay?zonedDayStart(nextDay(plannedDay),planTimezone):null;
  if(plannedDay&&(windowStart===null||windowEnd===null))fail('batch_input_invalid','Invalid publication calendar');
  const reasons=[];const slots=[],linkedSequences=[],linkedTimes=[];let linked=0,linkedLatestMs=-Infinity;
  if(members.some(r=>/未发布|取消|暂停|待制作|待验收|未验收/.test(String(r.fields.备注??''))))reasons.push('notes_say_unpublished');
  const allArchived=members.every(r=>r.fields.归档状态==='archived');
  if(!account||!drama||!plannedDay||!Number.isInteger(count)||count<1||count>30||members.length!==count||members.some((r,i)=>r.fields.计划序号!==i+1||r.fields.批次计划条数!==count||one(r.fields.账号)!==one(first.账号)||one(r.fields.剧)!==one(first.剧)||r.fields.计划发布时间!==first.计划发布时间||JSON.stringify(ownerIds(r.fields))!==JSON.stringify(owners)||!['active','archived'].includes(r.fields.归档状态))||!allArchived&&members.some(r=>r.fields.归档状态==='archived'))reasons.push('batch_metadata_invalid');
  for(const r of members){
   const f=r.fields,ids=new Set([f['Post ID'],identity(f.视频链接)?.post,...(f.采集记录??[]).map(x=>captureByRecord.get(x.id))].filter(Boolean));
   if(ids.size||f.采集记录?.length||f.视频链接){
    const id=[...ids][0],cap=captures.get(id),ci=identity(cap?.fields.视频链接);
    if(ids.size===1&&cap&&one(f.采集记录)===cap.record_id&&ci?.post===id&&ci.account===account?.id&&one(cap.fields.账号)===one(f.账号)&&claims.get(id)?.size===1&&claims.get(id).has(r.id)){
     linked++;linkedSequences.push(f.计划序号);
     const linkedMs=parseQualifiedInstantMs(cap.fields.发布时间);
     linkedTimes.push(linkedMs);
     linkedLatestMs=Math.max(linkedLatestMs,linkedMs??-Infinity);
    }
    else reasons.push('existing_link_conflict');
   }else if(f.归档状态==='active')slots.push({release_id:r.id,record_id:r.record_id,sequence:f.计划序号,release_version:releaseVersion(r)});
  }
  const candidates=[],accountDayPosts=new Set();
  if(account&&drama&&plannedDay&&!allArchived){
   if(localCalendar){
    for(const p of posts){const ms=parseQualifiedInstantMs(p.published_at);if(p.username===account.id&&ms!==null&&zonedDay(ms,planTimezone)===plannedDay)accountDayPosts.add(p.post_id);}
   }
   for(const [postId,cap]of captures){
    if(excluded.has(postId))continue;
    if(one(cap.fields.账号)!==one(first.账号))continue;
    const ci=identity(cap.fields.视频链接),publishDay=day(cap.fields.发布时间),publishMs=parseQualifiedInstantMs(cap.fields.发布时间);
    if(localCalendar&&publishMs!==null&&zonedDay(publishMs,planTimezone)===plannedDay)accountDayPosts.add(postId);
    if(!ci||ci.post!==postId||ci.account!==account.id||!publishDay||publishMs===null||publishMs>now.getTime()||now.getTime()-publishMs>30*DAY)continue;
    const delta=(Date.parse(publishDay)-Date.parse(plannedDay))/DAY;
    const publishLocalDay=localCalendar?zonedDay(publishMs,planTimezone):publishDay;
    if(localCalendar?publishLocalDay!==plannedDay:Math.abs(delta)>2)continue;
    const p=source.get(postId);
    if(p&&(p.username!==account.id||identity(p.post_url)?.post!==postId||parseQualifiedInstantMs(p.published_at)!==publishMs))continue;
    if(claims.get(postId)?.size)continue;
    const caption=typeof p?.caption==='string'?p.caption:typeof cap.fields.caption==='string'?cap.fields.caption:'';
    const matchedTitles=[...dramas.values()].filter(d=>titleIn(d.fields.剧名,caption));
    const knownOther=matchedTitles.some(d=>d.record_id!==one(first.剧));
    const exactTitle=titleIn(drama.剧名,caption);
    if(knownOther&&!exactTitle)continue;
    const warnings=[];if(!exactTitle)warnings.push('content_unverified');if(knownOther)warnings.push('title_ambiguous');if(delta&&!localCalendar)warnings.push('date_differs');
    const competing=[];
    for(const [rid,r]of releases){
     const f=r.fields;if(f.批次ID===batchId||f.归档状态!=='active'||f['Post ID']||f.视频链接||f.采集记录?.length||one(f.账号)!==one(first.账号))continue;
     const otherDay=day(f.计划发布时间??f.日期),otherDrama=dramaByRecord.get(one(f.剧));
     const sameWindow=localCalendar&&f.批次ID?otherDay===publishLocalDay:otherDay&&Math.abs(Date.parse(publishDay)-Date.parse(otherDay))<=2*DAY;
     if(sameWindow&&(!exactTitle||!otherDrama||norm(otherDrama.剧名)===norm(drama.剧名)))competing.push(f.批次ID??rid);
    }
    if(competing.length)warnings.push('competing_plans');
    candidates.push({post_id:postId,capture_record_id:cap.record_id,capture_version:captureMatchVersion(cap),source_present:!!p,video_url:ci.url,published_at:cap.fields.发布时间,caption:caption.slice(0,1200),caption_hash:hash(caption),evidence:exactTitle?['title_exact']:[],warnings,competing_batches:[...new Set(competing)]});
   }
  }
  candidates.sort((a,b)=>Date.parse(a.published_at)-Date.parse(b.published_at)||a.post_id.localeCompare(b.post_id));
  const end=windowEnd??Infinity;
  const fresh=freshness.get(account?.id)??0;
  const collectionReady=fresh>=end&&now.getTime()-fresh<=36*3600000&&fresh<=now.getTime()+60000;
  const remaining=slots.length;
  const exclusiveAccountDay=localCalendar&&![...releases.values()].some(r=>r.fields.批次ID!==batchId&&r.fields.归档状态==='active'&&one(r.fields.账号)===one(first.账号)&&day(r.fields.计划发布时间??r.fields.日期)===plannedDay);
  if(candidates.length<remaining&&now.getTime()>=end)reasons.push('count_short');if(candidates.length>remaining&&remaining>0)reasons.push('count_extra');
  for(const c of candidates)reasons.push(...c.warnings);
  if(!collectionReady&&linked<count&&now.getTime()>=end)reasons.push('collection_unverified');
  if(owners.length!==1)reasons.push('owner_missing_or_multiple');
  let state=allArchived?'inactive':reasons.includes('batch_metadata_invalid')||reasons.includes('existing_link_conflict')?'conflict':linked===count?'complete':now.getTime()<end?'scheduled':'needs_confirmation';
  if(state==='needs_confirmation'&&!collectionReady)state='awaiting_collection';
  const notify=now.getTime()>=end&&(state==='conflict'||state==='needs_confirmation'&&(!reasons.includes('count_short')||now.getTime()>=end+waitHours*3600000));
  const proposed=['conflict','complete','inactive'].includes(state)||candidates.length>remaining?[]:candidates.map((c,i)=>({release_id:slots[i].release_id,post_id:c.post_id}));
  const version=hash({batchId,members:members.map(r=>releaseVersion(r)),drama:drama?.剧名??null,planTimezone,localCalendar,windowStart,windowEnd,linkedTimes,candidates:candidates.map(c=>({id:c.post_id,version:c.capture_version,caption:c.caption_hash,competing:c.competing_batches}))});
  rows.push({batch_id:batchId,version,account_id:account?.id??null,account_name:account?.账号名??account?.id??null,drama_id:drama?.id??null,drama_name:text(drama?.剧名),planned_at:planned,planned_day:plannedDay,publication_timezone:planTimezone,local_calendar:!!localCalendar,exclusive_account_day:exclusiveAccountDay,account_day_post_count:accountDayPosts.size,window_start:windowStart===null?null:new Date(windowStart).toISOString(),window_end:windowEnd===null?null:new Date(windowEnd).toISOString(),planned_count:count??null,created_count:members.length,missing_sequences:Number.isInteger(count)&&count>=1&&count<=30?Array.from({length:count},(_,i)=>i+1).filter(i=>!members.some(r=>r.fields.计划序号===i)):[],owner_ids:owners,state,reasons:[...new Set(reasons)].sort(),notify,linked,linked_sequences:linkedSequences,linked_times:linkedTimes,linked_latest_at:Number.isFinite(linkedLatestMs)?new Date(linkedLatestMs).toISOString():null,remaining,slots,candidates,proposed,record_id:members[0].record_id,release_ids:members.map(r=>r.id),collection_as_of:fresh?new Date(fresh).toISOString():null});
 }
 if(key&&!groups.has(key))fail('batch_not_found','Batch was not found');
 return {status:'success',mutations:0,rows:rows.filter(r=>!key||r.batch_id===key).sort((a,b)=>String(a.planned_at).localeCompare(String(b.planned_at))||a.batch_id.localeCompare(b.batch_id))};
}

const requestKeys=(input,keys)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))fail('batch_input_invalid','Unexpected batch request fields');};
export class BatchOpsService {
 constructor({repos,readPosts,readAccounts,jobs,humanOps,now=()=>new Date(),isWriter,isPrivileged=()=>false,canonicalOwner=id=>id,waitHours=24,publicationTimezone='Asia/Shanghai',publicationTimezoneSince=null,publicationTimezones={},excludedPostIds=[]}){
  Object.assign(this,{repos,readPosts,readAccounts,jobs,humanOps,now,isWriter,isPrivileged,canonicalOwner,waitHours,publicationTimezone,publicationTimezoneSince,publicationTimezones,excludedPostIds});
  this.binding=hash(Object.fromEntries(['accounts','dramas','captures','releases'].map(k=>[k,[repos[k].appToken,repos[k].tableId]])));
 }
 query(request={}){return queryReleaseBatches({...request,repos:this.repos,readPosts:this.readPosts,readAccounts:this.readAccounts,now:this.now(),waitHours:this.waitHours,publicationTimezone:this.publicationTimezone,publicationTimezoneSince:this.publicationTimezoneSince,publicationTimezones:this.publicationTimezones,excludedPostIds:this.excludedPostIds});}
 assertActor(actorId,chatId,owners){
  if(typeof actorId!=='string'||typeof chatId!=='string'||!chatId||!this.isWriter(actorId))fail('actor_write_denied','Batch actor is not allowed');
  if(owners&&!owners.includes(this.canonicalOwner(actorId))&&!this.isPrivileged(actorId))fail('batch_owner_required','Only the batch owner or administrator may confirm');
 }
 save(actorId,chatId,envelope){
  const receipt=this.jobs.createPreview({receiptId:`sdp_${randomUUID()}`,actorId,chatId,action:envelope.action,targetTable:'发布记录',targetKey:envelope.batch_id,beforeHash:envelope.version,patch:{...envelope,binding:this.binding},now:this.now()});
  return {status:'preview',receipt_id:receipt.receipt_id,batch_id:envelope.batch_id,expires_at:receipt.expires_at,confirmation_required:true,mutations:0,next_step:'confirm_then_apply_batch'};
 }
 async #resolveScheduleInput(input){
  requestKeys(input,['actorId','chatId','account','drama','plannedAt','count','ownerId','notes']);const {actorId,chatId,account,drama,plannedAt,count,ownerId,notes=''}=input;this.assertActor(actorId,chatId);
  if(!Number.isInteger(count)||count<1||count>30||!day(plannedAt)||typeof notes!=='string'||notes.length>2000)fail('batch_input_invalid','Count must be 1–30 and plan date must be valid');
  const resolve=async(repo,key,field)=>{const ix=await repo.loadIndex();const matches=ix.has(key)?[ix.get(key)]:[...ix.values()].filter(r=>r.fields[field]===key);if(matches.length!==1)fail('batch_reference_ambiguous','Account/drama must resolve uniquely');return matches[0];};
  const accountRow=await resolve(this.repos.accounts,account,'账号名'),dramaRow=await resolve(this.repos.dramas,drama,'剧名');
  const owners=ownerId?[{id:this.canonicalOwner(ownerId)}]:accountRow.fields.负责人;
  if(!Array.isArray(owners)||owners.length!==1||!/^ou_[A-Za-z0-9]+$/.test(owners[0]?.id)||!this.isWriter(owners[0].id))fail('batch_owner_invalid','Choose one authorized Feishu owner in account ledger or pass ownerId');
  return {actorId,chatId,accountRow,dramaRow,plannedAt,count,owners,notes};
 }
 async previewSchedule(input,{direct=false}={}){
  const {actorId,chatId,accountRow,dramaRow,plannedAt,count,owners,notes}=await this.#resolveScheduleInput(input);
  const batchId=`SB-${randomUUID()}`,children=[],plans=[];
  for(let i=1;i<=count;i++){
   const patch={日期:plannedAt,计划发布时间:plannedAt,账号:accountRow.fields.账号ID,剧:dramaRow.fields.剧ID,批次ID:batchId,计划序号:i,批次计划条数:count,处理负责人:owners,备注:notes};
   const p=await this.humanOps.previewMutation({actorId,chatId,table:'发布记录',action:'create',patch});children.push(p.receipt_id);plans.push(p.patch);
  }
  const scheduleKey=hash({binding:this.binding,account:accountRow.record_id,drama:dramaRow.record_id,plannedAt});
  return {...this.save(actorId,chatId,{action:'batch_schedule',batch_id:batchId,version:hash([]),children,...(direct?{direct:true,schedule_key:scheduleKey}:{})}),plans};
 }
 async scheduleDirect(input){
  requestKeys(input,['actorId','chatId','account','drama','plannedAt','count','ownerId','notes']);
  this.assertActor(input.actorId,input.chatId);
  if(this.repos.releases.serverGeneratedIds!==true)fail('batch_direct_requires_generated_ids','Direct scheduling requires the verified Base auto-number release table');
  return withMutationLeaseRetry(this.humanOps,async()=>{
   const resolved=await this.#resolveScheduleInput(input);
   if(resolved.plannedAt!==day(resolved.plannedAt))fail('batch_input_invalid','Direct schedule requires a valid calendar date');
   const timezone=this.publicationTimezoneSince&&resolved.plannedAt>=this.publicationTimezoneSince?(Object.hasOwn(this.publicationTimezones,resolved.accountRow.fields.账号ID)?this.publicationTimezones[resolved.accountRow.fields.账号ID]:this.publicationTimezone):'Asia/Shanghai';
   const today=zonedDay(this.now().getTime(),timezone);
   if(resolved.plannedAt<today)fail('batch_schedule_past_date','Direct scheduling requires today or a future publication-calendar date');
   const existing=inspectScheduleCollision(await this.repos.releases.loadIndex(),{
    accountRecordId:resolved.accountRow.record_id,dramaRecordId:resolved.dramaRow.record_id,
    plannedAt:resolved.plannedAt,count:resolved.count,ownerId:resolved.owners[0].id,notes:resolved.notes,
   });
   if(existing.status==='already_scheduled')return existing;
   const scheduleKey=hash({binding:this.binding,account:resolved.accountRow.record_id,drama:resolved.dramaRow.record_id,plannedAt:resolved.plannedAt});
   const prior=this.jobs.findConsumedDirectSchedule(scheduleKey);
   if(prior.length)fail('batch_schedule_prior_attempt','A previous direct write may have reached Base; inspect its batch before trying again',{
    planned_at:resolved.plannedAt,batch_ids:prior.map(receipt=>receipt.target_key),receipt_ids:prior.map(receipt=>receipt.receipt_id),
   });
   const preview=await this.previewSchedule(input,{direct:true});
   const result=await this.applyLocked({actorId:input.actorId,chatId:input.chatId,receiptId:preview.receipt_id});
   return {...result,planned_at:resolved.plannedAt,count:resolved.count};
  });
 }
 async previewMatch(input){
  requestKeys(input,['actorId','chatId','batchId','postIds']);const {actorId,chatId,batchId,postIds}=input;
  if(typeof batchId!=='string'||!batchId)fail('batch_input_invalid','Batch ID required');
  const batch=(await this.query({key:batchId})).rows[0];this.assertActor(actorId,chatId,batch.owner_ids);
  if(['conflict','inactive','complete'].includes(batch.state))fail('batch_not_reviewable','Batch is not available for confirmation');
  let selected;
  if(postIds!==undefined){
   if(!Array.isArray(postIds)||!postIds.length||postIds.length>batch.remaining||new Set(postIds).size!==postIds.length||postIds.some(id=>typeof id!=='string'||!batch.candidates.some(c=>c.post_id===id)))fail('batch_selection_invalid','Select unique available candidate posts, at most the remaining slots');
   selected=batch.candidates.filter(c=>postIds.includes(c.post_id));
  }else{
   if(!batch.proposed.length)fail('batch_selection_required','Select candidate posts explicitly');
   selected=batch.candidates;
  }
  const children=[],proposed=[];
  for(let i=0;i<selected.length;i++){
   const slot=batch.slots[i],c=selected[i];
   const p=await this.humanOps.previewCaptureMatch({actorId,chatId,key:slot.release_id,postId:c.post_id,expectedCaptureVersion:c.capture_version});children.push(p.receipt_id);proposed.push({release_id:slot.release_id,post_id:c.post_id,video_url:c.video_url,published_at:c.published_at});
  }
  if((await this.query({key:batchId})).rows[0].version!==batch.version)fail('preview_stale','Batch changed during preview');
  return {...this.save(actorId,chatId,{action:'batch_match',batch_id:batchId,version:batch.version,children,owners:batch.owner_ids}),batch,proposed};
 }
 async matchDirect(input){
  requestKeys(input,['actorId','chatId','batchId','postIds']);
  this.assertActor(input.actorId,input.chatId);
  if(!Array.isArray(input.postIds)||!input.postIds.length)fail('batch_selection_required','Select exact Post IDs before direct matching');
  return withMutationLeaseRetry(this.humanOps,async()=>{
   const preview=await this.previewMatch(input);
   return this.applyLocked({actorId:input.actorId,chatId:input.chatId,receiptId:preview.receipt_id});
  });
 }
 async apply(input){
  return this.humanOps.withMutationLock(() => this.applyLocked(input));
 }
 async applyLocked(input){
  requestKeys(input,['actorId','chatId','receiptId']);const {actorId,chatId,receiptId}=input;this.assertActor(actorId,chatId);
  const receipt=this.jobs.getPreview(receiptId);if(!receipt)fail('preview_not_found','Batch preview missing');
  if(receipt.actor_id!==actorId)fail('preview_actor_mismatch','Actor changed');if(receipt.chat_id!==chatId)fail('preview_chat_mismatch','Chat changed');if(receipt.used_at)fail('preview_used','Batch preview already used');
  if(Date.parse(receipt.expires_at)<=this.now().getTime())fail('preview_expired','Batch preview expired');
  const e=receipt.patch;
  if(e.binding!==this.binding||!['batch_schedule','batch_match'].includes(e.action)||receipt.action!==e.action||receipt.target_key!==e.batch_id||!Array.isArray(e.children)||e.children.length<1||e.children.length>30||new Set(e.children).size!==e.children.length)fail('preview_payload_invalid','Batch receipt invalid');
  let version;
  if(e.action==='batch_match'){const b=(await this.query({key:e.batch_id})).rows[0];this.assertActor(actorId,chatId,b.owner_ids);version=b.version;}
  else {const idx=await this.repos.releases.loadIndex();version=hash([...idx.values()].filter(r=>r.fields.批次ID===e.batch_id).map(r=>releaseVersion(r)));}
  if(version!==e.version)fail('preview_stale','Batch changed; refresh preview');
  for(const id of e.children){const child=this.jobs.getPreview(id);if(!child||child.actor_id!==actorId||child.chat_id!==chatId||child.used_at||Date.parse(child.expires_at)<=this.now().getTime())fail('preview_stale','Child preview changed or expired');}
  let directSchedule=null;
  if(e.action==='batch_schedule'&&e.direct===true){
   const patch=this.jobs.getPreview(e.children[0])?.patch?.targets?.[0]?.patch;
   if(!patch||!one(patch.账号)||!one(patch.剧)||!day(patch.计划发布时间)||ownerIds(patch).length!==1)fail('preview_payload_invalid','Direct schedule identity is missing');
   directSchedule={
    accountRecordId:one(patch.账号),dramaRecordId:one(patch.剧),plannedAt:day(patch.计划发布时间),
    count:e.children.length,ownerId:ownerIds(patch)[0],notes:patch.备注??'',
   };
   requireAbsentSchedule(await this.repos.releases.loadIndex(),directSchedule);
  }
  if(e.action==='batch_schedule' && this.repos.releases.serverGeneratedIds){
   try {
    const result=await this.humanOps.applyGeneratedCreateBatch({actorId,chatId,receiptIds:e.children,parentReceipt:{receiptId,beforeHash:version,batchId:e.batch_id,
     ...(directSchedule?{verifyBeforeWrite:before=>requireAbsentSchedule(before,directSchedule)}:{})}});
    this.jobs.appendAudit({actorId,action:e.action,targetTable:'发布记录',targetKey:e.batch_id,before:{receipt_id:receiptId},after:{completed:result.completed},readback:{status:'verified'},now:this.now()});
    return {status:'success',batch_id:e.batch_id,completed:result.completed,readback:'verified',next_step:'none'};
   } catch(error) {
    // A read-only failure has not used any confirmation; the same receipt can retry while valid.
    if(!this.jobs.getPreview(receiptId).used_at){
     error.details={...(error.details??{}),receipt_consumed:false};throw error;
    }
    const completed=(error.details?.verified_records??[]).sort((a,b)=>a.index-b.index).map(r=>r.key);
    return this.partialResult({error,actorId,receiptId,batchId:e.batch_id,completed,failedReceipt:null});
   }
  }
  this.jobs.consumePreview(receiptId,{actorId,chatId,beforeHash:version,now:this.now()});
  const completed=[];
  for(const child of e.children){
   try{
    const result=await this.humanOps.applyPreview({actorId,chatId,receiptId:child});
    if(result.readback!=='verified'||e.action==='batch_match'&&result.capture_linked!==true)fail('readback_mismatch','Batch item lacks verified readback');
    completed.push(result.record_id);
   }catch(error){
    return this.partialResult({error,actorId,receiptId,batchId:e.batch_id,completed,failedReceipt:child});
   }
  }
  this.jobs.appendAudit({actorId,action:e.action,targetTable:'发布记录',targetKey:e.batch_id,before:{receipt_id:receiptId},after:{completed},readback:{status:'verified'},now:this.now()});
  return {status:'success',batch_id:e.batch_id,completed,readback:'verified',next_step:'none'};
 }
 partialResult({error,actorId,receiptId,batchId,completed,failedReceipt}) {
  const causeDetails=Object.fromEntries(['table','field','record_id','phase','pagination_metadata_key'].filter(k=>typeof error.details?.[k]==='string').map(k=>[k,error.details[k]]));
  if(typeof error.details?.write_attempted==='boolean')causeDetails.write_attempted=error.details.write_attempted;
  if(Array.isArray(error.details?.record_ids))causeDetails.record_ids=error.details.record_ids;
  if(Array.isArray(error.details?.verified_records))causeDetails.verified_records=error.details.verified_records;
  const causeMessage=error instanceof ShortDramaError?error.message.slice(0,500):'Unexpected internal error';
  this.jobs.appendAudit({actorId,action:'batch-partial',targetTable:'发布记录',targetKey:batchId,before:{receipt_id:receiptId},after:{completed,failed_receipt:failedReceipt},readback:{cause_code:error.code??'internal_error',cause_details:causeDetails,cause_message:causeMessage},now:this.now()});
  return {status:'partial',batch_id:batchId,receipt_id:receiptId,completed,receipt_consumed:true,error:{code:'batch_apply_partial',cause_code:error.code??'internal_error',cause_details:causeDetails,cause_message:causeMessage},next_step:'inspect_before_retry'};
 }

}

/** Conservative opt-in gate. A verified linked prefix and a complete plan window keep assignment order stable. */
export function isHighConfidenceBatch(batch,{countOnlySince=null}={}) {
 if(!batch || !batch.batch_id || batch.state!=='needs_confirmation' || !batch.notify ||
  batch.owner_ids.length!==1 ||
  batch.remaining<1 || batch.remaining+batch.linked!==batch.planned_count ||
  batch.candidates.length!==batch.remaining || batch.proposed.length!==batch.remaining ||
  new Set(batch.candidates.map(c=>c.post_id)).size!==batch.remaining ||
  !Array.isArray(batch.linked_sequences) || batch.linked_sequences.length!==batch.linked ||
  batch.linked_sequences.some((sequence,i)=>sequence!==i+1))return false;
 const plannedStart=Date.parse(batch.window_start??`${batch.planned_day}T00:00:00+08:00`);
 const linkedLatest=batch.linked?parseQualifiedInstantMs(batch.linked_latest_at):null;
 if(!Number.isFinite(plannedStart) || batch.linked && linkedLatest===null)return false;
 const latestAllowed=batch.local_calendar?Date.parse(batch.window_end):plannedStart+DAY+12*3600000;
 if(batch.local_calendar&&(batch.linked_times?.length!==batch.linked||batch.linked_times.some((ms,i)=>!Number.isFinite(ms)||ms<plannedStart||ms>=latestAllowed||i>0&&ms<=batch.linked_times[i-1])))return false;
 const exactTitle=batch.reasons.every(r=>r==='date_differs')&&norm(batch.drama_name).length>=8&&batch.candidates.every(c=>c.evidence?.includes('title_exact')&&c.warnings.every(w=>w==='date_differs'));
 const countOnly=!!countOnlySince&&batch.local_calendar&&batch.planned_day>=countOnlySince&&batch.exclusive_account_day===true&&
  batch.account_day_post_count===batch.planned_count&&batch.reasons.every(r=>r==='content_unverified')&&
  batch.candidates.every(c=>c.source_present===true&&c.warnings.every(w=>w==='content_unverified'));
 if(!exactTitle&&!countOnly)return false;
 let previous=linkedLatest??plannedStart;
 for(const candidate of batch.candidates){
  const published=parseQualifiedInstantMs(candidate.published_at);
  if(published===null || published<plannedStart || (batch.local_calendar?published>=latestAllowed:published>latestAllowed) || published<=previous ||
   candidate.competing_batches.length!==0)return false;
  previous=published;
 }
 return true;
}
