import { useState } from "react";

const PHASES = [
  {
    id: "diagnosis",
    num: "01",
    title: "增长诊断与基线建立",
    subtitle: "Growth Diagnosis & Baseline",
    color: "#E8453C",
    icon: "🔬",
    summary: "所有增长动作的起点。不诊断就行动=蒙眼开车。",
    modules: [
      {
        name: "产品画像建模",
        details: [
          "产品类别自动识别（SaaS/电商/内容/工具/平台）",
          "商业模式标注（订阅/交易/广告/Freemium/混合）",
          "目标市场与用户画像初始化",
          "竞品池自动生成（3-5个直接竞品+3个间接竞品）",
        ],
        automation: "接入产品URL → 自动爬取并分类 → 输出产品档案卡",
        kpi: "产品档案完整度 ≥ 90%",
      },
      {
        name: "技术健康审计",
        details: [
          "Core Web Vitals（LCP/FID/CLS）自动检测",
          "爬虫可抓取性（robots.txt/sitemap/渲染方式）",
          "结构化数据覆盖率扫描",
          "移动端适配/HTTPS/国际化配置检查",
          "页面加载瀑布流分析 → 瓶颈定位",
        ],
        automation: "每周自动爬虫 → 异常阈值告警 → 推送到协作工具",
        kpi: "技术健康评分 ≥ 80/100",
      },
      {
        name: "流量与转化基线",
        details: [
          "全渠道流量来源拆解（自然搜索/社媒/直接/引荐/付费）",
          "关键转化漏斗建模（访问→注册→激活→付费→留存）",
          "各环节转化率基准值记录",
          "用户行为热图/录屏分析（关键页面）",
        ],
        automation: "对接GA4/Mixpanel API → 自动生成周报基线仪表盘",
        kpi: "漏斗各环节转化率有基准数据",
      },
      {
        name: "内容资产盘点",
        details: [
          "现有页面按流量/排名/转化三维评分",
          "内容缺口分析（有需求但无内容覆盖的关键词）",
          "内容衰减检测（流量持续下降的页面）",
          "内容类型分布（教程/资讯/工具/社区等）",
        ],
        automation: "GSC + Ahrefs API → 自动分类标记 → 输出优先级矩阵",
        kpi: "内容覆盖率、内容健康度评分",
      },
      {
        name: "竞品情报系统",
        details: [
          "竞品流量结构对比（渠道占比差异）",
          "关键词重叠度与独占词分析",
          "竞品外链Profile分析",
          "竞品新内容/新功能监控",
          "竞品社媒策略拆解",
        ],
        automation: "每周自动抓取竞品数据 → 异动告警（流量突增/新页面）",
        kpi: "竞品监控覆盖率100%，异动响应<24h",
      },
    ],
    output: "《增长诊断报告》+ ICE优先级排序表 + 90天OKR目标",
  },
  {
    id: "infrastructure",
    num: "02",
    title: "技术基础设施搭建",
    subtitle: "Technical Infrastructure",
    color: "#F59E0B",
    icon: "⚙️",
    summary: "修好管道再灌水。技术债是增长的隐形杀手。",
    modules: [
      {
        name: "数据追踪体系",
        details: [
          "统一事件追踪规范（命名规则/参数标准）",
          "全链路埋点方案（页面浏览/点击/表单/交易）",
          "UTM参数体系设计与自动生成器",
          "跨平台用户ID打通（匿名→注册→付费）",
          "数据质量监控（缺失/异常/重复检测）",
        ],
        automation: "埋点变更自动验证 → 数据异常实时告警",
        kpi: "核心事件追踪覆盖率 ≥ 95%",
      },
      {
        name: "网站技术优化",
        details: [
          "CDN配置与缓存策略优化",
          "图片/字体/JS/CSS资源压缩与懒加载",
          "服务端渲染(SSR)/静态生成(SSG)方案评估",
          "内部链接架构重建（主题簇模型）",
          "Schema结构化数据全站部署",
        ],
        automation: "CI/CD集成性能检测 → 部署前自动拦截性能回退",
        kpi: "LCP < 2.5s，CLS < 0.1，FID < 100ms",
      },
      {
        name: "MarTech工具栈搭建",
        details: [
          "CRM选型与配置（HubSpot/Salesforce/自建）",
          "邮件营销系统（ESP）接入",
          "营销自动化平台（MA）配置",
          "社媒管理工具矩阵",
          "A/B测试平台部署",
          "客服/在线聊天系统集成",
        ],
        automation: "工具间API互联 → 数据自动同步 → 单一用户视图",
        kpi: "工具集成率100%，数据同步延迟 < 5min",
      },
      {
        name: "自动化工作流引擎",
        details: [
          "选型（n8n/Make/Zapier/自建）",
          "核心场景workflow设计（见后续步骤）",
          "错误处理与重试机制",
          "日志与监控面板",
          "权限与安全策略",
        ],
        automation: "工作流健康监控 → 失败自动重试+告警",
        kpi: "自动化覆盖率 ≥ 70%关键流程",
      },
    ],
    output: "技术架构图 + MarTech工具栈清单 + 数据字典 + 自动化平台就绪",
  },
  {
    id: "acquisition",
    num: "03",
    title: "用户获取引擎",
    subtitle: "User Acquisition Engine",
    color: "#10B981",
    icon: "🎯",
    summary: "不是所有流量都值钱。精准获取>盲目扩量。",
    modules: [
      {
        name: "SEO自动化系统",
        details: [
          "关键词研究自动化（趋势监控+机会发现+难度评估）",
          "内容选题日历自动生成（搜索量×竞争度×商业意图）",
          "页面SEO检查清单自动化（标题/描述/H标签/内链/图片Alt）",
          "排名追踪与波动告警",
          "技术SEO持续监控（死链/重复内容/爬虫错误）",
        ],
        automation: "每周自动输出选题 → 发布后自动检查SEO → 排名异动告警",
        kpi: "自然搜索流量月环比增长 ≥ 10%",
      },
      {
        name: "内容生产流水线",
        details: [
          "内容模板库（按产品类型/内容形式/用户阶段）",
          "内容生产SOP（选题→大纲→初稿→审核→优化→发布）",
          "AI辅助写作 + 人工专家审核机制",
          "多格式复用（长文→短视频脚本→社媒帖→邮件→信息图）",
          "内容质量评分卡（原创性/深度/可读性/SEO/CTA）",
        ],
        automation: "选题自动分配 → 状态流转提醒 → 发布后自动分发",
        kpi: "内容发布频率达标率 ≥ 90%，质量评分 ≥ 7/10",
      },
      {
        name: "社媒矩阵运营",
        details: [
          "平台选择矩阵（目标用户在哪就去哪）",
          "内容适配引擎（同一主题不同平台不同形态）",
          "发布时间优化（按平台×时区×用户活跃度）",
          "互动管理自动化（评论回复/私信/UGC收集）",
          "KOL/KOC合作管理流程",
        ],
        automation: "一键多平台分发 → 互动聚合收件箱 → 效果数据回流",
        kpi: "社媒引流占比、互动率、粉丝增长率",
      },
      {
        name: "付费投放系统",
        details: [
          "渠道选择框架（搜索广告/社交广告/展示广告/信息流）",
          "受众定向策略（人口统计/兴趣/行为/再营销/Lookalike）",
          "创意素材AB测试矩阵",
          "出价策略自动化（目标CPA/ROAS自动调整）",
          "预算分配算法（跨渠道ROI最优化）",
        ],
        automation: "效果低于阈值自动暂停 → 预算自动向高ROI渠道倾斜",
        kpi: "CAC < LTV/3，ROAS ≥ 3:1",
      },
      {
        name: "外链与权威建设",
        details: [
          "可链接资产策略（工具/数据报告/模板/互动内容）",
          "外链prospect自动挖掘（行业博客/资源页/媒体列表）",
          "Outreach邮件序列（个性化模板+自动跟进）",
          "HARO/媒体引用机会监控",
          "品牌提及→链接转化追踪",
        ],
        automation: "自动发现prospect → 自动发送outreach → 跟进序列 → 结果追踪",
        kpi: "月新增外链数，引荐域名DA均值",
      },
    ],
    output: "获客渠道效率看板 + 内容日历 + 投放优化建议",
  },
  {
    id: "conversion",
    num: "04",
    title: "转化率优化系统",
    subtitle: "Conversion Rate Optimization",
    color: "#6366F1",
    icon: "🔄",
    summary: "流量贵，转化率提升1%可能=多赚百万。",
    modules: [
      {
        name: "落地页优化引擎",
        details: [
          "落地页模板库（按流量来源/用户意图/产品类型）",
          "Above-the-fold优化清单（标题/副标题/CTA/社会证明/视觉）",
          "页面速度×转化率关联分析",
          "表单优化（字段数/布局/渐进式表单/社交登录）",
          "信任元素配置（评价/案例/认证/保障/数据）",
        ],
        automation: "高跳出率页面自动标记 → 触发优化建议 → A/B测试排期",
        kpi: "核心落地页转化率月环比提升",
      },
      {
        name: "A/B测试体系",
        details: [
          "测试优先级框架（PIE模型：Potential×Importance×Ease）",
          "测试假设模板（因为[观察]，我们相信[改变]将导致[结果]）",
          "样本量计算与测试时长规划",
          "多变量测试(MVT)方案设计",
          "测试知识库（所有测试结果归档与学习）",
        ],
        automation: "自动计算统计显著性 → 达标自动通知 → 胜者自动上线",
        kpi: "月测试数量 ≥ 4，测试胜率 ≥ 30%",
      },
      {
        name: "Lead Capture系统",
        details: [
          "Lead Magnet矩阵（按漏斗阶段：白皮书/工具/试用/咨询）",
          "弹窗/嵌入表单触发规则（退出意图/滚动深度/停留时间/页面）",
          "渐进式信息收集（首次只要邮箱，后续逐步丰富画像）",
          "Lead评分模型（行为评分+属性评分→MQL/SQL判定）",
        ],
        automation: "行为触发弹窗 → 自动进入CRM → 自动评分 → 自动分配",
        kpi: "Lead获取成本，Lead→MQL转化率",
      },
      {
        name: "定价与套餐优化",
        details: [
          "定价页面布局优化（锚定效应/默认选中/对比呈现）",
          "价格敏感度测试方法（Van Westendorp/Gabor-Granger）",
          "免费试用vs免费增值策略选择框架",
          "升级路径设计（功能门控/用量门控/时间门控）",
        ],
        automation: "定价页转化率持续监控 → 异常波动告警",
        kpi: "定价页→付费转化率，ARPU",
      },
    ],
    output: "CRO实验看板 + 转化率趋势报告 + 测试知识库",
  },
  {
    id: "nurture",
    num: "05",
    title: "用户培育与激活",
    subtitle: "Lead Nurture & Activation",
    color: "#EC4899",
    icon: "🌱",
    summary: "95%的访客不会第一次就买。培育=用时间换信任。",
    modules: [
      {
        name: "邮件自动化序列",
        details: [
          "欢迎序列（5-7封，建立关系+产品教育+首次转化）",
          "培育序列（按用户阶段：认知→考虑→决策，匹配不同内容）",
          "再激活序列（沉睡用户唤醒：7天/30天/90天未活跃）",
          "事件触发邮件（注册/浏览产品/加购未付/试用即将到期）",
          "邮件个性化引擎（动态内容块/推荐引擎/发送时间优化）",
        ],
        automation: "行为触发 → 自动进入对应序列 → 效果数据回流优化",
        kpi: "邮件打开率 ≥ 25%，点击率 ≥ 3%，序列转化率",
      },
      {
        name: "产品内引导(Onboarding)",
        details: [
          "Aha Moment定义与追踪（用户激活的关键行为）",
          "新用户引导流程设计（渐进式引导/Checklist/空状态设计）",
          "产品内消息系统（Tooltip/Banner/Modal触发规则）",
          "功能采用率追踪与推动策略",
          "用户分群引导（按角色/目标/行业差异化）",
        ],
        automation: "未完成关键步骤 → 自动触发引导 → 多渠道提醒",
        kpi: "激活率（完成Aha Moment的用户比例），Time-to-Value",
      },
      {
        name: "多渠道触达编排",
        details: [
          "渠道优先级矩阵（邮件/推送/短信/站内信/社媒私信）",
          "跨渠道频率控制（防止过度打扰）",
          "渠道偏好学习（用户更常打开哪个渠道就优先用哪个）",
          "消息编排引擎（同一目标不同渠道的时序安排）",
        ],
        automation: "智能渠道选择 → 频率自动限制 → 效果自动对比优化",
        kpi: "触达率，消息疲劳度指标（退订率<0.5%）",
      },
    ],
    output: "用户旅程地图 + 自动化序列蓝图 + 激活率仪表盘",
  },
  {
    id: "retention",
    num: "06",
    title: "留存与扩展收入",
    subtitle: "Retention & Revenue Expansion",
    color: "#8B5CF6",
    icon: "💎",
    summary: "留住1个老用户的成本=获取1个新用户的1/5。",
    modules: [
      {
        name: "流失预警系统",
        details: [
          "流失预测模型（活跃度下降/功能使用减少/支付失败/工单增加）",
          "健康评分体系（综合活跃/采用/满意度的动态评分）",
          "预警分级（黄色预警→橙色预警→红色预警→流失）",
          "挽留策略库（按流失原因匹配：功能不满/价格敏感/竞品切换）",
        ],
        automation: "健康评分自动计算 → 低分自动触发挽留 → 分配给CSM",
        kpi: "月流失率 < 5%，挽留成功率 ≥ 20%",
      },
      {
        name: "用户满意度追踪",
        details: [
          "NPS自动调研（关键节点触发：购买后/使用X天后/续费前）",
          "CSAT即时反馈收集（每次交互后）",
          "CES(客户费力度)评估",
          "评价/评论管理与回复自动化",
          "Voice of Customer分析（评论/工单/社媒提及的主题聚类）",
        ],
        automation: "定时自动发送调研 → 低分自动告警 → 好评自动引导分享",
        kpi: "NPS ≥ 40，CSAT ≥ 4.2/5",
      },
      {
        name: "Upsell/Cross-sell引擎",
        details: [
          "升级时机识别（用量接近上限/高频使用高级功能/团队扩张信号）",
          "推荐算法（基于相似用户的购买路径）",
          "升级offer个性化（按用户价值/使用模式定制）",
          "年付转化策略（月付→年付的激励设计）",
        ],
        automation: "信号检测 → 自动推送升级offer → 效果追踪",
        kpi: "Net Revenue Retention ≥ 110%，Expansion MRR占比",
      },
      {
        name: "社区与忠诚度",
        details: [
          "用户社区运营（论坛/Discord/微信群/知识库）",
          "忠诚度计划设计（积分/等级/特权/推荐奖励）",
          "用户故事/案例收集自动化",
          "品牌大使计划",
        ],
        automation: "社区关键帖自动同步 → 活跃用户自动标记 → 大使自动邀请",
        kpi: "社区活跃率，用户生成内容(UGC)数量",
      },
    ],
    output: "留存健康仪表盘 + 流失预警清单 + 扩展收入Pipeline",
  },
  {
    id: "referral",
    num: "07",
    title: "裂变增长引擎",
    subtitle: "Referral & Viral Growth",
    color: "#F97316",
    icon: "🚀",
    summary: "让用户帮你获客，CAC趋近于0的终极武器。",
    modules: [
      {
        name: "推荐系统设计",
        details: [
          "推荐激励模型选择（双边奖励/单边/阶梯/里程碑）",
          "奖励类型设计（现金/折扣/功能/积分/实物）",
          "推荐链路简化（一键生成链接/二维码/社交分享）",
          "防刷机制（设备指纹/IP限制/行为异常检测）",
        ],
        automation: "推荐自动追踪 → 奖励自动发放 → 效果自动统计",
        kpi: "推荐率（K-Factor），推荐用户LTV vs 自然用户LTV",
      },
      {
        name: "病毒式增长机制",
        details: [
          "产品内病毒loop设计（使用即传播：协作/分享/展示）",
          "社交货币创造（可炫耀的成就/报告/排名）",
          "内容裂变策略（测试/挑战/模板/工具）",
          "邀请码/等待列表的稀缺性营销",
        ],
        automation: "传播路径自动追踪 → 裂变系数实时计算",
        kpi: "Viral Coefficient ≥ 0.5，Viral Cycle Time",
      },
      {
        name: "合作伙伴生态",
        details: [
          "联盟营销（Affiliate）系统搭建",
          "API/集成伙伴计划",
          "联合营销（Co-marketing）项目管理",
          "渠道合作伙伴（Reseller/Agency）体系",
        ],
        automation: "伙伴自助注册 → 业绩自动追踪 → 佣金自动结算",
        kpi: "合作伙伴贡献收入占比，活跃伙伴数",
      },
    ],
    output: "裂变增长飞轮图 + 推荐计划ROI分析 + 伙伴管理看板",
  },
  {
    id: "analytics",
    num: "08",
    title: "数据闭环与持续优化",
    subtitle: "Analytics & Continuous Optimization",
    color: "#0EA5E9",
    icon: "📊",
    summary: "没有度量就没有管理。数据是增长的指南针。",
    modules: [
      {
        name: "北极星指标体系",
        details: [
          "北极星指标定义（产品核心价值的量化表达）",
          "指标树拆解（北极星→一级驱动因子→二级可操作指标）",
          "团队OKR与指标对齐",
          "指标仪表盘设计（实时看板/周报/月报/季度review）",
        ],
        automation: "指标自动采集 → 仪表盘实时更新 → 异常自动告警",
        kpi: "北极星指标月环比增长",
      },
      {
        name: "归因分析系统",
        details: [
          "多触点归因模型选择（首次/末次/线性/时间衰减/数据驱动）",
          "跨渠道归因实现（UTM+Cookie+指纹+统一ID）",
          "ROI精确计算（渠道/活动/内容维度）",
          "归因窗口优化（不同产品周期不同窗口）",
        ],
        automation: "归因数据自动计算 → 渠道ROI排名自动更新",
        kpi: "归因覆盖率 ≥ 85%",
      },
      {
        name: "实验驱动文化",
        details: [
          "增长实验流程标准化（假设→设计→执行→分析→学习）",
          "实验速度指标（周实验数量）",
          "实验知识管理（成功模式复用/失败教训归档）",
          "实验资源分配（70%验证型+20%优化型+10%探索型）",
        ],
        automation: "实验Pipeline管理 → 结果自动归档 → 学习自动同步",
        kpi: "周实验数量 ≥ 2，累计实验胜率",
      },
      {
        name: "AI智能优化层",
        details: [
          "预测分析（流量预测/流失预测/收入预测）",
          "个性化推荐（内容/产品/时机/渠道）",
          "异常检测（流量骤变/转化率异常/机器人流量）",
          "自然语言洞察（对数据趋势的自动解读与建议）",
        ],
        automation: "AI持续学习 → 自动输出优化建议 → 人工审核后执行",
        kpi: "AI建议采纳率，AI辅助决策的效果增幅",
      },
    ],
    output: "增长仪表盘 + 周度增长简报 + 季度增长复盘报告",
  },
];

function PhaseCard({ phase, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 18px",
        borderLeft: `3px solid ${isActive ? phase.color : "transparent"}`,
        background: isActive ? `${phase.color}10` : "transparent",
        cursor: "pointer",
        transition: "all 0.2s",
        borderRadius: "0 8px 8px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{phase.icon}</span>
        <div>
          <div
            style={{
              fontSize: 11,
              color: phase.color,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            PHASE {phase.num}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#1a1a1a" : "#666",
            }}
          >
            {phase.title}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleDetail({ mod, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 10,
        marginBottom: 12,
        overflow: "hidden",
        transition: "all 0.2s",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "14px 18px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: open ? `${color}08` : "#fff",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>{mod.name}</span>
        <span
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
            color: "#999",
            fontSize: 12,
          }}
        >
          ▼
        </span>
      </div>
      {open && (
        <div style={{ padding: "0 18px 16px" }}>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#999",
                letterSpacing: 1,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              核心要点
            </div>
            {mod.details.map((d, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 0",
                  fontSize: 13.5,
                  color: "#444",
                  display: "flex",
                  gap: 8,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color, flexShrink: 0, marginTop: 2 }}>●</span>
                {d}
              </div>
            ))}
          </div>
          <div
            style={{
              background: `${color}0D`,
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color,
                marginBottom: 4,
              }}
            >
              ⚡ 自动化关键
            </div>
            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>
              {mod.automation}
            </div>
          </div>
          <div
            style={{
              background: "#f8f8f8",
              borderRadius: 8,
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#888",
                marginBottom: 4,
              }}
            >
              📏 核心KPI
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#333",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {mod.kpi}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketingGrowthFramework() {
  const [activePhase, setActivePhase] = useState(0);
  const phase = PHASES[activePhase];

  return (
    <div
      style={{
        fontFamily:
          "'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "100vh",
        background: "#FAFAFA",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;900&family=JetBrains+Mono:wght@500;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "24px 32px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#999",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 6,
          }}
        >
          UNIVERSAL GROWTH AUTOMATION FRAMEWORK
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: 0 }}>
          通用营销增长自动化工作流
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#777",
            margin: "6px 0 0",
            lineHeight: 1.6,
          }}
        >
          适用于任何产品类型 · 8大阶段 · 30+模块 · 150+细节要点 ·
          完整自动化方案与KPI体系
        </p>
      </div>

      {/* Body */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 110px)" }}>
        {/* Sidebar */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: "1px solid #eee",
            background: "#fff",
            paddingTop: 12,
            overflowY: "auto",
          }}
        >
          {PHASES.map((p, i) => (
            <PhaseCard
              key={p.id}
              phase={p}
              isActive={i === activePhase}
              onClick={() => setActivePhase(i)}
            />
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
          {/* Phase Header */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "inline-block",
                background: phase.color,
                color: "#fff",
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 10,
              }}
            >
              PHASE {phase.num}
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: "4px 0",
                color: "#111",
              }}
            >
              {phase.icon} {phase.title}
            </h2>
            <div
              style={{
                fontSize: 13,
                color: "#888",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {phase.subtitle}
            </div>
            <p
              style={{
                fontSize: 15,
                color: "#555",
                margin: "10px 0 0",
                lineHeight: 1.6,
                borderLeft: `3px solid ${phase.color}`,
                paddingLeft: 14,
                fontStyle: "italic",
              }}
            >
              {phase.summary}
            </p>
          </div>

          {/* Modules */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: "#999",
              marginBottom: 12,
            }}
          >
            模块详解 — {phase.modules.length}个子模块（点击展开）
          </div>
          {phase.modules.map((mod, i) => (
            <ModuleDetail key={i} mod={mod} color={phase.color} />
          ))}

          {/* Phase Output */}
          <div
            style={{
              background: `linear-gradient(135deg, ${phase.color}12, ${phase.color}05)`,
              border: `1px solid ${phase.color}30`,
              borderRadius: 10,
              padding: "16px 20px",
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: phase.color,
                marginBottom: 6,
              }}
            >
              📦 本阶段交付物
            </div>
            <div style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
              {phase.output}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
