import test from 'node:test';
import assert from 'node:assert/strict';
import {extractCaptionIdentity,resolveCaptionDrama,buildPromotionIndex,titleKey} from '../src/caption-recognition.mjs';
const drama=(id,title,platform='ReelShort')=>[id,{record_id:`rec-${id}`,fields:{剧ID:id,剧名:title,平台:platform,归档状态:'active'}}];
const pool=(...rows)=>new Map(rows);
test('Part prefix separates The Ice Man from its following sentence',()=>{
 const result=extractCaptionIdentity("part 1 | The Ice Man A man's weakness is mocked in front of others. Watch on ReelShort. Search code 4933302.");
 assert.equal(result.title,'The Ice Man');assert.equal(result.platform,'ReelShort');assert.equal(result.code,'4933302');
});
test('parentheses carry the drama title rather than the changing segment hook',()=>{
 const result=extractCaptionIdentity('Part 2 | Her Daughter Needs Help (Deny Me, Dragon King) Lyra searches for a healer. Download the DramaBox app. Copy the code [vie22]');
 assert.equal(result.title,'Deny Me, Dragon King');assert.equal(result.code,'vie22');
});
test('camel-case and numeric leading hashtags become readable titles',()=>{
 assert.equal(extractCaptionIdentity('#OneBetrayalOneNightWithMyBoss She fears losing her job. Download the MoboReels app.').title,'One Betrayal One Night With My Boss');
 assert.equal(titleKey(extractCaptionIdentity('#The7YearOldBoxingChampion').title),titleKey('The 7-Year-Old Boxing Champion'));
});
test('plot hooks and generic hashtags do not invent pool titles',()=>{
 for(const text of ['Part 1 | She Took Her Sister’s Place at a Deadly Mafia Wedding Victoria runs away. Download the DramaBox app.', '#ShortDrama #EnemiesToLovers #CEO #FatedMates', 'She takes a dangerous deal. #HiddenIdentity #SingleDadRomance'])assert.equal(extractCaptionIdentity(text).title,null,text);
});
test('title hashtags at the end match a unique existing pool row',()=>{
 const dramas=pool(drama('d1','The Dragon Lord Returns','DramaBox'));
 const r=resolveCaptionDrama({caption:'He worked at a car wash. Download the DramaBox app. #ShortDrama #TheDragonLordReturns #HiddenIdentity',dramas});
 assert.equal(r.drama_id,'d1');assert.equal(r.status,'matched');
});
test('format differences reuse an existing title, including markdown display labels',()=>{
 const dramas=pool(drama('d1','[One Betrayal, One Night With My Boss](https://example.test)','MoboReels'));
 assert.equal(resolveCaptionDrama({caption:'#OneBetrayalOneNightWithMyBoss Watch on MoboReels',dramas}).drama_id,'d1');
});
test('a confidently bounded unknown title proposes one new pool row',()=>{
 const r=resolveCaptionDrama({caption:'Part 1 | The Ice Man A man wakes up. Watch on ReelShort.',dramas:pool()});
 assert.equal(r.status,'new');assert.equal(r.title,'The Ice Man');
});
test('duplicate pool titles and contradictory platforms are review cases, never new rows',()=>{
 assert.equal(resolveCaptionDrama({caption:'Part 1 | The Ice Man A man wakes up. Watch on ReelShort.',dramas:pool(drama('d1','The Ice Man'),drama('d2','The Ice Man'))}).status,'ambiguous');
 assert.equal(resolveCaptionDrama({caption:'#TheIceMan Watch on DramaBox',dramas:pool(drama('d1','The Ice Man'))}).status,'conflict');
});
test('platform-scoped promotion codes resolve code-only captions and do not cross platforms',()=>{
 const dramas=pool(drama('d1','High Society'));
 const promotionIndex=buildPromotionIndex({dramas,captures:pool(),releases:pool(),verifiedCodes:[{platform:'ReelShort',code:'4717815',drama_id:'d1'}]});
 assert.equal(resolveCaptionDrama({caption:'She signs a deal. ReelShort. Look up “4717815”',dramas,promotionIndex}).drama_id,'d1');
 assert.equal(resolveCaptionDrama({caption:'She signs a deal. DramaBox. Look up “4717815”',dramas,promotionIndex}).status,'unknown');
});
test('explicit contradictory title prevents promotion-code misassignment',()=>{
 const dramas=pool(drama('d1','High Society'),drama('d2','Dark Notes'));
 const promotionIndex=buildPromotionIndex({dramas,captures:pool(),releases:pool(),verifiedCodes:[{platform:'ReelShort',code:'12345',drama_id:'d1'}]});
 assert.equal(resolveCaptionDrama({caption:'Part 1 | Dark Notes She discovers a secret. ReelShort. Code 12345',dramas,promotionIndex}).status,'conflict');
});
test('a wrong historical link cannot teach a promotion code',()=>{
 const dramas=pool(drama('d1','High Society'),drama('d2','Dark Notes'));
 const captures=pool(['123',{record_id:'c1',fields:{Caption:'Part 1 | Dark Notes She discovers a secret. ReelShort. Code 12345',关联发布记录:[{id:'r1'}]}}]);
 const releases=pool(['SR-1',{record_id:'r1',fields:{剧:[{id:'rec-d1'}],采集记录:[{id:'c1'}],'Post ID':'123'}}]);
 const promotionIndex=buildPromotionIndex({dramas,captures,releases});
 assert.equal(resolveCaptionDrama({caption:'A secret. ReelShort. Code 12345',dramas,promotionIndex}).status,'unknown');
});

test('a one-character spelling difference cannot silently create a duplicate drama',()=>{
 const r=resolveCaptionDrama({caption:'Part 2 | The Wolfless Queen After sacrificing her life, she leaves. ReelShort.',dramas:pool(drama('d1','he Wolfless Queen'))});
 assert.equal(r.status,'ambiguous');assert.equal(r.reason,'similar_pool_title');
});
