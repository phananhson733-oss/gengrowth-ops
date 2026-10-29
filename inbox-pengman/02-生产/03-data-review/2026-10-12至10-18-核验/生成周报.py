import json,re
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
from collections import Counter,defaultdict
P=Path(__file__).resolve().parent
S=json.loads((P/'分析汇总.json').read_text())
read=lambda n:[json.loads(l)for l in(P/(n+'.ndjson')).read_text().split('\n')if l.strip()]
D=lambda n:Decimal(str(n))
f=lambda n:f'{int(n):,}'
money=lambda n:format(D(n).quantize(D('.01'),rounding=ROUND_HALF_UP),'.2f')
esc=lambda s:str(s).replace('|','\\|').replace('\n',' ')
lines=[]
def add(x=''):lines.append(x)
def table(headers,rows):
 add('| '+' | '.join(headers)+' |');add('| '+' | '.join(['---']*len(headers))+' |')
 for row in rows:add('| '+' | '.join(esc(v)for v in row)+' |')
 add()
assets={r['账号ID']:r for r in read('资产')}; devices={r['record_id']:r['Device ID']for r in read('设备')}
posts=S['posts']; N=len(posts);V=S['plays'];rev=S['revenue'];rg=S['revenue_groups'];amount=sum(D(x['amount'])for x in rg);share=sum(D(x['share'])for x in rg);orders=sum(x['orders']for x in rg)
assert amount==D('196.23') and share==D('98.130') and orders==33
assert N==522 and V==2079342
for group in S['groups'].values():assert sum(x['posts']for x in group)==N and sum(x['plays']for x in group)==V
assert all(r['新增播放量']==r['account_sum']for r in S['daily_increment'])
add('# 短剧运营周报｜2026.10.12–10.18')
add('\nPengman 个人草稿 · 数据版 · 北京时间 10/12 00:00–10/18 23:59:59，共 7 天。')
add('\n飞书读取时间：2026/10/19 13:51。本文仅整理数据及核验结果，暂不写选剧、分工和下周计划。')
add('\n> **先看结果：本期已采集到 522 条新发视频，累计播放 2,079,342（约 207.93 万）；CPS 填报 33 单，订单金额 $196.23，公式分成 $98.13。**\n> 播放量指这 7 天发布的视频截至各自最近采集时的累计值，包含发布后至采集时的增长，**不是 10/12–10/18 新老视频合计新增播放量**。CPS 是按收益日期另行汇总，不能视为这 522 条视频直接带来的订单。')
add('\n## 一、本期数据概览（已核验表内事实）\n')
table(['指标','本期结果'],[
 ['已采集新发视频',f(N)+' 条；日均 '+f'{N/7:.1f}'+' 条'],
 ['新发视频累计播放',f(V)+'；单条平均 '+f(round(V/N))],
 ['出现实际发布的账号 ID','27 个；含 Phone-15 前后两个 ID，独立账号数仍待确认'],
 ['播放最高的账号','lthung263：638,950；dramaclips0364：488,376'],
 ['前两名账号播放占比',f'{(638950+488376)/V:.1%}'],
 ['CPS 填报','23 条明细，33 单，涉及 22 个剧名'],
 ['订单金额 / 公式分成（USD）','$196.23 / $98.13；结算状态未核实']])
add('本期高璇的总播放最高；张凯风的单条平均播放最高。两人的播放合计占团队 '+f'{(982494+893557)/V:.1%}'+'。这反映本期采集结果，不代表所有视频已经经过相同时间的观察。\n')
add('## 二、各负责人的发布与播放\n')
table(['负责人','有发布的 ID 数','视频数','累计播放','播放占比','单条平均播放'],[
 [g['key'],str(len(g['accounts']))+('（含 Phone-15 两个 ID）'if g['key']=='高璇'else''),f(g['posts']),f(g['plays']),f"{g['plays']/V:.1%}",f(round(g['plays']/g['posts']))]for g in S['groups']['owner']]+[['合计','27 个 ID',f(N),f(V),'100%',f(round(V/N))]])
add('负责人按当前账号台账匹配；台账缺失的账号用资产表补充。**尚未取得本期负责人变更历史，因此此表是按当前归属整理的结果，不作为已核实的历史绩效归属。**马博洋有 CPS 收入，但当前数据未对应到他的发布账号，不能将其播放记为零。\n')
add('## 三、全部账号明细\n')
for owner in ['高璇','张凯风','李建卓','彭满']:
 add('### '+owner+'\n')
 rows=[]
 for g in S['groups']['account']:
  if owner not in g['owners']:continue
  assetdev='/'.join(devices[x['id']]for x in assets[g['key']]['关联设备']if x['id']in devices)
  device=assetdev or '未关联设备（台账指向 Phone-15）'
  notes={'hnlinhthng9678':'Phone-15 前一个 ID','ayleenremy7':'Phone-15 后一个 ID','jazlynnayeli6':'当前台账未找到，资产表可匹配','marjepurcell71':'当前台账未找到，资产表可匹配'}
  rows.append([g['key'],device,f(g['posts']),f(g['plays']),(f(round(g['plays']/g['posts']))if g['plays']/g['posts']>=1 else f"{g['plays']/g['posts']:.1f}"),f(g['max_play']),({'apdt6w97o2pk':'资产表 Phone-21；台账写 02','felicitypatterson67':'资产表 Phone-02；台账写 22'}.get(g['key'],notes.get(g['key'],'—')))])
 table(['账号 ID','手机','视频数','累计播放','单条平均','最高单条','核对备注'],rows)
add('Phone-15：hnlinhthng9678 本期有 2 条视频、1 次播放；ayleenremy7 有 9 条、3,869 次播放。采集记录关联到同一台账记录，但视频链接中的 ID 不同。这里保留原 ID 分列、视频按 Post ID 去重；未确认是改名还是换号，因此不把它算作已证实的新增独立账号。\n')
add('jazlynnayeli6 和 marjepurcell71 本期仍有已采集视频，已计入李建卓、张凯风的数据；“当前台账没有”不等于“本期没有发布”。apdt6w97o2pk 已计入李建卓：21 条、10,263 播放。手机编号优先采用资产表；它与 felicitypatterson67 的台账手机编号不一致，已在表中注明，未修改飞书。\n')
add('## 四、每天发了多少，分别积累了多少播放\n')
table(['视频发布日期（北京时间）','视频数','截至采集时累计播放'],[[r['key'][5:],f(r['posts']),f(r['plays'])]for r in sorted(S['groups']['day'],key=lambda x:x['key'])]+[['合计',f(N),f(V)]])
add('这张表按**视频发布日期**分组，不是每日新增播放曲线。10/18 的视频观察时间较短，不能据此认定当天内容效果下降。\n')
add('## 五、CPS 出单、金额和分成\n')
add('按「CPS账号数据明细 手动版」的日期字段筛选 10/12–10/18。全部以 **美元（USD）**计；订单金额是成交金额，分成是表内公式结果，均不等同于已到账。\n')
table(['负责人','明细条数','填报订单数','订单金额（USD）','公式分成（USD，保留三位）'],[[r['owner'],r['records'],r['orders'],money(r['amount']),f"{D(r['share']):.3f}"]for r in rg]+[['合计',len(rev),orders,money(amount),f'{share:.3f}']])
add('分成逐人保留三位小数，以便相加核对。全表原始值合计为 $98.130，展示为 $98.13；若各负责人先四舍五入到两位再相加，会有 $0.01 尾差。广告收益字段均未填，本次未另计广告收益。\n')
add('### 本期每笔出单记录\n')
rows=[]
for r in sorted(rev,key=lambda r:(r['日期'],','.join(x['name']for x in r['负责人']),r['出单剧名（仅统计出单）'])):
 rows.append([r['日期'][5:10],'/'.join(x['name']for x in r['负责人']),'/'.join(r['剧场']),r['出单剧名（仅统计出单）'],r['订单数（单剧）'],money(r['订单金额(USD)']),f"{D(r['分成收益']):.3f}"])
table(['收益日期*','负责人','平台','出单剧名','订单数','金额 USD','分成 USD'],rows)
add('*收益日期为飞书日期字段的显示值。彭满部分记录备注写明“照录后台显示日期，未另作时区换算”，因此尚不能证明全部收入均严格落在北京时间自然日边界；其备注仍有“订单金额待补”，与当前已填金额不一致。本表采用当前数值字段，保留该核验事项。\n')
add('### 从表内能确认的出单结果\n')
add('- 张凯风填报 **13 单、$80.52**，订单数和订单金额均为本期最高。其中 Thrown into Prison, Claimed by Three Alphas 为 4 单、$52.46；No More Backing Down 两天合计 6 单、$27.96。\n- 高璇填报 **12 单、$73.10**，分布在 11 个剧名；彭满 4 单、$17.46；马博洋 3 单、$16.06；李建卓 1 单、$9.09。\n- 有些记录虽然填报“单”，金额只有 $0.01、$0.04 或 $0.10；全体明细的数据粒度、出单统计口径尚未填，不能把这些数直接解释为同口径的独立付费用户。\n')
add('### 收益核对与计数限制\n')
add('本期 23 条明细按记录 ID 各计一次；没有发现“同日期、同负责人、同剧名、同金额、同订单数”完全相同的重复行。各负责人的订单金额、公式分成与「运营日报汇总」相符。\n')
add('「出单短剧汇总」包含历史累计，本次只用于关联核对，不与明细相加。其中本期 14 条明细各关联 1 条汇总，8 条尚未关联，1 条关联了 2 条同名汇总（The Billionaire\'s Revenge Bride）。后者在本报告只计一次；不能直接加总出单汇总表来代替本期收入。\n')
add('23 条明细的「数据粒度」「出单统计口径」均为空，校验提示为“待核验：数据粒度”。未取得可逐单核对的订单 ID、结算状态和完整 TikTok 账号归因，故以上是**表内填报汇总，不是已核验结算收入**；暂不计算“每多少播放出一单”，以免把不同发布批次、历史视频和不同归因窗口混在一起。\n')
add('## 六、头部视频与已关联剧目\n')
add('### 播放最高的 6 条视频\n')
rows=[]
for r in S['top_posts'][:6]:
 url=re.search(r'https://www\.tiktok\.com/@[^)\s]+',r['视频链接']).group(0)
 rows.append([r['发布时间'][5:10]+' '+r['发布时间'][11:16],r['owner'],r['account'],f(r['播放量']),r['title'],f'[查看视频]({url})'])
table(['发布时间','负责人','账号','播放量','正式剧名关联','链接'],rows)
add('前六条视频均未正式关联剧名。部分 Caption 提到 The Billionaire’s Sister Strikes Back，但本次没有用文案猜测代替剧目关联，因此它们仍计入账号和团队播放，不强行并入剧目排名。\n')
add('### 已关联剧目中的播放前 8 名\n')
table(['剧名','本期视频数','本期视频累计播放','涉及负责人'],[[r['key'],r['posts'],f(r['plays']),'、'.join(r['owners'])]for r in S['groups']['drama']if r['key']!='未关联剧名'][:8])
add('已关联 264 条视频、67 个剧名；另有 **258 条未关联剧名，累计 1,282,401 播放，占总播放 61.7%**。上表只是已关联部分的排名，不能代表全部剧目的完整排行；未使用剧目历史累计播放作为本期播放。\n')
add('## 七、新老视频合计的每日新增播放：目前可读到什么\n')
add('以下直接列「每日播放趋势」的新增字段，并逐日与「每日播放趋势-分账号」相加核对，7 天均一致。**10/14–10/18 是源表的跨日均摊估算，不是每天实测；10/12–10/13 也只有采集间隔覆盖。**\n')
rows=[]
for r in S['daily_increment']:
 date=r['日期'][5:];kind='采集间隔增量，部分覆盖'if date in['10-12','10-13']else'跨日均摊估算，非单日实测'
 interval={'10-12':'10/12 11:58 → 10/13 00:08','10-13':'10/13 00:08 → 10/14 00:16','10-14':'10/14 00:16 → 10/16 10:38','10-15':'同上，两个日期共享同一采集区间','10-16':'10/16 10:38 → 10/19 10:45','10-17':'同上，三个日期共享同一采集区间','10-18':'同上，三个日期共享同一采集区间'}[date]
 rows.append([date,f(r['新增播放量']),kind,interval])
table(['源表归档日期','新增播放字段值','数据性质','实际采集区间（北京时间）'],rows)
add('10/12、10/13 分别有 16、33 条视频在对应批次缺失，另各 1 条未纳入；10/14–15 的共同区间缺失 200 条，10/16–18 的共同区间缺失 219 条。后两组缺失数是区间值，不能按天重复相加。\n')
add('因首段缺少 10/12 零点至 11:58 的覆盖、末段延伸到 10/19 上午，且存在视频缺失，**目前不能给出严格覆盖 10/12–10/18 的新老视频实测新增播放总量**。本报告不把上述均摊值之和称为本周实测总播放。\n')
add('## 八、数据口径、表间差异与待确认项\n')
add('### 统计方法\n')
add('- 视频时间范围：北京时间 2026/10/12 00:00（含）至 10/19 00:00（不含），按「采集数据」的实际发布时间筛选。\n- 发布数按 Post ID 去重；本期 522 条无重复 Post ID、无空播放量。账号名取实际视频链接中的 ID，台账用于关联负责人，手机编号优先参考资产表，冲突单列。\n- 播放取各视频最近一条可用采集值：510 条截至 10/19 10:45:57，3 条截至 10/16 10:38:05，9 条截至 10/14 00:16:56。后 12 条更新较旧，保留已采集值，不推测当前播放。\n- CPS 按手动明细日期筛选、按记录 ID 去重，金额使用 USD 字段，分成用公式原值汇总后展示；与视频统计分开，未补算空值。\n- 剧目仅按明确关联统计，不合并疑似同剧、跨语种或仅文案相似的作品。\n- 所有读取均完成分页，未用部分可见行推算全表。当前归属不回填为已证实的历史负责人。\n')
add('### 表间差异\n')
table(['核对项目','结果与本报告处理'],[
 ['采集数据 vs 发布记录','522 条采集视频中，344 条匹配发布记录，178 条没有匹配；本期有实际发布时间的发布记录 344 条均能找到采集数据。主表按实际采集的 522 条计数。'],
 ['发布记录的两个日期','按「日期」筛选为 296 条，按「实际发布时间」为 344 条；未将计划/登记日期当作实际发布日。'],
 ['运营日报汇总','本期合计 336 条、1,550,328 播放，少于采集数据的 522 条、2,079,342 播放。覆盖范围/公式差异未完全查明，不以日报覆盖实际采集汇总；其金额与分成可与手动收益逐人核对。'],
 ['剧目关联','258 条缺正式剧名；不从历史剧目总量倒推本期。'],
 ['账号身份与归属','Phone-15 两个 ID 的改名/换号关系、台账缺失账号和本期负责人变更日期待确认；不把 ID 数直接写成独立活跃账号数。'],
 ['CPS 的有效性','金额和分成加总可核对，但出单口径、数据粒度、结算状态及部分后台日期时区仍待确认。']])
add('### 数据来源及访问情况\n')
base='https://gengrowth.feishu.cn/base/OtnsbnRnwaLmnVsJByscTkFMntd?table='
names=[('采集','采集数据'),('发布','发布记录'),('账号','账号台账'),('收益','CPS账号数据明细 手动版'),('出单汇总','出单短剧汇总'),('日报','运营日报汇总'),('日增','每日播放趋势'),('分账号日增','每日播放趋势-分账号'),('选剧','选剧池（仅用于剧名关联）'),('剧目汇总','短剧播放数据汇总（历史口径参照）'),('新发','短剧新发趋势-按日去重（参照）')]
rows=[]
for key,title in names:
 mm=json.loads((P/(key+'.manifest.json')).read_text())
 assert mm['has_more']is False
 rows.append([f'[{title}]({base+mm["table_id"]})',mm['records_count'],'完整读取'])
for key,title in [('资产','TikTok 资产表'),('设备','设备与登录环境表')]:
 mm=json.loads((P/(key+'.manifest.json')).read_text())
 rows.append([f'[{title}](https://gengrowth.feishu.cn/wiki/QCigwFYMCiuQu1k8q94cXy7PnZd?table={mm["table_id"]})',mm['records_count'],'完整读取；仅核对账号/负责人/设备'])
table(['来源','读取全表行数（非本期行数）','状态'],rows)
add('读取时间为 2026/10/19 13:51:07–13:51:30（北京时间）。本次「短剧发行管理」目录中未见此前提到的「每日剧场收益」「收益汇总表」及非手动版「CPS账号数据明细」，未取得其当前数据；采用现有手动明细、出单短剧汇总与运营日报交叉核对，不将不可见表视为零。未取得订单结算凭证或账号历史变更记录。\n')
add('本期与上一份 10/8–10/12 报告存在 10/12 重叠，且观察天数、采集时点不同，因此不直接计算环比。飞书只读，本报告保存在个人草稿目录。\n')
out=P.parent/'2026-10-12至10-18-短剧运营周报.md'
out.write_text('\n'.join(lines),encoding='utf-8')
checks={'videos':N,'plays':V,'public_handles':len(S['groups']['account']),'orders_reported':orders,'amount_usd':str(amount),'formula_share_usd':str(share),'owner_account_day_drama_sums_match':True,'daily_increment_account_sums_match':True,'capture_unique_ids':True,'report_path':str(out)}
(P/'数据检查.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
print(json.dumps(checks,ensure_ascii=False,indent=2))
print('lines',len(out.read_text().splitlines()),'characters',len(out.read_text()))
