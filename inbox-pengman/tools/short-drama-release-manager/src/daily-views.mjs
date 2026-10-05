import {createHash,randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {ShortDramaError} from './errors.mjs';
import {selectCalendarSnapshots} from './day-boundaries.mjs';
export const DAILY_VIEWS_TABLE='每日播放趋势';
export const DAILY_VIEWS_FIELDS=Object.freeze({'日期':'text','新增播放量':'number','新增点赞':'number','新增评论':'number','新增收藏':'number','新增转发':'number','互动率':'number','可比帖子数':'number','新增帖子数':'number','未纳入帖子数':'number','缺失帖子数':'number','回调帖子数':'number','说明':'text'});
const fail=(message)=>{throw new ShortDramaError('daily_views_invalid',message);};
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const dayMs=86400000;
function dateMs(d){const ms=Date.parse(d+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==d)fail('Invalid snapshot date');return ms;}
export function buildDailyViews(rows,{username=null,calendarStartDate=null,asOfDate=null}={}){
 const days=new Map();
 for(const r of rows){dateMs(r.snapshot_date);if(!/^\d+$/.test(r.post_id)||typeof r.username!=='string'||!r.username||r.views!==null&&(!Number.isSafeInteger(r.views)||r.views<0)||!Number.isFinite(Date.parse(r.captured_at)))fail('Invalid snapshot identity or metric');
  const map=days.get(r.snapshot_date)??new Map();if(map.has(r.post_id))fail('Duplicate post/day snapshot');map.set(r.post_id,r);days.set(r.snapshot_date,map);
 }
 if(!days.size)return [];
 const dates=[...days.keys()].sort(),first=dateMs(dates[0]),last=dateMs(dates.at(-1));if((last-first)/dayMs>3660)fail('Snapshot range exceeds ten years');
 const output=[];
 for(let ms=first;ms<=last;ms+=dayMs){const date=new Date(ms).toISOString().slice(0,10),previous=new Date(ms-dayMs).toISOString().slice(0,10),cur=days.get(date),prev=days.get(previous);
  let sum=0,compared=0,added=0,excluded=0,missing=0,corrected=0;
  const metricNames={likes:'新增点赞',comments:'新增评论',favorites:'新增收藏',shares:'新增转发'};
  const growth=Object.fromEntries(Object.keys(metricNames).map(k=>[k,{sum:0,count:0,missing:0}]));
  const addMetrics=(r,old)=>{for(const k of Object.keys(metricNames)){const v=r[k],before=old?old[k]:0;if(v==null||before==null){growth[k].missing++;continue;}if(!Number.isSafeInteger(v)||v<0||!Number.isSafeInteger(before)||before<0)fail('Invalid interaction metric');growth[k].sum+=v-before;growth[k].count++;}};
  if(cur&&prev){const boundary=Math.max(...[...prev.values()].map(r=>Date.parse(r.captured_at)));
   for(const [id,r]of cur){if(username&&r.username!==username)continue;const old=prev.get(id);if(old&&old.username!==r.username)fail('Post account identity changed');
    if(r.views===null){excluded++;continue;}
    if(old&&old.views!==null){const delta=r.views-old.views;sum+=delta;compared++;addMetrics(r,old);if(delta<0)corrected++;}
    else if(!old&&Number.isFinite(Date.parse(r.published_at))&&Date.parse(r.published_at)>boundary&&Date.parse(r.published_at)<=Date.parse(r.captured_at)){sum+=r.views;added++;addMetrics(r,null);}
    else excluded++;
   }
   missing=[...prev].filter(([id,r])=>(!username||r.username===username)&&!cur.has(id)).length;
  }
  if(!Number.isSafeInteger(sum))fail('Daily growth exceeds safe numeric range');
  const available=!!cur&&!!prev&&(compared+added)>0;
  const note=!cur?'缺少当日快照':!prev?(ms===first?'首日基线；暂无前日快照':'前日断档；不把跨日差值算作一天'):!available?'没有可比播放量':`采集间隔增量；${excluded||missing?'部分覆盖':'已覆盖本轮可比帖子'}；未纳入 ${excluded} 条，本期未出现 ${missing} 条，平台回调 ${corrected} 条`;
  const interactions=Object.fromEntries(Object.entries(metricNames).map(([k,name])=>{if(!Number.isSafeInteger(growth[k].sum))fail('Interaction growth overflow');return [name,available&&growth[k].count?growth[k].sum:null];}));
  const rateKeys=['likes','comments','favorites'];
  const rate=available&&sum>0&&rateKeys.every(k=>growth[k].count>0&&!growth[k].missing&&growth[k].sum>=0)?rateKeys.reduce((s,k)=>s+growth[k].sum,0)/sum:null;
  const incomplete=Object.entries(growth).filter(([,v])=>v.missing).map(([k,v])=>metricNames[k]+'缺失 '+v.missing+' 条');
  output.push({...interactions,'互动率':rate,'日期':date,'新增播放量':available?sum:null,'可比帖子数':compared,'新增帖子数':added,'未纳入帖子数':excluded,'缺失帖子数':missing,'回调帖子数':corrected,'说明':'统计时区：北京时间（Asia/Shanghai）；'+note+(incomplete.length?'；'+incomplete.join('；'):'')});
 }
 if(!calendarStartDate)return output;
 return asCalendarDays(output,days,{calendarStartDate,asOfDate:asOfDate??dates.at(-1)});
}
function asCalendarDays(intervals, days, {calendarStartDate, asOfDate}) {
 const cutover=dateMs(calendarStartDate), end=dateMs(asOfDate), first=dateMs(intervals[0].日期);
 if(end-first>3660*dayMs)fail('Calendar report range exceeds ten years');
 const byDate=new Map(intervals.map(r=>[r.日期,r]));
 const blank=(date,note)=>Object.fromEntries(Object.entries(DAILY_VIEWS_FIELDS).map(([name,type])=>[name,name==='日期'?date:name==='说明'?note:type==='number'&&name.endsWith('帖子数')?0:null]));
 const batchTime=date=>{const values=[...(days.get(date)?.values()??[])].map(r=>Date.parse(r.captured_at));if(!values.length)return null;return new Date(Math.max(...values)+8*3600000).toISOString().slice(0,16).replace('T',' ');};
 const result=[];
 for(let ms=first;ms<=end;ms+=dayMs){
  const date=new Date(ms).toISOString().slice(0,10);
  if(ms<cutover){if(byDate.has(date))result.push(byDate.get(date));continue;}
  if(ms===end){result.push(blank(date,'统计时区：北京时间（Asia/Shanghai）；自然日；当日未结束，待结算（次日采集后更新）'));continue;}
  const next=new Date(ms+dayMs).toISOString().slice(0,10), interval=byDate.get(next);
  if(!days.has(date)||!days.has(next)||!interval){result.push(blank(date,'统计时区：北京时间（Asia/Shanghai）；自然日；缺少日初或次日结算快照，不分摊跨日增量'));continue;}
  const note=`北京时间自然日归档 ${date}；快照批次 ${batchTime(date)} → ${batchTime(next)}；允许采集时间偏差${ms===cutover?'；切换首日基线非日初，部分覆盖':''}；${interval.说明}`;
  result.push({...interval,'日期':date,'说明':note});
 }
 return result;
}
export function dailyReportingOptions(config, now=new Date()) {
 if(config.dailyReporting?.mode!=='calendar_day')return {};
 return {calendarStartDate:config.dailyReporting.startDate,asOfDate:new Date(now.getTime()+8*3600000).toISOString().slice(0,10)};
}
export function readDailySnapshots(dbPath){const db=new DatabaseSync(dbPath,{readOnly:true});try{return db.prepare('SELECT s.*,p.published_at FROM post_snapshots s JOIN posts p ON p.post_id=s.post_id ORDER BY s.snapshot_date,s.post_id').all();}finally{db.close();}}
export function readDailyViews(dbPath,options={}){return buildDailyViews(readDailySnapshots(dbPath),options);}
export function validateDailyViewsFields(result,detail){
 if(!result?.complete||!Array.isArray(result.items)||result.items.length!==Object.keys(DAILY_VIEWS_FIELDS).length||new Set(result.items.map(f=>f.name)).size!==result.items.length||new Set(result.items.map(f=>f.field_id)).size!==result.items.length)fail('Daily views field set changed');
 for(const f of result.items)if(DAILY_VIEWS_FIELDS[f.name]!==f.type||!f.field_id)fail('Daily views field type changed');
 if(result.items.find(f=>f.name==='日期')?.field_id!==detail?.primary_field)fail('Daily views primary field changed');
}
// Base serializes floating values to fewer significant digits. Counts remain exact.
export function dailyFieldEqual(field,actual,expected){
 if((actual??null)===(expected??null))return true;
 return field==='互动率'&&Number.isFinite(actual)&&Number.isFinite(expected)&&Math.abs(actual-expected)<=1e-12;
}
const same=(actual,expected)=>Object.keys(DAILY_VIEWS_FIELDS).every(k=>dailyFieldEqual(k,actual?.[k],expected[k]));
export async function projectDailyViews({client,config,jobs,now=()=>new Date(),sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
 const tableId=config.base.dailyViewsTableId;if(!tableId)return {status:'disabled'};
 if(jobs.listActive().length)return {status:'deferred',reason:'sync_active'};
 const snapshots=selectCalendarSnapshots({rows:readDailySnapshots(config.paths.metricsSqlite),config,jobs,now:now()});
 const rows=buildDailyViews(snapshots,dailyReportingOptions(config,now())),sha=digest({tableId,rows});
 const lockKey='daily-views:'+digest({base:config.base.appToken,tableId}),ownerId=randomUUID();
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))return {status:'deferred',reason:'projection_busy'};
 const renew=()=>{if(!jobs.renewMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))fail('Daily views lease lost');};
 const audit=(action,key,after)=>jobs.appendAudit({actorId:null,action,targetTable:DAILY_VIEWS_TABLE,targetKey:key,before:{},after,readback:after,now:now()});
 const read=async()=>{const r=await client.listRecords(config.base.appToken,tableId);renew();if(!r.complete||!Array.isArray(r.items))fail('Incomplete daily views read');const map=new Map();for(const row of r.items){const key=row.fields?.日期;dateMs(key);if(map.has(key)||!row.record_id)fail('Duplicate daily view date');map.set(key,row);}return map;};
 try{
  const pending=jobs.db.prepare("SELECT target_key,after_json FROM audit_events i WHERE action='daily_views_intent' AND target_table=? AND NOT EXISTS (SELECT 1 FROM audit_events r WHERE r.action='daily_views_resolved' AND r.target_key=i.target_key)").all(DAILY_VIEWS_TABLE);
  const previous=jobs.db.prepare("SELECT 1 FROM audit_events WHERE action='daily_views_projection' AND target_key=?").get(sha);
  if(previous&&!pending.length)return {status:'unchanged',rows:rows.length,source_sha256:sha};
  const detail=await client.getTable(config.base.appToken,tableId);renew();if(detail.name!==DAILY_VIEWS_TABLE||detail.table_id!==tableId)fail('Daily views table binding changed');validateDailyViewsFields(await client.listFields(config.base.appToken,tableId),detail);renew();
  let current=await read();
  for(const p of pending){const intent=JSON.parse(p.after_json);if(intent.table_id!==tableId||!Array.isArray(intent.rows)||!intent.rows.every(r=>same(current.get(r.日期)?.fields,r)))fail('Previous daily projection write is not fully visible; do not replay');audit('daily_views_resolved',p.target_key,{verified:true});}
  let created=0,updated=0;
  for(const kind of ['create','update']){const changed=rows.filter(r=>kind==='create'?!current.has(r.日期):current.has(r.日期)&&!same(current.get(r.日期).fields,r));
   for(let offset=0;offset<changed.length;offset+=200){const batch=changed.slice(offset,offset+200),key=sha+':'+kind+':'+offset;renew();audit('daily_views_intent',key,{table_id:tableId,rows:batch});
    const body=kind==='create'?{create_records:batch}:{update_records:Object.fromEntries(batch.map(r=>[current.get(r.日期).record_id,r]))};
    await client.request(`${client.basePath(config.base.appToken)}/tables/${encodeURIComponent(tableId)}/records/batch_${kind}`,{method:'POST',body});renew();
    let verified=false;for(let attempt=0;attempt<5;attempt++){current=await read();if(batch.every(r=>same(current.get(r.日期)?.fields,r))){verified=true;break;}await sleep((attempt+1)*1000);renew();}
    if(!verified)fail('Daily views write did not read back');audit('daily_views_resolved',key,{verified:true});if(kind==='create')created+=batch.length;else updated+=batch.length;
   }
  }
  if(!rows.every(r=>same(current.get(r.日期)?.fields,r)))fail('Daily views final readback differs');
  audit('daily_views_projection',sha,{rows:rows.length,created,updated,readback:'verified'});return {status:'success',rows:rows.length,created,updated,readback:'verified',source_sha256:sha};
 }finally{jobs.releaseMutationLease({lockKey,ownerId});}
}
