import {createHash,randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {ShortDramaError} from './errors.mjs';
const action='daily_boundary_snapshot',table='每日播放趋势';
const columns=['snapshot_date','captured_at','post_id','username','published_at','views','likes','comments','favorites','shares'];
const metrics=['views','likes','comments','favorites','shares'];
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=message=>{throw new ShortDramaError('calendar_snapshot_invalid',message);};
function canonical(rows,date){
 const seen=new Set();
 return rows.map(r=>{
  if(r.snapshot_date!==date||!/^\d+$/.test(r.post_id)||!r.username||!Number.isFinite(Date.parse(r.captured_at))||seen.has(r.post_id))fail('Invalid calendar snapshot identity');
  seen.add(r.post_id);
  for(const k of metrics)if(r[k]!=null&&(!Number.isSafeInteger(r[k])||r[k]<0))fail('Invalid calendar snapshot metric');
  return Object.fromEntries(columns.map(k=>[k,r[k]??null]));
 }).sort((a,b)=>a.post_id.localeCompare(b.post_id));
}
export function selectCalendarSnapshots({rows,config,jobs=null,now=new Date()}){
 if(config.dailyReporting?.mode!=='calendar_day')return rows;
 const start=config.dailyReporting.startDate,asOf=new Date(now.getTime()+28800000).toISOString().slice(0,10);
 const prefix='calendar-boundary:'+hash([config.base.appToken,start])+':';
 const db=jobs?.db??new DatabaseSync(config.paths.opsSqlite,{readOnly:true});
 const lockKey=prefix+'freeze',ownerId=randomUUID();let leased=false;
 const load=()=>{const result=new Map();for(const r of db.prepare('SELECT target_key,after_json FROM audit_events WHERE action=? AND target_table=? AND target_key LIKE ? ORDER BY target_key').all(action,table,prefix+'%')){
  const value=JSON.parse(r.after_json);if(!/^\d{4}-\d{2}-\d{2}$/.test(value.date)||r.target_key!==prefix+value.date||!Array.isArray(value.rows)||hash(value.rows)!==value.sha256||result.has(value.date))fail('Calendar snapshot journal is inconsistent');
  canonical(value.rows,value.date);if(value.date<=asOf)result.set(value.date,value.rows);
 }return result;};
 try{
  if(jobs){if(!jobs.acquireMutationLease({lockKey,ownerId,now,leaseSeconds:300}))fail('Calendar snapshot journal is busy');leased=true;}
  const existing=load();
  if(jobs){
   const groups=new Map();for(const r of rows)if(r.snapshot_date>=start&&r.snapshot_date<=asOf){const group=groups.get(r.snapshot_date)??[];group.push(r);groups.set(r.snapshot_date,group);}
   // Validate all new snapshots before preserving any of them.
   const pending=[...groups].filter(([date])=>!existing.has(date)).map(([date,rs])=>({date,rows:canonical(rs,date)}));
   for(const snapshot of pending){const sha256=hash(snapshot.rows);jobs.appendAudit({actorId:null,action,targetTable:table,targetKey:prefix+snapshot.date,before:{},after:{...snapshot,sha256},readback:{date:snapshot.date,sha256,rows:snapshot.rows.length},now});}
  }
  const saved=load();return [...rows.filter(r=>r.snapshot_date<start),...[...saved].sort(([a],[b])=>a.localeCompare(b)).flatMap(([,rs])=>rs)];
 }finally{if(leased)jobs.releaseMutationLease({lockKey,ownerId});if(!jobs)db.close();}
}
