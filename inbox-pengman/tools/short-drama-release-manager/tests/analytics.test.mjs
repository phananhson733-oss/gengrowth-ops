import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAnalytics} from '../src/analytics.mjs';
import {buildDailyViews} from '../src/daily-views.mjs';
const rec=(id,fields)=>({record_id:id,fields});
const account=rec('a1',{'账号ID':'alice','账号名':'Alice'});
const drama=rec('d1',{'剧ID':'SD-1','剧名':'Drama','剧分类':['爱情'],'平台':'ReelShort','上线日期':'2026-08-01'});
const release=(id,post,date,dr='d1')=>rec(id,{'发布ID':id,'账号':['a1'],'剧':dr?[dr]:[],'日期':date,'Post ID':post,'采集记录':post?['c'+post]:[]});
const capture=(id,views,date='2026-09-20',extra={})=>rec('c'+id,{'Post ID':id,'账号':['a1'],'播放量':views,'点赞':10,'评论':3,'收藏':2,'转发':1,'快照日期':date,'视频链接':'https://www.tiktok.com/@alice/video/'+id,...extra});
const input=()=>({accounts:[account],dramas:[drama],releases:[release('r1','1','2026-09-01'),release('r2','2','2026-09-05')],captures:[capture('1',100,'2026-09-10'),capture('2',200)],now:new Date('2026-09-20T12:00:00Z')});
test('cohorts attribute a later release to its publication date but all drama metrics to first date',()=>{
 const x=buildAnalytics(input());assert.equal(x.accounts[0].累计播放量,300);assert.equal(x.dramas[0].播放量,300);assert.equal(x.dramas[0].首次发布日期,'2026-09-01');assert.equal(x.dramas[0].发布记录数,2);assert.equal(x.dramas[0].所属平台,'ReelShort');assert.equal(x.dramas[0].平台,'TikTok');assert.equal(x.releaseDays.length,2);assert.equal(x.releaseDays[0].播放量,100);assert.equal(x.firstDays.length,1);assert.equal(x.firstDays[0].播放量,300);assert.equal(x.firstDays[0].剧名数,1);
 for(const note of [x.accounts[0].累计统计说明,x.dramas[0].统计说明,x.releaseDays[0].统计说明,x.firstDays[0].统计说明])assert.match(note,/Asia\/Shanghai/);
});
test('unregistered posts and scheduled releases do not inflate account totals',()=>{
 const data=input();data.captures.push(capture('3',99999));data.releases.push(release('pending','','2026-09-20'),release('future','3','2026-09-25'));const x=buildAnalytics(data);assert.equal(x.accounts[0].累计播放量,300);assert.equal(x.dramas[0].发布记录数,2);
});
test('an account with no eligible published post remains unknown rather than a measured zero',()=>{
 const data=input();data.accounts.push(rec('a2',{'账号ID':'idle','账号名':'Idle'}));
 const idle=buildAnalytics(data).accounts.find(row=>row.账号ID==='idle');
 assert.equal(idle.累计播放量,null);assert.equal(idle.累计点赞,null);assert.equal(idle.累计数据截至日期,null);assert.match(idle.累计统计说明,/暂无指标/);
});
test('a captured published post with zero views remains a measured zero',()=>{
 const data=input();for(const row of data.captures)row.fields.播放量=0;
 const accountRow=buildAnalytics(data).accounts[0];assert.equal(accountRow.累计播放量,0);assert.equal(accountRow.累计数据截至日期,'2026-09-20');
});
test('old post last-known metrics survive and an unknown metric does not become zero',()=>{
 const data=input();data.releases[0].fields.日期='2026-08-01';data.captures[0].fields.收藏=null;const x=buildAnalytics(data);assert.equal(x.accounts[0].累计播放量,300);assert.equal(x.accounts[0].累计收藏,null);assert.match(x.accounts[0].累计统计说明,/缺失/);assert.match(x.dramas[0].统计说明,/30/);
});
test('same name dramas remain separate by identity; duplicates cannot double-count a post',()=>{
 const data=input();data.dramas.push(rec('d2',{...drama.fields,'剧ID':'SD-2'}));data.releases[1].fields.剧=['d2'];assert.equal(buildAnalytics(data).dramas.length,2);data.releases.push(release('r3','1','2026-09-01'));const x=buildAnalytics(data);assert.equal(x.accounts[0].累计播放量,200);assert.deepEqual(x.issues.filter(i=>i.reason==='duplicate_post_claim').map(i=>[i.release_id,i.post_id,i.release_ids]),[['r1','1',['r1','r3']],['r3','1',['r1','r3']]]);
});
test('unmatched dramas remain visible in release cohort completeness without fake drama identities',()=>{
 const data=input();data.releases[0].fields.剧=[];const x=buildAnalytics(data);assert.equal(x.releaseDays[0].剧名数,0);assert.equal(x.releaseDays[0].播放量,100);assert.match(x.releaseDays[0].统计说明,/未关联剧/);assert.equal(x.dramas[0].播放量,200);
});
const snap=(day,views,likes,extra={})=>({snapshot_date:day,captured_at:day+'T00:00:00Z',published_at:'2026-08-01T00:00:00Z',username:'alice',post_id:'1',views,likes,comments:3,favorites:2,shares:1,...extra});
test('interaction deltas preserve signed changes; rate uses deltas and zero denominator stays blank',()=>{
 const rows=[snap('2026-09-18',100,10),snap('2026-09-19',200,20,{comments:5,favorites:3,shares:3}),snap('2026-09-20',200,19)];const x=buildDailyViews(rows);assert.equal(x[1].新增点赞,10);assert.equal(x[1].新增评论,2);assert.equal(x[1].新增收藏,1);assert.equal(x[1].新增转发,2);assert.equal(x[1].互动率,0.13);assert.equal(x[2].新增点赞,-1);assert.equal(x[2].互动率,null);
});
test('per-account growth uses same daily boundary and sums to overall growth',()=>{
 const rows=[snap('2026-09-19',100,10),snap('2026-09-20',150,15),snap('2026-09-19',200,20,{username:'bob',post_id:'2'}),snap('2026-09-20',270,27,{username:'bob',post_id:'2'})];const all=buildDailyViews(rows),a=buildDailyViews(rows,{username:'alice'}),b=buildDailyViews(rows,{username:'bob'});assert.equal(a[1].新增播放量,50);assert.equal(a[1].新增播放量+b[1].新增播放量,all[1].新增播放量);
});
test('a published record without a date contributes to cumulative totals but cannot invent a first date',()=>{const data=input();data.releases[0].fields.日期=null;const x=buildAnalytics(data);assert.equal(x.accounts[0].累计播放量,300);assert.equal(x.dramas[0].播放量,300);assert.equal(x.dramas[0].首次发布日期,null);assert.equal(x.releaseDays.length,1);assert.equal(x.firstDays.length,0);assert.equal(x.issues[0].reason,'missing_release_date');});
test('decoded Base link cells retain identity and missing interactions cannot fabricate a rate',()=>{const data=input();for(const r of [...data.releases,...data.captures])for(const k of ['账号','剧','采集记录'])if(Array.isArray(r.fields[k]))r.fields[k]=r.fields[k].map(id=>({id}));assert.equal(buildAnalytics(data).accounts[0].累计播放量,300);const x=buildDailyViews([snap('2026-09-19',100,null),snap('2026-09-20',150,20)]);assert.equal(x[1].互动率,null);assert.equal(x[1].新增点赞,null);});
test('an entirely blank Base draft does not block valid analytics',()=>{const data=input();data.releases.push(rec('blank',{'发布ID':null,'日期':null,'账号':[],'剧':[],'采集记录':[],'归档状态':null}));assert.equal(buildAnalytics(data).accounts[0].累计播放量,300);data.releases.at(-1).fields['Post ID']='99';const x=buildAnalytics(data);assert.equal(x.accounts[0].累计播放量,300);assert.deepEqual(x.issues.map(i=>[i.table,i.record_id,i.reason]),[['发布记录','blank','key_missing']]);});
test('one broken release is isolated and every other release still reaches the reports',()=>{
 const data=input();
 data.releases.push(rec('gone',{'发布ID':'r-gone','账号':['deleted-account'],'剧':['d1'],'日期':'2026-09-02','Post ID':'7','采集记录':[]}));
 data.releases.push(rec('two',{'发布ID':'r-two','账号':['a1'],'剧':['d1'],'日期':'2026-09-02','采集记录':['c1','c2']}));
 data.releases.push(rec('cross',{'发布ID':'r-cross','账号':['a1'],'剧':['d1'],'日期':'2026-09-02','Post ID':'2','采集记录':['c1']}));
 data.releases.push(rec('nodrama',{'发布ID':'r-nodrama','账号':['a1'],'剧':['d404'],'日期':'2026-09-02','Post ID':'5','采集记录':[]}));
 data.releases.push(rec('badmetric',{'发布ID':'r-bad','账号':['a1'],'剧':['d1'],'日期':'2026-09-02','Post ID':'6','采集记录':['c6']}));
 data.captures.push(capture('6',-5));
 const x=buildAnalytics(data);
 // r1, r2 and r-bad belong to the account (10 likes each); r-bad has no usable view count, so that total is unknown.
 assert.equal(x.accounts[0].累计播放量,null);assert.equal(x.accounts[0].累计点赞,30);assert.equal(x.eligible_releases,4);
 const reasons=Object.fromEntries(x.issues.filter(i=>i.release_id?.startsWith('r-')).map(i=>[i.release_id,i.reason]));
 assert.deepEqual(reasons,{'r-gone':'release_account_missing','r-two':'link_not_unique','r-cross':'capture_post_conflict','r-nodrama':'release_drama_missing','r-bad':'capture_metrics_invalid'});
});
test('duplicate business keys are excluded and reported instead of aborting',()=>{
 const data=input();data.accounts.push(rec('a1-copy',{'账号ID':'alice','账号名':'Alice 2'}));
 const x=buildAnalytics(data);
 assert.deepEqual(x.issues.filter(i=>i.reason==='key_duplicate').map(i=>i.record_id),['a1','a1-copy']);
 assert.equal(x.accounts.length,0);assert.ok(x.issues.some(i=>i.reason==='release_account_missing'));
});
test('missing human-maintained drama metadata is reported without inventing values',()=>{const data=input();data.dramas[0].fields.平台=null;data.dramas[0].fields.上线日期=null;const x=buildAnalytics(data);assert.deepEqual(x.metadata_issues.map(i=>i.field).sort(),['上线日期','所属平台']);assert.equal(x.dramas[0].播放量,300);});
test('account calendar days and global calendar days retain identical attribution',()=>{const rows=[snap('2026-09-20',100,10),snap('2026-09-21',160,16),snap('2026-09-22',250,25)];const options={calendarStartDate:'2026-09-20',asOfDate:'2026-09-22'};const global=buildDailyViews(rows,options),account=buildDailyViews(rows,{...options,username:'alice'});assert.equal(global.find(r=>r.日期==='2026-09-21').新增播放量,90);assert.deepEqual(global,account);assert.equal(global.at(-1).新增播放量,null);});
test('daily notes identify the timezone in historical, settled, and pending rows',()=>{const rows=[snap('2026-09-19',100,10),snap('2026-09-20',150,15),snap('2026-09-21',180,18)];const report=buildDailyViews(rows,{calendarStartDate:'2026-09-20',asOfDate:'2026-09-21'});for(const row of report)assert.match(row.说明,/Asia\/Shanghai/);});
test('batch publication reporting uses actual capture time and preserves planned date',()=>{
 const data=input();data.releases[0].fields.批次ID='SB-1';data.releases[0].fields.计划发布时间='2026-09-01';data.releases[0].fields.日期='2026-09-01';data.captures[0].fields.发布时间='2026-09-05T01:00:00Z';const out=buildAnalytics(data);assert.equal(out.releaseDays.find(r=>r.日期==='2026-09-05').播放量,300);assert.equal(out.releaseDays.length,1);assert.equal(data.releases[0].fields.日期,'2026-09-01');
});
test('a release whose account row is gone still counts for its drama and date, never for an account',()=>{
 const data=input();
 data.releases.push(rec('gone',{'发布ID':'r-gone','账号':['deleted-account'],'剧':['d1'],'日期':'2026-09-02','Post ID':'7','采集记录':['c7']}));
 data.captures.push(rec('c7',{...capture('7',50).fields,'账号':['deleted-account']}));
 const x=buildAnalytics(data);
 assert.equal(x.dramas[0].播放量,350);assert.equal(x.dramas[0].发布记录数,3);
 assert.equal(x.releaseDays.find(r=>r.日期==='2026-09-02').播放量,50);
 assert.equal(x.accounts.length,1);assert.equal(x.accounts[0].累计播放量,300);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r-gone').map(i=>[i.reason,i.account_record_id]),[['release_account_missing','deleted-account']]);
});
test('a release without any account link is reported and kept out of every report',()=>{
 const data=input();
 data.releases.push(rec('noacct',{'发布ID':'r-noacct','账号':[],'剧':['d1'],'日期':'2026-09-02','Post ID':'7','采集记录':[]}));
 const x=buildAnalytics(data);
 assert.equal(x.dramas[0].发布记录数,2);assert.equal(x.dramas[0].播放量,300);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r-noacct').map(i=>i.reason),['release_account_missing']);
 assert.match(x.dramas[0].统计说明,/另有 1 条发布记录因数据问题未计入/);
});
test('a drama whose only releases were excluded is reported as unknown, never as a measured zero',()=>{
 const data=input();data.dramas.push(rec('d2',{...drama.fields,'剧ID':'SD-2','剧名':'Second'}));
 data.releases.push(release('x1','9','2026-09-03','d2'),release('x2','9','2026-09-03','d2'));data.captures.push(capture('9',500));
 const x=buildAnalytics(data);const row=x.dramas.find(r=>r.剧ID==='SD-2');
 assert.ok(row,'the drama keeps a report row');
 assert.equal(row.播放量,null);assert.equal(row.发布记录数,0);assert.equal(row.首次发布日期,'2026-09-03');assert.equal(row.数据截至日期,null);
 assert.match(row.统计说明,/另有 2 条发布记录因数据问题未计入/);
 const counted=x.dramas.find(r=>r.剧ID==='SD-1');
 assert.equal(counted.播放量,300);assert.doesNotMatch(counted.统计说明,/未计入/);
});
test('a capture with an invalid snapshot date skips only its release',()=>{
 const data=input();data.releases.push(release('r9','9','2026-09-03'));data.captures.push(capture('9',50,'2026-13-45'));
 const x=buildAnalytics(data);
 // The metrics are sound; only the evidence date of that capture is unusable.
 assert.equal(x.accounts[0].累计播放量,350);assert.equal(x.dramas[0].播放量,350);assert.equal(x.dramas[0].数据截至日期,'2026-09-20');
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r9').map(i=>[i.reason,i.post_id]),[['capture_date_invalid','9']]);
});
test('an invalid drama launch date is reported as missing metadata instead of aborting every report',()=>{
 // The fixture drama is shared between tests, so this one works on its own copy.
 const data=input();data.dramas=[rec('d1',{...drama.fields,'平台':'ReelShort','上线日期':'2026-13-45'})];
 const x=buildAnalytics(data);
 assert.equal(x.dramas[0].播放量,300);assert.equal(x.dramas[0].上线日期,null);
 assert.deepEqual(x.metadata_issues.map(i=>i.field),['上线日期']);
});
test('a release matched only by a duplicated capture Post ID is skipped instead of blanking the totals',()=>{
 const data=input();data.releases.push(rec('r5',{'发布ID':'r5','账号':['a1'],'剧':['d1'],'日期':'2026-09-03','Post ID':'5','采集记录':[]}));
 data.captures.push(capture('5',40),rec('c5-copy',capture('5',41).fields));
 const x=buildAnalytics(data);
 assert.equal(x.accounts[0].累计播放量,300);assert.equal(x.dramas[0].播放量,300);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r5').map(i=>[i.reason,i.post_id]),[['capture_key_duplicate','5']]);
});
test('every remaining kind of broken release row is isolated with its own reason',()=>{
 const data=input();
 data.accounts.push(rec('a2',{'账号ID':'bob','账号名':'Bob'}));
 data.captures.push(capture('11',10),rec('c12',{...capture('12',10).fields,'账号':['a2']}));
 data.releases.push(
  rec('m1',{'发布ID':'m-link','账号':['a1'],'剧':['d1'],'日期':'2026-09-02','Post ID':'','采集记录':['c404']}),
  rec('m2',{'发布ID':'m-acct','账号':['a1'],'剧':['d1'],'日期':'2026-09-02','Post ID':'12','采集记录':['c12']}),
  rec('m3',{'发布ID':'m-date','账号':['a1'],'剧':['d1'],'日期':'2026-13-45','Post ID':'11','采集记录':['c11']}),
  rec('m4',{'发布ID':'m-shape','账号':[{name:'no id'}],'剧':['d1'],'日期':'2026-09-02','Post ID':'13','采集记录':[]}),
  {record_id:null,fields:{'发布ID':'m-norec','账号':['a1'],'剧':['d1'],'日期':'2026-09-02','Post ID':'14','采集记录':[]}});
 const x=buildAnalytics(data);
 assert.equal(x.accounts.find(r=>r.账号ID==='alice').累计播放量,300);assert.equal(x.eligible_releases,2);
 const reasons=Object.fromEntries(x.issues.filter(i=>i.release_id?.startsWith('m-')).map(i=>[i.release_id,i.reason]));
 assert.deepEqual(reasons,{'m-link':'capture_link_missing','m-acct':'release_capture_account_conflict','m-date':'release_date_invalid','m-shape':'link_invalid'});
 assert.deepEqual(x.issues.filter(i=>i.reason==='record_id_invalid').map(i=>i.table),['发布记录']);
});
test('an invalid capture metric is a missing metric: the release stays, only that total is unknown',()=>{
 const data=input();data.releases.push(release('r6','6','2026-08-20'));data.captures.push(capture('6',-5));
 const x=buildAnalytics(data);
 assert.equal(x.eligible_releases,3);assert.equal(x.excluded_releases,0);
 assert.equal(x.dramas[0].播放量,null);assert.equal(x.dramas[0].点赞,30);assert.equal(x.dramas[0].发布记录数,3);
 // The publication facts do not depend on whether the metrics could be read.
 assert.equal(x.dramas[0].首次发布日期,'2026-08-20');
 assert.equal(x.releaseDays.find(r=>r.日期==='2026-08-20').播放量,null);
 assert.match(x.dramas[0].统计说明,/缺失指标 1 条/);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r6').map(i=>[i.reason,i.post_id]),[['capture_metrics_invalid','6']]);
});
test('a release row dropped for its own key still counts as left out for its drama',()=>{
 const data=input();data.dramas.push(rec('d2',{...drama.fields,'剧ID':'SD-2','剧名':'Second'}));
 data.releases.push(rec('k1',release('r-dup','9','2026-09-03','d2').fields),rec('k2',release('r-dup','9','2026-09-03','d2').fields));data.captures.push(capture('9',500));
 const x=buildAnalytics(data);const row=x.dramas.find(r=>r.剧ID==='SD-2');
 assert.ok(row,'the drama keeps a report row');assert.equal(row.播放量,null);
 assert.match(row.统计说明,/另有 2 条发布记录因数据问题未计入/);
 assert.equal(x.excluded_releases,2);
});
test('a left-out first release does not move the first publication date of its drama',()=>{
 const data=input();
 // r1 (2026-09-01) now points at a capture of another post: it is left out.
 data.releases[0].fields.采集记录=['c2'];
 const x=buildAnalytics(data);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r1').map(i=>i.reason),['capture_post_conflict']);
 assert.equal(x.dramas[0].发布记录数,1);assert.equal(x.dramas[0].播放量,200);
 assert.equal(x.dramas[0].首次发布日期,'2026-09-01');
 assert.equal(x.firstDays.length,1);assert.equal(x.firstDays[0].首次发布日期,'2026-09-01');
 assert.equal(x.excluded_releases,1);
});
test('an unusable account row and a capture of another account are both reported for one release',()=>{
 const data=input();data.accounts.push(rec('a2',{'账号ID':'bob','账号名':'Bob'}));
 data.releases.push(rec('g',{'发布ID':'r-g','账号':['deleted-account'],'剧':['d1'],'日期':'2026-09-02','Post ID':'8','采集记录':['c8']}));
 data.captures.push(rec('c8',{...capture('8',50).fields,'账号':['a2']}));
 const x=buildAnalytics(data);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r-g').map(i=>i.reason).sort(),['release_account_missing','release_capture_account_conflict']);
 assert.equal(x.dramas[0].播放量,300);
});
test('a draft or a scheduled release without a usable key is reported but never treated as a left-out publication',()=>{
 const data=input();
 data.releases.push(rec('draft',{'发布ID':null,'账号':['a1'],'剧':['d1'],'日期':'2026-08-01','Post ID':null,'采集记录':[],'备注':'draft'}));
 data.releases.push(rec('later',{'发布ID':null,'账号':['a1'],'剧':['d1'],'日期':'2026-12-01','Post ID':'44','采集记录':[]}));
 const x=buildAnalytics(data);
 assert.deepEqual(x.issues.filter(i=>i.reason==='key_missing').map(i=>i.record_id),['draft','later']);
 assert.equal(x.excluded_releases,0);
 assert.equal(x.dramas[0].首次发布日期,'2026-09-01');assert.equal(x.dramas[0].播放量,300);
 assert.doesNotMatch(x.dramas[0].统计说明,/未计入/);
 assert.deepEqual(x.firstDays.map(r=>r.首次发布日期),['2026-09-01']);
});
test('a left-out batch release keeps the publication date its capture states',()=>{
 const data=input();
 data.captures.push(rec('c7',{...capture('7',50).fields,'发布时间':'2026-08-15 10:00:00'}));
 // A batch release takes its date from the capture; here only the account link is empty.
 data.releases.push(rec('b1',{'发布ID':'r-batch','批次ID':'B-1','账号':[],'剧':['d1'],'日期':null,'Post ID':'7','采集记录':['c7']}));
 const x=buildAnalytics(data);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r-batch').map(i=>i.reason),['release_account_missing']);
 assert.equal(x.excluded_releases,1);
 assert.equal(x.dramas[0].首次发布日期,'2026-08-15');
 assert.match(x.dramas[0].统计说明,/另有 1 条发布记录因数据问题未计入/);
});
test('a left-out release whose date cannot be known leaves the first publication date unknown',()=>{
 const data=input();
 data.releases.push(rec('b2',{'发布ID':'r-batch2','批次ID':'B-2','账号':[],'剧':['d1'],'日期':null,'Post ID':'','采集记录':['c404']}));
 const x=buildAnalytics(data);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r-batch2').map(i=>i.reason),['capture_link_missing']);
 assert.equal(x.dramas[0].首次发布日期,null);
});
test('a capture of another post is no evidence for when a batch release was published',()=>{
 const batch=(links)=>rec('b3',{'发布ID':'r-b3','批次ID':'B-3','账号':['a1'],'剧':['d1'],'日期':null,'Post ID':'20','采集记录':links});
 const foreign=(when)=>rec('c30',{...capture('30',5).fields,'发布时间':when});
 // The linked capture belongs to post 30 and claims an early date.
 let data=input();data.captures.push(foreign('2026-08-01 10:00:00'));data.releases.push(batch(['c30']));
 let x=buildAnalytics(data);
 assert.deepEqual(x.issues.filter(i=>i.release_id==='r-b3').map(i=>i.reason),['capture_post_conflict']);
 assert.equal(x.excluded_releases,1);
 assert.equal(x.dramas[0].首次发布日期,null);
 assert.equal(x.firstDays.some(r=>r.首次发布日期==='2026-08-01'),false);
 // The same wrong capture claims a future date: the release is still a left-out publication.
 data=input();data.captures.push(foreign('2026-12-01 10:00:00'),rec('c20',{...capture('20',7).fields,'发布时间':'2026-09-10 10:00:00'}));data.releases.push(batch(['c30']));
 x=buildAnalytics(data);
 assert.equal(x.excluded_releases,1);
 assert.equal(x.dramas[0].首次发布日期,null);
 assert.match(x.dramas[0].统计说明,/另有 1 条发布记录因数据问题未计入/);
});
