# Aura Cluster SEO 优化修改清单
> 文件用途：执行参考，按优先级逐页修改
> 整理日期：2026-06-07 | 审计更新：2026-06-08（基于页面实际抓取校验）
> 涉及页面：8篇（1篇 Pillar + 7篇 Series）

---

## ✅ 执行记录 2026-06-09（已 live on www.astrologywiki.com）

**已完成并验证上线：**
- **3 个模板级 Bug（系统性，全站 featured 文章受益，非仅 8 页）**
  - H1 重复：真因是静态 stub 生成器同时渲染 `<h1>{title}</h1>` + 正文 `# Title`（非 CMS 模板）。已在 `generate-seo-pages.mjs` 修复，全 8 页实测 `h1=1`。
  - footer "Open the interactive wiki" 自链：CTA 改指 `/en/wiki` hub，自链=0。
- **FAQ Schema**：静态 stub 现输出 FAQPage JSON-LD（此前仅 SPA 有），全 8 页实测有 schema。
- **8 页内容补丁**：自链修复、补 FAQ（统一命名 `Common Questions About X Aura`）、补 How-to-Read/Common-Misreadings、Related Reading 去重+横向兄弟链（零死链）、Sources 升级完整书目、标题优化（title+H1 同步）、white 扩写至 ~2328 词。

**清单中 3 处与实际不符（已纠正，未误改）：**
- **Blue**：.ts 内无清单所述"Pew 数据/文化溯源"两特色章节（清单审计的是旧版本），按全新添加 FAQ/Sources 处理。
- **Orange**：清单称"唯一无 chakra 链"有误——实际已有 sacral chakra 链，未重复添加。
- **indigo/violet 页不存在** → purple 对比链转纯文字，未硬链死 slug。

**QA（codex）额外软化 6 处**：white/purple 中把不可验证 aura 设定写成确定事实之处（含 1 条健康信号 FAQ）→ 改为"框架内描述"，健康 FAQ 明确声明不可用于健康判断（贴合本站不算命定位）。

**未做（待决策/资源）：**
- **图片（全 8 页）**：缺图像生成 API key，待提供后用 baoyu 生成并 wire（文章已支持 image/alt 字段）。
- **Pillar URL 改名 + 301**：本轮缓做（除非该页 SEO 积累≈0 否则不优先）。
- **H3 层级**：故意跳过（集群统一无 H3、用粗体伪小标题，保持风格一致）。
- **Schema "Article Schema"**：原本就已存在（stub+SPA 均有），仅 FAQ 缺失，已补。

---

## 模板级 Bug（开发统一修复，不逐页处理）

> 以下问题由 CMS 模板引起，需技术同事一次性批量修复，优先于所有内容改动。

| Bug | 影响页面 | 说明 |
|-----|---------|------|
| H1 标签重复出现两次 | 全部8页 | CMS 在 HTML heading 层和正文内容区各渲染一次 H1，Google 判断页面主题置信度下降 |
| "Open the interactive wiki" 指向页面自身 | orange、white、green（footer） | footer CTA 的 href 未替换，形成自链 |

---

## 整体问题（所有页面共同存在）

| 问题 | 优先级 | 说明 |
|------|--------|------|
| 所有页面无图片 | 高 | 灵性/视觉类内容，竞品普遍有配图，无图是明显劣势 |
| 所有页面无 H3 标题 | 中 | 内容全部是 H2 平铺，缺乏层次感，影响可读性和爬取结构 |
| 所有页面无 Schema Markup | 中 | 缺少 Article Schema 和 FAQ Schema，无法获得富摘要 |
| Green / Orange 已有 FAQ + Sources，其他5篇缺失 | 高 | 结构不统一，缺失页面需补齐 |
| 5个页面的 Related Reading 重复链接 pillar 两次 | 高 | green、white、purple、blue、yellow 均在 Related Reading 列了两条指向 pillar 的链接，占用了可分发给其他颜色页的内链位置 |
| FAQ 命名存在3种叫法 | 中 | green 用"Common Questions About Green Aura"，orange 用"Orange Aura FAQ"，清单新增页拟用"Frequently Asked Questions"。建议统一为"Common Questions About [Color] Aura" |
| 表格章节命名不统一 | 低 | green/orange 用"[Color] Aura at a Glance"，其余5页用"Quick Reference Table"，建议统一 |
| H2 大小写风格不统一 | 低 | 集群内混用句首大写和标题大写，pillar 页最明显 |

---

## 各页面修改清单

---

### 1. aura-colors-pillar → aura-colors-guide（Pillar 页）

**当前状态**（已校验）
- 字数：约 3,200–3,400 词 ✓
- H1：Aura Colors Meaning（出现2次，模板 bug）
- H2：9个，但大小写风格混用
- 内链：11条，已链接全部7个颜色子页 + chakra + four-element-framework + aura-reading
- 缺失：无 FAQ，无 Sources，无图片，无 H3

**修改项**

#### 修改0：URL 变更 + 301 跳转（优先级：紧急，需开发，最先执行）

**背景：** 当前 URL `/en/wiki/aura-colors-pillar` 中"pillar"是内部内容架构术语，不是用户搜索词，对 SEO 无贡献。新 URL `/en/wiki/aura-colors-guide` 更贴近用户搜索意图。

**执行步骤（开发操作）：**
1. 在 CMS 中将页面 slug 从 `aura-colors-pillar` 改为 `aura-colors-guide`
2. 在服务器/CMS 路由配置中添加 301 永久重定向：
   ```
   /en/wiki/aura-colors-pillar  →  /en/wiki/aura-colors-guide  [301]
   ```
3. 确认旧 URL 访问后浏览器地址栏跳转到新 URL（状态码 301，非 302）

**执行完成后，内容同事需要同步更新：**
- 集群内所有7个 series 页中指向 `/en/wiki/aura-colors-pillar` 的内链，全部改为 `/en/wiki/aura-colors-guide`
- 本清单中涉及 pillar URL 的所有描述，同步替换

**注意：**
- 301 跳转必须在 URL 变更的同一时间上线，不能有窗口期（即哪怕几分钟的 404）
- 如果该页已提交过 Google Search Console 的 URL 检查，变更后重新提交新 URL 请求收录
- 不要使用 302（临时跳转），302 不传递链接权重

#### 修改1：修复自链 Bug（优先级：紧急）
- Related Reading 中"guide to aura reading"当前指向 `/en/wiki/aura-colors-pillar`（自链）
- 应改为：`/en/wiki/aura-reading`
- Take Action 中"aura reading guide"已正确指向 `/en/wiki/aura-reading` ✓，不需动

#### 修改2：统一 H2 大小写（优先级：低）
当前三种风格混用，建议全部改为句首大写（Sentence case）：
- "The aura colors at a Glance" → "The aura colors at a glance"
- "Why It Matters for Self-Awareness" → "Why it matters for self-awareness"
- 以此类推

#### 修改3：标题优化（优先级：中）
- 当前：`Aura Colors Meaning`
- 建议改为：`Aura Colors: A Complete Guide to Reading Every Color and Shade`
- 原因：现标题过于简单，缺乏点击钩子；新标题保留关键词的同时增加价值主张

#### 修改4：新增 FAQ 模块（优先级：高）
在"Related Reading"之前插入：

```
## Common Questions About Aura Colors

**Q: How many aura colors are there?**
A: Most traditions identify 7 primary aura colors (red, orange, yellow, green, blue, purple, white),
each corresponding to a chakra center. Shades and combinations within these colors further refine the reading.

**Q: Can your aura color change?**
A: Yes. Aura colors shift with emotional states, health, and energy levels.
A reading reflects a moment in time, not a fixed identity.

**Q: Why do different readers see different colors for the same person?**
A: Readers come from different traditions and perceptual frameworks.
This guide uses a structural, cross-tradition approach to reduce that confusion.

**Q: Do I need special ability to read auras?**
A: Basic aura awareness is a trainable skill.
See our [aura reading guide](/en/wiki/aura-reading) for a step-by-step methodology.
```

#### 修改5：新增 Sources 模块（优先级：中）
在页面最底部添加：

```
## Sources
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
- Hunt, V. (1996). *Infinite Mind: Science of the Human Vibrations of Consciousness*. Malibu Publishing.
- Motoyama, H. (1982). *Theories of the Chakras*. Quest Books.
```

#### 修改6：添加图片（优先级：高）
- 位置："The 7 aura colors: Quick Guide"章节内
- 图片类型：7种颜色的对比色块图，每色附文字标注（颜色名 + 对应脉轮）
- Alt text：`aura colors chart showing red orange yellow green blue purple and white energy fields`

---

### 2. purple-aura-meaning

**当前状态**（已校验）
- 字数：约 2,100–2,300 词（比原清单估计高，属好事）
- H1：Purple Aura Meaning（出现2次，模板 bug）
- H2：7个，缺 How to Read、Common Misreadings
- 内链：9条，但质量极差（见下）
- 缺失：无 FAQ，无 Sources，无图片

**内链现状（9条中有7条存在问题）：**
- 自链 ×2：violet/indigo 对比段均指向 `/en/wiki/purple-aura-meaning`（错误）
- 指向 pillar ×3："pillar page on all aura colors" + "guide to aura color shades" + "aura colors guide"（冗余）
- 指向 chakra ×2：crown 和 third eye 两条链接目标相同 `/en/wiki/chakra-system-overview`（冗余）
- 有效横向链接：blue ✓、white ✓（仅2条）
- 未链接颜色：red、orange、yellow、green

**修改项**

#### 修改1：修复自链 Bug（优先级：紧急）
- 找到 violet 对比段落链接 → 当前指向 `/en/wiki/purple-aura-meaning`
  - 若 `/en/wiki/violet-aura-meaning` 存在：改为该链接
  - 若不存在：删除链接，改为纯文字
- 找到 indigo 对比段落链接 → 当前指向 `/en/wiki/purple-aura-meaning`
  - 若 `/en/wiki/indigo-aura-meaning` 存在：改为该链接
  - 若不存在：删除链接，改为纯文字

#### 修改2：清理冗余内链，补充横向链接（优先级：高）
Related Reading 区当前3条 pillar 链接、2条 chakra 链接均为冗余。建议：
- **保留**：pillar 1条（"pillar page on all aura colors"）、chakra 1条（保留 crown，删除 third eye 重复）
- **腾出的2个位置替换为**：
  - → `/en/wiki/red-aura-meaning`（red 作为根脉轮对比）
  - → `/en/wiki/green-aura-meaning`（green 作为心轮愈合能量对比）

#### 修改3：标题优化（优先级：中）
- 当前：`Purple Aura Meaning`
- 建议改为：`Purple Aura Meaning: Gifts, Intuition, and the Psychic Frequency`

#### 修改4：新增"How to Read Purple Aura in Yourself"章节（优先级：高）
在"Quick Reference Table"之前插入，参考 green/orange 结构：

```
## How to Read Purple Aura in Yourself

Purple aura tends to manifest as a perceptual or relational signal before becoming visual.

Three self-check indicators:
1. **Pattern sensitivity**: Do you notice symbolic or thematic connections others miss?
2. **Energetic boundary awareness**: Do you absorb the emotional states of people around you
   without choosing to?
3. **Internal orientation**: Is your default processing mode inward — through reflection and
   meaning-making — rather than outward action?

If two or more apply consistently, purple is likely an active frequency in your current field.
```

#### 修改5：新增"Common Misreadings"章节（优先级：高）
在"How to Read"之后插入：

```
## Common Misreadings

**Misread 1: Purple always means psychic ability**
Purple is commonly conflated with psychic gifts, but it more accurately describes a perceptual
orientation — the tendency to process experience through meaning and pattern. Active psychic
development may produce purple, but purple does not require it.

**Misread 2: Purple and indigo are the same**
Indigo sits at a more focused frequency — it maps to the third eye center and emphasizes
vision and perception. Purple spans the upper two centers (third eye and crown) and includes
both perceptual and transcendent qualities.

**Misread 3: Purple aura means spiritual advancement**
Aura readings describe current energetic state, not hierarchy. A purple reading reflects a
current orientation — not a rank, achievement, or fixed identity.
```

#### 修改6：新增 FAQ 模块（优先级：高）
在"Related Reading"前插入：

```
## Common Questions About Purple Aura

**Q: Is purple aura the same as indigo or violet?**
A: They are related but distinct. Purple sits between blue and red and signals spiritual awareness
combined with grounded energy. Indigo is deeper and more psychic-focused.
Violet leans toward transcendence and transformation.

**Q: Is a purple aura rare?**
A: Purple auras are less common than green or yellow.
They tend to appear in people with strong intuitive development or active spiritual practice.

**Q: What does a dark purple aura mean vs. light purple?**
A: Light purple suggests emerging spiritual gifts and openness.
Dark purple indicates deep attunement — often seen in experienced practitioners or mediums.

**Q: Can someone have both purple and another color in their aura?**
A: Yes. Aura combinations are common. Purple combined with blue often indicates a
highly intuitive communicator; purple with white suggests spiritual purification.
```

#### 修改7：新增 Sources 模块（优先级：中）

```
## Sources
- Andrews, T. (1991). *How to See and Read the Aura*. Llewellyn Publications.
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
```

#### 修改8：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：紫色光晕/能量场视觉图
- Alt text：`purple aura meaning energy field around human silhouette`

---

### 3. white-aura-meaning

**当前状态**（已校验）
- 字数：约 1,850 词（注意：比原清单估计的 2,100–2,300 低，是集群中最短的 series 页）
- H1：White Aura Meaning（出现2次，模板 bug）
- H2：7个，缺 How to Read、Common Misreadings
- 内链：7条，pillar 重复3次，且 footer 有自链；**正文主体无上下文内链**
- 缺失：无 FAQ，无 Sources，无图片，无横向颜色交叉链接

**内链现状：**
- pillar ×3："pillar page on aura colors overview"（Related Reading）+ "overview of aura color shades"（Related Reading）+ "aura colors guide"（Take Action）
- purple ✓、blue ✓、chakra ✓（各1条，均在 Related Reading）
- 自链1条：footer "Open the interactive wiki" → `/en/wiki/white-aura-meaning`
- 未链接颜色：red、orange、yellow、green
- 正文内部无任何上下文内链

**修改项**

#### 修改1：修复 footer 自链（优先级：紧急）
- 找到 footer "Open the interactive wiki" 链接
- 当前指向：`/en/wiki/white-aura-meaning`（自链）
- 处理方式：删除该链接，或改为指向 `/en/wiki/aura-reading` 等相关工具页

#### 修改2：扩充正文内容（优先级：高）
- 白色页面当前字数约 1,850 词，是 series 中最短的页面
- 在补充结构性章节（修改3、4）的同时，每个现有 H2 段落也需要适度扩写，目标字数 2,200+ 词

#### 修改3：新增"How to Read White Aura in Yourself"章节（优先级：高）
在"Quick Reference Table"之前插入：

```
## How to Read White Aura in Yourself

White aura often appears during transitional states — it can be easy to misread as "nothing"
or "unclear" when it is in fact a high-frequency, integrative signal.

Three self-check indicators:
1. **Transitional awareness**: Are you in a significant life shift — ending one chapter,
   beginning another — where your previous self-definition feels less stable?
2. **Psychic sensitivity**: Do you absorb environmental energy rapidly, sometimes feeling
   drained in crowds or overstimulated in dense emotional spaces?
3. **Purification cycles**: Have you recently completed an intensive clearing process —
   grief work, meditation retreat, significant healing — and feel unusually open or undefined?

If two or more apply, white may be the dominant frequency in your current field.
```

#### 修改4：新增"Common Misreadings"章节（优先级：高）

```
## Common Misreadings

**Misread 1: White aura means spiritual purity or perfection**
This is the most common misread. White signals high-frequency integration, not moral achievement.
It frequently appears in people going through significant transitions, not people who "have it all figured out."

**Misread 2: White is the highest or best aura color**
Chakra hierarchies have led many frameworks to rank colors. White is not superior — it represents
a specific energetic state (integration, clearing, transition) that is neither better nor worse than red or green.

**Misread 3: White aura is permanent**
White auras are among the most transitional. They often shift as a person moves through a life stage.
Reading white as a fixed identity rather than a current state leads to misapplication.
```

#### 修改5：补充内链（优先级：高）
- Related Reading 中保留 pillar 1条（删除重复的第2条），腾出位置替换为：
  - → `/en/wiki/yellow-aura-meaning`（yellow 作为活跃能量对比）
  - → `/en/wiki/green-aura-meaning`（green 作为心轮愈合对比）
- 在正文"Adjacent Concepts"段落，为对比的颜色加上内链（当前该段落无链接）

#### 修改6：新增 FAQ 模块（优先级：高）

```
## Common Questions About White Aura

**Q: Why does my aura look white if my life doesn't match the description?**
A: White aura is one of the most commonly misread colors.
It can indicate a transitional state, protective energy, or psychic sensitivity —
not necessarily the idealized purity often described online.

**Q: Is white the rarest aura color?**
A: White is uncommon but not the rarest. It often appears temporarily during spiritual transitions,
deep meditation states, or after significant personal clearing work.

**Q: What's the difference between a white aura and a silver aura?**
A: White signals high-frequency, broad-spectrum energy.
Silver is often associated with lunar sensitivity and psychic receptivity — a more refined,
specific signal within the same high-vibration range.

**Q: Can a white aura indicate health issues?**
A: Some practitioners note that white can appear when the energy field is in flux —
after illness, major life change, or intensive healing.
It is not itself a negative signal, but warrants attention to overall well-being.
```

#### 修改7：新增 Sources 模块（优先级：中）

```
## Sources
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
- Andrews, T. (1991). *How to See and Read the Aura*. Llewellyn Publications.
```

#### 修改8：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：白色或银白色光晕视觉图
- Alt text：`white aura meaning pure energy field surrounding human figure`

---

### 4. green-aura-meaning ✓（集群标杆，改动最少）

**当前状态**（已校验）
- 字数：约 1,850–1,950 词
- H1：What a Green Aura Really Means for Healing and Connection ✓
- H2：11个，结构最完整 ✓
- 内链：7条内链 + 1条外链（Wikipedia）；但 pillar 重复3次；footer 有自链
- 已有：FAQ（"Common Questions About Green Aura"）✓，Sources ✓
- 缺失：无图片；Sources 格式较弱

**内链现状：**
- pillar ×3："pillar page on all aura colors"（正文）+ "guide to reading aura color shades"（Related Reading）+ "explainer on how aura colors shift over time"（Related Reading，anchor text 与 pillar 内容不符）
- yellow ✓（Adjacent Concepts 段落）
- blue ✓（Adjacent Concepts 段落）
- chakra ✓（How to Read 段落）
- 自链1条：footer "Open the interactive wiki" → `/en/wiki/green-aura-meaning`
- 未链接颜色：red、orange、purple、white

**修改项**

#### 修改1：修复 footer 自链（优先级：紧急）
- 找到 footer "Open the interactive wiki" 链接，当前指向自身
- 处理：删除该链接或改为相关工具页

#### 修改2：清理 Related Reading 冗余内链，补充横向链接（优先级：高）
- 删除 Related Reading 中2条重复 pillar 链接（保留正文中那1条）
- 用腾出的2个位置替换为：
  - → `/en/wiki/red-aura-meaning`（red 作为根脉轮对比）
  - → `/en/wiki/orange-aura-meaning`（orange 作为创造力能量对比）

#### 修改3：升级 Sources 格式（优先级：中）
当前 Sources 仅列作者名，缺少书名和年份，说服力弱。请更新为完整格式：

```
## Sources
- Judith, A. (1999). *Wheels of Life*. Llewellyn Publications.
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
```

#### 修改4：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：绿色光晕视觉图，心轮颜色
- Alt text：`green aura meaning heart chakra healing energy field`

---

### 5. orange-aura-meaning

**当前状态**（已校验）
- 字数：约 2,100–2,300 词（集群 series 页中最高）
- H1：Why an Orange Aura Reads as Drive, Pleasure, and Connection ✓
- H2：11个，结构完整 ✓
- 内链：5条；**唯一没有 chakra 链接的 series 页**；footer 有自链
- 已有：FAQ（"Orange Aura FAQ"）✓，Sources ✓
- 缺失：无图片；Sources 格式较弱

**内链现状：**
- pillar ×2："pillar page on all aura colors"（正文）+ "aura colors guide"（Take Action）✓ 可接受
- red ✓、yellow ✓
- **无 chakra 链接**（所有其他 series 页均有）
- 自链1条：footer "Open the interactive wiki" → `/en/wiki/orange-aura-meaning`
- 未链接颜色：green、blue、white、purple

**修改项**

#### 修改1：修复 footer 自链（优先级：紧急）
- 找到 footer "Open the interactive wiki"，当前指向自身
- 处理：删除该链接或改为相关工具页

#### 修改2：补充 chakra 内链（优先级：高）
- 在正文提及骶轮（Svadhisthana/sacral chakra）的位置，添加：
  - → `/en/wiki/chakra-system-overview`，anchor text 建议："sacral chakra explainer"

#### 修改3：升级 Sources 格式（优先级：中）
当前仅列作者名，更新为：

```
## Sources
- Judith, A. (1999). *Wheels of Life*. Llewellyn Publications.
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
```

#### 修改4：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：橙色能量光晕视觉图，骶轮颜色
- Alt text：`orange aura meaning sacral chakra vitality energy field`

---

### 6. red-aura-meaning

**当前状态**（已校验）
- 字数：约 1,850–1,900 词
- H1：Red Aura Meaning（出现2次，模板 bug）
- H2：7个，缺 How to Read、Common Misreadings
- 内链：6条，**全部集中在 Related Reading 和 Take Action，正文主体无上下文内链**
- 缺失：无 FAQ，无 Sources，无图片，无"How to Read"，无"Common Misreadings"

**内链现状：**
- pillar ×2（Related Reading + Take Action）✓ 可接受
- orange ✓、yellow ✓、chakra ✓、purple ✓（均在 Related Reading）
- 未链接颜色：green、blue、white
- **所有链接堆在 Related Reading，正文无内链**

**修改项**

#### 修改1：正文补充上下文内链（优先级：高）
在正文 Adjacent Concepts 段落中，为对比颜色加链接：
- 提及 orange 时链向 `/en/wiki/orange-aura-meaning` ✓（若正文已提及）
- 新增对 green 的提及并链向 `/en/wiki/green-aura-meaning`

#### 修改2：标题优化（优先级：中）
- 当前：`Red Aura Meaning`
- 建议改为：`Red Aura Meaning: What Your Root Energy Actually Signals`

#### 修改3：新增"How to Read Red Aura in Yourself"章节（优先级：高）
在"Quick Reference Table"之前插入：

```
## How to Read Red Aura in Yourself

Red aura is one of the easiest to sense physically — it tends to manifest as heat,
urgency, or heightened physical awareness before it becomes a visual signal.

Three self-check indicators:
1. **Sustained physical energy**: Do you find yourself with drive that outlasts those around you?
2. **Instinctive reactions**: Do you respond to threats or challenges physically before emotionally?
3. **Territorial awareness**: Are you acutely aware of space, boundaries, and physical security?

If two or more apply consistently, red is likely an active frequency in your current field.
```

#### 修改4：新增"Common Misreadings"章节（优先级：高）

```
## Common Misreadings

**Misread 1: Red always means anger**
Red aura is frequently conflated with anger or aggression, but this is the exception, not the rule.
Anger is one expression of red — survival drive, physical vitality, and groundedness are equally valid signals.

**Misread 2: Muddy red = bad person**
A murky red tone indicates suppressed energy or unprocessed stress, not moral failure.
It's a signal to check physical health and stress load, not a character judgment.

**Misread 3: Red is less evolved than purple**
Chakra hierarchies have led many to assume lower-spectrum colors are less desirable.
Red is foundational — without it, upper-chakra energy has no ground to land on.
```

#### 修改5：新增 FAQ 模块（优先级：高）

```
## Common Questions About Red Aura

**Q: Is a red aura always associated with anger?**
A: No. Red primarily signals life force, physical vitality, and root stability.
Anger is one possible expression, but it represents a disrupted or blocked red — not red itself.

**Q: What does a bright red vs. dark red aura mean?**
A: Bright red indicates high energy, courage, and active engagement with the physical world.
Dark or murky red suggests suppressed drive, burnout, or unresolved stress.

**Q: Is red aura connected to any specific chakra?**
A: Yes — red corresponds to the Root Chakra (Muladhara), located at the base of the spine.
It governs safety, survival, and physical groundedness.

**Q: Can a red aura shift to another color?**
A: Yes. Aura colors shift with energy states.
Red can brighten to orange when creative energy activates, or deepen to burgundy during periods of withdrawal and recovery.
```

#### 修改6：新增 Sources 模块（优先级：中）

```
## Sources
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
- Judith, A. (1999). *Wheels of Life*. Llewellyn Publications.
```

#### 修改7：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：红色能量光晕视觉图，根脉轮颜色
- Alt text：`red aura meaning root chakra energy field and life force`

---

### 7. blue-aura-meaning（本集群最高优先级页面）

**当前状态**（已校验）
- 字数：约 2,100–2,300 词（比原清单估计高，内容较充分）
- H1：Blue Aura Meaning（出现2次，模板 bug）
- H2：9个，**有其他页面均不具备的两个独特章节**（见下）
- 搜索量：8,000/月（集群第二高）
- 内链：6条；pillar 重复3次；**正文主体无上下文内链**
- Sources：无专属 Sources 区，引用内嵌在正文中（格式与集群其他页不一致）
- 缺失：无"How to Read"，无"Common Misreadings"，无 FAQ，无正式 Sources，无图片

**Blue 特有的内容优势（执行时注意保留）：**
- "How Common Is Belief in Subtle Energy?" — 引用 Pew Research 数据，建立内容可信度
- "Where the Blue Reading Comes From: A Short Cultural History" — 文化溯源内容，差异化竞争优势
- 以上两个章节为 blue 页独有，添加新章节时不要削减这两段

**内链现状：**
- pillar ×3："pillar page on all aura colors overview"（Related Reading）+ "explainer on aura color shades"（Related Reading）+ "aura colors guide"（Take Action）
- purple ✓、yellow ✓、chakra ✓（均在 Related Reading）
- 未链接颜色：green、red、orange、white（4个缺失）
- 正文内讨论 indigo、violet、green、red 时均无链接

**修改项**

#### 修改1：标题优化（优先级：高）
- 当前：`Blue Aura Meaning`
- 建议改为：`Blue Aura Meaning: Why Interpretations Vary — and What's Actually True`
- 原因：直接命中该词最高频的用户困惑（"我查到的结果都不一样"）

#### 修改2：清理 Related Reading 冗余内链，补充横向链接（优先级：高）
- 删除 Related Reading 中2条重复 pillar 链接（保留1条）
- 腾出的2个位置替换为：
  - → `/en/wiki/white-aura-meaning`（high-frequency 颜色对比）
  - → `/en/wiki/green-aura-meaning`（heart chakra 对比）

#### 修改3：正文补充上下文内链（优先级：高）
正文 Adjacent Concepts 段落提及 indigo、violet 时：
- 若 `/en/wiki/indigo-aura-meaning` 存在：添加链接
- 若不存在：删除相关链接锚点，改为纯文字

#### 修改4：新增"How to Read Blue Aura in Yourself"章节（优先级：高）
在"Quick Reference Table"之前插入：

```
## How to Read Blue Aura in Yourself

Blue aura tends to manifest as a communication or perceptual signal before becoming a visual one.

Three self-check indicators:
1. **Communication as core need**: Do you feel visibly drained when you cannot express yourself authentically?
2. **Intuitive listening**: Do you often sense what someone means before they finish speaking?
3. **Sensitivity to dishonesty**: Does a conversation that lacks authenticity feel physically uncomfortable?

If these patterns are consistent, blue is likely an active frequency in your current field.
```

#### 修改5：新增"Common Misreadings"章节（优先级：高）

```
## Common Misreadings

**Misread 1: All blue auras mean the same thing**
This is the root cause of conflicting search results. "Blue aura" covers a wide spectrum —
light blue signals gentle, receptive communication; dark blue indicates deep introspection
and internal processing; indigo is a distinct adjacent frequency with stronger psychic overtones.

**Misread 2: Blue and indigo are interchangeable**
They are related but structurally different. Blue governs the throat center (communication, expression).
Indigo governs the third eye center (perception, vision). A reader calling blue "indigo"
is reading a different layer of the same signal.

**Misread 3: Blue means calm, always**
Blue can manifest as emotional depth that looks like calm from the outside but is internally
highly active. What reads as "calm" may be sustained internal processing.
```

#### 修改6：新增 FAQ 模块（优先级：高）

```
## Common Questions About Blue Aura

**Q: Why do different sources say different things about blue aura meaning?**
A: Blue aura spans multiple shades with distinct interpretations.
Light blue, dark blue, and indigo are often grouped together but carry different signals.
Additionally, different traditions (Theosophical, New Age, chakra-based) use different frameworks.
This guide uses the chakra-based structural approach, anchored to the throat center.

**Q: What's the difference between a light blue and dark blue aura?**
A: Light blue indicates openness, receptive communication, and emotional gentleness.
Dark blue signals introspection, strong internal processing, and a preference for depth over surface.

**Q: Is blue aura the same as indigo?**
A: No. Blue corresponds to the Throat Chakra — the center of expression and communication.
Indigo corresponds to the Third Eye Chakra — the center of perception and psychic awareness.
They sit in adjacent frequencies but govern distinct functions.

**Q: What does a blue aura say about someone's communication style?**
A: Blue aura individuals tend to be careful, authentic communicators who are more comfortable
with meaningful exchange than small talk. They often have high sensitivity to dishonesty in conversation.

**Q: Can someone with a blue aura also have other colors?**
A: Yes. Blue combined with green often indicates an empathic healer-communicator.
Blue with purple suggests heightened intuitive perception layered over strong expressive drive.
```

#### 修改7：新增正式 Sources 模块（优先级：中）
将正文内嵌引用整理为独立 Sources 章节：

```
## Sources
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
- Andrews, T. (1991). *How to See and Read the Aura*. Llewellyn Publications.
- Judith, A. (2004). *Eastern Body, Western Mind*. Celestial Arts.
```

#### 修改8：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：蓝色能量光晕视觉图，喉轮颜色
- Alt text：`blue aura meaning throat chakra communication energy field`

---

### 8. yellow-aura-meaning

**当前状态**（已校验）
- 字数：约 2,100 词（比原清单估计高）
- H1：Yellow Aura Meaning（出现2次，模板 bug）
- H2：7个，缺 How to Read、Common Misreadings
- 搜索量：7,400/月（集群第三高）
- 内链：6条，pillar 重复3次；正文主体无上下文内链
- 缺失：无"How to Read"，无"Common Misreadings"，无 FAQ，无 Sources，无图片

**内链现状：**
- pillar ×3："pillar page on aura colors overview"（Related Reading）+ "overview of aura color shades"（Related Reading）+ "aura colors guide"（Take Action）
- blue ✓、orange ✓、chakra ✓（均在 Related Reading）
- 未链接颜色：red、green、purple、white（4个缺失）

**修改项**

#### 修改1：清理 Related Reading 冗余内链，补充横向链接（优先级：高）
- 删除 Related Reading 中2条重复 pillar 链接（保留1条）
- 腾出的2个位置替换为：
  - → `/en/wiki/green-aura-meaning`（solar/heart 两个脉轮对比）
  - → `/en/wiki/red-aura-meaning`（根脉轮 vs 太阳丛能量对比）

#### 修改2：标题优化（优先级：中）
- 当前：`Yellow Aura Meaning`
- 建议改为：`Yellow Aura Meaning: Optimism, Creative Drive, and Solar Energy Explained`

#### 修改3：新增"How to Read Yellow Aura in Yourself"章节（优先级：高）
在"Quick Reference Table"之前插入：

```
## How to Read Yellow Aura in Yourself

Yellow aura often reveals itself through a person's relationship with creative energy and self-confidence.

Three self-check indicators:
1. **Idea generation**: Do ideas and connections come to you rapidly,
   sometimes faster than you can act on them?
2. **Social radiance**: Do people frequently describe you as energizing or uplifting to be around?
3. **Confidence cycles**: Is your confidence tied to intellectual or creative output —
   high when you're making things, lower when you're not?

If two or more apply consistently, yellow is likely a dominant frequency in your current field.
```

#### 修改4：新增"Common Misreadings"章节（优先级：高）

```
## Common Misreadings

**Misread 1: Yellow always means happy**
Yellow signals active solar energy — intellectual drive, creative output, confidence.
Happiness may accompany it, but a yellow aura in an anxious or overloaded person will read
as scattered or erratic, not calm joy.

**Misread 2: Pale yellow means weak**
Pale or soft yellow often indicates emerging gifts — particularly in people developing
their intellectual or creative voice. It is potential, not deficiency.

**Misread 3: Yellow is a "beginner" color**
Chakra frameworks have sometimes implied lower-spectrum colors are less evolved.
Yellow governs personal power and mental clarity — capacities that require sustained development, not luck.
```

#### 修改5：新增 FAQ 模块（优先级：高）

```
## Common Questions About Yellow Aura

**Q: What does a bright yellow aura vs. pale yellow mean?**
A: Bright yellow signals high creative output, intellectual confidence, and active engagement.
Pale yellow indicates emerging energy — often seen in people developing their sense of self or a new skill.

**Q: Is yellow aura connected to a chakra?**
A: Yes — yellow corresponds to the Solar Plexus Chakra (Manipura), located above the navel.
It governs personal power, self-worth, and mental clarity.

**Q: What does it mean if my yellow aura has green in it?**
A: Yellow-green combinations often appear in people bridging intellectual work with relational care —
teachers, healers, and communicators who use ideas to serve others.

**Q: Can a yellow aura shift color?**
A: Yes. Under stress, yellow can intensify into a muddy or greenish yellow —
signaling mental overload or unprocessed self-doubt.
During creative flow states, it often brightens toward gold.
```

#### 修改6：新增 Sources 模块（优先级：中）

```
## Sources
- Judith, A. (1999). *Wheels of Life*. Llewellyn Publications.
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
```

#### 修改7：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：黄色/金色能量光晕视觉图，太阳神经丛颜色
- Alt text：`yellow aura meaning solar plexus chakra creative energy field`

---

## 集群横向内链缺口（执行时对照补充）

下表标出每个 series 页对其他 series 页的链接覆盖情况（✅ 有链，❌ 缺失，— 自身）。
**目标：每页至少链接3个兄弟页，优先从 Adjacent Concepts 和 Related Reading 两个区域补。**

| 发出 \ 到达 | purple | white | green | orange | red | blue | yellow |
|------------|--------|-------|-------|--------|-----|------|--------|
| **purple** | — | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **white** | ✅ | — | ❌ | ❌ | ❌ | ✅ | ❌ |
| **green** | ❌ | ❌ | — | ❌ | ❌ | ✅ | ✅ |
| **orange** | ❌ | ❌ | ❌ | — | ✅ | ❌ | ✅ |
| **red** | ✅ | ❌ | ❌ | ✅ | — | ❌ | ✅ |
| **blue** | ✅ | ❌ | ❌ | ❌ | ❌ | — | ✅ |
| **yellow** | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | — |

当前有效横向链接：13 / 42 个，缺口率 69%。本次优化目标：达到 25+ 条。

---

## 执行优先级总表

| 优先级 | 任务 | 涉及页面 | 执行人 | 预估时间 |
|--------|------|---------|--------|---------|
| 🔴 紧急·开发 | Pillar 页 URL 变更：aura-colors-pillar → aura-colors-guide，同步上线 301 跳转 | pillar | 开发+内容 | 开发改 slug + 配置跳转；内容同步更新7个 series 页内链 |
| 🔴 紧急·开发 | 修复 H1 重复出现两次（模板 bug） | 全部8页 | 开发 | 统一处理 |
| 🔴 紧急·内容 | 修复 footer "Open the interactive wiki" 自链 | orange、white、green | 内容 | 10分钟 |
| 🔴 紧急·内容 | 修复 pillar 的"guide to aura reading"自链（改为/en/wiki/aura-reading） | pillar | 内容 | 5分钟 |
| 🔴 紧急·内容 | 修复 purple 的 violet/indigo 自链 | purple | 内容 | 10分钟 |
| 🔴 高 | 补充 FAQ 模块 | pillar、purple、white、red、blue、yellow | 内容 | 4小时 |
| 🔴 高 | 清理各页 Related Reading 重复 pillar 链接，替换为横向颜色链接 | green、white、purple、blue、yellow | 内容 | 1小时 |
| 🔴 高 | Blue 补充 How to Read + Common Misreadings | blue | 内容 | 1小时 |
| 🔴 高 | Red / Yellow 补充 How to Read + Common Misreadings | red、yellow | 内容 | 2小时 |
| 🔴 高 | White 补充 How to Read + Common Misreadings + 正文扩充（目标 2,200+ 词） | white | 内容 | 2小时 |
| 🔴 高 | Purple 补充 How to Read + Common Misreadings | purple | 内容 | 1小时 |
| 🔴 高 | Orange 补充 chakra 内链 | orange | 内容 | 10分钟 |
| 🔴 高 | 添加图片（全部） | 全部8篇 | 设计/内容 | 2小时（含图片制作/采购） |
| 🟡 中 | 标题优化 | pillar、purple、white、red、blue、yellow | 内容 | 30分钟 |
| 🟡 中 | 补充 Sources 模块（全部缺失页 + 升级 green/orange 格式） | 全部8篇 | 内容 | 1小时 |
| 🟡 中 | 统一 FAQ 命名为"Common Questions About [Color] Aura" | 全部8篇 | 内容 | 20分钟 |
| 🟡 中 | 统一表格章节命名为"[Color] Aura at a Glance" | purple、white、red、blue、yellow | 内容 | 20分钟 |
| 🟡 中 | Red / White / Blue / Yellow 正文补充上下文内链（非 Related Reading） | red、white、blue、yellow | 内容 | 30分钟 |
| 🟢 低 | Pillar H2 大小写统一为 Sentence case | pillar | 内容 | 10分钟 |
| 🟢 低 | Schema Markup（需开发协助） | 全部8篇 | 开发 | 另行安排 |

**每次改完一篇，在 Google Search Console → URL检查 → 请求编入索引，提交该页面 URL。**

---

## 注意事项

1. **H1 重复 bug 优先交开发处理**，内容改动可并行进行，但 H1 的最终文字以内容改动版本为准
2. `/en/wiki/indigo-aura-meaning` 链接使用前，先确认该页面是否存在
3. FAQ 内容可按实际内容微调措辞，保持与正文语气一致；命名统一用"Common Questions About [Color] Aura"
4. 图片建议使用光晕/能量场类视觉素材，避免人脸照片（版权风险）
5. Sources 书目全部使用完整格式：作者姓名缩写. (年份). *书名*. 出版社
6. 标题修改后同步修改 H1（保持一致）
7. blue 页面的两个特有章节（"How Common Is Belief in Subtle Energy?" 和"Where the Blue Reading Comes From"）是内容差异化优势，添加新章节时注意保留，不要压缩这两段
8. green 页面是集群结构标杆，如对各页章节顺序有疑问，以 green 现有结构为参照
