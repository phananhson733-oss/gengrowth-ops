import json,re
from pathlib import Path
from collections import defaultdict,Counter
from decimal import Decimal,ROUND_HALF_UP
from datetime import datetime
from zoneinfo import ZoneInfo
P=Path(__file__).resolve().parent
S=json.loads((P/'分析汇总.json').read_text())
read=lambda n:[json.loads(l)for l in(P/(n+'.ndjson')).read_text().split('\n')if l.strip()]
D=lambda x:Decimal(str(x))
f=lambda x:f'{int(x):,}'
m=lambda x:format(D(x).quantize(D('.01'),rounding=ROUND_HALF_UP),'.2f')
def norm(s):
 s=(s or '').strip()
 mm=re.fullmatch(r'\[([^]]+)\]\([^)]+\)',s)
 return mm.group(1)if mm else s
lines=[]
def add(s=''):lines.append(s)
def table(h,rows):
 add('| '+' | '.join(h)+' |');add('| '+' | '.join('---'for _ in h)+' |')
 for r in rows:add('| '+' | '.join(str(x).replace('|','\\|').replace('\n',' ')for x in r)+' |')
 add()
posts=S['posts'];rev=S['revenue'];N=len(posts);V=S['plays'];rg=S['revenue_groups']
orders=sum(r['orders']for r in rg);amount=sum(D(r['amount'])for r in rg);share=sum(D(r['share'])for r in rg)
assets={norm(r['账号ID']):r for r in read('资产')};devices={r['record_id']:r['Device ID']for r in read('设备')};accounts=read('账号')
def agg_revenue(fn):
 b=defaultdict(list)
 for r in rev:b[fn(r)].append(r)
 return [dict(key=k,rows=len(rr),orders=sum(r['订单数（单剧）']for r in rr),amount=sum(D(r['订单金额(USD)'])for r in rr),share=sum(D(r['分成收益'])for r in rr),owners=sorted({u['name']for r in rr for u in r['负责人']}))for k,rr in b.items()]
rday=agg_revenue(lambda r:r['日期'][:10]);rplat=agg_revenue(lambda r:'/'.join(r['剧场']));rdrama=agg_revenue(lambda r:('/'.join(r['剧场']),r['出单剧名（仅统计出单）'].strip()))
business=defaultdict(list)
for r in rev:business[(r['日期'][:10],'/'.join(u['name']for u in r['负责人']),'/'.join(r['剧场']),r['出单剧名（仅统计出单）'].strip())].append(r)
repeat={k:rr for k,rr in business.items()if len(rr)>1}
inc=defaultdict(int)
for r in read('分账号日增'):
 if '2026-10-19'<=r['日期'][:10]<'2026-10-26' and r['新增播放量']is not None:inc[r['负责人']]+=r['新增播放量']
reportdaily=defaultdict(lambda:defaultdict(Decimal))
for r in read('日报'):
 if '2026-10-19'<=r['日期'][:10]<'2026-10-26':
  for k in ['帖子数','播放量','订单金额','实际收益']:reportdaily['/'.join(x['name']for x in r['运营人员'])][k]+=D(r[k]or'0')
# 口径和加总核验：空值不能自动冒充完整数据。
assert all(r['播放量']is not None and r['播放量']>=0 for r in posts)
assert all(r['发布时间'].endswith('+08:00')for r in posts)
assert len({r['Post ID']for r in posts})==N
assert all(r['订单数（单剧）']is not None and r['订单金额(USD)']is not None and r['分成收益']is not None for r in rev)
assert all(r['币种']==['USD']for r in rev)
assert len({r['record_id']for r in rev})==len(rev)
for gg in S['groups'].values():assert sum(g['posts']for g in gg)==N and sum(g['plays']for g in gg)==V
for g in S['groups']['owner']:
 assert reportdaily[g['key']]['帖子数']==g['posts'] and reportdaily[g['key']]['播放量']==g['plays']
for r in rg:
 assert abs(reportdaily[r['owner']]['订单金额']-D(r['amount']))<D('.000001')
 assert reportdaily[r['owner']]['实际收益']==D(r['share'])
assert all(r['新增播放量']==r['account_sum']for r in S['daily_increment'])
assert len(S['daily_increment'])==7 and sum(inc.values())==sum(r['新增播放量']for r in S['daily_increment'])
assert all(len(r['关联出单短剧汇总'])==1 for r in rev)
assert sum(r['pub_matches']==0 for r in posts)==0
manifests=[json.loads((P/(r[0]+'.manifest.json')).read_text())for r in json.loads((P/'读取配置.json').read_text())]
assert all(not x['has_more']for x in manifests)
read_start=min(x['read_at']for x in manifests);read_end=max(x['read_at']for x in manifests)
add('# 短剧运营周报｜2026.10.19–10.25')
add('\nPengman 个人草稿 · Markdown 数据版 · 北京时间 10/19 00:00–10/25 23:59:59，共 7 天。')
add(f'\n飞书最新读取时间：2026/10/26 {read_start[11:19]}–{read_end[11:19]}。本版重点为发布、播放和 CPS 数据，不写选剧或分工计划。')
add(f'\n> **本期 27 个账号 ID 有实际发布记录，共 {f(N)} 条视频，日均 {N/7:.1f} 条；这些视频截至最近采集时累计播放 {f(V)}（约 {V/10000:.2f} 万）。CPS 明细填报 {orders} 单，订单金额 ${m(amount)}，公式分成 ${m(share)}。**\n> 视频播放统计与 CPS 日期统计相互独立；上述播放不是本周新老视频新增总量，分成也不是已核实到账金额。CPS 有两组同日同人同剧多条记录，是否重复仍待核实，原表加总暂全部保留。')
add('\n## 一、先看结果（已核验的表内事实）\n')
add(f'- **高璇的发布和播放均最多：321 条、1,415,281 播放，占团队 {1415281/V:.1%}。**张凯风 575,658 播放，彭满 265,128，李建卓 246,743。\n- **账号第一是 ayleenremy7：30 条、302,649 播放。**其次是 shirley5278789（236,220）和 lthung263（204,892）；前三合计占 {sum([302649,236220,204892])/V:.1%}。\n- **CPS 公式分成最高的是高璇：$223.53**，其次张凯风 $110.05。本期共 70 条收入明细，涉及 34 个“平台＋剧名”组合。\n- **本期视频数据能对上：**663 条采集视频均匹配发布记录；各负责人的发布、播放与运营日报一致。659 条已有正式剧名关联，4 条待补。\n')
add('## 二、各负责人的发布与播放\n')
table(['负责人','有发布的账号 ID 数','发布量','累计播放','播放占比','单条平均播放'],[[g['key'],len(g['accounts']),f(g['posts']),f(g['plays']),f"{g['plays']/V:.1%}",f(round(g['plays']/g['posts']))]for g in S['groups']['owner']]+[['合计',len(S['groups']['account']),f(N),f(V),'100%',f(round(V/N))]])
add('发布量按实际发布时间和唯一 Post ID 计数；播放为**本期新发视频截至各自最近采集时的累计值**。负责人按当前账号台账归属汇总，未取得完整历史变更记录。马博洋有 CPS 明细，但本次发布数据未对应到其账号，不能将其播放量记为零。占比四舍五入可能出现尾差。\n')
add('## 三、各账号数据\n')
for owner in ['高璇','张凯风','彭满','李建卓']:
 add('### '+owner+'\n');rows=[]
 for g in S['groups']['account']:
  if owner not in g['owners']:continue
  handle=g['key'];ar=assets.get(handle)
  ds=[devices[x['id']]for x in ar['关联设备']if x['id']in devices]if ar else []
  if not ds:ds=sorted({p['device']for p in posts if p['account']==handle})
  ds=[('Phone-'+str(d).zfill(2))if str(d).isdigit()else str(d)for d in ds]
  rows.append([handle,'/'.join(ds),g['posts'],f(g['plays']),f(round(g['plays']/g['posts'])),f(g['max_play'])])
 table(['账号 ID','手机','发布量','累计播放','单条平均','最高单条'],rows)
add('**账号核对：**本期 27 个有发布的 ID 均能匹配账号台账。Phone-32 的台账是 drama.binge.ar／张凯风，资产表仍写 vedalana7／高璇，未据此合并两个 ID 或回填历史归属；本报告按实际发布链接与账号台账统计。shortsbinge.tw 在资产表保存为超链接，按显示文字匹配后与 Phone-34／李建卓一致。\n')
add('当前台账另外两行未找到本期实际发布时间范围内的采集视频：cedricto892335（Phone-31，张凯风，状态“重养”）；shortsbinge.drama（台账负责人、手机为空，资产表显示 Phone-31／高璇）。两行都不计入 27 个有发布账号，也不将“未采集到”解释为已经证明没有发过。\n')
add('## 四、每日发布量与播放\n')
table(['视频发布日期','发布量','这些视频截至采集时累计播放'],[[g['key'][5:],g['posts'],f(g['plays'])]for g in sorted(S['groups']['day'],key=lambda g:g['key'])]+[['合计',N,f(V)]])
add('上表按**视频发布日期**分组，不能当成当天获得的新增播放。10/24–25 的视频观察时间更短，暂不据此判断内容效果下降。\n')
add('## 五、CPS 出单、订单金额与分成\n')
add('按「CPS账号数据明细 手动版」的收益日期字段筛选 10/19–10/25，币种全部为 **USD（美元）**。本节的“单”均指原表填报数；订单金额和分成分别汇总，不相加为收入。\n')
table(['负责人','明细条数','填报订单数','订单金额 USD','公式分成 USD'],[[r['owner'],r['records'],r['orders'],m(r['amount']),m(r['share'])]for r in rg]+[['合计',len(rev),orders,m(amount),m(share)]])
add(f'原始金额合计 ${amount}，公式分成合计 ${share}，最后统一四舍五入到两位小数。逐人、逐平台或逐条先四舍五入后再相加可能有尾差；例如逐人展示的分成相加为 $417.18，总额以原值合计后的 **$417.17** 为准。广告收益字段均为空，本报告未另计广告收益。\n')
add('### 按平台看\n')
table(['平台','明细条数','填报订单数','订单金额 USD','公式分成 USD'],[[r['key'],r['rows'],r['orders'],m(r['amount']),m(r['share'])]for r in sorted(rplat,key=lambda r:-r['share'])])
add('不同平台的分成比例不同，本次使用飞书已计算的分成字段，没有统一套用 50%。部分订单金额含较长小数；它们是否来自后台原始成交金额、或由收益反推，当前记录未注明，不能据此确认真实客单价。\n')
add('### 每日 CPS 填报\n')
table(['收益日期','明细条数','填报订单数','订单金额 USD','公式分成 USD'],[[r['key'][5:],r['rows'],r['orders'],m(r['amount']),m(r['share'])]for r in sorted(rday,key=lambda r:r['key'])]+[['合计',len(rev),orders,m(amount),m(share)]])
add('日期按飞书显示值（+08:00）筛选；原始平台后台日期是否已换算到北京时间尚未统一验证，因此本节是飞书日期口径。\n')
add('### 本期分成最高的 8 部剧\n')
table(['平台','剧名','负责人','填报订单数','订单金额 USD','公式分成 USD'],[[r['key'][0],r['key'][1],'、'.join(r['owners']),r['orders'],m(r['amount']),m(r['share'])]for r in sorted(rdrama,key=lambda r:-r['share'])[:8]])
add('仅合并同平台、剧名完全相同（去掉首尾空白）的本期明细，不混入历史累计，不合并跨语种名称。剧目收入不能直接归因给本期发布的视频；未取得逐视频到订单的完整链路。\n')
add('### 两组待核实的重复风险\n')
table(['日期','负责人','平台 / 剧名','原表多条记录','当前处理'],[[k[0][5:],k[1],k[2]+' / '+k[3],'；'.join(str(r['订单数（单剧）'])+' 单 / $'+m(r['订单金额(USD)'])for r in rr),'金额不同，先保留加总；待确认是否不同订单或累计更新']for k,rr in repeat.items()])
add('本期没有完全相同的“日期＋负责人＋平台＋剧名＋订单数＋金额”重复行，70 条记录 ID 均唯一；但缺订单 ID，仍不能排除上表的业务重复。所有 70 条明细的数据粒度、出单统计口径均为空，校验提示为“待核验：数据粒度”。**80 单是填报合计，不是已核实的 80 个独立付费订单。**结算状态也未取得。\n')
add('70 条本期明细均各自关联 1 条「出单短剧数据汇总」，未发现一条明细多重关联。该汇总表包含历史累计，本报告不把其累计收入再次加到本期收入里。各负责人金额与运营日报一致到美分，分成原值完全一致。\n')
add('## 六、新老视频的期间新增播放（单独口径）\n')
add('本期日增表已有 7 天记录，说明均为**采集间隔增量、部分覆盖**，没有沿用上一期的跨日均摊估算。逐日数值与分账号表加总一致。\n')
rows=[]
for r in sorted(S['daily_increment'],key=lambda r:r['日期']):
 interval=re.search(r'快照批次 (.*?)；',r['说明']).group(1)
 rows.append([r['日期'][5:],f(r['新增播放量']),interval,r['缺失帖子数'],r['未纳入帖子数']])
table(['源表归档日期','已记录新增播放','实际快照区间（北京时间）','该批次缺失视频数','未纳入视频数'],rows+[['区间合计',f(sum(inc.values())),'10/19 10:45 → 10/26 00:01','不跨日累加','不跨日累加']])
table(['负责人（分账号日增表字段）','上述采集区间的已记录新增播放'],[[k,f(v)]for k,v in sorted(inc.items(),key=lambda x:-x[1])]+[['合计',f(sum(inc.values()))]])
add('**4,406,737（约 440.67 万）只代表上述快照区间、可纳入视频的已记录增量。**它缺少 10/19 零点至 10:45 的覆盖，末端到 10/26 00:01，各批次还有缺失视频，因此不能称为严格完整的 10/19–10/25 自然周新增总量。缺失值未按零补齐，也不按比例估算；相同视频可能连续缺失，缺失数不跨日相加。\n')
add('## 七、头部视频与剧目数据\n')
table(['负责人 / 账号','发布日期','剧名','累计播放','视频'],[[r['owner']+' / '+r['account'],r['发布时间'][5:10],r['title'],f(r['播放量']),'[查看](https://www.tiktok.com/@'+r['account']+'/video/'+r['Post ID']+')']for r in S['top_posts'][:6]])
add('### 已关联剧目播放前 5 名\n')
table(['剧名','本期发布量','本期视频累计播放'],[[r['key'],r['posts'],f(r['plays'])]for r in S['groups']['drama']if r['key']!='未关联剧名'][:5])
missing=next(r for r in S['groups']['drama']if r['key']=='未关联剧名')
add(f'本期 {N-missing["posts"]} 条视频已关联剧名；剩余 {missing["posts"]} 条、{f(missing["plays"])} 播放尚未关联，占总播放 {missing["plays"]/V:.2%}。这些播放已计入账号和负责人总数，仅不纳入具名剧目排行。\n')
add('## 八、数据质量、核验口径与来源\n')
add('### 已核验与待确认\n')
table(['项目','核验结果 / 限制'],[
 ['发布证据','按实际发布时间筛选的采集数据 663 条，唯一 Post ID 663 个，均属于 short-drama，均有视频链接，播放字段无空值。'],
 ['表间一致性','发布记录按「实际发布时间」也是 663 条，且与采集数据对应；按登记「日期」筛选为 626 条。本报告使用实际发布时间，不将登记日期作为发布日。各负责人发布、播放与运营日报完全一致。'],
 ['采集截止','656 条最近采集于 10/26 00:01:04；另 7 条停留在 10/20–10/25 的较早批次。保留各条最近可用值，未估算补数。'],
 ['时间异常','2 条采集时间早于发布时间，均为 5 播放，仍按表内发布时间计入，共 2 条 / 10 播放；未自行修改源表。详见下表。'],
 ['归属与资产','账号负责人采用当前台账；未取得历史归属变更日期。Phone-32 两表账号和负责人不一致，Phone-31 有多行/归属信息待确认。'],
 ['订单可信度','原表填报数可加总，订单 ID、实际/预估、日新增/累计口径和结算状态不完整，存在两组同日同剧多条记录待确认。'],
 ['收益核验','按记录 ID 各计一次、日期筛选、原币种 USD；只用本期明细计算，日报和历史汇总仅作校验。没有把收入总额和分成再相加。']])
table(['账号 / Post ID','发布时间','采集时间','播放','处理'],[[r['account']+' / '+r['Post ID'],r['发布时间'][5:19].replace('T',' '),r['采集时间'][5:19].replace('T',' '),r['播放量'],'保留并标记待确认']for r in posts if r['sample_before_publish']])
add('若暂排除这两条时间异常记录，可核对小计为 661 条、2,502,800 播放；正文总数保持与原表和运营日报一致，采用 663 条、2,502,810 播放。\n')
add('### 统计方法\n')
add('- 时间范围：北京时间 2026/10/19 00:00（含）至 10/26 00:00（不含）。视频按带时区的「发布时间」，CPS 按「日期」筛选。\n- 视频粒度：唯一 Post ID；账号取视频链接中的实际 ID，以台账记录关联负责人。链接或关联字段匹配剧目，不从 Caption 猜剧名。\n- 金额粒度：唯一收益记录 ID；按负责人、日期、平台、剧名分别汇总。剧名聚合仅去首尾空白，源值保留在核验文件。\n- 空值处理：本期主统计播放、订单数、金额和分成都已填；广告收益空值不计为已证实零收入；日增表空值不补零。\n- 每张来源表均读到 has_more=false；大表分页版本一致、记录 ID 无重复，未用局部可见行外推。\n- 本版以数据事实和待确认项为主，不推断低播放原因，不将当前未出现在采集表的账号判定为停发，也不将金额直接换算成真实视频转化率。\n')
add('### 来源与访问情况\n')
labels={'采集':'采集数据','发布':'发布记录','账号':'账号台账','选剧':'选剧池（只用于正式剧名关联）','收益':'CPS账号数据明细 手动版','出单汇总':'出单短剧数据汇总（关联校验）','日报':'运营日报汇总','日增':'每日播放趋势','分账号日增':'每日播放趋势-分账号','资产':'TikTok 资产表','设备':'设备与登录环境表'}
rows=[]
for x in manifests:
 url=('https://gengrowth.feishu.cn/wiki/QCigwFYMCiuQu1k8q94cXy7PnZd?table='if x['name']in ['资产','设备']else'https://gengrowth.feishu.cn/base/OtnsbnRnwaLmnVsJByscTkFMntd?table=')+x['table_id']
 rows.append(['['+labels[x['name']]+']('+url+')',f(x['records_count']),x['rev'],'完整'])
table(['来源','读取全表行数（非本期）','数据版本','分页状态'],rows)
add('本次「短剧发行管理」目录未见旧名称「每日剧场收益」「收益汇总表」及非手动版「CPS账号数据明细」，未取得这些旧入口的数据；采用当前手动明细、出单短剧数据汇总与运营日报交叉核对。未取得平台订单原始明细、结算凭证及完整历史负责人变更记录。\n')
add('资产表时区配置为 America/Los_Angeles，本报告仅从中读取 ID、设备、负责人，不以其日期字段切分本周。发行管理统计以北京时间为准。只读飞书，未修改表格或公司正式文档。\n')
add('## 附录：本期 70 条 CPS 明细\n')
add('以下按收益日期、负责人、平台、剧名排列。金额和分成展示到美分，最终总额按原始小数相加；标有 † 的记录属于前述两组待核实记录。\n')
rows=[]
for r in sorted(rev,key=lambda r:(r['日期'],'/'.join(x['name']for x in r['负责人']),'/'.join(r['剧场']),r['出单剧名（仅统计出单）'].strip(),r['record_id'])):
 k=(r['日期'][:10],'/'.join(x['name']for x in r['负责人']),'/'.join(r['剧场']),r['出单剧名（仅统计出单）'].strip())
 rows.append([r['日期'][5:10],k[1],k[2],k[3]+(' †'if k in repeat else''),r['订单数（单剧）'],m(r['订单金额(USD)']),m(r['分成收益'])])
table(['收益日期','负责人','平台','出单剧名','填报单数','金额 USD','分成 USD'],rows+[['合计','—','—','70 条明细',orders,m(amount),m(share)]])
out=P.parent/'2026-10-19至10-25-短剧运营周报.md'
out.write_text('\n'.join(lines),encoding='utf-8')
audit={'videos':N,'plays':V,'active_handles':len(S['groups']['account']),'orders_reported':orders,'revenue_rows':len(rev),'amount_usd_raw':str(amount),'share_usd_raw':str(share),'recorded_snapshot_increment':sum(inc.values()),'publish_capture_daily_report_counts_match':True,'daily_account_increment_sums_match':True,'cps_daily_report_matches_to_cent':True,'same_day_title_multirow_groups':len(repeat),'read_start':read_start,'read_end':read_end,'report_path':str(out)}
(P/'数据检查.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
print(json.dumps(audit,ensure_ascii=False,indent=2))
print('lines',len(out.read_text().splitlines()),'characters',len(out.read_text()))
