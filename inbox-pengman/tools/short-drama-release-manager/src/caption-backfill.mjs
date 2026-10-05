import {createHash,randomUUID} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {canonicalCapturePostUrl, captureMatchVersion} from './match-candidates.mjs';
import {parseQualifiedInstantMs} from './qualified-iso.mjs';
import {zonedDay,zonedDayStart} from './zoned-day.mjs';
import {baseBinding} from './human-ops.mjs';
import {ensureCaptionDramas} from './caption-pool.mjs';
import {buildPromotionIndex,resolveCaptionDrama} from './caption-recognition.mjs';
import {ShortDramaError} from './errors.mjs';
import {validateExcludedPostIds} from './capture-policy.mjs';

const DAY=86_400_000;
const one=value=>Array.isArray(value)&&value.length===1&&typeof value[0]?.id==='string'?value[0].id:null;
export function captionRepositories({full,worker}){
 if(full?.captures?.writableOnly===true||worker?.releases?.writableOnly!==true||
    worker?.accounts?.writableOnly!==true||worker?.dramas?.writableOnly!==true||
    !full?.captures||!worker?.releases)throw new ShortDramaError('caption_projection_invalid','Full capture relation and writable release projections are required');
 return {appToken:worker.appToken,accounts:worker.accounts,dramas:worker.dramas,captures:full.captures,releases:worker.releases};
}
const norm=value=>typeof value==='string'?value.normalize('NFKC').toLowerCase().replace(/[’']/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim():'';
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const releaseVersion=fields=>digest(Object.fromEntries([
 '发布ID','账号','剧','日期','计划发布时间','批次ID','计划序号','批次计划条数','归档状态','备注','Post ID','视频链接','采集记录',
].map(name=>[name,fields[name]??null])));
const part=value=>{
 const found=[...String(value??'').matchAll(/\bpart\s*(\d+)\b|第\s*(\d+)\s*条/gi)].map(match=>Number(match[1]??match[2]));
 return found.length&&new Set(found).size===1?found[0]:null;
};
function planDay(value){
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const ms=parseQualifiedInstantMs(value);
 return ms===null?null:zonedDay(ms,'Asia/Shanghai');
}
function titleIn(title,caption){
 const target=norm(title),text=norm(caption);
 if(!target||!text)return false;
 const hasHan=/\p{Script=Han}/u.test(target);
 if(hasHan?target.length<4:target.length<8)return false;
 return hasHan?text.includes(target):` ${text} `.includes(` ${target} `);
}
function postIdFromUrl(value){
 const canonical=canonicalCapturePostUrl(value);
 return canonical?canonical.match(/\/(?:video|photo)\/(\d+)$/)?.[1]??null:null;
}
function resolveTimezone(published,accountId,{publicationTimezone,publicationTimezoneSince,publicationTimezones}){
 if(!publicationTimezoneSince)return 'Asia/Shanghai';
 const zone=publicationTimezones?.[accountId]??publicationTimezone;
 const rolloutStart=zonedDayStart(publicationTimezoneSince,zone);
 return published>=rolloutStart?zone:'Asia/Shanghai';
}
function releaseDay(record){return planDay(record.fields.计划发布时间??record.fields.日期);}
function emptyRelease(record){const f=record.fields;return f.归档状态==='active'&&!f['Post ID']&&!f.视频链接&&!(f.采集记录?.length);}

/** Read-only deterministic plan from complete Base indexes and the latest captured posts. */
export function planCaptionBackfill({accounts,dramas,captures,releases,posts,cutoff,publicationTimezone='Asia/Shanghai',publicationTimezoneSince=null,publicationTimezones={},allowUnknownDrama=false,leadReviewOnly=false,recognizeDramas=false,verifiedCodes=[],candidatePostIds=null,partialLinkPostIds=[],timeOrderTargets=[]}){
 if([accounts,dramas,captures,releases].some(index=>!(index instanceof Map))||!Array.isArray(posts)||!Number.isFinite(Date.parse(cutoff)))throw Error('Complete indexes, posts, and cutoff required');
 if(candidatePostIds!==null&&(!Array.isArray(candidatePostIds)||new Set(candidatePostIds).size!==candidatePostIds.length||candidatePostIds.some(id=>typeof id!=='string'||!/^\d+$/.test(id))))throw Error('Candidate Post IDs must be unique numeric strings');
 const scoped=candidatePostIds===null?null:new Set(candidatePostIds);
 const partialAllowed=new Set(partialLinkPostIds);
 const accountByRecord=new Map([...accounts].map(([id,row])=>[row.record_id,{id,row}]));
 const dramaByRecord=new Map([...dramas].map(([id,row])=>[row.record_id,{id,row}]));
 const captureByRecord=new Map([...captures].map(([id,row])=>[row.record_id,id]));
 const releaseByRecord=new Map([...releases].map(([id,row])=>[row.record_id,{id,row}]));
 const source=new Map();for(const post of posts){if(typeof post?.post_id!=='string'||source.has(post.post_id))throw Error('Latest source Post IDs must be unique strings');source.set(post.post_id,post);}
 const claims=new Map();
 for(const [id,row] of releases){
  const f=row.fields,ids=new Set([f['Post ID'],postIdFromUrl(f.视频链接),...(f.采集记录??[]).map(link=>captureByRecord.get(link.id))].filter(Boolean));
  for(const postId of ids){if(!claims.has(postId))claims.set(postId,[]);claims.get(postId).push({id,row,identityConflict:ids.size!==1});}
 }
 const actions=[],held=[],groups=new Map(),poolCandidates=[];
 const promotionIndex=recognizeDramas?buildPromotionIndex({dramas,captures,releases,verifiedCodes}):null;
 const isEmpty=row=>emptyRelease(row)||(recognizeDramas&&!row.fields.归档状态&&!row.fields['Post ID']&&!row.fields.视频链接&&!row.fields.采集记录?.length);
 const hold=(postId,reason)=>held.push({post_id:postId,reason});
 for(const [postId,capture] of captures){
  if(scoped&&!scoped.has(postId))continue;
  const f=capture.fields,reverse=f.关联发布记录;
  if(reverse!==undefined&&reverse!==null&&!Array.isArray(reverse)){hold(postId,'capture_relation_invalid');continue;}
  if(reverse?.length){
   const linked=reverse.length===1?releaseByRecord.get(reverse[0]?.id):null;
   if(!recognizeDramas||!partialAllowed.has(postId)||!linked||one(linked.row.fields.采集记录)!==capture.record_id||
      linked.row.fields['Post ID']&&linked.row.fields.视频链接)continue;
  }
  if(f.业务!=='short-drama'){hold(postId,'business_mismatch');continue;}
  const account=accountByRecord.get(one(f.账号)),post=source.get(postId);
  if(account&&account.row.fields.表现形式!=='AI真人剧'){hold(postId,'account_not_drama');continue;}
  const url=canonicalCapturePostUrl(f.视频链接),published=parseQualifiedInstantMs(f.发布时间);
  if(!account||!post||!url||postIdFromUrl(url)!==postId||new URL(url).pathname.split('/')[1]!==`@${account.id}`||
     post.username!==account.id||canonicalCapturePostUrl(post.post_url)!==url||parseQualifiedInstantMs(post.published_at)!==published||published===null&&!recognizeDramas){hold(postId,'capture_identity_conflict');continue;}
  if(published>Date.parse(cutoff))continue;
  const caption=typeof f.Caption==='string'&&f.Caption.trim()?f.Caption:post.caption??'';
  if(typeof caption!=='string'||typeof f.Caption==='string'&&f.Caption.trim()&&norm(f.Caption)!==norm(post.caption)){hold(postId,'caption_unavailable_or_changed');continue;}
  if(leadReviewOnly){
   const leading=caption.trimStart();
   if(!leading||leading.startsWith('#')||/^part/i.test(leading))continue;
   if(claims.has(postId)){hold(postId,'post_already_claimed');continue;}
   const timezone=resolveTimezone(published,account.id,{publicationTimezone,publicationTimezoneSince,publicationTimezones});
   const publicationDay=published===null?null:zonedDay(published,timezone);
   if([...releases.values()].some(row=>isEmpty(row)&&one(row.fields.账号)===account.row.record_id&&releaseDay(row)===publicationDay)){
    hold(postId,'unresolved_release_plan');continue;
   }
   const owners=Array.isArray(account.row.fields.负责人)?[...new Set(account.row.fields.负责人.map(value=>value?.id).filter(value=>typeof value==='string'&&/^ou_/.test(value)))]:[];
   actions.push({post_id:postId,capture_record_id:capture.record_id,capture_version:captureMatchVersion(capture),caption_sha256:digest(norm(caption)),account_id:account.id,account_record_id:account.row.record_id,
    drama_id:null,drama_record_id:null,review_reason:'剧名待人工匹配',publication_day:publicationDay,published_at:f.发布时间,video_url:url,part:null,
    owner_id:owners.length===1?owners[0]:null,kind:'create',release_id:null,release_record_id:null,release_version:null});
   continue;
  }
  const exactClaims=claims.get(postId)??[];
  const resolution=recognizeDramas?resolveCaptionDrama({caption,dramas,promotionIndex,preferredDramaRecordId:exactClaims.length===1?one(exactClaims[0].row.fields.剧):null}):null;
  if(resolution?.status==='new'&&!(exactClaims.length===1&&one(exactClaims[0].row.fields.剧))){
   if(exactClaims.length>1||exactClaims.some(c=>c.identityConflict)){hold(postId,'post_claim_conflict');continue;}
   poolCandidates.push({post_id:postId,capture_record_id:capture.record_id,capture_version:captureMatchVersion(capture),account_id:account.id,title:resolution.title,platform:resolution.platform,evidence:resolution.evidence,caption_sha256:digest(caption)});continue;
  }
  const titles=recognizeDramas?(resolution.status==='matched'?[[resolution.drama_id,dramas.get(resolution.drama_id)]]:[]):[...dramas].filter(([,row])=>titleIn(row.fields.剧名,caption));
  if(titles.length!==1&&!allowUnknownDrama){hold(postId,titles.length?'drama_title_ambiguous':'drama_title_unmatched');continue;}
  const [dramaId,drama]=titles.length===1?titles[0]:[null,null];
  if(drama?.fields.归档状态==='archived'){hold(postId,'drama_archived');continue;}
  const reviewReason=drama?null:recognizeDramas?resolution.reason??'drama_title_conflict':!caption.trim()?'caption_unavailable':titles.length?'drama_title_ambiguous':'drama_title_unmatched';
  const timezone=resolveTimezone(published,account.id,{publicationTimezone,publicationTimezoneSince,publicationTimezones});
  const publicationDay=published===null?null:zonedDay(published,timezone);
  const candidate={post_id:postId,capture_record_id:capture.record_id,capture_version:captureMatchVersion(capture),caption_sha256:digest(norm(caption)),account_id:account.id,account_record_id:account.row.record_id,drama_id:dramaId,drama_record_id:drama?.record_id??null,review_reason:reviewReason,publication_day:publicationDay,published_at:f.发布时间,video_url:url,part:part(caption),...(recognizeDramas?{owner_id:one(account.row.fields.负责人),recognized_title:resolution.title,recognition_evidence:resolution.evidence,pending_timestamp:published===null}: {})};
  const owners=claims.get(postId)??[];
  if(owners.length>1||owners.some(owner=>owner.identityConflict)){hold(postId,'post_claim_conflict');continue;}
  if(owners.length===1){
   const owner=owners[0],rf=owner.row.fields;
   if(recognizeDramas&&candidate.drama_record_id&&one(rf.剧)&&one(rf.剧)!==candidate.drama_record_id){candidate.review_reason='drama_title_conflict';candidate.drama_record_id=one(rf.剧);candidate.drama_id=dramaByRecord.get(candidate.drama_record_id)?.id??null;}
  if(candidate.drama_record_id===null&&one(rf.剧)){candidate.drama_record_id=one(rf.剧);candidate.drama_id=dramaByRecord.get(candidate.drama_record_id)?.id??null;candidate.review_reason=recognizeDramas&&resolution.title?'drama_title_conflict':null;}
   const sameReverse=one(rf.采集记录)===capture.record_id&&one(reverse)===owner.row.record_id;
   if(one(rf.账号)!==candidate.account_record_id||(one(rf.剧)!==candidate.drama_record_id&&!(recognizeDramas&&!one(rf.剧)))||(rf.归档状态!=='active'&&!(recognizeDramas&&!rf.归档状态))||
      rf.采集记录?.length&&!sameReverse){hold(postId,'claimed_release_conflict');continue;}
   actions.push({...candidate,kind:'attach',release_id:owner.id,release_record_id:owner.row.record_id,release_version:releaseVersion(rf)});
   continue;
  }
  const key=`${candidate.account_record_id}:${candidate.drama_record_id}:${publicationDay}`;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(candidate);
 }
 for(const group of groups.values()){
  group.sort((a,b)=>parseQualifiedInstantMs(a.published_at)-parseQualifiedInstantMs(b.published_at)||a.post_id.localeCompare(b.post_id));
  const first=group[0],day=first.publication_day;
  const timeOrder=recognizeDramas&&timeOrderTargets.some(target=>target.accountId===first.account_id&&target.dramaId===first.drama_id);
  const rows=[...releases].filter(([,row])=>(!recognizeDramas||day!==null)&&one(row.fields.账号)===first.account_record_id&&one(row.fields.剧)===first.drama_record_id&&releaseDay(row)===day);
  const unresolvedPlan=[...releases.values()].some(row=>isEmpty(row)&&one(row.fields.账号)===first.account_record_id&&
   (first.drama_record_id===null?!!one(row.fields.剧):!one(row.fields.剧))&&releaseDay(row)===day);
  if(unresolvedPlan||rows.some(([,row])=>row.fields.归档状态==='archived'||/未发布|取消|暂停|待制作|待验收|未验收/.test(String(row.fields.备注??'')))){
   for(const post of group)hold(post.post_id,first.drama_record_id===null?'unresolved_release_plan':'planned_release_conflict');continue;
  }
  const empty=rows.filter(([,row])=>isEmpty(row));
  const batchIds=new Set(empty.map(([,row])=>row.fields.批次ID).filter(Boolean));
  if(batchIds.size>1){for(const post of group)hold(post.post_id,'multiple_release_batches');continue;}
  if(recognizeDramas&&empty.length&&batchIds.size===1){
   const batchId=[...batchIds][0];
   const members=[...releases.values()].filter(row=>row.fields.批次ID===batchId);
   const linked=members.filter(row=>!isEmpty(row)).sort((a,b)=>(a.fields.计划序号??Infinity)-(b.fields.计划序号??Infinity));
   const linkedTimes=linked.map(row=>{
    const capture=[...captures.values()].find(c=>c.record_id===one(row.fields.采集记录));
    return parseQualifiedInstantMs(capture?.fields.发布时间??source.get(row.fields['Post ID'])?.published_at);
   });
   const lastSequence=Math.max(0,...linked.map(row=>row.fields.计划序号??0));
   if((timeOrder?linked.some((row,i)=>!Number.isInteger(row.fields.计划序号)||i>0&&row.fields.计划序号<=linked[i-1].fields.计划序号):
      linked.some((row,i)=>row.fields.计划序号!==i+1))||
      linkedTimes.some((t,i)=>t===null||i>0&&t<=linkedTimes[i-1])||
      timeOrder&&empty.some(([,row])=>row.fields.批次ID===batchId&&Number.isInteger(row.fields.计划序号)&&row.fields.计划序号<=lastSequence)||
      linkedTimes.length&&group.some(post=>parseQualifiedInstantMs(post.published_at)<=Math.max(...linkedTimes))){
    for(const post of group)hold(post.post_id,'linked_order_conflict');continue;
   }
  }

  if(!empty.length&&!recognizeDramas){
   const nearby=[...releases].filter(([,row])=>isEmpty(row)&&one(row.fields.账号)===first.account_record_id&&one(row.fields.剧)===first.drama_record_id&&
    releaseDay(row)&&Math.abs(Date.parse(releaseDay(row))-Date.parse(day))<=2*DAY);
   if(nearby.length===1&&group.length===1)empty.push(nearby[0]);
   else if(nearby.length){for(const post of group)hold(post.post_id,'nearby_release_needs_review');continue;}
  }
  if(!recognizeDramas&&group.length<empty.length){for(const post of group)hold(post.post_id,'planned_slots_exceed_posts');continue;}
  const numbered=group.filter(post=>post.part!==null);
  if(!timeOrder&&empty.length&&numbered.length){
   const numbers=new Set(numbered.map(post=>post.part));
   const used=new Set(),unresolved=[];
   let conflict=numbers.size!==numbered.length;
   for(const post of numbered){
    const matches=empty.filter(([,row])=>(row.fields.计划序号??part(row.fields.备注))===post.part);
    if(matches.length>1)conflict=true;
    else if(matches.length===1){if(used.has(matches[0][0]))conflict=true;used.add(matches[0][0]);}
    else unresolved.push(post);
   }
   if(unresolved.length){
    const left=empty.filter(([id])=>!used.has(id));
    if(unresolved.length!==1||left.length!==1||group.length!==empty.length||
       (left[0][1].fields.计划序号??part(left[0][1].fields.备注))!==null)conflict=true;
   }
   if(conflict){for(const post of group)hold(post.post_id,'part_slot_conflict');continue;}
  }
  empty.sort((a,b)=>(a[1].fields.计划序号??part(a[1].fields.备注)??Infinity)-(b[1].fields.计划序号??part(b[1].fields.备注)??Infinity)||a[0].localeCompare(b[0]));
  const remainingPosts=[...group],remainingRows=[...empty],chosen=[];
  for(const post of [...remainingPosts])if(post.part!==null){
   const matches=remainingRows.filter(([,row])=>(row.fields.计划序号??part(row.fields.备注))===post.part);
   if(matches.length!==1)continue;
   const selected=matches[0];chosen.push([post,selected]);remainingPosts.splice(remainingPosts.indexOf(post),1);remainingRows.splice(remainingRows.indexOf(selected),1);
  }
  for(let i=0;i<Math.min(remainingRows.length,remainingPosts.length);i++)chosen.push([remainingPosts[i],remainingRows[i]]);
  for(const [post,[releaseId,row]] of chosen)actions.push({...post,kind:'attach',release_id:releaseId,release_record_id:row.record_id,release_version:releaseVersion(row.fields)});
  for(const post of remainingPosts.slice(remainingRows.length))actions.push({...post,kind:'create',release_id:null,release_record_id:null,release_version:null});
 }
 actions.sort((a,b)=>parseQualifiedInstantMs(a.published_at)-parseQualifiedInstantMs(b.published_at)||a.post_id.localeCompare(b.post_id));
 held.sort((a,b)=>a.post_id.localeCompare(b.post_id));
 return {status:'planned',cutoff,lead_review_only:leadReviewOnly,...(recognizeDramas?{recognition_mode:true,pool_candidates:poolCandidates}:{}),...(scoped?{scope_post_ids:[...scoped].sort()}:{}),actions,held,
  digest:digest({cutoff,leadReviewOnly,actions,...(recognizeDramas?{recognition_mode:true,poolCandidates}:{}),...(scoped?{candidatePostIds:[...scoped].sort()}: {})}),
  counts:{attach:actions.filter(a=>a.kind==='attach').length,create:actions.filter(a=>a.kind==='create').length,held:held.length}};
}

export async function stageCaptionBackfillPlan({jobs,repos,readPosts,requestId,mode,cutoff,publicationTimezone,publicationTimezoneSince,publicationTimezones={},allowUnknownDrama=false,leadReviewOnly=false,recognizeDramas=false,verifiedCodes=[],candidatePostIds=null,partialLinkPostIds=[],timeOrderTargets=[]}){
 if(mode!=='plan'||!/^caption-[a-z0-9-]{4,50}$/.test(requestId??''))throw Error('A bounded plan-only caption backfill request is required');
 if(repos.captures.writableOnly===true)throw new ShortDramaError('caption_projection_invalid','Capture reverse relation requires a full Base read');
 jobs.db.exec(`CREATE TABLE IF NOT EXISTS caption_backfill_runs (
  request_id TEXT PRIMARY KEY, state TEXT NOT NULL, plan_digest TEXT NOT NULL,
  plan_json TEXT NOT NULL, completed_json TEXT NOT NULL, updated_at TEXT NOT NULL, error_code TEXT)`);
 const previous=jobs.db.prepare('SELECT state,plan_json FROM caption_backfill_runs WHERE request_id=?').get(requestId);
 if(previous&&previous.state!=='planned'){
  const plan=JSON.parse(previous.plan_json);
  const [captures,releases]=await Promise.all([repos.captures.loadIndex(),repos.releases.loadIndex()]);
  const inspection=plan.actions.map(action=>{
   const capture=captures.get(action.post_id),reverse=capture?.fields.关联发布记录??[];
   const owners=[...releases].filter(([,release])=>release.fields['Post ID']===action.post_id||
    postIdFromUrl(release.fields.视频链接)===action.post_id||(release.fields.采集记录??[]).some(link=>link.id===action.capture_record_id));
   const owner=owners.length===1?owners[0]:null;
   const f=owner?.[1].fields;
   const confirmed=owner&&f['Post ID']===action.post_id&&canonicalCapturePostUrl(f.视频链接)===action.video_url&&
    one(f.采集记录)===action.capture_record_id&&one(f.账号)===action.account_record_id&&one(f.剧)===action.drama_record_id&&
    Array.isArray(reverse)&&reverse.some(link=>link.id===owner[1].record_id);
   const state=owners.length>1||reverse.length&&!owner?'conflict':confirmed?'confirmed':owner?'partial':'absent';
   return {post_id:action.post_id,planned_kind:action.kind,state,release_id:owner?.[0]??null,
    release_record_id:owner?.[1].record_id??null,capture_reverse_ids:Array.isArray(reverse)?reverse.map(link=>link.id):[],
    release_capture_ids:Array.isArray(f?.采集记录)?f.采集记录.map(link=>link.id):[],
    post_id_matches:f?.['Post ID']===action.post_id,url_matches:canonicalCapturePostUrl(f?.视频链接)===action.video_url,
    account_matches:one(f?.账号)===action.account_record_id,drama_matches:one(f?.剧)===action.drama_record_id,
    date_matches:planDay(f?.日期)===action.publication_day,archive_status:f?.归档状态??null,
    match_method:f?.匹配方式??null,pending_reason:f?.待处理原因??null};
  });
  jobs.db.exec('CREATE TABLE IF NOT EXISTS caption_backfill_inspections (request_id TEXT PRIMARY KEY, inspected_at TEXT NOT NULL, inspection_json TEXT NOT NULL)');
  jobs.db.prepare('INSERT INTO caption_backfill_inspections(request_id,inspected_at,inspection_json) VALUES(?,?,?) ON CONFLICT(request_id) DO UPDATE SET inspected_at=excluded.inspected_at,inspection_json=excluded.inspection_json').run(requestId,new Date().toISOString(),JSON.stringify(inspection));
  return {status:'held',reason:'prior_attempt_requires_review',inspection};
 }
 const [accounts,dramas,captures,releases,posts]=await Promise.all([
  repos.accounts.loadIndex(),repos.dramas.loadIndex(),repos.captures.loadIndex(),repos.releases.loadIndex(),readPosts(),
 ]);
 const plan=planCaptionBackfill({accounts,dramas,captures,releases,posts,cutoff,publicationTimezone,publicationTimezoneSince,publicationTimezones,allowUnknownDrama,leadReviewOnly,recognizeDramas,verifiedCodes,candidatePostIds,partialLinkPostIds,timeOrderTargets});
 const unique=(items,key)=>[...new Map(items.filter(Boolean).map(item=>[key(item),item])).values()].map(item=>structuredClone(item));
 plan.before={
  accounts:unique(plan.actions.map(action=>accounts.get(action.account_id)),row=>row.record_id),
  dramas:unique(plan.actions.map(action=>dramas.get(action.drama_id)),row=>row.record_id),
  captures:unique(plan.actions.map(action=>captures.get(action.post_id)),row=>row.record_id),
  releases:unique(plan.actions.filter(action=>action.release_id).map(action=>releases.get(action.release_id)),row=>row.record_id),
 };
 jobs.db.prepare(`INSERT INTO caption_backfill_runs(request_id,state,plan_digest,plan_json,completed_json,updated_at)
  VALUES(?,'planned',?,?,'[]',?) ON CONFLICT(request_id) DO UPDATE SET
  state='planned',plan_digest=excluded.plan_digest,plan_json=excluded.plan_json,completed_json='[]',updated_at=excluded.updated_at,error_code=NULL`).run(requestId,plan.digest,JSON.stringify(plan),new Date().toISOString());
 return {status:'planned',request_id:requestId,digest:plan.digest,counts:plan.counts,held_reasons:Object.fromEntries([...new Set(plan.held.map(item=>item.reason))].map(reason=>[reason,plan.held.filter(item=>item.reason===reason).length]))};
}

const fail=(code,message)=>{throw new ShortDramaError(code,message);};
async function currentPlan({repos,readPosts,cutoff,publicationTimezone,publicationTimezoneSince,publicationTimezones,allowUnknownDrama,leadReviewOnly,recognizeDramas,verifiedCodes,candidatePostIds,partialLinkPostIds=[],timeOrderTargets=[]}){
 const [accounts,dramas,captures,releases,posts]=await Promise.all([
  repos.accounts.loadIndex(),repos.dramas.loadIndex(),repos.captures.loadIndex(),repos.releases.loadIndex(),readPosts(),
 ]);
 return planCaptionBackfill({accounts,dramas,captures,releases,posts,cutoff,publicationTimezone,publicationTimezoneSince,publicationTimezones,allowUnknownDrama,leadReviewOnly,recognizeDramas,verifiedCodes,candidatePostIds,partialLinkPostIds,timeOrderTargets});
}
async function verifyReverseRelation(repos,postId,captureRecordId,releaseRecordId,{wait=sleep}={}){
 for(let attempt=0;attempt<5;attempt++){
  const capture=await repos.captures.readRecordById(captureRecordId,{requirePrimary:true});
  if(capture?.record_id!==captureRecordId||capture.fields['Post ID']!==postId)fail('readback_mismatch','Capture identity changed during reverse readback');
  const reverse=capture?.fields.关联发布记录;
  if(!Array.isArray(reverse))fail('readback_mismatch','Capture reverse relation is unavailable');
  if(reverse.some(link=>link.id===releaseRecordId)&&reverse.every(link=>link.id===releaseRecordId))return true;
  if(reverse.length)fail('post_id_claimed','Capture reverse relation points to another release');
  if(attempt<4)await wait((attempt+1)*1000);
 }
 return false;
}

/** Apply only the frozen reviewed plan. A started or uncertain attempt is never replayed. */
export async function applyCaptionBackfill({jobs,repos,readPosts,requestId,cutoff,expectedDigest,publicationTimezone,publicationTimezoneSince,publicationTimezones={},allowUnknownDrama=false,leadReviewOnly=false,recognizeDramas=false,verifiedCodes=[],candidatePostIds=null,partialLinkPostIds=[],timeOrderTargets=[],maxActions=Infinity,wait=sleep,now=()=>new Date()}){
 if(repos.captures.writableOnly===true)fail('caption_projection_invalid','Capture reverse relation requires a full Base read');
 if(maxActions!==Infinity&&(!Number.isInteger(maxActions)||maxActions<1||maxActions>50))fail('caption_backfill_config_invalid','Per-run action limit must be 1 to 50');
 const row=jobs.db.prepare('SELECT state,plan_digest,plan_json,completed_json FROM caption_backfill_runs WHERE request_id=?').get(requestId);
 if(!row)fail('caption_plan_missing','A stored read-only plan is required');
 if(row.state==='complete')return {status:'already_complete',request_id:requestId,completed:JSON.parse(row.completed_json)};
 if(row.plan_digest!==expectedDigest||!new RegExp('^[a-f0-9]{64}$').test(expectedDigest??''))fail('caption_plan_digest_mismatch','The approved plan digest changed');
 const stored=JSON.parse(row.plan_json);
 if(stored.cutoff!==cutoff||stored.digest!==expectedDigest)fail('caption_plan_digest_mismatch','Stored plan identity changed');
 if((stored.recognition_mode??false)!==recognizeDramas)fail('caption_plan_digest_mismatch','Stored recognition mode changed');
 if((stored.lead_review_only??false)!==leadReviewOnly)fail('caption_plan_digest_mismatch','Stored caption selection mode changed');
 const binding=baseBinding(repos);
 if(!binding||repos.releases.serverGeneratedIds!==true)fail('caption_backfill_config_invalid','Stable Base binding and generated release IDs are required');
 const completed=JSON.parse(row.completed_json);
 if(!Array.isArray(completed)||completed.length>stored.actions.length)fail('caption_plan_invalid','Completed journal is malformed');
 if(JSON.stringify(stored.scope_post_ids??null)!==JSON.stringify(candidatePostIds===null?null:[...candidatePostIds].sort()))fail('caption_plan_digest_mismatch','Stored capture scope changed');
 let state=row.state;
 if(state==='uncertain'){
  let failure=null;
  try{failure=jobs.db.prepare('SELECT post_id,phase,error_code FROM caption_backfill_failures WHERE request_id=?').get(requestId);}catch{}
  const action=stored.actions[completed.length];
  if(failure?.phase==='reverse_readback'&&failure.error_code==='readback_mismatch'&&action?.post_id===failure.post_id){
   const [releases,captures,accounts]=await Promise.all([repos.releases.loadIndex(),repos.captures.loadIndex(),repos.accounts.loadIndex()]);
   const capture=captures.get(action.post_id),account=accounts.get(action.account_id);
   const owners=[...releases].filter(([,record])=>record.fields['Post ID']===action.post_id||postIdFromUrl(record.fields.视频链接)===action.post_id||
    (record.fields.采集记录??[]).some(link=>link.id===action.capture_record_id));
   const owner=owners.length===1?owners[0]:null,fields=owner?.[1].fields;
   const matches=owner&&capture?.record_id===action.capture_record_id&&account?.record_id===action.account_record_id&&account.fields.表现形式==='AI真人剧'&&
    fields.归档状态==='active'&&fields['Post ID']===action.post_id&&canonicalCapturePostUrl(fields.视频链接)===action.video_url&&
    one(fields.采集记录)===action.capture_record_id&&one(fields.账号)===action.account_record_id&&one(fields.剧)===action.drama_record_id&&
    planDay(fields.日期)===action.publication_day&&fields.匹配方式==='exact_post_id'&&
    (!action.review_reason||fields.待处理原因==='剧名待人工匹配')&&
    Array.isArray(capture.fields.关联发布记录)&&capture.fields.关联发布记录.length===1&&capture.fields.关联发布记录[0].id===owner[1].record_id&&
    (action.kind==='create'||owner[0]===action.release_id&&owner[1].record_id===action.release_record_id);
   if(matches){
    const receipt={post_id:action.post_id,kind:action.kind,release_id:owner[0],release_record_id:owner[1].record_id,reverse_pending:false};
    jobs.appendAudit({actorId:'system:caption-backfill',action:'caption_backfill_reconciled',targetTable:'发布记录',targetKey:owner[0],
     before:{request_id:requestId,post_id:action.post_id,phase:failure.phase},after:receipt,readback:{record:owner[1],capture,status:'verified'},now:now()});
    completed.push(receipt);
    jobs.db.prepare("UPDATE caption_backfill_runs SET state='paused_safe',completed_json=?,error_code=NULL,updated_at=? WHERE request_id=? AND state='uncertain'").run(JSON.stringify(completed),now().toISOString(),requestId);
    state='paused_safe';
   }
  }
 }
 if(!['planned','paused_safe','pending_reverse'].includes(state))return {status:'held',request_id:requestId,reason:'prior_attempt_requires_review'};
 const fresh=await currentPlan({repos,readPosts,cutoff,publicationTimezone,publicationTimezoneSince,publicationTimezones,allowUnknownDrama,leadReviewOnly,recognizeDramas,verifiedCodes,candidatePostIds,partialLinkPostIds,timeOrderTargets});
 if(state==='planned'&&fresh.digest!==expectedDigest)fail('caption_plan_changed','Base or source identities changed after planning');
 if(['paused_safe','pending_reverse'].includes(state)){
  if(JSON.stringify(fresh.actions)!==JSON.stringify(stored.actions.slice(completed.length)))fail('caption_plan_changed','Remaining identities changed after a safe pause');
  const [releases,captures]=await Promise.all([repos.releases.loadIndex(),repos.captures.loadIndex()]);
  for(const receipt of completed){
   const release=releases.get(receipt.release_id),capture=captures.get(receipt.post_id);
   if(!release||release.record_id!==receipt.release_record_id||release.fields['Post ID']!==receipt.post_id||
      one(release.fields.采集记录)!==capture?.record_id||!Array.isArray(capture.fields.关联发布记录))fail('caption_plan_changed','A previously completed association changed');
   if(receipt.reverse_pending&&capture.fields.关联发布记录.length===0)return {status:'pending_reverse',request_id:requestId,completed};
   if(!capture.fields.关联发布记录.some(link=>link.id===release.record_id))fail('caption_plan_changed','A previously completed reverse relation changed');
   receipt.reverse_pending=false;
  }
 }
 const ownerId=`caption-backfill-${randomUUID()}`,lockKey=`human-base:${binding}`;
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))return {status:'deferred',request_id:requestId};
 let lost=null;
 const controller=new AbortController();
 const renew=()=>{try{jobs.renewMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300});}catch(error){lost=error;controller.abort();}};
 const assertOwned=()=>{if(lost)throw lost;renew();if(lost)throw lost;};
 const heartbeat=setInterval(renew,1000);heartbeat.unref?.();
 try{
  assertOwned();
  jobs.db.prepare("UPDATE caption_backfill_runs SET state='started',completed_json=?,updated_at=? WHERE request_id=? AND state IN ('planned','paused_safe','pending_reverse')").run(JSON.stringify(completed),now().toISOString(),requestId);
  for(const action of stored.actions.slice(completed.length,completed.length+maxActions)){
   let phase='replan';
   try{
    const current=await currentPlan({repos,readPosts,cutoff,publicationTimezone,publicationTimezoneSince,publicationTimezones,allowUnknownDrama,leadReviewOnly,recognizeDramas,verifiedCodes,candidatePostIds,partialLinkPostIds,timeOrderTargets});assertOwned();
    const candidate=current.actions.find(item=>item.post_id===action.post_id);
    if(!candidate||JSON.stringify(candidate)!==JSON.stringify(action))fail('caption_plan_changed','Candidate or target changed before write');
    phase='capture_preflight';
    const capture=await repos.captures.getByKey(action.post_id);assertOwned();
    const reverse=capture?.fields.关联发布记录??[];
    const alreadyLinkedToTarget=action.kind==='attach'&&Array.isArray(reverse)&&reverse.length===1&&reverse[0].id===action.release_record_id;
    if(!capture||capture.record_id!==action.capture_record_id||captureMatchVersion(capture)!==action.capture_version||
       reverse.length&&!alreadyLinkedToTarget)fail('caption_plan_changed','Capture identity changed');
    let written;
    if(action.kind==='attach'){
     const release=await repos.releases.getByKey(action.release_id);assertOwned();
     if(!release||release.record_id!==action.release_record_id||releaseVersion(release.fields)!==action.release_version)fail('caption_plan_changed','Release identity changed');
     phase='write';
     written=await (recognizeDramas?repos.releases.registerRecognizedPostSafely.bind(repos.releases):repos.releases.registerCaptionPostSafely.bind(repos.releases))(action.release_id,action.post_id,release,action.capture_version,
      {expectedDramaRecordId:action.drama_record_id,reviewReason:action.review_reason,recognizedTitle:action.recognized_title,captureRepository:repos.captures,signal:controller.signal});
    }else if(action.kind==='create'){
     const patch={...(action.publication_day?{日期:action.publication_day}:{}),账号:[{id:action.account_record_id}],
      ...(action.drama_record_id?{剧:[{id:action.drama_record_id}]}:{待处理原因:'剧名待人工匹配'}),...(action.pending_timestamp?{待处理原因:'剧名或发布时间待人工核对'}:{}),归档状态:'active',
      ...((leadReviewOnly||recognizeDramas)&&action.owner_id?{处理负责人:[{id:action.owner_id}]}:{}),
      'Post ID':action.post_id,视频链接:action.video_url,采集记录:[{id:action.capture_record_id}],匹配方式:'exact_post_id',匹配置信度:null};
     phase='write';
     written=await repos.releases.createWithGeneratedId(patch,'caption_backfill',{signal:controller.signal,beforeWrite:async before=>{
      assertOwned();
      const claimed=[...before.values()].some(record=>record.fields['Post ID']===action.post_id||postIdFromUrl(record.fields.视频链接)===action.post_id||
       (record.fields.采集记录??[]).some(link=>link.id===action.capture_record_id));
      const newSlot=[...before.values()].some(record=>(emptyRelease(record)||recognizeDramas&&!record.fields.归档状态&&!record.fields['Post ID']&&!record.fields.视频链接&&!record.fields.采集记录?.length)&&one(record.fields.账号)===action.account_record_id&&
       (leadReviewOnly||one(record.fields.剧)===action.drama_record_id)&&releaseDay(record)===action.publication_day);
      if(claimed||newSlot)fail('caption_plan_changed','Post was claimed or a matching release slot appeared before create');
     }});
    }else fail('caption_plan_invalid','Unsupported stored action');
    assertOwned();
    phase='release_readback';
    const releaseId=written.record?.fields.发布ID,releaseRecordId=written.record?.record_id;
    if(written.readback!=='verified'||typeof releaseId!=='string'||!releaseRecordId||written.record.fields['Post ID']!==action.post_id||
       canonicalCapturePostUrl(written.record.fields.视频链接)!==action.video_url||one(written.record.fields.采集记录)!==action.capture_record_id)
      fail('readback_mismatch','Release write did not confirm post identity and capture link');
    phase='reverse_readback';
    const reverseVerified=await verifyReverseRelation(repos,action.post_id,action.capture_record_id,releaseRecordId,{wait});assertOwned();
    const receipt={post_id:action.post_id,kind:action.kind,release_id:releaseId,release_record_id:releaseRecordId,reverse_pending:!reverseVerified};
    completed.push(receipt);
    jobs.db.prepare('UPDATE caption_backfill_runs SET state=?,completed_json=?,updated_at=? WHERE request_id=?').run(reverseVerified?'started':'pending_reverse',JSON.stringify(completed),now().toISOString(),requestId);
    phase='audit';
    jobs.appendAudit({actorId:'system:caption-backfill',action:'caption-backfill',targetTable:'发布记录',targetKey:releaseId,
     before:{plan_digest:expectedDigest,post_id:action.post_id,kind:action.kind},after:receipt,readback:{record:written.record,status:reverseVerified?'verified':'reverse_pending'},now:now()});
    if(!reverseVerified)return {status:'pending_reverse',request_id:requestId,completed};
   }catch(error){
    const code=error.code??'caption_backfill_uncertain';
    jobs.db.exec('CREATE TABLE IF NOT EXISTS caption_backfill_failures (request_id TEXT PRIMARY KEY,post_id TEXT NOT NULL,phase TEXT NOT NULL,error_code TEXT NOT NULL,message TEXT NOT NULL,updated_at TEXT NOT NULL)');
    jobs.db.prepare('INSERT INTO caption_backfill_failures(request_id,post_id,phase,error_code,message,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(request_id) DO UPDATE SET post_id=excluded.post_id,phase=excluded.phase,error_code=excluded.error_code,message=excluded.message,updated_at=excluded.updated_at').run(requestId,action.post_id,phase,code,String(error.message??'').slice(0,1000),now().toISOString());
    const noWrite=['replan','capture_preflight'].includes(phase);
    jobs.db.prepare("UPDATE caption_backfill_runs SET state=?,error_code=?,completed_json=?,updated_at=? WHERE request_id=?").run(noWrite?'stale':'uncertain',code,JSON.stringify(completed),now().toISOString(),requestId);
    return {status:noWrite?'needs_review':'partial',request_id:requestId,error_code:code,completed};
   }
  }
  const status=completed.length===stored.actions.length?'complete':'paused_safe';
  jobs.db.prepare('UPDATE caption_backfill_runs SET state=?,completed_json=?,updated_at=? WHERE request_id=?').run(status,JSON.stringify(completed),now().toISOString(),requestId);
  return {status,request_id:requestId,completed};
 }finally{clearInterval(heartbeat);jobs.releaseMutationLease({lockKey,ownerId});}
}

/** Process newly discovered captures with a durable plan and the same fail-closed writer. */
export async function processContinuousCaptionReleases({jobs,repos,readPosts,activationAt,publicationTimezone,publicationTimezoneSince,publicationTimezones={},leadReviewOnly=false,recognizeDramas=false,verifiedCodes=[],partialLinkPostIds=[],timeOrderTargets=[],observeOnly=false,maxActions=10,excludedPostIds=[],now=()=>new Date()}){
 if(repos.captures.writableOnly===true||!Number.isFinite(Date.parse(activationAt))||recognizeDramas&&leadReviewOnly)fail('caption_auto_config_invalid','A full capture view and compatible recognition mode are required');
 const policyExcluded=new Set(validateExcludedPostIds(excludedPostIds));
 jobs.db.exec(`CREATE TABLE IF NOT EXISTS caption_backfill_runs (
  request_id TEXT PRIMARY KEY, state TEXT NOT NULL, plan_digest TEXT NOT NULL,
  plan_json TEXT NOT NULL, completed_json TEXT NOT NULL, updated_at TEXT NOT NULL, error_code TEXT)`);
 const prior=jobs.db.prepare("SELECT request_id,state,plan_digest,plan_json,completed_json FROM caption_backfill_runs WHERE request_id LIKE 'caption-auto-%' ORDER BY updated_at,request_id").all();
 const active=prior.find(row=>['planned','paused_safe','pending_reverse'].includes(row.state));
 const shared={jobs,repos,readPosts,publicationTimezone,publicationTimezoneSince,publicationTimezones,allowUnknownDrama:true,leadReviewOnly,recognizeDramas,verifiedCodes,partialLinkPostIds,timeOrderTargets,maxActions,now};
 if(active){
  const saved=JSON.parse(active.plan_json);
  const excludedInPlan=(saved.scope_post_ids??[]).some(id=>policyExcluded.has(id))||(saved.actions??[]).some(action=>policyExcluded.has(action.post_id));
  if(excludedInPlan){
   if(observeOnly)return {status:'observed',pending_request:active.request_id,actions:saved.actions.length,excluded_post_in_pending_plan:true};
   if(active.state==='pending_reverse')return {status:'needs_review',request_id:active.request_id,error_code:'excluded_post_pending_reverse'};
   jobs.db.prepare("UPDATE caption_backfill_runs SET state='stale',error_code='post_excluded',updated_at=? WHERE request_id=?").run(now().toISOString(),active.request_id);
  }else if(observeOnly)return {status:'observed',pending_request:active.request_id,actions:saved.actions.length};
  else if((saved.recognition_mode??false)!==recognizeDramas||(saved.lead_review_only??false)!==leadReviewOnly){
   if(active.state==='pending_reverse')return {status:'needs_review',request_id:active.request_id,error_code:'pending_reverse_from_previous_mode'};
   jobs.db.prepare("UPDATE caption_backfill_runs SET state='stale',error_code='recognition_mode_changed',updated_at=? WHERE request_id=?").run(now().toISOString(),active.request_id);
  }else if(!excludedInPlan){
   try{return await applyCaptionBackfill({...shared,requestId:active.request_id,cutoff:saved.cutoff,candidatePostIds:saved.scope_post_ids,expectedDigest:active.plan_digest});}
   catch(error){
    if(error.code==='caption_plan_changed'&&['planned','paused_safe'].includes(active.state))jobs.db.prepare("UPDATE caption_backfill_runs SET state='stale',error_code=?,updated_at=? WHERE request_id=? AND state IN ('planned','paused_safe')").run(error.code,now().toISOString(),active.request_id);
    return {status:'needs_review',request_id:active.request_id,error_code:error.code??'caption_auto_plan_invalid'};
   }
  }
 }
 const excluded=new Set(policyExcluded);
 for(const row of prior){
  const actions=JSON.parse(row.plan_json).actions,completed=JSON.parse(row.completed_json);
  for(const item of completed)excluded.add(item.post_id);
  if(['started','uncertain'].includes(row.state)){
   let failure=null;try{failure=jobs.db.prepare('SELECT post_id FROM caption_backfill_failures WHERE request_id=?').get(row.request_id);}catch{}
   const uncertainPost=failure?.post_id??actions[completed.length]?.post_id;if(uncertainPost)excluded.add(uncertainPost);
  }
 }
 const [posts,captures,accounts,dramas,releases]=await Promise.all([readPosts(),repos.captures.loadIndex(),repos.accounts.loadIndex(),repos.dramas.loadIndex(),repos.releases.loadIndex()]);
 const cutoff=now().toISOString();
 if(Date.parse(cutoff)<Date.parse(activationAt))return {status:'no_op',reason:'before_activation'};
 const releaseByRecord=new Map([...releases.values()].map(row=>[row.record_id,row]));
 const partialAllowed=new Set(partialLinkPostIds);
 const needsEvidence=(postId,capture)=>{
  if(!partialAllowed.has(postId))return false;
  const reverse=capture.fields.关联发布记录;
  if(!Array.isArray(reverse)||reverse.length!==1)return false;
  const release=releaseByRecord.get(reverse[0]?.id);
  return !!release&&one(release.fields.采集记录)===capture.record_id&&(!release.fields['Post ID']||!release.fields.视频链接);
 };
 const candidatePostIds=recognizeDramas?[...captures].filter(([postId,capture])=>
  (!capture.fields.关联发布记录?.length||needsEvidence(postId,capture))&&!excluded.has(postId)).map(([postId])=>postId).sort():posts.filter(post=>{
  const firstSeen=Date.parse(post.first_seen_at),capture=captures.get(post.post_id);
  return Number.isFinite(firstSeen)&&firstSeen>=Date.parse(activationAt)&&firstSeen<=Date.parse(cutoff)&&capture&&!(capture.fields.关联发布记录?.length)&&!excluded.has(post.post_id);
 }).map(post=>post.post_id).sort();
 if(!candidatePostIds.length)return {status:'no_op',reason:'no_new_unlinked_captures',recognition_mode:recognizeDramas};
 let preview=planCaptionBackfill({accounts,dramas,captures,releases,posts,cutoff,publicationTimezone,publicationTimezoneSince,publicationTimezones,
  allowUnknownDrama:true,leadReviewOnly,recognizeDramas,verifiedCodes,candidatePostIds,partialLinkPostIds,timeOrderTargets});
 if(observeOnly){
  const report={status:'observed',candidates:candidatePostIds.length,counts:preview.counts,pool_candidates:preview.pool_candidates?.length??0,
   pool_titles:[...new Set((preview.pool_candidates??[]).map(c=>c.title))],held:preview.held};
  jobs.appendAudit({actorId:'system:caption-auto',action:'caption-auto-observe',targetTable:'发布记录',targetKey:null,before:{activation_at:activationAt},after:report,readback:{status:'read_only'},now:now()});return report;
 }
 let poolResult=null;
 if(recognizeDramas&&preview.pool_candidates.length){
  poolResult=await ensureCaptionDramas({jobs,repos,candidates:preview.pool_candidates,maxCreates:maxActions,now,revalidate:async candidate=>{
   const fresh=await currentPlan({...shared,cutoff,candidatePostIds});
   return fresh.pool_candidates.some(item=>JSON.stringify(item)===JSON.stringify(candidate));
  }});
  if(poolResult.status==='deferred')return {status:'deferred',reason:'pool_mutation_busy'};
  preview=await currentPlan({...shared,cutoff,candidatePostIds});
 }
 if(recognizeDramas){
  jobs.db.exec(`CREATE TABLE IF NOT EXISTS caption_auto_reviews (post_id TEXT PRIMARY KEY,reason TEXT NOT NULL,evidence_json TEXT NOT NULL,updated_at TEXT NOT NULL)`);
  const accountByRecord=new Map([...accounts].map(([id,r])=>[r.record_id,{id,...r}]));
  const holds=[...preview.held,...(poolResult?.held??[])];
  for(const item of holds){
   const capture=captures.get(item.post_id),account=accountByRecord.get(one(capture?.fields.账号));
   const evidence={...item,capture_record_id:capture?.record_id,account_id:account?.id,owner_id:one(account?.fields.负责人),caption:String(capture?.fields.Caption??'').slice(0,600)};
   jobs.db.prepare('INSERT INTO caption_auto_reviews(post_id,reason,evidence_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(post_id) DO UPDATE SET reason=excluded.reason,evidence_json=excluded.evidence_json,updated_at=excluded.updated_at').run(item.post_id,item.reason,JSON.stringify(evidence),now().toISOString());
  }
  for(const action of preview.actions)jobs.db.prepare('DELETE FROM caption_auto_reviews WHERE post_id=?').run(action.post_id);
 }
 if(!preview.actions.length)return {status:poolResult?.held.length?'needs_review':'no_op',reason:'new_captures_need_review',held:preview.held.length,pool:poolResult,recognition_mode:recognizeDramas};
 const requestId=`caption-auto-${digest({cutoff,candidatePostIds,attempt:prior.length}).slice(0,24)}`;
 const staged=await stageCaptionBackfillPlan({...shared,requestId,mode:'plan',cutoff,candidatePostIds});
 try{return {...await applyCaptionBackfill({...shared,requestId,cutoff,candidatePostIds,expectedDigest:staged.digest}),pool:poolResult};}
 catch(error){return {status:'needs_review',request_id:requestId,error_code:error.code??'caption_auto_plan_invalid',pool:poolResult};}
}

/** One bounded repair for a confirmed non-drama row created by this automation. */
export async function processCaptionRepair({jobs,repos,request,now=()=>new Date()}){
 if(!request||!/^caption-repair-[a-z0-9-]{4,50}$/.test(request.requestId??'')||
    ['releaseId','releaseRecordId','postId','captureRecordId','accountRecordId'].some(key=>typeof request[key]!=='string'||!request[key]))
  fail('caption_repair_config_invalid','Exact repair identity is required');
 const binding=baseBinding(repos);
 if(!binding||repos.captures.writableOnly===true)fail('caption_repair_config_invalid','A full Base view is required');
 jobs.db.exec('CREATE TABLE IF NOT EXISTS caption_repairs (request_id TEXT PRIMARY KEY,state TEXT NOT NULL,before_json TEXT NOT NULL,updated_at TEXT NOT NULL,error_code TEXT)');
 const previous=jobs.db.prepare('SELECT state FROM caption_repairs WHERE request_id=?').get(request.requestId);
 if(previous?.state==='complete')return {status:'already_complete',request_id:request.requestId};
 if(previous)return {status:'held',request_id:request.requestId,reason:'prior_attempt_requires_review'};
 const ownerId=`caption-repair-${randomUUID()}`,lockKey=`human-base:${binding}`;
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))return {status:'deferred',request_id:request.requestId};
 let started=false;
 try{
  const [release,capture]=await Promise.all([repos.releases.getByKey(request.releaseId),repos.captures.getByKey(request.postId)]);
  const before={release,capture,request};
  jobs.db.prepare("INSERT INTO caption_repairs VALUES(?,'started',?,?,NULL)").run(request.requestId,JSON.stringify(before),now().toISOString());started=true;
  jobs.appendAudit({actorId:'system:caption-repair',action:'caption_repair_intent',targetTable:'发布记录',targetKey:request.releaseId,
   before,after:{archive_and_unlink:true},readback:{status:'pending'},now:now()});
  const written=await repos.releases.archiveErroneousCaptionReleaseSafely(request);
  if(written.readback!=='verified')fail('readback_mismatch','Repair requires verified release and capture readback');
  jobs.appendAudit({actorId:'system:caption-repair',action:'caption_repair_complete',targetTable:'发布记录',targetKey:request.releaseId,
   before,after:{release:written.record,capture:written.capture},readback:{status:'verified'},now:now()});
  jobs.db.prepare("UPDATE caption_repairs SET state='complete',updated_at=? WHERE request_id=?").run(now().toISOString(),request.requestId);
  return {status:'complete',request_id:request.requestId,release_id:request.releaseId,post_id:request.postId,readback:'verified'};
 }catch(error){
  if(started)jobs.db.prepare("UPDATE caption_repairs SET state='uncertain',error_code=?,updated_at=? WHERE request_id=?").run(error.code??'caption_repair_uncertain',now().toISOString(),request.requestId);
  return {status:'partial',request_id:request.requestId,error_code:error.code??'caption_repair_uncertain'};
 }finally{jobs.releaseMutationLease({lockKey,ownerId});}
}
