import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyProfileStatus, guardZeroMetrics, isExpiredPost, parseProfileListing, planCaptureTargets, selectFreshPosts, validateExcludedPostIds } from '../src/capture-policy.mjs';
const now='2026-09-11T04:00:00Z';
test('30-day capture window includes boundary and unknown dates but excludes older videos',()=>{
 assert.equal(isExpiredPost('2026-08-12T04:00:00Z',now,30),false);
 assert.equal(isExpiredPost('2026-08-12T03:59:59Z',now,30),true);
 assert.equal(isExpiredPost('2026-08-12T12:00:00+08:00',now,30),false);
 for(const date of [null,undefined,'invalid'])assert.equal(isExpiredPost(date,now,30),false);
 assert.throws(()=>isExpiredPost(null,now,0));
});
test('targets union recent known videos absent from embed without borrowing other accounts or stale metrics',()=>{
 const plan=planCaptureTargets({accounts:[{username:'one',embed:{videoList:[{id:'1',playCount:10},{id:'2'}]}}],knownPosts:[
  {post_id:'1',username:'one',published_at:'2026-09-01T00:00:00Z'},
  {post_id:'2',username:'one',published_at:'2026-07-01T00:00:00Z'},
  {post_id:'3',username:'one',published_at:'2026-08-20T00:00:00Z',views:999},
  {post_id:'4',username:'other',published_at:'2026-09-01T00:00:00Z'},
 ],now,maxAgeDays:30});
 assert.deepEqual(plan.targets.map(p=>p.id),['1','3']);
 assert.equal(plan.targets[1].playCount,undefined);
 assert.deepEqual(plan.skipped.map(p=>p.post_id),['2']);
});
test('source refresh includes only same-run nonexpired snapshots without rewriting historical evidence',()=>{
 const rows=[
 {post_id:'1',published_at:null,captured_at:now},
 {post_id:'2',published_at:'2026-08-01T00:00:00Z',captured_at:now},
 {post_id:'3',published_at:'2026-09-01T00:00:00Z',captured_at:'2026-09-11T00:00:00Z'},
 ];
 assert.deepEqual(selectFreshPosts(rows,{capturedAt:now,now,maxAgeDays:30}).map(p=>p.post_id),['1']);
 assert.equal(rows[1].captured_at,now);
});

test('exact excluded Post IDs never become detail targets or same-run Base writes',()=>{
 const excluded='7674889997429853470',other='7674889997429853471';
 const plan=planCaptureTargets({accounts:[{username:'jolienqaq',embed:{videoList:[{id:excluded},{id:other}]}}],
  knownPosts:[{post_id:excluded,username:'jolienqaq',published_at:null}],now,excludedPostIds:[excluded]});
 assert.deepEqual(plan.targets.map(item=>item.id),[other]);
 assert.deepEqual(plan.skipped.map(item=>[item.post_id,item.reason]),[[excluded,'excluded_post_id']]);
 const rows=[excluded,other].map(post_id=>({post_id,captured_at:now,published_at:null}));
 assert.deepEqual(selectFreshPosts(rows,{capturedAt:now,excludedPostIds:[excluded]}).map(item=>item.post_id),[other]);
 assert.equal(rows.length,2);
 assert.throws(()=>validateExcludedPostIds([excluded,excluded]));
 assert.throws(()=>validateExcludedPostIds([excluded+'*']));
});

test('Base-only explicit and linked videos enter capture targets without using planned release dates',async()=>{
 const { registeredCaptureTargets }=await import('../src/capture-policy.mjs');
 const accounts=new Map([['one',{record_id:'rec-a',fields:{账号ID:'one',主页链接:'https://www.tiktok.com/@one'}}]]);
 const captures=new Map([['55',{record_id:'rec-c',fields:{'Post ID':'55',账号:[{id:'rec-a'}],发布时间:'2026-09-01T00:00:00Z'}}]]);
 const releases=new Map([
  ['SR-1',{fields:{归档状态:'active',账号:[{id:'rec-a'}],'Post ID':'66',日期:'2026-01-01'}}],
  ['SR-2',{fields:{归档状态:'active',账号:[{id:'rec-a'}],采集记录:[{id:'rec-c'}]}}],
  ['SR-3',{fields:{归档状态:'active',账号:[{id:'rec-a'}],视频链接:'https://evil.test/@one/video/77'}}],
 ]);
 const result=registeredCaptureTargets({accounts,captures,releases});
 assert.deepEqual(result.posts.map(p=>p.post_id).sort(),['55','66']);
 assert.equal(result.posts.find(p=>p.post_id==='66').published_at,null);
 assert.equal(result.posts.find(p=>p.post_id==='55').published_at,'2026-09-01T00:00:00Z');
 assert.equal(result.issues[0].release_id,'SR-3');
});

test('registered targets require matching source author and post ID before accepting detailed metrics',async()=>{
 const { detailMatchesTarget }=await import('../src/capture-policy.mjs');
 const target={id:'55',username:'one'};
 assert.equal(detailMatchesTarget({id:'55',uploader:'one'},target),true);
 assert.equal(detailMatchesTarget({id:'55',author_username:'one'},target),true);
 assert.equal(detailMatchesTarget({id:'55',uploader:'other'},target),false);
 assert.equal(detailMatchesTarget({id:'56',uploader:'one'},target),false);
 assert.equal(detailMatchesTarget({id:'55'},target),false);
});

test('newly discovered expired dates persist without creating or refreshing metric snapshots',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {DatabaseSync}=await import('node:sqlite');
 const {saveLocalHistory}=await import('../../tiktok-public-capture/persistence.mjs');
 const dir=mkdtempSync(join(tmpdir(),'shortdrama-expired-metadata-'));
 const common={outputDir:dir,snapshotDate:'2026-09-10',capturedAt:'2026-09-10T00:00:00Z',usernames:[],accounts:[],errors:[]};
 try{
  saveLocalHistory({...common,posts:[{post_id:'55',username:'one',post_url:'https://www.tiktok.com/@one/video/55',published_at:null,views:10}]});
  saveLocalHistory({...common,snapshotDate:'2026-09-11',capturedAt:now,posts:[],metadataOnlyPosts:[{post_id:'55',username:'one',post_url:'https://www.tiktok.com/@one/video/55',published_at:'2026-07-01T00:00:00Z'},{post_id:'66',username:'one',post_url:'https://www.tiktok.com/@one/video/66',published_at:'2026-07-01T00:00:00Z'}]});
  const db=new DatabaseSync(join(dir,'tiktok_metrics.sqlite'),{readOnly:true});
  try{
   assert.equal(db.prepare("SELECT published_at FROM posts WHERE post_id='55'").get().published_at,'2026-07-01T00:00:00Z');
   assert.equal(db.prepare("SELECT COUNT(*) n FROM post_snapshots WHERE snapshot_date='2026-09-11'").get().n,0);
   assert.equal(db.prepare("SELECT views FROM post_snapshots WHERE post_id='55'").get().views,10);
   assert.equal(db.prepare("SELECT COUNT(*) n FROM post_snapshots WHERE post_id='66'").get().n,0);
  }finally{db.close();}
 }finally{rmSync(dir,{recursive:true,force:true});}
});


test('account ledger additions and removals control capture membership without release records', async () => {
 const { registeredCaptureTargets, captureAccountUsernames } = await import('../src/capture-policy.mjs');
 const row = name => ({record_id:'rec-'+name,fields:{账号ID:name,主页链接:'https://www.tiktok.com/@'+name,状态:'未发'}});
 const accounts = new Map([['existing',row('existing')],['new_account',row('new_account')]]);
 const query = () => registeredCaptureTargets({accounts,captures:new Map(),releases:new Map()});
 assert.deepEqual(query().accounts,['existing','new_account']);
 assert.deepEqual(captureAccountUsernames(query().accounts),['existing','new_account']);
 accounts.delete('existing');
 assert.deepEqual(query().accounts,['new_account']);
});

test('invalid ledger identities and mismatching homepages are excluded with explicit issues', async () => {
 const { registeredCaptureTargets } = await import('../src/capture-policy.mjs');
 const pairs = [
 ['valid','https://www.tiktok.com/@valid/?lang=en'],
 ['missing',null],['other','https://www.tiktok.com/@someone_else'],
 ['evil','https://tiktok.com.evil.test/@evil'],['unsafe/name','https://www.tiktok.com/@unsafe/name'],
 ['credential','https://secret@www.tiktok.com/@credential'],
 ];
 const accounts = new Map(pairs.map(([name,url])=>[name,{record_id:'rec-'+name,fields:{账号ID:name,主页链接:url}}]));
 const result = registeredCaptureTargets({accounts,captures:new Map(),releases:new Map()});
 assert.deepEqual(result.accounts,['valid']);
 assert.equal(result.issues.length,5);
 assert.ok(result.issues.every(i=>i.account_id&&i.code.startsWith('account_capture_')));
 assert.equal(JSON.stringify(result).includes('secret@'),false);
});

test('collector account lists reject absent empty duplicate or unsafe membership instead of falling back', async () => {
 const { captureAccountUsernames } = await import('../src/capture-policy.mjs');
 for(const bad of [undefined,null,[],['one','one'],['../escape'],['user;touch x'],['Upper'],[{}]]) assert.throws(()=>captureAccountUsernames(bad));
 assert.deepEqual(captureAccountUsernames(['one','new_account']),['one','new_account']);
});

const zeroMetrics = { views: 0, likes: 0, comments: 0, favorites: 0, shares: 0 };
const missingMetrics = { views: null, likes: null, comments: null, favorites: null, shares: null };
test('only a confirmed account-level status code stops discovery for an account', () => {
  assert.equal(classifyProfileStatus(10221), 'unavailable');
  assert.equal(classifyProfileStatus('10221'), 'unavailable');
  for (const code of [0, '0', null, undefined, '']) assert.equal(classifyProfileStatus(code), 'ok');
  // A verification wall or a server error says nothing about the account itself.
  for (const code of [10000, 10101, 450, -1, 'abc', 1.5]) assert.equal(classifyProfileStatus(code), 'unknown');
});
test('a zero detail after any positive view history is stored as missing instead of a measured zero', () => {
  assert.deepEqual(guardZeroMetrics(zeroMetrics, { previousMaxViews: 1000 }), { metrics: missingMetrics, suspect: true });
  assert.deepEqual(guardZeroMetrics({ ...zeroMetrics, likes: 7 }, { previousMaxViews: 1000 }),
    { metrics: { ...zeroMetrics, views: null, likes: 7 }, suspect: true });
});
test('a positive count listed in the same run contradicts a zero detail and is kept as the view count', () => {
  assert.deepEqual(guardZeroMetrics(zeroMetrics, { listedViews: 1000 }), { metrics: { ...missingMetrics, views: 1000 }, suspect: true });
  assert.deepEqual(guardZeroMetrics(zeroMetrics, { previousMaxViews: 5000, listedViews: 1200 }).metrics.views, 1200);
});
test('a post without positive evidence keeps its measured zero and positive details are never touched', () => {
  assert.deepEqual(guardZeroMetrics(zeroMetrics), { metrics: zeroMetrics, suspect: false });
  assert.deepEqual(guardZeroMetrics(zeroMetrics, { previousMaxViews: 0, listedViews: 0 }), { metrics: zeroMetrics, suspect: false });
  assert.deepEqual(guardZeroMetrics({ ...zeroMetrics, views: 12 }, { previousMaxViews: 1000 }), { metrics: { ...zeroMetrics, views: 12 }, suspect: false });
  assert.deepEqual(guardZeroMetrics(missingMetrics, { previousMaxViews: 1000 }), { metrics: missingMetrics, suspect: false });
});
test('a listing that fills the page cap is truncated even when some entries repeat an id', () => {
  const cutoffSeconds = 1000;
  const entry = (id) => JSON.stringify({ id, timestamp: 5000, view_count: 1 });
  const stdout = [...Array.from({ length: 299 }, (_, i) => entry(String(i + 1))), entry('1')].join('\n');
  const parsed = parseProfileListing(stdout, { limit: 300, cutoffSeconds });
  assert.equal(parsed.items.length, 299);
  assert.equal(parsed.truncated, true);
  assert.equal(parseProfileListing(stdout.split('\n').slice(0, 299).join('\n'), { limit: 300, cutoffSeconds }).truncated, false);
});
