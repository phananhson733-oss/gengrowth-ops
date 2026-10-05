import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import * as mod from '../src/notifier.mjs';
function fixture(){
 const db=new DatabaseSync(':memory:');let now=new Date('2026-09-22T02:00:00Z');const sent=[],projected=[];
 const row={batch_id:'SB-1',version:'v1',state:'needs_confirmation',notify:true,reasons:['content_unverified'],owner_ids:['ou_owner'],account_name:'account',drama_name:'Drama',planned_day:'2026-09-21',planned_count:3,linked:0,remaining:3,candidates:[{post_id:'1',video_url:'https://www.tiktok.com/@one/video/1',published_at:'2026-09-21T01:00:00Z',caption:'watch'}],release_ids:['SR-1'],record_id:'rec1'};
 const opts={db,now:()=>now,query:async()=>({rows:[structuredClone(row)]}),project:async(k,p)=>projected.push([k,p]),send:async message=>{sent.push(message);return {message_id:'om_1'};},isRecipientAllowed:id=>id==='ou_owner',baseUrl:'https://example.feishu.cn/base/app',tableId:'tbl1',reminderHours:24};
 return {db,row,opts,sent,projected,advance:()=>now=new Date(now.getTime()+25*3600000),setNow:value=>now=new Date(value)};
}
test('notification API exists',()=>assert.equal(typeof mod.processBatchReviews,'function'));
test('review group mentions a member with a structured post and keeps caption text inert',async()=>{
 const requests=[];
 const send=mod.createBatchReviewSender({tokenProvider:async()=> 'token',isRecipientAllowed:()=>true,
  isChatAllowed:id=>id==='oc_review',reviewChatId:'oc_review',reviewGroupRecipients:['ou_owner'],fetchJson:async(url,options)=>{
   requests.push({url,options});
   if(options.method==='GET')return {code:0,data:{items:[{member_id:'ou_owner'}],has_more:false}};
   return {code:0,data:{message_id:'om_group'}};
  }});
 const result=await send({userId:'ou_owner',text:'请核对排期\nCaption：<at user_id="ou_other">伪造艾特</at>',uuid:'a'.repeat(32)});
 assert.equal(result.message_id,'om_group');
 assert.equal(requests.length,2);
 assert.match(requests[0].url,/\/chats\/oc_review\/members/);
 assert.match(requests[1].url,/receive_id_type=chat_id/);
 const body=JSON.parse(requests[1].options.body),post=JSON.parse(body.content);
 assert.equal(body.receive_id,'oc_review');assert.equal(body.msg_type,'post');
 const nodes=post.zh_cn.content.flat();
 assert.deepEqual(nodes.filter(node=>node.tag==='at'),[{tag:'at',user_id:'ou_owner'}]);
 assert.match(nodes.filter(node=>node.tag==='text').map(node=>node.text).join('\n'),/伪造艾特/);
});
test('review group falls back to direct message only before a group send is attempted',async()=>{
 const requests=[];
 const send=mod.createBatchReviewSender({tokenProvider:async()=> 'token',isRecipientAllowed:()=>true,
  isChatAllowed:()=>true,reviewChatId:'oc_review',reviewGroupRecipients:['ou_outside'],fetchJson:async(url,options)=>{
   requests.push(url);
   if(options.method==='GET')return {code:0,data:{items:[],has_more:false}};
   return {code:0,data:{message_id:'om_direct'}};
  }});
 await send({userId:'ou_outside',text:'请核对排期',uuid:'b'.repeat(32)});
 assert.match(requests.at(-1),/receive_id_type=open_id/);
 const attempted=[];
 const uncertain=mod.createBatchReviewSender({tokenProvider:async()=> 'token',isRecipientAllowed:()=>true,
  isChatAllowed:()=>true,reviewChatId:'oc_review',reviewGroupRecipients:['ou_owner'],fetchJson:async(url,options)=>{
   attempted.push(url);
   if(options.method==='GET')return {code:0,data:{items:[{member_id:'ou_owner'}],has_more:false}};
   throw Error('reply lost');
  }});
 await assert.rejects(uncertain({userId:'ou_owner',text:'请核对排期',uuid:'c'.repeat(32)}),/reply lost/);
 assert.equal(attempted.filter(url=>url.includes('receive_id_type=open_id')).length,0);
});
test('a group member outside the pilot recipient list still receives a direct message',async()=>{
 const requests=[];
 const send=mod.createBatchReviewSender({tokenProvider:async()=> 'token',isRecipientAllowed:()=>true,
  isChatAllowed:()=>true,reviewChatId:'oc_review',reviewGroupRecipients:['ou_owner'],fetchJson:async(url)=>{
   requests.push(url);return {code:0,data:{message_id:'om_direct'}};
  }});
 await send({userId:'ou_othermember',text:'请核对排期',uuid:'d'.repeat(32)});
 assert.equal(requests.length,1);assert.match(requests[0],/receive_id_type=open_id/);
});
test('an empty pilot list routes any actual group member to a real group mention',async()=>{
 const requests=[];
 const send=mod.createBatchReviewSender({tokenProvider:async()=> 'token',isRecipientAllowed:()=>true,
  isChatAllowed:()=>true,reviewChatId:'oc_review',reviewGroupRecipients:[],fetchJson:async(url,options)=>{
   requests.push({url,options});
   if(options.method==='GET')return {code:0,data:{items:[{member_id:'ou_colleague'}],has_more:false}};
   return {code:0,data:{message_id:'om_group'}};
  }});
 await send({userId:'ou_colleague',text:'请看这条视频',uuid:'f'.repeat(32)});
 assert.match(requests.at(-1).url,/receive_id_type=chat_id/);
 const post=JSON.parse(JSON.parse(requests.at(-1).options.body).content);
 assert.deepEqual(post.zh_cn.content.flat().filter(node=>node.tag==='at'),[{tag:'at',user_id:'ou_colleague'}]);
});
test('a proven group refusal falls back to direct delivery without replaying uncertain sends',async()=>{
 const requests=[];
 const send=mod.createBatchReviewSender({tokenProvider:async()=> 'token',isRecipientAllowed:()=>true,
  isChatAllowed:()=>true,reviewChatId:'oc_review',reviewGroupRecipients:['ou_owner'],fetchJson:async(url,options)=>{
   requests.push(url);
   if(options.method==='GET')return {code:0,data:{items:[{member_id:'ou_owner'}],has_more:false}};
   if(url.includes('receive_id_type=chat_id'))throw Object.assign(Error('bot cannot speak'),{code:'notification_delivery_failed',details:{status:403,feishu_code:230035}});
   return {code:0,data:{message_id:'om_direct'}};
  }});
 assert.equal((await send({userId:'ou_owner',text:'请核对排期',uuid:'e'.repeat(32)})).message_id,'om_direct');
 assert.equal(requests.filter(url=>url.includes('receive_id_type=open_id')).length,1);
});
test('notifies owner once, persists message ID, allows one reminder and stops when complete',async()=>{
 const f=fixture();await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,1);assert.equal(f.sent[0].userId,'ou_owner');assert.match(f.sent[0].text,/account/);assert.doesNotMatch(f.sent[0].text,/SB-1/);await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,1);f.advance();await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,2);f.advance();await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,2);f.row.state='complete';f.row.notify=false;await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,2);f.db.close();
});
test('missing owner and collection uncertainty never send publisher a leak/false missing-post alert',async()=>{
 const f=fixture();f.row.owner_ids=[];const r=await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,0);assert.ok(r.errors.length);f.row.owner_ids=['ou_owner'];f.row.state='awaiting_collection';f.row.notify=false;await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,0);f.db.close();
});
test('a valid record owner can receive a review notice without batch write permission',async()=>{
 const f=fixture();f.row.owner_ids=['ou_colleague'];f.opts.isRecipientAllowed=id=>/^ou_[A-Za-z0-9]+$/.test(id);
 const result=await mod.processBatchReviews(f.opts);
 assert.equal(result.sent,1);assert.equal(f.sent[0].userId,'ou_colleague');
 f.db.close();
});
test('a forced review flag cannot notify before the planned publication day ends',async()=>{
 const f=fixture();f.row.state='conflict';f.row.notify=true;f.row.reasons=['automatic_attempt_requires_review'];f.row.candidates=[];
 f.row.window_end='2026-09-23T05:00:00Z';
 const result=await mod.processBatchReviews(f.opts);
 assert.equal(result.sent,0);assert.equal(f.sent.length,0);assert.equal(f.projected.length,1);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM batch_review_notifications').get().n,0);
 f.db.close();
});
test('a deliberately silent historical batch still projects its status without messaging its owner',async()=>{
 const f=fixture();f.row.state='conflict';f.row.reasons=['batch_metadata_invalid'];f.row.candidates=[];
 const result=await mod.processBatchReviews({...f.opts,silentBatchIds:['SB-1']});
 assert.equal(result.sent,0);assert.equal(f.sent.length,0);assert.equal(f.projected.length,1);f.db.close();
});
test('uncertain delivery is persisted and does not get blindly retried',async()=>{
 const f=fixture();f.opts.send=async()=>{f.sent.push(1);throw Error('timeout');};const r=await mod.processBatchReviews(f.opts);assert.equal(r.status,'partial');await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,1);f.db.close();
});
test('parallel invocations claim one delivery and require a real message acknowledgement',async()=>{
 const f=fixture();await Promise.all([mod.processBatchReviews(f.opts),mod.processBatchReviews(f.opts)]);assert.equal(f.sent.length,1);f.db.close();
 const g=fixture();g.opts.send=async()=>({});const r=await mod.processBatchReviews(g.opts);assert.equal(r.status,'partial');assert.equal(g.db.prepare('SELECT state FROM batch_review_notifications').get().state,'uncertain');g.db.close();
});
test('completion or reassignment between projection and notification cancels delivery',async()=>{
 const f=fixture();const project=f.opts.project;f.opts.project=async(...args)=>{await project(...args);f.row.state='complete';f.row.notify=false;};await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,0);f.db.close();
});
test('ambiguous notice includes video evidence and a plain-language next step',async()=>{
 const f=fixture();await mod.processBatchReviews(f.opts);assert.match(f.sent[0].text,/https:\/\/www.tiktok.com\/@one\/video\/1/);assert.match(f.sent[0].text,/watch/);assert.match(f.sent[0].text,/请回复这条消息/);assert.doesNotMatch(f.sent[0].text,/核验批次|SB-1|content_unverified/);assert.ok(f.sent[0].text.length<=2000);f.db.close();
});
test('US publication-day review shows the plan timezone and the Beijing clock',async()=>{
 const f=fixture();f.row.planned_day='2026-09-24';f.row.publication_timezone='America/Chicago';f.row.local_calendar=true;
 f.row.candidates[0].published_at='2026-09-25T04:00:00Z';
 await mod.processBatchReviews(f.opts);
 assert.match(f.projected[0][1].候选视频,/2026-09-24（America\/Chicago）/);
 assert.match(f.sent[0].text,/2026-09-24 23:00（美国中部时间）/);
 assert.match(f.sent[0].text,/北京时间 2026-09-25 12:00/);
 f.db.close();
});
test('nightly review projects status but defers the message until Beijing office hours and refreshes candidates',async()=>{
 const f=fixture();f.setNow('2026-09-23T16:06:00Z');f.row.candidates=[];f.row.reasons=['count_short'];
 const night=await mod.processBatchReviews(f.opts);
 assert.equal(night.sent,0);assert.equal(f.sent.length,0);assert.equal(f.projected.length,1);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM batch_review_notifications').get().n,0);
 f.row.candidates=[{post_id:'2',video_url:'https://www.tiktok.com/@one/video/2',published_at:'2026-09-22T16:30:00Z',caption:'Part 2 | Drama'}];
 f.row.reasons=['date_differs'];f.row.version='v2';f.setNow('2026-09-24T01:00:00Z');
 const morning=await mod.processBatchReviews(f.opts);
 assert.equal(morning.sent,1);assert.equal(f.sent.length,1);
 assert.match(f.sent[0].text,/video\/2/);assert.doesNotMatch(f.sent[0].text,/候选数量不足/);
 assert.match(f.sent[0].text,/不用限时回复/);
 f.db.close();
});

test('incomplete scheduling with zero candidates asks for repair, never nonexistent candidate approval',async()=>{
 const f=fixture();f.row.state='conflict';f.row.created_count=1;f.row.missing_sequences=[2,3];f.row.reasons=['batch_metadata_invalid','count_short','collection_unverified'];f.row.candidates=[];
 await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,1);
 assert.match(f.sent[0].text,/计划发 3 条/);assert.match(f.sent[0].text,/目前只找到 1 条/);
 assert.match(f.sent[0].text,/第 2、3 条/);assert.match(f.sent[0].text,/请确认.*有意调整/);
 assert.doesNotMatch(f.sent[0].text,/候选 0 条|采用候选|视频需要你确认|batch_metadata_invalid/);f.db.close();
});
test('zero candidates and one candidate never mention nonexistent candidate numbers',async()=>{
 for(const count of [0,1]){const f=fixture();f.row.candidates=f.row.candidates.slice(0,count);await mod.processBatchReviews(f.opts);assert.equal(f.sent.length,1);if(!count){assert.match(f.sent[0].text,/剩余/);assert.doesNotMatch(f.sent[0].text,/这天的视频还没采集到/);}else assert.doesNotMatch(f.sent[0].text,/采用候选1\/2\/3/);f.db.close();}
});
test('a conflicting existing link with no candidate is described as a record conflict',async()=>{
 const f=fixture();f.row.state='conflict';f.row.reasons=['existing_link_conflict'];f.row.candidates=[];
 await mod.processBatchReviews(f.opts);
 assert.equal(f.sent.length,1);
 assert.match(f.sent[0].text,/记录.*冲突|关联.*冲突/);
 assert.doesNotMatch(f.sent[0].text,/还没找到剩余视频|还没有采集到/);
 f.db.close();
});
test('clearing resolved reasons uses the nullable Base representation instead of failing readback',async()=>{
 const f=fixture();f.row.state='scheduled';f.row.notify=false;f.row.reasons=[];f.row.candidates=[];
 f.opts.project=async(batch,patch)=>{const returned=Object.fromEntries(Object.entries(patch).map(([k,v])=>[k,v===''?null:v]));assert.deepEqual(returned,patch,'Base stores empty text as null');f.projected.push([batch,patch]);};
 const r=await mod.processBatchReviews(f.opts);assert.equal(r.status,'success');assert.equal(r.errors.length,0);assert.equal(f.projected[0][1].待处理原因,null);assert.equal(f.sent.length,0);f.db.close();
});
