# Aura Cluster SEO 优化修改清单
> 文件用途：同事执行参考，按优先级逐页修改
> 整理日期：2026-06-07
> 涉及页面：8篇（1篇 Pillar + 7篇 Series）

---

## 整体问题（所有页面共同存在）

| 问题                                     | 优先级 | 说明                                     |
| -------------------------------------- | --- | -------------------------------------- |
| 所有页面无图片                                | 高   | 灵性/视觉类内容，竞品普遍有配图，无图是明显劣势               |
| 所有页面无 H3 标题                            | 中   | 内容全部是 H2 平铺，缺乏层次感，影响可读性和爬取结构           |
| 所有页面无 Schema Markup                    | 中   | 缺少 Article Schema 和 FAQ Schema，无法获得富摘要 |
| Green / Orange 已有 FAQ + Sources，其他5篇缺失 | 高   | 结构不统一，缺失页面需补齐                          |

---

## 各页面修改清单

---

### 1. aura-colors-pillar（Pillar 页）

**当前状态**
- 字数：约 2,800–3,200 词 ✓
- 标题：Aura Colors Meaning
- 内链：已链接全部7个颜色子页 + chakra-system-overview + aura-reading ✓
- 缺失：无 FAQ，无 Sources，无图片

**修改项**

#### 修改1：标题优化（优先级：中）
- 当前：`Aura Colors Meaning`
- 建议改为：`Aura Colors: A Complete Guide to Reading Every Color and Shade`
- 原因：现标题过于简单，缺乏点击钩子；新标题保留关键词的同时增加价值主张

#### 修改2：新增 FAQ 模块（优先级：高）
在"Related Reading"之前插入以下 FAQ 部分：

```
## Frequently Asked Questions

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

#### 修改3：新增 Sources 模块（优先级：中）
在页面最底部添加：

```
## Sources
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
- Hunt, V. (1996). *Infinite Mind: Science of the Human Vibrations of Consciousness*. Malibu Publishing.
- Motoyama, H. (1981). *Theories of the Chakras*. Quest Books.
```

#### 修改4：添加图片（优先级：高）
- 位置：放在 "The 7 aura colors: Quick Guide" 章节内
- 图片类型：7种颜色的对比色块图，每色附文字标注（颜色名 + 对应脉轮）
- Alt text：`aura colors chart showing red orange yellow green blue purple and white energy fields`

---

### 2. purple-aura-meaning

**当前状态**
- 字数：约 1,800–2,000 词
- 标题：Purple Aura Meaning（通用）
- 内链：7条，链回 Pillar ✓
- **Bug：页面内有2处链接指向自身 `/en/wiki/purple-aura-meaning`（本应指向 indigo 和 violet 的页面）**
- 缺失：无 FAQ，无 Sources，无图片

**修改项**

#### 修改1：修复自链 Bug（优先级：紧急）
页面内有以下2处需要修正：
- 当前：violet 对比段落链接 → `/en/wiki/purple-aura-meaning`（自链）
- 建议：如果 indigo 页面存在，改为 `/en/wiki/indigo-aura-meaning`；如不存在，删除该链接，改为纯文字说明
- 当前：indigo 对比段落链接 → `/en/wiki/purple-aura-meaning`（自链）
- 建议：同上处理

#### 修改2：标题优化（优先级：中）
- 当前：`Purple Aura Meaning`
- 建议改为：`Purple Aura Meaning: Gifts, Intuition, and the Psychic Frequency`
- 原因：对应内容角度（灵性天赋、非传统者特质），增加点击意愿

#### 修改3：新增 FAQ 模块（优先级：高）
在"Related Reading"前插入：

```
## Frequently Asked Questions

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

#### 修改4：新增 Sources 模块（优先级：中）
```
## Sources
- Andrews, T. (1998). *How to See and Read the Aura*. Llewellyn Publications.
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
```

#### 修改5：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：紫色光晕/能量场视觉图
- Alt text：`purple aura meaning energy field around human silhouette`

---

### 3. white-aura-meaning

**当前状态**
- 字数：约 2,100–2,300 词
- 标题：White Aura Meaning（通用）
- 内链：4条（最少，只链接 pillar、purple、blue、chakra）
- 缺失：无 FAQ，无 Sources，无图片，缺少横向颜色交叉链接

**修改项**

#### 修改1：标题优化（优先级：中）
- 当前：`White Aura Meaning`
- 建议改为：`White Aura Meaning: Why This Color Often Contradicts How You Feel`
- 原因：对应高频用户困惑（"我看到白光但感觉和描述不符"），直接命中搜索意图

#### 修改2：补充内链（优先级：高）
白色页面目前只有4条内链，是集群中最少的。需补充：
- 在"Adjacent Concepts"对比段落，添加链接：
  - → `/en/wiki/yellow-aura-meaning`（yellow作为活跃能量对比）
  - → `/en/wiki/green-aura-meaning`（green作为心轮愈愈对比）

#### 修改3：新增 FAQ 模块（优先级：高）
```
## Frequently Asked Questions

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

#### 修改4：新增 Sources 模块（优先级：中）
```
## Sources
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
- Andrews, T. (1998). *How to See and Read the Aura*. Llewellyn Publications.
```

#### 修改5：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：白色或银白色光晕视觉图
- Alt text：`white aura meaning pure energy field surrounding human figure`

---

### 4. green-aura-meaning ✓

**当前状态**
- 字数：约 1,800–2,000 词
- 标题：What a Green Aura Really Means for Healing and Connection ✓
- 内链：4条（链回 Pillar ×3，yellow，blue，chakra）
- 已有：FAQ（Common Questions About Green Aura）✓，Sources ✓
- 缺失：无图片

**修改项（此页面是集群标杆，改动最少）**

#### 修改1：补充内链（优先级：中）
目前缺少指向红色和橙色的横向链接：
- 在"Adjacent Concepts"段落添加：
  - → `/en/wiki/red-aura-meaning`（red 作为根脉轮对比）
  - → `/en/wiki/orange-aura-meaning`（orange 作为创造力能量对比）

#### 修改2：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：绿色光晕视觉图，心轮颜色
- Alt text：`green aura meaning heart chakra healing energy field`

---

### 5. orange-aura-meaning

**当前状态**
- 字数：约 1,800–2,000 词
- 标题：Why an Orange Aura Reads as Drive, Pleasure, and Connection ✓
- 内链：5条，已有 FAQ ✓，Sources ✓
- **Bug：页面内有1处链接指向自身 `/en/wiki/orange-aura-meaning`（标注为"interactive wiki version"）**
- 缺失：无图片

**修改项**

#### 修改1：修复自链 Bug（优先级：紧急）
- 找到 anchor text 为"interactive wiki version"或类似措辞的链接
- 当前指向：`/en/wiki/orange-aura-meaning`（自链）
- 处理方式：删除该链接，保留纯文字，或改为指向相关工具页面

#### 修改2：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：橙色能量光晕视觉图，骶轮颜色
- Alt text：`orange aura meaning sacral chakra vitality energy field`

---

### 6. red-aura-meaning

**当前状态**
- 字数：约 1,800–2,000 词
- 标题：Red Aura Meaning（通用）
- 内链：6条，链回 Pillar ✓
- 缺失：无 FAQ，无 Sources，无图片，无"How to Read"实操章节，无"Common Misreadings"章节

**修改项**

#### 修改1：标题优化（优先级：中）
- 当前：`Red Aura Meaning`
- 建议改为：`Red Aura Meaning: What Your Root Energy Actually Signals`
- 原因：对应内容角度（根脉轮、生存能量、活力），区分于竞品通用描述

#### 修改2：新增"How to Read Red Aura in Yourself"章节（优先级：高）
在"Quick Reference Table"之前插入，参考 Green / Orange 页面的结构：

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

#### 修改3：新增"Common Misreadings"章节（优先级：高）
在"How to Read"之后插入：

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

#### 修改4：新增 FAQ 模块（优先级：高）
```
## Frequently Asked Questions

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

#### 修改5：新增 Sources 模块（优先级：中）
```
## Sources
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
- Judith, A. (1999). *Wheels of Life*. Llewellyn Publications.
```

#### 修改6：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：红色能量光晕视觉图，根脉轮颜色
- Alt text：`red aura meaning root chakra energy field and life force`

---

### 7. blue-aura-meaning（本集群最高优先级页面）

**当前状态**
- 字数：约 1,800–2,000 词（但结构上缺失最多章节，是集群中内容最不完整的页面）
- 标题：Blue Aura Meaning（通用）
- 搜索量：8,000/月（集群第二高）
- 内链：4条（最少之一）
- 缺失：无"How to Read"章节，无"Common Misreadings"章节，无 FAQ，无 Sources，无图片

**修改项**

#### 修改1：标题优化（优先级：高）
- 当前：`Blue Aura Meaning`
- 建议改为：`Blue Aura Meaning: Why Interpretations Vary — and What's Actually True`
- 原因：直接命中该词最高频的用户困惑（"我查到的结果都不一样"），制造点击动力

#### 修改2：新增"How to Read Blue Aura in Yourself"章节（优先级：高）
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

#### 修改3：新增"Common Misreadings"章节（优先级：高）
在"How to Read"之后插入：

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

#### 修改4：新增 FAQ 模块（优先级：高）
```
## Frequently Asked Questions

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

#### 修改5：补充内链（优先级：高）
目前只有4条内链，需补充：
- → `/en/wiki/indigo-aura-meaning`（如该页面存在）
- → `/en/wiki/white-aura-meaning`（作为高频色对比）

#### 修改6：新增 Sources 模块（优先级：中）
```
## Sources
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
- Andrews, T. (1998). *How to See and Read the Aura*. Llewellyn Publications.
- Judith, A. (2004). *Eastern Body, Western Mind*. Celestial Arts.
```

#### 修改7：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：蓝色能量光晕视觉图，喉轮颜色
- Alt text：`blue aura meaning throat chakra communication energy field`

---

### 8. yellow-aura-meaning

**当前状态**
- 字数：约 1,850–2,000 词
- 标题：Yellow Aura Meaning（通用）
- 搜索量：7,400/月（集群第三高）
- 内链：5条，链回 Pillar ✓
- 缺失：无"How to Read"章节，无"Common Misreadings"章节，无 FAQ，无 Sources，无图片

**修改项**

#### 修改1：标题优化（优先级：中）
- 当前：`Yellow Aura Meaning`
- 建议改为：`Yellow Aura Meaning: Optimism, Creative Drive, and Solar Energy Explained`
- 原因：对应内容角度（太阳神经丛、创造力、喜悦），增加搜索匹配深度

#### 修改2：新增"How to Read Yellow Aura in Yourself"章节（优先级：高）
在"Quick Reference Table"之前插入：

```
## How to Read Yellow Aura in Yourself

Yellow aura often reveals itself through a person's relationship with creative energy and self-confidence.

Three self-check indicators:
1. **Idea generation**: Do ideas and connections come to you rapidly, sometimes faster than you can act on them?
2. **Social radiance**: Do people frequently describe you as energizing or uplifting to be around?
3. **Confidence cycles**: Is your confidence tied to intellectual or creative output — 
   high when you're making things, lower when you're not?

If two or more apply consistently, yellow is likely a dominant frequency in your current field.
```

#### 修改3：新增"Common Misreadings"章节（优先级：高）
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

#### 修改4：新增 FAQ 模块（优先级：高）
```
## Frequently Asked Questions

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

#### 修改5：新增 Sources 模块（优先级：中）
```
## Sources
- Judith, A. (1999). *Wheels of Life*. Llewellyn Publications.
- Brennan, B. A. (1988). *Hands of Light*. Bantam Books.
```

#### 修改6：添加图片（优先级：高）
- 位置：文章顶部 H1 下方
- 图片类型：黄色/金色能量光晕视觉图，太阳神经丛颜色
- Alt text：`yellow aura meaning solar plexus chakra creative energy field`

---

## 执行优先级总表

| 优先级 | 任务 | 涉及页面 | 预估时间 |
|--------|------|---------|---------|
| 🔴 紧急 | 修复自链 Bug | purple、orange | 10分钟 |
| 🔴 高 | 补充 FAQ 模块 | pillar、purple、white、red、blue、yellow | 4小时 |
| 🔴 高 | Blue Aura 补充 How to Read + Common Misreadings | blue | 1小时 |
| 🔴 高 | Red/Yellow 补充 How to Read + Common Misreadings | red、yellow | 2小时 |
| 🔴 高 | 补充内链（white、green、blue） | white、green、blue | 30分钟 |
| 🟡 中 | 标题优化 | pillar、purple、white、red、blue、yellow | 30分钟 |
| 🟡 中 | 添加图片（全部） | 全部8篇 | 2小时（含图片制作/采购） |
| 🟡 中 | 补充 Sources 模块 | 全部8篇 | 1小时 |
| 🟢 低 | Schema Markup（需开发协助） | 全部8篇 | 另行安排 |

**每次改完一篇，在 Google Search Console → URL检查 → 请求编入索引，提交该页面 URL。**

---

## 注意事项

1. FAQ 内容可按实际内容微调措辞，保持与正文语气一致
2. 图片建议使用光晕/能量场类视觉素材，避免人脸照片（版权风险）
3. Sources 书目可根据实际内容更换，保持学术/专业类来源
4. 标题修改后同步修改 H1（保持一致）
5. 所有 `/en/wiki/indigo-aura-meaning` 链接使用前，先确认该页面是否存在
