import {createHash,randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {baseBinding} from './human-ops.mjs';
import {canonicalDateTimePatch} from './feishu-client.mjs';
import {BASE_FIELD_SPECS,TABLES,assertPatchAllowed} from './schema.mjs';
import {ShortDramaError} from './errors.mjs';
const fail=(code,message)=>{throw new ShortDramaError(code,message);};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const batchBinding=repos=>hash(Object.fromEntries(['accounts','dramas','captures','releases'].map(k=>[k,[repos[k].appToken,repos[k].tableId]])));
const normalize=patch=>canonicalDateTimePatch('发布记录',Object.fromEntries(Object.entries(patch).map(([k,v])=>[k,v===''&&BASE_FIELD_SPECS['发布记录'].find(f=>f.name===k)?.kind==='text'?null:v])));
const protectedFields=[...TABLES['发布记录'].human,...TABLES['发布记录'].shared,'发布ID','采集记录'];
const snapshot=r=>({record_id:r.record_id,fields:Object.fromEntries(protectedFields.map(k=>[k,r.fields[k]??null]))});

/** Only compares live rows to a previously confirmed immutable schedule; never writes. */
export async function inspectScheduleRepair({jobs,repos,batchId,parentReceiptId,settledAbsence=null,now=new Date()}){
 const parent=jobs.getPreview(parentReceiptId),humanBinding=baseBinding(repos);
 if(!parent||!parent.used_at||parent.action!=='batch_schedule'||parent.target_table!=='发布记录'||parent.target_key!==batchId||parent.patch?.batch_id!==batchId||parent.patch.binding!==batchBinding(repos))fail('batch_repair_source_invalid','Repair requires the consumed schedule receipt for this exact Base and batch');
 const ids=parent.patch.children;
 if(!Array.isArray(ids)||ids.length<1||ids.length>30||new Set(ids).size!==ids.length)fail('batch_repair_source_invalid','Original schedule children are invalid');
 const reviewed = new Set();
 if(settledAbsence!==null){
  const verified=Date.parse(settledAbsence?.verified_at),clock=now.getTime();
  if(!settledAbsence||Object.keys(settledAbsence).sort().join('|')!=='receipt_ids|verified_at'||!Array.isArray(settledAbsence.receipt_ids)||!settledAbsence.receipt_ids.length||new Set(settledAbsence.receipt_ids).size!==settledAbsence.receipt_ids.length||!Number.isFinite(verified)||verified>clock+60000||clock-verified>15*60000)fail('batch_repair_absence_invalid','Settled absence must be explicitly reviewed within 15 minutes');
  for(const id of settledAbsence.receipt_ids){const child=jobs.getPreview(id);if(!ids.includes(id)||!child?.used_at||!Number.isFinite(Date.parse(child.used_at))||verified-Date.parse(child.used_at)<5*60000)fail('batch_repair_absence_invalid','Absence review must name an original consumed child settled for at least five minutes');reviewed.add(id);}
 }
 const planned=ids.map((id,index)=>{
  const child=jobs.getPreview(id),e=child?.patch;
  if(!child||child.actor_id!==parent.actor_id||child.chat_id!==parent.chat_id||child.action!=='create'||child.target_table!=='发布记录'||e?.base_binding!==humanBinding||e.action!=='create'||e.table!=='发布记录'||e.id_generation!=='base_auto_number'||e.targets?.length!==1)fail('batch_repair_source_invalid','Child is not a bound generated create');
  const patch=normalize(e.targets[0].patch);assertPatchAllowed('发布记录',patch,'human');
  if(patch.批次ID!==batchId||patch.计划序号!==index+1||patch.批次计划条数!==ids.length||patch.归档状态!=='active'||!patch.日期||!patch.计划发布时间||patch.账号?.length!==1||patch.剧?.length!==1||patch.处理负责人?.length!==1)fail('batch_repair_source_invalid','Original plan metadata is inconsistent');
  return {sequence:index+1,patch,receipt_id:id};
 });
 const identity=patch=>Object.fromEntries(Object.entries(patch).filter(([k])=>k!=='计划序号'));
 if(planned.some(p=>!isDeepStrictEqual(identity(p.patch),identity(planned[0].patch))))fail('batch_repair_source_invalid','Original slots disagree');
 const index=await repos.releases.loadIndex();const members=[...index].filter(([,r])=>r.fields.批次ID===batchId).sort((a,b)=>a[1].fields.计划序号-b[1].fields.计划序号);
 const seen=new Set(),existing=[];
 for(const [id,row]of members){
  const seq=row.fields.计划序号,p=planned.find(p=>p.sequence===seq);
  if(!p||seen.has(seq))fail('batch_repair_conflict','Duplicate or unexpected live slot');seen.add(seq);
  if(row.fields['Post ID']||row.fields.视频链接||row.fields.采集记录?.length)fail('batch_repair_conflict','Published or linked slots require separate review');
  const actual=normalize(row.fields);
  if(Object.entries(p.patch).some(([k,v])=>!isDeepStrictEqual(actual[k]??null,v??null)))fail('batch_repair_conflict','Existing row differs from the approved schedule');
  existing.push({sequence:seq,release_id:id,record_id:row.record_id,snapshot:snapshot(row)});
 }
 const missing=planned.filter(p=>!seen.has(p.sequence));
 // Even a failed/expired child that was attempted cannot be blindly replayed.
 const attempts=jobs.db.prepare("SELECT receipt_id,patch_json FROM preview_receipts WHERE action='create' AND target_table='发布记录' AND used_at IS NOT NULL").all().map(r=>({id:r.receipt_id,envelope:JSON.parse(r.patch_json)})).filter(r=>r.envelope.base_binding===humanBinding);
 const preflightRejected = new Set();
 for(const audit of jobs.db.prepare("SELECT before_json,after_json,readback_json FROM audit_events WHERE action='batch-partial' AND target_key=?").all(batchId)){
  const before=JSON.parse(audit.before_json),after=JSON.parse(audit.after_json),readback=JSON.parse(audit.readback_json);
  if(before.receipt_id===parentReceiptId&&readback.cause_details?.write_attempted===false&&readback.cause_details?.phase==='generated_create_preflight')preflightRejected.add(after.failed_receipt);
 }
 for(const p of missing)if(attempts.some(r=>r.envelope.targets?.some(t=>t.patch?.批次ID===batchId&&t.patch.计划序号===p.sequence)&&!reviewed.has(r.id)&&!preflightRejected.has(r.id)))fail('batch_repair_write_uncertain','A missing slot already has a consumed create attempt; inspect acknowledgement before repairing');
 const version=hash({batchId,parentReceiptId,planned,existing,settledAbsence});
 return {batch_id:batchId,parent_receipt_id:parentReceiptId,version,settled_absence:settledAbsence,planned_count:planned.length,existing,missing};
}

/** One-shot maintenance requests, explicitly armed in config after inspection. */
export async function processScheduleRepairs({jobs,repos,requests=[],now=()=>new Date()}){
 if(!requests.length)return {status:'disabled',created:0,repaired:[],errors:[]};
 const binding=baseBinding(repos),lockKey=`human-base:${binding}`,ownerId=`schedule-repair-${randomUUID()}`;
 if(!binding)fail('batch_repair_config_invalid','Base binding is invalid');
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))return {status:'deferred',created:0,repaired:[],errors:[]};
 const controller=new AbortController();let leaseError=null;
 const renew=()=>{try{jobs.renewMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300});}catch(e){leaseError=e;controller.abort();}};
 const check=()=>{renew();if(leaseError)throw leaseError;};const timer=setInterval(renew,1000);timer.unref?.();
 const result={status:'success',created:0,repaired:[],errors:[]};
 try{
  jobs.db.exec(`CREATE TABLE IF NOT EXISTS batch_schedule_repairs (repair_key TEXT PRIMARY KEY,batch_id TEXT NOT NULL,parent_receipt_id TEXT NOT NULL,state TEXT NOT NULL,plan_json TEXT NOT NULL,created_json TEXT NOT NULL,updated_at TEXT NOT NULL,error_code TEXT)`);
  for(const request of requests){
   const key=`${binding}:${request.batch_id}`;const old=jobs.db.prepare('SELECT state FROM batch_schedule_repairs WHERE repair_key=?').get(key);
   if(old?.state==='complete'){result.repaired.push({batch_id:request.batch_id,status:'already_repaired'});continue;}
   if(old){result.errors.push({batch_id:request.batch_id,code:'batch_repair_requires_inspection'});continue;}
   let started=false;const created=[];
   try{
    check();const plan=await inspectScheduleRepair({jobs,repos,batchId:request.batch_id,parentReceiptId:request.parent_receipt_id,settledAbsence:request.settled_absence??null,now:now()});check();
    if(plan.version!==request.expected_version)fail('batch_repair_stale','Live rows changed since repair was approved');
    jobs.db.prepare("INSERT INTO batch_schedule_repairs VALUES(?,?,?,'started',?,'[]',?,NULL)").run(key,request.batch_id,request.parent_receipt_id,JSON.stringify(plan),now().toISOString());started=true;
    for(const item of plan.missing){
     const current=await inspectScheduleRepair({jobs,repos,batchId:request.batch_id,parentReceiptId:request.parent_receipt_id,settledAbsence:request.settled_absence??null,now:now()});check();
     const expectedSequences=[...plan.existing.map(x=>x.sequence),...created.map(x=>x.sequence)].sort((a,b)=>a-b);
     if(!isDeepStrictEqual(current.existing.map(x=>x.sequence).sort((a,b)=>a-b),expectedSequences)||!current.missing.some(x=>x.sequence===item.sequence)||plan.existing.some(x=>!isDeepStrictEqual(current.existing.find(y=>y.sequence===x.sequence)?.snapshot,x.snapshot)))fail('batch_repair_stale','Slots changed before recovery write');
     const written=await repos.releases.createWithGeneratedId(item.patch,'human',{signal:controller.signal});check();
     if(written.readback!=='verified')fail('readback_mismatch','Recovery requires verified create acknowledgement');
     const entry={sequence:item.sequence,release_id:written.record.fields.发布ID,record_id:written.record.record_id};created.push(entry);result.created++;
     jobs.db.prepare('UPDATE batch_schedule_repairs SET created_json=?,updated_at=? WHERE repair_key=?').run(JSON.stringify(created),now().toISOString(),key);
     jobs.appendAudit({actorId:'system:batch-repair',action:'repair-schedule-slot',targetTable:'发布记录',targetKey:entry.release_id,before:{batch_id:plan.batch_id,original_receipt:plan.parent_receipt_id,missing_sequence:item.sequence},after:{patch:item.patch},readback:written.record,now:now()});
    }
    const final=await inspectScheduleRepair({jobs,repos,batchId:request.batch_id,parentReceiptId:request.parent_receipt_id,settledAbsence:request.settled_absence??null,now:now()});check();
    if(final.missing.length||plan.existing.some(x=>!isDeepStrictEqual(final.existing.find(y=>y.sequence===x.sequence)?.snapshot,x.snapshot)))fail('readback_mismatch','Repair did not produce exact complete slots while preserving originals');
    jobs.db.prepare("UPDATE batch_schedule_repairs SET state='complete',updated_at=? WHERE repair_key=?").run(now().toISOString(),key);result.repaired.push({batch_id:plan.batch_id,status:'verified',created,all_release_ids:final.existing.map(x=>x.release_id)});
   }catch(e){const code=e.code??'batch_repair_uncertain';if(started)jobs.db.prepare("UPDATE batch_schedule_repairs SET state='uncertain',error_code=?,updated_at=? WHERE repair_key=?").run(code,now().toISOString(),key);result.errors.push({batch_id:request.batch_id,code,created});if(leaseError)break;}
  }
  if(result.errors.length)result.status='partial';return result;
 }finally{clearInterval(timer);jobs.releaseMutationLease({lockKey,ownerId});}
}
