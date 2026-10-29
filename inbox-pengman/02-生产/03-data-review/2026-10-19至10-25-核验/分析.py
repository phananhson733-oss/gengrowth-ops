import json,re
from pathlib import Path
from collections import defaultdict,Counter
from decimal import Decimal
from datetime import datetime
from zoneinfo import ZoneInfo
P=Path(__file__).resolve().parent
read=lambda n:[json.loads(l)for l in (P/(n+'.ndjson')).read_text().split('\n')if l.strip()]
start='2026-10-19';end='2026-10-26'
inperiod=lambda t: start<=(t or '')[:10]<end
acct={r['record_id']:r for r in read('账号')};dramas={r['record_id']:r for r in read('选剧')}; pubs=read('发布');pmap={r['record_id']:r for r in pubs};byid=defaultdict(list)
for r in pubs:
 if r.get('Post ID'):byid[r['Post ID']].append(r)
raw=read('采集');pids=Counter(r.get('Post ID')for r in raw);filtered=[r for r in raw if inperiod(r.get('发布时间'))]
chosen={};conflicts=[]
for r in filtered:
 pid=r.get('Post ID')
 if not pid:continue
 if pid not in chosen or (r.get('采集时间')or'')>(chosen[pid].get('采集时间')or''):chosen[pid]=r
assets={r['账号ID']:r for r in read('资产')};devices={r['record_id']:r['Device ID']for r in read('设备')}
posts=[]
for r in chosen.values():
 ac=[acct[x['id']]for x in r['账号']if x['id']in acct]
 handle=re.search(r'tiktok\.com/@([^/?)]+)',r['视频链接']).group(1)
 if len(ac)==1:a=ac[0]
 else:
  asset=assets.get(handle);assert asset is not None
  a={'账号ID':handle,'负责人':asset['管理者（暂定）'],'手机编号':','.join(devices.get(x['id'],'待核实')for x in asset['关联设备'])}
 if a['账号ID']!=handle:
  a=dict(a,账号ID=handle)
 matches={x['record_id']:x for x in byid[r['Post ID']]}
 for x in r['关联发布记录']:
  if x['id']in pmap:matches[x['id']]=pmap[x['id']]
 ds={x['id']for v in matches.values()for x in v['剧']if x['id']in dramas}
 if len(ds)>1:conflicts.append({'post':r['Post ID'],'dramas':list(ds)})
 drama=dramas[next(iter(ds))]if len(ds)==1 else None
 owner=','.join(u['name']for u in a['负责人'])or'待确认'
 posts.append(dict(r,account=handle,owner=owner,device=a['手机编号'],title=drama['剧名']if drama else '未关联剧名',drama_id=drama['剧ID']if drama else None,language=drama['语言']if drama else [],platform=drama['平台']if drama else [],pub_matches=len(matches),sample_before_publish=(r.get('采集时间')or'')<r['发布时间']))
def group(rows,fn):
 b=defaultdict(list)
 for r in rows:b[fn(r)].append(r)
 return sorted([dict(key=k,posts=len(v),plays=sum(r['播放量']for r in v if r['播放量']is not None),accounts=sorted({r['account']for r in v}),owners=sorted({r['owner']for r in v}),max_play=max(r['播放量']or 0 for r in v))for k,v in b.items()],key=lambda x:-x['plays'])
groups={k:group(posts,fn)for k,fn in {'owner':lambda r:r['owner'],'account':lambda r:r['account'],'drama':lambda r:r['title'],'day':lambda r:r['发布时间'][:10]}.items()}
rev=[r for r in read('收益')if inperiod(r['日期'])]
rg=defaultdict(list)
for r in rev:rg[','.join(u['name']for u in r['负责人'])].append(r)
revgroups=[]
for owner,rr in rg.items():
 revgroups.append(dict(owner=owner,records=len(rr),orders=sum(r['订单数（单剧）']or 0 for r in rr),order_missing=sum(r['订单数（单剧）']is None for r in rr),amount=str(sum(Decimal(r['订单金额(USD)']or'0')for r in rr)),share=str(sum(Decimal(r['分成收益']or'0')for r in rr)),ad=str(sum(Decimal(str(r['广告收益']or 0))for r in rr))))
revgroups.sort(key=lambda r:-Decimal(r['share']))
daily=[r for r in read('日增')if inperiod(r['日期'])];adaily=[r for r in read('分账号日增')if inperiod(r['日期'])]
inc=[]
for r in daily:
 ar=[x for x in adaily if x['日期']==r['日期']]
 inc.append(dict(r,account_sum=sum(x['新增播放量']or 0 for x in ar),rows=len(ar),nonnull=sum(x['新增播放量']is not None for x in ar),pm=[x for x in ar if x['账号ID']in ['dramadetour0','dramaexpedition','jolienqaq']]))
checks={'duplicate_capture_ids':{k:v for k,v in pids.items()if v>1},'period_raw':len(filtered),'period_dedup':len(posts),'nullplays':sum(x['播放量']is None for x in posts),'drama_conflicts':conflicts,'sample_before_publish':[x['Post ID']for x in posts if x['sample_before_publish']],'capture_times':dict(Counter(x['采集时间']for x in posts)),'pub_date_period':sum(inperiod(x['日期'])for x in pubs),'pub_actual_period':sum(inperiod(x['实际发布时间'])for x in pubs),'pub_nocapture':[x['record_id']for x in pubs if inperiod(x['实际发布时间'])and x['Post ID']not in chosen]}
summary=read('出单汇总');sm={x['record_id']:x for x in summary};recon=[]
for r in rev:
 links=r['关联出单短剧汇总']
 recon.append(dict(id=r['record_id'],title=r['出单剧名（仅统计出单）'],links=len(links),summaries=[{k:sm[l['id']].get(k)for k in ['剧名','订单数','订单金额(USD)','分成收益','关联CPS出单明细']}for l in links if l['id']in sm]))
out={'posts':posts,'post_count':len(posts),'plays':sum(r['播放量']or 0 for r in posts),'groups':groups,'checks':checks,'revenue':rev,'revenue_groups':revgroups,'daily_increment':inc,'top_posts':sorted(posts,key=lambda x:-(x['播放量']or 0))[:12],'revenue_reconciliation':recon,'read_at':datetime.now(ZoneInfo('Asia/Shanghai')).isoformat()}
(P/'分析汇总.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
for k in ['post_count','plays','checks','revenue_groups']:print(k,json.dumps(out[k],ensure_ascii=False))
for k in ['owner','account','drama','day']:print(k,json.dumps(groups[k] if k!='drama'else groups[k][:15],ensure_ascii=False))
print('REVLINKS',Counter(x['links']for x in recon))
