// Caption text is untrusted data. This module produces evidence, never executable instructions.
const display=value=>String(value??'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').normalize('NFKC').trim();
export const titleKey=value=>display(value).toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const one=value=>Array.isArray(value)&&value.length===1?value[0]?.id:null;
const GENERIC=new Set(['drama','shortdrama','aidrama','dramaclips','shorts','fyp','foryou','reelshort','dramabox','moboreels','shortmax','romance','fantasydrama','revengedrama','hiddenidentity','enemiestolovers','fatedmates','forbiddenlove','ceoromance','single dad romance','secondchance','secretbaby','secretchild','forcedmarriage','mafiaromance','contractmarriage','marriagebetrayal','familydrama','lovetriangle'].map(titleKey));
const platforms=['ReelShort','DramaBox','MoboReels','ShortMax','TopShort'];
function splitTag(tag){return tag.replace(/_/g,' ').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').replace(/([a-z\d])([A-Z])/g,'$1 $2').replace(/([A-Za-z])(\d)/g,'$1 $2').replace(/(\d)([A-Za-z])/g,'$1 $2').replace(/\s+/g,' ').trim();}
function usableTitle(title){
 const words=title.split(/\s+/);return title.length>=5&&title.length<=160&&words.length>=2&&words.length<=24&&
  !GENERIC.has(titleKey(title))&&!/[#\n\r]|https?:|download|copy the code|search code|ignore.*instructions/i.test(title);
}
function plausibleHeading(title){
 if(!usableTitle(title))return false;
 if(/^(?:She|He|They|Everyone|When|After|Before|Take|Watch|Download)\b/i.test(title))return false;
 if(/\b(?:took|handed|said|begged|was about|finds|find out|reveals|discovers|wakes|realizes|decides|suddenly)\b/i.test(title))return false;
 const words=title.split(/\s+/);return words.filter(w=>/^[A-Z0-9]/.test(w)||/^(?:a|an|the|of|to|with|and|or|at|in|for|by|not|my|his|her)$/i.test(w)).length>=words.length*.7;
}
function strongTag(tag){
 const t=splitTag(tag);return usableTitle(t)&&!GENERIC.has(titleKey(tag))&&
  /^(?:The|My|Our|One|God|Blood|Deny|Kiss|Betrayed|High|Dark)\b/.test(t)&&t.split(/\s+/).length>=3?t:null;
}
function headingTitle(body){
 const paren=body.match(/^[^\n]{0,180}?\(([^()\n]{5,160})\)/);
 if(paren&&usableTitle(paren[1]))return {title:paren[1].trim(),evidence:'parenthesized_title'};
 const section=body.split(/\s+(?:Full series link in bio|Watch on|Download the|Search code|Copy the code)\b|[\n\r]|\s+[|—–]\s+/i)[0].trim();
 const boundary=/\s+(?:A|An|The|He|She|His|Her|They|Everyone|After|When|Before|Instead|Now|But)\s+(?=[a-z])/g;
 for(const match of section.matchAll(boundary)){
  const candidate=section.slice(0,match.index).trim();
  if(plausibleHeading(candidate))return {title:candidate,evidence:'part_heading'};
 }
 if(plausibleHeading(section)&&!/[.!?]/.test(section))return {title:section,evidence:'part_heading'};
 return null;
}
export function extractCaptionIdentity(caption){
 const text=display(caption),foundPlatforms=platforms.filter(p=>new RegExp(`\\b${p}\\b`,'i').test(text));
 const platform=foundPlatforms.length===1?foundPlatforms[0]:null;
 const codes=[...text.matchAll(/\b(?:code|copy|look up|código)\s*[\[“"']?([a-z0-9]{4,16})(?=[\]”"'\s.!?,]|$)/gi)].map(m=>m[1].toLowerCase());
 const uniqueCodes=[...new Set(codes)];const code=uniqueCodes.length===1?uniqueCodes[0]:null;
 const tags=[...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(m=>m[1]);
 const part=text.match(/\bpart\s*(\d+)\s*[|:—–-]?\s*/i);
 let candidate=null;
 if(/^#/.test(text)&&tags[0]){const title=strongTag(tags[0]);if(title)candidate={title,evidence:'leading_title_hashtag'};}
 if(!candidate&&part&&part.index<120)candidate=headingTitle(text.slice(part.index+part[0].length));
 if(!candidate){const strong=[...new Map(tags.map(t=>strongTag(t)).filter(Boolean).map(t=>[titleKey(t),t])).values()];if(strong.length===1)candidate={title:strong[0],evidence:'title_hashtag'};}
 return {title:candidate?.title??null,evidence:candidate?.evidence??null,platform,platform_conflict:foundPlatforms.length>1,code,code_conflict:uniqueCodes.length>1,tags,part:part?Number(part[1]):null,text};
}
function namedMatches(identity,dramas){
 const heading=identity.text.replace(/^part\s*\d+\s*[|:—–-]?\s*/i,'');
 const tags=new Set(identity.tags.map(titleKey));
 return [...dramas].filter(([,row])=>{
  const title=display(row.fields.剧名),key=titleKey(title);
  if(!key)return false;
  if(identity.title&&titleKey(identity.title)===key||tags.has(key)||titleKey(heading)===key)return true;
  // Existing titles can establish a heading boundary even when the title has lowercase words.
  const words=heading.split(/\s+/);let prefix='';
  for(let i=0;i<Math.min(words.length,25);i++){
   prefix+=words[i];if(titleKey(prefix)!==key)continue;
   const rest=words.slice(i+1).join(' ');
   return !rest||/^(?:[—–|]|Full series link in bio|Watch on|Download|(?:A|An|The|He|She|His|Her|They|After|When|Before|But|Now|Everyone)\s+[a-z])/i.test(rest);
  }
  return false;
 });
}
function compatible(row,platform){return !platform||!row.fields.平台||row.fields.平台==='其他'||row.fields.平台===platform;}
export function buildPromotionIndex({dramas,captures=new Map(),releases=new Map(),verifiedCodes=[]}){
 const index=new Map();const byRecord=new Map([...dramas].map(([id,r])=>[r.record_id,[id,r]]));
 const add=(platform,code,id)=>{if(!platform||!code||!dramas.has(id))return;const key=`${platform}:${code.toLowerCase()}`;if(!index.has(key))index.set(key,new Set());index.get(key).add(id);};
 for(const [id,row] of dramas){const note=String(row.fields.备注??'').trim();if(/^[a-z0-9]{4,16}$/i.test(note))add(row.fields.平台,note,id);}
 for(const rule of verifiedCodes){const row=dramas.get(rule.drama_id);if(row&&compatible(row,rule.platform))add(rule.platform,rule.code,rule.drama_id);}
 const releaseByRecord=new Map([...releases.values()].map(r=>[r.record_id,r]));
 for(const capture of captures.values()){
  const f=capture.fields,identity=extractCaptionIdentity(f.Caption);
  if(!identity.platform||!identity.code||identity.platform_conflict||identity.code_conflict)continue;
  const release=releaseByRecord.get(one(f.关联发布记录));const entry=byRecord.get(one(release?.fields.剧));
  if(!entry||release.fields.待处理原因||one(release.fields.采集记录)!==capture.record_id||release.fields['Post ID']&&release.fields['Post ID']!==f['Post ID'])continue;
  const matches=namedMatches(identity,new Map([entry]));
  if(matches.length===1&&compatible(entry[1],identity.platform))add(identity.platform,identity.code,entry[0]);
 }
 return index;
}
function nearTitle(a,b){
 if(Math.min(a.length,b.length)<8||Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,edits=0;
 while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
 return edits+(a.length-i)+(b.length-j)<=1;
}
export function resolveCaptionDrama({caption,dramas,promotionIndex=new Map(),preferredDramaRecordId=null}){
 const identity=extractCaptionIdentity(caption),base={...identity,drama_id:null,drama_record_id:null};
 if(identity.platform_conflict||identity.code_conflict)return {...base,status:'conflict',reason:'caption_identity_conflict'};
 const named=namedMatches(identity,dramas);
 if(named.length&&named.every(([,r])=>!compatible(r,identity.platform)))return {...base,status:'conflict',reason:'drama_platform_conflict'};
 const matches=named.filter(([,r])=>compatible(r,identity.platform));
 const coded=[...(promotionIndex.get(`${identity.platform}:${identity.code}`)??[])].filter(id=>dramas.has(id)).map(id=>[id,dramas.get(id)]);
 if(coded.length>1)return {...base,status:'ambiguous',reason:'promotion_code_ambiguous'};
 if(coded.length===1&&(matches.length&&!matches.some(([id])=>id===coded[0][0])||identity.title&&titleKey(identity.title)!==titleKey(coded[0][1].fields.剧名)))return {...base,status:'conflict',reason:'title_code_conflict'};
 let choices=coded.length?coded:matches;
 if(choices.length>1&&preferredDramaRecordId){const preferred=choices.filter(([,r])=>r.record_id===preferredDramaRecordId);if(preferred.length===1)choices=preferred;}
 if(choices.length>1)return {...base,status:'ambiguous',reason:'drama_title_ambiguous'};
 if(choices.length===1){const [id,row]=choices[0];if(row.fields.归档状态==='archived')return {...base,status:'conflict',reason:'drama_archived'};
  return {...base,title:display(row.fields.剧名),status:'matched',reason:null,drama_id:id,drama_record_id:row.record_id,evidence:matches.length?identity.evidence??'existing_title':'verified_promotion_code'};}
 if(identity.title&&[...dramas.values()].some(row=>nearTitle(titleKey(identity.title),titleKey(row.fields.剧名))))return {...base,status:'ambiguous',reason:'similar_pool_title'};
 if(identity.title&&usableTitle(identity.title))return {...base,status:'new',reason:null};
 return {...base,status:'unknown',reason:identity.text?'drama_title_unmatched':'caption_unavailable'};
}
