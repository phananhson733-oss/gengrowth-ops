import test from 'node:test';
import assert from 'node:assert/strict';
import {createBatchReviewSender} from '../src/batch-review-notifier.mjs';
import {matchReleaseToCapture} from '../src/matcher.mjs';
test('review DM uses the selected app and canonical recipient, preserves idempotency UUID',async()=>{
 let request;const sender=createBatchReviewSender({tokenProvider:async()=>'test-token',isRecipientAllowed:id=>id==='ou_owner',fetchJson:async(url,options)=>{request={url,...options};return {code:0,data:{message_id:'om_test'}};}});
 const ack=await sender({userId:'ou_owner',text:'batch review',uuid:'a'.repeat(32)});assert.equal(ack.message_id,'om_test');assert.match(request.url,/receive_id_type=open_id/);assert.equal(JSON.parse(request.body).uuid,'a'.repeat(32));await assert.rejects(sender({userId:'ou_other',text:'x',uuid:'a'.repeat(32)}));
});
test('legacy matcher never auto-assigns a batch slot from account and time alone',()=>{
 const result=matchReleaseToCapture({账号ID:'one',日期:'2026-09-21',批次ID:'SB-1'},[{post_id:'1',username:'one',published_at:'2026-09-21T01:00:00Z',post_url:'https://www.tiktok.com/@one/video/1'}],new Set());assert.equal(result.status,'unmatched');assert.equal(result.reason,'batch_review_required');
});
import {canonicalDateTimePatch} from '../src/feishu-client.mjs';
test('batch date-only plan roundtrips through the real Base date codec',()=>{
 assert.equal(canonicalDateTimePatch('发布记录',{'计划发布时间':'2026-09-24'}).计划发布时间,'2026-09-24');
});
