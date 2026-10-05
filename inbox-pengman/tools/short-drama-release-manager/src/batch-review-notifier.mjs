import { createHash } from 'node:crypto';
import { ShortDramaError } from './errors.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const labels={scheduled:'已排期',needs_confirmation:'待人工确认',awaiting_collection:'等待有效采集',conflict:'关联或批次冲突',complete:'已处理',inactive:'已归档'};
const reasons={automatic_attempt_requires_review:'自动回填写入结果待核对，已停止重试',notes_say_unpublished:'备注含未发布、暂停或待验收信息',count_short:'候选数量不足，需核实延迟或采集遗漏',count_extra:'候选数量超过计划',content_unverified:'文案未能确认剧名',title_ambiguous:'文案可能对应重名剧',date_differs:'实际发布时间与计划跨日',competing_plans:'候选同时对应其他计划',collection_unverified:'缺少计划结束后的有效采集证据',owner_missing_or_multiple:'需指定一名处理负责人',batch_metadata_invalid:'批次字段不完整或不一致',existing_link_conflict:'已有链接与关联记录存在冲突'};
const failure=(code,message)=>{throw new ShortDramaError(code,message);};
const GROUP_REFUSALS=new Set([230002,230035,232009]);
const refused=error=>error?.code==='notification_delivery_failed'&&GROUP_REFUSALS.has(error.details?.feishu_code)&&
 (error.details?.status===undefined||error.details.status>=400&&error.details.status<500&&error.details.status!==429);
function init(db){db.exec(`CREATE TABLE IF NOT EXISTS batch_review_notifications (
 notification_key TEXT PRIMARY KEY, batch_id TEXT NOT NULL, recipient TEXT NOT NULL, state TEXT NOT NULL,
 message_id TEXT, sent_at TEXT, reminder_count INTEGER NOT NULL DEFAULT 0, attempt_id TEXT NOT NULL,
 error_code TEXT, updated_at TEXT NOT NULL)`);}
function reviewLink(baseUrl,tableId,recordId,viewId){const u=new URL(baseUrl);if(viewId)u.searchParams.set('view',viewId);u.searchParams.set('table',tableId);u.searchParams.set('record',recordId);return u.toString();}
export async function processBatchReviews({db,query,project,send,isRecipientAllowed,baseUrl,tableId,viewId=null,now=()=>new Date(),reminderHours=24,notifyStartHour=9,notifyEndHour=20,silentBatchIds=[]}){
 const report=await query();if(!Array.isArray(report?.rows))failure('batch_review_invalid','Batch report unavailable');
 if(!report.rows.length)return {status:'success',batches:0,sent:0,deferred:0,errors:[]};
 init(db);const errors=[],silent=new Set(silentBatchIds);let sent=0,deferred=0;
 for(const batch of report.rows){
  const repair = batch.reasons.includes('batch_metadata_invalid');
  const noCandidates = batch.candidates.length === 0;
  const missing = batch.missing_sequences ?? [];
  const reason = repair ? `排期未建完整或字段不一致；现有 ${batch.created_count ?? batch.release_ids.length} / 计划 ${batch.planned_count} 条${missing.length ? `；缺少第${missing.join('、')}条` : ''}` : batch.reasons.map(r=>reasons[r]??r).join('；');
  const action = repair ? '这是排期问题，不需要确认视频。请由维护人员核对已确认排期并补齐缺失名额；不要重建整批或重放旧回执。' :
    batch.state === 'conflict' ? '当前存在关联冲突，请先核对原关联和写入结果；不要直接确认候选。' :
    batch.state === 'scheduled' ? '尚未到计划日结束，请按排期发布；当前不需要确认候选。' :
    noCandidates ? '目前没有候选可确认。请核实实际发布情况或等待有效采集；不要使用候选确认指令。' :
    `可直接回复「核验批次 ${batch.batch_id}，采用候选${Array.from({length:Math.min(3,batch.candidates.length)},(_,i)=>i+1).join('/')}」（按实际选择修改）。回复无需在15分钟内完成；Social收到回复后会重新校验并生成关联预览，预览回执15分钟有效，过期可重新核验。确认后才写入。`;
  const zone=batch.publication_timezone??'Asia/Shanghai';
  const timeFormat=zoneName=>new Intl.DateTimeFormat('sv-SE',{timeZone:zoneName,dateStyle:'short',timeStyle:'short'});
  const candidateText=batch.candidates.slice(0,10).map((c,i)=>`${i+1}. ${timeFormat(zone).format(new Date(c.published_at))}（${zone}） ${c.video_url}\n${c.caption.slice(0,180)}`).join('\n');
  const summary=`${labels[batch.state]??batch.state}；计划 ${batch.planned_day}（${zone}）${batch.planned_count??'未知'} 条，已关联 ${batch.linked} 条，候选 ${batch.candidates.length} 条。\n${candidateText}${batch.candidates.length>10?'\n候选超过10条，请在 Social 中查看完整批次。':''}\n${repair || noCandidates || batch.state === 'conflict' ? action : `向 Social 发送：查看批次 ${batch.batch_id}`}`;
  try {await project(batch,{'批次处理状态':labels[batch.state]??batch.state,'待处理原因':reason || null,'候选视频':summary});}
  catch(e){errors.push({batch_id:batch.batch_id,code:e.code??'review_projection_failed'});continue;}
  const plannedEnd=Date.parse(batch.window_end??'');
  if(!batch.notify||silent.has(batch.batch_id)||Number.isFinite(plannedEnd)&&now().getTime()<plannedEnd)continue;
  const recipient=batch.owner_ids.length===1?batch.owner_ids[0]:null;
  if(!recipient||!isRecipientAllowed(recipient)){errors.push({batch_id:batch.batch_id,code:'batch_notification_owner_unavailable'});continue;}
  const localHour=new Date(now().getTime()+8*3600000).getUTCHours();
  if(localHour<notifyStartHour||localHour>=notifyEndHour){deferred++;continue;}
  const key=hash([batch.batch_id,recipient,batch.reasons.filter(r=>r!=='owner_missing_or_multiple').sort()]);
  const at=now().toISOString();const old=db.prepare('SELECT * FROM batch_review_notifications WHERE notification_key=?').get(key);
  if(old?.state==='sending'||old?.state==='uncertain'){errors.push({batch_id:batch.batch_id,code:'batch_notification_delivery_uncertain'});continue;}
  let attempt=0;
  if(old){if(old.state!=='sent'||old.reminder_count>=1||Date.parse(at)-Date.parse(old.sent_at)<reminderHours*3600000)continue;attempt=1;}
  const fresh=(await query()).rows.find(r=>r.batch_id===batch.batch_id);
  if(!fresh || !fresh.notify || fresh.version!==batch.version || fresh.owner_ids.length!==1 || fresh.owner_ids[0]!==recipient)continue;
  const attemptId=hash([key,attempt]).slice(0,32);
  const claimed=old?db.prepare("UPDATE batch_review_notifications SET state='sending',attempt_id=?,updated_at=? WHERE notification_key=? AND state='sent' AND reminder_count=0").run(attemptId,at,key).changes:
   db.prepare("INSERT OR IGNORE INTO batch_review_notifications(notification_key,batch_id,recipient,state,attempt_id,updated_at) VALUES(?,?,?,'sending',?,?)").run(key,batch.batch_id,recipient,attemptId,at).changes;
  if(!claimed)continue;
  const displayZone=zone==='America/Chicago'?'美国中部时间':zone==='Asia/Shanghai'?'北京时间':zone;
  const candidateLines=batch.candidates.slice(0,5).map((c,i)=>`可能的视频 ${i+1}：${timeFormat(zone).format(new Date(c.published_at))}（${displayZone}）${batch.local_calendar?`；北京时间 ${timeFormat('Asia/Shanghai').format(new Date(c.published_at))}`:''}\n${c.video_url}\n${c.caption.slice(0,60).replace(/\s+/g,' ')}`).join('\n');
  const found=batch.created_count??batch.release_ids.length;
  const missingText=missing.length?`，缺第 ${missing.join('、')} 条`:'';
  const repairProblem=missing.length||found<batch.planned_count
   ?`${batch.planned_day}（${displayZone}）计划发 ${batch.planned_count} 条，但表里目前只找到 ${found} 条${missingText}。`
   :`${batch.planned_day}（${displayZone}）的发布计划里有信息不一致，暂时无法安全关联视频。`;
  const normalTitle=batch.state==='conflict'?'发布记录需要核对':noCandidates?'还没找到剩余视频':'请帮我确认视频对应关系';
  const normalIssue=batch.state==='conflict'?'现有记录之间有冲突，我先没有自动修改。':
   noCandidates?'目前还没有采集到可对应剩余记录的视频；如果视频尚未公开，等公开后的下一轮采集即可。':
   `我找到 ${batch.candidates.length} 条可能的视频，但还不能确定它们各自对应哪条发布记录。`;
  const normalAction=batch.state==='conflict'?'请先查看现有记录是否已填过视频链接，避免重复登记。':
   noCandidates?'如果视频已经公开、下一轮采集后仍没出现，请把链接发给我；尚未公开就不用处理。':
   '请回复这条消息，告诉我哪条视频对应哪条记录；我会重新核对后再处理。不用限时回复。';
  const message=repair
   ?`${attempt?'再次提醒：':''}发布计划需要核对\n账号：${String(batch.account_name).slice(0,80)}；剧名：${String(batch.drama_name).slice(0,100)}\n${repairProblem}\n请确认原计划是否有意调整。若仍按原计划发布，请核对后只补缺的记录；我暂时不会猜测视频对应哪条。\n查看排期：${reviewLink(baseUrl,tableId,batch.record_id,viewId)}\n有空处理即可，不用限时回复。`
   :`${attempt?'再次提醒：':''}${normalTitle}\n${String(batch.account_name).slice(0,80)} 的《${String(batch.drama_name).slice(0,100)}》${batch.planned_day}（${displayZone}）计划发 ${batch.planned_count} 条，表里已关联 ${batch.linked} 条。\n${normalIssue}${candidateLines?`\n${candidateLines}`:''}${batch.candidates.length>5?'\n这里只展示前5条，其余请看表内记录。':''}\n查看记录：${reviewLink(baseUrl,tableId,batch.record_id,viewId)}\n${normalAction}`;
  let ack;
  try{
   ack=await send({userId:recipient,text:message.slice(0,2000),uuid:attemptId});
   if(typeof ack?.message_id!=='string'||!ack.message_id)failure('notification_ack_missing','Message ID is required');
  }catch(e){
   db.prepare("UPDATE batch_review_notifications SET state='uncertain',error_code=?,updated_at=? WHERE notification_key=? AND attempt_id=?").run(e.code??'notification_delivery_uncertain',at,key,attemptId);
   errors.push({batch_id:batch.batch_id,code:e.code??'notification_delivery_uncertain'});continue;
  }
  db.prepare("UPDATE batch_review_notifications SET state='sent',message_id=?,sent_at=?,reminder_count=?,error_code=NULL,updated_at=? WHERE notification_key=? AND attempt_id=?").run(ack.message_id,at,attempt,at,key,attemptId);sent++;
  try{await project(batch,{'最近通知时间':at});}catch(e){errors.push({batch_id:batch.batch_id,code:e.code??'notification_projection_failed'});}
 }
 return {status:errors.length?'partial':'success',batches:report.rows.length,sent,deferred,errors};
}

export function createBatchReviewSender({tokenProvider,isRecipientAllowed,fetchJson,reviewChatId=null,reviewGroupRecipients=[],isChatAllowed=()=>false}){
 let membersPromise=null;
 const pilot=new Set(reviewGroupRecipients);
 const members=async token=>{
  const found=new Set();let pageToken=null;
  for(let page=0;page<10;page++){
   const url=new URL(`https://open.feishu.cn/open-apis/im/v1/chats/${reviewChatId}/members`);
   url.searchParams.set('member_id_type','open_id');url.searchParams.set('page_size','100');
   if(pageToken)url.searchParams.set('page_token',pageToken);
   const result=await fetchJson(url.toString(),{method:'GET',headers:{authorization:`Bearer ${token}`}});
   const data=result?.data;
   if(result?.code!==0||!Array.isArray(data?.items)||data.trigger_security_conf_limit===true)throw Error('review_group_members_unavailable');
   for(const item of data.items)if(typeof item?.member_id==='string')found.add(item.member_id);
   if(data.has_more!==true)return found;
   if(typeof data.page_token!=='string'||!data.page_token||data.page_token===pageToken)throw Error('review_group_members_incomplete');
   pageToken=data.page_token;
  }
  throw Error('review_group_members_incomplete');
 };
 return async({userId,text,uuid})=>{
  if(!/^ou_[A-Za-z0-9]+$/.test(userId)||!isRecipientAllowed(userId)||typeof text!=='string'||!text||text.length>2000||!/^\w{32}$/.test(uuid))failure('notification_target_denied','Invalid batch notification destination');
  const token=await tokenProvider();
  if(reviewChatId&&(!pilot.size||pilot.has(userId))&&isChatAllowed(reviewChatId)){
   membersPromise??=members(token).catch(()=>null);
   const currentMembers=await membersPromise;
   if(currentMembers?.has(userId)){
    const content={zh_cn:{title:'短剧发行提醒',content:[[{tag:'at',user_id:userId}],...text.split('\n').map(line=>[{tag:'text',text:line||' '}])]}};
    let group;
    try{
     group=await fetchJson('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id',{
      method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json; charset=utf-8'},
      body:JSON.stringify({receive_id:reviewChatId,msg_type:'post',content:JSON.stringify(content),uuid})});
    }catch(error){if(!refused(error))throw error;}
    if(group){
     if(GROUP_REFUSALS.has(group.code))group=null;
     else if(group.code!==0||typeof group.data?.message_id!=='string')failure('notification_delivery_failed','Feishu group acknowledgement missing');
     else return {message_id:group.data.message_id};
    }
   }
  }
  const result=await fetchJson('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',{
   method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json; charset=utf-8'},
   body:JSON.stringify({receive_id:userId,msg_type:'text',content:JSON.stringify({text}),uuid})});
  if(result?.code!==0||typeof result.data?.message_id!=='string')failure('notification_delivery_failed','Feishu message acknowledgement missing');
  return {message_id:result.data.message_id};
 };
}
