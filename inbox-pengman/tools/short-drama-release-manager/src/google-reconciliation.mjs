import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { BASE_FIELD_SPECS, TABLES } from './schema.mjs';
import { canonicalDramaName } from './migration.mjs';
import { ShortDramaError } from './errors.mjs';

export const RECONCILE_TABLES = Object.freeze({accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'});
const METRICS = ['播放量','点赞','评论','收藏','转发'];
const RELEASE_FIELDS = ['日期','账号名','剧名','剧ID（RS Boost）','视频链接','Post ID','RS收益','备注'];
const fail = (code, message, details={}) => { throw new ShortDramaError(code,message,details); };
const normalize = x => typeof x==='string' ? x.trim() || null : x ?? null;
const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x==='object' ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])) : x;
const equal = (a,b) => isDeepStrictEqual(stable(a),stable(b));
const hash = x => createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
export const reconciliationDigest = p => { const {sha256,...rest}=p; return hash(rest); };
const fieldsFor = table => [...TABLES[table].human,...TABLES[table].machine,...TABLES[table].shared];
const writableSnapshot = snapshot => Object.fromEntries(Object.entries(RECONCILE_TABLES).map(([key,table])=>[key,snapshot[key].map(r=>({record_id:r.record_id,fields:Object.fromEntries(fieldsFor(table).filter(f=>Object.hasOwn(r.fields,f)).map(f=>[f,r.fields[f]]))})).sort((a,b)=>a.record_id.localeCompare(b.record_id))]));
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
function originalReleases(baseline){
 const [headers,...rows]=baseline.source_backup.formatted.releases;
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
export function planGoogleReconciliation({google,snapshot,schema,baseline,baseBindingSha256,now}) {
 if(!/^[a-f0-9]{64}$/.test(baseBindingSha256)||!Number.isFinite(Date.parse(now)))fail('reconcile_input_invalid','Binding and timestamp required');
 for(const k of Object.keys(RECONCILE_TABLES))if(!Array.isArray(google[k])||!Array.isArray(snapshot[k]))fail('reconcile_input_invalid','Complete four-table snapshots required');
 const indexes=Object.fromEntries(Object.entries(RECONCILE_TABLES).map(([k,t])=>[k,unique(snapshot[k],r=>r.fields[TABLES[t].primaryField])]));
 const operations=Object.fromEntries(Object.keys(RECONCILE_TABLES).map(k=>[k,{creates:[],updates:[]}])) ;
 function add(k,id,patch){
  const table=RECONCILE_TABLES[k];validateValues(table,patch);const prior=indexes[k].get(id);
  const changed=Object.fromEntries(Object.entries(patch).filter(([f,v])=>!prior || !equal(prior.fields[f]??null,v)));
  if(!Object.keys(changed).length)return;
  operations[k][prior?'updates':'creates'].push({key:id,record_id:prior?.record_id??null,before:prior?.fields??null,patch:prior?changed:{[TABLES[table].primaryField]:id,...patch}});
 }
 const accounts=unique(google.accounts,r=>r.账号ID??r.账号名.toLowerCase());
 for(const [key,row] of accounts){
  if(!indexes.accounts.has(key))fail('reconcile_account_missing','Create the source account binding before reconciling its references',{account:key});
  const patch=Object.fromEntries(['账号名','主页链接','粉丝数','所属组','定位垂类','表现形式','状态','数据日期'].map(f=>[f,normalize(row[f])]));
  add('accounts',key,patch);
 }
 let dramaId=maxId(snapshot.dramas,'剧ID','SD');
 const dramasByName=unique(snapshot.dramas,r=>canonicalDramaName(r.fields.剧名));
 for(const row of mergedDramas(google.dramas)){const existing=dramasByName.get(canonicalDramaName(row.剧名));add('dramas',existing?.fields.剧ID??formatId('SD',++dramaId),row);}
 const accountRelation=name=>{const r=indexes.accounts.get(String(name).replace(/^@/,'').toLowerCase());if(!r)fail('reconcile_account_missing','Source account relation is unresolved',{account:name});return [{id:r.record_id}];};
 unique(google.captures,r=>r['Post ID']);
 for(const row of google.captures){
  const key=row['Post ID'];if(!/^\d+$/.test(key))fail('reconcile_value_invalid','Post IDs must remain exact decimal strings');
  const patch={账号:accountRelation(row.账号名),快照日期:row.快照日期,视频链接:normalize(row.视频链接),...Object.fromEntries(METRICS.map(f=>[f,normalize(row[f])]))};
  const missing=METRICS.map((f,i)=>patch[f]===null?['views','likes','comments','favorites','shares'][i]:null).filter(Boolean);
  patch.采集状态=missing.length?'partial':'complete';patch.缺失字段=missing;
  if(!indexes.captures.has(key))Object.assign(patch,{业务:normalize(row.业务)??'short-drama',发布时间:null,采集时间:null,'来源 run_id':`reconcile:google:${hash(google.captures)}`,'Base 同步时间':new Date(now).toISOString().replace(/\.\d{3}Z$/,'Z')});
  add('captures',key,patch);
 }
 const previous=originalReleases(baseline);
 if(google.releases.length<previous.length)fail('reconcile_release_mapping_changed','Google source removed release rows; manual mapping required');
 for(let i=0;i<previous.length;i++){
  if(!equal(releaseSignature(previous[i]),releaseSignature(google.releases[i]))||!indexes.releases.has(formatId('SR',i+1)))fail('reconcile_release_mapping_changed','Existing source release identity changed; do not guess the mapping',{source_row:i+2});
 }
 let releaseId=maxId(snapshot.releases,'发布ID','SR');
 for(const row of google.releases.slice(previous.length)){
  // Newly added incomplete rows are preserved as incomplete, never invented.
  const dramaName=normalize(row.剧名);const linked=dramaName?dramasByName.get(canonicalDramaName(dramaName)):null;
  if(dramaName&&!linked)fail('reconcile_release_mapping_changed','New release references a not-yet-bound drama');
  const post=normalize(row['Post ID']);if(post||normalize(row.视频链接))fail('reconcile_release_mapping_changed','New release evidence requires the normal attach preview flow');
  add('releases',formatId('SR',++releaseId),{日期:date(row.日期),账号:accountRelation(row.账号名),剧:linked?[{id:linked.record_id}]:[],采集记录:[], '剧ID（RS Boost）':normalize(row['剧ID（RS Boost）']),RS收益:normalize(row.RS收益),备注:normalize(row.备注),归档状态:'active','Post ID':null,视频链接:null});
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
 const plan={version:'shortdrama-google-reconciliation/v1',generated_at:now,base_binding_sha256:baseBindingSha256,source_sha256:hash(Object.fromEntries(Object.keys(RECONCILE_TABLES).map(k=>[k,google[k]]))),base_sha256:hash(writableSnapshot(snapshot)),schema_sha256:hash(schema),baseline_sha256:hash(baseline),operations,schema_changes,sequence_seeds:{drama:dramaId,release:releaseId},source_backup:google.raw_backup??google,base_backup:snapshot};
 plan.sha256=reconciliationDigest(plan);return plan;
}
export async function applyGoogleReconciliation({plan,expectedSha256,current,writer}){
 if(plan?.version!=='shortdrama-google-reconciliation/v1'||plan.sha256!==expectedSha256||reconciliationDigest(plan)!==expectedSha256)fail('reconcile_plan_invalid','Reconciliation plan digest mismatch');
 const fresh=planGoogleReconciliation({...current,now:plan.generated_at});
 if(fresh.sha256!==expectedSha256)fail('reconcile_stale','Source, Base, schema or baseline changed; generate and review a new plan');
 return writer.apply(plan);
}
