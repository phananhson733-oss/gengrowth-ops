import { useState } from "react";

const models = [
  // OpenAI
  { provider: "OpenAI", name: "GPT-5.4", input: 2.50, output: 15.00, cached: 0.25, context: "200K", tier: "旗舰", badge: "🔥" },
  { provider: "OpenAI", name: "GPT-5.4 Pro", input: 21.00, output: 168.00, cached: null, context: "200K", tier: "超级推理", badge: "💎" },
  { provider: "OpenAI", name: "GPT-5.2", input: 1.75, output: 14.00, cached: 0.175, context: "200K", tier: "旗舰", badge: "" },
  { provider: "OpenAI", name: "GPT-5 Mini", input: 0.25, output: 2.00, cached: 0.025, context: "128K", tier: "轻量", badge: "💰" },
  { provider: "OpenAI", name: "GPT-5 Nano", input: 0.05, output: 0.40, cached: 0.005, context: "128K", tier: "超轻量", badge: "💰" },
  { provider: "OpenAI", name: "o3", input: 2.00, output: 8.00, cached: null, context: "200K", tier: "推理", badge: "🧠" },
  { provider: "OpenAI", name: "o3 Mini", input: 1.10, output: 4.40, cached: null, context: "200K", tier: "推理轻量", badge: "" },
  // Claude
  { provider: "Anthropic", name: "Claude Opus 4.6", input: 5.00, output: 25.00, cached: 0.50, context: "1M", tier: "旗舰", badge: "🔥" },
  { provider: "Anthropic", name: "Claude Sonnet 4.6", input: 3.00, output: 15.00, cached: 0.30, context: "1M", tier: "均衡", badge: "⭐" },
  { provider: "Anthropic", name: "Claude Haiku 4.5", input: 1.00, output: 5.00, cached: 0.10, context: "200K", tier: "轻量", badge: "💰" },
  // Gemini
  { provider: "Google", name: "Gemini 3.1 Pro", input: 2.00, output: 12.00, cached: 0.50, context: "1M", tier: "旗舰", badge: "🔥" },
  { provider: "Google", name: "Gemini 3 Flash", input: 0.50, output: 3.00, cached: null, context: "1M", tier: "均衡", badge: "" },
  { provider: "Google", name: "Gemini 2.5 Pro", input: 1.25, output: 10.00, cached: 0.3125, context: "1M", tier: "旗舰(上代)", badge: "" },
  { provider: "Google", name: "Gemini 2.5 Flash", input: 0.15, output: 0.60, cached: 0.0375, context: "1M", tier: "轻量", badge: "💰" },
  { provider: "Google", name: "Gemini 2.5 Flash-Lite", input: 0.075, output: 0.30, cached: null, context: "1M", tier: "超轻量", badge: "💰" },
  // DeepSeek
  { provider: "DeepSeek", name: "DeepSeek V4", input: 0.30, output: 0.50, cached: 0.03, context: "1M", tier: "旗舰", badge: "🔥" },
  { provider: "DeepSeek", name: "DeepSeek V3.2 Chat", input: 0.28, output: 0.42, cached: 0.028, context: "128K", tier: "均衡", badge: "💰" },
  { provider: "DeepSeek", name: "DeepSeek V3.2 Reasoner", input: 0.28, output: 0.42, cached: 0.028, context: "128K", tier: "推理", badge: "🧠" },
  // Qwen
  { provider: "Qwen(千问)", name: "Qwen3-Max", input: 0.35, output: 1.40, cached: null, context: "128K", tier: "旗舰", badge: "" },
  { provider: "Qwen(千问)", name: "Qwen3.5-Plus", input: 0.26, output: 1.56, cached: null, context: "1M", tier: "均衡", badge: "" },
  { provider: "Qwen(千问)", name: "Qwen3-Flash", input: 0.01, output: 0.05, cached: null, context: "128K", tier: "轻量", badge: "💰" },
];

const providerProsCons = {
  "OpenAI": {
    color: "#10a37f",
    pros: [
      "生态最成熟，SDK/插件/社区资源最丰富",
      "Function Calling 和 Tool Use 能力业界领先",
      "Web Search 内置工具，SEO 数据抓取便利",
      "GPT-5 Mini/Nano 性价比极高，适合大批量 Agent 调用",
      "Batch API 50% 折扣适合异步 SEO 批量任务",
    ],
    cons: [
      "旗舰模型价格偏高（GPT-5.4 Pro 极贵）",
      "中文能力略逊于国产模型",
      "输出 token 价格是输入的 6-8 倍",
      "Rate limit 对高频 Agent 场景可能有瓶颈",
    ],
    seoScore: 9,
    agentScore: 9.5,
    costScore: 6,
  },
  "Anthropic": {
    color: "#d97706",
    pros: [
      "指令遵循能力极强，Agent 可靠性高",
      "1M 上下文窗口（Sonnet/Opus），适合长文档 SEO 分析",
      "Extended Thinking 深度推理，适合复杂 SEO 策略规划",
      "Prompt Caching 可节省 90% 成本",
      "代码生成与重构能力顶级",
    ],
    cons: [
      "Opus 价格较高（$5/$25）",
      "中文能力弱于国产模型",
      "Web Search 不如 OpenAI 原生集成",
      "不支持图像生成",
    ],
    seoScore: 8,
    agentScore: 9,
    costScore: 5,
  },
  "Google": {
    color: "#4285f4",
    pros: [
      "全系 1M 上下文窗口，长文档处理无忧",
      "Grounding with Google Search 直连搜索引擎数据",
      "Free Tier 极其慷慨，适合开发测试",
      "Flash 系列性价比极高",
      "多模态能力(文本/图像/音频/视频)最全面",
    ],
    cons: [
      "Agent / Function Calling 成熟度不如 OpenAI",
      "API 稳定性偶有波动，2026.4 起强制账单上限",
      "Pro 超 200K token 后价格翻倍",
      "中文表现中等",
    ],
    seoScore: 8.5,
    agentScore: 7.5,
    costScore: 8,
  },
  "DeepSeek": {
    color: "#7c3aed",
    pros: [
      "价格碾压全场：V4 仅 $0.30/$0.50",
      "V4 SWE-bench 81%，接近 GPT-5 水平",
      "OpenAI 兼容 API，迁移零成本",
      "自动上下文缓存 90% 折扣",
      "Reasoner 模式免费无额外费用",
    ],
    cons: [
      "服务器在中国，海外延迟/稳定性不佳",
      "高峰期可能限流",
      "Agent Tool Use 能力弱于 OpenAI/Claude",
      "英文 SEO 内容生成质量不如 GPT/Claude",
      "数据隐私合规可能有顾虑",
    ],
    seoScore: 6,
    agentScore: 6,
    costScore: 10,
  },
  "Qwen(千问)": {
    color: "#ef4444",
    pros: [
      "中文 SEO 内容生成质量最佳",
      "开源模型可自托管，无 API 费用",
      "Qwen3-Flash 极致便宜 $0.01/$0.05",
      "阿里云生态完善，国内部署方便",
      "支持多模态（文本/图片/视频输入）",
    ],
    cons: [
      "英文能力不如 GPT/Claude/Gemini",
      "Agent/Function Calling 生态不成熟",
      "国际 API 可用性不如主流厂商",
      "社区和第三方工具生态较弱",
      "复杂推理能力与旗舰模型有差距",
    ],
    seoScore: 7,
    agentScore: 5,
    costScore: 9,
  },
};

const seoRecommendations = [
  {
    scenario: "内容生成 Agent",
    desc: "批量生成 SEO 优化文章/描述/标题",
    primary: "GPT-5 Mini",
    fallback: "Claude Sonnet 4.6",
    reason: "GPT-5 Mini 成本极低且质量够用；需要高质量长文用 Sonnet",
  },
  {
    scenario: "关键词研究 Agent",
    desc: "分析搜索意图、长尾词挖掘、竞品关键词",
    primary: "Gemini 2.5 Flash",
    fallback: "DeepSeek V4",
    reason: "Gemini 可直连 Google Search 获取实时数据；DeepSeek 性价比极高",
  },
  {
    scenario: "技术 SEO 审计 Agent",
    desc: "爬取页面、分析结构化数据、检查 meta 标签",
    primary: "Claude Sonnet 4.6",
    fallback: "GPT-5.2",
    reason: "Claude 长上下文+代码能力最强，适合分析大型网页代码",
  },
  {
    scenario: "多语言 SEO Agent",
    desc: "多语言内容本地化、翻译和优化",
    primary: "GPT-5.2",
    fallback: "Qwen3-Max(中文)",
    reason: "GPT 多语言最全面；中文市场用千问更自然",
  },
  {
    scenario: "SEO 数据分析 Agent",
    desc: "分析 GA/GSC 数据、生成报告、趋势预测",
    primary: "Gemini 3.1 Pro",
    fallback: "Claude Opus 4.6",
    reason: "Gemini 与 Google 生态无缝集成；Opus 推理最强",
  },
  {
    scenario: "大批量低成本 Agent",
    desc: "meta description 批量生成、标题优化、分类标注",
    primary: "DeepSeek V4",
    fallback: "GPT-5 Nano",
    reason: "成本最低方案，适合每天数万次调用",
  },
];

export default function App() {
  const [activeProvider, setActiveProvider] = useState("all");
  const [sortBy, setSortBy] = useState("input");
  const [activeTab, setActiveTab] = useState("pricing");

  const providers = ["all", "OpenAI", "Anthropic", "Google", "DeepSeek", "Qwen(千问)"];

  const filtered = activeProvider === "all" ? models : models.filter(m => m.provider === activeProvider);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "input") return a.input - b.input;
    if (sortBy === "output") return a.output - b.output;
    if (sortBy === "provider") return a.provider.localeCompare(b.provider);
    return 0;
  });

  const getProviderColor = (p) => providerProsCons[p]?.color || "#666";

  const maxInput = Math.max(...models.map(m => m.input));
  const maxOutput = Math.max(...models.map(m => m.output));

  // Calculate cost for a typical SEO agent workflow
  const calcMonthlyCost = (m, calls = 10000, inputTokens = 2000, outputTokens = 500) => {
    const inputCost = (calls * inputTokens / 1000000) * m.input;
    const outputCost = (calls * outputTokens / 1000000) * m.output;
    return (inputCost + outputCost).toFixed(2);
  };

  return (
    <div style={{
      fontFamily: "'Instrument Sans', 'Noto Sans SC', system-ui, sans-serif",
      background: "#0a0a0f",
      color: "#e4e4e7",
      minHeight: "100vh",
      padding: "0",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1025 50%, #0f1a1a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: "#7c7c8a", textTransform: "uppercase", marginBottom: 8 }}>
            2026 Q1 · AI Model Pricing Intelligence
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 6px",
            background: "linear-gradient(90deg, #e4e4e7, #a1a1aa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            LLM 模型定价对比 · SEO Agent 选型指南
          </h1>
          <p style={{ color: "#71717a", fontSize: 13, margin: 0 }}>
            覆盖 OpenAI · Anthropic · Google · DeepSeek · Qwen — 全部价格单位: USD / 百万 Tokens
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 48px" }}>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 0,
          marginTop: 24,
          marginBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          {[
            { key: "pricing", label: "💰 定价对比" },
            { key: "analysis", label: "📊 优劣势分析" },
            { key: "recommend", label: "🎯 SEO Agent 推荐" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "12px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              background: "transparent",
              color: activeTab === tab.key ? "#e4e4e7" : "#52525b",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #a78bfa" : "2px solid transparent",
              transition: "all 0.2s",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Pricing */}
        {activeTab === "pricing" && (
          <>
            {/* Filters */}
            <div style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
              alignItems: "center",
            }}>
              <span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, letterSpacing: 1, marginRight: 4 }}>厂商</span>
              {providers.map(p => (
                <button key={p} onClick={() => setActiveProvider(p)} style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 6,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: activeProvider === p ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)",
                  background: activeProvider === p ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.03)",
                  color: activeProvider === p ? "#c4b5fd" : "#a1a1aa",
                  transition: "all 0.15s",
                }}>
                  {p === "all" ? "全部" : p}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, letterSpacing: 1, marginRight: 4 }}>排序</span>
              {[
                { key: "input", label: "输入价" },
                { key: "output", label: "输出价" },
                { key: "provider", label: "厂商" },
              ].map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 5,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: sortBy === s.key ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.06)",
                  background: sortBy === s.key ? "rgba(167,139,250,0.1)" : "transparent",
                  color: sortBy === s.key ? "#c4b5fd" : "#71717a",
                }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(160px,1.5fr) 100px 100px 80px 80px 100px 100px",
                padding: "10px 16px",
                fontSize: 10,
                fontWeight: 700,
                color: "#52525b",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}>
                <div>模型</div>
                <div>输入$/1M</div>
                <div>输出$/1M</div>
                <div>缓存$/1M</div>
                <div>上下文</div>
                <div>类型</div>
                <div style={{ textAlign: "right" }}>月估算*</div>
              </div>
              {sorted.map((m, i) => (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(160px,1.5fr) 100px 100px 80px 80px 100px 100px",
                  padding: "10px 16px",
                  fontSize: 13,
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  transition: "background 0.15s",
                  alignItems: "center",
                  cursor: "default",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 3,
                      height: 20,
                      borderRadius: 2,
                      background: getProviderColor(m.provider),
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.badge} {m.name}</div>
                      <div style={{ fontSize: 10, color: "#52525b" }}>{m.provider}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 13 }}>
                    <span style={{ color: m.input <= 0.3 ? "#4ade80" : m.input <= 1.5 ? "#fbbf24" : m.input <= 5 ? "#fb923c" : "#f87171" }}>
                      ${m.input.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: 13 }}>
                    <span style={{ color: m.output <= 1 ? "#4ade80" : m.output <= 5 ? "#fbbf24" : m.output <= 15 ? "#fb923c" : "#f87171" }}>
                      ${m.output.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#71717a" }}>
                    {m.cached != null ? `$${m.cached}` : "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#a1a1aa" }}>{m.context}</div>
                  <div>
                    <span style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: m.tier === "旗舰" ? "rgba(239,68,68,0.1)" : m.tier === "均衡" ? "rgba(59,130,246,0.1)" : m.tier === "推理" ? "rgba(168,85,247,0.1)" : "rgba(34,197,94,0.1)",
                      color: m.tier === "旗舰" ? "#fca5a5" : m.tier === "均衡" ? "#93c5fd" : m.tier === "推理" ? "#c4b5fd" : "#86efac",
                      fontWeight: 600,
                    }}>
                      {m.tier}
                    </span>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#a1a1aa" }}>
                    ${calcMonthlyCost(m)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#3f3f46", marginTop: 8, textAlign: "right" }}>
              * 月估算基于: 10,000 次调用 × 2K 输入 + 500 输出 tokens/次
            </div>
          </>
        )}

        {/* TAB 2: Analysis */}
        {activeTab === "analysis" && (
          <div style={{ display: "grid", gap: 16 }}>
            {Object.entries(providerProsCons).map(([name, data]) => (
              <div key={name} style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "16px 20px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 4,
                      height: 28,
                      borderRadius: 2,
                      background: data.color,
                    }} />
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                    {[
                      { label: "SEO适配", score: data.seoScore },
                      { label: "Agent能力", score: data.agentScore },
                      { label: "性价比", score: data.costScore },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center" }}>
                        <div style={{ color: "#52525b", marginBottom: 2 }}>{s.label}</div>
                        <div style={{
                          fontFamily: "'JetBrains Mono'",
                          fontWeight: 700,
                          fontSize: 16,
                          color: s.score >= 9 ? "#4ade80" : s.score >= 7 ? "#fbbf24" : s.score >= 5 ? "#fb923c" : "#f87171",
                        }}>
                          {s.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>
                      ✦ 优势
                    </div>
                    {data.pros.map((p, i) => (
                      <div key={i} style={{
                        fontSize: 12,
                        color: "#a1a1aa",
                        padding: "4px 0",
                        lineHeight: 1.6,
                        borderBottom: i < data.pros.length - 1 ? "1px solid rgba(255,255,255,0.02)" : "none",
                      }}>
                        <span style={{ color: "#4ade80", marginRight: 6 }}>+</span>{p}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>
                      ✦ 劣势
                    </div>
                    {data.cons.map((c, i) => (
                      <div key={i} style={{
                        fontSize: 12,
                        color: "#a1a1aa",
                        padding: "4px 0",
                        lineHeight: 1.6,
                        borderBottom: i < data.cons.length - 1 ? "1px solid rgba(255,255,255,0.02)" : "none",
                      }}>
                        <span style={{ color: "#f87171", marginRight: 6 }}>−</span>{c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: Recommendations */}
        {activeTab === "recommend" && (
          <>
            <div style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(59,130,246,0.05))",
              borderRadius: 12,
              border: "1px solid rgba(167,139,250,0.15)",
              padding: "20px 24px",
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                🏗️ SEO 多架构 Agent 选型建议
              </div>
              <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.8 }}>
                针对 SEO Agent 场景，建议采用<span style={{ color: "#c4b5fd", fontWeight: 600 }}>「分层路由」</span>策略：
                不同子任务路由到不同模型。简单任务(meta 生成/分类)用廉价模型，复杂任务(策略分析/内容创作)用旗舰模型。
                这样可以在保证质量的同时，将整体成本降低 60-80%。
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {seoRecommendations.map((r, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "16px 20px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{r.scenario}</div>
                      <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{r.desc}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "rgba(74,222,128,0.1)",
                        color: "#4ade80",
                        border: "1px solid rgba(74,222,128,0.15)",
                      }}>
                        首选: {r.primary}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "rgba(251,191,36,0.08)",
                        color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.12)",
                      }}>
                        备选: {r.fallback}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.6 }}>
                    <span style={{ color: "#71717a" }}>推荐理由：</span>{r.reason}
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture Suggestion */}
            <div style={{
              marginTop: 24,
              background: "rgba(255,255,255,0.02)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "20px 24px",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📐 推荐架构概览</div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}>
                {[
                  { tier: "Tier 1 · 批量层", model: "DeepSeek V4 / GPT-5 Nano", tasks: "meta生成、标签分类、URL分析", cost: "~$2-5/月", bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.12)", color: "#4ade80" },
                  { tier: "Tier 2 · 核心层", model: "GPT-5 Mini / Gemini 2.5 Flash", tasks: "内容生成、关键词研究、数据提取", cost: "~$20-50/月", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.12)", color: "#60a5fa" },
                  { tier: "Tier 3 · 决策层", model: "Claude Sonnet 4.6 / GPT-5.2", tasks: "策略规划、竞品分析、技术审计", cost: "~$50-100/月", bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.12)", color: "#c084fc" },
                ].map((t, i) => (
                  <div key={i} style={{
                    background: t.bg,
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    padding: "16px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: 0.5, marginBottom: 8 }}>
                      {t.tier}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t.model}</div>
                    <div style={{ fontSize: 11, color: "#71717a", lineHeight: 1.6, marginBottom: 8 }}>{t.tasks}</div>
                    <div style={{
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono'",
                      fontWeight: 600,
                      color: t.color,
                    }}>
                      {t.cost}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#52525b", marginTop: 12, lineHeight: 1.6 }}>
                总月度成本预估: $70-155/月（基于 10,000 次 Agent 调用） · 相比全部使用旗舰模型可节省约 70%
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
