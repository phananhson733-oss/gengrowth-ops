import assert from 'node:assert/strict';
import test from 'node:test';
import { planGoogleReconciliation, applyGoogleReconciliation } from '../src/google-reconciliation.mjs';
import { BASE_FIELD_SPECS } from '../src/schema.mjs';
const clone = structuredClone;
function fixture() {
 const google={accounts:[{账号名:'acct',账号ID:'acct',主页链接:'https://www.tiktok.com/@acct',粉丝数:20,数据日期:'2026-09-08',状态:'发布中'}],dramas:[{剧名:'Old',剧分类:['爱情'],生命周期:'新剧'},{剧名:'New',剧分类:['豪门'],生命周期:null}],captures:[{'Post ID':'123',账号名:'acct',快照日期:'2026-09-08',视频链接:'https://www.tiktok.com/@acct/video/123',播放量:30,点赞:2,评论:0,收藏:0,转发:0}],releases:[{日期:'2026-09-08',账号名:'acct',剧名:null}],revision:'rev'};
 const snapshot={accounts:[{record_id:'a',fields:{账号ID:'acct',账号名:'acct',主页链接:'https://www.tiktok.com/@acct',粉丝数:10,数据日期:'2026-09-04',状态:'发布中',负责人:[]}}],dramas:[{record_id:'d',fields:{剧ID:'SD-000010',剧名:'Old',剧分类:['爱情'],生命周期:'新剧',归档状态:'active'}}],captures:[],releases:[]};
 const schema={tables:Object.entries({accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'}).map(([key,name])=>({name,table_id:key,fields:BASE_FIELD_SPECS[name].map(s=>({name:s.name,field_id:s.name,options:(s.options??(s.name==='剧分类'?['爱情']:[])).map(name=>({name}))}))}))};
 return {google,snapshot,schema,baseline:{source_backup:{formatted:{releases:[['日期','账号名','剧名']]}}},baseBindingSha256:'a'.repeat(64),now:'2026-09-08T10:00:00Z'};
}
test('Google is authoritative; existing IDs survive, new rows append, blank drama stays unlinked',()=>{
 const f=fixture();const p=planGoogleReconciliation(f);
 assert.equal(p.operations.accounts.updates[0].patch.粉丝数,20);
 assert.equal(p.operations.dramas.creates[0].key,'SD-000011');
 assert.deepEqual(p.operations.releases.creates[0].patch.剧,[]);
 assert.equal(p.operations.releases.creates[0].patch.日期,'2026-09-08');
 assert.equal(p.schema_changes[0].after.includes('豪门'),true);
 assert.equal(p.operations.captures.creates[0].patch.播放量,30);
 assert.equal(p.operations.captures.creates[0].patch.评论,0);
});
test('source duplicate names merge only according to existing provenance and union rules',()=>{
 const f=fixture();f.google.dramas.push({剧名:' old ',剧分类:['复仇'],生命周期:'在推',推荐理由:'why'});
 const p=planGoogleReconciliation(f);assert.equal(p.operations.dramas.creates.length,1);
 assert.equal(p.operations.dramas.updates[0].key,'SD-000010');assert.equal(p.operations.dramas.updates[0].patch.生命周期,'在推');
 assert.deepEqual(p.operations.dramas.updates[0].patch.剧分类,['爱情','复仇']);
});
test('duplicate source post identities fail before any mutation',()=>{
 const f=fixture();f.google.captures.push(clone(f.google.captures[0]));assert.throws(()=>planGoogleReconciliation(f),e=>e.code==='reconcile_duplicate_key');
});
test('existing release identity cannot be guessed after source row changes',()=>{
 const f=fixture();f.baseline.source_backup.formatted.releases.push(['2026-09-07','acct','Old']);
 f.snapshot.releases.push({record_id:'r',fields:{发布ID:'SR-000001'}});
 assert.throws(()=>planGoogleReconciliation(f),e=>e.code==='reconcile_release_mapping_changed');
});
test('wrong Base binding or modified plan is rejected before writes',async()=>{
 const f=fixture();const p=planGoogleReconciliation(f);p.operations.accounts.updates[0].patch.粉丝数=999;
 let calls=0;await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:()=>calls++}}),e=>e.code==='reconcile_plan_invalid');assert.equal(calls,0);
});
test('changed live source and concurrent Base changes reject the reviewed plan',async()=>{
 for(const mutate of [f=>f.google.accounts[0].粉丝数++,f=>f.snapshot.accounts[0].fields.粉丝数++]){
  const f=fixture();const p=planGoogleReconciliation(f);mutate(f);let calls=0;
  await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:()=>calls++}}),e=>e.code==='reconcile_stale');assert.equal(calls,0);
 }
});
test('partial writer failure remains partial and never reports verified',async()=>{
 const f=fixture();const p=planGoogleReconciliation(f);let calls=0;
 await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:async()=>{calls++;throw new Error('transport');}}}));assert.equal(calls,1);
});

test('writer changes only planned fields, reads back, audits, and never repeats a write for lag',async()=>{
 const {createGoogleReconciliationWriter}=await import('../src/google-reconciliation.mjs');
 const {JobStore}=await import('../src/job-store.mjs');
 const {BaseRepositories}=await import('../src/base-repositories.mjs');
 const f=fixture();const p=planGoogleReconciliation(f);const rows=clone(f.snapshot);const fields=clone(f.schema.tables);const writes=[];let lag=0;
 const client={
  async listRecords(_base,key){const items=clone(rows[key]);if(key==='accounts'&&lag-->0)items[0].fields.粉丝数=10;return {complete:true,items};},
  async getRecord(_base,key,id){return clone(rows[key].find(r=>r.record_id===id));},
  async listFields(_base,key){return {complete:true,items:clone(fields.find(t=>t.table_id===key).fields)};},
  async updateSelectFieldOptions(_base,key,id,_table,_name,options){fields.find(t=>t.table_id===key).fields.find(f=>f.field_id===id).options=options.map(name=>({name}));},
  async updateRecords(_base,key,updates){writes.push(key);for(const u of updates)Object.assign(rows[key].find(r=>r.record_id===u.record_id).fields,clone(u.fields));if(key==='accounts')lag=1;return clone(updates);},
  async createRecords(_base,key,creates){writes.push(key);const created=creates.map((r,i)=>({record_id:`new-${key}-${i}`,fields:clone(r.fields)}));rows[key].push(...created);return created;}
 };
 const jobs=new JobStore(':memory:');const config={base:{appToken:'base',tableIds:{accounts:'accounts',dramas:'dramas',captures:'captures',releases:'releases'}},auth:{isPrivilegedAllowed:actor=>actor==='admin'}};
 const repos=new BaseRepositories({client,appToken:'base',tableIds:config.base.tableIds});
 try{
  const writer=createGoogleReconciliationWriter({client,repos,config,jobs,actorId:'admin',sleep:async()=>{}});
  const result=await writer.apply(p);assert.equal(result.status,'success');assert.equal(result.readback,'verified');
  assert.equal(writes.filter(k=>k==='accounts').length,1);assert.equal(rows.accounts[0].fields.粉丝数,20);
  assert.equal(rows.releases[0].fields.剧.length,0);assert.equal(jobs.db.prepare("select count(*) as n from audit_events where action in ('reconcile_update','reconcile_create','reconcile_schema')").get().n,Object.values(p.operations).reduce((n,o)=>n+o.creates.length+o.updates.length,0)+p.schema_changes.length);
 }finally{jobs.close();}
});

test('source reconciliation preserves existing archive state and treats multi-selects as sets',()=>{
 const f=fixture();f.snapshot.dramas[0].fields.归档状态='archived';f.snapshot.dramas[0].fields.剧分类=['复仇','爱情'];f.google.dramas[0].剧分类=['爱情','复仇'];
 const p=planGoogleReconciliation(f);const update=p.operations.dramas.updates.find(x=>x.key==='SD-000010');
 assert.equal(update?.patch.归档状态,undefined);assert.equal(update?.patch.剧分类,undefined);
});

test('an unknown create result preserves prior update audits and blocks replanning until verified recovery',async()=>{
 const {createGoogleReconciliationWriter,unresolvedReconciliations,recoverGoogleReconciliation}=await import('../src/google-reconciliation.mjs');
 const {JobStore}=await import('../src/job-store.mjs');const {BaseRepositories}=await import('../src/base-repositories.mjs');
 const f=fixture();f.google.dramas=f.google.dramas.slice(0,1);
 f.snapshot.captures=[{record_id:'c',fields:{'Post ID':'123',播放量:10,账号:[{id:'a'}]}}];f.google.captures.push({...clone(f.google.captures[0]),'Post ID':'124',视频链接:'https://www.tiktok.com/@acct/video/124'});
 const p=planGoogleReconciliation(f);const rows=clone(f.snapshot);const jobs=new JobStore(':memory:');
 const client={
  async listRecords(_b,k){return {complete:true,items:clone(rows[k])};},async getRecord(_b,k,id){return clone(rows[k].find(r=>r.record_id===id));},
  async updateRecords(_b,k,ops){for(const op of ops)Object.assign(rows[k].find(r=>r.record_id===op.record_id).fields,clone(op.fields));return clone(ops);},
  async createRecords(_b,k,ops){const made=ops.map((op,i)=>({record_id:`new-${k}-${i}`,fields:clone(op.fields)}));rows[k].push(...made);if(k==='captures')throw new Error('response lost after commit');return made;},
 };
 const config={base:{appToken:'base',tableIds:{accounts:'accounts',dramas:'dramas',captures:'captures',releases:'releases'}},auth:{isPrivilegedAllowed:a=>a==='admin'}};const repos=new BaseRepositories({client,appToken:'base',tableIds:config.base.tableIds});
 const writer=createGoogleReconciliationWriter({client,repos,config,jobs,actorId:'admin',sleep:async()=>{}});
 try{
  await assert.rejects(()=>writer.apply(p));
  assert.equal(jobs.db.prepare("select count(*) as n from audit_events where action='reconcile_update' and target_table='采集数据'").get().n,1);
  assert.equal(unresolvedReconciliations(jobs).length,1);
  await assert.rejects(()=>writer.apply(p),e=>e.code==='reconcile_unresolved_attempt');
  const recovered=await recoverGoogleReconciliation({plan:p,expectedSha256:p.sha256,baseBindingSha256:p.base_binding_sha256,config,jobs,repos,client,actorId:'admin'});
  assert.equal(recovered.readback,'verified');assert.equal(unresolvedReconciliations(jobs).length,0);
  assert.equal(rows.captures.filter(r=>r.fields['Post ID']==='124').length,1);
  assert.equal(jobs.db.prepare("select count(*) as n from audit_events where action='reconcile_create' and target_table='采集数据'").get().n,1);
 }finally{jobs.close();}
});

test('field/table response ordering and revision wrappers do not stale an unchanged schema',async()=>{
 const f=fixture();const p=planGoogleReconciliation(f);f.schema.tables.reverse();for(const t of f.schema.tables){t.fields.reverse();t.revision='new wrapper revision';}f.schema.revision='another wrapper';let calls=0;
 await applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:async()=>{calls++;return {status:'success'};}}});assert.equal(calls,1);
});
test('raw backups, derived fields, system timestamps and Base row ordering are evidence not freshness inputs',async()=>{
 const f=fixture();f.google.raw_backup={metadata:{title:'title'}};f.snapshot.dramas[0].fields.最后修改时间='yesterday';const p=planGoogleReconciliation(f);
 f.google.raw_backup.metadata.title='new display title';f.snapshot.dramas[0].fields.最后修改时间='today';f.snapshot.dramas[0].fields.是否已排期='是';f.snapshot.accounts.reverse();let calls=0;
 await applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:async()=>{calls++;}}});assert.equal(calls,1);
});
test('real schema descriptor changes still stop before writes with precise reasons',async()=>{
 for(const change of [s=>s.tables[0].fields[0].type='number',s=>s.tables[0].fields[0].style={type:'url'},s=>s.tables[0].primary_field='different',s=>s.tables[1].fields.find(f=>f.name==='剧分类').options.push({name:'unexpected'}),s=>s.tables[0].fields[0].expression='new formula',s=>s.tables[0].fields[0].link_table='elsewhere']){
  const f=fixture();const p=planGoogleReconciliation(f);change(f.schema);let calls=0;
  await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:()=>calls++}}),e=>e.code==='reconcile_stale'&&e.details.changed_components.includes('schema'));
  assert.equal(calls,0);
 }
});

test('set-valued ordering is equivalent but link membership and row identities remain protected',async()=>{
 const f=fixture();f.snapshot.dramas[0].fields.剧分类=['爱情','复仇'];f.google.dramas[0].剧分类=['爱情','复仇'];const p=planGoogleReconciliation(f);f.snapshot.dramas[0].fields.剧分类.reverse();let calls=0;
 await applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:async()=>calls++}});assert.equal(calls,1);
 for(const mutate of [f=>f.snapshot.accounts[0].record_id='other-account-id',f=>f.snapshot.accounts[0].fields.粉丝数++,f=>f.sequences={drama:40,release:50}]){
  const f=fixture();const p=planGoogleReconciliation(f);mutate(f);let writes=0;await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:()=>writes++}}),e=>e.code==='reconcile_stale');assert.equal(writes,0);
 }
});

test('freshness accepts an actual multi-row API permutation',async()=>{
 const f=fixture();f.snapshot.accounts.push({record_id:'z',fields:{账号ID:'legacy',账号名:'legacy'}});const p=planGoogleReconciliation(f);f.snapshot.accounts.reverse();let calls=0;
 await applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:async()=>calls++}});assert.equal(calls,1);
});
test('changing writable relation membership still rejects with zero writes',async()=>{
 const f=fixture();f.snapshot.captures.push({record_id:'c',fields:{'Post ID':'123',账号:[{id:'a'}],播放量:5}});const p=planGoogleReconciliation(f);f.snapshot.captures[0].fields.账号=[{id:'different-account'}];let writes=0;
 await assert.rejects(()=>applyGoogleReconciliation({plan:p,expectedSha256:p.sha256,current:f,writer:{apply:()=>writes++}}),e=>e.code==='reconcile_stale'&&e.details.changed_components.includes('target_data'));assert.equal(writes,0);
});

test('schema extension polls a stale option list, writes once and keeps intent until verified',async()=>{
 const {createGoogleReconciliationWriter}=await import('../src/google-reconciliation.mjs');const {JobStore}=await import('../src/job-store.mjs');
 const f=fixture();const p=planGoogleReconciliation(f);for(const key of Object.keys(p.operations))p.operations[key]={creates:[],updates:[]};
 const change=p.schema_changes[0];let writes=0,afterReads=0,sleeps=0;
 const client={async listFields(){return {complete:true,items:[{field_id:change.field_id,options:(writes&&afterReads++>0?change.after:change.before).map(name=>({name}))}]};},async updateSelectFieldOptions(){writes++;}};
 const config={base:{appToken:'base',tableIds:{accounts:'a',dramas:'d',captures:'c',releases:'r'}},auth:{isPrivilegedAllowed:()=>true}};const jobs=new JobStore(':memory:');
 try{const result=await createGoogleReconciliationWriter({client,repos:{},config,jobs,actorId:'admin',sleep:async()=>sleeps++}).apply(p);assert.equal(result.readback,'verified');assert.equal(writes,1);assert.equal(sleeps,1);}finally{jobs.close();}
});

test('schema-only checkpoint keeps the original reserved IDs and plans no repeated option write',async()=>{
 const {prepareSchemaCheckpointContext}=await import('../src/google-reconciliation.mjs');const f=fixture();const original=planGoogleReconciliation(f);const change=original.schema_changes[0];
 f.schema.tables.find(t=>t.table_id==='dramas').fields.find(x=>x.field_id===change.field_id).options=change.after.map(name=>({name}));f.schema.tables[1].rev=99;f.sequences=clone(original.sequence_seeds);
 const journal=[{action:'reconcile_intent',target_key:original.sha256+':dramas:schema:剧分类',after_json:JSON.stringify({plan_sha256:original.sha256,table:'dramas',kind:'schema:剧分类',operations:[change]})}];
 const context=prepareSchemaCheckpointContext({originalPlan:original,current:f,journal});const next=planGoogleReconciliation(context);
 assert.equal(next.operations.dramas.creates[0].key,original.operations.dramas.creates[0].key);assert.equal(next.operations.releases.creates[0].key,original.operations.releases.creates[0].key);assert.equal(next.schema_changes.length,0);assert.equal(next.schema_checkpoint.sha256,original.sha256);
 for(const mutate of [c=>c.google.accounts[0].粉丝数++,c=>c.snapshot.accounts[0].fields.粉丝数++,c=>c.sequences.drama++,c=>c.schema.tables[1].fields.find(x=>x.field_id===change.field_id).options.push({name:'unexpected'})]){
  const changed=clone(f);mutate(changed);assert.throws(()=>prepareSchemaCheckpointContext({originalPlan:original,current:changed,journal}),e=>e.code==='reconcile_checkpoint_invalid');
 }
 assert.throws(()=>prepareSchemaCheckpointContext({originalPlan:original,current:f,journal:[...journal,{action:'reconcile_intent',after_json:JSON.stringify({kind:'updates'})}]}),e=>e.code==='reconcile_checkpoint_invalid');
});

test('failed schema readback resumes through a fresh checkpoint with no duplicate schema write or skipped IDs',async()=>{
 const {createGoogleReconciliationWriter,recoverGoogleReconciliation,prepareSchemaCheckpointContext,reconciliationJournal,unresolvedReconciliations}=await import('../src/google-reconciliation.mjs');const {JobStore}=await import('../src/job-store.mjs');const {BaseRepositories}=await import('../src/base-repositories.mjs');
 const f=fixture(),original=planGoogleReconciliation(f),rows=clone(f.snapshot),catalog=clone(f.schema.tables);let hideOptions=true,schemaWrites=0,dataWrites=0;const changes=original.schema_changes;
 const client={
  async listFields(_b,k){const fields=clone(catalog.find(t=>t.table_id===k).fields);if(schemaWrites&&hideOptions)for(const change of changes.filter(c=>c.table===k))fields.find(x=>x.field_id===change.field_id).options=change.before.map(name=>({name}));return {complete:true,items:fields};},
  async updateSelectFieldOptions(_b,k,id,_table,_field,options){schemaWrites++;catalog.find(t=>t.table_id===k).fields.find(x=>x.field_id===id).options=options.map(name=>({name}));},
  async listRecords(_b,k){return {complete:true,items:clone(rows[k])};},async getRecord(_b,k,id){return clone(rows[k].find(r=>r.record_id===id));},
  async updateRecords(_b,k,ops){dataWrites++;for(const op of ops)Object.assign(rows[k].find(r=>r.record_id===op.record_id).fields,clone(op.fields));return clone(ops);},
  async createRecords(_b,k,ops){dataWrites++;const made=ops.map((op,i)=>({record_id:`made-${k}-${i}`,fields:clone(op.fields)}));rows[k].push(...made);return made;}
 };
 const jobs=new JobStore(':memory:');const config={base:{appToken:'base',tableIds:{accounts:'accounts',dramas:'dramas',captures:'captures',releases:'releases'}},auth:{isPrivilegedAllowed:a=>a==='admin'}};const repos=new BaseRepositories({client,appToken:'base',tableIds:config.base.tableIds});
 const writer=createGoogleReconciliationWriter({client,repos,config,jobs,actorId:'admin',sleep:async()=>{}});
 try{
  await assert.rejects(()=>writer.apply(original),e=>e.code==='readback_mismatch');assert.equal(schemaWrites,1);assert.equal(dataWrites,0);assert.equal(unresolvedReconciliations(jobs).length,1);
  hideOptions=false;
  const live={...f,snapshot:clone(rows),schema:{tables:clone(catalog)},sequences:clone(original.sequence_seeds),now:'2026-09-08T10:02:00Z'};
  const context=prepareSchemaCheckpointContext({originalPlan:original,current:live,journal:reconciliationJournal(jobs,original.sha256)});const checkpoint=planGoogleReconciliation(context);
  await recoverGoogleReconciliation({plan:original,expectedSha256:original.sha256,baseBindingSha256:original.base_binding_sha256,config,jobs,repos,client,actorId:'admin'});
  const result=await applyGoogleReconciliation({plan:checkpoint,expectedSha256:checkpoint.sha256,current:context,writer});assert.equal(result.status,'success');assert.equal(result.readback,'verified');assert.equal(schemaWrites,1);
  assert.equal(rows.dramas.at(-1).fields.剧ID,original.operations.dramas.creates[0].key);assert.equal(rows.releases[0].fields.发布ID,original.operations.releases.creates[0].key);assert.deepEqual(rows.releases[0].fields.剧,[]);assert.equal(unresolvedReconciliations(jobs).length,0);
 }finally{jobs.close();}
});

test('a fully visible journaled update batch is omitted from continuation without changing reserved new IDs',async()=>{
 const {prepareSchemaCheckpointContext}=await import('../src/google-reconciliation.mjs');const f=fixture();f.schema.tables[1].fields.find(x=>x.name==='剧分类').options.push({name:'豪门'});const original=planGoogleReconciliation(f);const ops=original.operations.accounts.updates;
 for(const op of ops)Object.assign(f.snapshot.accounts.find(r=>r.record_id===op.record_id).fields,clone(op.patch));f.sequences=clone(original.sequence_seeds);
 const journal=[{action:'reconcile_intent',after_json:JSON.stringify({plan_sha256:original.sha256,table:'accounts',kind:'updates',operations:ops})}];
 const next=planGoogleReconciliation(prepareSchemaCheckpointContext({originalPlan:original,current:f,journal}));assert.equal(next.operations.accounts.updates.length,0);assert.equal(next.operations.dramas.creates[0].key,original.operations.dramas.creates[0].key);
 f.snapshot.accounts[0].fields.状态='重养';assert.throws(()=>prepareSchemaCheckpointContext({originalPlan:original,current:f,journal}),e=>e.code==='reconcile_checkpoint_invalid');
});
test('a completely visible applied plan can be checkpointed without duplicating already-created release rows',async()=>{
 const {prepareSchemaCheckpointContext}=await import('../src/google-reconciliation.mjs');const f=fixture();for(const t of f.schema.tables)t.records_count=f.snapshot[t.table_id].length;const original=planGoogleReconciliation(f);const journal=[];
 for(const change of original.schema_changes){f.schema.tables.find(t=>t.table_id===change.table).fields.find(x=>x.field_id===change.field_id).options=change.after.map(name=>({name}));journal.push({action:'reconcile_intent',after_json:JSON.stringify({plan_sha256:original.sha256,table:change.table,kind:`schema:${change.field}`,operations:[change]})});}
 for(const [table,batches] of Object.entries(original.operations))for(const [kind,ops] of Object.entries(batches))if(ops.length){
  for(const [i,op]of ops.entries())if(kind==='updates')Object.assign(f.snapshot[table].find(r=>r.record_id===op.record_id).fields,clone(op.patch));else f.snapshot[table].push({record_id:`new-${table}-${i}`,fields:clone(op.patch)});
  journal.push({action:'reconcile_intent',after_json:JSON.stringify({plan_sha256:original.sha256,table,kind,operations:ops})});
 }
 f.sequences=clone(original.sequence_seeds);for(const t of f.schema.tables)t.records_count=f.snapshot[t.table_id].length;const next=planGoogleReconciliation(prepareSchemaCheckpointContext({originalPlan:original,current:f,journal}));
 assert.equal(Object.values(next.operations).reduce((n,x)=>n+x.creates.length+x.updates.length,0),0);assert.deepEqual(next.completed_release_ids,original.operations.releases.creates.map(x=>x.key));
 const {reconciliationSourceDigest}=await import('../src/google-reconciliation.mjs');
 const refreshed=clone(f);refreshed.google.releases[0].备注='changed after creation';
 assert.throws(()=>prepareSchemaCheckpointContext({originalPlan:original,current:refreshed,journal,expectedSourceSha256:reconciliationSourceDigest(refreshed.google)}),e=>e.code==='reconcile_checkpoint_invalid');
 f.snapshot.captures.push({record_id:'unexpected',fields:{'Post ID':'9999'}});f.schema.tables.find(t=>t.table_id==='captures').records_count++;
 assert.throws(()=>prepareSchemaCheckpointContext({originalPlan:original,current:f,journal}),e=>e.code==='reconcile_checkpoint_invalid');
});

test('real Feishu client and repositories tolerate shuffled API fields and reversed batch ID acknowledgements',async()=>{
 const {FeishuClient,fixedFieldDescriptor}=await import('../src/feishu-client.mjs');const {BaseRepositories}=await import('../src/base-repositories.mjs');const {JobStore}=await import('../src/job-store.mjs');const {createGoogleReconciliationWriter}=await import('../src/google-reconciliation.mjs');
 const f=fixture(),tableNames={accounts:'账号台账',dramas:'选剧池',captures:'采集数据',releases:'发布记录'},byName=Object.fromEntries(Object.entries(tableNames).map(([k,v])=>[v,k]));
 f.google.accounts.push({...clone(f.google.accounts[0]),账号ID:'other',账号名:'other',主页链接:'https://www.tiktok.com/@other',粉丝数:50});f.snapshot.accounts.push({record_id:'a2',fields:{...clone(f.snapshot.accounts[0].fields),账号ID:'other',账号名:'other',主页链接:'https://www.tiktok.com/@other'}});
 f.google.dramas.push({...clone(f.google.dramas[1]),剧名:'Another New'});f.google.captures.push({...clone(f.google.captures[0]),'Post ID':'124',视频链接:'https://www.tiktok.com/@acct/video/124'});f.google.releases.push(clone(f.google.releases[0]));
 f.google.releases=f.google.releases.map((r,i)=>({...r,剧名:'Old','Post ID':String(123+i),视频链接:`https://www.tiktok.com/@acct/video/${123+i}`}));
 const catalog=Object.fromEntries(Object.entries(tableNames).map(([key,name])=>[key,BASE_FIELD_SPECS[name].map(spec=>({field_id:spec.name,...fixedFieldDescriptor(name,spec.name,spec.kind==='link'?{targetTableId:byName[spec.targetTable]}:{},spec.optionPolicy==='manifest_append'?{initialOptions:spec.name==='剧分类'?['爱情']:spec.name==='生命周期'?['新剧','在推']:[]}:{} )}))]));
 f.schema={tables:Object.entries(tableNames).map(([key,name])=>({table_id:key,name,fields:clone(catalog[key])}))};const plan=planGoogleReconciliation(f);
 function wire(table,field,value){const spec=BASE_FIELD_SPECS[table].find(s=>s.name===field);if(value==null)return null;if(spec.kind==='single_select')return Array.isArray(value)?value:[value];if(['date','datetime'].includes(spec.kind)&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value+'T00:00:00+08:00';return clone(value);}
 const rows=Object.fromEntries(Object.entries(f.snapshot).map(([key,rs])=>[key,rs.map(r=>({record_id:r.record_id,fields:Object.fromEntries(Object.entries(r.fields).map(([field,v])=>[field,wire(tableNames[key],field,v)]))}))]));let serial=0,updateCalls=0;
 const client=new FeishuClient({tokenProvider:async()=> 'token',fetchJson:async(url,options)=>{
  const path=new URL(url).pathname;const key=path.split('/tables/')[1]?.split('/')[0];
  if(path.endsWith('/fields')&&options.method==='GET')return {code:0,data:{fields:clone(catalog[key]).reverse(),total:catalog[key].length}};
  if(path.includes('/fields/')&&options.method==='PUT'){const id=decodeURIComponent(path.split('/fields/')[1]);const field=catalog[key].find(f=>f.field_id===id);Object.assign(field,clone(options.body));return {code:0,data:{field:clone(field)}};}
  if(path.endsWith('/records/batch_update')){updateCalls++;const entries=Object.entries(options.body.update_records);for(const[id,fields]of entries)Object.assign(rows[key].find(r=>r.record_id===id).fields,clone(fields));return {code:0,data:{record_id_list:entries.map(x=>x[0]).reverse()}};}
  if(path.endsWith('/records/batch_create')){const created=options.body.create_records.map(fields=>({record_id:`created-${++serial}`,fields:clone(fields)}));rows[key].push(...created);return {code:0,data:{record_id_list:created.map(r=>r.record_id).reverse()}};}
  if(path.endsWith('/records')){const fields=catalog[key].map(f=>f.name).reverse(),items=[...rows[key]].reverse();return {code:0,data:{fields,record_id_list:items.map(r=>r.record_id),data:items.map(r=>fields.map(f=>r.fields[f]??null)),total:items.length}};}
  throw new Error('unexpected '+path);
 }});
 const jobs=new JobStore(':memory:'),config={base:{appToken:'base',tableIds:Object.fromEntries(Object.keys(tableNames).map(k=>[k,k]))},auth:{isPrivilegedAllowed:()=>true}},repos=new BaseRepositories({client,appToken:'base',tableIds:config.base.tableIds});
 try{const result=await createGoogleReconciliationWriter({client,repos,config,jobs,actorId:'admin',sleep:async()=>{}}).apply(plan);assert.equal(result.status,'success');assert.equal(result.updated,2);assert.equal(result.created,6);assert.equal(updateCalls,1);assert.deepEqual(rows.releases.map(r=>r.fields.发布ID),['SR-000001','SR-000002']);for(const row of rows.releases){const capture=rows.captures.find(c=>c.fields['Post ID']===row.fields['Post ID']);assert.deepEqual(row.fields.采集记录,[{id:capture.record_id}]);}
  // Simulate a process losing its journal completion after linked writes landed.
  const pendingKey=plan.sha256+':releases:creates';
  jobs.db.prepare("DELETE FROM audit_events WHERE (action='reconcile_resolved' AND target_key=?) OR (action='reconcile_create' AND run_id=?)").run(pendingKey,pendingKey);
  const {recoverGoogleReconciliation,unresolvedReconciliations}=await import('../src/google-reconciliation.mjs');const writesBefore=serial;
  assert.equal(unresolvedReconciliations(jobs).length,1);
  const recovered=await recoverGoogleReconciliation({plan,expectedSha256:plan.sha256,baseBindingSha256:plan.base_binding_sha256,config,jobs,repos,client,actorId:'admin'});
  assert.equal(recovered.attempts_resolved,1);assert.equal(recovered.base_writes,0);assert.equal(serial,writesBefore);assert.equal(unresolvedReconciliations(jobs).length,0);
 }finally{jobs.close();}
});

test('fresh approval can rebase uncreated source rows while prior journal effects remain exact',async()=>{
 const {prepareSchemaCheckpointContext,reconciliationSourceDigest}=await import('../src/google-reconciliation.mjs');const f=fixture();f.schema.tables[1].fields.find(x=>x.name==='剧分类').options.push({name:'豪门'});const original=planGoogleReconciliation(f);const ops=original.operations.accounts.updates;
 for(const op of ops)Object.assign(f.snapshot.accounts.find(r=>r.record_id===op.record_id).fields,clone(op.patch));f.sequences=clone(original.sequence_seeds);f.google.releases[0]={...f.google.releases[0],剧名:'Old','Post ID':'123',视频链接:'https://www.tiktok.com/@acct/video/123'};
 const journal=[{action:'reconcile_intent',after_json:JSON.stringify({plan_sha256:original.sha256,table:'accounts',kind:'updates',operations:ops})}];
 assert.throws(()=>prepareSchemaCheckpointContext({originalPlan:original,current:f,journal}),e=>e.code==='reconcile_checkpoint_invalid');
 const context=prepareSchemaCheckpointContext({originalPlan:original,current:f,journal,expectedSourceSha256:reconciliationSourceDigest(f.google)});const next=planGoogleReconciliation(context);
 assert.equal(next.operations.releases.creates[0].key,original.operations.releases.creates[0].key);assert.equal(next.operations.releases.creates[0].capture_post_id,'123');assert.equal(next.operations.releases.creates[0].patch['Post ID'],'123');
 assert.deepEqual(next.operations.releases.creates[0].patch.剧,[{id:'d'}]);
});
test('source release evidence must match its post and account and cannot claim an existing release post',()=>{
 for(const mutate of [f=>f.google.releases[0].视频链接='https://www.tiktok.com/@wrong/video/123',f=>f.google.releases[0]['Post ID']='999',f=>f.google.releases.push(clone(f.google.releases[0]))]){
  const f=fixture();f.google.releases[0]={...f.google.releases[0],剧名:'Old','Post ID':'123',视频链接:'https://www.tiktok.com/@acct/video/123'};mutate(f);assert.throws(()=>planGoogleReconciliation(f),e=>e.code==='reconcile_release_mapping_changed');
 }
});

test('explicit source post without capture preserves evidence and marks missing data instead of inventing metrics',()=>{
 const f=fixture();f.google.releases[0]={...f.google.releases[0],剧名:'Old','Post ID':'999',视频链接:'https://www.tiktok.com/@acct/video/999'};
 const p=planGoogleReconciliation(f),op=p.operations.releases.creates[0];assert.equal(op.patch['Post ID'],'999');assert.deepEqual(op.patch.采集记录,[]);assert.equal(op.capture_post_id,undefined);assert.match(op.patch.同步错误,/待采集/);assert.equal(p.operations.captures.creates.some(x=>x.key==='999'),false);assert.equal(op.patch.播放量,undefined);
});

test('existing URL-only release claims prevent duplicate source posts',()=>{
 const f=fixture();f.baseline.source_backup.formatted.releases=[['日期','账号名','剧名','视频链接'],['2026-09-07','acct','Old','https://www.tiktok.com/@acct/video/123']];
 f.google.releases.unshift({日期:'2026-09-07',账号名:'acct',剧名:'Old',视频链接:'https://www.tiktok.com/@acct/video/123'});
 f.google.releases[1]={...f.google.releases[1],剧名:'Old','Post ID':'123',视频链接:'https://www.tiktok.com/@acct/video/123'};
 f.snapshot.releases.push({record_id:'r',fields:{发布ID:'SR-000001',视频链接:'https://www.tiktok.com/@acct/video/123'}});
 assert.throws(()=>planGoogleReconciliation(f),e=>e.code==='reconcile_release_mapping_changed');
});
