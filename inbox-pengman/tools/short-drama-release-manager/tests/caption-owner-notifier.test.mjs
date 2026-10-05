import test from 'node:test';
import assert from 'node:assert/strict';
import {JobStore} from '../src/job-store.mjs';
import {processCaptionOwnerNotifications} from '../src/caption-owner-notifier.mjs';

function fixture(){
 const jobs=new JobStore(':memory:');
 const plan={lead_review_only:true,actions:[{post_id:'123',account_id:'dramaone',account_record_id:'a1',capture_record_id:'c1',video_url:'https://www.tiktok.com/@dramaone/video/123',owner_id:'ou_owner'}]};
 jobs.db.exec(`CREATE TABLE caption_backfill_runs(request_id TEXT PRIMARY KEY,state TEXT,plan_json TEXT,completed_json TEXT)`);
 jobs.db.prepare('INSERT INTO caption_backfill_runs VALUES(?,?,?,?)').run('caption-review','complete',JSON.stringify(plan),JSON.stringify([{post_id:'123',release_id:'SR-123',release_record_id:'r1',reverse_pending:false}]));
 const accounts=new Map([['dramaone',{record_id:'a1',fields:{负责人:[{id:'ou_owner'}]}}]]);
 const captures=new Map([['123',{record_id:'c1',fields:{关联发布记录:[{id:'r1'}]}}]]);
 const releases=new Map([['SR-123',{record_id:'r1',fields:{发布ID:'SR-123',账号:[{id:'a1'}],剧:[],归档状态:'active','Post ID':'123',视频链接:'https://www.tiktok.com/@dramaone/video/123',采集记录:[{id:'c1'}]}}]]);
 const repos={accounts:{loadIndex:async()=>accounts},captures:{loadIndex:async()=>captures},releases:{loadIndex:async()=>releases}};
 return {jobs,repos,captures,accounts};
}

test('verified blank-drama release is sent once to the actual account owner',async()=>{
 const f=fixture(),messages=[];
 const request={jobs:f.jobs,repos:f.repos,requestId:'caption-review',baseUrl:'https://example.com/base/token',tableId:'tblRelease',
  send:async message=>{messages.push(message);return {message_id:'om_ack'};}};
 const first=await processCaptionOwnerNotifications(request);
 assert.equal(first.sent,1);assert.equal(messages[0].userId,'ou_owner');assert.match(messages[0].text,/SR-123/);
 assert.match(messages[0].text,/匹配正确的剧/);
 const second=await processCaptionOwnerNotifications(request);
 assert.equal(second.sent,0);assert.equal(messages.length,1);
 assert.equal(f.jobs.db.prepare('SELECT state FROM caption_owner_notifications').get().state,'sent');
 f.jobs.close();
});

test('a changed capture relation prevents owner notification',async()=>{
 const f=fixture();f.captures.get('123').fields.关联发布记录=[];
 let calls=0;
 const result=await processCaptionOwnerNotifications({jobs:f.jobs,repos:f.repos,requestId:'caption-review',baseUrl:'https://example.com/base/token',tableId:'tblRelease',send:async()=>{calls++;return {message_id:'om_ack'};}});
 assert.equal(calls,0);assert.deepEqual(result.held,[{post_id:'123',reason:'record_changed'}]);
 f.jobs.close();
});

test('full recognition notifies unresolved records and skips fully identified releases',async()=>{
 const f=fixture();const stored=f.jobs.db.prepare('SELECT plan_json FROM caption_backfill_runs').get();const plan=JSON.parse(stored.plan_json);plan.lead_review_only=false;plan.recognition_mode=true;plan.actions[0].review_reason='drama_title_unmatched';
 f.jobs.db.prepare('UPDATE caption_backfill_runs SET plan_json=?').run(JSON.stringify(plan));
 let sent=0;const result=await processCaptionOwnerNotifications({jobs:f.jobs,repos:f.repos,requestId:'caption-review',baseUrl:'https://example.com/base/token',tableId:'tblRelease',send:async()=>{sent++;return {message_id:'om_full'};}});
 assert.equal(result.sent,1);assert.equal(sent,1);f.jobs.close();
});
test('unresolved caption messages are deferred outside configured daytime hours',async()=>{
 const f=fixture();let calls=0;
 const result=await processCaptionOwnerNotifications({jobs:f.jobs,repos:f.repos,requestId:'caption-review',baseUrl:'https://example.com/base/token',tableId:'tblRelease',respectQuietHours:true,now:()=>new Date('2026-09-29T15:00:00Z'),send:async()=>{calls++;return {message_id:'om_ack'};}});
 assert.equal(calls,0);assert.equal(result.status,'deferred');f.jobs.close();
});

test('the scheduler notification sweep sends earlier completed review work without a new capture',async()=>{
 const {processCaptionAutomationNotifications}=await import('../src/caption-owner-notifier.mjs');const f=fixture();
 f.jobs.db.exec('ALTER TABLE caption_backfill_runs ADD COLUMN updated_at TEXT');f.jobs.db.prepare("UPDATE caption_backfill_runs SET request_id='caption-auto-notify',updated_at='2026-09-29'").run();
 let sent=0;const args={jobs:f.jobs,repos:f.repos,baseUrl:'https://example.com/base/token',tableId:'tblRelease',captureTableId:'tblCapture',now:()=>new Date('2026-09-29T02:00:00Z'),send:async()=>{sent++;return {message_id:'om_sweep'};}};
 assert.equal((await processCaptionAutomationNotifications(args)).sent,1);assert.equal((await processCaptionAutomationNotifications(args)).sent,0);assert.equal(sent,1);f.jobs.close();
});
test('configured Post exclusion suppresses saved owner receipts and held review reminders',async()=>{
 const {processCaptionAutomationNotifications}=await import('../src/caption-owner-notifier.mjs');const f=fixture();
 f.jobs.db.exec('ALTER TABLE caption_backfill_runs ADD COLUMN updated_at TEXT');
 f.jobs.db.prepare("UPDATE caption_backfill_runs SET request_id='caption-auto-excluded',updated_at='2026-09-29'").run();
 f.jobs.db.exec('CREATE TABLE caption_auto_reviews(post_id TEXT PRIMARY KEY,reason TEXT,evidence_json TEXT,updated_at TEXT)');
 f.jobs.db.prepare('INSERT INTO caption_auto_reviews VALUES(?,?,?,?)').run('123','capture_identity_conflict','{}','2026-09-29');
 f.captures.get('123').fields.关联发布记录=[];
 let sent=0;
 const result=await processCaptionAutomationNotifications({jobs:f.jobs,repos:f.repos,baseUrl:'https://example.com/base/token',
  tableId:'tblRelease',captureTableId:'tblCapture',now:()=>new Date('2026-09-29T02:00:00Z'),
  excludedPostIds:['123'],send:async()=>{sent++;return {message_id:'om_unexpected'};}});
 assert.equal(result.sent,0);assert.equal(sent,0);
 assert.equal(f.jobs.db.prepare("SELECT COUNT(*) n FROM caption_auto_reviews WHERE post_id='123'").get().n,1);
 f.jobs.close();
});
test('held capture owner messages are durable and are not blindly re-sent after an unknown result',async()=>{
 const {processCaptionAutomationNotifications}=await import('../src/caption-owner-notifier.mjs');const f=fixture();
 f.jobs.db.exec('DROP TABLE caption_backfill_runs');f.jobs.db.exec('CREATE TABLE caption_auto_reviews(post_id TEXT PRIMARY KEY,reason TEXT,evidence_json TEXT,updated_at TEXT)');
 f.jobs.db.prepare('INSERT INTO caption_auto_reviews VALUES(?,?,?,?)').run('123','unresolved_release_plan','{}','2026-09-29');
 f.captures.get('123').fields.关联发布记录=[];f.captures.get('123').fields.账号=[{id:'a1'}];let sends=0;
 const args={jobs:f.jobs,repos:f.repos,baseUrl:'https://example.com/base/token',tableId:'tblRelease',captureTableId:'tblCapture',now:()=>new Date('2026-09-29T02:00:00Z'),send:async()=>{sends++;throw Error('lost');}};
 await processCaptionAutomationNotifications(args);await processCaptionAutomationNotifications(args);assert.equal(sends,1);f.jobs.close();
});
test('Part and schedule-slot conflict explains the uncertainty in plain language',async()=>{
 const {processCaptionAutomationNotifications}=await import('../src/caption-owner-notifier.mjs');const f=fixture();
 f.jobs.db.exec('DROP TABLE caption_backfill_runs');
 f.jobs.db.exec('CREATE TABLE caption_auto_reviews(post_id TEXT PRIMARY KEY,reason TEXT,evidence_json TEXT,updated_at TEXT)');
 f.jobs.db.prepare('INSERT INTO caption_auto_reviews VALUES(?,?,?,?)').run('123','part_slot_conflict','{}','2026-09-29');
 f.captures.get('123').fields={关联发布记录:[],账号:[{id:'a1'}],Caption:'part 4 | The Ice Man'};
 const messages=[];
 await processCaptionAutomationNotifications({jobs:f.jobs,repos:f.repos,baseUrl:'https://example.com/base/token',tableId:'tblRelease',captureTableId:'tblCapture',
  now:()=>new Date('2026-09-29T02:00:00Z'),send:async message=>{messages.push(message);return {message_id:'om_part'};}});
 assert.equal(messages.length,1);assert.match(messages[0].text,/Part 4/);
 assert.match(messages[0].text,/不能确定.*发布记录/);
 assert.match(messages[0].text,/没有自动关联/);
 assert.doesNotMatch(messages[0].text,/part_slot_conflict|请核对账号、剧名/);
 f.jobs.close();
});
test('other held captures explain the concern without exposing an internal reason code or full caption',async()=>{
 const {processCaptionAutomationNotifications}=await import('../src/caption-owner-notifier.mjs');const f=fixture();
 f.jobs.db.exec('DROP TABLE caption_backfill_runs');
 f.jobs.db.exec('CREATE TABLE caption_auto_reviews(post_id TEXT PRIMARY KEY,reason TEXT,evidence_json TEXT,updated_at TEXT)');
 f.jobs.db.prepare('INSERT INTO caption_auto_reviews VALUES(?,?,?,?)').run('123','capture_identity_conflict','{}','2026-09-29');
 f.captures.get('123').fields={关联发布记录:[],账号:[{id:'a1'}],Caption:'Long promotional text'};
 const sent=[];
 await processCaptionAutomationNotifications({jobs:f.jobs,repos:f.repos,baseUrl:'https://example.com/base/token',tableId:'tblRelease',captureTableId:'tblCapture',
  now:()=>new Date('2026-09-29T02:00:00Z'),send:async message=>{sent.push(message.text);return {message_id:'om_review'};}});
 assert.equal(sent.length,1);assert.match(sent[0],/账号.*链接.*发布时间/);
 assert.match(sent[0],/没有自动关联/);assert.doesNotMatch(sent[0],/capture_identity_conflict|Caption：/);
 f.jobs.close();
});
