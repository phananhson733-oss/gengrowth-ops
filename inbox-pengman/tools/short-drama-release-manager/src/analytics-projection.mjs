import {createHash,randomUUID} from 'node:crypto';
import {dailyFieldEqual} from './daily-views.mjs';
import {ShortDramaError} from './errors.mjs';
import {ANALYTICS_TABLES,ACCOUNT_ANALYTICS_FIELDS,readAnalytics,beijingDate} from './analytics.mjs';
import {ledgerIntegrityIssues,recordIntegrityIssues} from './pipeline-health.mjs';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const fail=(message,details)=>{throw new ShortDramaError('analytics_projection_invalid',message,details);};
const fieldValue=(type,value)=>type==='datetime'?beijingDate(value):value===''?null:value??null;
const normalize=(fields,spec)=>Object.fromEntries(Object.entries(spec.fields).map(([k,type])=>[k,fieldValue(type,fields[k])]));
const keyOf=(fields,spec,recordId=null)=>JSON.stringify(spec.key.map(k=>{const v=fieldValue(spec.fields[k],fields[k]);if(v==null||v==='')fail('统计键缺失',{table:spec.name,field:k,record_id:recordId});return v;}));
const equal=(a,b,spec)=>{const left=normalize(a,spec),right=normalize(b,spec);return Object.keys(spec.fields).every(k=>dailyFieldEqual(k,left[k],right[k]));};
const wire=(fields,spec)=>Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,spec.fields[k]==='datetime'&&v?beijingDate(v)+' 00:00:00':v]));
// While releases are being left out for data problems, a row without a computed
// value may only be missing because of them: it is kept as it is, not cleared.
// The daily table is built from snapshots and is not affected by releases.
export const clearsMissingRows=(key,data)=>key==='accountDaily'||data?.excluded_releases===0;
export async function projectReportTable({client,config,jobs,tableId,spec,rows,clearMissing=true,now=()=>new Date(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),renew=()=>{}}){
 const detail=await client.getTable(config.base.appToken,tableId);if(detail.name!==spec.name||detail.table_id!==tableId)fail('统计表绑定改变');
 const fields=await client.listFields(config.base.appToken,tableId);if(!fields.complete||!Array.isArray(fields.items))fail('统计字段读取不完整');
 const byName=new Map(fields.items.map(f=>[f.name,f]));if(byName.size!==fields.items.length)fail('统计字段重名');
 for(const [name,type]of Object.entries(spec.fields))if(byName.get(name)?.type!==type)fail('统计字段缺失或类型改变：'+name);
 for(const [name,type]of Object.entries(spec.derivedFields??{}))if(byName.get(name)?.type!==type)fail('统计字段缺失或类型改变：'+name);
 if(!spec.existing&&byName.get(Object.keys(spec.fields)[0])?.field_id!==detail.primary_field)fail('统计主字段改变');
 const read=async()=>{renew();let r;
  // Match the existing bulk repository readback policy: restart a drifting page scan,
  // never replay a write or relax the full-snapshot consistency check.
  for(let attempt=0;attempt<3;attempt++){
   try{r=await client.listRecords(config.base.appToken,tableId,{selectFields:Object.keys(spec.fields)});break;}
   catch(error){if(attempt===2||error.code!=='base_response_invalid'||!['rev','total'].includes(error.details?.pagination_metadata_key))throw error;await sleep((attempt+1)*1000);renew();}
  }
if(!r.complete||!Array.isArray(r.items))fail('统计数据读取不完整');const m=new Map(),ambiguous=new Set();
  for(const row of r.items){if(!row.record_id)fail('统计键重复');
   // A human-maintained table (账号台账) can hold a blank or duplicated key row.
   // Those rows are left untouched instead of blocking every report; buildAnalytics
   // already excluded them and reports them as issues. Report tables stay strict.
   if(spec.existing){const v=spec.key.map(k=>fieldValue(spec.fields[k],row.fields[k]));if(v.some(x=>x==null||x===''))continue;const k=JSON.stringify(v);if(ambiguous.has(k))continue;if(m.has(k)){m.delete(k);ambiguous.add(k);continue;}m.set(k,row);continue;}
   const k=keyOf(row.fields,spec,row.record_id);if(m.has(k))fail('统计键重复');m.set(k,row);}
  return m;};
 let current=await read();
 const audit=(action,key,after)=>jobs.appendAudit({actorId:null,action,targetTable:spec.name,targetKey:key,before:{},after,readback:after,now:now()});
 const pending=jobs.db.prepare("SELECT target_key,after_json FROM audit_events i WHERE action='analytics_intent' AND target_table=? AND NOT EXISTS(SELECT 1 FROM audit_events r WHERE r.action='analytics_resolved' AND r.target_key=i.target_key)").all(spec.name);
 for(const p of pending){const intent=JSON.parse(p.after_json);if(intent.table_id!==tableId||!Array.isArray(intent.rows)||!intent.rows.every(r=>current.has(keyOf(r,spec))&&equal(current.get(keyOf(r,spec)).fields,r,spec)))fail('上次统计写入结果未知，停止重复写入');audit('analytics_resolved',p.target_key,{verified:true});}
 const expected=new Map();for(const row of rows){const k=keyOf(row,spec);if(expected.has(k))fail('计算结果统计键重复');expected.set(k,normalize(row,spec));}
 // Preserve row identity when a source record is reassigned or removed; clear stale totals without deleting user rows.
 if(!spec.existing&&clearMissing)for(const [k,r]of current)if(!expected.has(k)){const empty=normalize(r.fields,spec);for(const [name,type]of Object.entries(spec.fields)){if(spec.key.includes(name))continue;if(type==='number')empty[name]=0;if(type==='datetime')empty[name]=null;}if('统计说明'in empty)empty.统计说明='统计时区：北京时间（Asia/Shanghai）；当前无符合条件的发布记录';if('说明'in empty)empty.说明='统计时区：北京时间（Asia/Shanghai）；当前无符合条件的数据';expected.set(k,empty);}
 let created=0,updated=0;
 for(const kind of ['create','update']){
  const changed=[...expected].filter(([k,r])=>kind==='create'?!current.has(k):current.has(k)&&!equal(current.get(k).fields,r,spec));
  if(spec.existing&&kind==='create'&&changed.length)fail('账号行已变化，不能自动创建账号');
  for(let start=0;start<changed.length;start+=200){renew();const batch=changed.slice(start,start+200);const auditKey=tableId+':'+randomUUID()+':'+digest(batch);
   audit('analytics_intent',auditKey,{table_id:tableId,rows:batch.map(([,r])=>r)});
   const body=kind==='create'?{create_records:batch.map(([,r])=>wire(r,spec))}:{update_records:Object.fromEntries(batch.map(([k,r])=>[current.get(k).record_id,wire(r,spec)]))};
   await client.request(`${client.basePath(config.base.appToken)}/tables/${encodeURIComponent(tableId)}/records/batch_${kind}`,{method:'POST',body});
   let verified=false;for(let attempt=0;attempt<5;attempt++){current=await read();if(batch.every(([k,r])=>current.has(k)&&equal(current.get(k).fields,r,spec))){verified=true;break;}await sleep((attempt+1)*1000);}
   if(!verified)fail('统计写入回读不一致');audit('analytics_resolved',auditKey,{verified:true});if(kind==='create')created+=batch.length;else updated+=batch.length;
  }
 }
 if(![...expected].every(([k,r])=>current.has(k)&&equal(current.get(k).fields,r,spec)))fail('统计最终回读不一致');
 return {rows:expected.size,created,updated,readback:'verified'};
}
export async function projectAnalytics({client,config,jobs,now=()=>new Date(),sleep}){
 const bindings=config.base.analyticsTableIds;if(!bindings)return {status:'disabled'};
 if(jobs.listActive().length)return {status:'deferred',reason:'sync_active'};
 const lockKey='analytics:'+digest(config.base.appToken),ownerId=randomUUID();
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))return {status:'deferred',reason:'projection_busy'};
 const renew=()=>{if(jobs.listActive().length)fail('同步运行中，暂停统计写入');if(!jobs.renewMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))fail('统计写入锁丢失');};
 try{
  const data=await readAnalytics({client,config,jobs,now:now()});renew();const results={};
  // Ledger integrity piggybacks on the full four-table read done for the reports.
  let integrity=null;
  if(jobs.db){try{integrity=recordIntegrityIssues(jobs.db,ledgerIntegrityIssues(data.source,data.issues),{now:now()});}catch(error){integrity={status:'failed',error:{code:error?.code??'integrity_record_failed'}};}}
  const options={client,config,jobs,now,sleep,renew};
  results.accounts=await projectReportTable({...options,tableId:config.base.tableIds.accounts,spec:{name:'账号台账',key:['账号ID'],existing:true,fields:{'账号ID':'text',...ACCOUNT_ANALYTICS_FIELDS}},rows:data.accounts});
  for(const [k,spec]of Object.entries(ANALYTICS_TABLES))results[k]=await projectReportTable({...options,tableId:bindings[k],spec,rows:data[k],clearMissing:clearsMissingRows(k,data)});
  return {status:data.issues.length?'partial':'success',eligible_releases:data.eligible_releases,excluded_releases:data.excluded_releases,issues:data.issues,tables:results,...(integrity?{integrity}:{})};
 }finally{jobs.releaseMutationLease({lockKey,ownerId});}
}
