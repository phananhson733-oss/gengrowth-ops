from pathlib import Path
p=Path(__file__).resolve().parent/'生成周报.py'
s=p.read_text()
assert "section('history'" not in s
block=r'''
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
'''
s=s.replace("checks=[['数据同步'",block+"\nchecks=[['数据同步'",1)
s=s.replace("planbody+=p(proposal)+p(criteria)","criteria+=' 同时复盘历史反复出单的剧，单独记录团队成交验证；派活时写清值得剪的冲突和观众最想知道的问题。'\nplanbody+=p(proposal)+p(criteria)")
s=s.replace('<a href="#sources">统计口径</a>','<a href="#history">历史出单与选剧</a><a href="#sources">统计口径</a>')
s=s.replace('本期手动版共有 4 条收入记录','本期已核验有金额的手动收入记录共 4 条')
s=s.replace('李建卓、马博洋本期未见收入明细，不代表零收益。','李建卓最新有一条 10/11 空白记录，缺剧名、金额和订单数；马博洋本期未见收入明细，均不能认定零收益。')
marker="sourcehtml=table(['读取表 / 范围','返回记录数','版本 rev','来源'],sourcerows)"
extra="""method.append('历史出单分析单独使用 10/12 新读取的手动收益表 86 行及选剧池 395 行，均完整分页；其中 79 条有剧名的记录按平台与名称清理空白、忽略大小写汇总，不合并跨语言剧目或擅自修正带数字的异常剧名。金额仅为填报原值相加，未核实订单去重与结算，不叠入 10/8–10/12 的期间业绩。完整历史汇总与原始记录保存在同目录核验文件夹。')
for short,label in [('出单特征分析-收益','历史出单分析：手动收益全表'),('出单特征分析-剧目','历史出单分析：选剧池全表')]:
 m=json.loads((ev/(short+'.manifest.json')).read_text());assert m['has_more']is False
 sourcerows.append([label,m['records_count'],m['rev'],base+'?table='+m['table_id']])
"""
assert marker in s
s=s.replace(marker,extra+marker,1)
p.write_text(s)
