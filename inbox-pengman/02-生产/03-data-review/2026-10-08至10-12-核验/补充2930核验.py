from pathlib import Path
from html import escape
import json
p=Path(__file__).resolve().parent
root=p.parent
stem='2026-10-08至10-12-短剧运营阶段周报'
text='''## 10/12 13:55 补充核验：29、30 号手机已经在发

**账号台账已经登记这两个号，ID、手机编号、负责人和主页链接齐全。负责人都是张凯风。** 最新采集表已出现视频，因此本期已确认发布账号从首版的 24 个补充为至少 26 个；张凯风从 5 个补充为 7 个。下面原有 194 条 / 152,544 播放仍保留为 11:01 首版样本，不代表团队当前完整总量。

| 手机 | 账号 | 账号名称 | 新增查到的视频 | 表内累计播放 | 最早查到的实际发布时间（北京时间） |
| --- | --- | --- | --- | --- | --- |
| Phone-29 | marjepurcell71 | AIドラマ案内所 | 6 条 | 447 | 10/10 23:21 |
| Phone-30 | hayleyluella | Takethelead | 4 条 | 697 | 10/10 19:59 |

这 10 条视频的采集时间统一填为 10/12 11:58:04，晚于首版读取时间，所以首版没有统计到。它们都有独立 Post ID 和视频链接。这里的发布时间是当前记录中的最早时间，不保证是账号历史首发；台账填写的“始发时间”均为 10/10 08:00，与采集记录不同。

**未同步的是状态和发布回填：**设备与登录环境表仍标“未启用”；TikTok 资产表仍标“已养好、买粉中”；发行管理账号台账的“状态”为空。按两个账号关联、视频链接和 10 个 Post ID 分别查询“发布记录”，均无匹配记录。更符合“账号已登记，已采集发布，但状态和发布记录未跟上”，不是账号没有建档。

**时间字段异常：**hayleyluella 的视频 7695627506480729357（105 播放）填写的发布时间为 10/12 12:05:35，晚于同一行采集时间 11:58:04。两列需要核对。其余 9 条合计 1,039 播放；全部 10 条表内合计 1,144 播放，暂单列，不混入首版总量或日增播放。

**来源与边界：**设备表全量 35 行、TikTok 资产表全量 33 行、发行账号台账全量 28 行；两号采集和发布记录使用限定查询，分页均完整。资产表时区为 America/Los_Angeles，本次只读取账号、设备及状态；上述发布和采集时间来自 Asia/Shanghai 的发行管理表。未查看密码、2FA 等凭证，未改飞书。建议下一步核对状态、补齐发布记录与剧目关联，再更新统一截止时间的团队数据。
'''
(p/'29-30号手机补充核验.md').write_text(text)
hp=root/(stem+'.html');h=hp.read_text()
rows=[['Phone-29','marjepurcell71','AIドラマ案内所','6','447','10/10 23:21'],['Phone-30','hayleyluella','Takethelead','4','697','10/10 19:59']]
paras=text.split('\n\n')
body='<section class="panel pm" id="phone2930-update"><h2>最新核验：29、30 号已开始发布</h2><p><span class="tag">10/12 13:55 补充 · 至少 26 个号已发布 · 张凯风 7 个</span></p>'
for para in paras[1:]:
 if para.startswith('|'):
  body+='<div class="table-scroll"><table><thead><tr>'+''.join('<th>'+x+'</th>'for x in ['手机','账号','账号名称','视频数','表内累计播放','最早发布'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+escape(x)+'</td>'for x in r)+'</tr>'for r in rows)+'</tbody></table></div>'
 else:
  import re
  body+='<p>'+re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',escape(para))+'</p>'
body+='</section>'
h=h.replace('</header>','</header>'+body,1)
h=h.replace('先看数据截止时间','首版样本截止时间（两号新数据见上方补充）',1).replace('数据尚未覆盖完整五天。','首版数据尚未覆盖完整五天。',1)
h=h.replace('<div class="label">已采集发布账号</div>','<div class="label">11:01 首版样本账号</div>',1)
h=h.replace('<h2>每个人这期发得怎么样</h2>','<h2>每个人的首版样本数据（两号补充见上方）</h2>').replace('<h2>24 个账号明细</h2>','<h2>首版 24 个账号明细</h2>')
old='账号台账另有张凯风的 marjepurcell71（Phone-29）和 hayleyluella（Phone-30），本期未找到采集发布记录，不能据此认定没有发。'
new='补充核验：marjepurcell71（Phone-29）和 hayleyluella（Phone-30）已查到本期采集发布记录，详见页首；首版读取时未包含这些新记录。'
h=h.replace(old,new)
h=h.replace('TikTok 资产表、GGWork 工具、平台官网及分销推荐页面本次未重新读取；','首版未重新读取 TikTok 资产表，13:55 两号复核已读取设备表与 TikTok 资产表；GGWork 工具、平台官网及分销推荐页面仍未重新读取；')
hp.write_text(h)
mp=root/(stem+'.md');m=mp.read_text();first,rest=m.split('\n',1)
m=first+'\n\n'+text+'\n---\n\n## 以下为 11:01 首版样本，两个新账号另列于上方\n'+rest
m=m.replace(old,new).replace('TikTok 资产表、GGWork 工具、平台官网及分销推荐页面本次未重新读取；','首版未重新读取 TikTok 资产表，13:55 两号复核已读取设备表与 TikTok 资产表；GGWork 工具、平台官网及分销推荐页面仍未重新读取；')
mp.write_text(m)
assert h.count('id="phone2930-update"')==1
print('已更新 HTML 与 Markdown 的两号补充核验；保留首版快照口径。')
