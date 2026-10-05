import assert from 'node:assert/strict';
import test from 'node:test';
import { queryReleaseCandidates } from '../src/match-candidates.mjs';
const row=(id,fields)=>({record_id:id,fields});
function fixture(){
 const data={accounts:new Map([['one',row('a',{账号ID:'one',账号名:'Friendly'})]]),dramas:new Map([['SD-1',row('d',{剧ID:'SD-1',剧名:'Hunter’s Prey'})],['SD-2',row('d2',{剧ID:'SD-2',剧名:'Other Drama'})]]),releases:new Map([['SR-1',row('r',{发布ID:'SR-1',账号:[{id:'a'}],剧:[{id:'d'}],日期:'2026-09-19',备注:'第1条',归档状态:'active'})]]),captures:new Map([['11',row('c',{ 'Post ID':'11',账号:[{id:'a'}],发布时间:'2026-09-18T20:00:00+08:00',视频链接:'https://www.tiktok.com/@one/video/11',关联发布记录:[]})]])};
 const posts=[{post_id:'11',username:'one',post_url:'https://www.tiktok.com/@one/video/11',published_at:'2026-09-18T12:00:00Z',caption:"Part 1 | Hunter's Prey",captured_at:'2026-09-20T16:11:57Z'}];
 const input={repos:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,{loadIndex:async()=>structuredClone(v)}])),readPosts:()=>structuredClone(posts),now:new Date('2026-09-21T08:00:00+08:00')};
 return {data,posts,input};
}
test('ranks exact title/Part across midnight but never writes or calls it automatically approved',async()=>{
 const f=fixture(),r=await queryReleaseCandidates(f.input);assert.equal(r.mutations,0);assert.equal(r.rows.length,1);const c=r.rows[0].candidates[0];assert.equal(c.post_id,'11');assert.equal(c.caption,"Part 1 | Hunter's Prey");assert.deepEqual(c.evidence,['title_exact','part_exact']);assert.equal(c.date_delta_days,-1);assert.equal(r.rows[0].state,'needs_confirmation');assert.equal(r.rows[0].account_name,'Friendly');
});
test('no-title captions remain explicit weak candidates without fabricated drama mapping',async()=>{
 const f=fixture();f.posts[0].caption='Watch the full story #drama';const r=await queryReleaseCandidates(f.input);assert.deepEqual(r.rows[0].candidates[0].evidence,[]);assert.ok(r.rows[0].candidates[0].warnings.includes('content_unverified'));
});
test('excludes wrong known title, wrong part and cross-account identity',async()=>{
 for(const change of [f=>f.posts[0].caption='Part 1 | Other Drama',f=>f.posts[0].caption="Part 2 | Hunter's Prey",f=>f.posts[0].username='other']){const f=fixture();change(f);assert.equal((await queryReleaseCandidates(f.input)).rows[0].candidates.length,0);}
});
test('honors all claims including archived relations, explicit IDs and capture reverse links',async()=>{
 for(const fields of [{'Post ID':'11'},{视频链接:'https://www.tiktok.com/@one/video/11'},{采集记录:[{id:'c'}]}]){const f=fixture();f.data.releases.set('SR-2',row('r2',{发布ID:'SR-2',归档状态:'archived',...fields}));assert.equal((await queryReleaseCandidates(f.input)).rows[0].candidates.length,0);}
 const f=fixture();f.data.captures.get('11').fields.关联发布记录=[{id:'other'}];assert.equal((await queryReleaseCandidates(f.input)).rows[0].candidates.length,0);
});
test('two competing releases are both shown, never first-row-wins',async()=>{
 const f=fixture();f.data.releases.set('SR-2',row('r2',{...f.data.releases.get('SR-1').fields,发布ID:'SR-2'}));const r=await queryReleaseCandidates(f.input);assert.equal(r.rows.length,2);for(const x of r.rows)assert.equal(x.candidates[0].competing_release_ids.length,1);
});
test('default is seven completed Beijing days; key and date can inspect today',async()=>{
 const f=fixture();f.data.releases.get('SR-1').fields.日期='2026-09-21';assert.equal((await queryReleaseCandidates(f.input)).rows.length,0);assert.equal((await queryReleaseCandidates({...f.input,key:'SR-1'})).rows.length,1);assert.equal((await queryReleaseCandidates({...f.input,date:'2026-09-21'})).rows.length,1);
});
test('rejects invalid dates and selector combinations; not-found is not empty success',async()=>{
 const f=fixture();for(const opts of [{date:'2026-02-30'},{date:'yesterday'},{key:'SR-1',date:'2026-09-19'}])await assert.rejects(queryReleaseCandidates({...f.input,...opts}));await assert.rejects(queryReleaseCandidates({...f.input,key:'missing'}),e=>e.code==='base_record_not_found');
});
test('source errors remain errors and cannot masquerade as no candidates',async()=>{const f=fixture();await assert.rejects(queryReleaseCandidates({...f.input,readPosts:()=>{throw Error('offline')}}));});
test('does not infer missing drama or treat malformed multi-link as unlinked',async()=>{
 for(const fields of [{剧:[]},{采集记录:[{id:'old'}]},{归档状态:'archived'}]){const f=fixture();Object.assign(f.data.releases.get('SR-1').fields,fields);const r=await queryReleaseCandidates({...f.input,key:'SR-1'});assert.equal(r.rows[0].candidates.length,0);}
});

test('nine accepted real metadata pairs retain unique title/Part recommendations without hard-coded matcher rules',async()=>{
 const {readFileSync}=await import('node:fs');const known=JSON.parse(readFileSync(new URL('./fixtures/accepted-candidate-matches.json',import.meta.url),'utf8'));
 const data={accounts:new Map(),dramas:new Map(),releases:new Map(),captures:new Map()};const posts=[];
 for(const r of known){
  data.accounts.set(r.account,row(`a-${r.account}`,{账号ID:r.account,账号名:r.account}));data.dramas.set(r.title,row(`d-${r.title}`,{剧ID:r.title,剧名:r.title}));
  data.releases.set(r.release_id,row(`r-${r.release_id}`,{发布ID:r.release_id,账号:[{id:`a-${r.account}`}],剧:[{id:`d-${r.title}`}],日期:r.registered_date,备注:`第${r.part}条`,归档状态:'active'}));
  data.captures.set(r.post_id,row(`c-${r.post_id}`,{'Post ID':r.post_id,账号:[{id:`a-${r.account}`}],视频链接:r.url,发布时间:r.published_at,关联发布记录:[]}));
  posts.push({post_id:r.post_id,username:r.account,post_url:r.url,published_at:r.published_at,caption:r.caption});
 }
 const output=await queryReleaseCandidates({repos:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,{loadIndex:async()=>v}])),readPosts:()=>posts,now:new Date('2026-09-21T08:00:00+08:00')});
 for(const expected of known){const actual=output.rows.find(r=>r.release_id===expected.release_id);assert.equal(actual.candidates.length,1);assert.equal(actual.candidates[0].post_id,expected.post_id);assert.deepEqual(actual.candidates[0].competing_release_ids,[]);}
 assert.equal(output.mutations,0);
});
