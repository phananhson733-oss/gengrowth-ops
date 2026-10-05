import {createHash,randomUUID} from 'node:crypto';
import {baseBinding} from './human-ops.mjs';
import {titleKey} from './caption-recognition.mjs';
import {ShortDramaError} from './errors.mjs';
const fail=(code,message)=>{throw new ShortDramaError(code,message);};

/** Deduplicate under the shared Base lease. Unknown POSTs are never reissued. */
export async function ensureCaptionDramas({jobs,repos,candidates,revalidate,maxCreates=10,now=()=>new Date()}){
 const binding=baseBinding(repos);
 if(!binding||repos.dramas.serverGeneratedIds!==true||typeof revalidate!=='function')fail('caption_pool_invalid','Generated pool IDs, complete Base binding and source revalidation are required');
 jobs.db.exec(`CREATE TABLE IF NOT EXISTS caption_drama_creations (
  title_key TEXT PRIMARY KEY,state TEXT NOT NULL,title TEXT NOT NULL,platform TEXT,record_id TEXT,
  drama_id TEXT,evidence_json TEXT NOT NULL,error_code TEXT,updated_at TEXT NOT NULL)`);
 const lockKey=`human-base:${binding}`,ownerId=`caption-pool-${randomUUID()}`;
 if(!jobs.acquireMutationLease({lockKey,ownerId,leaseSeconds:300,now:now()}))return {status:'deferred',created:0,held:[]};
 const controller=new AbortController();let lost=null;
 const owned=()=>{if(lost)throw lost;jobs.renewMutationLease({lockKey,ownerId,leaseSeconds:300,now:now()});};
 const heartbeat=setInterval(()=>{try{owned();}catch(error){lost=error;controller.abort();}},1000);heartbeat.unref?.();
 const result={status:'success',created:0,reused:0,held:[]};
 try{
  const groups=new Map();for(const c of candidates){const key=titleKey(c.title);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);}
  for(const [normalized,group] of groups){
   if(result.created>=maxCreates)break;
   const c=group[0],platforms=new Set(group.map(x=>x.platform).filter(Boolean));
   if(platforms.size>1){result.held.push({post_id:c.post_id,reason:'drama_platform_conflict'});continue;}
   const key=createHash('sha256').update(`${binding}:${normalized}`).digest('hex');
   const current=await repos.dramas.loadIndex({signal:controller.signal});owned();
   const matches=[...current].filter(([,r])=>titleKey(r.fields.剧名)===normalized);
   if(matches.length){result.reused++;continue;}
   const previous=jobs.db.prepare('SELECT state FROM caption_drama_creations WHERE title_key=?').get(key);
   if(previous&&!['preflight_failed'].includes(previous.state)){result.held.push({post_id:c.post_id,reason:'pool_creation_requires_review'});continue;}
   if(!await revalidate(c)){result.held.push({post_id:c.post_id,reason:'caption_changed'});continue;}
   const patch={剧名:c.title,...(c.platform?{平台:c.platform}:{}),归档状态:'active'};
   jobs.db.prepare(`INSERT INTO caption_drama_creations(title_key,state,title,platform,evidence_json,updated_at) VALUES(?,'prepared',?,?,?,?)
    ON CONFLICT(title_key) DO UPDATE SET state='prepared',evidence_json=excluded.evidence_json,updated_at=excluded.updated_at,error_code=NULL`).run(key,c.title,c.platform??null,JSON.stringify(group),now().toISOString());
   let attempted=false;
   try{
    const written=await repos.dramas.createWithGeneratedId(patch,'caption_pool',{signal:controller.signal,beforeWrite:async before=>{
     owned();if([...before.values()].some(r=>titleKey(r.fields.剧名)===normalized))fail('caption_pool_changed','A matching title appeared before creation');
     if(!await revalidate(c))fail('caption_changed','Caption identity changed before pool creation');owned();
     jobs.db.prepare("UPDATE caption_drama_creations SET state='started',updated_at=? WHERE title_key=?").run(now().toISOString(),key);attempted=true;
    }});
    owned();const r=written.record;
    if(written.readback!=='verified'||!r?.record_id||!r.fields.剧ID||titleKey(r.fields.剧名)!==normalized||c.platform&&r.fields.平台!==c.platform)fail('readback_mismatch','Pool creation did not verify');
    jobs.db.prepare("UPDATE caption_drama_creations SET state='complete',record_id=?,drama_id=?,updated_at=? WHERE title_key=?").run(r.record_id,r.fields.剧ID,now().toISOString(),key);
    jobs.appendAudit({actorId:'system:caption-pool',action:'caption-pool-create',targetTable:'选剧池',targetKey:r.fields.剧ID,before:{title_key:key,evidence:group},after:patch,readback:written,now:now()});result.created++;
   }catch(error){
    jobs.db.prepare('UPDATE caption_drama_creations SET state=?,error_code=?,updated_at=? WHERE title_key=?').run(attempted?'uncertain':'preflight_failed',error.code??'pool_write_uncertain',now().toISOString(),key);
    result.held.push({post_id:c.post_id,reason:attempted?'pool_creation_requires_review':error.code??'pool_preflight_failed'});if(lost)break;
   }
  }
  if(result.held.length)result.status='partial';return result;
 }finally{clearInterval(heartbeat);jobs.releaseMutationLease({lockKey,ownerId});}
}
