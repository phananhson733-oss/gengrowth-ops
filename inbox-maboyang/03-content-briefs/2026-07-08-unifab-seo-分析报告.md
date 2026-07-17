---
title: unifab.ai SEO 全站结构分析报告
date: 2026-07-08
status: v1
来源: unifab.ai 多页面爬取分析（2026-07-07/08）
用途: 作为 SEO SOP 补丁更新的一手参考依据
---

# unifab.ai SEO 全站结构分析报告

---

## 一、网站层级架构（Site Architecture）

unifab 采用**双轨分离架构**，流量获取和流量转化完全独立：

```
unifab.ai（根域）
│
├── 工具页层（转化导向，扁平结构）
│   ├── /unifab.htm                    ← All-In-One 旗舰产品
│   ├── /video-upscaler.htm            ← 所有工具页均 .htm 后缀
│   ├── /ai-face-enhancer.htm          ← 平铺在根目录，获得最短路径
│   ├── /denoise-ai.htm
│   └── ...（共约 12 个工具页）
│
├── 内容层（流量获取，两层深度）
│   ├── /resource/                     ← blog hub 入口
│   │   └── /resource/[article-slug]   ← 600+ 篇文章
│   ├── /ai/                           ← 主题分类页（承上启下）
│   ├── /video/
│   ├── /4k/
│   └── /hdr/
│
├── 支撑页层
│   ├── /pricing.htm
│   ├── /about.htm
│   └── /support-center.htm
│
└── 多语言层（子域名完全隔离）
    ├── ja.unifab.ai（日语，独立 sitemap）
    ├── de.unifab.ai（德语）
    ├── fr.unifab.ai（法语）
    └── zh.unifab.ai（繁体中文）
```

**架构关键决策：**
- 工具页全部 `.htm` 后缀挂根目录：URL 最短，获得最高域名权重传递
- Blog 统一收敛 `/resource/`：不稀释工具页权重，同时建立独立 topical authority hub
- 多语言用子域名：各语言 SEO 策略完全独立，互不干扰
- 总页面数 600+，5 种语言，每种语言独立 sitemap

---

## 二、导航结构

### 一级导航（5个分组）

| 分组 | 内容 |
|---|---|
| Desktop tools | UniFab All-In-One、Video Enhancer Online |
| Local tools | Video Upscaler AI、Face Enhancer AI、HDR Upconverter、Smoother AI、Denoise AI、RTX RapidHDR、RTX Rapid Upscaler、Video Converter |
| FabCloud tools | MusicMeta Converter、Video Translator、Video Reframer、Video Colorizer、Subtitle Generator、HDR Upconverter (Cloud)、Video Upscaler (Cloud) |
| Online tools | Cloud center、Pricing、Cloud workspace、Guidebook、在线工具入口 |
| Support | Support center、Changelog、Community、Contact、Guidebook、Download center |

### 导航内嵌促销（关键设计）

"Summer Sale" 文案直接嵌入主导航菜单，链接 `/promotion.htm`。**不用独立弹窗横幅，而是把促销信息内嵌导航**，用户在任何页面都可见但不被打断。

### 页脚结构（4列）

| 列 | 内容 |
|---|---|
| About us | About、Team、Terms、Privacy、Purchase Policy |
| Support | Support center、Download、Get credits、Resource、Community、Guidebook、Contact |
| Hot features | Upscaler、Online upscaler、Converter、Artifact remover、Subtitle、Voice translate、Colorizer |
| Newsletter | 邮件订阅表单 |

页脚另含社交媒体（YouTube / Community / X）和语言切换器（英/日/德/法/繁中）。

---

## 三、H1 / H2 / H3 策略——三类页面完全不同

### 3.1 首页标题层级

| 层级 | 文案 | 策略逻辑 |
|---|---|---|
| H1 | "UniFab AI - Next-level Video & Audio Enhancer" | 品牌词 + 品类词，不打具体功能 |
| H2 | "Unleash the Full Potential of Video with UniFab" | 情感语，无关键词 |
| H2 | "Effortless Video Conversion and Audio Enhancement" | 品类概述，无具体产品词 |
| H2 | "Ready to Start with UniFab All-In-One" | CTA 语，无关键词 |
| H2 | "Various Hardware Support" | 功能说明，无关键词 |
| H2 | "Trusted by" | 极简，无关键词 |
| H2 | "FAQs about UniFab AI" | 品牌词，无产品功能词 |
| H2 | "UniFab AI Resource Center" | 品牌词，内容入口 |
| H2 | "Join Our Community" | 社区入口，无关键词 |
| H3 | "Upscale Videos to Stunning 16K Quality" | 具体功能 + 极限数值 |
| H3 | "Eliminate Noise for Sharper Footage" | 具体功能描述 |
| H3 | "Revive Black & White Videos with Realistic Color" | 具体功能描述 |
| H3 | "Refine Facial Details for Lifelike Portraits" | 具体功能描述 |

**核心逻辑：首页 H2 全部是板块标签（无关键词），产品功能关键词全部下沉至 H3。**

原因：H2 如果放具体产品关键词（"AI Video Upscaler"、"AI Denoiser"），会与各工具落地页产生关键词自噬（Cannibalization），导致首页和工具页互相竞争、两者都排不好。首页 H2 保持语义中立，让每个工具页专注负责自己的关键词。

---

### 3.2 工具落地页标题层级（以 /video-upscaler.htm 为例）

| 层级 | 文案 | 策略逻辑 |
|---|---|---|
| H1 | "AI Video Upscaler — Upscale Videos to 4K, 8K & 16K with Multi-Model Precision" | 核心关键词 + 规格上限 + 差异化点 |
| H2 | "AI Video Upscaler with 4 Specialized Models for Every Video Type" | 核心词再强化，引出产品深度 |
| H2 | "Sharper, More Natural Video Quality — for Every Format" | 效果承诺 |
| H2 | "Anime AI Upscaling — Preserve Line Art & Style" | 细分场景关键词（anime upscaler） |
| H2 | "Video Upscaler AI Now Supports FabCloud: No High-End GPU Required" | 解决最大痛点 |
| H2 | "AI Video Upscaling Online — Browser-Based, Instant Output" | 抢在线工具关键词 |
| H2 | "AI Upscale Video Resolution up to 16K in Crystal-Clear Detail" | 极限规格重复强化 |
| H2 | "Video Upscaler AI vs Video Upscaler AI - FabCloud" | 对比表，解决选择焦虑 |
| H2 | "What UniFab Users Say About AI Video Upscaling" | 评价区 H2 文案含核心关键词 |
| H3 | Equinox / Kairo / Vellum / Titanus（模型名）| 每个是可独立搜索的实体 |

**核心逻辑：每个 H2 是独立的关键词切入角度**（核心词 / 细分场景 / 痛点解决 / 在线版本 / 规格极限 / 对比）。"AI Video Upscaler"在该页出现于 H1 + 多个 H2，密度高但合理，因为每个 H2 修饰词不同。

---

### 3.3 Blog 文章标题层级（以 /resource/4k-vs-8k 为例）

| 层级 | 文案 | 策略逻辑 |
|---|---|---|
| H1 | "4K vs 8K: Complete Resolution Comparison Guide [2026]" | 核心词 + 内容类型 + 年份 |
| H2 | "What Is 4K Resolution?" | 基础定义，覆盖 PAA |
| H2 | "What Is 8K Resolution?" | 基础定义，覆盖 PAA |
| H2 | "4K vs 8K: Key Differences at a Glance" | 加速决策者 |
| H2 | "4K vs 8K: Detailed Comparison" | 留住深度阅读者 |
| H2 | "4K vs 8K for Specific Use Cases" | 场景化，覆盖长尾变体词 |
| H2 | "Display Technologies: OLED vs QLED vs Mini-LED" | 延伸话题，扩大语义覆盖 |
| H2 | "AI Upscaling: The Bridge Between 4K and 8K" | **产品桥接 H2，自然引入工具** |
| H2 | "4K vs 8K: Which Should You Choose?" | 决策框架 |
| H2 | "FAQ about 8K vs 4K" | 问题词收割 |

**核心逻辑：H2 按读者认知进度排列**（是什么 → 怎么比 → 用在哪 → 产品解决方案 → 问答）。"AI Upscaling: The Bridge"是最精妙的设计——不叫"为什么选 UniFab"，用中立"桥接方案"语气自然引入产品。

---

## 四、Blog 文章结构公式

所有高流量文章遵循以下六段式结构：

```
H1: [核心关键词] — [差异化主张] [年份]

① 教育段（建立可信度，此处不提产品）
   → 首句直接回答搜索意图（Direct Answer Block）
   → 至少一个结构化视觉元素：对比表 / 规格表 / 步骤编号

② 决策框架（帮用户做选择）
   → "Which Should You Choose?" 类场景分流
   → 不同需求给不同答案，禁止"两者都好"的无效结论

③ 产品桥接（自然过渡，不硬广）
   → H2 命名为"[功能]: The Bridge Between X and Y"
   → 此处植入第一个 CTA（Free Download）

④ 嵌入产品教程模块（核心转化机制）
   → H3: "How to [解决用户问题] With UniFab"
   → Free Download 按钮（Windows / macOS 分支，各含信任背书文案）
   → Step 1 / Step 2 / Step 3 / Step 4（完整操作流程）
   → 此处植入第二个 CTA
   → 作用：在信息型文章中直接带用户走完产品体验

⑤ FAQ（8–10 个问题，带 FAQPage schema）
   → 覆盖 PAA（People Also Ask）真实问题
   → 每个答案 ≤ 300 字符

⑥ 结论 + 第三个 CTA
   → 明确推荐句式："Use [产品] if you need X"
   → 相关阅读推荐（4篇，含工具页和其他 blog）
```

**字数目标：T1 文章 4,000–6,000 字，T2 文章 2,000–3,000 字**

---

## 五、转化机制——完整链路

### 5.1 文章内嵌产品教程模块

这是 unifab blog 最核心的转化设计，也是最容易被忽略的：

```
[H3] How to Enhance Video With UniFab
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Free Download
30-day Free Trial with full feature access!

[ Free Download ]  Windows 11/10/8.1/8/7   ← OS 分支
100% Safe and Clean

[ Free Download ]  macOS 13.0+              ← OS 分支
100% Safe and Clean

Step 1: 安装并启动 UniFab
Step 2: 导入视频文件
Step 3: 选择 AI 模型和输出参数
Step 4: 开始处理并导出
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**设计逻辑：**
- 访客因搜索竞品词（"Audials review"）进入，购买意图不明确
- 嵌入教程模块将"我在研究竞品"转变为"我在操作 UniFab"
- OS 分支按钮（Windows / macOS）提升点击精准度
- "100% Safe and Clean"在每个按钮旁重复出现，消除安装顾虑
- Step 格式可触发 HowTo schema，SERP 中显示步骤预览
- "How to Enhance Video With UniFab"这个 H3 本身覆盖 how-to 类长尾词

**结果：一篇竞品评测文章同时命中三个搜索意图：**
1. "[竞品名] review"（竞品评测）
2. "[竞品名] alternative"（替代品搜索）
3. "How to enhance video"（操作教程）

---

### 5.2 阅读完成后的注册弹窗

**触发机制：** JavaScript 触发（静态抓取不可见），在以下节点激活：
- 用户滚动至文章 80–90% 位置（读完信号）
- 或鼠标移出页面顶部（exit-intent 信号）

**弹出内容：** 注册表单（收集 email），而非直接跳转购买

**为什么是注册而非购买：**
- Blog 访客 = 冷流量，购买意图低于工具页访客
- 直接推付费转化率极低
- 先获取 email → 后续 7–14 天 email 序列完成转化
- 这是 SaaS 内容营销的标准漏斗设计

---

### 5.3 完整转化链路

```
用户搜索竞品词 / 信息词
        ↓
进入 blog 文章（冷流量，购买意图低）
        ↓
阅读教育段 → 建立信任
        ↓
遭遇嵌入教程模块（文章中段）
        ↓
高意图用户 ──→ 点击 Free Download → 安装试用 → 付费转化
        ↓
低意图用户继续阅读到文章末尾
        ↓
触发注册弹窗（exit-intent 或 scroll-depth）
        ↓
获取 email → 进入 email 序列
        ↓
Day 3: 功能介绍邮件
Day 7: 限时折扣邮件 → 转化
```

**Blog 流量实际有两条转化路径，缺一不可。**

---

## 六、内链矩阵结构

### 内链方向规则

```
Blog 文章 ──→ 工具落地页（≥2 条，正文中段+结尾）
Blog 文章 ──→ 相关 Blog 文章（≥5 条）
工具落地页 ──→ 相关 Blog 文章（4 条，页面底部）
工具落地页 ──→ 其他工具页（导航/底部推荐）
首页 ──→ 工具落地页（导航）
首页 ──→ Blog hub（Resource Center H2）
```

**关键：工具页也反向链接 blog 文章**，形成双向流量循环：
- blog → 工具页：转化路径
- 工具页 → blog：教育/留存路径

### 锚文本规律

| 链接类型 | 锚文本风格 | 示例 |
|---|---|---|
| Blog → 工具页 | 功能描述词 | "AI video upscaling software" |
| 工具页 → Blog | 操作指引词 | "How to Upscale 480p to 1080p" |
| 导航 → 工具页 | 产品名称 | "Video Upscaler AI" |

三种锚文本类型各司其职，不重叠。**工具页内链锚文本从不使用品牌词"UniFab"**，全部使用功能描述，强化工具页的关键词相关性。

---

## 七、竞品文章策略

unifab 42% 的 blog 是竞品评测或对比文章，是最高 ROI 内容类型。

**核心逻辑：** 搜索竞品名称的用户处于购买决策阶段，转化率是普通信息词的 3–5 倍。

**竞品文章结构：**

```
H1: [竞品名] Review [年份]: Features, Pricing & Best Alternative

① 快速结论（30 秒内告知答案）
② 竞品介绍（中立语气）
③ 真实测试 + 对比数据（具体数值，可截图）
④ 定价对比（将竞品定位为"有限制的选项"）
⑤ 优缺点表格（缺点用具体场景描述）
⑥ 功能差异矩阵
   - 竞品有但我方没有（诚实列出，建立信任）
   - 双方都有，我方更好
   - 我方独有
⑦ 嵌入产品教程模块（How to Use UniFab — Step 1/2/3/4）← 关键
⑧ 结论："Choose [竞品] if..." / "Choose UniFab if..."
⑨ FAQ（8–10 个，带 schema）
```

**执行红线：** 竞品缺陷描述必须基于真实测试或公开用户评论，不能捏造。

---

## 八、横幅与弹窗设计原则

| 元素 | unifab 做法 | 设计逻辑 |
|---|---|---|
| 促销信息 | 嵌入主导航（"Summer Sale"），不用独立横幅 | 全站可见但不打断阅读，避免 Google 侵入式弹窗惩罚 |
| Hero 信任横幅 | "Free Download \| 100% Safe \| Full access, no watermark" | 三要素解决三个购买顾虑 |
| 更新日期 | 工具页 Hero 区显示"Last Update: 2026-07-02" | 向 Google 持续发送新鲜度信号，向用户证明产品在维护 |
| 阅读完成弹窗 | scroll 80–90% 或 exit-intent 触发注册表单 | 冷流量先捕获 email，email 序列再推转化 |
| 文章内嵌模块 | 产品教程嵌入 blog 正文中段 | 在信任建立后自然引入产品体验 |

**整体原则：能用静态元素解决的不用弹窗。** 弹窗仅用于 blog 末尾捕获 email，不在工具页或首页使用。

---

## 九、工具落地页转化架构

### 定价信息的故意缺失

工具落地页**不显示价格**，只有"Buy Now"按钮跳转结账页：
- 先用功能和社会证明建立价值感
- 消除用户在功能了解前的价格抵触
- 定价页（/pricing.htm）独立 SEO 优化

### 信任信号的分层布局

```
页面顶部：媒体背书（Trustpilot / Guru99 / The Verge / WikiHow）
          → 权威可信，快速扫视者看这里

页面中部：功能演示 + 对比表（Local vs Cloud）
          → 理性决策支持，深度研究者看这里

页面底部：真实用户评价（含姓名/职业/具体使用场景）
          → 情感共鸣，临近转化者被这里打动
```

### 对比表设计（主动暴露限制）

unifab 在工具页主动展示"本地版 vs 云版"的功能差异，**包括本地版需要高端 GPU 的限制**：

| 功能 | 本地版（Lifetime）| 云版（FabCloud）|
|---|---|---|
| 输入文件大小 | 无限制 | 最大 10GB |
| 可用 AI 模型 | 4 个全模型 | Equinox（更多陆续添加）|
| 最高输出分辨率 | 16K | 4K |
| 所需硬件 | 本地 GPU（RTX 30 系列+）| 无需 GPU |
| 积分消耗 | 不需要 | 需要积分 |

**设计逻辑：** 主动暴露限制反而建立信任，同时为云版本（门槛更低）创造独立转化路径。

---

## 十、GEO 配置

> 数据来源：curl 直接抓取 HTML + JSON-LD 解析（2026-07-08 验证）

### 10.1 已确认的 GEO 策略全览

| 配置项 | 状态 | 详情 |
|---|---|---|
| robots.txt 完全开放 | ✅ 确认 | `User-agent: * Allow: /`，所有 AI 爬虫可爬 |
| FAQPage schema | ✅ 确认 | 评测类文章标配，10 个 Q&A，每答案 ≤300 字符 |
| BlogPosting / Article schema | ✅ 确认 | 评测类用 BlogPosting，教程类用 Article |
| BreadcrumbList schema | ✅ 确认 | 所有文章页均有，三级路径（Home > Resource > 文章）|
| Organization schema + sameAs | ✅ 确认 | 见下方详细展开 |
| Person（作者实体）schema | ✅ 确认 | 含 knowsAbout + alumniOf + sameAs，见 10.3 |
| ProfilePage schema | ✅ 确认 | 每个作者有独立页面 `/author/[name].htm` |
| **SoftwareApplication schema** | ✅ 确认 | 所有工具页标配，含 applicationCategory + operatingSystem + downloadUrl |
| ItemList schema | ✅ 确认 | 用于文章内编号列表 |
| H2 开头直接答案句 | ✅ 确认 | 每个 H2 第一句直接给结论，可被 AI 直接引用 |
| 结构化对比表格 | ✅ 确认 | AI 系统最容易解析的内容格式 |
| Ask AI 主动引导按钮 | ✅ 确认 | 首页"Ask AI about UniFab"，跳转 AI 工具预填查询 |
| 第三方引用建设 | ✅ 确认 | Trustpilot / FilterGrade / SoftwareTestingHelp / Futurepedia |
| Reddit 自建版块 | ✅ 确认 | r/UniFabCreators，控制品牌在 Reddit 的话语权 |
| 本地化作者团队 | ✅ 确认 | 各语言站有独立作者，日语用日文名（Chiharu/Yume/Aoi）|
| 工具页 "What's New" 版本日志 | ✅ 确认 | 保持工具页内容持续更新，新鲜度信号 |
| 独立竞品对比页（.htm）| ✅ 确认 | `/compare-unifab-and-topaz.htm`，产品级别不是 blog |
| **HowTo schema** | ❌ **缺失** | Step 1/2/3/4 模块只是视觉 HTML，未加结构化标记 |

### 10.2 工具页 H 标签规律（与首页相反）

工具页 H2 策略与首页 H2 策略**完全相反**：

| 页面类型 | H2 策略 | 原因 |
|---|---|---|
| 首页 | H2 不放产品关键词 | 避免抢占工具页的关键词排名 |
| 工具页 | H2 每个都含核心关键词 | 这里就是要排名的页面，重复强化语义 |

**video-upscaler.htm 的 H2 实例：**
```
AI Video Upscaler with 4 Specialized Models for Every Video Type
AI Video Upscaling Online — Browser-Based, Instant Output
AI Upscale Video Resolution up to 16K in Crystal-Clear Detail
Video Upscaler AI: Spec Sheet of Each AI Model
What's New in UniFab AI Video Upscaler        ← 版本更新日志
Video Upscaler AI vs Video Upscaler AI FabCloud ← 内部版本对比
What UniFab Users Say About AI Video Upscaling  ← 社会证明
Get UniFab All-In-One — One License, 20+ AI Tools ← 追加销售
```

"What's New"版本日志是工具页特有的板块：每次产品更新都可以追加内容，持续向 Google 发送"页面有新鲜内容"的信号，而不需要重写整页。

---

### 10.3 Organization Schema sameAs（品牌实体锚定）

```json
{
  "@type": "Organization",
  "name": "UniFab",
  "legalName": "UniFab Software Limited",
  "url": "https://unifab.ai/",
  "sameAs": [
    "https://www.youtube.com/@UniFabofficial",
    "https://community.unifab.ai/",
    "https://x.com/UniFabAI",
    "https://www.reddit.com/r/UniFabCreators/"
  ]
}
```

sameAs 的作用：告诉所有 AI 爬虫"这四个账号和这个网站是同一个品牌实体"，让品牌在 AI 知识库里形成一个清晰的实体节点，而不是几个孤立的信号。

### 10.4 Person（作者实体）schema — EEAT 信号

unifab 作者页 Person schema 完整结构（已验证）：

```json
{
  "@type": "Person",
  "name": "Harper Seven",
  "jobTitle": "UniFab Editor",
  "description": "Harper joined the UniFab team in 2024...",
  "worksFor": {"@id": "https://unifab.ai/#organization"},
  "sameAs": ["https://x.com/HarperSeve39276"],
  "knowsAbout": ["Video Technology", "Software Reviews", "Easy Tutorials"],
  "alumniOf": [{"@type": "EducationalOrganization", "name": "University of Southern California"}]
}
```

**四个关键字段解析：**

| 字段 | 内容 | EEAT 作用 |
|---|---|---|
| `knowsAbout` | Video Technology, Software Reviews | 直接声明专业领域，Google 用于评估 Expertise |
| `alumniOf` | University of Southern California | 学历背书，增强 Trustworthiness |
| `sameAs` | Twitter/X 账号 | 跨平台实体验证，证明作者真实存在 |
| `worksFor` | 链接到 Organization 实体 | 把作者绑定到品牌，雇佣关系可核验 |

**本地化作者团队策略：** unifab 为每种语言配置了独立作者：
- 英语：Harper Seven、Ethan、Chloe、Uyu、Echo
- 日语：Chiharu、Yume、Aoi（使用日文风格名字）
- 德语：Noah、Sammi

→ 每个语言市场的读者看到的是有本地文化背景的作者，EEAT 信号在本地市场更可信。

### 10.5 SoftwareApplication Schema（工具页产品实体）

工具页标配的 schema（已验证）：

```json
{
  "@type": "SoftwareApplication",
  "name": "UniFab Video Upscaler AI",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Windows, macOS, Web",
  "downloadUrl": "https://download.unifab.ai/...",
  "publisher": {"@id": "https://unifab.ai/#organization"}
}
```

**为什么这对 GEO 至关重要：** 当 AI 系统被问到"最好的视频超分辨率软件是什么"时，它会在训练数据中寻找 `@type: SoftwareApplication` 的实体节点。有这个 schema，UniFab 就在 AI 的产品知识图谱里有了明确的位置；没有这个 schema，AI 只能靠文本推断。

**与 Organization schema 的联动：** `publisher` 字段指向 Organization 实体 ID，把产品、公司、作者三个实体连成一张图，AI 系统可以完整解析"谁做了什么产品"。

### 10.6 独立竞品对比页（产品级，非 blog）

sitemap 中发现：`/compare-unifab-and-topaz.htm`

这不是 `/resource/` 下的 blog 文章，而是 `.htm` 格式的产品级竞品对比页，与工具页同级。

**与竞品 blog 文章的区别：**

| 维度 | 竞品 blog 文章（/resource/）| 独立对比页（.htm）|
|---|---|---|
| URL 权重 | 二级路径，权重较低 | 根目录，权重最高 |
| 内容深度 | 内容型，侧重信息 | 产品型，侧重转化 |
| 更新频率 | 按新闻/更新追加 | 产品发布时同步更新 |
| CTA | 文章内自然植入 | 全页转化导向 |

→ 对于高价值竞品词（如"Topaz vs UniFab"），放在 `.htm` 产品页比放在 blog 更有 SEO 权重，且页面设计可以完全为转化优化。

### 10.4 第三方引用建设

AI 系统回答"什么是 UniFab"时，依赖的不只是 unifab.ai 自己的内容。以下第三方引用都是 AI 的训练信号来源：

| 平台 | 类型 | GEO 价值 |
|---|---|---|
| Trustpilot | 用户评分平台 | AI 频繁引用 Trustpilot 数据评估产品可信度 |
| FilterGrade | 专业软件评测站 | 权威媒体背书，AI 优先引用 |
| SoftwareTestingHelp | 软件评测站 | 同上 |
| Futurepedia | AI 工具目录 | AI 工具专属索引，Perplexity 等常引用 |
| r/UniFabCreators | Reddit 自建版块 | Reddit 内容是 AI 训练数据的重要来源，自建版块控制话语权 |

### 10.5 Ask AI 主动引导模块

unifab 在首页设置了"Ask AI about UniFab"按钮，点击后直接跳转至 Perplexity 或 ChatGPT，并预填品牌查询内容。

**主动 GEO vs 被动 GEO：**

```
被动 GEO（动作一~四）：优化内容 → 等 AI 爬虫发现 → 期望被引用
主动 GEO（本模块）   ：用户点击 → 跳转 AI → 产生品牌对话 → 强化 AI 关联
```

**三重效果：**
1. 用户在 AI 工具中看到 UniFab 被推荐 → 强化品牌认知
2. 累积 AI 查询量 → 增加品牌在 AI 训练信号中的权重
3. 捕获习惯用 AI 而非 Google 搜索的用户

### 10.6 已发现的 GEO 漏洞

**HowTo schema 缺失：** Step 1/2/3/4 嵌入教程模块是视觉 HTML，没有加 `@type: HowTo` 结构化标记。如果加上，可以：
- 让 AI 系统更精准地解析操作步骤
- 在 SERP 中触发步骤预览富文本结果
- 成为"How to upscale video"类查询的首选 AI 引用来源

这是 unifab 自身的优化空白，也是我们在 AstrologyWiki 可以做到而它没做的地方。

---

## 十一、对 AstrologyWiki 和 brdeco 的直接可用结论

| unifab 做法 | AstrologyWiki 对应 | brdeco 对应 |
|---|---|---|
| 工具页 URL 挂根目录 | Birth Chart Calculator 直挂根目录 | 产品页 `/rockwool-panel` 直挂根 |
| H1 = 核心词 + 规格/极限 | "Birth Chart Calculator — Full Natal Chart in Seconds" | "Rockwool Sandwich Panel — A1 Fire-Rated, 30–200mm" |
| 首页 H2 不放关键词 | 首页 H2 用平台描述，不放计算器名称 | 首页 H2 用行业描述，不放产品词 |
| 竞品评测文章 | "Co-Star vs AstrologyWiki" / "Cafe Astrology alternative" | "Kingspan vs BRDECO" / "EPS vs PIR vs Rockwool" |
| 嵌入产品教程模块 | 星盘文章中段嵌入"How to Read Your Birth Chart with AstrologyWiki" + Step 1/2/3 | 技术文章中段嵌入"How to Specify Rockwool Panel for Data Centers" |
| 阅读完成注册弹窗 | 收集 email，推送每周星盘运势，提升回访 | 收集 email 或 WhatsApp，进入询盘培育序列 |
| 定价不在落地页 | 工具页主推"免费生成"，付费在独立页 | 产品页主推"Get Quote"，不显示单价 |
| 对比表解决选择焦虑 | "免费版 vs 高级版"功能对比 | "岩棉 vs PU vs PIR 参数对比表" |
| 促销嵌导航不用弹窗 | 同样策略，避免弹窗 SEO 惩罚 | 同样策略 |
| 工具页反向链接 blog | 计算器页底部推荐相关星座文章 | 产品页底部推荐技术选型指南 |
| 信任信号三层布局 | 顶部：媒体 / 中部：功能演示 / 底部：用户评价 | 顶部：认证证书 / 中部：参数对比 / 底部：项目案例 |
| **Ask AI 主动引导模块** | "Ask AI about AstrologyWiki" → 预填查询跳转至 Perplexity/ChatGPT | "Ask AI about BRDECO panels" → 预填技术选型查询 |

---

*文件：inbox-maboyang/03-content-briefs/2026-07-08-unifab-seo-分析报告.md*
*版本：v1 | 2026-07-08*
*数据来源：unifab.ai 多页面爬取（首页 / 工具落地页 / Blog 文章 / 分类页 / 定价页）*
*下一步：根据本报告更新 2026-07-07-seo-sop-升级补丁-unifab学习.md*
