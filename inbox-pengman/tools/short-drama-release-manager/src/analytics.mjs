import {ShortDramaError} from './errors.mjs';
import {selectCalendarSnapshots} from './day-boundaries.mjs';
import {isEmptyBusinessRecord} from './schema.mjs';
import {buildDailyViews, readDailySnapshots, DAILY_VIEWS_FIELDS, dailyReportingOptions} from './daily-views.mjs';

export const METRICS = Object.freeze({'播放量':'views','点赞':'likes','评论':'comments','收藏':'favorites','转发':'shares'});
const numbers = Object.fromEntries(Object.keys(METRICS).map(k=>[k,'number']));
const evidence = {'数据截至日期':'datetime','统计说明':'text'};
export const ACCOUNT_ANALYTICS_FIELDS = Object.freeze({...Object.fromEntries(Object.keys(METRICS).map(k=>['累计'+k,'number'])),'累计数据截至日期':'datetime','累计统计说明':'text'});
export const ANALYTICS_TABLES = Object.freeze({
 accountDaily:{name:'每日播放趋势-分账号',key:['日期','账号ID'],fields:{'日期':'text','账号名':'text','账号ID':'text',...Object.fromEntries(Object.entries(DAILY_VIEWS_FIELDS).filter(([k])=>k!=='日期'))},derivedFields:{'负责人':'lookup'}},
 dramas:{name:'短剧播放数据汇总',key:['剧ID'],fields:{'剧名':'text','剧ID':'text','剧分类':'text','所属平台':'text','上线日期':'datetime','平台':'text','首次发布日期':'datetime','发布记录数':'number',...numbers,...evidence}},
 releaseDays:{name:'短剧发布趋势',key:['日期'],fields:{'日期':'datetime','发布记录数':'number','剧名数':'number',...numbers,...evidence}},
 firstDays:{name:'短剧新发趋势-按日去重',key:['首次发布日期'],fields:{'首次发布日期':'datetime','剧名数':'number',...numbers,...evidence}},
});
const fail=(message,details)=>{throw new ShortDramaError('analytics_invalid',message,details);};
export function beijingDate(value){
 if(value==null||value==='')return null;
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)){if(new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)fail('无效日期');return value;}
 const normalized=typeof value==='string'&&/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)?value.replace(' ','T')+'+08:00':value;
 const n=Date.parse(normalized);if(!Number.isFinite(n))fail('无效日期');return new Date(n+28800000).toISOString().slice(0,10);
}
const ids=value=>value==null||value===''?[]:Array.isArray(value)&&value.every(x=>typeof x==='string'||x&&typeof x.id==='string')?value.map(x=>typeof x==='string'?x:x.id):skip('link_invalid');
const one=(value,field)=>{const a=ids(value);if(a.length>1)skip('link_not_unique',{field,count:a.length});return a[0]??null;};
const text=value=>Array.isArray(value)?value.join('、'):value??'';
// One malformed business row must not stop every report. Rows with a missing or
// duplicated key are left out (all copies of a duplicate: none can be trusted)
// and reported, so links pointing at them surface as their own issues.
function index(rows,primary,table,issues){
 const counts=new Map();for(const r of rows){const key=r.fields?.[primary];if(key)counts.set(key,(counts.get(key)??0)+1);}
 const m=new Map();
 for(const r of rows){const key=r.fields?.[primary];
  if(!r.record_id||m.has(r.record_id)){issues.push({table,record_id:r.record_id??null,reason:'record_id_invalid'});continue;}
  if(!key){issues.push({table,record_id:r.record_id,reason:'key_missing',field:primary});continue;}
  if(counts.get(key)>1){issues.push({table,record_id:r.record_id,key,reason:'key_duplicate',field:primary});continue;}
  m.set(r.record_id,r.fields);}
 return m;
}
class RowIssue extends Error{constructor(reason,details={}){super(reason);this.reason=reason;this.details=details;}}
const skip=(reason,details)=>{throw new RowIssue(reason,details);};
const invalidMetrics=capture=>Object.keys(METRICS).filter(k=>!(capture[k]==null||Number.isSafeInteger(capture[k])&&capture[k]>=0));
function total(rows){
 const out={};for(const k of Object.keys(METRICS)){const vals=rows.map(r=>r.capture?.[k]);if(vals.length===0||vals.some(v=>v==null)){out[k]=null;continue;}if(vals.some(v=>!Number.isSafeInteger(v)||v<0))fail('指标不是非负安全整数');out[k]=vals.reduce((s,v)=>s+v,0);if(!Number.isSafeInteger(out[k]))fail('累计指标溢出');}
 const dates=rows.map(r=>beijingDate(r.capture?.快照日期)).filter(Boolean).sort();
 const absent=rows.filter(r=>!r.capture||Object.keys(METRICS).some(k=>r.capture[k]==null)).length;
 const unmapped=rows.filter(r=>!r.drama).length;
 const undated=rows.filter(r=>!r.date).length;
 return {...out,'数据截至日期':dates.at(-1)??null,'统计说明':`统计时区：北京时间（Asia/Shanghai）；每帖取最后采集值；超过30天停止刷新；${dates.length?'指标日期 '+dates[0]+' 至 '+dates.at(-1):'暂无指标'}${absent?'；缺失指标 '+absent+' 条（对应指标留空）':''}${unmapped?'；未关联剧 '+unmapped+' 条':''}${undated?'；发布日期缺失 '+undated+' 条，无法确认首次发布日期':''}`};
}
function group(rows,key){const m=new Map();for(const r of rows){const k=key(r);if(k==null)continue;const a=m.get(k)??[];a.push(r);m.set(k,a);}return [...m].sort(([a],[b])=>a.localeCompare(b));}
export function buildAnalytics({accounts,dramas,releases,captures,now=new Date()}){
 accounts=accounts.filter(r=>!isEmptyBusinessRecord('账号台账',r.fields));
 dramas=dramas.filter(r=>!isEmptyBusinessRecord('选剧池',r.fields));
 captures=captures.filter(r=>!isEmptyBusinessRecord('采集数据',r.fields));
 releases=releases.filter(r=>!isEmptyBusinessRecord('发布记录',r.fields));
 const issues=[];
 const ai=index(accounts,'账号ID','账号台账',issues),di=index(dramas,'剧ID','选剧池',issues),ci=index(captures,'Post ID','采集数据',issues),ri=index(releases,'发布ID','发布记录',issues);
 const byPost=new Map([...ci].map(([id,f])=>[f['Post ID'],{id,fields:f}]));
 // Every copy of a duplicated capture key was left out of the index above. A
 // release that names such a post has no trustworthy capture to read.
 const ambiguousPosts=new Set(issues.filter(i=>i.table==='采集数据'&&i.reason==='key_duplicate').map(i=>i.key));
 const safeDate=value=>{try{return beijingDate(value);}catch{return null;}};
 const today=beijingDate(now.toISOString());
 // Pass 1 resolves each release on its own; any problem skips only that row.
 // Left-out releases are counted per drama, with the publication date where the
 // row states one, so its report row can say that the totals are incomplete and
 // its first publication date does not move.
 const candidates=[],excluded=new Map();let excludedCount=0;
 const exclude=(id,date)=>{excludedCount+=1;if(!id)return;const e=excluded.get(id)??{count:0,dates:[],undated:0};e.count+=1;if(date)e.dates.push(date);else e.undated+=1;excluded.set(id,e);};
 const dramaOf=f=>{try{const id=one(f.剧,'剧');return id&&di.has(id)?id:null;}catch{return null;}};
 const postOf=f=>f['Post ID']||String(f.视频链接??'').match(/tiktok\.com\/@[^/]+\/(?:video|photo)\/(\d+)/)?.[1]||null;
 const linkedCapture=f=>{try{const cid=one(f.采集记录,'采集记录');return cid?ci.get(cid)??null:null;}catch{return null;}};
 // The capture that belongs to a release. A linked capture of another post, or
 // a post whose capture key is duplicated, identifies nothing.
 const ownCapture=f=>{const post=postOf(f),linked=linkedCapture(f);
  if(linked)return !post||linked['Post ID']===post?linked:null;
  return post&&!ambiguousPosts.has(post)?byPost.get(post)?.fields??null:null;};
 // When a release was published: the row's own date, or for a batch release
 // the one its own capture states. Unknown when neither can be read.
 const publicationDate=f=>safeDate(f.批次ID?ownCapture(f)?.发布时间:f.日期);
 const isPublished=f=>Boolean(postOf(f)||f.视频链接||(Array.isArray(f.采集记录)&&f.采集记录.length));
 // A draft or a scheduled release is not a publication: its problem is still
 // reported, but it never counts as a release left out of the reports.
 const leave=f=>{const date=publicationDate(f);if(!isPublished(f)||date&&date>today)return;exclude(dramaOf(f),date);};
 for(const row of releases){const f=row.fields;
  // Left out by the index above for a missing or duplicated 发布ID.
  if(!ri.has(row.record_id)){leave(f);continue;}
  try{
   const cid=one(f.采集记录,'采集记录');let post=f['Post ID']||null;
   if(!post&&f.视频链接){const match=String(f.视频链接).match(/tiktok\.com\/@[^/]+\/(?:video|photo)\/(\d+)/);post=match?.[1]??null;}
   const linked=cid?ci.get(cid):null;if(cid&&!linked)skip('capture_link_missing',{capture_record_id:cid});
   if(post&&linked&&linked['Post ID']!==post)skip('capture_post_conflict',{post_id:post,linked_post_id:linked['Post ID']});post??=linked?.['Post ID'];
   if(!post&&!f.视频链接&&!cid)continue;
   if(post&&!linked&&ambiguousPosts.has(post))skip('capture_key_duplicate',{post_id:post});
   let date;try{date=beijingDate(f.批次ID ? (linked??byPost.get(post)?.fields)?.发布时间 : f.日期);}catch{skip('release_date_invalid');}
   if(!date)issues.push({release_id:f.发布ID,reason:'missing_release_date'});
   if(date>today)continue;
   const aid=one(f.账号,'账号'),did=one(f.剧,'剧');
   if(!aid)skip('release_account_missing',{account_record_id:null});
   // The account row was deleted or its key is ambiguous. The post still belongs
   // to its drama and date, so only the account totals leave it out.
   const account=ai.has(aid)?aid:null;
   if(!account)issues.push({release_id:f.发布ID,reason:'release_account_missing',account_record_id:aid});
   if(did&&!di.has(did))skip('release_drama_missing',{drama_record_id:did});
   let capture=linked??byPost.get(post)?.fields??null;
   if(capture&&one(capture.账号,'采集账号')!==aid)skip('release_capture_account_conflict',{release_account:ai.get(aid)?.账号ID??null});
   // An unusable value in the capture is a missing value: the release stays and
   // the totals it feeds read unknown, the same as for any metric never captured.
   if(capture){
    const bad=invalidMetrics(capture);
    if(bad.length){issues.push({release_id:f.发布ID,reason:'capture_metrics_invalid',post_id:post,fields:bad});capture={...capture,...Object.fromEntries(bad.map(k=>[k,null]))};}
    if(capture.快照日期!=null&&capture.快照日期!==''&&safeDate(capture.快照日期)===null){issues.push({release_id:f.发布ID,reason:'capture_date_invalid',post_id:post});capture={...capture,'快照日期':null};}
   }
   candidates.push({f,post,aid:account,did,date,capture});
  }catch(error){if(!(error instanceof RowIssue))throw error;issues.push({release_id:f.发布ID,reason:error.reason,...error.details});leave(f);}
 }
 // Pass 2: two releases claiming one post would double-count it and neither is
 // provably right, so every claimant is left out until a person resolves it.
 const claims=new Map();for(const c of candidates){const identity=c.post||c.f.视频链接;const a=claims.get(identity)??[];a.push(c.f.发布ID);claims.set(identity,a);}
 const eligible=[];
 for(const {f,post,aid,did,date,capture}of candidates){
  const identity=post||f.视频链接,claimants=claims.get(identity);
  if(claimants.length>1){issues.push({release_id:f.发布ID,reason:'duplicate_post_claim',post_id:identity,release_ids:claimants});exclude(did,date);continue;}
  if(!did)issues.push({release_id:f.发布ID,reason:'missing_drama'});
  const url=capture?.视频链接||f.视频链接||'';const platform=/^https?:\/\/(www\.)?tiktok\.com\//.test(url)?'TikTok':null;
  eligible.push({id:f.发布ID,account:aid,drama:did,date,capture,platform});
 }
 const accountRows=[...ai].map(([id,a])=>{const t=total(eligible.filter(r=>r.account===id));return {'账号ID':a.账号ID,...Object.fromEntries(Object.keys(METRICS).map(k=>['累计'+k,t[k]])),'累计数据截至日期':t.数据截至日期,'累计统计说明':t.统计说明};});
 // A drama whose releases were all skipped keeps a row with unknown metrics, so
 // the projection does not clear it to a measured zero.
 // The first publication date is a fact of the release rows, left-out ones
 // included; it stays unknown while any of them has no date.
 const firstDate=(rows,left)=>{const dates=[...rows.map(r=>r.date),...(left?.dates??[])];return dates.length&&dates.every(Boolean)&&!left?.undated?[...dates].sort()[0]:null;};
 const byDrama=new Map(group(eligible,r=>r.drama));for(const id of excluded.keys())if(!byDrama.has(id))byDrama.set(id,[]);
 const dramaRows=[...byDrama].sort(([a],[b])=>a.localeCompare(b)).map(([id,rows])=>{const d=di.get(id),t=total(rows),left=excluded.get(id);return {'剧名':d.剧名||d.剧ID,'剧ID':d.剧ID,'剧分类':text(d.剧分类),'所属平台':text(d.平台),'上线日期':safeDate(d.上线日期),'平台':[...new Set(rows.map(r=>r.platform).filter(Boolean))].sort().join('、'),'首次发布日期':firstDate(rows,left),'发布记录数':rows.length,...t,...(left?{'统计说明':t.统计说明+`；另有 ${left.count} 条发布记录因数据问题未计入（见同步告警）`}:{})};});
 const firstById=new Map(dramaRows.map(r=>[r.剧ID,r.首次发布日期]));
 const releaseDays=group(eligible,r=>r.date).map(([date,rows])=>({'日期':date,'发布记录数':rows.length,'剧名数':new Set(rows.map(r=>r.drama).filter(Boolean)).size,...total(rows)}));
 const firstDays=group(eligible,r=>r.drama?firstById.get(di.get(r.drama).剧ID):null).map(([date,rows])=>({'首次发布日期':date,'剧名数':new Set(rows.map(r=>r.drama)).size,...total(rows)}));
 const metadata_issues=dramaRows.flatMap(r=>['剧分类','所属平台','上线日期'].filter(field=>!r[field]).map(field=>({drama_id:r.剧ID,drama_name:r.剧名,field,reason:'drama_metadata_missing'})));
 return {accounts:accountRows,dramas:dramaRows,releaseDays,firstDays,issues,metadata_issues,eligible_releases:eligible.length,excluded_releases:excludedCount};
}
export function buildAccountDaily(snapshots,accounts,options={}){
 const names=new Map(accounts.map(r=>[r.fields.账号ID,r.fields.账号名||r.fields.账号ID]));
 return [...new Set(snapshots.map(r=>r.username))].sort().flatMap(username=>buildDailyViews(snapshots,{...options,username}).map(r=>({...r,'账号ID':username,'账号名':names.get(username)||username})));
}
export async function readAnalytics({client,config,now=new Date(),jobs=null}){
 const source={};for(const [key,tableName]of Object.entries({accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'})){
  const r=await client.listRecords(config.base.appToken,config.base.tableIds[key],{tableName,writableOnly:true});if(!r.complete||!Array.isArray(r.items))fail('统计源读取不完整');source[key]=r.items;
 }
 const snapshots=selectCalendarSnapshots({rows:readDailySnapshots(config.paths.metricsSqlite),config,jobs,now});
 return {...buildAnalytics({...source,now}),accountDaily:buildAccountDaily(snapshots,source.accounts,dailyReportingOptions(config,now)),source};
}
