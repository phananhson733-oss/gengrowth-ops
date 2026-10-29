from pathlib import Path
from html import escape as E
from decimal import Decimal, ROUND_HALF_UP
import json,re
from collections import defaultdict
root=Path(__file__).resolve().parent.parent
ev=Path(__file__).resolve().parent
d=json.loads((ev/'分析汇总-26账号.json').read_text())
posts=d['posts'];
for x in posts: x['title']=x.get('title') or '未关联剧名'
for x in d['top_posts']: x['title']=x.get('title') or '未关联剧名'
total=d['plays']; stem='2026-10-08至10-12-短剧运营阶段周报'
old=(root/'2026-09-28至10-07-短剧运营阶段周报.html').read_text()
css=re.search(r'<style>(.*?)</style>',old,re.S).group(1)
css+='\n.plan{margin-top:14px}.plan b{color:var(--blue)}.wrap{overflow-wrap:anywhere}.account-table td:nth-child(1){min-width:165px}.brief li{margin:9px 0}.grade{font-size:30px;font-weight:750;color:var(--blue)}.anchor{display:flex;gap:16px;flex-wrap:wrap;margin:18px 0;font-size:13px}.statusbox{padding:13px 16px;border-left:3px solid #dda04d;background:#fff7e9;margin:16px 0}.barrow{margin:13px 0}.barrow .track{height:12px}.compact{font-size:13px;color:var(--muted)}'
html=[]; md=[]
def p(t):return '<p>'+E(t)+'</p>'
def table(head,rows):
 return '<div class="table-scroll"><table><thead><tr>'+''.join('<th>'+E(str(x))+'</th>' for x in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(str(x))+'</td>'for x in row)+'</tr>'for row in rows)+'</tbody></table></div>'
def mt(head,rows):
 esc=lambda x:str(x).replace('|','\\|').replace('\n',' / ')
 return '\n| '+' | '.join(map(esc,head))+' |\n| '+' | '.join('---'for x in head)+' |\n'+''.join('| '+' | '.join(map(esc,row))+' |\n'for row in rows)
def section(id,title,body,text):
 html.append('<section class="panel" id="'+id+'"><div class="section-head"><h2>'+E(title)+'</h2></div>'+body+'</section>')
 md.append('## '+title+'\n\n'+text+'\n')
f=lambda n:f'{n:,}'
base='https://gengrowth.feishu.cn/base/OtnsbnRnwaLmnVsJByscTkFMntd'
warning='已将 29、30 号并入 26 个活跃账号统计。当前数据仍未覆盖完整五天：原 26 个账号采集到 10/10，29、30 号采集时间为 10/12；10/11–10/12 仅有这两个号的样本。详细采集口径见文末。'
intro='这次复盘先抓两件事：拆解已经跑出的内容，把团队的选剧和派活流程理顺。下周由我集中选剧，给同事明确的任务和交付要求，减少靠聊天消息反复提醒。'
html.append('<header><div class="topline"><div><div class="eyebrow">GENGROWTH / SHORT DRAMA</div><div class="draft">Pengman 个人草稿 · 飞书只读核验</div></div><button onclick="window.print()">打印 / 保存 PDF</button></div><h1>短剧运营阶段周报</h1><p class="sub">2026.10.08—10.12 · 北京时间 · 截至 10/12 核验的阶段数据</p></header><div class="hero"><span class="tag">本期复盘 / 下周计划</span><p>'+intro+'</p><small>当前最需要解决的：选什么、谁来剪、何时交、发布后是否完整回填。</small></div><div class="callout"><b>先看数据截止时间</b><br>'+warning+'</div>')
md.append('# 短剧运营阶段周报｜2026-10-08 至 10-12\n\nPengman 个人草稿 · 北京时间 · 飞书只读核验\n\n> '+warning+'\n\n'+intro+'\n')
metrics=[('活跃账号（已采集发布）','26 个','高璇 10 / 张凯风 7 / 李建卓 6 / 彭满 3'),('已采集新发视频','204 条','按真实发布时间筛选、Post ID 去重'),('这些视频累计播放','153,688','约 15.37 万；不是这五天的新增播放'),('已填报分成','$19.37','USD；原值 $19.369，结算状态待核实')]
html.append('<div class="metrics">'+''.join('<div class="metric"><div class="label">'+a+'</div><strong>'+b+'</strong><small>'+c+'</small></div>'for a,b,c in metrics)+'</div><nav class="anchor"><a href="#summary">本期结论</a><a href="#plan">下周计划</a><a href="#people">负责人</a><a href="#accounts">账号明细</a><a href="#dramas">剧目与视频</a><a href="#history">历史出单与选剧</a><a href="#sources">统计口径</a></nav>')
md.append('\n'.join('- '+a+'：**'+b+'**。'+c+'。' for a,b,c in metrics)+'\n')
summary=[('已核验事实','张凯风的 ngphnggiang40 累计 86,856 播放，占本期样本 56.5%。《From page to king Arthur》3 条合计 79,936，单条最高 66,200。'),('已核验事实','李建卓的 apdt6w97o2pk 已计入：8 条、6,719 播放，是他这批 6 个账号里播放最高的。不能把建卓所有账号都归为“效果差”。'),('运营推断','播放明显集中在少数视频。适合先拆解爆款的开头、冲突和停点，再让其他账号小批量复测；目前还不能证明是账号、题材或剪辑中的哪一项起决定作用。'),('待确认项','10/10–10/12 日增数据缺失；63 条视频尚未关联剧名；收益只有 4 条填报记录。先补齐这些环节，再判断完整周期的增长和成交效率。')]
section('summary','先说结论','<div class="two-col">'+''.join('<div class="insight"><span class="tag">'+a+'</span>'+p(b)+'</div>'for a,b in summary)+'</div>','\n\n'.join('**'+a+'**：'+b for a,b in summary))
plans=[('1. 选剧由我集中做','我把多个来源放在一起看，先筛出值得剪的剧，再结合每个人的账号、语言和产能分配，减少大家重复找剧。'),('2. 选剧工具放到 GGWork','按我与彪哥沟通的方向，由他那边承接工具；他那边暂缺的平台数据，我计划每天定时补采。这里记录的是推进方向，尚未核验部署或定时任务运行。'),('3. 派活从“发消息”变成“有交付”','现在在飞书里告诉大家某个剧值得剪，容易漏、忘或被其他消息淹没。下周研究飞书“任务”与现有“选剧池”联动，先用少量剧跑通分配与回收。')]
planbody='<div class="actions">'+''.join('<div class="action"><b>'+a+'</b>'+p(b)+'</div>'for a,b in plans)+'</div>'
grade=[('B','满足 1 个维度'),('A','满足 2 个维度'),('S','满足 3 个维度')]
planbody+='<h3 style="margin-top:26px">选剧逻辑 · 暂定版</h3>'+p('三个维度：① 彪哥选剧台“选剧”里的数据；② 各短剧平台官网数据；③ 各短剧分销平台的推荐剧。')+'<div class="insights plan">'+''.join('<div class="insight"><div class="grade">'+a+'</div>'+p(b)+'</div>'for a,b in grade)+'</div>'
grade_note='这套规则后续可以调整。选剧池当前字段说明仍是“S：至少两种有效方法 + 近 7 天表现；A：一项近期强信号；B：普通推荐、上新或旧证据”，与这次提出的规则不同，正式启用前需要统一，不能直接套用已有等级。'
planbody+='<div class="statusbox">'+grade_note+'</div>'
proposal='建议试跑时，每条任务带上选剧池对应剧目、负责人、目标账号、素材入口、剪辑要求、截止时间和交付链接；沿用现有表的状态，研究如何同步，避免任务和表各记一套。消息用来提醒，进度能在记录里查到。'
criteria='下周先看三个结果：选剧能说明依据；每个任务有人接、有时间、有交付；漏派、逾期和缺回填能查出来。具体派活方式、每日产能和联动实现方案仍待研究。'
criteria+=' 同时复盘历史反复出单的剧，单独记录团队成交验证；派活时写清值得剪的冲突和观众最想知道的问题。'
planbody+=p(proposal)+p(criteria)
section('plan','下周重点：选剧集中，派活清楚，交付可追踪','<span class="tag warn">彭满本次提出的计划 · 尚未执行</span>'+planbody,'\n\n'.join('**'+a+'**：'+b for a,b in plans)+'\n\n### 选剧分级（暂定）\n\n三个维度：① 彪哥选剧台“选剧”数据；② 各短剧平台官网数据；③ 各分销平台推荐剧。\n'+mt(['等级','规则'],grade)+'\n'+grade_note+'\n\n'+proposal+'\n\n'+criteria)
ownerrows=[];bars=''
for g in d['groups']['owner']:
 ownerrows.append([g['key'],len(g['accounts']),g['posts'],f(g['plays']),f(round(g['plays']/g['posts'])),f"{g['plays']/total:.1%}"])
 bars+='<div class="barrow"><div class="bar-label"><span>'+g['key']+'</span><b>'+f(g['plays'])+' 播放</b></div><div class="track"><i style="width:'+str(g['plays']/total*100)+'%"></i></div></div>'
ownerrows.append(['团队合计',26,len(posts),f(total),f(round(total/len(posts))),'100.0%'])
head=['负责人','有发布的账号','已采集视频','累计播放','平均每条','播放占比']
people_note='这是有实际发布采集记录的账号数，不是每人全部领用手机数。负责人按当前账号台账归属，历史变更记录未取得，不能据此还原每天的交接。视频上线时间不同，且周期未采全，本期不与上一份 10 天报告直接计算涨跌。'
asset_note='张凯风的 marjepurcell71（Phone-29，6 条 / 447 播放）和 hayleyluella（Phone-30，4 条 / 697 播放）已计入，其账号台账状态已核验为“发布中”。Phone-31–35 的分配落实情况未在本次发行台账中核实。台账中 felicitypatterson67 的手机写为“22”，与 nobleltcpnj 的“Phone-22”存在编号冲突；apdt 未填手机编号，后续应与资产表核对。占星账号不纳入。'
section('people','每个人这期发得怎么样',table(head,ownerrows)+p(people_note)+'<details class="more"><summary>查看播放贡献与账号分配待核实项</summary>'+bars+p(asset_note)+'</details>',mt(head,ownerrows)+'\n'+people_note+'\n\n'+asset_note)
# account detail: use per-video facts to calculate drama summaries
accountrows=[]; account_html=''
for i,g in enumerate(d['groups']['account'],1):
 ps=[x for x in posts if x['account']==g['key']]; owner=ps[0]['owner']; by=defaultdict(lambda:[0,0])
 for x in ps:by[x['title']][0]+=1;by[x['title']][1]+=x['播放量']
 titles=sorted(by.items(),key=lambda x:-x[1][1]); top=max(ps,key=lambda x:x['播放量'])
 details='<details><summary>'+str(len([x for x in by if x!='未关联剧名']))+' 部已关联剧 · 展开明细</summary><ul class="title-list">'+''.join('<li><span>'+E(t)+'</span><b>'+str(v[0])+' 条 / '+f(v[1])+'</b></li>'for t,v in titles)+'</ul></details>'
 account_html+='<tr class="account-row" data-owner="'+owner+'"><td class="handle">'+E(g['key'])+'</td><td>'+owner+'</td><td>'+str(g['posts'])+'</td><td>'+f(g['plays'])+'</td><td>'+f(top['播放量'])+'</td><td class="drama-cell">'+details+'</td></tr>'
 accountrows.append([g['key'],owner,g['posts'],f(g['plays']),f(top['播放量']),'; '.join(t+'（'+str(v[0])+' 条 / '+f(v[1])+'）'for t,v in titles)])
acc_head=['账号','负责人','视频数','累计播放','最高单条','剧目：条数 / 播放']
filters='<div class="filters"><label>负责人 <select id="owner"><option value="">全部</option>'+''.join('<option>'+o+'</option>'for o in ['高璇','张凯风','李建卓','彭满'])+'</select></label><span class="filtered-status" id="count">26 个账号</span></div>'
acc_table='<div class="table-scroll"><table class="account-table"><thead><tr>'+''.join('<th>'+x+'</th>'for x in acc_head)+'</tr></thead><tbody>'+account_html+'</tbody></table></div>'
section('accounts','26 个账号明细',p('播放均为本期已采集新发视频的累计值；点击每行右侧可查看该账号发布的剧及对应数据。')+filters+acc_table,mt(acc_head,accountrows))
known=[x for x in d['groups']['drama']if x['key']!='未关联剧名']
dramarows=[[x['key'],x['posts'],f(x['plays']),', '.join(x['accounts'])]for x in known]
head=['剧目','视频数','累计播放','发布账号']
dramabody=table(head,dramarows[:10])+'<details class="more"><summary>查看其余 '+str(len(dramarows)-10)+' 部剧</summary>'+table(head,dramarows[10:])+'</details>'
drama_note='通过发布记录的“剧”关联可核实 51 部剧、141 条视频；另有 63 条、18,321 播放未关联剧名。尤其是 10/10 的 50 条中有 48 条未关联，应优先补回填。表内剧目只加本期视频，不使用该剧历史累计播放。'
dramabody=p(drama_note)+dramabody
video_rows=[]
for x in d['top_posts'][:6]:
 captiontitle=x['title'] if x['title']!='未关联剧名' else '未关联；Caption 写 The Mob Queen Wants Straight A’s Part 2'
 url='https://www.tiktok.com/@'+x['account']+'/video/'+x['Post ID']
 video_rows.append([x['发布时间'][5:16].replace('T',' '),x['account'],captiontitle,f(x['播放量']),url])
vt=table(['发布时间','账号','剧目 / 文案','播放','视频链接'],video_rows)
for row in video_rows:vt=vt.replace(E(row[-1]),'<a href="'+E(row[-1])+'" target="_blank" rel="noreferrer">查看原视频 ↗</a>')
dramabody+='<h3 style="margin-top:24px">头部视频：下一步人工拆解的样本</h3>'+vt
ins='运营推断（仅依据标题与 Caption，未观看视频）：Arthur 的“隐藏身份、功劳被冒领、夺回王位”，以及 apdt 的“强势身份重生、校园反击”值得对照开头和冲突设置。Arthur 三条合计占样本播放 52.0%，最高单条占 43.1%，不能把这一条的成功直接当成稳定产能。'
quality='建卓：先对照 apdt 的两个较高播放样本（2,644 / 2,235）与其他账号低播放视频，人工看选剧、开头、节奏和悬念停点；账号较新、选剧和工具/剪辑质量都仍是假设。高璇的 hnlinhthng9678 本期 5 条仅 2 播放，先核实公开状态和采集准确性，再排查账号问题。比较效果尽量统一到发布后 24/72 小时。'
dramabody+=p(ins)+p(quality)
section('dramas','哪些剧和视频值得复盘',dramabody,drama_note+'\n'+mt(head,dramarows)+'\n### 头部视频\n'+mt(['发布时间','账号','剧目 / 文案','播放','视频链接'],video_rows)+'\n'+ins+'\n\n'+quality)
# daily breakdown
byday={x['key']:x for x in d['groups']['day']}
dayrows=[]; chart=''
for date in ['2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12']:
 g=byday.get(date); status='已采集，完整性未确认' if date<'2026-10-10' else ('部分采集' if date=='2026-10-10' else ('仅 29、30 号样本；当日未结束' if date.endswith('12') else '仅 29、30 号样本'))
 dayrows.append([date[5:],g['posts']if g else '待补',f(g['plays'])if g else '待补',status])
 chart+='<div class="day"><div class="column'+(' missing'if not g else '')+'"><span>'+str(g['posts']if g else '待补')+'</span>'+('<i style="height:'+str(g['posts']/83*120)+'px;background:var(--blue)"></i>'if g else '')+'</div><small>'+date[5:]+'</small></div>'
incrows=[['10/8','122,722','跨日均摊估算，非单日实测','10/6 03:29 → 10/9 00:01；分摊到 10/6–10/8'],['10/9','123,824','采集间隔实测；部分覆盖','10/9 00:01 → 10/10 00:01；35 条视频缺失'],['10/10','待补','缺日初或次日结算快照','不能写为 0'],['10/11','待补','缺日初或次日结算快照','不能写为 0'],['10/12','待补','当日未结束','次日快照到齐后更新']]
pm='彭满 10/9 已记录增量：Detour 6,210 + Expedition 3,382 + Jolien 4,317 = 13,909；这些记录合计仍有 6 条视频缺失。10/8 的 22,258 是估算，10/10–10/12 缺数据，因此不提供彭满或团队这五天的完整新增播放总数。'
section('daily','发布节奏与新老视频日增量','<div class="two-col"><div><h3>每日已采集新发条数</h3><div class="daily-chart">'+chart+'</div></div><div>'+table(['发布日期','视频数','这些视频累计播放','覆盖状态'],dayrows)+'</div></div>'+p('上表按发布日期分组，播放是这些视频截至采集时的累计值。下表才是新老视频的新增播放，两个口径不能相加或替代。')+table(['日期','表内新增播放','性质','范围 / 缺口'],incrows)+p(pm),mt(['发布日期','视频数','这些视频累计播放','覆盖状态'],dayrows)+'\n上表是发布日期分组的累计播放，下表是新老视频日增量，不能混加。\n'+mt(['日期','表内新增播放','性质','范围 / 缺口'],incrows)+'\n'+pm)
revrows=[]
for x in sorted(d['revenue'],key=lambda x:(x['日期'],x['负责人'][0]['name'])):
 revrows.append([x['日期'][5:10],x['负责人'][0]['name'],' / '.join(x['剧场']),x['出单剧名（仅统计出单）'],str(x['订单数（单剧）'])if x['订单数（单剧）']is not None else '未填',format(Decimal(str(x['订单金额'])),'.2f'),format(Decimal(x['分成收益']),'.3f')])
rnote='本期已核验有金额的手动收入记录共 4 条，填报订单金额合计 $37.06，公式分成合计 $19.369（展示 $19.37），均为 USD。已填订单数合计 3 单，彭满 10/10 这一条订单数未填；以前确认过的订单数量不能移用到这条。'
risk='四条记录均未填“数据粒度”，缺少订单 ID，也没有可核验的预估/结算状态，因此这里只报填报值，不报已结算收入。高璇金额 $22.38、分成 $12.029；张凯风 $13.99 / $6.995；彭满 $0.69 / $0.345。分成按原值汇总后四舍五入，避免逐行舍入导致 1 美分差异。'
eff='高璇两条账号字段是平台邮箱，彭满账号字段为空，暂不能归到具体 TikTok 账号。李建卓最新有一条 10/11 空白记录，缺剧名、金额和订单数；马博洋本期未见收入明细，均不能认定零收益。视频采集与订单日期覆盖也不一致，因此本期不计算“每多少播放出一单”或把某条视频播放归因为某笔订单。'
section('revenue','成交与收益：已填报多少，就报多少',p(rnote)+table(['收益日期','负责人','平台','填报出单剧','订单数','订单金额 USD','分成 USD'],revrows)+p(risk)+p(eff),rnote+'\n'+mt(['收益日期','负责人','平台','填报出单剧','订单数','订单金额 USD','分成 USD'],revrows)+'\n'+risk+'\n\n'+eff)

# Historical conversion evidence is separate from the current reporting period.
history_scope='已核验范围：10/12 读取手动收益表全部 86 条记录，其中 79 条有出单剧名，收益日期覆盖 9/7–10/10。以下为历史填报订单金额（USD），不计入本期收益；缺少订单 ID、数据粒度和结算状态，记录条数不等于已核实的独立订单数。'
history_lead='选剧启发：优先找“关系有冲突、人物有委屈、后面有反转”的剧，再看是否有适合剪辑的片段。这是从历史样本提出的测试方向，尚不能证明某类题材转化率更高。'
history_rows=[
 ['Love After Divorce: My Ex-husband Wants Me Back','7 个日期','$83.91','高璇；离婚、前夫挽回'],
 ['The Unbreakables: Super Son Returns','7 个日期','$75.19','张凯风；家庭、身份揭露、超能力'],
 ['Daddy Left His Baby to Die','4 个日期','$46.86','高璇；家庭、孩子处境'],
 ['Rejecting My Five Female Mates','5 条 / 4 个日期','$30.05','高璇、马博洋均有记录；狼人、身份揭露'],
 ['The Secret of Gala Night','4 条 / 3 个日期','$27.35','高璇；爱情、萌宝、霸总；同日两条待核对'],
 ['Private Tutoring','2 个日期','$26.58','彭满、高璇均有记录；选剧池有爱情、LGBTQ 标签']
]
history_directions=[
 ('家庭与孩子：让人关心结局','Daddy、Super Son、Son from the Future 等都有收益记录。选剧时看孩子能否被保护、家人是否相认等问题是否明确；剪辑要让观众在意这个问题的答案。'),
 ('受委屈后的翻身：有清楚的前后变化','Love After Divorce 的重复填报信号较强；献祭后成为女王、被抛弃后显露身份等也值得测试。但小额收益剧不能与它等量看待。'),
 ('奇幻与亲密关系：设定之外要有悬念','狼人伴侣、蛇类奇幻、诅咒 Alpha 等方向均有样本。重点看拒绝、伴侣选择、诅咒或秘密身份怎样影响关系，不能只凭“狼人、兽人”标签选剧。'),
 ('细分受众：保留持续测试','Private Tutoring、The Omega’s Command、My Two Spy Daddies 等有收益记录，可围绕相近受众继续试；还不能断言这一方向整体更赚钱。')
]
history_caution='待确认：Sent As A Sacrifice, She Became The Queen 有 15 条收益记录，其中 10 条低于 $0.10，不能直接当成“稳定出了 15 单”。各剧投入的视频数、播放、点击和推广天数尚未完整对应；发得多也可能带来更多订单，因此暂不排名题材转化率。题材归纳依据选剧池标签及标题，未逐部观看正片；名称相同也需核对剧 ID、语种和版本。'
history_action='下周应用：保留 B/A/S＝满足 1/2/3 个外部证据维度，另外记录“团队是否有成交验证”，不把两者混成一个等级。同等级下，优先复盘跨日期、跨负责人出现收益且金额有意义的剧，并确认冲突、可剪开头、悬念和推广路径。先找出 Love After Divorce、Super Son Returns、Daddy Left His Baby to Die、Rejecting My Five Female Mates 的对应推广视频，核对成交归因，再用相近新剧小批量测试。'
history_dispatch='给同事派活时，除剧名、素材和截止时间，再附一句：“这部剧值得剪的是哪段冲突，观众看完最想知道什么？”'
history_head=['重点复盘剧','历史收益记录','填报金额 USD','证据与特征']
history_html='<div class="callout">'+history_scope+'</div>'+p(history_lead)+table(history_head,history_rows)+'<h3 style="margin-top:24px">运营推断：四个值得测试的方向</h3><div class="two-col">'+''.join('<div class="insight"><b>'+E(a)+'</b>'+p(b)+'</div>'for a,b in history_directions)+'</div>'+p(history_caution)+'<h3 style="margin-top:24px">怎么用在下周选剧和派活里</h3>'+p(history_action)+p(history_dispatch)
section('history','所有历史出单剧：对选剧有什么启发',history_html,history_scope+'\n\n'+history_lead+'\n'+mt(history_head,history_rows)+'\n### 运营推断：四个测试方向\n\n'+'\n\n'.join('**'+a+'**：'+b for a,b in history_directions)+'\n\n'+history_caution+'\n\n### 下周怎么用\n\n'+history_action+'\n\n'+history_dispatch)

checks=[['数据同步','补 10/10–10/12 的采集与结算快照；补齐后重算，保留版本和采集时间。'],['发布回填','优先关联 10/10 的 48 条缺剧名视频，并补齐 29、30 号的发布记录；发布链接、剧目和负责人一起核对。'],['内容复盘','张凯风 Arthur 案例、建卓 apdt 与低播放样本、高璇 2 播放账号分别检查，不凭猜测定原因。'],['人员分工','复核新增账号的接收人与实际产能；选剧、剪辑、发布、回填各由谁负责写清楚。'],['派活试跑','研究现有选剧池和飞书任务如何联动；先少量试跑，记录耗时、漏项和交付完整度，再扩到全团队。']]
section('actions','接下来先做这几件事',table(['事项','下一步'],checks),mt(['事项','下一步'],checks))
# source appendix, exact manifests
source_names={'账号':'账号台账','选剧':'选剧池','采集':'采集数据','发布':'发布记录','日增':'每日播放趋势','分账号日增':'每日播放趋势-分账号','剧目汇总':'短剧播放数据汇总','新发':'短剧新发趋势-按日去重','收益':'CPS账号数据明细 手动版'}
sourcerows=[]
for short,name in source_names.items():
 m=json.loads((ev/(short+'.manifest.json')).read_text()); assert m['has_more']is False
 sourcerows.append([name,m['records_count'],m['rev'],base+'?table='+m['table_id']])
method=[
'筛选范围：2026-10-08 00:00:00 ≤ 实际发布时间 < 2026-10-13 00:00:00，Asia/Shanghai。以“采集数据”的发布时间为准，按 Post ID 去重；本次全表 Post ID 未发现重复。204 条均有播放数。读取时 10/12 尚未结束。',
'账号归属：采集数据关联账号台账；剧目：经 Post ID 连接发布记录，再连接选剧池。未确认的 Caption 剧名只作为视频说明，不强行归入正式剧目统计。历史负责人变更未核实，按当前台账列示。',
'发布日期与回填差异（发布记录全表为 11:01 快照）：“发布记录”的日期字段落在本期共 130 行，其中 23 行标为待公开；按实际发布时间筛选为 146 行。合并后的采集表实际发布样本为 204 条。计划、待公开及回填行不能重复加入视频总数。',
'汇总口径差异：“短剧播放数据汇总”含历史视频的当前累计；“短剧新发趋势-按日去重”按剧的首次发布日期分组，本期首发记录为 10/8 的 16 部和 10/9 的 11 部，不等于本期所有发布过的剧或视频。因此主报告从视频明细重算。',
'日增核对：10/8 分账号 24 条非空值相加为 122,722，10/9 为 123,824，均与总趋势表一致；另外 6 个账号为空。10/8 来源明确标“非实测单日数据”，10/10–10/12 全部为空，空值不按 0 处理。',
'收益：只汇总本期手动表的 4 条记录，不叠加其他汇总表；四条未见相同日期＋负责人＋平台＋剧名的重复组合，但无订单 ID、粒度和结算状态，业务去重与最终结算仍待核验。',
'读取边界：当前可访问的 14 表目录中未列出此前的“每日剧场收益”“收益汇总表”和非手动“CPS账号数据明细”，本次无法完成这些表之间的对账；不据此认定它们被删除。设备与 TikTok 资产表已读取并核对 29、30 号；GGWork 工具、平台官网及分销推荐页面未重新读取，没有核验工具部署或采集定时任务运行。',
'完整性：主数据来源的 9 表均读取全部记录及所需字段（后续限定查询另标范围），分页 has_more=false；不是只读可见行。源数据及分页清单保存在同目录“2026-10-08至10-12-核验”。主表读取为 10/12 10:59–11:01，随后于 13:55 完成 29、30 号限定查询。原 194 条视频快照为 10/10 16:14:51，新增 10 条为 10/12 11:58:04；合并后为 204 条、153,688 播放。两批样本没有重复 Post ID，但采集截止时间不同，不能视为统一时点的完整团队数据。本次合并未重新采集其他账号，日增与收益保留已核验快照。',
'本次更新个人 HTML 与 Markdown 草稿；此前按彭满授权已将两个账号台账的状态补为“发布中”，本轮合并未另改飞书数据。上期数值不充当本期数据；下周方案来自彭满本次说明，建议与待核实事项单独标明。'
]
method.append('异常值处理：hayleyluella 视频 7695627506480729357 的发布时间为 10/12 12:05:35，晚于表内采集时间 11:58:04；其 105 播放本次按源表数值计入团队及张凯风累计播放，并按源日期归入 10/12，时间字段仍待纠正。若剔除该记录，团队为 203 条 / 153,583 播放，张凯风为 49 条 / 103,639 播放；活跃账号数仍为 26。此异常不用于计算日增。')
method.append('两号回填：账号关联、链接及 Post ID 查询均未找到对应发布记录，所以新增 10 条暂归“未关联剧名”。台账记录齐全且状态已补为发布中；设备表“未启用”和资产表“已养好、买粉中”仍需同步。设备、资产与台账查询分别完整读取 35、33、28 行；资产表时区为 America/Los_Angeles，本次只取账号和状态，视频时间均以发行管理表 Asia/Shanghai 为准。')
for short,label,b in [('采集复核2930','29、30 号采集（限定查询）',base),('发布复核2930','29、30 号发布（账号/链接查询）',base),('发布按视频ID复核2930','29、30 号发布（视频 ID 查询）',base),('TikTok资产复核','TikTok 资产表','https://gengrowth.feishu.cn/base/QhEkbG4cZaDZSAsKX5CciN3knwh'),('设备复核','设备与登录环境表','https://gengrowth.feishu.cn/base/QhEkbG4cZaDZSAsKX5CciN3knwh'),('2930写后核验','两号状态写后核验（指定记录）',base)]:
 m=json.loads((ev/(short+'.manifest.json')).read_text());assert m['has_more']is False
 sourcerows.append([label,m['records_count'],m['rev'],b+'?table='+m['table_id']])
method.append('历史出单分析单独使用 10/12 新读取的手动收益表 86 行及选剧池 395 行，均完整分页；其中 79 条有剧名的记录按平台与名称清理空白、忽略大小写汇总，不合并跨语言剧目或擅自修正带数字的异常剧名。金额仅为填报原值相加，未核实订单去重与结算，不叠入 10/8–10/12 的期间业绩。完整历史汇总与原始记录保存在同目录核验文件夹。')
for short,label in [('出单特征分析-收益','历史出单分析：手动收益全表'),('出单特征分析-剧目','历史出单分析：选剧池全表')]:
 m=json.loads((ev/(short+'.manifest.json')).read_text());assert m['has_more']is False
 sourcerows.append([label,m['records_count'],m['rev'],base+'?table='+m['table_id']])
sourcehtml=table(['读取表 / 范围','返回记录数','版本 rev','来源'],sourcerows)
for row in sourcerows:sourcehtml=sourcehtml.replace(E(row[-1]),'<a href="'+E(row[-1])+'" target="_blank" rel="noreferrer">打开飞书 ↗</a>')
section('sources','口径、来源与没有补齐的数据','<details class="more" open><summary>查看核验说明</summary><ol class="brief">'+''.join('<li>'+E(t)+'</li>'for t in method)+'</ol>'+sourcehtml+'</details>','\n\n'.join(str(i+1)+'. '+t for i,t in enumerate(method))+'\n'+mt(['读取表 / 范围','返回记录数','版本 rev','来源'],sourcerows))
html.append('<footer><div class="footline"><span>Pengman 个人草稿 · 2026.10.12</span><span>下一版更新条件：10/10–10/12 数据与收益口径补齐</span></div></footer>')
script="""<script>const select=document.getElementById('owner');select.addEventListener('change',()=>{let count=0;document.querySelectorAll('.account-row').forEach(r=>{r.hidden=!!select.value&&r.dataset.owner!==select.value;if(!r.hidden)count++;});document.getElementById('count').textContent=count+' 个账号';});window.addEventListener('beforeprint',()=>document.querySelectorAll('details').forEach(e=>{e.dataset.wasOpen=e.open?'1':'0';e.open=true;}));window.addEventListener('afterprint',()=>document.querySelectorAll('details').forEach(e=>e.open=e.dataset.wasOpen==='1'));</script>"""
(root/(stem+'.html')).write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>10/8–10/12 短剧运营阶段周报 · Pengman</title><style>'+css+'</style></head><body><main>'+''.join(html)+'</main>'+script+'</body></html>')
(root/(stem+'.md')).write_text('\n'.join(md))
assert sum(x['plays']for x in d['groups']['owner'])==sum(x['plays']for x in d['groups']['account'])==sum(x['plays']for x in d['groups']['drama'])==sum(x['plays']for x in d['groups']['day'])==153688
assert len(posts)==len({x['Post ID']for x in posts})==204
assert sum(Decimal(x['分成收益'])for x in d['revenue'])==Decimal('19.369')
print(json.dumps({'html':str(root/(stem+'.html')),'markdown':str(root/(stem+'.md')),'posts':len(posts),'plays':total,'account_count':len(accountrows),'dramas':len(known),'checks':'各维度加总一致；分页完整；收益原值一致'},ensure_ascii=False))
