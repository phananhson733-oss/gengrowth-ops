---
title: ShortsBinge Blog 写作提示词与规范 v1.0（自动化交接版）
date: 2026-10-15
用途: 交给同事做自动化测试。汇总 2026-09-22 至 2026-10-15 写 ShortsBinge blog 时，用户逐条确认过的规则，加上一份可直接用的系统提示词、自检脚本和封面提示词模板
适用: shortsbinge.com 的剧集观看指南、演员片单、平台问题（取消订阅、是否安全等）三类 blog，英文为主，也适用于 de / fr / pt / bg / zh-TW / ja 等语言版本
---

# ShortsBinge Blog 写作提示词与规范 v1.0

## 0. 先说结论：哪些能自动化，哪些不能

| 环节 | 能否自动化 | 说明 |
|---|---|---|
| 抓剧集详情页信息（集数、免费集数、简介、演员） | ✅ | shortsbinge.com 剧集页。⚠️ 站点有 Vercel 防护，curl 会被拦（返回 checkpoint 页或 429），需要用浏览器环境抓取或降低频率 |
| 搜集剧情素材（ReelShort / NetShort / Fandom / IMDb） | ✅ 大部分 | 见第 2 节信源清单 |
| 写稿 | ✅ | 用第 6 节系统提示词 |
| 格式自检 | ✅ | 用第 7 节脚本 |
| Semrush 搜索量 / SERP 核查 | ⚠️ 半自动 | 走公司 Semrush 代理入口（找马博洋要链接），会话会过期，需要人工登录 |
| 剧情真实性终审 | ❌ 需人工 | 自动化最容易出的问题就是编造剧情细节，见第 4.7 节 |
| 封面图 | ⚠️ 半自动 | 提示词可自动生成，出图后必须人工逐字核对标题拼写 |

---

## 1. 输入

每篇 blog 的输入只有两个链接：

1. **剧集详情页**：`https://shortsbinge.com/drama/{slug}-{id}/`（其他语言为 `/{lang}/drama/...`，zh-TW 和 ja 的 slug 是原文字符，链接里要用百分号编码）
2. **播放页**：`https://shortsbinge.com/drama/{slug}-{id}/episode/1/`

如果剧还没在 ShortsBinge 上线（只给了剧名），用同题材的已上线剧和合集页做内链，正文里说明"目前在哪个 App 能看"。

---

## 2. 写前搜证（不能跳过）

**原则：每一个剧情细节、人名、数字都要有出处。查不到的就不写，不能靠"同类剧通常会这样"推导。**

### 2.1 信源清单

| 信源 | 能拿到什么 |
|---|---|
| ShortsBinge 剧集页 | 集数、免费集数、简介、演员、标签、所属平台 |
| ReelShort 剧集页（reelshort.com/movie/...） | 页面 FAQ 里有总集数、从第几集开始付费、是否配音 / 是否 AI 生成 |
| ReelShort `/full-episodes/` 页 | 新剧大多每集是同一段简介，没用；老的真人剧有逐集剧情 |
| ReelShort Fandom（reelshort.fandom.com） | 角色名、人物关系、部分剧情 |
| NetShort 剧集页 | 逐集页面上有 "Ep Review" 观众评论，可以拿到具体情节 |
| IMDb | 评分、投票数（看页面里 aggregateRating 的 JSON）、导演编剧、演员表 |
| 短剧工程 duanjugongcheng.com | 中国区红果 / 抖音的榜单数据（中文剧、翻拍剧用） |
| ReelShort 演员页 | 演员在 ReelShort 全平台的作品数。⚠️ 和 ShortsBinge 片库里的数量不是一回事，不能混用 |

### 2.2 一个实用技巧：AI 动画重制版

ReelShort 有一批 AI 动画剧是早期真人剧的重制，剧情基本一致。例如：

- Djinn Under Contract（真人）→ The Great and Powerful Genie（AI）
- Runaway Single Mom, Safe in His Arms（真人）→ Runaway Single Mom and Her Billionaire Hubby（AI）

遇到 AI 剧时先查有没有真人原版，原版常常有逐集剧情和 IMDb 数据。

### 2.3 关键词核查（演员片单、平台问题类必做）

- 用 Semrush（美国库）查目标词的搜索量和 KD，打开 SERP 看前 10 都是什么站
- 不要采信"之前查不了"之类的备注，每篇自己查一次
- 演员类：先搜一下名字，确认有没有同名的其他名人；有的话，标题和首段要写明 "ReelShort actor" 之类的限定

---

## 3. 结构规范

### 3.1 字数

攻略类（观看指南、演员片单、平台问题）正文 **≥ 1,500 词**。不够就继续搜素材加厚各个 H2，**不能注水、不能用 FAQ 凑字数**。

### 3.2 H2 骨架不能雷同（最常被打回的一条）

不要每篇都套同一个模板。之前被指出过的雷同骨架：

> 速览事实表 → 人物表 → 免费集逐集编号拆解 → 角色 A → 角色 B → 标签 → 影评 → 同类剧 → FAQ

写每篇之前，先看最近 3–4 篇的骨架，至少换掉其中两项。可以换的方向：

- 按"冲突 / 关系"展开，不按人物逐个介绍
- 免费集不用编号清单，围绕 1–2 个关键场景写
- 整篇按"读者在搜的问题"或"读者类型"组织
- 挖这部剧独有的素材做板块：一句被反复引用的台词、搞笑反派、幕后团队、片名的来源或双关、真人原版的关系等

**H2 措辞也要每篇重写**，不能有跨篇复用的固定句式（比如 "10 of 63 Episodes Are Free"、"If You Want Another X" 都算模板）。

### 3.3 固定元素

| 元素 | 要求 |
|---|---|
| H1 标题 | 剧名 + 一句具体的钩子（例：`Never Regret Leaving My Scum Family: Quinn's Second Life, the Coopers, and the Family That Finally Wanted Her`） |
| Meta description | 一段，约 150 字符，写清楚剧情钩子和文章能给读者什么 |
| 表格 | **全文只用一个**表格（放哪里不固定，可以是剧集信息，也可以是两个家庭 / 两个角色的对比） |
| 列表 | 其他可枚举的内容用 `1. 2. 3.` 编号列表 |
| FAQ | 约 5 条，只放读者真会问的核心问题。问题用疑问句，答案简短 |
| 同类剧推荐 | 2–4 部，每部一段，说清楚"为什么看完这部会喜欢那部" + 集数 / 免费集数。优先分散嵌进正文相关段落，不要全堆在结尾 |

### 3.4 只交付干净版

输出一份能直接复制进编辑器发布的稿子：标题 + meta description + 正文 + FAQ。不要输出工作稿、审计日志、`<tag>` 标记、"待核实"之类的占位文字。

---

## 4. 写作规范

### 4.1 内链（站内链接）

1. **开头必须有内链**：前 1–3 段里至少一条。剧在站上就链剧集详情页；不在站上就链最贴近的合集页或同类剧
2. **必须有一条首页品牌链接**：锚文本就是 `ShortsBinge`，指向首页 `https://shortsbinge.com/`（非英文稿链对应语言首页，如 `/zh-TW/`、`/ja/`）。通常放在"去哪看"那一段
3. **每段最多一条链接**（内链外链合计）。一段里想放多个，就拆段，次要的那个只提名字不挂链接
4. **全文同一个 URL 只出现一次**
5. 正文文字链接合计约 6–10 条，不堆
6. **链接要均匀分散到各个 H2**，不能集中在文末推荐区和"去哪看"段。目标是大多数 H2 各有 0–1 条，没有哪一节超过 2 条。同类剧推荐可以直接嵌进相关情节段落（"如果这种慢慢积累的心碎打动你，X 剧……"），不必单开结尾推荐区
7. 锚文本用描述性短语，不用 "here" / "click here"

**常用内链目标：**

| 类型 | URL 格式 |
|---|---|
| 剧集详情页 | `/drama/{slug}-{id}/` |
| 第 1 集播放页 | `/drama/{slug}-{id}/episode/1/` |
| 剧情类合集 | `/browse/story-beats/{slug}/`（如 `rebirth`、`all-too-late`） |
| 身份类合集 | `/browse/identities/{slug}/` |
| blog 列表 | `/best-short-dramas/` |

### 4.2 外链（站外链接）

- 用数据（评分、票数、榜单、价格、条款）时，配一条真实可点的外链，自然嵌在句子里
- 格式必须是 `[锚文本](URL "nofollow")`。编辑器**不接受 HTML**，不要写 `<a rel="nofollow">`
- 站内链接不加 nofollow
- 链接必须真实存在，**不能编 URL**

### 4.3 写得像真人：生动、有趣、鲜活（最重要的文风要求）

文章要像一个刚追完这部剧、忍不住想跟朋友安利的人写的，不能像一篇平铺直叙的论证文或剧情说明书。

**不要这样写（论证腔）：**

> This drama works because it combines several popular elements. First, the rebirth setup creates tension. Second, the family conflict is relatable. Third, the revenge is satisfying.

**要这样写（有画面、有情绪、有态度）：**

> By the end, she was lying in the rain with Cole standing over her asking why she hadn't died instead. Not long after, she did, alone in a dark forest.
>
> Then she wakes up and gets to do it all again.

**具体做法：**

1. **用场景开头，不用概括开头。** 第一段就把读者扔进剧里最抓人的那一刻（一句台词、一个动作、一个画面），而不是"This is a drama about..."
2. **写细节，不写结论。** 不说"Chloe is manipulative"，写她怎么假装受伤、眼泪什么时候掉下来。让读者自己得出结论
3. **有自己的反应和态度。** 可以吐槽、可以替主角憋屈、可以说"这一幕是我最想快进又舍不得快进的"。像真人追剧会有的情绪，不是中立的百科腔
4. **句子长短交错。** 一串长句铺完情节后，用一个很短的句子收住（"Then she wakes up and gets to do it all again."）。节奏本身就是情绪
5. **直接对读者说话。** 适当用 you（"If you've ever wanted to see a family realize too late what they threw away..."），但不要每段都用
6. **允许一点幽默。** 狗血剧本身就有好笑的地方（反派的离谱操作、过于完美的霸总），可以轻轻调侃，但不嘲笑观众的喜好
7. **"为什么好看"也要讲故事。** 分析类段落用具体场景支撑，每个观点都落到一个画面上，不要写成 First / Second / Third 的论点清单
8. **自查方法：** 读一遍，如果某段换成任何一部同类剧都成立，说明写得太空，要换成这部剧独有的细节

生动不等于编造。所有场景、台词、细节仍然要有出处（见 4.7）。

### 4.4 不要在正文里反复提"官方"

不写 "According to the official synopsis"、"ReelShort's fandom guide says"、"官方簡介寫得很清楚" 这类话。读者会觉得是 AI 生成或复制粘贴。

- 剧情直接用叙事口吻写
- 核实照做，只是不在正文里交代"我查了哪里"
- 查不到的情节，用"这个谜底留给你自己去追"之类的话自然收住，不写"官方没有交代"

### 4.5 减少 AI 写作痕迹

1. 破折号（— / –）全文压到个位数，理想是 0
2. 不用三连排比（"No X, no Y, no Z"）
3. "That's..." 开头的句子全文不超过 2 次
4. "not X, but Y" 式的否定加肯定句全文不超过 1–2 次
5. 少用 "dive into"、"buckle up"、"a rollercoaster of emotions" 这类套话

### 4.6 不写的内容

1. 不提醒"免费集看完会跳到 DramaBox / ReelShort"。平台归属只在"去哪看"里一句话带过，不开 H2、不进 FAQ
2. 不出现盗版相关的词和链接（dailymotion、free coins、mod apk、"全集免费看"之类）
3. 不攻击平台，不写"揭露骗局"式内容

### 4.7 真实性红线（自动化最要盯的一条）

以下问题都在人工写稿时真实出现过，被用户抓出来返工：

| 错误类型 | 例子 |
|---|---|
| 编造剧情细节 | 写了查不到出处的"酒店""黑卡"情节 |
| 编造外链 | 编了一个不存在的 DramaBox 评测 URL |
| 人名拼错 | 写成 Stephen Parish / Adrian Heller，正确是 Steven Parrish / Adrian Hiller |
| 道具写错 | 正文写"鱼竿"，剧里其实是"网" |
| 推断写成事实 | "救场发生在免费集里"，实际没核实是第几集 |
| 两个数据源混用 | 把 ReelShort 演员页作品数当成 ShortsBinge 片库数 |

自动化流程里建议加一步：**让模型把正文里每一个具体情节、人名、数字列出来，逐条标注出处 URL**。标不出出处的，删掉或改写成不涉及具体细节的说法。

---

## 5. 输出格式

```markdown
# {H1 标题}

**Meta description:** {约 150 字符}

---

{正文，H2 用 ##，H3 用 ###}

## FAQ

**{问题 1}?**
{答案}

**{问题 2}?**
{答案}
```

文件名：`YYYY-MM-DD-blog稿-{剧名slug}-观看指南-可直接发布版.md`（其他语言加语言后缀，如 `-zh-TW`）。

**URL slug 建议**：英文小写、连字符分隔，去掉 the / a / of 等虚词，包含剧名主体；非英文稿用原文字符，放在对应语言路径下，如 `/zh-TW/best-short-dramas/驚絮無聲-傻女的絕殺-劇情/`。

---

## 6. 系统提示词（可直接使用）

> 把下面整段作为 system prompt，user 消息里给剧集详情页、播放页链接和搜证得到的素材。

```
你是 shortsbinge.com 的短剧 blog 编辑。shortsbinge.com 是一个可以在浏览器里免费看短剧前几集的网站。你要为一部短剧写一篇英文观看指南，读者是在 Google 上搜这部剧的美国观众。

【事实规则，最高优先级】
1. 只能使用我提供的素材里出现的情节、人名、数字。素材里没有的，一律不写。
2. 不得编造任何 URL。只使用素材里给出的链接。
3. 人名、地名、道具严格按素材拼写。
4. 不确定发生在第几集的情节，不写集数。
5. 查不到结局的，用"留给读者自己去看"的方式自然收住，不写"官方没有说明"。

【篇幅与结构】
1. 正文不少于 1,500 词。不够时加厚已有板块的分析，不重复信息，不靠 FAQ 凑字数。
2. 全文只用一个 markdown 表格；其他可枚举的内容用编号列表。
3. 不要使用固定模板。H2 按这部剧最独特的看点来组织（冲突、关系、关键场景、读者疑问等），H2 措辞要具体到这部剧，避免"Who's Who""Free Episodes"这类通用标题。
4. 不要逐集编号拆解免费集，围绕 1–2 个关键场景写。
5. FAQ 约 5 条，只放读者真会问的问题。
6. 推荐 2–4 部同类剧，每部单独一段，说明它和本剧的相似点，附集数和免费集数。优先嵌进正文相关段落，不要全堆在结尾。

【链接】
1. 前三段之内必须有一条站内链接（本剧详情页；本剧未上线则链同类剧或合集页）。
2. 正文中必须有一条锚文本为 "ShortsBinge"、指向 https://shortsbinge.com/ 的链接，一般放在"去哪看"段落。
3. 每个自然段最多一条链接；同一个 URL 全文只出现一次。
4. 链接均匀分散到各个 H2，不要集中在文末推荐区或"去哪看"段；任何一个 H2 下不超过 2 条。同类剧推荐可以嵌进相关情节段落，顺带写集数和免费集数。
5. 站外链接写成 [锚文本](URL "nofollow")，不要写 HTML。站内链接不加 nofollow。
6. 锚文本用描述性短语，不用 here / click here。

【文风】
1. 像一个刚追完这部剧、忍不住想安利给朋友的真人在写：生动、有趣、有画面、有情绪、有态度。绝不能写成平铺直叙的论证文或剧情说明书。
   - 用一个具体场景（台词、动作、画面）开头，不用 "This is a drama about..." 式概括开头。
   - 写细节，不写结论：不说"她很有心机"，写她做了什么。
   - 可以吐槽、调侃狗血情节、表达替主角憋屈或解气的情绪，但不嘲笑观众。
   - 长短句交错，用短句收住情绪。适当直接对读者说 you。
   - 分析"为什么好看"时，每个观点都落到一个具体场景上，不写 First/Second/Third 式论点清单。
   - 自查：某段话换成任何一部同类剧都成立，就太空了，换成这部剧独有的细节。
   - 生动不等于编造，所有细节仍须来自素材。
2. 不写 "according to the official synopsis"、"the fandom page says" 这类交代来源的话。
3. 破折号全文不超过 3 个；不用三连排比；"That's" 开头的句子不超过 2 次；"not X, but Y" 句式不超过 2 次。
4. 不提醒读者"看完免费集会跳转到某个 App"；平台只在"去哪看"里一句带过。
5. 不出现盗版、免费金币、mod apk 等内容。

【输出】
只输出可直接发布的稿子：H1 标题、Meta description（约 150 字符）、分隔线、正文、FAQ。不要输出任何说明、备注或待办。

写完正文后，另起一节"出处核对表"（这一节不发布），把正文中每一个具体情节、人名、数字列出来，标注对应的素材出处。
```

---

## 7. 自检脚本

交稿前跑一遍，任何一项不达标就打回：

```python
import re, sys

f = sys.argv[1]
s = open(f, encoding='utf-8').read()
body = s.split('---', 1)[1] if '---' in s else s
paras = [p for p in body.split('\n\n') if p.strip()]
urls = re.findall(r'\]\(([^)\s]+)', body)
plain = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', body)
cjk = len(re.findall(r'[\u3040-\u30ff\u4e00-\u9fff]', plain))  # 中日文按字符计
words = len(plain.split())

checks = {
    '词数 ≥1500（中日文稿不判）': cjk > 500 or words >= 1500,
    '开头三段有内链': any('shortsbinge.com' in p for p in paras[:3]),
    '有首页品牌链接': bool(re.search(r'\[ShortsBinge\]\(https://shortsbinge\.com/([a-zA-Z-]+/)?\)', body)),
    '无重复 URL': len(urls) == len(set(urls)),
    '每个 H2 ≤2 条链接': all(len(re.findall(r'\]\(', sec)) <= 2 for sec in re.split(r'\n(?=## )', body)),
    '每段 ≤1 条链接': all(len(re.findall(r'\]\(', p)) <= 1 for p in paras),
    '外链都带 nofollow': all('"nofollow"' in m for m in re.findall(r'\]\((https?://(?!shortsbinge\.com)[^)]+)\)', body)),
    '表格只有 1 个': len(re.findall(r'^\|[-| :]+\|$', body, re.M)) <= 1,
    '破折号 ≤3': body.count('—') + body.count('–') <= 3,
    "That's ≤2": len(re.findall(r"\bThat's", body)) <= 2,
    '没提 official/according to': not re.search(r'(?i)\bofficial (synopsis|description)|according to', body),
    '无 HTML 标签': not re.search(r'<a |<div|<span', body),
}
print('英文词数', words, '| 中日文字符', cjk, '| 链接', len(urls))
for k, v in checks.items():
    print('✅' if v else '❌', k)
```

用法：`python3 check.py 稿件.md`

说明：1,500 词门槛只针对英文等拼音文字稿。中日文稿的字数门槛还没定，脚本只报字符数，不判达标与否。

---

## 8. 封面提示词

每篇 blog 配一张封面，用 GPT 生图。完整规范见 `03-content-briefs/shortsbinge-blog封面提示词库.md`，这里只列要点。

**规格**：最终 1600 × 900 webp。GPT 出 1536 × 1024，从**顶部**裁掉 160px，再放大到 1600 × 900。

**画风**：写实数字绘画（电影剧照感），偏暗的黄昏 / 夜景，蓝紫为主，局部暖光；底部暗色渐变，文字压在上面。

**文字**：大标题（剧名，白色粗体全大写无衬线）+ 可选一行 ≤6 词的小字钩子。

**通用模板**（替换【】）：

```
A wide landscape (3:2) cinematic digital painting in the style of a streaming drama's key art: photorealistic but painterly, with moody dusk lighting in deep blue and violet tones and a few warm accent lights. 【主体：人物、动作、神情】. 【场景与背景】. 【点题的道具或意象】. Use a shallow depth of field and soft rim light on the characters.

Composition: the top 15% of the image contains only background such as sky or ceiling, with no heads or important objects, because it will be cropped off. Place the characters in the middle band of the frame. The bottom third fades into a dark gradient.

Text: centered in the lower part of the image, over the dark gradient, with clear space below it so it does not touch the bottom edge. The main title reads "【大标题】" in large, bold, white, all-caps geometric sans-serif letters, spelled exactly as written. Directly beneath it, a smaller line reads "【小字】" in the same font at about one third of the size, in soft white. The text is crisp, evenly spaced and easy to read. Apart from this text, there are no other letters, numbers, logos, app icons or watermarks anywhere in the image.
```

**规则**：

1. 不画真实演员的长相，提示词里不写演员名字
2. 不出现 ReelShort / DramaBox 的名字、Logo、配色，不照抄官方海报构图
3. 成人向题材只靠距离、眼神、光影暗示，不出现裸露或亲密动作
4. 人物的发型、年龄、服装、场景要和正文一致
5. 动画剧也用写实画风，保持列表页统一
6. 出图后逐个字母核对标题；繁体中文要逐字核对有没有被写成简体。反复写错就去掉 Text 段出无字图，后期加字

---

## 9. 其他语言版本的补充

- 正文用目标语言重写，不是逐句翻译；人名用该语言版本剧集页上的写法
- 内链指向该语言路径（`/{lang}/drama/...`），首页品牌链接指向 `/{lang}/`
- 不在正文里提"官方"的规则同样适用
- 日语稿发布前建议找母语者过一遍
