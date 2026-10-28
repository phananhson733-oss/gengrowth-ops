from pathlib import Path
import json
from collections import defaultdict,Counter
p=Path(__file__).resolve().parent
d=json.loads((p/'分析汇总.json').read_text())
rows=[json.loads(l) for l in (p/'采集复核2930.ndjson').read_text().splitlines()]
accounts={r['record_id']:r for r in [json.loads(l) for l in (p/'账号复核.ndjson').read_text().splitlines()]}
merged={r['Post ID']:r for r in d['posts']}
for r in rows:
 a=accounts[r['账号'][0]['id']]
 r.update(account=a['账号ID'],owner=a['负责人'][0]['name'],device=a['手机编号'],title=None,drama_id=None,pub_matches=0)
 if r['Post ID'] not in merged or (r.get('采集时间')or'')>(merged[r['Post ID']].get('采集时间')or''):merged[r['Post ID']]=r
posts=list(merged.values())
assert all('2026-10-08'<=r['发布时间'][:10]<='2026-10-12' for r in posts)
d['posts']=posts;d['post_count']=len(posts);d['plays']=sum(r['播放量']for r in posts)
for group in ['owner','account','drama','day']:
 buckets=defaultdict(list)
 for r in posts:
  key=r['发布时间'][:10] if group=='day' else (r.get('title')or'未关联剧名') if group=='drama' else r[group]
  buckets[key].append(r)
 d['groups'][group]=sorted([dict(key=k,posts=len(rr),plays=sum(r['播放量']for r in rr),accounts=sorted({r['account']for r in rr}),titles=dict(Counter(r.get('title')or'未关联剧名' for r in rr)))for k,rr in buckets.items()],key=lambda g:-g['plays'])
d['top_posts']=sorted(posts,key=lambda r:-r['播放量'])[:10]
d['sample_times']=dict(Counter(r['采集时间']for r in posts))
d['merge_note']='合并原24账号194条与29、30号10条，不重采其余账号。含1条发布时间晚于采集时间的记录（105播放），按源表数值计入并在报告文末披露。'
(p/'分析汇总-26账号.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
s=(p/'生成周报.py').read_text()
s=s.replace("ev/'分析汇总.json'","ev/'分析汇总-26账号.json'")
s=s.replace("warning='数据尚未覆盖完整五天。10/12 11:01 读取飞书；本期视频最新采集时间为 10/10 16:14:51，最晚实际发布时间为 10/10 15:51:38。10/10 仍是部分数据，10/11–10/12 未见新增采集，不能写成零发布。'", "warning='已将 29、30 号并入 26 个活跃账号统计。当前数据仍未覆盖完整五天：原 24 个账号采集到 10/10，29、30 号采集时间为 10/12；10/11–10/12 仅有这两个号的样本。详细采集口径见文末。'")
s=s.replace('截至 10/12 上午的阶段数据','截至 10/12 核验的阶段数据')
s=s.replace("('已采集发布账号','24 个','高璇 10 / 张凯风 5 / 李建卓 6 / 彭满 3')","('活跃账号（已采集发布）','26 个','高璇 10 / 张凯风 7 / 李建卓 6 / 彭满 3')")
s=s.replace("'194 条'","'204 条'").replace("'152,544'","'153,688'").replace('约 15.25 万','约 15.37 万')
s=s.replace('56.9%','56.5%').replace('52.4%','52.0%').replace('43.4%','43.1%')
s=s.replace('53 条视频尚未关联剧名','63 条视频尚未关联剧名')
s=s.replace('账号台账另有张凯风的 marjepurcell71（Phone-29）和 hayleyluella（Phone-30），本期未找到采集发布记录，不能据此认定没有发。','张凯风的 marjepurcell71（Phone-29，6 条 / 447 播放）和 hayleyluella（Phone-30，4 条 / 697 播放）已计入，其账号台账状态已核验为“发布中”。')
s=s.replace('24 个账号','26 个账号')
s=s.replace('另有 53 条、17,177 播放未关联剧名。尤其是 10/10 的 48 条中有 46 条未关联','另有 63 条、18,321 播放未关联剧名。尤其是 10/10 的 50 条中有 48 条未关联')
s=s.replace("('部分采集' if g else", "(('仅 29、30 号样本；当日未结束' if date.endswith('12') else '仅 29、30 号样本') if date>='2026-10-11' else '部分采集') if g else")
# previous replacement changes parentheses; replace entire status assignment deterministically
lines=s.splitlines()
for i,line in enumerate(lines):
 if "g=byday.get(date); status=" in line:
  lines[i]=" g=byday.get(date); status='已采集，完整性未确认' if date<'2026-10-10' else ('部分采集' if date=='2026-10-10' else ('仅 29、30 号样本；当日未结束' if date.endswith('12') else '仅 29、30 号样本'))"
s='\n'.join(lines)+'\n'
s=s.replace('优先关联 10/10 的 46 条缺剧名视频；','优先关联 10/10 的 48 条缺剧名视频，并补齐 29、30 号的发布记录；')
s=s.replace('194 条均有播放数','204 条均有播放数').replace('采集表实际发布样本为 194 条','合并后的采集表实际发布样本为 204 条')
s=s.replace('发布日期与回填差异：','发布日期与回填差异（发布记录全表为 11:01 快照）：')
s=s.replace('TikTok 资产表、GGWork 工具、平台官网及分销推荐页面本次未重新读取；没有核验完整设备库存、工具部署或采集定时任务运行。','设备与 TikTok 资产表已读取并核对 29、30 号；GGWork 工具、平台官网及分销推荐页面未重新读取，没有核验工具部署或采集定时任务运行。')
s=s.replace('飞书读取约为 10/12 10:59–11:01；本报告统一标记截止 11:01。最新视频快照为 10/10 16:14:51。','主表读取为 10/12 10:59–11:01，随后于 13:55 完成 29、30 号限定查询。原 194 条视频快照为 10/10 16:14:51，新增 10 条为 10/12 11:58:04；合并后为 204 条、153,688 播放。两批样本没有重复 Post ID，但采集截止时间不同，不能视为统一时点的完整团队数据。本次合并未重新采集其他账号，日增与收益保留已核验快照。')
s=s.replace('本次仅生成个人 HTML 与 Markdown 草稿，未修改任何飞书表、正式文档或任务。','本次更新个人 HTML 与 Markdown 草稿；此前按彭满授权已将两个账号台账的状态补为“发布中”，本轮合并未另改飞书数据。')
s=s.replace("sourcehtml=table(['读取表','全表记录数','版本 rev','来源'],sourcerows)","""method.append('异常值处理：hayleyluella 视频 7695627506480729357 的发布时间为 10/12 12:05:35，晚于表内采集时间 11:58:04；其 105 播放本次按源表数值计入团队及张凯风累计播放，并按源日期归入 10/12，时间字段仍待纠正。若剔除该记录，团队为 203 条 / 153,583 播放，张凯风为 49 条 / 103,639 播放；活跃账号数仍为 26。此异常不用于计算日增。')
method.append('两号回填：账号关联、链接及 Post ID 查询均未找到对应发布记录，所以新增 10 条暂归“未关联剧名”。台账记录齐全且状态已补为发布中；设备表“未启用”和资产表“已养好、买粉中”仍需同步。设备、资产与台账查询分别完整读取 35、33、28 行；资产表时区为 America/Los_Angeles，本次只取账号和状态，视频时间均以发行管理表 Asia/Shanghai 为准。')
for short,label,b in [('采集复核2930','29、30 号采集（限定查询）',base),('发布复核2930','29、30 号发布（账号/链接查询）',base),('发布按视频ID复核2930','29、30 号发布（视频 ID 查询）',base),('TikTok资产复核','TikTok 资产表','https://gengrowth.feishu.cn/base/QhEkbG4cZaDZSAsKX5CciN3knwh'),('设备复核','设备与登录环境表','https://gengrowth.feishu.cn/base/QhEkbG4cZaDZSAsKX5CciN3knwh'),('2930写后核验','两号状态写后核验（指定记录）',base)]:
 m=json.loads((ev/(short+'.manifest.json')).read_text());assert m['has_more']is False
 sourcerows.append([label,m['records_count'],m['rev'],b+'?table='+m['table_id']])
sourcehtml=table(['读取表 / 范围','返回记录数','版本 rev','来源'],sourcerows)""")
s=s.replace("mt(['读取表','全表记录数','版本 rev','来源'],sourcerows)","mt(['读取表 / 范围','返回记录数','版本 rev','来源'],sourcerows)")
s=s.replace('以下 9 表均读取全部记录及所需字段','主数据来源的 9 表均读取全部记录及所需字段（后续限定查询另标范围）')
s=s.replace('==152544','==153688').replace('==194','==204')
# add team average and total row to the owner comparison
s=s.replace("head=['负责人','有发布的账号','已采集视频','累计播放','平均每条','播放占比']", "ownerrows.append(['团队合计',26,len(posts),f(total),f(round(total/len(posts))),'100.0%'])\nhead=['负责人','有发布的账号','已采集视频','累计播放','平均每条','播放占比']")
(p/'生成周报.py').write_text(s)
print(json.dumps({'posts':d['post_count'],'plays':d['plays'],'owners':[{k:r[k]for k in ['key','posts','plays']}for r in d['groups']['owner']],'days':[{k:r[k]for k in ['key','posts','plays']}for r in d['groups']['day']]},ensure_ascii=False))
