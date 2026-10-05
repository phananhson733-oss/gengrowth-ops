import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { BASE_FIELD_SPECS, TABLES } from './schema.mjs';
import { canonicalDramaName } from './migration.mjs';
import { ShortDramaError } from './errors.mjs';
import { seedBusinessIdSequence } from './ids.mjs';

export const RECONCILE_TABLES = Object.freeze({accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'});
const METRICS = ['播放量','点赞','评论','收藏','转发'];
const RELEASE_FIELDS = ['日期','账号名','剧名','剧ID（RS Boost）','视频链接','Post ID','RS收益','备注'];
const fail = (code, message, details={}) => { throw new ShortDramaError(code,message,details); };
const normalize = x => typeof x==='string' ? x.trim() || null : x ?? null;
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x==='object' ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])) : x;
const equal = (a,b) => isDeepStrictEqual(stable(a),stable(b));
function cellEqual(table,field,a,b){
 const kind=BASE_FIELD_SPECS[table].find(s=>s.name===field)?.kind;
 if(['multi_select','link'].includes(kind))return equal((a??[]).map(stable).sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y))),(b??[]).map(stable).sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y))));
 return equal(a??null,b??null);
}
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
export const reconciliationSourceDigest = google => hash(Object.fromEntries(Object.keys(RECONCILE_TABLES).map(k=>[k,google[k]])));
export const reconciliationDigest = p => { const {sha256,...rest}=p; return hash(rest); };
const fieldsFor = table => [...TABLES[table].human,...TABLES[table].machine,...TABLES[table].shared];
function canonicalCell(table,field,value) {
 const kind=BASE_FIELD_SPECS[table].find(s=>s.name===field)?.kind;
 if(['multi_select','link'].includes(kind))return (value??[]).map(stable).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 return value??null;
}
const writableSnapshot = snapshot => Object.fromEntries(Object.entries(RECONCILE_TABLES).map(([key,table])=>[key,snapshot[key].map(r=>({record_id:r.record_id,fields:Object.fromEntries(fieldsFor(table).map(f=>[f,canonicalCell(table,f,r.fields[f])]))})).sort((a,b)=>a.record_id.localeCompare(b.record_id))]));
function canonicalSchema(schema) {
 // The adapter revision is itself generated from API ordering. Preserve all
 // descriptors, but compare unordered table/field collections by stable IDs.
 const {revision,tables,...metadata}=schema;
 return {...metadata,tables:tables.map(t=>{
  const {revision,fields,...descriptor}=t;
  return {...descriptor,fields:[...fields].sort((a,b)=>a.field_id.localeCompare(b.field_id))};
 }).sort((a,b)=>a.table_id.localeCompare(b.table_id))};
}
function actionableOperations(operations) {
 return Object.fromEntries(Object.entries(operations).map(([table,kinds])=>[table,
  Object.fromEntries(Object.entries(kinds).map(([kind,rows])=>[kind,rows.map(({key,record_id,patch,capture_post_id=null})=>({key,record_id,capture_post_id,
   patch:Object.fromEntries(Object.entries(patch).map(([f,v])=>[f,canonicalCell(RECONCILE_TABLES[table],f,v)]))
  })).sort((a,b)=>a.key.localeCompare(b.key))]))
 ]));
}
function date(value) {
 value=normalize(value);if(value===null)return null;
 if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
 return m ? `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}` : value;
}
function unique(rows,key) {
 const map=new Map();
 for(const row of rows){const id=key(row);if(!id || map.has(id))fail('reconcile_duplicate_key','Blank or duplicate reconciliation identity');map.set(id,row);}
 return map;
}
function maxId(rows,field,prefix){return rows.reduce((n,r)=>{const m=new RegExp(`^${prefix}-(\\d+)$`).exec(r.fields[field]);if(!m)fail('reconcile_invalid_id','Existing business ID is malformed');return Math.max(n,Number(m[1]));},0);}
const formatId=(prefix,n)=>`${prefix}-${String(n).padStart(6,'0')}`;
function releaseSignature(row){return RELEASE_FIELDS.map(f=>{let v=normalize(row[f]);if(f==='日期')v=date(v);if(f==='RS收益'&&v!==null)v=Number(String(v).replaceAll(',',''));return v;});}
function originalReleases(baseline){return backupReleaseRows(baseline.source_backup);}
function backupReleaseRows(backup){
 if(Array.isArray(backup.releases))return backup.releases;
 const [headers,...rows]=backup.formatted.releases;
 return rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]??null]))).filter(r=>['日期','账号名','剧名','视频链接','Post ID'].some(f=>normalize(r[f])!==null));
}
function mergedDramas(rows) {
 const groups=new Map();rows.forEach((r,i)=>{const k=canonicalDramaName(r.剧名);groups.set(k,[...(groups.get(k)??[]),{...r,source_row:r.source_row??i+2}]);});
 return [...groups.values()].map(rs=>{
  const out={剧名:rs[0].剧名.trim(),归档状态:'active'};
  for(const spec of BASE_FIELD_SPECS['选剧池'].filter(s=>TABLES['选剧池'].human.includes(s.name)&&s.name!=='归档状态')){
   const f=spec.name;if(f==='剧名')continue;
   const values=rs.map(r=>normalize(r[f]));
   if(spec.kind==='multi_select'){out[f]=[...new Set(values.flatMap(v=>v??[]))];continue;}
   const distinct=[...new Set(values.filter(v=>v!==null))];
   if(['备注','推荐理由'].includes(f))out[f]=distinct.length>1?rs.filter(r=>normalize(r[f])!==null).map(r=>`[来源：Google 选剧池第 ${r.source_row} 行] ${normalize(r[f])}`).join('\n\n'):distinct[0]??null;
   else if(f==='生命周期'&&distinct.length>1&&distinct.every(v=>['新剧','在推'].includes(v)))out[f]='在推';
   else {if(distinct.length>1)fail('reconcile_drama_conflict','Conflicting source values for one drama',{name:out.剧名,field:f});out[f]=distinct[0]??null;}
  }
  if(out.平台==='MoboReels')out.平台='其他';
  return out;
 });
}
function validateValues(table,patch){
 for(const [f,value] of Object.entries(patch)){
  const spec=BASE_FIELD_SPECS[table].find(s=>s.name===f);if(!spec || !fieldsFor(table).includes(f))fail('reconcile_field_invalid','Unknown or derived patch field',{table,field:f});
  if(value===null)continue;
  if(spec.kind==='number'&&(!Number.isFinite(value)))fail('reconcile_value_invalid','Non-numeric source metric',{table,field:f});
  if(spec.kind==='multi_select'&&(!Array.isArray(value)||value.some(v=>typeof v!=='string')))fail('reconcile_value_invalid','Malformed multi-select source',{table,field:f});
  if(spec.options){const values=Array.isArray(value)?value:[value];if(values.some(v=>!spec.options.includes(v)))fail('reconcile_value_invalid','Source value outside fixed options',{table,field:f});}
 }
}

function sourcePostIdentity(value){
 try{const url=new URL(value);const match=/^\/@([^/]+)\/(?:video|photo)\/(\d+)\/?$/.exec(url.pathname);
  if(url.protocol!=='https:'||!(url.hostname==='tiktok.com'||url.hostname.endsWith('.tiktok.com'))||!match)return null;
  return {account:decodeURIComponent(match[1]).toLowerCase(),post:match[2]};
 }catch{return null;}
}
function resolveOperationPatch(table,op,captures){
 const patch=structuredClone(op.patch);if(!op.capture_post_id)return patch;
 if(table!=='releases'||patch['Post ID']!==op.capture_post_id)fail('reconcile_relation_invalid','Only the declared release post can bind a capture');
 const capture=captures?.get(op.capture_post_id);if(!capture)fail('reconcile_relation_missing','Planned capture must be verified before creating its release');
 patch.采集记录=[{id:capture.record_id}];return patch;
}

export function planGoogleReconciliation({google,snapshot,schema,baseline,baseBindingSha256,now,sequences={},schemaCheckpoint=null,completedReleaseIds=[]}) {
 if(!/^[a-f0-9]{64}$/.test(baseBindingSha256)||!Number.isFinite(Date.parse(now)))fail('reconcile_input_invalid','Binding and timestamp required');
 for(const k of Object.keys(RECONCILE_TABLES))if(!Array.isArray(google[k])||!Array.isArray(snapshot[k]))fail('reconcile_input_invalid','Complete four-table snapshots required');
 const indexes=Object.fromEntries(Object.entries(RECONCILE_TABLES).map(([k,t])=>[k,unique(snapshot[k],r=>r.fields[TABLES[t].primaryField])]));
 const operations=Object.fromEntries(Object.keys(RECONCILE_TABLES).map(k=>[k,{creates:[],updates:[]}])) ;
 function add(k,id,patch,capturePostId=null){
  const table=RECONCILE_TABLES[k];validateValues(table,patch);const prior=indexes[k].get(id);
  const changed=Object.fromEntries(Object.entries(patch).filter(([f,v])=>!prior || !cellEqual(table,f,prior.fields[f],v)));
  if(!Object.keys(changed).length)return;
  operations[k][prior?'updates':'creates'].push({key:id,record_id:prior?.record_id??null,before:prior?.fields??null,patch:prior?changed:{[TABLES[table].primaryField]:id,...patch},...(capturePostId?{capture_post_id:capturePostId}:{})});
 }
 const accounts=unique(google.accounts,r=>r.账号ID??r.账号名.toLowerCase());
 for(const [key,row] of accounts){
  if(!indexes.accounts.has(key))fail('reconcile_account_missing','Create the source account binding before reconciling its references',{account:key});
  const patch=Object.fromEntries(['账号名','主页链接','粉丝数','所属组','定位垂类','表现形式','状态','数据日期'].map(f=>[f,normalize(row[f])]));
  add('accounts',key,patch);
 }
 let dramaId=Math.max(maxId(snapshot.dramas,'剧ID','SD'),sequences.drama??0);
 const dramasByName=unique(snapshot.dramas,r=>canonicalDramaName(r.fields.剧名));
 for(const row of mergedDramas(google.dramas)){const existing=dramasByName.get(canonicalDramaName(row.剧名));if(existing)row.归档状态=existing.fields.归档状态??'active';add('dramas',existing?.fields.剧ID??formatId('SD',++dramaId),row);}
 const accountRelation=name=>{const r=indexes.accounts.get(String(name).replace(/^@/,'').toLowerCase());if(!r)fail('reconcile_account_missing','Source account relation is unresolved',{account:name});return [{id:r.record_id}];};
 unique(google.captures,r=>r['Post ID']);
 for(const row of google.captures){
  const key=row['Post ID'];if(!/^\d+$/.test(key))fail('reconcile_value_invalid','Post IDs must remain exact decimal strings');
  const patch={账号:accountRelation(row.账号名),快照日期:row.快照日期,视频链接:normalize(row.视频链接),...Object.fromEntries(METRICS.map(f=>[f,normalize(row[f])]))};
  const missing=METRICS.map((f,i)=>patch[f]===null?['views','likes','comments','favorites','shares'][i]:null).filter(Boolean);
  patch.采集状态=missing.length?'partial':'complete';patch.缺失字段=missing;
  if(!indexes.captures.has(key))Object.assign(patch,{业务:normalize(row.业务)??'short-drama',发布时间:null,采集时间:null,'来源 run_id':`reconcile:google:${hash(google.captures)}`,'Base 同步时间':new Date(Math.floor(Date.parse(now)/1000)*1000).toISOString()});
  add('captures',key,patch);
 }
 const sourcePosts=unique(google.captures,r=>r['Post ID']);
 const basePostsById=new Map(snapshot.captures.map(r=>[r.record_id,r.fields['Post ID']]));
 const claimedPosts=new Set();
 for(const row of snapshot.releases){
  const claims=new Set([normalize(row.fields['Post ID']),sourcePostIdentity(row.fields.视频链接)?.post,...(row.fields.采集记录??[]).map(ref=>basePostsById.get(ref.id))].filter(Boolean));
  for(const post of claims){if(claimedPosts.has(post))fail('reconcile_release_mapping_changed','Existing releases have duplicate post claims');claimedPosts.add(post);}
 }
 const previous=originalReleases(baseline);
 if(!Array.isArray(completedReleaseIds)||new Set(completedReleaseIds).size!==completedReleaseIds.length||completedReleaseIds.some(id=>!indexes.releases.has(id))||snapshot.releases.length!==previous.length+completedReleaseIds.length)fail('reconcile_release_mapping_changed','Existing release rows no longer match the migration baseline; review partial reconciliation before retry');
 if(google.releases.length<previous.length)fail('reconcile_release_mapping_changed','Google source removed release rows; manual mapping required');
 for(let i=0;i<previous.length;i++){
  if(!equal(releaseSignature(previous[i]),releaseSignature(google.releases[i]))||!indexes.releases.has(formatId('SR',i+1)))fail('reconcile_release_mapping_changed','Existing source release identity changed; do not guess the mapping',{source_row:i+2});
 }
 let releaseId=Math.max(maxId(snapshot.releases,'发布ID','SR'),sequences.release??0);
 if(completedReleaseIds.length>google.releases.length-previous.length)fail('reconcile_release_mapping_changed','Completed release mapping exceeds source rows');
 for(const [offset,row] of google.releases.slice(previous.length).entries()){
  if(completedReleaseIds[offset])continue;
  // Newly added incomplete rows are preserved as incomplete, never invented.
  const dramaName=normalize(row.剧名);const linked=dramaName?dramasByName.get(canonicalDramaName(dramaName)):null;
  if(dramaName&&!linked)fail('reconcile_release_mapping_changed','New release references a not-yet-bound drama');
  const post=normalize(row['Post ID']),url=normalize(row.视频链接);let capturePostId=null;
  if(post||url){
   const identity=sourcePostIdentity(url),account=String(row.账号名).replace(/^@/,'').toLowerCase();
   if(!post||!identity||identity.post!==post||identity.account!==account||claimedPosts.has(post))fail('reconcile_release_mapping_changed','Release evidence must identify a unique post belonging to its account');
   claimedPosts.add(post);const capture=sourcePosts.get(post);
   if(capture){const captureIdentity=sourcePostIdentity(capture.视频链接);if(!captureIdentity||captureIdentity.post!==post||captureIdentity.account!==account||String(capture.账号名).replace(/^@/,'').toLowerCase()!==account)fail('reconcile_release_mapping_changed','Source capture and release evidence disagree');capturePostId=post;}
  }
  add('releases',formatId('SR',++releaseId),{日期:date(row.日期),账号:accountRelation(row.账号名),剧:linked?[{id:linked.record_id}]:[],采集记录:[], '剧ID（RS Boost）':normalize(row['剧ID（RS Boost）']),RS收益:normalize(row.RS收益),备注:normalize(row.备注),归档状态:'active','Post ID':post,视频链接:url,
   ...(capturePostId?{匹配方式:'exact_post_id',匹配置信度:1}:post?{同步错误:'待采集：Google 采集数据暂无此 Post ID'}:{})},capturePostId);
 }
 const schema_changes=[];
 for(const [k,t] of Object.entries(RECONCILE_TABLES)){
  const table=schema.tables.find(x=>x.name===t);if(!table)fail('reconcile_schema_invalid','Missing configured table');
  for(const spec of BASE_FIELD_SPECS[t].filter(s=>s.optionPolicy==='manifest_append')){
   const field=table.fields.find(f=>f.name===spec.name);if(!Array.isArray(field?.options))fail('reconcile_schema_invalid','Missing source option catalog');
   const before=field.options.map(o=>o.name);const needed=operations[k].creates.concat(operations[k].updates).flatMap(op=>{const v=op.patch[spec.name];return v===undefined||v===null?[]:Array.isArray(v)?v:[v];});
   const after=[...new Set([...before,...needed])];if(after.length>before.length)schema_changes.push({table:k,field:spec.name,field_id:field.field_id,before,after});
  }
 }
 const plan={version:'shortdrama-google-reconciliation/v2',generated_at:now,base_binding_sha256:baseBindingSha256,source_sha256:reconciliationSourceDigest(google),base_sha256:hash(writableSnapshot(snapshot)),schema_sha256:hash(canonicalSchema(schema)),baseline_sha256:hash(baseline),operations,schema_changes,sequence_seeds:{drama:dramaId,release:releaseId},source_backup:google.raw_backup??google,base_backup:snapshot,schema_backup:schema,schema_checkpoint:schemaCheckpoint,completed_release_ids:completedReleaseIds};
 plan.sha256=reconciliationDigest(plan);return structuredClone(plan);
}
export async function applyGoogleReconciliation({plan,expectedSha256,current,writer}){
 if(plan?.version!=='shortdrama-google-reconciliation/v2'||plan.sha256!==expectedSha256||reconciliationDigest(plan)!==expectedSha256)fail('reconcile_plan_invalid','Reconciliation plan digest mismatch');
 if(Date.parse(current.now)-Date.parse(plan.generated_at)>30*60*1000 || Date.parse(current.now)<Date.parse(plan.generated_at))fail('reconcile_stale','Reconciliation plan expired');
 const fresh=planGoogleReconciliation({...current,now:plan.generated_at});
 const comparisons={
  base_binding:[plan.base_binding_sha256,fresh.base_binding_sha256],
  source_data:[plan.source_sha256,fresh.source_sha256],
  target_data:[plan.base_sha256,fresh.base_sha256],
  schema:[plan.schema_sha256,fresh.schema_sha256],
  baseline:[plan.baseline_sha256,fresh.baseline_sha256],
  operations:[actionableOperations(plan.operations),actionableOperations(fresh.operations)],
  schema_changes:[plan.schema_changes,fresh.schema_changes],
  id_sequences:[plan.sequence_seeds,fresh.sequence_seeds],
  schema_checkpoint:[plan.schema_checkpoint?.sha256??null,fresh.schema_checkpoint?.sha256??null],
  completed_release_ids:[plan.completed_release_ids??[],fresh.completed_release_ids??[]],
 };
 const changed=Object.entries(comparisons).filter(([,pair])=>!equal(...pair)).map(([name])=>name);
 if(changed.length)fail('reconcile_stale','Reviewed reconciliation inputs changed; generate a new plan',{changed_components:changed});
 return writer.apply(plan);
}

export function unresolvedReconciliations(jobs) {
 return jobs.db.prepare(`SELECT i.target_key, i.after_json FROM audit_events i WHERE i.action = 'reconcile_intent'
 AND NOT EXISTS (SELECT 1 FROM audit_events r WHERE r.action = 'reconcile_resolved' AND r.target_key = i.target_key)`).all();
}
export function assertNoUnresolvedReconciliation(jobs) {
 const pending=unresolvedReconciliations(jobs);
 if(pending.length)fail('reconcile_unresolved_attempt','A previous write has an unknown outcome; recover its readback before replanning',{attempts:pending.map(x=>x.target_key)});
}
export function createGoogleReconciliationWriter({client,repos,config,jobs,actorId,now=()=>new Date(),sleep=ms=>new Promise(r=>setTimeout(r,ms))}) {
 return {async apply(plan){
  if(!config.auth.isPrivilegedAllowed(actorId))fail('privileged_required','Reconciliation requires an allowlisted local administrator');
  assertNoUnresolvedReconciliation(jobs);
  if(jobs.listActive().length)fail('reconcile_busy','Stop active/queued synchronization before reconciliation');
  const binding=hash({appToken:config.base.appToken,tables:config.base.tableIds});
  const lockKey=`human-base:${binding}`,ownerId=`reconcile-${randomUUID()}`;
  if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))fail('reconcile_busy','Another business mutation holds the lease');
  const controller=new AbortController();let lost=null;
  const renew=()=>{if(lost)throw lost;if(jobs.listActive().length)fail('reconcile_busy','Synchronization started during reconciliation');jobs.renewMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300});};
  const timer=setInterval(()=>{try{renew();}catch(e){lost=e;controller.abort();}},1000);timer.unref();
  const step=async fn=>{renew();const result=await fn(controller.signal);renew();return result;};
  const counters={created:0,updated:0,schema_fields_extended:0};
  try {
   seedBusinessIdSequence(jobs.db,'drama',plan.sequence_seeds.drama);
   seedBusinessIdSequence(jobs.db,'release',plan.sequence_seeds.release);
   const intent=(table,kind,operations)=>{
    const key=`${plan.sha256}:${table}:${kind}`;
    jobs.appendAudit({actorId,action:'reconcile_intent',targetTable:RECONCILE_TABLES[table],targetKey:key,before:{},after:{plan_sha256:plan.sha256,table,kind,operations},readback:{state:'pending'},now:now()});return key;
   };
   const resolveIntent=(key,table)=>jobs.appendAudit({actorId,action:'reconcile_resolved',targetTable:RECONCILE_TABLES[table],targetKey:key,before:{},after:{state:'verified'},readback:{state:'verified'},now:now()});
   for(const change of plan.schema_changes){
    const key=change.table;const result=await step(signal=>client.listFields(config.base.appToken,config.base.tableIds[key],{signal}));
    const field=result.items.find(f=>f.field_id===change.field_id);
    if(!result.complete||!equal(field?.options?.map(o=>o.name),change.before))fail('reconcile_stale','Select options changed since preview');
    const attemptKey=intent(key,`schema:${change.field}`,[change]);
    await step(signal=>client.updateSelectFieldOptions(config.base.appToken,config.base.tableIds[key],change.field_id,RECONCILE_TABLES[key],change.field,change.after,{signal}));
    for(let attempt=1;;attempt++){
     const after=await step(signal=>client.listFields(config.base.appToken,config.base.tableIds[key],{signal}));
     const actual=after.items?.find(f=>f.field_id===change.field_id)?.options?.map(o=>o.name);
     if(after.complete&&equal(actual,change.after))break;
     if(!after.complete||!equal(actual,change.before)||attempt>=5)fail('readback_mismatch','Option extension did not read back');
     await step(()=>sleep(attempt*1000));
    }
    jobs.appendAudit({actorId,action:'reconcile_schema',targetTable:RECONCILE_TABLES[key],targetKey:change.field,before:change.before,after:change.after,readback:change.after,now:now(),runId:attemptKey});resolveIntent(attemptKey,key);counters.schema_fields_extended++;
   }
   for(const [key,table] of Object.entries(RECONCILE_TABLES)){
    const ops=plan.operations[key];if(!ops.creates.length&&!ops.updates.length)continue;
    const current=await step(signal=>repos[key].loadIndex({signal}));
    const snapshot={...plan.base_backup,[key]:[...current.values()]};
    if(!equal(writableSnapshot(snapshot)[key],writableSnapshot(plan.base_backup)[key]))fail('reconcile_stale','Base rows changed before table write',{table});
    // A verified/audited update batch must finish before a create batch starts.
    for(const kind of ['updates','creates']){
     const logicalBatch=ops[kind];if(!logicalBatch.length)continue;
     const captureIndex=logicalBatch.some(op=>op.capture_post_id)?await step(signal=>repos.captures.loadIndex({signal})):null;
     const batch=logicalBatch.map(op=>({...op,patch:resolveOperationPatch(key,op,captureIndex)}));
     const attemptKey=intent(key,kind,logicalBatch);
     const result=await step(signal=>kind==='updates'
      ? client.updateRecords(config.base.appToken,config.base.tableIds[key],batch.map(op=>({record_id:op.record_id,fields:op.patch})),{signal,tableName:table})
      : client.createRecords(config.base.appToken,config.base.tableIds[key],batch.map(op=>({fields:op.patch})),{signal,tableName:table}));
     if(!Array.isArray(result)||result.length!==batch.length||kind==='updates'&&result.some((r,i)=>r.record_id!==batch[i].record_id))fail('base_response_invalid','Write acknowledgement does not match targets');
     let readback;
     for(let attempt=1;;attempt++){
      try {
       readback=await step(signal=>repos[key].loadIndex({signal}));
      } catch(error) {
       // A write can become visible between pages. Discard the entire failed
       // read and start again; real field/identity changes remain hard errors.
       if(error.code==='base_response_invalid'&&['rev','total'].includes(error.details?.pagination_metadata_key)&&attempt<5){
        await step(()=>sleep(attempt*1000));continue;
       }
       throw error;
      }
      let pending=false;
      for(const op of batch){
       const row=readback.get(op.key);
       if(!row){if(op.record_id)fail('readback_mismatch','Existing target disappeared',{table,key:op.key});pending=true;continue;}
       if(op.record_id&&row.record_id!==op.record_id)fail('readback_mismatch','Target identity changed',{table,key:op.key});
       for(const [field,value] of Object.entries(op.patch)){
        const actual=row.fields[field]??null;if(cellEqual(table,field,actual,value))continue;
        if(!op.record_id||!cellEqual(table,field,actual,op.before[field]))fail('readback_mismatch','Readback contains an unexpected value',{table,key:op.key,field});
        pending=true;
       }
      }
      if(!pending)break;if(attempt>=5)fail('readback_mismatch','Acknowledged values remained stale',{table});
      await step(()=>sleep(attempt*1000));
     }
     for(const op of batch){
      const actual=readback.get(op.key);const verified=Object.fromEntries(Object.keys(op.patch).map(f=>[f,actual.fields[f]??null]));
      jobs.appendAudit({actorId,runId:attemptKey,action:op.record_id?'reconcile_update':'reconcile_create',targetTable:table,targetKey:op.key,before:op.before??{},after:op.patch,readback:verified,now:now()});
      counters[op.record_id?'updated':'created']++;
     }
     resolveIntent(attemptKey,key);
    }
   }
   return {status:'success',plan_sha256:plan.sha256,source_sha256:plan.source_sha256,...counters,readback:'verified',google_writeback:false};
  }catch(error){throw new ShortDramaError(error.code??'reconcile_failed',error.message,{...error.details,completed:counters,next_step:'inspect_partial_readback_before_replanning'});}
  finally{clearInterval(timer);jobs.releaseMutationLease({lockKey,ownerId});}
 }};
}

// Recovery only observes an already-submitted operation. It never submits data
// again or guesses that an absent row means a timed-out create did not happen.
export async function recoverGoogleReconciliation({plan,expectedSha256,baseBindingSha256,config,jobs,repos,client,actorId,now=()=>new Date()}) {
 if(!config.auth.isPrivilegedAllowed(actorId))fail('privileged_required','Reconciliation recovery requires a local administrator');
 if(plan?.sha256!==expectedSha256||reconciliationDigest(plan)!==expectedSha256||plan.base_binding_sha256!==baseBindingSha256)fail('reconcile_plan_invalid','Recovery must use the original reviewed plan and Base');
 if(jobs.listActive().length)fail('reconcile_busy','Synchronization is active');
 const lockKey=`human-base:${hash({appToken:config.base.appToken,tables:config.base.tableIds})}`,ownerId=`reconcile-recover-${randomUUID()}`;
 if(!jobs.acquireMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300}))fail('reconcile_busy','Another mutation holds the lease');
 const renew=()=>jobs.renewMutationLease({lockKey,ownerId,now:now(),leaseSeconds:300});let resolved=0;
 try{
  for(const pending of unresolvedReconciliations(jobs)){
   const intent=JSON.parse(pending.after_json);if(intent.plan_sha256!==expectedSha256)fail('reconcile_unresolved_attempt','A different plan has an unresolved write');
   renew();const {table:key,kind,operations}=intent;const table=RECONCILE_TABLES[key];
   if(kind.startsWith('schema:')){
    const change=plan.schema_changes.find(x=>x.table===key&&kind===`schema:${x.field}`);
    if(!change||!equal(operations,[change]))fail('reconcile_plan_invalid','Journal differs from original schema plan');
    const result=await client.listFields(config.base.appToken,config.base.tableIds[key]);renew();
    if(!result.complete||!equal(result.items.find(f=>f.field_id===change.field_id)?.options?.map(o=>o.name),change.after))fail('reconcile_unresolved_attempt','Schema result is not fully visible; manual review required');
    if(!jobs.db.prepare("SELECT 1 FROM audit_events WHERE run_id=? AND action='reconcile_schema'").get(pending.target_key))jobs.appendAudit({actorId,runId:pending.target_key,action:'reconcile_schema',targetTable:table,targetKey:change.field,before:change.before,after:change.after,readback:change.after,now:now()});
   }else{
    if(!['updates','creates'].includes(kind)||!equal(operations,plan.operations[key]?.[kind]))fail('reconcile_plan_invalid','Journal differs from original data plan');
    const captures=operations.some(op=>op.capture_post_id)?await repos.captures.loadIndex():null;renew();
    const resolved=operations.map(op=>({...op,patch:resolveOperationPatch(key,op,captures)}));
    const rows=await repos[key].loadIndex();renew();
    for(const op of resolved){const row=rows.get(op.key);if(!row||op.record_id&&row.record_id!==op.record_id||Object.entries(op.patch).some(([f,v])=>!cellEqual(table,f,row.fields[f],v)))fail('reconcile_unresolved_attempt','Unknown write is not fully verified; do not replay',{table,key:op.key});}
    for(const op of resolved){
     const action=op.record_id?'reconcile_update':'reconcile_create';
     if(!jobs.db.prepare('SELECT 1 FROM audit_events WHERE run_id=? AND action=? AND target_key=?').get(pending.target_key,action,op.key))jobs.appendAudit({actorId,runId:pending.target_key,action,targetTable:table,targetKey:op.key,before:op.before??{},after:op.patch,readback:Object.fromEntries(Object.keys(op.patch).map(f=>[f,rows.get(op.key).fields[f]??null])),now:now()});
    }
   }
   renew();jobs.appendAudit({actorId,action:'reconcile_resolved',targetTable:table,targetKey:pending.target_key,before:{},after:{state:'verified_by_recovery'},readback:{state:'verified'},now:now()});resolved++;
  }
  return {status:'success',attempts_resolved:resolved,readback:'verified',base_writes:0};
 }finally{jobs.releaseMutationLease({lockKey,ownerId});}
}

// Retain the legacy exported name for existing callers. Checkpoints now accept
// any fully visible journaled batch, but never infer success from partial data.
export function prepareSchemaCheckpointContext({originalPlan,current,journal,expectedSourceSha256=originalPlan?.source_sha256}) {
 const reject=()=>fail('reconcile_checkpoint_invalid','Checkpoint must match the exact journaled effects, unchanged source, remaining data and reserved IDs');
 if(originalPlan?.version!=='shortdrama-google-reconciliation/v2'||reconciliationDigest(originalPlan)!==originalPlan.sha256)reject();
 if(originalPlan.base_binding_sha256!==current.baseBindingSha256||originalPlan.baseline_sha256!==hash(current.baseline)||expectedSourceSha256!==reconciliationSourceDigest(current.google)||!equal(originalPlan.sequence_seeds,current.sequences))reject();
 if(!Array.isArray(journal))reject();
 let intents;try{intents=journal.filter(r=>r.action==='reconcile_intent').map(r=>JSON.parse(r.after_json));}catch{reject();}
 if(!intents.length)reject();
 const expectedSchema=structuredClone(originalPlan.schema_backup),expectedRows=structuredClone(originalPlan.base_backup),completed=new Set();
 for(const intent of intents){
  const {table:key,kind,operations}=intent;const table=RECONCILE_TABLES[key],batchKey=`${key}:${kind}`;
  if(intent.plan_sha256!==originalPlan.sha256||!table||typeof kind!=='string'||completed.has(batchKey))reject();completed.add(batchKey);
  if(kind.startsWith('schema:')){
   const change=originalPlan.schema_changes.find(c=>c.table===key&&kind===`schema:${c.field}`);if(!change||!equal(operations,[change]))reject();
   const field=expectedSchema.tables.find(t=>t.name===table)?.fields.find(f=>f.field_id===change.field_id);if(!field)reject();field.options=change.after.map(name=>({name}));
  }else{
   if(!['updates','creates'].includes(kind)||!operations?.length||!equal(operations,originalPlan.operations[key]?.[kind]))reject();
   const currentRows=unique(current.snapshot[key],r=>r.fields[TABLES[table].primaryField]);
   const captures=new Map(current.snapshot.captures.map(r=>[r.fields['Post ID'],r]));
   for(const logicalOp of operations){
    const op={...logicalOp,patch:resolveOperationPatch(key,logicalOp,captures)};
    if(kind==='updates'){
     const before=expectedRows[key].find(r=>r.record_id===op.record_id);if(!before||before.fields[TABLES[table].primaryField]!==op.key)reject();Object.assign(before.fields,structuredClone(op.patch));
    }else{
     const actual=currentRows.get(op.key);if(!actual||expectedRows[key].some(r=>r.fields[TABLES[table].primaryField]===op.key))reject();
     expectedRows[key].push({record_id:actual.record_id,fields:structuredClone(op.patch)});
    }
   }
  }
 }
 // Table revisions and row-count metadata advance for our own writes. Full
 // descriptors plus exact expected writable rows (including IDs/count) guard both.
 const withoutTableRev=s=>({...s,tables:s.tables.map(({rev,records_count,record_count,...t})=>t)});
 if(!equal(canonicalSchema(withoutTableRev(expectedSchema)),canonicalSchema(withoutTableRev(current.schema)))||!equal(writableSnapshot(expectedRows),writableSnapshot(current.snapshot)))reject();
 const sequences={...current.sequences};
 for(const [kind,key,prefix] of [['drama','dramas','SD'],['release','releases','SR']]){
  const ids=originalPlan.operations[key].creates.map(o=>o.key);const first=originalPlan.sequence_seeds[kind]-ids.length+1;
  if(!ids.every((id,i)=>id===formatId(prefix,first+i)))reject();
  if(!completed.has(`${key}:creates`))sequences[kind]=first-1;
 }
 const completedReleaseIds=[...(originalPlan.completed_release_ids??[]),...(completed.has('releases:creates')?originalPlan.operations.releases.creates.map(op=>op.key):[])];
 const sourceBefore=backupReleaseRows(originalPlan.source_backup),baselineCount=originalReleases(current.baseline).length;
 for(let i=0;i<completedReleaseIds.length;i++){
  const before=sourceBefore[baselineCount+i],after=current.google.releases[baselineCount+i];
  if(!before||!after||!equal(releaseSignature(before),releaseSignature(after)))reject();
 }
 return {...current,sequences,completedReleaseIds,schemaCheckpoint:structuredClone(originalPlan)};
}
export function reconciliationJournal(jobs,sha256){
 if(!/^[a-f0-9]{64}$/.test(sha256))fail('reconcile_plan_invalid','Invalid checkpoint digest');
 return jobs.db.prepare('SELECT action,target_key,after_json FROM audit_events WHERE target_key LIKE ? OR run_id LIKE ? ORDER BY event_id').all(`${sha256}:%`,`${sha256}:%`);
}
